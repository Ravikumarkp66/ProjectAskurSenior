import { apiClient } from './apiClient';

export const facultyAPI = {
    getAll: async (params = {}) => {
        try {
            const res = await apiClient.get('/faculty', { params });
            return res.data;
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
            return { success: false, data: [] };
        }
    },

    create: async (data) => {
        try {
            const res = await apiClient.post('/faculty', data);
            return res.data;
        } catch (err) {
            console.error('Failed to create faculty:', err);
            throw err;
        }
    },

    addReview: async (facultyId, reviewData) => {
        try {
            const res = await apiClient.post(`/faculty/${facultyId}/reviews`, reviewData);
            return res.data;
        } catch (err) {
            console.error('Failed to add faculty review:', err);
            throw err;
        }
    }
};
