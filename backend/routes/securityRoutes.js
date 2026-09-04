const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const {
  getSecurityOverview,
  getLoginLogs,
  getSuspiciousLogins,
  getActiveSessions,
  revokeSessionAction,
  revokeAllUserSessionsAction,
  markSessionSafeAction,
  toggleUserAccount,
  getMySecurityHistory
} = require('../controllers/securityController');

// All security routes require basic authentication and admin status
router.use(authMiddleware);
router.use(requireAdmin);

// Self-service route: ANY admin can view their own login history
router.get('/my-history', getMySecurityHistory);

// Super Admin restricted routes
router.get('/overview', requireSuperAdmin, getSecurityOverview);
router.get('/logs', requireSuperAdmin, getLoginLogs);
router.get('/suspicious', requireSuperAdmin, getSuspiciousLogins);
router.get('/sessions', requireSuperAdmin, getActiveSessions);

// Super Admin action routes
router.post('/sessions/:id/revoke', requireSuperAdmin, revokeSessionAction);
router.post('/sessions/:id/mark-safe', requireSuperAdmin, markSessionSafeAction);
router.post('/users/:id/revoke-all', requireSuperAdmin, revokeAllUserSessionsAction);
router.post('/users/:id/toggle-account', requireSuperAdmin, toggleUserAccount);

module.exports = router;
