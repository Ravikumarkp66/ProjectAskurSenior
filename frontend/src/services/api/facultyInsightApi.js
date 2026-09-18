import { apiClient } from './apiClient';

export const facultyInsightAPI = {
  getAll: async (params = {}) => {
    try {
      const res = await apiClient.get('/faculty-insights', { params });
      return res.data;
    } catch (err) {
      console.error('Failed to fetch faculty insights:', err);
      return { success: false, data: [], minThreshold: 5 };
    }
  },

  getDepartmentSubjects: async (params = {}) => {
    try {
      const res = await apiClient.get('/faculty-insights/subjects', { params });
      return res.data;
    } catch (err) {
      console.error('Failed to fetch department subjects:', err);
      return { success: false, data: [] };
    }
  },

  getSingle: async (facultyId, subjectCode = null) => {
    try {
      const url = subjectCode
        ? `/faculty-insights/${facultyId}?subjectCode=${encodeURIComponent(subjectCode)}`
        : `/faculty-insights/${facultyId}`;
      const res = await apiClient.get(url);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch faculty insight detail:', err);
      throw err;
    }
  },

  submitFeedback: async (feedbackData) => {
    try {
      const res = await apiClient.post('/faculty-insights', feedbackData);
      return res.data;
    } catch (err) {
      console.error('Failed to submit faculty feedback:', err);
      throw err;
    }
  },

  updateFeedback: async (feedbackId, feedbackData) => {
    try {
      const res = await apiClient.put(`/faculty-insights/${feedbackId}`, feedbackData);
      return res.data;
    } catch (err) {
      console.error('Failed to update faculty feedback:', err);
      throw err;
    }
  },

  getAdminConfig: async () => {
    try {
      const res = await apiClient.get('/faculty-insights/admin/config');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch admin config:', err);
      throw err;
    }
  },

  updateAdminConfig: async (configData) => {
    try {
      const res = await apiClient.put('/faculty-insights/admin/config', configData);
      return res.data;
    } catch (err) {
      console.error('Failed to update admin config:', err);
      throw err;
    }
  },

  moderateComment: async (commentId, status) => {
    try {
      const res = await apiClient.patch(`/faculty-insights/admin/comments/${commentId}/status`, { status });
      return res.data;
    } catch (err) {
      console.error('Failed to moderate comment:', err);
      throw err;
    }
  },
};
