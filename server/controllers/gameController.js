const Game = require('../models/Game');
const Review = require('../models/Review');
const { fetchSteamAppDetails } = require('../services/steamApi');
const { searchRawgGames } = require('../services/rawgApi');

// @desc    Get all games (search + filter)
// @route   GET /api/games
// @access  Public
const getGames = async (req, res) => {
  const {
    search,
    genre,
    minPrice,
    maxPrice,
    isFree,
    platform,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isPublished: true };

  // Full-text search
  if (search) {
    query.$text = { $search: search };
  }

  // Genre filter
  if (genre) {
    query.genre = { $in: genre.split(',') };
  }

  // Price filter
  if (isFree === 'true') {
    query.isFree = true;
  } else {
    if (minPrice !== undefined) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice !== undefined) query.price = { ...query.price, $lte: Number(maxPrice) };
  }

  // Platform filter
  if (platform) {
    query.platform = { $in: platform.split(',') };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [games, total] = await Promise.all([
    Game.find(query)
      .populate('developer', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Game.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: games,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
};

// @desc    Get featured games
// @route   GET /api/games/featured
// @access  Public
const getFeaturedGames = async (req, res) => {
  const games = await Game.find({ isFeatured: true, isPublished: true })
    .populate('developer', 'username avatar')
    .sort('-updatedAt')
    .limit(10)
    .lean();
  res.json({ success: true, data: games });
};

// @desc    Get trending games (most reviews last 7 days)
// @route   GET /api/games/trending
// @access  Public
const getTrendingGames = async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const trending = await Review.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$game', recentReviews: { $sum: 1 } } },
    { $sort: { recentReviews: -1 } },
    { $limit: 12 },
    {
      $lookup: {
        from: 'games',
        localField: '_id',
        foreignField: '_id',
        as: 'game',
      },
    },
    { $unwind: '$game' },
    { $match: { 'game.isPublished': true } },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$game', { recentReviews: '$recentReviews' }] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'developer',
        foreignField: '_id',
        as: 'developer',
      },
    },
    { $unwind: { path: '$developer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        'developer.password': 0,
        'developer.email': 0,
      },
    },
  ]);

  res.json({ success: true, data: trending });
};

// @desc    Get upcoming games (release date in future)
// @route   GET /api/games/upcoming
// @access  Public
const getUpcomingGames = async (req, res) => {
  const now = new Date();
  const games = await Game.find({
    releaseDate: { $gt: now },
    isPublished: true,
  })
    .populate('developer', 'username avatar')
    .sort('releaseDate')
    .limit(8)
    .lean();
  res.json({ success: true, data: games });
};

// @desc    Get single game
// @route   GET /api/games/:id
// @access  Public
const getGame = async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate('developer', 'username avatar bio website')
    .lean();

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: game });
};

// @desc    Create game
// @route   POST /api/games
// @access  Developer / Admin
const createGame = async (req, res) => {
  const {
    title, description, shortDescription, genre, tags,
    releaseDate, trailerUrl, storeLinks, steamAppId,
    price, isFree, platform,
  } = req.body;

  // Handle file uploads
  const screenshots = req.files?.screenshots?.map((f) => f.path) || [];
  const thumbnail = req.files?.thumbnail?.[0]?.path || req.body.thumbnail || '';

  const game = await Game.create({
    title,
    description,
    shortDescription,
    genre: Array.isArray(genre) ? genre : genre?.split(',').map((g) => g.trim()) || [],
    tags: Array.isArray(tags) ? tags : tags?.split(',').map((t) => t.trim()) || [],
    releaseDate,
    developer: req.user._id,
    developerName: req.user.username,
    screenshots,
    thumbnail,
    trailerUrl,
    storeLinks: typeof storeLinks === 'string' ? JSON.parse(storeLinks) : storeLinks,
    steamAppId,
    price: Number(price) || 0,
    isFree: isFree === 'true' || isFree === true,
    platform: Array.isArray(platform) ? platform : platform?.split(',').map((p) => p.trim()) || ['Windows'],
  });

  res.status(201).json({ success: true, data: game });
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Owner / Admin
const updateGame = async (req, res) => {
  let game = await Game.findById(req.params.id);

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership check
  if (game.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this game');
    error.statusCode = 403;
    throw error;
  }

  const updates = { ...req.body };

  // Handle file uploads
  if (req.files?.screenshots?.length > 0) {
    updates.screenshots = req.files.screenshots.map((f) => f.path);
  }
  if (req.files?.thumbnail?.[0]) {
    updates.thumbnail = req.files.thumbnail[0].path;
  }

  if (updates.genre && typeof updates.genre === 'string') {
    updates.genre = updates.genre.split(',').map((g) => g.trim());
  }
  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((t) => t.trim());
  }
  if (updates.storeLinks && typeof updates.storeLinks === 'string') {
    updates.storeLinks = JSON.parse(updates.storeLinks);
  }

  game = await Game.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('developer', 'username avatar');

  res.json({ success: true, data: game });
};

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Owner / Admin
const deleteGame = async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  if (game.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this game');
    error.statusCode = 403;
    throw error;
  }

  await game.deleteOne();
  res.json({ success: true, message: 'Game deleted successfully' });
};

// @desc    Steam API prefill
// @route   POST /api/games/steam-prefill
// @access  Developer / Admin
const steamPrefill = async (req, res) => {
  const { appId } = req.body;

  if (!appId) {
    const error = new Error('Steam App ID is required');
    error.statusCode = 400;
    throw error;
  }

  try {
    const steamData = await fetchSteamAppDetails(appId);
    res.json({ success: true, data: steamData });
  } catch (steamErr) {
    // Fallback to RAWG search if Steam fails
    try {
      const rawgResults = await searchRawgGames(appId);
      res.json({ success: true, data: rawgResults[0] || null, source: 'rawg' });
    } catch {
      const error = new Error(`Could not fetch game data: ${steamErr.message}`);
      error.statusCode = 502;
      throw error;
    }
  }
};

// @desc    Toggle featured status
// @route   PUT /api/games/:id/feature
// @access  Admin
const toggleFeatured = async (req, res) => {
  const game = await Game.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isFeatured: { $not: '$isFeatured' } } }],
    { new: true }
  );

  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: game, isFeatured: game.isFeatured });
};

// @desc    Get games by developer
// @route   GET /api/games/developer/:devId
// @access  Public
const getDeveloperGames = async (req, res) => {
  const games = await Game.find({ developer: req.params.devId, isPublished: true })
    .sort('-createdAt')
    .lean();
  res.json({ success: true, data: games });
};

// @desc    Get all unique genres
// @route   GET /api/games/genres
// @access  Public
const getGenres = async (req, res) => {
  const genres = await Game.distinct('genre', { isPublished: true });
  res.json({ success: true, data: genres.sort() });
};

// @desc    Get best selling / most popular games
// @route   GET /api/games/best-selling
// @access  Public
const getBestSellingGames = async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const games = await Game.find({ isPublished: true })
    .populate('developer', 'username avatar')
    .sort({ reviewCount: -1, avgRating: -1 })
    .limit(limit)
    .lean();
  res.json({ success: true, data: games });
};

// @desc    Get top games by genre (most played & most sold)
// @route   GET /api/games/genre-stats?genre=Action
// @access  Public
const getGenreStats = async (req, res) => {
  const { genre } = req.query;
  const query = { isPublished: true };
  if (genre && genre !== 'All') {
    query.genre = { $in: [genre] };
  }

  const [mostPlayed, mostSold] = await Promise.all([
    // Most played = highest reviewCount (proxy for player engagement)
    Game.find(query)
      .populate('developer', 'username avatar')
      .sort({ reviewCount: -1, avgRating: -1 })
      .limit(5)
      .lean(),
    // Most sold = highest price * review count (premium games with most traction)
    Game.find({ ...query, isFree: false })
      .populate('developer', 'username avatar')
      .sort({ price: -1, reviewCount: -1 })
      .limit(5)
      .lean(),
  ]);

  res.json({ success: true, data: { mostPlayed, mostSold } });
};

module.exports = {
  getGames,
  getFeaturedGames,
  getTrendingGames,
  getUpcomingGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  steamPrefill,
  toggleFeatured,
  getDeveloperGames,
  getGenres,
  getBestSellingGames,
  getGenreStats,
};
