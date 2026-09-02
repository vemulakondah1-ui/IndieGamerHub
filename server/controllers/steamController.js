const {
  fetchSteamFeaturedCategories,
  fetchSteamAppDetails,
  fetchSteamReviews,
  fetchLivePlayerCount,
  verifySteamId,
  resolveVanityUrl,
  searchSteam,
  fetchSteamByGenre,
} = require('../services/steamApi');

// ─── Helper: empty featured categories fallback ────────────────────────────
const EMPTY_CATEGORIES = {
  specials: [],
  topSellers: [],
  newReleases: [],
  comingSoon: [],
};

// @desc  Get trending games (top sellers) from Steam
// @route GET /api/steam/trending
// @access Public
exports.getTrending = async (req, res) => {
  try {
    const data = await fetchSteamFeaturedCategories();
    res.json({ success: true, data: data.topSellers });
  } catch (err) {
    console.error('[Steam] getTrending error:', err.message);
    res.status(502).json({ success: false, message: 'Steam data temporarily unavailable', data: [] });
  }
};

// @desc  Get games currently on sale (specials) from Steam
// @route GET /api/steam/sales
// @access Public
exports.getSales = async (req, res) => {
  try {
    const data = await fetchSteamFeaturedCategories();
    const sales = data.specials.filter((g) => g.discountPercent > 0);
    res.json({ success: true, data: sales });
  } catch (err) {
    console.error('[Steam] getSales error:', err.message);
    res.status(502).json({ success: false, message: 'Steam data temporarily unavailable', data: [] });
  }
};

// @desc  Get upcoming games from Steam
// @route GET /api/steam/upcoming
// @access Public
exports.getUpcoming = async (req, res) => {
  try {
    const data = await fetchSteamFeaturedCategories();
    res.json({ success: true, data: data.comingSoon });
  } catch (err) {
    console.error('[Steam] getUpcoming error:', err.message);
    res.status(502).json({ success: false, message: 'Steam data temporarily unavailable', data: [] });
  }
};

// @desc  Get new releases from Steam
// @route GET /api/steam/new
// @access Public
exports.getNewReleases = async (req, res) => {
  try {
    const data = await fetchSteamFeaturedCategories();
    res.json({ success: true, data: data.newReleases });
  } catch (err) {
    console.error('[Steam] getNewReleases error:', err.message);
    res.status(502).json({ success: false, message: 'Steam data temporarily unavailable', data: [] });
  }
};

// @desc  Get full game details from Steam by appId
// @route GET /api/steam/app/:appId
// @access Public
exports.getApp = async (req, res) => {
  const { appId } = req.params;
  if (!appId || !/^\d+$/.test(appId)) {
    return res.status(400).json({ success: false, message: 'Invalid Steam App ID' });
  }

  try {
    const data = await fetchSteamAppDetails(appId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Steam] getApp error:', err.message);
    res.status(502).json({ success: false, message: err.message || 'Could not fetch game details' });
  }
};

// @desc  Get Steam community reviews for a game
// @route GET /api/steam/app/:appId/reviews
// @access Public
exports.getAppReviews = async (req, res) => {
  const { appId } = req.params;
  const { cursor } = req.query;

  if (!appId || !/^\d+$/.test(appId)) {
    return res.status(400).json({ success: false, message: 'Invalid Steam App ID' });
  }

  try {
    const data = await fetchSteamReviews(appId, cursor || '*');
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('[Steam] getAppReviews error:', err.message);
    res.status(502).json({ success: false, message: 'Could not fetch reviews', reviews: [], summary: null });
  }
};

// @desc  Get live player count for a game
// @route GET /api/steam/app/:appId/players
// @access Public
exports.getPlayerCount = async (req, res) => {
  const { appId } = req.params;
  try {
    const count = await fetchLivePlayerCount(appId);
    res.json({ success: true, data: { playerCount: count } });
  } catch (err) {
    console.error('[Steam] getPlayerCount error:', err.message);
    res.json({ success: true, data: { playerCount: 0 } });
  }
};

// @desc  Verify a Steam ID (numeric or vanity URL)
// @route POST /api/steam/verify
// @access Public
exports.verifySteam = async (req, res) => {
  const { steamId } = req.body;
  if (!steamId?.trim()) {
    return res.status(400).json({ success: false, message: 'Steam ID is required' });
  }

  let resolvedId = steamId.trim();

  try {
    // If it's not a 64-bit numeric Steam ID, try resolving it as a vanity URL
    if (!/^\d{17}$/.test(resolvedId)) {
      resolvedId = await resolveVanityUrl(resolvedId);
    }

    const profile = await verifySteamId(resolvedId);
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('[Steam] verifySteam error:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Could not verify Steam ID' });
  }
};

// @desc  Get all Steam categories at once (for homepage)
// @route GET /api/steam/homepage
// @access Public
exports.getHomepageData = async (req, res) => {
  try {
    const data = await fetchSteamFeaturedCategories();
    res.json({
      success: true,
      data: {
        trending: data.topSellers.slice(0, 12),
        sales: data.specials.filter((g) => g.discountPercent > 0).slice(0, 12),
        upcoming: data.comingSoon.slice(0, 8),
        newReleases: data.newReleases.slice(0, 8),
      },
    });
  } catch (err) {
    console.error('[Steam] getHomepageData error:', err.message);
    // Return empty arrays instead of crashing — the homepage will show a retry UI
    res.status(502).json({
      success: false,
      message: 'Steam data temporarily unavailable. Please try again shortly.',
      data: { trending: [], sales: [], upcoming: [], newReleases: [] },
    });
  }
};

// @desc  Search Steam store for games
// @route GET /api/steam/search?q=query
// @access Public
exports.searchGames = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
  try {
    const results = await searchSteam(q.trim());
    res.json({ success: true, data: results, total: results.length });
  } catch (err) {
    console.error('[Steam] searchGames error:', err.message);
    res.status(502).json({ success: false, message: 'Search temporarily unavailable', data: [], total: 0 });
  }
};

// @desc  Get Steam games by genre/category tag
// @route GET /api/steam/genre?tag=Action
// @access Public
exports.getByGenre = async (req, res) => {
  const { tag } = req.query;
  if (!tag?.trim()) {
    return res.status(400).json({ success: false, message: 'Genre tag is required' });
  }
  try {
    const results = await fetchSteamByGenre(tag.trim());
    res.json({ success: true, data: results, total: results.length });
  } catch (err) {
    console.error('[Steam] getByGenre error:', err.message);
    res.status(502).json({ success: false, message: 'Genre data temporarily unavailable', data: [], total: 0 });
  }
};
