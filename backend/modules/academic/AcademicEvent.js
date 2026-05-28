const mongoose = require('mongoose');

const academicEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  type: {
    type: String,
    enum: ['internal', 'quiz', 'abl', 'exam', 'other'],
    default: 'other'
  },
  color: {
    type: String,
    default: '#4F46E5'
  },
  description: {
    type: String
  }
}, { timestamps: true });

// Index for performance
academicEventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('AcademicEvent', academicEventSchema);
