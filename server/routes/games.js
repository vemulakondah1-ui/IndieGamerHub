const express = require('express');
const router = express.Router();
const {
  getGames, getFeaturedGames, getTrendingGames, getUpcomingGames,
  getGame, createGame, updateGame, deleteGame,
  steamPrefill, toggleFeatured, getDeveloperGames, getGenres, getBestSellingGames, getGenreStats,
} = require('../controllers/gameController');
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const { uploadGameFiles } = require('../config/cloudinary');

// Public routes (specific paths must come before :id param)
router.get('/featured', getFeaturedGames);
router.get('/trending', getTrendingGames);
router.get('/upcoming', getUpcomingGames);
router.get('/genres', getGenres);
router.get('/best-selling', getBestSellingGames);
router.get('/genre-stats', getGenreStats);
router.get('/developer/:devId', getDeveloperGames);
router.get('/', getGames);
router.get('/:id', getGame);

// Protected routes
router.post('/steam-prefill', protect, authorize('developer', 'admin'), steamPrefill);
router.post('/', protect, authorize('developer', 'admin'), uploadGameFiles, createGame);
router.put('/:id', protect, authorize('developer', 'admin'), uploadGameFiles, updateGame);
router.put('/:id/feature', protect, authorize('admin'), toggleFeatured);
router.delete('/:id', protect, authorize('developer', 'admin'), deleteGame);

module.exports = router;
