const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  plan: {
    type: String,
    enum: ["askplus"]
  },

  amount: Number,

  utrNumber: {
    type: String,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending"
  },

  studentId: {
    type: String,
    uppercase: true
  },

  approvedAt: Date,
  rejectionReason: String

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
