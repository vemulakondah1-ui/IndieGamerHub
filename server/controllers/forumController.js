const Thread = require('../models/Thread');
const Post = require('../models/Post');
const Game = require('../models/Game');

// ──────────────────── THREADS ────────────────────

// @desc    Get all threads for a game
// @route   GET /api/games/:gameId/threads
// @access  Public
const getGameThreads = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [threads, total] = await Promise.all([
    Thread.find({ game: req.params.gameId })
      .populate('author', 'username avatar')
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Thread.countDocuments({ game: req.params.gameId }),
  ]);

  res.json({
    success: true,
    data: threads,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc    Create thread for a game
// @route   POST /api/games/:gameId/threads
// @access  Logged in
const createThread = async (req, res) => {
  const { gameId } = req.params;
  const { title, body } = req.body;

  const game = await Game.findById(gameId);
  if (!game) {
    const error = new Error('Game not found');
    error.statusCode = 404;
    throw error;
  }

  const thread = await Thread.create({
    game: gameId,
    author: req.user._id,
    title,
    body,
  });

  const populated = await Thread.findById(thread._id).populate('author', 'username avatar');
  res.status(201).json({ success: true, data: populated });
};

// @desc    Get single thread
// @route   GET /api/threads/:id
// @access  Public
const getThread = async (req, res) => {
  const thread = await Thread.findById(req.params.id)
    .populate('author', 'username avatar')
    .populate('game', 'title _id')
    .lean();

  if (!thread) {
    const error = new Error('Thread not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: thread });
};

// @desc    Delete thread
// @route   DELETE /api/threads/:id
// @access  Owner / Admin
const deleteThread = async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) {
    const error = new Error('Thread not found');
    error.statusCode = 404;
    throw error;
  }

  if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  // Delete all posts in thread
  await Post.deleteMany({ thread: thread._id });
  await thread.deleteOne();

  res.json({ success: true, message: 'Thread and its posts deleted' });
};

// ──────────────────── POSTS ────────────────────

// @desc    Get posts in a thread
// @route   GET /api/threads/:threadId/posts
// @access  Public
const getThreadPosts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [posts, total] = await Promise.all([
    Post.find({ thread: req.params.threadId })
      .populate('author', 'username avatar role')
      .sort('createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Post.countDocuments({ thread: req.params.threadId }),
  ]);

  res.json({
    success: true,
    data: posts,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc    Create post in a thread
// @route   POST /api/threads/:threadId/posts
// @access  Logged in
const createPost = async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;

  const thread = await Thread.findById(threadId);
  if (!thread) {
    const error = new Error('Thread not found');
    error.statusCode = 404;
    throw error;
  }

  if (thread.isLocked && req.user.role !== 'admin') {
    const error = new Error('This thread is locked');
    error.statusCode = 403;
    throw error;
  }

  const post = await Post.create({
    thread: threadId,
    author: req.user._id,
    content,
  });

  const populated = await Post.findById(post._id).populate('author', 'username avatar role');
  res.status(201).json({ success: true, data: populated });
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Owner
const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (post.author.toString() !== req.user._id.toString()) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  post.content = req.body.content || post.content;
  post.isEdited = true;
  post.editedAt = new Date();
  await post.save();

  const populated = await Post.findById(post._id).populate('author', 'username avatar role');
  res.json({ success: true, data: populated });
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Owner / Admin
const deletePost = async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    await Post.create({ ...post.toObject(), _id: undefined }); // restore if unauthorized
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  res.json({ success: true, message: 'Post deleted' });
};

module.exports = {
  getGameThreads, createThread, getThread, deleteThread,
  getThreadPosts, createPost, updatePost, deletePost,
};
