import apiClient from './apiClient';

export const interviewAdminService = {
  // Experience Endpoints
  getExperiences: async ({
    page = 1,
    limit = 20,
    status = 'all',
    search = '',
    companyId = '',
    role = '',
    batch = '',
    selected = '',
    difficulty = '',
    sort = 'newest'
  } = {}) => {
    const params = {
      page,
      limit,
      status: status || undefined,
      role: (search.trim() || role.trim()) || undefined,
      companyId: companyId || undefined,
      batch: batch || undefined,
      selected: selected !== '' && selected !== undefined ? selected : undefined,
      difficulty: difficulty || undefined,
      sort: sort || undefined
    };

    const response = await apiClient.get('/experiences/list', { params });
    return response.data;
  },

  getExperienceById: async (id) => {
    const response = await apiClient.get(`/experiences/${id}`);
    return response.data;
  },

  createExperience: async (data) => {
    const response = await apiClient.post('/experiences/create', data);
    return response.data;
  },

  updateExperience: async (id, data) => {
    const response = await apiClient.put(`/experiences/${id}`, data);
    return response.data;
  },

  updateExperienceStatus: async (id, status, reason = '') => {
    const response = await apiClient.patch(`/experiences/${id}/status`, { status, reason });
    return response.data;
  },

  archiveExperience: async (id) => {
    const response = await apiClient.delete(`/experiences/${id}`);
    return response.data;
  },

  // Company Endpoints
  getCompanies: async () => {
    const response = await apiClient.get('/experiences/companies');
    return response.data;
  },

  createCompany: async (data) => {
    const response = await apiClient.post('/experiences/admin/companies', data);
    return response.data;
  },

  updateCompany: async (id, data) => {
    const response = await apiClient.put(`/experiences/admin/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await apiClient.delete(`/experiences/admin/companies/${id}`);
    return response.data;
  }
};

export default interviewAdminService;
