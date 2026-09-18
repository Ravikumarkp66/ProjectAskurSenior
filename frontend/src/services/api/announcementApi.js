/**
 * AskUrSenior Plus Announcements — Student API Service
 *
 * Uses the existing frontend apiClient (no second HTTP client).
 * All endpoints are Plus-protected on the backend.
 */
import { apiClient } from './apiClient';

const BASE = '/plus/announcements';

/**
 * Fetch the active announcement feed.
 * @param {{ category?: string, page?: number, limit?: number }} opts
 */
export const getAnnouncements = async ({ category, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (category && category !== 'All') {
        const catMap = { Academic: 'ACADEMIC', Features: 'FEATURE', System: 'SYSTEM' };
        params.category = catMap[category] || category;
    }
    const res = await apiClient.get(BASE, { params });
    return res.data; // { success, data, pagination }
};

/**
 * Mark an announcement as read (idempotent).
 * @param {string} announcementId
 */
export const markAnnouncementRead = async (announcementId) => {
    try {
        await apiClient.post(`${BASE}/${announcementId}/read`);
    } catch {
        // Non-critical: silently swallow read-state errors
    }
};
