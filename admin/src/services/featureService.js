import apiClient from './apiClient';

export const featureService = {
  /**
   * Fetch all registered features and summary statistics.
   */
  getFeatures: async ({ category = 'ALL', access = 'ALL', search = '' } = {}) => {
    const params = {};
    if (category && category !== 'ALL') params.category = category;
    if (access && access !== 'ALL') params.access = access;
    if (search && search.trim()) params.search = search.trim();

    const response = await apiClient.get('/admin/features', { params });
    return response.data;
  },

  /**
   * Fetch a single feature configuration by key.
   */
  getFeature: async (key) => {
    const response = await apiClient.get(`/admin/features/${key}`);
    return response.data;
  },

  /**
   * Update feature configuration (access tier, previewEnabled, enabled, description).
   */
  updateFeature: async (key, updates) => {
    const response = await apiClient.patch(`/admin/features/${key}`, updates);
    return response.data;
  }
};

export default featureService;