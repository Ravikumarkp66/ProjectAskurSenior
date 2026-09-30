import apiClient from './apiClient';

/**
 * Service to manage bug reports submitted by students
 */
export const bugService = {
  /**
   * Fetch paginated bug reports with optional filters
   * @param {Object} params - { status, problemType, search, page, limit }
   */
  getBugs: async (params = {}) => {
    const response = await apiClient.get('/bugs', { params });
    return response.data;
  },

  /**
   * Update the status and internal resolution notes of a bug report
   * @param {string} id - Bug report ID
   * @param {Object} data - { status: 'open' | 'in_progress' | 'resolved' | 'closed', adminNotes?: string }
   */
  updateBugStatus: async (id, data) => {
    const response = await apiClient.patch(`/bugs/${id}/status`, data);
    return response.data;
  },

  /**
   * Delete / dismiss a bug report
   * @param {string} id - Bug report ID
   */
  deleteBug: async (id) => {
    const response = await apiClient.delete(`/bugs/${id}`);
    return response.data;
  }
};

export default bugService;
