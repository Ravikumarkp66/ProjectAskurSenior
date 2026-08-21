import { apiClient } from './apiClient';

export const interviewExperiencesAPI = {
    getCompanies: () => apiClient.get('/experiences/companies'),
    getCompanyRoles: (companyId) => apiClient.get(`/experiences/companies/${companyId}/roles`),
    getExperiences: (params) => apiClient.get('/experiences/list', { params }),
    createExperience: (data) => apiClient.post('/experiences/create', data),
    upvoteExperience: (id) => apiClient.post(`/experiences/upvote/${id}`),
    updateExperience: (id, data) => apiClient.put(`/experiences/${id}`, data),
    createCompany: (data) => apiClient.post('/experiences/admin/companies', data)
};

export const campusHubAPI = {
    getFeed: (params) => apiClient.get('/campus-hub/feed', { params }),
    getAnnouncement: (id) => apiClient.get(`/campus-hub/announcements/${id}`),
    createAnnouncement: (data) => apiClient.post('/campus-hub/announcements', data),
    pinAnnouncement: (id) => apiClient.patch(`/campus-hub/announcements/${id}/pin`),
    deleteAnnouncement: (id) => apiClient.delete(`/campus-hub/announcements/${id}`),
    createListing: (data) => apiClient.post('/campus-hub/marketplace', data),
    updateListingStatus: (id, status) => apiClient.patch(`/campus-hub/marketplace/${id}/status`, { status }),
    deleteListing: (id) => apiClient.delete(`/campus-hub/marketplace/${id}`),
    getUnreadCount: () => apiClient.get('/campus-hub/unread-count'),
};

export const landingPageAPI = {
    getLandingPage: () => apiClient.get('/landing-page'),
};

export const testimonialAPI = {
    getRandom: (limit = 24) => apiClient.get('/testimonials/random', { params: { limit } }),
    getPaginated: (params) => apiClient.get('/testimonials', { params }),
    getFeatured: () => apiClient.get('/testimonials/featured'),
};

export const faqAPI = {
    getGrouped: () => apiClient.get('/faqs'),
};

export const contributorAPI = {
    getPublic: () => apiClient.get('/contributors'),
};

export const subscriptionAPI = {
    getPublicPage: () => apiClient.get('/subscription/public-page'),
    getPlans: () => apiClient.get('/subscription/plans'),
    getFeatures: () => apiClient.get('/subscription/features'),
    validateCoupon: (code, planCode) => apiClient.post('/subscription/coupon/validate', { code, planCode }),
};
