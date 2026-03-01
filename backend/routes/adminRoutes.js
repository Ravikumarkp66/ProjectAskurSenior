import express from "express";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const router = express.Router();

// Approve Payment
router.patch("/approve/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    payment.status = "approved";
    await payment.save();

    const user = await User.findById(payment.userId);
    user.subscription = "askplus";

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    user.subscriptionExpiry = expiry;

    await user.save();

    res.json({ message: "Subscription Activated" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
