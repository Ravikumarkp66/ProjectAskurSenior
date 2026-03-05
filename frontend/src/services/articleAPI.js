import axios from 'axios';

// Dev: localhost:5000 via Vite proxy
// Production: VITE_API_URL (no /api suffix) + '/api', or relative '/api' via vercel.json proxy
const API_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Force reload or redirect to login could go here if needed
        }
        return Promise.reject(error);
    }
);

export const articleAPI = {
    // Public routes
    getArticles: async (search = '') => {
        const response = await api.get(`/articles${search ? `?search=${search}` : ''}`);
        return response.data;
    },

    getArticleBySlug: async (slug) => {
        const response = await api.get(`/articles/${slug}`);
        return response.data;
    },

    getComments: async (articleId) => {
        const response = await api.get(`/articles/${articleId}/comments`);
        return response.data;
    },

    // Protected routes
    reactToArticle: async (articleId, type) => {
        const response = await api.post(`/articles/${articleId}/react`, { type });
        return response.data;
    },

    getReactionStatus: async (articleId) => {
        const response = await api.get(`/articles/${articleId}/reaction-status`);
        return response.data;
    },

    postComment: async (articleId, content) => {
        const response = await api.post(`/articles/${articleId}/comments`, { content });
        return response.data;
    },

    updateComment: async (commentId, content) => {
        const response = await api.put(`/articles/comments/${commentId}`, { content });
        return response.data;
    },

    deleteComment: async (commentId) => {
        const response = await api.delete(`/articles/comments/${commentId}`);
        return response.data;
    },

    // Admin routes
    createArticle: async (articleData) => {
        const response = await api.post('/articles/create', articleData);
        return response.data;
    }
};
