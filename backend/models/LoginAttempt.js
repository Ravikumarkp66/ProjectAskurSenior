const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    ipAddress: {
      type: String,
      required: true,
      index: true
    },
    success: {
      type: Boolean,
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // TTL 24 hours
    }
  },
  {
    collection: 'login_attempts'
  }
);

loginAttemptSchema.index({ email: 1, success: 1, createdAt: -1 });
loginAttemptSchema.index({ ipAddress: 1, success: 1, createdAt: -1 });

const LoginAttempt =
  mongoose.models.LoginAttempt ||
  mongoose.model('LoginAttempt', loginAttemptSchema);

module.exports = LoginAttempt;
