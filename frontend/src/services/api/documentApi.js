import { apiClient } from './apiClient';

export const uploadAPI = {
    uploadSubjectFiles: (subjectId, contentType, items, options = {}) => {
        const formData = new FormData();
        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });
        return apiClient.post(`/upload/${subjectId}/${contentType}`, formData, {
            timeout: 300000,
            onUploadProgress: options.onUploadProgress
        });
    },
    uploadSubjectZip: (subjectId, zipFile, options = {}) => {
        const formData = new FormData();
        formData.append('file', zipFile);
        return apiClient.post(`/upload/zip/${subjectId}`, formData, {
            timeout: 300000,
            onUploadProgress: options.onUploadProgress
        });
    },
    deleteSubjectContent: (subjectId, contentType, contentId) =>
        apiClient.delete(`/upload/content/${subjectId}/${contentType}/${contentId}`),
    deleteModuleContent: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.delete(`/upload/module-content/${subjectId}/${moduleNumber}/${contentType}/${contentId}`),
    bulkUploadSubjectContent: (subjectCode, contentType, items) => {
        const formData = new FormData();
        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });
        return apiClient.post(`/upload/bulk/content/${subjectCode}/${contentType}`, formData, {
            timeout: 300000
        });
    },
    bulkDeleteSubjectContent: (subjectCode, contentType, title) =>
        apiClient.delete(`/upload/bulk/content/${subjectCode}/${contentType}/${encodeURIComponent(title)}`),
    bulkDeleteModuleContent: (subjectCode, moduleNumber, contentType, title) =>
        apiClient.delete(`/upload/bulk/module-content/${subjectCode}/${moduleNumber}/${contentType}/${encodeURIComponent(title)}`)
};

export const userUploadAPI = {
    createUpload: (formData, options = {}) => apiClient.post('/user-uploads', formData, {
        timeout: 300000,
        onUploadProgress: options.onUploadProgress
    }),
    getUploads: (status = 'pending') =>
        apiClient.get('/user-uploads', { params: { status } }),
    getUploadUrl: (uploadId) =>
        apiClient.get(`/user-uploads/${uploadId}/url`),
    approveUpload: (uploadId) =>
        apiClient.post(`/user-uploads/${uploadId}/approve`),
    deleteUpload: (uploadId) =>
        apiClient.delete(`/user-uploads/${uploadId}`),
    getUploadById: (uploadId) =>
        apiClient.get(`/documents/${uploadId}`),
    updateUpload: (uploadId, data) =>
        apiClient.patch(`/documents/${uploadId}`, data),
    restoreUpload: (uploadId) =>
        apiClient.post(`/documents/${uploadId}/restore`),
    permanentDeleteUpload: (uploadId) =>
        apiClient.delete(`/documents/${uploadId}/permanent`)
};

export const documentsAPI = {
    uploadDocument: (data, items, options = {}) => {
        const formData = new FormData();
        
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });

        return apiClient.post('/documents/upload', formData, {
            timeout: 300000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: options.onUploadProgress
        });
    },
    deleteDocument: (id) => apiClient.delete(`/documents/${id}/permanent`),
    getBranches: () => apiClient.get('/documents/branches'),
    getMaterialsOverview: (params) => apiClient.get('/documents/materials-overview', { params }),
};
