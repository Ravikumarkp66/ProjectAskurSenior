const mongoose = require('mongoose');

const DEFAULT_PERIODS = [
  { id: 'p_1', periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530, timeSlot: '08:00-08:50', saturdayAvailable: true, status: 'Active', order: 1 },
  { id: 'p_2', periodNumber: 2, name: 'Period 2', startMinute: 530, endMinute: 580, timeSlot: '08:50-09:40', saturdayAvailable: true, status: 'Active', order: 2 },
  { id: 'p_3', periodNumber: 3, name: 'Period 3', startMinute: 600, endMinute: 650, timeSlot: '10:00-10:50', saturdayAvailable: true, status: 'Active', order: 4 },
  { id: 'p_4', periodNumber: 4, name: 'Period 4', startMinute: 650, endMinute: 700, timeSlot: '10:50-11:40', saturdayAvailable: true, status: 'Active', order: 5 },
  { id: 'p_5', periodNumber: 5, name: 'Period 5', startMinute: 760, endMinute: 810, timeSlot: '12:40-13:30', saturdayAvailable: false, status: 'Active', order: 7 },
  { id: 'p_6', periodNumber: 6, name: 'Period 6', startMinute: 810, endMinute: 860, timeSlot: '13:30-14:20', saturdayAvailable: false, status: 'Active', order: 8 },
  { id: 'p_7', periodNumber: 7, name: 'Period 7', startMinute: 860, endMinute: 910, timeSlot: '14:20-15:10', saturdayAvailable: false, status: 'Active', order: 9 },
  { id: 'p_8', periodNumber: 8, name: 'Period 8', startMinute: 910, endMinute: 960, timeSlot: '15:10-16:00', saturdayAvailable: false, status: 'Active', order: 10 }
];

const DEFAULT_BREAKS = [
  { id: 'brk_morning', name: 'Morning Break', startMinute: 580, endMinute: 600, duration: 20, timeSlot: '09:40-10:00', afterPeriod: 2, status: 'Active', order: 3 },
  { id: 'brk_lunch', name: 'Lunch Break', startMinute: 700, endMinute: 760, duration: 60, timeSlot: '11:40-12:40', afterPeriod: 4, status: 'Active', order: 6 }
];

const DEFAULT_WORKING_DAYS = [
  { dayOfWeek: 1, dayName: 'Monday', status: 'Full Day', maxPeriods: 8 },
  { dayOfWeek: 2, dayName: 'Tuesday', status: 'Full Day', maxPeriods: 8 },
  { dayOfWeek: 3, dayName: 'Wednesday', status: 'Full Day', maxPeriods: 8 },
  { dayOfWeek: 4, dayName: 'Thursday', status: 'Full Day', maxPeriods: 8 },
  { dayOfWeek: 5, dayName: 'Friday', status: 'Full Day', maxPeriods: 8 },
  { dayOfWeek: 6, dayName: 'Saturday', status: 'Half Day', maxPeriods: 4 },
  { dayOfWeek: 7, dayName: 'Sunday', status: 'Non-Working', maxPeriods: 0 }
];

const workingDaySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  dayName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Full Day', 'Half Day', 'Non-Working', 'Holiday'],
    default: 'Full Day',
    required: true
  },
  maxPeriods: {
    type: Number,
    min: 0,
    max: 20,
    default: 8
  }
}, { _id: false });

const breakSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => 'brk_' + Math.random().toString(36).substring(2, 9)
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startMinute: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  },
  endMinute: {
    type: Number,
    min: 0,
    max: 1439
  },
  duration: {
    type: Number,
    min: 1,
    max: 180
  },
  timeSlot: {
    type: String
  },
  afterPeriod: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Retired'],
    default: 'Active'
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const periodSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => 'p_' + Math.random().toString(36).substring(2, 9)
  },
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  name: {
    type: String,
    required: true
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
  saturdayAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Retired'],
    default: 'Active'
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const timelineItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['period', 'break'],
    required: true
  },
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  startMinute: {
    type: Number,
    required: true
  },
  endMinute: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  saturdayAvailable: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Retired'],
    default: 'Active'
  }
}, { _id: false });

function buildTimeline(periods = [], breaks = []) {
  const items = [];
  const formatTime = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  for (const p of periods) {
    const start = Number(p.startMinute);
    const end = Number(p.endMinute);
    const dur = end - start;
    items.push({
      type: 'period',
      id: p.id || `p_${p.periodNumber || items.length + 1}`,
      name: p.name || `Period ${p.periodNumber || items.length + 1}`,
      order: p.order || p.periodNumber || 0,
      startTime: formatTime(start),
      endTime: formatTime(end),
      startMinute: start,
      endMinute: end,
      duration: dur,
      enabled: p.status !== 'Retired',
      saturdayAvailable: Boolean(p.saturdayAvailable !== false),
      status: p.status || 'Active'
    });
  }

  for (const b of breaks) {
    const start = Number(b.startMinute);
    const end = Number(b.endMinute || (start + (b.duration || 15)));
    const dur = end - start;
    items.push({
      type: 'break',
      id: b.id || `brk_${items.length + 1}`,
      name: b.name || 'Break',
      order: b.order || 0,
      startTime: formatTime(start),
      endTime: formatTime(end),
      startMinute: start,
      endMinute: end,
      duration: dur,
      enabled: b.status !== 'Retired',
      saturdayAvailable: false,
      status: b.status || 'Active'
    });
  }

  // Sort chronologically by startMinute
  items.sort((a, b) => a.startMinute - b.startMinute);
  items.forEach((item, idx) => {
    item.order = idx + 1;
  });
  return items;
}

/**
 * Dynamically computes N teaching periods from daily schedule timings and breaks
 * (identical to student-academics settings algorithm)
 */
function generatePeriodsFromConfig({
  collegeStartMinute = 480,
  collegeEndMinute = 960,
  classDuration = 50,
  breaks = []
}) {
  const periods = [];
  const start = Number(collegeStartMinute ?? 480);
  const end = Number(collegeEndMinute ?? 960);
  const duration = Number(classDuration ?? 50);

  const normalizedBreaks = (breaks || []).map(b => {
    const s = Number(b.startMinute);
    const dur = Number(b.duration || (b.endMinute ? b.endMinute - s : 15));
    const e = Number(b.endMinute || (s + dur));
    return {
      name: b.name || 'Break',
      startMinute: s,
      endMinute: e,
      duration: dur
    };
  }).sort((a, b) => a.startMinute - b.startMinute);

  const formatTime = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  let current = start;
  let pNum = 1;

  while (current + duration <= end) {
    // Check if current falls in a break
    const activeBreak = normalizedBreaks.find(b => current >= b.startMinute && current < b.endMinute);
    if (activeBreak) {
      current = activeBreak.endMinute;
      continue;
    }

    // Check if a break interrupts this period
    const upcomingBreak = normalizedBreaks.find(b => b.startMinute > current && b.startMinute < current + duration);
    if (upcomingBreak) {
      current = upcomingBreak.endMinute;
      continue;
    }

    const periodEnd = current + duration;
    periods.push({
      periodNumber: pNum,
      name: `Period ${pNum}`,
      startMinute: current,
      endMinute: periodEnd,
      timeSlot: `${formatTime(current)}-${formatTime(periodEnd)}`
    });

    current = periodEnd;
    pNum++;
  }

  return periods;
}

const timetableStructureSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College reference is required'],
    unique: true
  },
  name: {
    type: String,
    default: 'SIT Institutional Bell Schedule',
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: true
  },
  collegeStartMinute: {
    type: Number,
    default: 480, // 08:00 AM
    min: 0,
    max: 1439
  },
  collegeEndMinute: {
    type: Number,
    default: 960, // 04:00 PM (16:00)
    min: 0,
    max: 1439
  },
  classDuration: {
    type: Number,
    default: 50,
    min: 15,
    max: 180
  },
  labDuration: {
    type: Number,
    default: 100,
    min: 30,
    max: 360
  },
  workingDays: {
    type: [workingDaySchema],
    default: DEFAULT_WORKING_DAYS
  },
  breaks: {
    type: [breakSchema],
    default: DEFAULT_BREAKS
  },
  periods: {
    type: [periodSchema],
    default: DEFAULT_PERIODS
  },
  timeline: {
    type: [timelineItemSchema],
    default: () => buildTimeline(DEFAULT_PERIODS, DEFAULT_BREAKS)
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  collection: 'timetable_structures'
});

timetableStructureSchema.index({ college: 1 }, { unique: true });

module.exports = {
  TimetableStructure: mongoose.models.TimetableStructure || mongoose.model('TimetableStructure', timetableStructureSchema),
  DEFAULT_PERIODS,
  DEFAULT_BREAKS,
  DEFAULT_WORKING_DAYS,
  buildTimeline,
  generatePeriodsFromConfig
};
