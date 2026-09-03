import apiClient from './apiClient';

export const materialService = {
  getStats: async () => {
    const response = await apiClient.get('/admin/materials/stats');
    return response.data;
  },

  getMaterials: async ({
    page = 1,
    limit = 50,
    search = '',
    materialType = '',
    status = '',
    migrationStatus = '',
    subjectId = '',
    year = '',
    duplicateStatus = '',
    trash = false,
    sortBy = ''
  } = {}) => {
    const params = {
      page,
      limit,
      search: search.trim() || undefined,
      materialType: materialType || undefined,
      status: status || undefined,
      migrationStatus: migrationStatus || undefined,
      subjectId: subjectId || undefined,
      year: year || undefined,
      duplicateStatus: duplicateStatus || undefined,
      trash: trash ? 'true' : undefined,
      sortBy: sortBy || undefined
    };

    const response = await apiClient.get('/admin/materials', { params });
    return response.data;
  },

  getMaterialById: async (id) => {
    const response = await apiClient.get(`/admin/materials/${id}`);
    return response.data;
  },

  getViewUrl: async (id) => {
    const response = await apiClient.get(`/admin/materials/${id}/file`);
    return response.data;
  },

  getDownloadUrl: async (id) => {
    const response = await apiClient.get(`/admin/materials/${id}/file?download=true`);
    return response.data;
  },

  updateMaterial: async (id, data) => {
    const response = await apiClient.put(`/admin/materials/${id}`, data);
    return response.data;
  },

  trashMaterial: async (id) => {
    const response = await apiClient.delete(`/admin/materials/${id}`);
    return response.data;
  },

  restoreMaterial: async (id) => {
    const response = await apiClient.post(`/admin/materials/${id}/restore`);
    return response.data;
  },

  deletePermanent: async (id) => {
    const response = await apiClient.delete(`/admin/materials/${id}?permanent=true`);
    return response.data;
  },

  previewMatch: async (filenames) => {
    const response = await apiClient.post('/admin/materials/preview-match', { filenames });
    return response.data;
  },

  uploadMaterials: async ({
    files,
    defaultSubject = '',
    defaultType = '',
    status = 'Published',
    metadata = [],
    override = false,
    onUploadProgress
  }) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (defaultSubject) formData.append('subject', defaultSubject);
    if (defaultType) formData.append('materialType', defaultType);
    if (status) formData.append('status', status);
    if (metadata && metadata.length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiClient.post(
      `/admin/materials${override ? '?override=true' : ''}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
      }
    );
    return response.data;
  },

  getDuplicates: async () => {
    const response = await apiClient.get('/admin/materials/duplicates');
    return response.data;
  },

  ignoreDuplicate: async (id) => {
    const response = await apiClient.post(`/admin/materials/${id}/ignore-duplicate`);
    return response.data;
  },

  bulkReassign: async (ids, newSubjectId) => {
    const response = await apiClient.post('/admin/materials/bulk-reassign', { ids, newSubjectId });
    return response.data;
  },

  bulkUpdateStatus: async (ids, status) => {
    const response = await apiClient.post('/admin/materials/bulk-status', { ids, status });
    return response.data;
  },

  bulkDelete: async (ids, permanent = false) => {
    const response = await apiClient.post('/admin/materials/bulk-delete', { ids, permanent });
    return response.data;
  }
};

export default materialService;
