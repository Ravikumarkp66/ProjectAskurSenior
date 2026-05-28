/**
 * Calculate attendance percentage
 * @param {number} attended - Number of classes attended
 * @param {number} total - Total number of classes
 * @returns {number} Attendance percentage
 */
const calculateAttendance = (attended, total) => {
  if (!total || total === 0) return 0;
  return parseFloat(((attended / total) * 100).toFixed(2));
};

/**
 * Get current day name (monday, tuesday, etc.)
 * @returns {string} Lowercase day name
 */
const getTodayDayName = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

/**
 * Get subjects scheduled for today from the timetable
 * @param {Object} timetable - The timetable object
 * @returns {Array<string>} List of subjects for today
 */
const getTodaySubjects = (timetable) => {
  if (!timetable) return [];
  const today = getTodayDayName();
  return timetable[today] || [];
};

/**
 * Calculate days left until a specific date
 * @param {Date|string} date - Target date
 * @returns {number} Number of days remaining (0 if date has passed)
 */
const getDaysLeft = (date) => {
  if (!date) return 0;
  const target = new Date(date);
  const now = new Date();
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

module.exports = {
  calculateAttendance,
  getTodayDayName,
  getTodaySubjects,
  getDaysLeft
};
