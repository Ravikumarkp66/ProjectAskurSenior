const Subject = require('../academic/Subject');
const Timetable = require('../academic/Timetable');
const AcademicConfig = require('../academic/AcademicConfig');

/**
 * Fetches all necessary academic data for a specific user
 * @param {string} userId 
 */
const getDashboardData = async (userId) => {
  const [subjects, timetable, config] = await Promise.all([
    Subject.find({ userId }),
    Timetable.findOne({ userId }),
    AcademicConfig.findOne({ userId })
  ]);

  const today = new Date();
  const dayName = today.toLocaleDateString("en-IN", { weekday: "long" }).toLowerCase();
  
  const todaySubjects = timetable ? (timetable[dayName] || []) : [];
  const formattedDate = today.toLocaleDateString("en-IN", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let daysLeft = null;
  if (config && config.examStartDate) {
    daysLeft = Math.ceil(
      (new Date(config.examStartDate) - today) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    today: formattedDate,
    todaySubjects,
    daysLeft,
    subjects
  };
};

module.exports = {
  getDashboardData
};
