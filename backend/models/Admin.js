const mongoose = require('mongoose');

const defaultPermissions = {
  users: { view: true, create: false, update: false, delete: false },
  subjects: { view: true, create: false, update: false, delete: false, publish: false },
  materials: { view: true, create: false, update: false, delete: false, publish: false, archive: false },
  queries: { view: true, respond: false, resolve: false, delete: false },
  requests: { view: true, approve: false, reject: false },
  timetable: { view: true, create: false, update: false, delete: false, publish: false },
  events: { view: true, create: false, update: false, delete: false, publish: false },
  academicSettings: { view: true, update: false },
  semesters: { view: true, create: false, update: false, finalize: false },
  academic_structure: { view: true, create: false, update: false, delete: false },
  interviews: { view: true, publish: false, archive: false, delete: false },
  companies: { view: true, create: false, update: false, delete: false },
  faculty: { view: true, create: false, update: false, delete: false },
  facultyReviews: { view: true, moderate: false, delete: false },
  announcements: { view: true, create: false, update: false, delete: false, publish: false, archive: false }
};

const superAdminPermissions = {
  users: { view: true, create: true, update: true, delete: true },
  subjects: { view: true, create: true, update: true, delete: true, publish: true },
  materials: { view: true, create: true, update: true, delete: true, publish: true, archive: true },
  queries: { view: true, respond: true, resolve: true, delete: true },
  requests: { view: true, approve: true, reject: true },
  timetable: { view: true, create: true, update: true, delete: true, publish: true },
  events: { view: true, create: true, update: true, delete: true, publish: true },
  academicSettings: { view: true, update: true },
  semesters: { view: true, create: true, update: true, finalize: true },
  academic_structure: { view: true, create: true, update: true, delete: true },
  interviews: { view: true, publish: true, archive: true, delete: true },
  companies: { view: true, create: true, update: true, delete: true },
  faculty: { view: true, create: true, update: true, delete: true },
  facultyReviews: { view: true, moderate: true, delete: true },
  announcements: { view: true, create: true, update: true, delete: true, publish: true, archive: true }
};

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address format']
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN'],
      default: 'ADMIN',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null
    },
    scopes: [{
      college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: true
      },
      program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        default: null
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null
      },
      batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicBatch',
        default: null
      },
      semester: {
        type: Number,
        default: null
      },
      sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSection'
      }]
    }],
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...defaultPermissions })
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true
    },
    securityStatus: {
      type: String,
      enum: ['NORMAL', 'SUSPICIOUS', 'CLEARED'],
      default: 'NORMAL'
    },
    lastLogin: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String,
      default: null
    },
    updatedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'admins'
  }
);

adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ status: 1 });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

module.exports = Admin;
