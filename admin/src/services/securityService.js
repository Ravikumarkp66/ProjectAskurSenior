import apiClient from './apiClient';

export const securityService = {
  // Super Admin: Overview metrics
  getOverview: async () => {
    const res = await apiClient.get('/admin/security/overview');
    return res.data;
  },

  // Super Admin: Login history logs (paginated)
  getLogs: async (params = {}) => {
    const res = await apiClient.get('/admin/security/logs', { params });
    return res.data;
  },

  // Super Admin: Suspicious logins
  getSuspiciousLogins: async (params = {}) => {
    const res = await apiClient.get('/admin/security/suspicious', { params });
    return res.data;
  },

  // Super Admin: Active sessions
  getActiveSessions: async (params = {}) => {
    const res = await apiClient.get('/admin/security/sessions', { params });
    return res.data;
  },

  // Super Admin: Revoke a specific session
  revokeSession: async (id, reason) => {
    const res = await apiClient.post(`/admin/security/sessions/${id}/revoke`, { reason });
    return res.data;
  },

  // Super Admin: Revoke all active sessions for a user
  revokeAllUserSessions: async (userId, reason) => {
    const res = await apiClient.post(`/admin/security/users/${userId}/revoke-all`, { reason });
    return res.data;
  },

  // Super Admin: Mark a suspicious session safe
  markSafe: async (id) => {
    const res = await apiClient.post(`/admin/security/sessions/${id}/mark-safe`);
    return res.data;
  },

  // Super Admin: Toggle account enabled/disabled
  toggleAccount: async (userId, disable, reason) => {
    const res = await apiClient.post(`/admin/security/users/${userId}/toggle-account`, { disable, reason });
    return res.data;
  },

  // Any Admin: Self-service personal security history
  getMySecurityHistory: async () => {
    const res = await apiClient.get('/admin/security/my-history');
    return res.data;
  }
};

export default securityService;
