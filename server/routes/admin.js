const express = require('express');
const router = express.Router();
const {
  adminGetGames, adminToggleFeatured, adminTogglePublished,
  adminGetUsers, adminUpdateUserRole, adminToggleUserStatus, adminGetStats,
} = require('../controllers/adminController');
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

router.get('/stats', adminGetStats);
router.get('/games', adminGetGames);
router.put('/games/:id/feature', adminToggleFeatured);
router.put('/games/:id/publish', adminTogglePublished);
router.get('/users', adminGetUsers);
router.put('/users/:id/role', adminUpdateUserRole);
router.put('/users/:id/status', adminToggleUserStatus);

module.exports = router;
