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
  console.log('[Register Debug] Incoming registration request body:', req.body);
  const { username, email, password, role } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password',
      });
    }

    // Validate role (can't self-assign admin)
    const allowedRoles = ['gamer', 'developer'];
    const userRole = allowedRoles.includes(role) ? role : 'gamer';

    const user = await User.create({ username, email, password, role: userRole });

    const token = generateToken(user._id);

    console.log('[Register Debug] User successfully registered:', user.email);

    return res.status(201).json({
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
    console.error('[Register Error]', err.message);

    // Handle duplicate key errors (email or username already taken)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const fieldName = field === 'email' ? 'Email' : field === 'username' ? 'Username' : field;
      return res.status(409).json({
        success: false,
        message: `${fieldName} is already taken. Please use a different one.`,
      });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join('. ');
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Catch-all to prevent 502 Bad Gateway proxy crashes
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server Error',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    const token = generateToken(user._id);

    return res.json({
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
    console.error('[Login Error]', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server Error',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
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

    return res.json({ success: true, user });
  } catch (err) {
    console.error('[UpdateProfile Error]', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server Error',
    });
  }
};

module.exports = { register, login, getMe, updateProfile };