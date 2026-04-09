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

module.exports = router;
