/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin') or authorize('developer', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `Access denied: role '${req.user.role}' is not authorized for this action`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = authorize;
