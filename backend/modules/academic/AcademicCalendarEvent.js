const mongoose = require('mongoose');

const academicCalendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  academicYear: {
    type: String, // Format: "YYYY-YY" (e.g., "2025-26")
    required: true
  },
  category: {
    type: String,
    enum: ['holiday', 'exam', 'event', 'assignment'],
    required: true
  },
  scope: {
    type: String,
    enum: ['national', 'state', 'college', 'department'],
    required: true
  },
  priority: {
    type: Number,
    default: 50 // SEE: 100, CIE: 80, Holiday: 50, Assignment: 40
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Performance index for typical lookups (academic year, ranges, category filter)
academicCalendarEventSchema.index({ date: 1, academicYear: 1, category: 1, scope: 1 });

module.exports = mongoose.model('AcademicCalendarEvent', academicCalendarEventSchema);
