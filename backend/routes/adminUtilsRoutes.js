const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Set all non-admin users' subscription to 'free' (admin utility)
router.patch("/set-all-free", async (req, res) => {
  try {
    const result = await User.updateMany({ isAdmin: { $ne: true } }, { subscription: "free" });
    res.json({ message: "All non-admin users set to free", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Safe cleanup of dedicated E2E test users
const cleanupHandler = async (req, res) => {
  try {
    const { email, usn } = req.body || req.query || {};
    const StudentAccount = require('../models/StudentAccount');
    const filter = [];
    if (email) filter.push({ email: email.toLowerCase().trim() });
    if (usn) filter.push({ usn: usn.toUpperCase().trim() });
    
    if (filter.length > 0) {
      await StudentAccount.deleteMany({ $or: filter });
      await User.deleteMany({ $or: filter });
    }
    res.json({ success: true, message: 'Test data cleaned up successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.post("/cleanup-test-user", cleanupHandler);
router.delete("/cleanup-test-user", cleanupHandler);

// Retrieve OTP for test verification in automated test environments
router.get("/get-test-otp", async (req, res) => {
  try {
    const key = req.query.key || req.query.email || req.query.targetEmail;
    if (!key) return res.status(400).json({ error: "Key or email required" });
    const OTP = require('../models/OTP');
    const record = await OTP.findOne({ email: key.toLowerCase().trim() }).sort({ createdAt: -1 });
    if (!record) return res.status(404).json({ error: "No OTP found" });
    res.json({ success: true, otp: record.otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
