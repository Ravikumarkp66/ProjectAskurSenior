const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true
  },
  timeSlot: {
    type: String, // format: HH:MM - HH:MM
    required: true
  },
  status: {
    type: String,
    enum: ['attended', 'missed', 'suspended'],
    required: true
  }
}, { timestamps: true });

// A user can only have one attendance record per subject per timeslot per day
attendanceRecordSchema.index({ userId: 1, subjectName: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
