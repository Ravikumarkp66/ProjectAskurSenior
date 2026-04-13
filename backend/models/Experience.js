const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    index: true,
  },
  ctc: {
    type: String, // String to support "Role Based"
    required: true,
  },
  selected: {
    type: Boolean,
    default: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  batch: {
    type: String,
    required: true,
  },
  rounds: [{
    roundNumber: Number,
    type: {
      type: String,
      default: 'Technical',
    },
    notes: [String], // Point-wise notes
    questions: [{
      text: String,
      solveLink: String // Link to LeetCode, GFG, etc.
    }],
  }],
  upvotes: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);
