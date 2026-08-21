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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Professor & Head',
        'Head of Department',
        'Lecturer',
        'Instructor',
        'Adjunct Professor',
        'Visiting Faculty',
      ],
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
