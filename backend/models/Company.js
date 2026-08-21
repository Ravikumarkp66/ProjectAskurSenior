const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  logo: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Product', 'Service'],
    required: true,
  },
  cutoff: {
    type: Number,
    default: null,
    min: 0,
    max: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
