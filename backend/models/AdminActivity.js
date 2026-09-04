const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    adminName: {
      type: String,
      required: true,
      trim: true
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    action: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'PUBLISH',
        'UNPUBLISH',
        'APPROVE',
        'REJECT',
        'ARCHIVE',
        'RESTORE',
        'REASSIGN',
        'ENABLE',
        'DISABLE',
        'LOGIN',
        'LOGOUT'
      ],
      required: true
    },
    resourceType: {
      type: String,
      enum: [
        'MATERIAL',
        'SUBJECT',
        'USER',
        'ANNOUNCEMENT',
        'REQUEST',
        'QUERY',
        'ADMIN'
      ],
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
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
    metadata: {
      title: { type: String, default: null },
      subject: { type: String, default: null },
      materialType: { type: String, default: null },
      changes: { type: mongoose.Schema.Types.Mixed, default: null },
      count: { type: Number, default: 1 },
      affectedIds: [{ type: String }],
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
      extra: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'admin_activities'
  }
);

adminActivitySchema.index({ adminId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });
adminActivitySchema.index({ resourceType: 1, createdAt: -1 });
adminActivitySchema.index({ department: 1 });
adminActivitySchema.index({ createdAt: -1 });

const AdminActivity =
  mongoose.models.AdminActivity ||
  mongoose.model('AdminActivity', adminActivitySchema);

module.exports = AdminActivity;
