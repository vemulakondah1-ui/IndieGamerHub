const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for gameId from parent
const {
  getGameReviews, createReview, updateReview, deleteReview, getMyReview,
} = require('../controllers/reviewController');
const protect = require('../middleware/protect');

// Routes prefixed with /api/games/:gameId/reviews
router.get('/', getGameReviews);
router.get('/my', protect, getMyReview);
router.post('/', protect, createReview);

// Routes prefixed with /api/reviews/:id
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
