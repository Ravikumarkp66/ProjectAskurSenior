const mongoose = require('mongoose');

const wrapUpSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  step: {
    type: String,
    enum: ['menu', 'edit_select', 'edit_action', 'task_toggle'],
    default: 'menu'
  },
  selectedSubjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // Expire after 2 hours
  }
});

module.exports = mongoose.model('WrapUpSession', wrapUpSessionSchema);
