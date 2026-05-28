const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasks: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Ensure unique task set per user per day (ignoring time part)
// We will store dates at 00:00:00 UTC
dailyTaskSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
