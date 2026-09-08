// server/routes/admin.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Game = require('../models/Game');
const {
  adminGetGames, adminToggleFeatured, adminTogglePublished,
  adminGetUsers, adminUpdateUserRole, adminToggleUserStatus, adminGetStats,
} = require('../controllers/adminController');
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const blockSelfAction = require('../middleware/blockSelfAction');
// Public endpoint for featured games
router.get('/featured-games', async (req, res) => {
  try {
    const featured = await Game.find({ isFeatured: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: featured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protect all admin endpoints
router.use(protect, authorize('admin'));

// Existing management routes
router.get('/stats', adminGetStats);
router.get('/games', adminGetGames);
router.put('/games/:id/feature', adminToggleFeatured);
router.put('/games/:id/publish', adminTogglePublished);
router.get('/users', adminGetUsers);
router.put('/users/:id/role', blockSelfAction('You cannot change your own role'), adminUpdateUserRole);
router.put('/users/:id/status', blockSelfAction('You cannot deactivate your own account'), adminToggleUserStatus);

// FEATURE STEAM GAME: Searches Steam, extracts data, and marks isFeatured: true
router.post('/feature-steam-game', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Game title or Steam App ID is required' });
    }

    let appId = String(query).trim();

    // If query is a title, search Steam store to get the App ID
    if (isNaN(appId)) {
      const searchRes = await axios.get('https://store.steampowered.com/api/storesearch/', {
        params: { term: query, l: 'english', cc: 'US' },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 7000
      });

      const firstItem = searchRes.data?.items?.[0];
      if (!firstItem) {
        return res.status(404).json({ success: false, message: `No Steam game found matching "${query}"` });
      }
      appId = String(firstItem.id);
    }

    // Pull full details from Steam
    const detailsRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=US&l=english`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });

    const steamData = detailsRes.data?.[appId]?.data;
    if (!steamData) {
      return res.status(404).json({ success: false, message: 'Unable to retrieve Steam game details' });
    }

    // Price calculation
    let finalPrice = 0.00;
    if (!steamData.is_free && steamData.price_overview?.final) {
      finalPrice = Number((steamData.price_overview.final / 100).toFixed(2));
    }

    const genres = (steamData.genres || []).map(g => g.description);
    const screenshots = (steamData.screenshots || []).map(s => s.path_full).slice(0, 8);

    // Save or update in database as featured
    const updatedGame = await Game.findOneAndUpdate(
      { steamAppId: appId },
      {
        title: steamData.name,
        steamAppId: appId,
        description: steamData.detailed_description || steamData.short_description || '',
        shortDescription: steamData.short_description || '',
        developer: steamData.developers?.[0] || 'Studio Partner',
        publisher: steamData.publishers?.[0] || 'Studio Partner',
        price: finalPrice,
        isFree: steamData.is_free || false,
        genre: genres.length > 0 ? genres : ['Action'],
        thumbnail: steamData.header_image,
        screenshots: screenshots,
        isFeatured: true,
        isPublished: true,
        releaseDate: steamData.release_date?.date || new Date().toISOString().split('T')[0]
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: `Successfully added and featured "${updatedGame.title}"!`,
      game: updatedGame
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET list of currently featured games
module.exports = router;