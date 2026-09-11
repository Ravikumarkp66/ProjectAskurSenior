const mongoose = require('mongoose');

const ALL_BRANCHES = [
  'CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT',
  'AIDS', 'AIML', 'CSD', 'CSM', 'IOT',
  'Chemical', 'Biotechnology', 'Other'
];

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  logo: {
    type: String,
    default: 'https://placehold.co/100x100?text=Company',
  },
  type: {
    type: String,
    enum: ['Product', 'Service', 'Other'],
    default: 'Product',
  },
  industry: {
    type: String,
    trim: true,
    default: '',
  },
  website: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  cutoff: {
    type: Number,
    default: null,
    min: 0,
    max: 10
  },
  eligibleBranches: {
    type: [String],
    default: ALL_BRANCHES,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
