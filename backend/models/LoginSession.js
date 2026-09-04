const mongoose = require('mongoose');

const loginSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    userType: {
      type: String,
      enum: ['student', 'admin', 'super_admin'],
      default: 'student'
    },
    portal: {
      type: String,
      default: 'default',
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null
    },
    departmentCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceId: {
      type: String,
      default: null
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
      default: 'Desktop'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    operatingSystem: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      required: true
    },
    location: {
      country: { type: String, default: 'Unknown' },
      state: { type: String, default: 'Unknown' },
      city: { type: String, default: 'Unknown' },
      approximate: { type: Boolean, default: true },
      coordinates: {
        lat: { type: Number, default: null },
        lon: { type: Number, default: null }
      }
    },
    loginTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    logoutTime: {
      type: Date,
      default: null
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LOGGED_OUT', 'REPLACED', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE',
      index: true
    },
    logoutReason: {
      type: String,
      default: null
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      index: true
    },
    riskSignals: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    isSuspicious: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'login_sessions'
  }
);

loginSessionSchema.index({ userId: 1, status: 1 });
loginSessionSchema.index({ email: 1, status: 1 });
loginSessionSchema.index({ createdAt: -1 });
loginSessionSchema.index({ riskScore: -1 });

const LoginSession =
  mongoose.models.LoginSession ||
  mongoose.model('LoginSession', loginSessionSchema);

module.exports = LoginSession;
