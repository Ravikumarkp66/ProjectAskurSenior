const mongoose = require('mongoose');

const facultyInsightConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      trim: true,
    },
    minResponseThreshold: {
      type: Number,
      default: 5,
      min: 1,
    },
    defaultMaxCie: {
      type: Number,
      default: 50,
      min: 1,
    },
  },
  {
    timestamps: true,
    collection: 'faculty_insight_configs',
  }
);

module.exports =
  mongoose.models.FacultyInsightConfig ||
  mongoose.model('FacultyInsightConfig', facultyInsightConfigSchema);
