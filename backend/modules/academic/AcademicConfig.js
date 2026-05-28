const mongoose = require('mongoose');

const academicConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  semester: {
    type: Number,
    required: true
  },
  collegeStartDate: {
    type: Date,
    required: true
  },
  lastWorkingDay: {
    type: Date,
    required: true
  },
  examStartDate: {
    type: Date
  },
  examEndDate: {
    type: Date
  },
  // College Timings
  collegeStartTime: { type: String, default: '09:00' },
  collegeEndTime: { type: String, default: '17:00' },
  classDuration: { type: Number, default: 60 }, // in minutes
  lunchStartTime: { type: String, default: '13:00' },
  lunchEndTime: { type: String, default: '14:00' },
  breakStartTime: { type: String, default: '11:00' },
  breakEndTime: { type: String, default: '11:15' },
  trackingStartDate: { type: Date, default: Date.now },
  catchUpMode: { type: String, enum: ['manual', 'fresh', 'none'], default: 'none' },
  attendanceThreshold: { type: Number, default: 85 }
}, { timestamps: true });

module.exports = mongoose.model('AcademicConfig', academicConfigSchema);
