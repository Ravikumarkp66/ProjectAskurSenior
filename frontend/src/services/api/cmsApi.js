import { apiClient } from './apiClient';

export const lookupAPI = {
    getPrograms: () => apiClient.get('/lookups/programs'),
    getBranches: (programId) => apiClient.get('/lookups/branches', { params: programId ? { programId } : {} }),
    getSemesters: (programId) => apiClient.get('/lookups/semesters', { params: programId ? { programId } : {} }),
    getMaterialTypes: () => apiClient.get('/lookups/material-types'),
    getSchemes: () => apiClient.get('/lookups/schemes'),
};

export const branchAPI = {
    getPublic: () => apiClient.get('/branches/public'),
};

export const adminSubjectsAPI = {
    getStats: () => apiClient.get('/admin/subjects/stats'),
    getAll: (params) => apiClient.get('/admin/subjects', { params }),
    getById: (id) => apiClient.get(`/admin/subjects/${id}`),
    create: (data) => apiClient.post('/admin/subjects', data),
    update: (id, data) => apiClient.put(`/admin/subjects/${id}`, data),
    delete: (id) => apiClient.delete(`/admin/subjects/${id}`),
    duplicate: (id) => apiClient.post(`/admin/subjects/${id}/duplicate`),
};

export const adminSchemesAPI = {
    getAll: () => apiClient.get('/admin/schemes'),
    create: (data) => apiClient.post('/admin/schemes'),
};

export const adminMaterialsAPI = {
    getStats: () => apiClient.get('/admin/materials/stats'),
    getHealthStats: () => apiClient.get('/admin/materials/health-stats'),
    getDuplicatesList: () => apiClient.get('/admin/materials/duplicates'),
    getAll: (params) => apiClient.get('/admin/materials', { params }),
    getById: (id) => apiClient.get(`/admin/materials/${id}`),
    getFileUrl: (id, isDownload = false) => apiClient.get(`/admin/materials/${id}/file`, { params: { download: isDownload } }),
    create: (formData, override = false) => apiClient.post(`/admin/materials?override=${override}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
    }),
    update: (id, data) => apiClient.put(`/admin/materials/${id}`, data),
    delete: (id, permanent = false) => apiClient.delete(`/admin/materials/${id}`, { params: { permanent } }),
    bulkDelete: (ids, permanent = false) => apiClient.post('/admin/materials/bulk-delete', { ids, permanent }),
    restore: (id) => apiClient.post(`/admin/materials/${id}/restore`),
    ignoreDuplicate: (id) => apiClient.post(`/admin/materials/${id}/ignore-duplicate`),
};

export const cmsAPI = {
    getSubjects: (params) => apiClient.get('/cms/subjects', { params }),
    getSubjectMaterials: (slug) => apiClient.get(`/cms/subjects/${slug}/materials`),
    trackDownload: (id) => apiClient.post(`/cms/materials/${id}/download`),
};

export const branchesAPI = {
    getPublic: () => apiClient.get('/branches/public'),
    getAdmin: () => apiClient.get('/branches/admin'),
    create: (data) => apiClient.post('/branches/admin', data),
    update: (id, data) => apiClient.put(`/branches/admin/${id}`, data),
    delete: (id) => apiClient.delete(`/branches/admin/${id}`),
};
