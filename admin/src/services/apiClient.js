import axios from 'axios';

export const getBaseApiUrl = (subPath = '') => {
  let base = '';
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    base = envUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
  } else if (import.meta.env.DEV) {
    base = 'http://localhost:5000/api';
  } else {
    base = '/api';
  }

  if (!subPath) return base;
  const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `${base}${cleanSubPath}`;
};

export const API_BASE_URL = getBaseApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request Interceptor: Attach Admin Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
