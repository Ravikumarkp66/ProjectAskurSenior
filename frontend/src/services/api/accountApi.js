import { apiClient } from './apiClient';

export const accountAPI = {
    getSummary: () => apiClient.get('/account/summary'),
    getSessions: () => apiClient.get('/account/sessions'),
    revokeOtherSessions: () => apiClient.post('/account/sessions/revoke-others'),
    deleteAccount: (confirmation, password) => apiClient.post('/account/delete', { confirmation, password })
};

export const feedbackAPI = {
    submit: (data) => apiClient.post('/feedback', data),
    getLatest: () => apiClient.get('/feedback/me/latest')
};

export const bugAPI = {
    submit: (data) => apiClient.post('/bugs', data)
};
