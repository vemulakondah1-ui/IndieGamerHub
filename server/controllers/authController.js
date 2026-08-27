const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    const error = new Error('Please provide username, email and password');
    error.statusCode = 400;
    throw error;
  }

  // Validate role (can't self-assign admin)
  const allowedRoles = ['gamer', 'developer'];
  const userRole = allowedRoles.includes(role) ? role : 'gamer';

  try {
    const user = await User.create({ username, email, password, role: userRole });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    // Handle duplicate key errors (email or username already taken)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const fieldName = field === 'email' ? 'Email' : field === 'username' ? 'Username' : field;
      const error = new Error(`${fieldName} is already taken. Please use a different one.`);
      error.statusCode = 409;
      throw error;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join('. ');
      const error = new Error(message);
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account has been deactivated');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  const { username, bio, website } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (website !== undefined) updates.website = website;
  if (req.file) updates.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
};

module.exports = { register, login, getMe, updateProfile };
