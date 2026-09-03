import apiClient from './apiClient';

export const subjectService = {
  getStats: async () => {
    const response = await apiClient.get('/admin/subjects/stats');
    return response.data;
  },

  getSubjects: async ({
    page = 1,
    limit = 50,
    search = '',
    year = '',
    branch = '',
    scheme = '',
    status = ''
  } = {}) => {
    const params = {
      page,
      limit,
      search: search.trim() || undefined,
      year: year || undefined,
      branch: branch || undefined,
      scheme: scheme || undefined,
      status: status || undefined
    };

    const response = await apiClient.get('/admin/subjects', { params });
    return response.data;
  },

  getSubjectById: async (id) => {
    const response = await apiClient.get(`/admin/subjects/${id}`);
    return response.data;
  },

  createSubject: async (data) => {
    const response = await apiClient.post('/admin/subjects', data);
    return response.data;
  },

  updateSubject: async (id, data) => {
    const response = await apiClient.put(`/admin/subjects/${id}`, data);
    return response.data;
  },

  deleteSubject: async (id, hard = false) => {
    const response = await apiClient.delete(`/admin/subjects/${id}${hard ? '?hard=true' : ''}`);
    return response.data;
  },

  getBranches: async () => {
    const response = await apiClient.get('/branches/public');
    return response.data;
  },

  getSchemes: async () => {
    const response = await apiClient.get('/admin/schemes');
    return response.data;
  }
};

export default subjectService;
