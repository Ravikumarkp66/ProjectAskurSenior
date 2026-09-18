import axios from 'axios';
import { getBaseApiUrl } from './api/apiClient';

const ACADEMIC_CONTENT_BASE_URL = getBaseApiUrl('/v2/academic-content');

export const academicContentClient = axios.create({
    baseURL: ACADEMIC_CONTENT_BASE_URL,
    withCredentials: true
});

const attachToken = (config) => {
    config.headers['x-client-portal'] = 'frontend_3000';
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.timeout = 30000;
    return config;
};

academicContentClient.interceptors.request.use(attachToken);

/**
 * Fetch the curriculum content tree (modules + topics) for an academic subject.
 * @param {string} subjectSlug - Subject slug, code, or identifier
 * @returns {Promise<{ success: boolean, data: { subject: Object, modules: Array } }>}
 */
export const getAcademicContentTree = async (subjectSlug) => {
    if (!subjectSlug || typeof subjectSlug !== 'string' || !subjectSlug.trim()) {
        throw new Error('subjectSlug is required');
    }
    const cleanSlug = encodeURIComponent(subjectSlug.trim().toLowerCase());
    const res = await academicContentClient.get(`/${cleanSlug}`);
    return res.data;
};

/**
 * Fetch the full editorial reading sheet (sections + semantic blocks) for a topic.
 * @param {string} subjectSlug - Subject slug or code
 * @param {string} moduleSlug - Module identifier slug
 * @param {string} topicSlug - Topic identifier slug
 * @returns {Promise<{ success: boolean, data: { subject: Object, module: Object, topic: Object, editorial: Object } }>}
 */
export const getAcademicTopicEditorial = async (subjectSlug, moduleSlug, topicSlug) => {
    if (!subjectSlug || !moduleSlug || !topicSlug) {
        throw new Error('subjectSlug, moduleSlug, and topicSlug are required');
    }
    const cleanSubject = encodeURIComponent(subjectSlug.trim().toLowerCase());
    const cleanModule = encodeURIComponent(moduleSlug.trim().toLowerCase());
    const cleanTopic = encodeURIComponent(topicSlug.trim().toLowerCase());
    const res = await academicContentClient.get(`/${cleanSubject}/${cleanModule}/${cleanTopic}`);
    return res.data;
};
