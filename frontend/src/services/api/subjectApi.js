import { apiClient } from './apiClient';

const subjectCache = new Map();

export const subjectAPI = {
    getSubjectsByBranch: async (branch, cycle) => {
        const cacheKey = `subjects_${branch}_${cycle || 'any'}`;
        const cached = subjectCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 300000)) {
            return cached.promise;
        }

        const promise = apiClient.get(`/subjects/branch/${branch}`, {
            params: cycle ? { cycle } : {}
        });

        subjectCache.set(cacheKey, { promise, timestamp: Date.now() });
        return promise;
    },
    getAllSubjects: (params) => apiClient.get('/subjects', { params }),
    getSubjectById: (subjectId) => apiClient.get(`/subjects/${subjectId}`),
    getSubjectsByCode: (subjectCode) => apiClient.get(`/subjects/code/${subjectCode}`),
    markQuestionCompleted: (data) => apiClient.post('/subjects/question/complete', data),
    getModuleNotes: (subjectId, moduleNumber) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/notes`),
    getSubjectContent: (subjectId) =>
        apiClient.get(`/subjects/${subjectId}/content`),
    getContentUrl: (subjectId, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/content/${contentType}/${contentId}`),
    getModuleContentUrl: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/content/${contentType}/${contentId}`),
    getFirstYearStats: () => apiClient.get('/subjects/stats/first-year'),
    getYearStats: (year) => apiClient.get(`/subjects/stats/${encodeURIComponent(year)}`)
};
