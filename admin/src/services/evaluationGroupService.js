import apiClient from './apiClient';

export const evaluationGroupService = {
  getEvaluationGroups: async ({ scheme, category, status } = {}) => {
    const params = {
      scheme: scheme || undefined,
      category: category || undefined,
      status: status || undefined
    };
    const response = await apiClient.get('/admin/evaluation-groups', { params });
    return response.data;
  },

  getEvaluationGroupById: async (id) => {
    const response = await apiClient.get(`/admin/evaluation-groups/${id}`);
    return response.data;
  },

  createEvaluationGroup: async (data) => {
    const response = await apiClient.post('/admin/evaluation-groups', data);
    return response.data;
  },

  updateEvaluationGroup: async (id, data) => {
    const response = await apiClient.put(`/admin/evaluation-groups/${id}`, data);
    return response.data;
  },

  deleteEvaluationGroup: async (id) => {
    const response = await apiClient.delete(`/admin/evaluation-groups/${id}`);
    return response.data;
  },

  getAvailableSubjects: async ({ scheme, category, currentGroupId } = {}) => {
    const params = {
      scheme: scheme || undefined,
      category: category || undefined,
      currentGroupId: currentGroupId || undefined
    };
    const response = await apiClient.get('/admin/evaluation-groups/subjects/available', { params });
    return response.data;
  }
};

export default evaluationGroupService;
