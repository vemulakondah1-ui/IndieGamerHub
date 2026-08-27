const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    if (!req.user.isActive) {
      const error = new Error('Account has been deactivated');
      error.statusCode = 401;
      return next(error);
    }

    next();
  } catch (err) {
    const error = new Error('Not authorized, token invalid');
    error.statusCode = 401;
    next(error);
  }
};

module.exports = protect;
