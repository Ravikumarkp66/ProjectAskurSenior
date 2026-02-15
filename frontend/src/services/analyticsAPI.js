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
    getUsers: (search = '', role = 'all', sortBy = 'recent') =>
        apiClient.get('/admin/analytics/users', {
            params: { search, role, sortBy }
        }),
    
    togglePremium: (userId, isPremium) =>
        apiClient.patch(`/admin/analytics/users/${userId}/premium`, { isPremium }),
    
    banUser: (userId, isBanned) =>
        apiClient.patch(`/admin/analytics/users/${userId}/ban`, { isBanned }),
    
    resetUserRole: (userId) =>
        apiClient.patch(`/admin/analytics/users/${userId}/reset-role`)
};
