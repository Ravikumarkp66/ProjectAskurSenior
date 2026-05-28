const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // Automatically expire after 2 hours
  }
});

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
