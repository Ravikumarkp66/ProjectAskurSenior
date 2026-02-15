const express = require("express");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const {
    getOverviewAnalytics,
    getUserGrowthAnalytics,
    getUploadGrowthAnalytics,
    getContentBySubjectAnalytics,
    getUploadByMonthAnalytics,
    getNotificationStats,
    getUserListAnalytics,
    togglePremium,
    banUser,
    resetUserRole
} = require("../controllers/analyticsController");

const router = express.Router();

// All analytics endpoints require admin auth
router.use(authMiddleware, adminMiddleware);

// Overview analytics
router.get("/overview", getOverviewAnalytics);

// User growth trend
router.get("/user-growth", getUserGrowthAnalytics);

// Upload growth trend
router.get("/upload-growth", getUploadGrowthAnalytics);

// Content by subject
router.get("/content-by-subject", getContentBySubjectAnalytics);

// Upload by month (breakdown by type)
router.get("/upload-by-month", getUploadByMonthAnalytics);

// Notification stats
router.get("/notification-stats", getNotificationStats);

// User management
router.get("/users", getUserListAnalytics);
router.patch("/users/:userId/premium", togglePremium);
router.patch("/users/:userId/ban", banUser);
router.patch("/users/:userId/reset-role", resetUserRole);

module.exports = router;
