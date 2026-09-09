const mongoose = require('mongoose');
const Review = require('../models/Review');
const Game = require('../models/Game');

const getGameQuery = (gameId) => {
  const rawId = String(gameId || '').trim();
  if (mongoose.Types.ObjectId.isValid(rawId)) {
    return {
      $or: [
        { game: new mongoose.Types.ObjectId(rawId) },
        { game: rawId },
      ],
    };
  }
  return { game: rawId };
};

// @desc    Get reviews for a game
// @route   GET /api/games/:gameId/reviews
// @access  Public
const getGameReviews = async (req, res) => {
  const { page = 1, limit = 50, sort = '-createdAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = getGameQuery(req.params.gameId);

  const [reviews, total, allRatings] = await Promise.all([
    Review.find(query)
      .populate('user', 'username avatar role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(query),
    Review.find(query).select('rating').lean(),
  ]);

  // Calculate rating summary & star distribution
  let avgRating = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (allRatings.length > 0) {
    let sum = 0;
    allRatings.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += (r.rating || 0);
    });
    avgRating = Math.round((sum / allRatings.length) * 10) / 10;
  }

  res.json({
    success: true,
    data: reviews,
    summary: {
      avgRating,
      total,
      distribution,
    },
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
};

// @desc    Create / update review
// @route   POST /api/games/:gameId/reviews
// @access  Logged in (gamer/developer/admin)
const createReview = async (req, res) => {
  const { gameId } = req.params;
  const { rating, title, body, comment, isRecommended } = req.body;
  const reviewBody = String(body || comment || '').trim();

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
  }

  if (!reviewBody || reviewBody.length < 3) {
    return res.status(400).json({ success: false, message: 'Review comment must be at least 3 characters' });
  }

  const userId = req.user._id || req.user.id;
  const query = getGameQuery(gameId);

  // Check if developer is reviewing their own game (if game exists in DB)
  try {
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await Game.findById(gameId);
    } else {
      game = await Game.findOne({ steamAppId: String(gameId) });
    }
    if (game && game.developer && String(game.developer) === String(userId)) {
      return res.status(400).json({ success: false, message: 'You cannot review your own game' });
    }
  } catch (err) {
    // Ignore lookup errors
  }

  // Check for existing review by this user to update or create
  let review = await Review.findOne({ user: userId, ...query });

  if (review) {
    review.rating = numRating;
    review.title = title !== undefined ? String(title).trim().slice(0, 120) : review.title;
    review.body = reviewBody.slice(0, 2000);
    review.isRecommended = isRecommended !== undefined ? Boolean(isRecommended) : (numRating >= 3);
    await review.save();
  } else {
    review = await Review.create({
      user: userId,
      game: mongoose.Types.ObjectId.isValid(gameId) ? new mongoose.Types.ObjectId(gameId) : String(gameId).trim(),
      rating: numRating,
      title: title ? String(title).trim().slice(0, 120) : '',
      body: reviewBody.slice(0, 2000),
      isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : (numRating >= 3),
    });
  }

  // Recalculate average rating for game
  await Review.recalcAvgRating(gameId);

  const populated = await Review.findById(review._id).populate('user', 'username avatar role');
  res.status(201).json({ success: true, data: populated });
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Owner
const updateReview = async (req, res) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const userId = String(req.user._id || req.user.id);
  if (String(review.user) !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
  }

  const { rating, title, body, comment, isRecommended } = req.body;
  if (rating !== undefined) {
    const num = Number(rating);
    if (num >= 1 && num <= 5) review.rating = num;
  }
  if (title !== undefined) review.title = String(title).trim().slice(0, 120);
  const text = body || comment;
  if (text !== undefined && text.trim().length >= 3) review.body = String(text).trim().slice(0, 2000);
  if (isRecommended !== undefined) review.isRecommended = Boolean(isRecommended);

  await review.save();
  await Review.recalcAvgRating(review.game);

  const populated = await Review.findById(review._id).populate('user', 'username avatar role');
  res.json({ success: true, data: populated });
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Owner / Admin
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const userId = String(req.user._id || req.user.id);
  if (String(review.user) !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  const gameId = review.game;
  await review.deleteOne();
  await Review.recalcAvgRating(gameId);

  res.json({ success: true, message: 'Review deleted successfully' });
};

// @desc    Get user's review for a specific game
// @route   GET /api/games/:gameId/reviews/my
// @access  Private
const getMyReview = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const query = getGameQuery(req.params.gameId);
  const review = await Review.findOne({ user: userId, ...query }).populate('user', 'username avatar role');
  res.json({ success: true, data: review || null });
};

module.exports = { getGameReviews, createReview, updateReview, deleteReview, getMyReview };
