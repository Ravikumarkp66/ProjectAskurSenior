import apiClient from './apiClient';

/**
 * AskUrSenior Plus Announcements — Admin Service
 *
 * All methods make real HTTP calls to /api/admin/announcements.
 * The previous localStorage/mock implementation has been removed.
 * There is no silent production fallback.
 */

const BASE = '/admin/announcements';

// ── Normalize a backend document to the flat shape the Admin UI expects ─────

const CAT_DISPLAY  = { ACADEMIC: 'Academic', FEATURE: 'Features', SYSTEM: 'System' };
const STAT_DISPLAY = { PUBLISHED: 'Published', DRAFT: 'Draft', SCHEDULED: 'Scheduled', ARCHIVED: 'Archived' };

export const normalizeAnnouncement = (doc) => ({
  id:          doc._id || doc.id,
  title:       doc.title,
  summary:     doc.summary,
  content:     doc.content,
  category:    CAT_DISPLAY[doc.category] || doc.category,
  priority:    doc.priority || 'NORMAL',
  status:      STAT_DISPLAY[doc.status]  || doc.status,
  isPinned:    doc.isPinned,
  publishedAt: doc.publishedAt,
  scheduledAt: doc.scheduledAt,
  expiresAt:   doc.expiresAt,
  createdAt:   doc.createdAt,
  updatedAt:   doc.updatedAt,
  attachment:  doc.attachment
    ? {
        name: doc.attachment.originalName || doc.attachment.name,
        url:  doc.attachment.fileUrl      || doc.attachment.url,
        size: doc.attachment.fileSize     || doc.attachment.size,
        type: doc.attachment.mimeType     || doc.attachment.type
      }
    : null,
  author: doc.authorSnapshot
    ? {
        name:  doc.authorSnapshot.name,
        email: doc.authorSnapshot.email,
        role:  doc.authorSnapshot.role
      }
    : doc.author || { name: 'Admin' }
});

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getStats = async () => {
  const res = await apiClient.get(BASE, { params: { limit: 1 } });
  return res.data.stats || { total: 0, published: 0, scheduled: 0, draft: 0, archived: 0 };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const getAnnouncements = async ({ page = 1, limit = 20, status, category, search } = {}) => {
  const params = { page, limit };

  // Normalize: treat 'All', 'ALL', 'All Categories', 'All Statuses', '' as "no filter"
  const isNoFilter = (val) => !val || val.toLowerCase() === 'all' || val.toLowerCase().startsWith('all ');

  if (!isNoFilter(status))   params.status   = status.toUpperCase();
  if (!isNoFilter(category)) {
    const catMap = { academic: 'ACADEMIC', features: 'FEATURE', system: 'SYSTEM' };
    params.category = catMap[category.toLowerCase()] || category.toUpperCase();
  }
  if (search) params.search = search;

  const res = await apiClient.get(BASE, { params });
  const announcements = (res.data.data || []).map(normalizeAnnouncement);
  return {
    announcements,
    pagination: res.data.pagination,
    stats:      res.data.stats
  };
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createAnnouncement = async (data) => {
  const res = await apiClient.post(BASE, data);
  return normalizeAnnouncement(res.data.data);
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateAnnouncement = async (id, data) => {
  const res = await apiClient.patch(`${BASE}/${id}`, data);
  return normalizeAnnouncement(res.data.data);
};

// ── Publish ───────────────────────────────────────────────────────────────────

export const publishAnnouncement = async (id) => {
  const res = await apiClient.post(`${BASE}/${id}/publish`);
  return normalizeAnnouncement(res.data.data);
};

// ── Archive ───────────────────────────────────────────────────────────────────

export const archiveAnnouncement = async (id) => {
  const res = await apiClient.post(`${BASE}/${id}/archive`);
  return normalizeAnnouncement(res.data.data);
};

// ── Toggle Pin ────────────────────────────────────────────────────────────────

export const togglePin = async (id) => {
  const res = await apiClient.patch(`${BASE}/${id}/pin`);
  return normalizeAnnouncement(res.data.data);
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteAnnouncement = async (id) => {
  await apiClient.delete(`${BASE}/${id}`);
  return { success: true };
};
