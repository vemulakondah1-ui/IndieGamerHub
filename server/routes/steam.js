const express = require('express');
const router = express.Router();
const steamController = require('../controllers/steamController');

// Homepage data (all categories at once)
router.get('/homepage', steamController.getHomepageData);

// Search Steam store
router.get('/search', steamController.searchGames);

// Browse by genre tag
router.get('/genre', steamController.getByGenre);

// Trending = top sellers
router.get('/trending', steamController.getTrending);

// Sales / specials
router.get('/sales', steamController.getSales);

// Coming soon
router.get('/upcoming', steamController.getUpcoming);

// New releases
router.get('/new', steamController.getNewReleases);

// Full game details
router.get('/app/:appId', steamController.getApp);

// Community reviews for a game
router.get('/app/:appId/reviews', steamController.getAppReviews);

// Live player count
router.get('/app/:appId/players', steamController.getPlayerCount);

// Verify a Steam ID or vanity URL
router.post('/verify', steamController.verifySteam);

module.exports = router;
