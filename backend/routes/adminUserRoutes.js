const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requireAdmin, requirePermission, enforceDepartmentScope } = require("../middleware/adminAuth");
const {
    getUserListAnalytics,
    updateTestUserAccess,
    suspendUser,
    getAdminLogs
} = require("../controllers/analyticsController");

const router = express.Router();

// Require active admin authentication
router.use(authMiddleware, requireAdmin);

// User management endpoints
router.get("/", requirePermission("users.view"), enforceDepartmentScope, getUserListAnalytics);
router.patch("/:userId/test-access", requirePermission("users.update"), enforceDepartmentScope, updateTestUserAccess);
router.patch("/:userId/suspend", requirePermission("users.update"), enforceDepartmentScope, suspendUser);
router.get("/:userId/logs", requirePermission("users.view"), enforceDepartmentScope, getAdminLogs);

module.exports = router;
