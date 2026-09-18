const mongoose = require('mongoose');

const PERIOD_DEFINITIONS = [
  { periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530, timeSlot: '08:00-08:50' },
  { periodNumber: 2, name: 'Period 2', startMinute: 530, endMinute: 580, timeSlot: '08:50-09:40' },
  { periodNumber: 3, name: 'Period 3', startMinute: 600, endMinute: 650, timeSlot: '10:00-10:50' },
  { periodNumber: 4, name: 'Period 4', startMinute: 650, endMinute: 700, timeSlot: '10:50-11:40' },
  { periodNumber: 5, name: 'Period 5', startMinute: 760, endMinute: 810, timeSlot: '12:40-13:30' },
  { periodNumber: 6, name: 'Period 6', startMinute: 810, endMinute: 860, timeSlot: '13:30-14:20' },
  { periodNumber: 7, name: 'Period 7', startMinute: 860, endMinute: 910, timeSlot: '14:20-15:10' },
  { periodNumber: 8, name: 'Period 8', startMinute: 910, endMinute: 960, timeSlot: '15:10-16:00' }
];

const BREAK_DEFINITIONS = [
  { name: 'Morning Break', startMinute: 580, endMinute: 600, duration: 20, timeSlot: '09:40-10:00' },
  { name: 'Lunch Break', startMinute: 700, endMinute: 760, duration: 60, timeSlot: '11:40-12:40' }
];

const timetableSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required (1=Monday, 6=Saturday)'],
    min: 1,
    max: 6
  },
  periodNumber: {
    type: Number,
    required: [true, 'Period number is required (1-8)'],
    min: 1,
    max: 8
  },
  startMinute: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  },
  endMinute: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  },
  timeSlot: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSubjectCms',
    default: null
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  room: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  lectureType: {
    type: String,
    enum: ['Theory', 'Lab', 'Lecture', 'Tutorial', 'Seminar', 'Other', 'Free Period'],
    default: 'Theory'
  },
  batchGroup: {
    type: String,
    default: 'ALL'
  },
  sessionGroupId: {
    type: String,
    default: null
  }
}, { _id: false });

const sectionTimetableSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSection',
    required: [true, 'Academic Section reference is required'],
    unique: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College reference is required']
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicProgram',
    required: [true, 'Academic Program reference is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicBatch',
    required: [true, 'Academic Batch reference is required']
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch reference is required']
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Official Semester reference is required']
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft',
    required: true
  },
  slots: {
    type: [timetableSlotSchema],
    default: []
  },
  publishedAt: {
    type: Date,
    default: null
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  collection: 'section_timetables'
});

// Indexes
sectionTimetableSchema.index({ section: 1 }, { unique: true });
sectionTimetableSchema.index({ batch: 1, branch: 1, semester: 1 });
sectionTimetableSchema.index({ college: 1, status: 1 });

module.exports = {
  SectionTimetable: mongoose.models.SectionTimetable || mongoose.model('SectionTimetable', sectionTimetableSchema),
  PERIOD_DEFINITIONS,
  BREAK_DEFINITIONS
};
