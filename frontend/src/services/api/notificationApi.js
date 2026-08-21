import { apiClient } from './apiClient';

export const notificationAPI = {
    getNotifications: (branch, cycle, limit = 20) =>
        apiClient.get('/notifications', {
            params: { branch, cycle, limit }
        }),
    markAsRead: (notificationIds) =>
        apiClient.post('/notifications/read', { notificationIds }),
    markAllAsRead: (branch, cycle) =>
        apiClient.post('/notifications/read-all', null, {
            params: { branch, cycle }
        }),
    createNotification: (data) =>
        apiClient.post('/notifications', data),
    deleteNotification: (notificationId) =>
        apiClient.delete(`/notifications/${notificationId}`)
};
