const mongoose = require('mongoose');

const academicSubjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  attendedClasses: {
    type: Number,
    default: 0
  },
  lastUpdatedDate: {
    type: Date
  },
  internal01: Date,
  internal02: Date,
  quiz01: Date,
  quiz02: Date,
  abl01: Date,
  abl02: Date,
  color: {
    type: String,
    default: '#4F46E5'
  }
}, { timestamps: true });

// Ensure a user doesn't have duplicate subject names in their academic setup
academicSubjectSchema.index({ userId: 1, subjectName: 1 }, { unique: true });

module.exports = mongoose.model('AcademicSubject', academicSubjectSchema);
