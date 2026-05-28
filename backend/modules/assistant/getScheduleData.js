const Subject = require('../academic/Subject');
const Timetable = require('../academic/Timetable');
const AcademicConfig = require('../academic/AcademicConfig');
const User = require('../../models/User');

const getDayName = (date) => {
  return date.toLocaleDateString("en-IN", { weekday: "long" }).toLowerCase();
};

const getScheduleForDate = async (userId, date) => {
  const [user, timetable, config, subjects] = await Promise.all([
    User.findById(userId),
    Timetable.findOne({ userId }),
    AcademicConfig.findOne({ userId }),
    Subject.find({ userId })
  ]);

  const dayName = getDayName(date);
  const rawSchedule = timetable ? (timetable[dayName] || []) : [];
  
  // Backward compatibility: handle if schedule is just array of strings
  const schedule = rawSchedule.map(item => {
    if (typeof item === 'string') return { subject: item, start: '', end: '' };
    return item;
  });

  const daysLeft = config && config.examStartDate 
    ? Math.ceil((new Date(config.examStartDate) - date) / (1000 * 60 * 60 * 24))
    : null;

  return {
    user,
    date: date.toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }),
    dayName: date.toLocaleDateString("en-IN", { weekday: "long" }),
    schedule,
    daysLeft,
    subjects: subjects.map(s => ({
      subjectName: s.subjectName,
      attendedClasses: s.attendedClasses,
      totalClasses: s.totalClasses
    })),
    todos: user ? user.todos : []
  };
};

exports.getTodaySchedule = async (userId) => {
  return await getScheduleForDate(userId, new Date());
};

exports.getTomorrowSchedule = async (userId) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return await getScheduleForDate(userId, tomorrow);
};
