const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monday: [{
    subject: String,
    start: String,
    end: String
  }],
  tuesday: [{
    subject: String,
    start: String,
    end: String
  }],
  wednesday: [{
    subject: String,
    start: String,
    end: String
  }],
  thursday: [{
    subject: String,
    start: String,
    end: String
  }],
  friday: [{
    subject: String,
    start: String,
    end: String
  }],
  saturday: [{
    subject: String,
    start: String,
    end: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('AcademicTimetable', timetableSchema);
