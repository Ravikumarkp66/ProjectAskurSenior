import apiClient from './apiClient';

export const analyticsService = {
  /**
   * Fetch overview statistics: totalUsers, liveUsers, totalSubjects, totalFiles, pendingUploads, uploadsThisMonth
   */
  getOverview: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/overview');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch overview analytics:', err);
      throw err;
    }
  },

  /**
   * Fetch user growth trend data (monthly registrations and cumulative counts)
   */
  getUserGrowth: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/user-growth');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch user growth data:', err);
      return { months: [], counts: [] };
    }
  },

  /**
   * Fetch upload growth trend data
   */
  getUploadGrowth: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/upload-growth');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch upload growth data:', err);
      return { months: [], counts: [] };
    }
  },

  /**
   * Fetch content distribution by subject
   */
  getContentBySubject: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/content-by-subject');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch content by subject analytics:', err);
      return { subjects: [], subjectNames: [], notes: [], pyqs: [], questionBanks: [] };
    }
  },

  /**
   * Fetch monthly upload breakdown by content type
   */
  getUploadByMonth: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/upload-by-month');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch upload by month analytics:', err);
      return { months: [], notes: [], pyqs: [], questionBanks: [] };
    }
  },

  /**
   * Fetch notification and report statistics
   */
  getNotificationStats: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/notification-stats');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
      return { pendingUploads: 0, reportCount: 0, flaggedContent: 0, totalNotifications: 0 };
    }
  },

  /**
   * Fetch optimized consolidated dashboard summary
   */
  getDashboardSummary: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/dashboard-summary');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
      return null;
    }
  },

  /**
   * Download user export report as CSV
   */
  exportUsersCSV: async () => {
    const response = await apiClient.get('/admin/analytics/reports/users/export/csv', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `askursenior-users-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  /**
   * Download user export report as PDF
   */
  exportUsersPDF: async () => {
    const response = await apiClient.get('/admin/analytics/reports/users/export/pdf', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `askursenior-users-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};

export default analyticsService;
