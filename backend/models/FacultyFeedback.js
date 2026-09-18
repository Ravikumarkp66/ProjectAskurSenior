const mongoose = require('mongoose');

const facultyFeedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentAccount',
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubjectCms',
      default: null,
      index: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      index: true,
    },

    // Question 01: CIE score
    cieScore: {
      type: Number,
      default: null,
      min: 0,
    },
    cieAvailable: {
      type: Boolean,
      default: true,
    },
    cieMax: {
      type: Number,
      default: 50,
      min: 1,
    },

    // Question 02: NE status (binary)
    receivedNE: {
      type: Boolean,
      required: true,
    },

    // Question 03: Teaching rating (1-5)
    teachingRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Question 04: Recommendation rating (1-5)
    recommendationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional Question 05: Short comment
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },

    // Moderation & publishing status
    status: {
      type: String,
      enum: ['Published', 'Hidden'],
      default: 'Published',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'faculty_feedbacks',
  }
);

// Enforce unique feedback per Student + Faculty + Subject + Academic Year + Semester
facultyFeedbackSchema.index(
  {
    studentId: 1,
    facultyId: 1,
    subjectCode: 1,
    academicYear: 1,
    semester: 1,
  },
  {
    unique: true,
  }
);

facultyFeedbackSchema.index(
  {
    studentId: 1,
    facultyId: 1,
    subjectId: 1,
    academicYear: 1,
    semester: 1,
  },
  {
    unique: true,
    partialFilterExpression: { subjectId: { $type: 'objectId' } },
  }
);

module.exports =
  mongoose.models.FacultyFeedback ||
  mongoose.model('FacultyFeedback', facultyFeedbackSchema);
