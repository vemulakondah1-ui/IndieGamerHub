const User = require('../models/User');
const Game = require('../models/Game');
const Review = require('../models/Review');

// @desc    Get all games (admin view)
// @route   GET /api/admin/games
// @access  Admin
const adminGetGames = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = search ? { $text: { $search: search } } : {};

  const [games, total] = await Promise.all([
    Game.find(query)
      .populate('developer', 'username email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Game.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: games,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc    Toggle game featured
// @route   PUT /api/admin/games/:id/feature
// @access  Admin
const adminToggleFeatured = async (req, res) => {
  const game = await Game.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isFeatured: { $not: '$isFeatured' } } }],
    { new: true }
  ).populate('developer', 'username');

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: game });
};

// @desc    Toggle game published status
// @route   PUT /api/admin/games/:id/publish
// @access  Admin
const adminTogglePublished = async (req, res) => {
  const game = await Game.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isPublished: { $not: '$isPublished' } } }],
    { new: true }
  );

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: game });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const adminGetUsers = async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = role ? { role } : {};

  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const adminUpdateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['gamer', 'developer', 'admin'];

  if (!validRoles.includes(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: user });
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Admin
const adminToggleUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isActive: { $not: '$isActive' } } }],
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: user });
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const adminGetStats = async (req, res) => {
  const [
    totalGames,
    featuredGames,
    totalUsers,
    totalReviews,
    developerCount,
    recentGames,
  ] = await Promise.all([
    Game.countDocuments(),
    Game.countDocuments({ isFeatured: true }),
    User.countDocuments(),
    Review.countDocuments(),
    User.countDocuments({ role: 'developer' }),
    Game.find().sort('-createdAt').limit(5).populate('developer', 'username').lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalGames,
      featuredGames,
      totalUsers,
      totalReviews,
      developerCount,
      recentGames,
    },
  });
};

module.exports = {
  adminGetGames,
  adminToggleFeatured,
  adminTogglePublished,
  adminGetUsers,
  adminUpdateUserRole,
  adminToggleUserStatus,
  adminGetStats,
};
