import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

    postComment: async (articleId, content) => {
        const response = await api.post(`/articles/${articleId}/comments`, { content });
        return response.data;
    },

    // Admin routes
    createArticle: async (articleData) => {
        const response = await api.post('/articles/create', articleData);
        return response.data;
    }
};
