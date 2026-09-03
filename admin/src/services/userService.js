import apiClient from './apiClient';

export const userService = {
  getUsers: async ({ page = 1, limit = 50, search = '', sortBy = 'recent', filter = '' } = {}) => {
    try {
      const response = await apiClient.get('/admin/analytics/users', {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          sortBy,
          filter: filter || undefined,
          incomplete: filter === 'incomplete' ? 'true' : undefined
        }
      });
      return response.data;
    } catch (err) {
      // Fallback to /auth/users if analytics endpoint is not available
      if (err.response?.status === 404) {
        const fallbackRes = await apiClient.get('/auth/users');
        const rawUsers = fallbackRes.data || [];
        let filtered = rawUsers;

        if (filter === 'incomplete') {
          filtered = filtered.filter(u =>
            !u.name || !u.name.trim() ||
            !u.usn || !u.usn.trim() ||
            !u.email || !u.email.trim() ||
            !u.createdAt ||
            !u.lastActiveAt
          );
        }

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(u =>
            (u.name && u.name.toLowerCase().includes(s)) ||
            (u.usn && u.usn.toLowerCase().includes(s)) ||
            (u.email && u.email.toLowerCase().includes(s)) ||
            (u.username && u.username.toLowerCase().includes(s))
          );
        }

        const total = filtered.length;
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + limit);

        return {
          users: paginated,
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          summary: {
            totalUsers: rawUsers.length,
            liveUsers: 0,
            recentlyActiveCount: 0,
            incompleteCount: rawUsers.filter(u => !u.name?.trim() || !u.usn?.trim() || !u.email?.trim() || !u.createdAt || !u.lastActiveAt).length
          }
        };
      }
      throw err;
    }
  }
};

export default userService;
