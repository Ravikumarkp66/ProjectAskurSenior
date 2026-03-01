const express = require("express");
const Payment = require("../models/Payment");
const User = require("../models/User");
const AdminLog = require("../models/AdminLog");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

// Submit UTR (User)
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    // Use req.userId if available (from token), fallback to body for legacy/special cases
    const finalUserId = req.userId || req.body.userId;
    const { utrNumber, studentId } = req.body;

    const existing = await Payment.findOne({ utrNumber });
    if (existing) {
      return res.status(400).json({ message: "UTR already used." });
    }

    const user = await User.findById(finalUserId);
    if (user && user.subscription === "askplus") {
      const now = new Date();
      if (user.subscriptionExpiry && user.subscriptionExpiry > now) {
        return res.status(400).json({ message: "You already have an active ASK+ subscription." });
      }
    }

    const existingPending = await Payment.findOne({ userId: finalUserId, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending payment request. Please wait for verification." });
    }

    await Payment.create({
      userId: finalUserId,
      studentId,
      plan: "askplus",
      amount: 29,
      utrNumber
    });

    res.json({ message: "Payment submitted for verification." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user payment status (User)
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history (User)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all payments
router.get("/admin/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "name email usn")
      .sort({ createdAt: -1 });

    // Handle existing orphaned records (where userId became null but studentId/USN exists)
    const healedPayments = await Promise.all(payments.map(async (p) => {
      if (!p.userId && p.studentId) {
        const user = await User.findOne({ usn: p.studentId.toUpperCase() }).select("name email usn");
        if (user) {
          const plainPayment = p.toObject();
          plainPayment.userId = user; // Attach the found user
          return plainPayment;
        }
      }
      return p;
    }));

    res.json(healedPayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Verify Payment (Approve/Reject)
router.patch("/admin/verify/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = status;
    if (status === "approved") {
      payment.approvedAt = new Date();

      let user = await User.findById(payment.userId);

      // Fallback to studentId (USN) if userId is missing (for legacy/orphaned records)
      if (!user && payment.studentId) {
        user = await User.findOne({ usn: payment.studentId.toUpperCase() });
      }

      if (!user) {
        return res.status(404).json({
          message: "Student account not found. You cannot approve this payment, please reject or delete the record."
        });
      }

      // Link payment to user if it wasn't already (important for orphaned records)
      if (!payment.userId) {
        payment.userId = user._id;
      }

      // 1. Calculate new expiry (Stacking Logic)
      const now = new Date();
      let baseDate = now;

      // If user already has an active ASK+ subscription, extend from current expiry
      if (user.subscription === "askplus" && user.subscriptionExpiry && user.subscriptionExpiry > now) {
        baseDate = new Date(user.subscriptionExpiry);
      }

      const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 2. Update User Subscription
      user.subscription = "askplus";
      user.subscriptionExpiry = newExpiry;
      await user.save();

      // 3. Mark OTHER pending/approved payments as expired (Clean up)
      await Payment.updateMany(
        {
          userId: user._id,
          _id: { $ne: payment._id },
          status: { $in: ["pending", "approved"] }
        },
        { status: "expired" }
      );
    }
    else if (status === "rejected") {
      payment.rejectionReason = rejectionReason;
    }

    await payment.save();

    // Create Admin Log
    await AdminLog.create({
      adminId: req.userId,
      action: status === "approved" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
      targetUserId: payment.userId,
      details: {
        paymentId: payment._id,
        utrNumber: payment.utrNumber,
        rejectionReason: status === "rejected" ? rejectionReason : undefined
      }
    });

    res.json({ message: `Payment ${status} successfully` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete Payment Record (Cleanup)
router.delete("/admin/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    // Log the deletion
    await AdminLog.create({
      adminId: req.userId,
      action: "PAYMENT_RECORD_DELETED",
      targetUserId: payment.userId,
      details: {
        paymentId: payment._id,
        utrNumber: payment.utrNumber,
        studentId: payment.studentId
      }
    });

    res.json({ message: "Payment record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
