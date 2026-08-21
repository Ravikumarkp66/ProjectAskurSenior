import { apiClient } from './api';

/**
 * Academic Setup Service
 */
export const academicAPI = {
  /**
   * Save academic configuration (semester, dates)
   * @param {Object} data - { semester, collegeStartDate, lastWorkingDay, examStartDate, examEndDate }
   */
  saveSetup: (data) => apiClient.post('/academic/setup', data),

  /**
   * Save multiple subjects
   * @param {Array} subjects - Array of subject objects
   */
  saveSubjects: (subjects) => apiClient.post('/academic/subjects', { subjects }),

  /**
   * Save weekly timetable
   * @param {Object} timetable - { monday: [], tuesday: [], ... }
   */
  saveTimetable: (timetable) => apiClient.post('/academic/timetable', timetable),

  /**
   * Finalize setup (phone, whatsapp, priority, todos)
   */
  finalizeSetup: (data) => apiClient.post('/academic/finalize-setup', data),

  /**
   * Reset academic setup
   */
  resetSetup: () => apiClient.delete('/academic/reset-setup'),

  /**
   * Get academic dashboard data
   */
  getDashboard: () => apiClient.get('/academic/dashboard'),

  /**
   * Mark attendance for a specific class
   */
  markAttendance: (data) => apiClient.post('/academic/mark-attendance', data),

  /**
   * Undo attendance record
   */
  undoAttendance: (data) => apiClient.post('/academic/undo-attendance', data),

  /**
   * Add or swap a class on the timetable for a specific date
   */
  addTimetableOverride: (data) => apiClient.post('/academic/timetable-override', data),

  /**
   * Get daily tasks
   */
  getDailyTasks: (date) => apiClient.get(`/academic/daily-tasks?date=${date}`),

  /**
   * Save daily tasks
   */
  saveDailyTasks: (date, tasks) => apiClient.post('/academic/daily-tasks', { date, tasks }),

  /**
   * Get manual academic events
   */
  getAcademicEvents: (params) => apiClient.get('/academic/academic-events', { params }),

  /**
   * Get global academic calendar events
   * @param {Object} params - { academicYear, startDate, endDate, category, scope }
   */
  getCalendarEvents: (params = {}) => apiClient.get('/academic/calendar', { params }),

  /**
   * Save manual academic event
   */
  saveAcademicEvent: (data) => apiClient.post('/academic/academic-events', data),

  /**
   * Delete manual academic event
   */
  deleteAcademicEvent: (id) => apiClient.delete(`/academic/academic-events/${id}`),

  /**
   * Trigger manual WhatsApp report
   */
  triggerWhatsApp: () => apiClient.post('/academic/trigger-whatsapp')
};

export default academicAPI;
