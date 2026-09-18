import apiClient from './apiClient';

export const evaluationRuleService = {
  getEvaluationRules: async ({ scheme, evaluationGroup, status } = {}) => {
    const params = {
      scheme: scheme || undefined,
      evaluationGroup: evaluationGroup || undefined,
      status: status || undefined
    };
    const response = await apiClient.get('/admin/evaluation-rules', { params });
    return response.data;
  },

  getEvaluationRuleById: async (id) => {
    const response = await apiClient.get(`/admin/evaluation-rules/${id}`);
    return response.data;
  },

  createEvaluationRule: async (data) => {
    const response = await apiClient.post('/admin/evaluation-rules', data);
    return response.data;
  },

  updateEvaluationRule: async (id, data) => {
    const response = await apiClient.put(`/admin/evaluation-rules/${id}`, data);
    return response.data;
  },

  deleteEvaluationRule: async (id) => {
    const response = await apiClient.delete(`/admin/evaluation-rules/${id}`);
    return response.data;
  },

  activateEvaluationRule: async (id) => {
    const response = await apiClient.post(`/admin/evaluation-rules/${id}/activate`);
    return response.data;
  },

  archiveEvaluationRule: async (id) => {
    const response = await apiClient.post(`/admin/evaluation-rules/${id}/archive`);
    return response.data;
  },

  createNewVersion: async (id) => {
    const response = await apiClient.post(`/admin/evaluation-rules/${id}/new-version`);
    return response.data;
  }
};

export default evaluationRuleService;
