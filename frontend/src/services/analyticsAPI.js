import { apiClient } from './api';

export const analyticsAPI = {
    // Overview stats
    getOverviewStats: () => apiClient.get('/admin/analytics/overview'),

    // Growth trends
    getUserGrowth: () => apiClient.get('/admin/analytics/user-growth'),
    getUploadGrowth: () => apiClient.get('/admin/analytics/upload-growth'),

    // Content analytics
    getContentBySubject: () => apiClient.get('/admin/analytics/content-by-subject'),
    getUploadByMonth: () => apiClient.get('/admin/analytics/upload-by-month'),

    // Notifications
    getNotificationStats: () => apiClient.get('/admin/analytics/notification-stats'),

    // User management
    getUsers: (search = '', role = 'all', sortBy = 'recent', page = 1, limit = 10, filter = '') =>
        apiClient.get('/admin/analytics/users', {
            params: { search, role, sortBy, page, limit, filter }
        }),

    suspendUser: (userId, isSuspended) =>
        apiClient.patch(`/admin/analytics/users/${userId}/suspend`, { isSuspended }),

    resetUserRole: (userId) =>
        apiClient.patch(`/admin/analytics/users/${userId}/reset-role`),

    getAdminLogs: (userId) =>
        apiClient.get(`/admin/analytics/users/${userId}/logs`)
};
