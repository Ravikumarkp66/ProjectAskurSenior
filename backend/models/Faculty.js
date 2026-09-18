const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Example: FAC0001
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',   // references the 'branches' collection (Branch model)
      required: true,
      index: true,
    },

    department: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      trim: true,
    },

    qualification: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    officeLocation: {
      type: String,
      trim: true,
      default: ''
    },

    experienceYears: {
      type: Number,
      default: 0
    },

    subjects: [{
      type: String,
      trim: true
    }],

    isLabFaculty: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true, // createdAt & updatedAt
    collection: 'faculties',
  }
);

// Indexes
facultySchema.index({ facultyId: 1 }, { unique: true });
facultySchema.index({ departmentId: 1 });
facultySchema.index({ email: 1 });

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
