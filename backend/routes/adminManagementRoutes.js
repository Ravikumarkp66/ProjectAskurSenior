const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const {
  listAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  deleteAdmin,
  getActivityLogs,
  getLeaderboard,
  getAdminProfile
} = require('../controllers/adminManagementController');

// All admin management routes require valid authentication, active admin status, and SUPER_ADMIN privileges
router.use(authMiddleware, requireAdmin, requireSuperAdmin);

router.get('/', listAdmins);
router.get('/activities', getActivityLogs);
router.get('/leaderboard', getLeaderboard);
router.get('/:id/profile', getAdminProfile);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.patch('/:id/status', toggleAdminStatus);
router.delete('/:id', deleteAdmin);

module.exports = router;
