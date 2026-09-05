const router = require('express').Router();
const axios = require('axios');

// Fetch live featured & top games directly from Steam's public store endpoint
router.get('/homepage', async (req, res) => {
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
            return res.json({ success: true, data: liveGames });
        }
        res.status(400).json({ success: false, message: 'Could not parse Steam featured data' });
    } catch (error) {
        console.error('Steam API Fetch Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch live games from Steam' });
    }
});

// Fetch general games catalog/search from Steam
router.get('/games', async (req, res) => {
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
            return res.json({ success: true, data: formattedGames });
        }
        res.status(404).json({ success: false, message: 'No games found' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Steam API error' });
    }
});

// ─── Full game details by Steam App ID ────────────────────────────────────────
router.get('/app/:appId', async (req, res) => {
    const { appId } = req.params;
    try {
        const steamRes = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`,
            { timeout: 10000 }
        );
        const appData = steamRes.data[appId];
        if (!appData || !appData.success) {
            return res.status(404).json({ success: false, message: 'Game not found on Steam' });
        }
        const d = appData.data;

        // Pick best available logo image (library_600x900 > header > capsule)
        const logoUrl =
            `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

        const data = {
            appId,
            title: d.name,
            developers: d.developers || [],
            publishers: d.publishers || [],
            genre: (d.genres || []).map(g => g.description),
            categories: (d.categories || []).map(c => c.description),
            description: d.detailed_description || d.about_the_game || d.short_description || '',
            shortDescription: d.short_description || '',
            thumbnail: d.header_image || '',
            logoUrl,
            backgroundImage: d.background_raw || d.background || '',
            screenshots: (d.screenshots || []).map(s => s.path_full),
            trailerUrl: d.movies && d.movies.length > 0
                ? (d.movies[0].mp4?.max || d.movies[0].mp4?.['480'] || '')
                : '',
            trailerThumbnail: d.movies && d.movies.length > 0 ? d.movies[0].thumbnail : '',
            isFree: d.is_free || false,
            price: d.price_overview ? d.price_overview.final / 100 : null,
            originalPrice: d.price_overview ? d.price_overview.initial / 100 : null,
            discountPercent: d.price_overview ? d.price_overview.discount_percent : 0,
            metacritic: d.metacritic || null,
            releaseDateText: d.release_date ? d.release_date.date : '',
            comingSoon: d.release_date ? d.release_date.coming_soon : false,
            totalAchievements: d.achievements ? d.achievements.total : 0,
            platform: [
                d.platforms?.windows && 'Windows',
                d.platforms?.mac && 'Mac',
                d.platforms?.linux && 'Linux',
            ].filter(Boolean),
            supportedLanguages: d.supported_languages || '',
            website: d.website || '',
            requiredAge: d.required_age || 0,
        };

        return res.json({ success: true, data });
    } catch (error) {
        console.error('Steam app detail error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch game from Steam' });
    }
});

// ─── Steam community reviews ──────────────────────────────────────────────────
router.get('/app/:appId/reviews', async (req, res) => {
    const { appId } = req.params;
    const { cursor } = req.query;
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

        const raw = reviewRes.data;
        const reviews = (raw.reviews || []).map(r => ({
            id: r.recommendationid,
            voted_up: r.voted_up,
            body: r.review,
            playtimeHours: Math.round((r.author?.playtime_forever || 0) / 60),
            votes_helpful: r.votes_helpful || 0,
            timestamp: r.timestamp_created,
        }));

        const summary = raw.query_summary || null;

        return res.json({ success: true, reviews, summary, cursor: raw.cursor });
    } catch (error) {
        console.error('Steam reviews error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// ─── Live concurrent player count ────────────────────────────────────────────
router.get('/app/:appId/players', async (req, res) => {
    const { appId } = req.params;
    try {
        const playerRes = await axios.get(
            `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
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