import apiClient from './apiClient';

export const adminManagementService = {
  getAdmins: async () => {
    const response = await apiClient.get('/admin/admins');
    return response.data;
  },

  createAdmin: async (adminData) => {
    const response = await apiClient.post('/admin/admins', adminData);
    return response.data;
  },

  updateAdmin: async (id, adminData) => {
    const response = await apiClient.put(`/admin/admins/${id}`, adminData);
    return response.data;
  },

  toggleStatus: async (id, status) => {
    const response = await apiClient.patch(`/admin/admins/${id}/status`, { status });
    return response.data;
  },

  deleteAdmin: async (id) => {
    const response = await apiClient.delete(`/admin/admins/${id}`);
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await apiClient.get('/admin/admins/activities', { params });
    return response.data;
  },

  getLeaderboard: async (timeRange = 'all') => {
    const response = await apiClient.get('/admin/admins/leaderboard', { params: { timeRange } });
    return response.data;
  },

  getAdminProfile: async (id, timeRange = 'all') => {
    const response = await apiClient.get(`/admin/admins/${id}/profile`, { params: { timeRange } });
    return response.data;
  }
};

export default adminManagementService;
