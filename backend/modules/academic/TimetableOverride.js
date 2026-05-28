const mongoose = require('mongoose');

const timetableOverrideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['swap', 'add'],
    required: true
  },
  originalTimeSlot: {
    type: String
  },
  newSubjectName: {
    type: String,
    required: true
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('TimetableOverride', timetableOverrideSchema);
