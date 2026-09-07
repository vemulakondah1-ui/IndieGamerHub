// Shared guard for admin routes keyed on :id that must never target the
// acting admin themselves (role change, status toggle, etc). Centralized here
// instead of copy-pasted per-handler so a future :id-keyed admin mutation
// (delete user, reset password, force-logout) gets this for free by using the
// same route middleware, rather than needing someone to remember to add it.
function blockSelfAction(message) {
  return (req, res, next) => {
    if (req.user._id.toString() === req.params.id) {
      const error = new Error(message);
      error.statusCode = 400;
      throw error;
    }
    next();
  };
}

module.exports = blockSelfAction;
