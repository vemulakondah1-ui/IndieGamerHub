const router = require('express').Router();
const axios = require('axios');
const sanitizeHtml = require('../utils/sanitizeHtml');

// Steam's storefront endpoints are unauthenticated and undocumented, with no
// key-based way to raise their rate limit — caching is what keeps this app's
// call volume low enough to avoid Steam blocking the server's IP. Falling
// back to the last good response (instead of an error) also means a
// temporary Steam block degrades to stale data rather than a broken page.
// ponytail: in-memory Map, resets on every server restart/redeploy — move to
// Redis if this needs to survive restarts or run across multiple instances.
// Bounded FIFO eviction below because appId/cursor are attacker-controlled on
// a public route — without a cap, distinct cache keys grow this Map forever.
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map();

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return { fresh: null, stale: null };
    return { fresh: entry.expiresAt > Date.now() ? entry.data : null, stale: entry.data };
}

function setCached(key, data) {
    if (cache.size >= CACHE_MAX_ENTRIES && !cache.has(key)) {
        cache.delete(cache.keys().next().value);
    }
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Validates once for every :appId route below, instead of repeating the check per-handler — a malformed appId gets a clean 400 instead of being interpolated straight into the outbound Steam URL.
router.param('appId', (req, res, next, appId) => {
    if (!/^\d+$/.test(appId)) {
        return res.status(400).json({ success: false, message: 'appId must be numeric' });
    }
    next();
});

// Fetch live featured & top games directly from Steam's public store endpoint
router.get('/homepage', async (req, res) => {
    const { fresh, stale } = getCached('homepage');
    if (fresh) return res.json({ success: true, data: fresh });

    try {
        const response = await axios.get('https://store.steampowered.com/api/featured/');
        if (response.data && response.data.featured_win) {
            const liveGames = response.data.featured_win.map(game => ({
                _id: game.id.toString(),
                title: game.name,
                short_description: game.short_description || 'Explore this top title live from Steam.',
                price_overview: {
                    final_formatted: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : 'Free'
                },
                header_image: game.large_capsule_image || game.header_image
            }));
            setCached('homepage', liveGames);
            return res.json({ success: true, data: liveGames });
        }
        res.status(400).json({ success: false, message: 'Could not parse Steam featured data' });
    } catch (error) {
        console.error('Steam API Fetch Error:', error.message);
        if (stale) return res.json({ success: true, data: stale, stale: true });
        res.status(500).json({ success: false, message: 'Failed to fetch live games from Steam' });
    }
});

// Fetch general games catalog/search from Steam
router.get('/games', async (req, res) => {
    const { fresh, stale } = getCached('games');
    if (fresh) return res.json({ success: true, data: fresh });

    try {
        const response = await axios.get('https://store.steampowered.com/api/featured/');
        if (response.data) {
            const rawPool = [
                ...(response.data.featured_win || []),
                ...(response.data.coming_soon || [])
            ];
            const formattedGames = rawPool.map((game, index) => ({
                _id: (game.id || index).toString(),
                title: game.name,
                platform: 'Steam',
                genre: 'Action',
                short_description: game.short_description || 'Fetched live from Steam Store API.',
                price: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : '$14.99',
                thumbnail: game.large_capsule_image || game.header_image
            }));
            setCached('games', formattedGames);
            return res.json({ success: true, data: formattedGames });
        }
        res.status(404).json({ success: false, message: 'No games found' });
    } catch (error) {
        if (stale) return res.json({ success: true, data: stale, stale: true });
        res.status(500).json({ success: false, message: 'Steam API error' });
    }
});

// ─── Full game details by Steam App ID ────────────────────────────────────────
// Passes through Steam's raw appdetails response untouched: the frontend
// (SteamGamePage.jsx) already parses the raw `{ [appId]: { success, data } }`
// shape, so flattening/renaming fields here only produced data the frontend
// couldn't read, silently forcing every game page onto its fallback content.
router.get('/app/:appId', async (req, res) => {
    const { appId } = req.params;
    const { fresh, stale } = getCached(`app:${appId}`);
    if (fresh) return res.json({ success: true, data: fresh });

    try {
        const steamRes = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`,
            { timeout: 10000 }
        );
        const appData = steamRes.data[appId];
        if (!appData || !appData.success) {
            return res.status(404).json({ success: false, message: 'Game not found on Steam' });
        }

        // Steam's description fields are raw HTML; sanitize before caching so
        // nothing downstream renders unsanitized Steam markup by accident.
        if (appData.data) {
            ['about_the_game', 'detailed_description', 'short_description'].forEach((field) => {
                if (appData.data[field]) appData.data[field] = sanitizeHtml(appData.data[field]);
            });
        }

        setCached(`app:${appId}`, steamRes.data);
        return res.json({ success: true, data: steamRes.data });
    } catch (error) {
        console.error('Steam app detail error:', error.message);
        if (stale) return res.json({ success: true, data: stale, stale: true });
        return res.status(500).json({ success: false, message: 'Failed to fetch game from Steam' });
    }
});

// ─── Steam community reviews ──────────────────────────────────────────────────
// Passes through Steam's raw appreviews response (query_summary, reviews,
// cursor) for the same reason as /app/:appId above: the frontend already
// reads the raw field names directly.
router.get('/app/:appId/reviews', async (req, res) => {
    const { appId } = req.params;
    const { cursor } = req.query;
    const cacheKey = `reviews:${appId}:${cursor || ''}`;
    const { fresh, stale } = getCached(cacheKey);
    if (fresh) return res.json({ success: true, data: fresh });

    try {
        const params = {
            json: 1,
            language: 'english',
            review_type: 'all',
            purchase_type: 'all',
            num_per_page: 12,
            filter: 'recent',
        };
        if (cursor) params.cursor = cursor;

        const reviewRes = await axios.get(
            `https://store.steampowered.com/appreviews/${appId}`,
            { params, timeout: 10000 }
        );

        // Steam can return HTTP 200 with a semantically-failed body (e.g. a
        // throttled/delisted app), same as /app/:appId above — only cache and
        // serve a genuinely successful payload, so a bad-but-200 response
        // doesn't get cached as "fresh" for the full TTL.
        if (!reviewRes.data || !reviewRes.data.success) {
            if (stale) return res.json({ success: true, data: stale, stale: true });
            return res.status(404).json({ success: false, message: 'Reviews not found on Steam' });
        }

        // Review bodies are raw HTML/user text; sanitize before caching.
        (reviewRes.data.reviews || []).forEach((r) => {
            if (r.review) r.review = sanitizeHtml(r.review);
        });

        setCached(cacheKey, reviewRes.data);
        return res.json({ success: true, data: reviewRes.data });
    } catch (error) {
        console.error('Steam reviews error:', error.message);
        if (stale) return res.json({ success: true, data: stale, stale: true });
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// ─── Live concurrent player count ────────────────────────────────────────────
// Unlike the routes above, this hits Steam's official Web API, which does
// accept a registered key for a real (documented) rate-limit allowance —
// not cached, since a player count is only useful live.
router.get('/app/:appId/players', async (req, res) => {
    const { appId } = req.params;
    try {
        const keyParam = process.env.STEAM_API_KEY ? `&key=${process.env.STEAM_API_KEY}` : '';
        const playerRes = await axios.get(
            `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}${keyParam}`,
            { timeout: 8000 }
        );
        const count = playerRes.data?.response?.player_count ?? 0;
        return res.json({ success: true, data: { playerCount: count } });
    } catch (error) {
        console.error('Steam player count error:', error.message);
        return res.json({ success: true, data: { playerCount: 0 } });
    }
});

module.exports = router;
