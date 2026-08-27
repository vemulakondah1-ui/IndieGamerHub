const Review = require('../models/Review');
const Game = require('../models/Game');

// @desc    Get reviews for a game
// @route   GET /api/games/:gameId/reviews
// @access  Public
const getGameReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ game: req.params.gameId })
      .populate('user', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments({ game: req.params.gameId }),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// @desc    Create review
// @route   POST /api/games/:gameId/reviews
// @access  Logged in (gamer/developer/admin)
const createReview = async (req, res) => {
  const { gameId } = req.params;
  const { rating, title, body, isRecommended } = req.body;

  // Verify game exists
  const game = await Game.findById(gameId);
  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  // Developer cannot review their own game
  if (game.developer.toString() === req.user._id.toString()) {
    const error = new Error('You cannot review your own game');
    error.statusCode = 400;
    throw error;
  }

  // Check for existing review
  const existing = await Review.findOne({ user: req.user._id, game: gameId });
  if (existing) {
    const error = new Error('You have already reviewed this game');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.create({
    user: req.user._id,
    game: gameId,
    rating: Number(rating),
    title,
    body,
    isRecommended: isRecommended !== false,
  });

  const populated = await Review.findById(review._id).populate('user', 'username avatar');

  res.status(201).json({ success: true, data: populated });
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Owner
const updateReview = async (req, res) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.user.toString() !== req.user._id.toString()) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  const { rating, title, body, isRecommended } = req.body;
  review.rating = Number(rating) || review.rating;
  review.title = title !== undefined ? title : review.title;
  review.body = body || review.body;
  review.isRecommended = isRecommended !== undefined ? isRecommended : review.isRecommended;
  await review.save();

  // Manually trigger recalculation since we used .save()
  await Review.recalcAvgRating(review.game);

  const populated = await Review.findById(review._id).populate('user', 'username avatar');
  res.json({ success: true, data: populated });
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Owner / Admin
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  await review.deleteOne();
  // Recalculation triggered by post('findOneAndDelete') hook after deleteOne
  await Review.recalcAvgRating(review.game);

  res.json({ success: true, message: 'Review deleted' });
};

// @desc    Get user's review for a specific game
// @route   GET /api/games/:gameId/reviews/my
// @access  Private
const getMyReview = async (req, res) => {
  const review = await Review.findOne({
    user: req.user._id,
    game: req.params.gameId,
  }).populate('user', 'username avatar');

  res.json({ success: true, data: review || null });
};

module.exports = { getGameReviews, createReview, updateReview, deleteReview, getMyReview };
