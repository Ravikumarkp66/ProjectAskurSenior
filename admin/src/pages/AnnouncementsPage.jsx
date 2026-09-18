import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, Megaphone, Calendar, User, FileText, Download, 
  Pin, Eye, Plus, Search, Trash2, Edit, Check, 
  AlertTriangle, ArrowLeft, Clock, Archive, RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  getAnnouncements,
  getStats,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  togglePin as togglePinApi,
  deleteAnnouncement
} from '../services/announcementAdminService';

const CATEGORIES = ['Academic', 'Features', 'System'];
const STATUSES = ['All', 'Published', 'Draft', 'Scheduled', 'Archived'];

export const AnnouncementsPage = () => {
  const { admin } = useAdminAuth();

  // Data & Stats State
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search State
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form Modal State: null | { mode: 'create' | 'edit', data: object }
  const [formModal, setFormModal] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Student-Facing Preview Modal State: null | announcement object
  const [previewModal, setPreviewModal] = useState(null);

  // Delete Confirmation Modal State: null | announcement object
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch Announcements & Stats
  const fetchData = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const listData = await getAnnouncements({
        page: targetPage,
        limit,
        search: activeSearch,
        status: selectedStatus,
        category: selectedCategory
      });

      if (listData) {
        setAnnouncements(listData.announcements || []);
        setStats(listData.stats || { total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 });
        setTotalPages(listData.pagination?.totalPages || 1);
        setTotalCount(listData.pagination?.total || 0);
        setPage(listData.pagination?.page || targetPage);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Error loading announcements. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [limit, activeSearch, selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  // Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedStatus('All');
    setSelectedCategory('All');
    setPage(1);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormError(null);
    setFormModal({
      mode: 'create',
      data: {
        title: '',
        category: 'Academic',
        summary: '',
        content: '',
        status: 'Published',
        isPinned: false,
        scheduledAt: '',
        expiresAt: '',
        attachmentName: ''
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setFormError(null);
    setFormModal({
      mode: 'edit',
      id: item.id,
      data: {
        title: item.title,
        category: item.category,
        summary: item.summary || '',
        content: item.content,
        status: item.status,
        isPinned: !!item.isPinned,
        scheduledAt: item.scheduledAt ? item.scheduledAt.substring(0, 16) : '',
        expiresAt: item.expiresAt ? item.expiresAt.substring(0, 16) : '',
        attachmentName: item.attachment?.name || ''
      }
    });
  };

  // Save Announcement (Create / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formModal) return;

    if (!formModal.data.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formModal.data.content.trim()) {
      setFormError('Content is required');
      return;
    }

    // Map display-friendly categories/statuses to backend enum values
    const catMap   = { Academic: 'ACADEMIC', Features: 'FEATURE', System: 'SYSTEM' };
    const statMap  = { Published: 'PUBLISHED', Draft: 'DRAFT', Scheduled: 'SCHEDULED', Archived: 'ARCHIVED' };
    const payload  = {
      ...formModal.data,
      category: catMap[formModal.data.category] || formModal.data.category,
      status:   statMap[formModal.data.status]   || formModal.data.status,
      attachment: formModal.data.attachmentName
        ? { originalName: formModal.data.attachmentName, fileUrl: formModal.data.attachmentUrl || '', fileSize: 0 }
        : null
    };
    delete payload.attachmentName;
    delete payload.attachmentUrl;

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (formModal.mode === 'create') {
        await createAnnouncement(payload);
      } else {
        await updateAnnouncement(formModal.id, payload);
      }

      setFormModal(null);
      fetchData(page);
    } catch (err) {
      console.error('Save failed:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save announcement';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Announcement
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteAnnouncement(deleteModal.id);
      setDeleteModal(null);
      fetchData(page);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  // Quick Action: Toggle Pin
  const handleTogglePin = async (item) => {
    try {
      await togglePinApi(item.id);
      fetchData(page);
    } catch (err) {
      console.error('Pin toggle failed:', err);
    }
  };

  // Quick Action: Change Status (Publish / Archive)
  const handleStatusChange = async (item, newStatus) => {
    try {
      if (newStatus === 'Published' || newStatus === 'PUBLISHED') {
        await publishAnnouncement(item.id);
      } else if (newStatus === 'Archived' || newStatus === 'ARCHIVED') {
        await archiveAnnouncement(item.id);
      } else {
        await updateAnnouncement(item.id, { status: newStatus.toUpperCase() });
      }
      fetchData(page);
    } catch (err) {
      console.error('Status change failed:', err);
    }
  };

  const hasActiveFilters = activeSearch || selectedStatus !== 'All' || selectedCategory !== 'All';

  // Format helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* ── TOP SECTION: TITLE, STATS & ADD BUTTON ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Announcements</span>
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span>Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>Published: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.published}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>Scheduled: <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.scheduled}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>Drafts: <span className="font-semibold text-gray-800 dark:text-zinc-300">{stats.draft}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>Archived: <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.archived}</span></span>
            </div>
          </div>

          <div className="pt-1 sm:pt-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="w-full sm:w-auto rounded-none border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700 font-sans cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ New Announcement</span>
            </button>
          </div>
        </div>

        {/* ── TOOLBAR: SEARCH & DROPDOWN FILTERS ── */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
            <label htmlFor="announcement-search" className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
              Search:
            </label>
            <input
              id="announcement-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Title, summary or content..."
              className="flex-1 sm:w-60 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            />
            <button
              type="submit"
              className="rounded-none border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 font-sans cursor-pointer"
            >
              Search
            </button>
          </form>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <label htmlFor="status-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
              Status:
            </label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <label htmlFor="category-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
              Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <>
              <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-blue-600 hover:underline dark:text-blue-400 font-sans cursor-pointer text-xs"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN ANNOUNCEMENTS TABLE (CSES ACADEMIC STYLE) ── */}
      <div className="pt-1">
        {loading ? (
          <div className="py-8 text-xs text-gray-600 dark:text-gray-400 font-mono flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
            <span>Loading announcements...</span>
          </div>
        ) : error ? (
          <div className="py-4 text-xs text-red-600 dark:text-red-400 font-mono">
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="border border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center bg-gray-50/50 dark:bg-zinc-900/30">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 mx-auto mb-2">
              <Megaphone size={18} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              No announcements found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm mx-auto font-mono">
              {hasActiveFilters 
                ? 'Try adjusting your search query or status filter.' 
                : 'Create your first Plus announcement to keep students informed.'}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-none border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 cursor-pointer"
              >
                + New Announcement
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-left text-xs text-gray-900 dark:border-zinc-700 dark:text-gray-200">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                  <th className="border-r border-gray-300 px-2 py-1 font-semibold dark:border-zinc-700 w-10 text-center text-gray-500 dark:text-gray-400 font-mono">#</th>
                  <th className="border-r border-gray-300 px-2 py-1 font-semibold dark:border-zinc-700 w-12 text-center text-gray-500 dark:text-gray-400 font-mono">Pin</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Announcement</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28">Category</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28 text-center">Status</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-32 font-mono">Date</th>
                  <th className="px-2.5 py-1 font-semibold w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowNumber = (page - 1) * limit + idx + 1;

                  // Status badge helper
                  const renderStatusBadge = (status) => {
                    switch (status) {
                      case 'Published':
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Published
                          </span>
                        );
                      case 'Scheduled':
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Scheduled
                          </span>
                        );
                      case 'Draft':
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Draft
                          </span>
                        );
                      case 'Archived':
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Archived
                          </span>
                        );
                      default:
                        return status;
                    }
                  };

                  return (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-gray-200 transition-colors dark:border-zinc-800 ${
                        isEven ? 'bg-white dark:bg-[#18181b]' : 'bg-gray-50/70 dark:bg-zinc-900/50'
                      } hover:bg-blue-50/70 dark:hover:bg-zinc-800/80`}
                    >
                      {/* Row # */}
                      <td className="border-r border-gray-200 px-2 py-1.5 font-mono text-center text-[11px] text-gray-500 dark:text-zinc-500 dark:border-zinc-800">
                        {rowNumber}
                      </td>

                      {/* Pin Toggle */}
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item)}
                          title={item.isPinned ? 'Pinned to top (Click to unpin)' : 'Click to pin to top'}
                          className={`cursor-pointer inline-flex items-center justify-center p-1 rounded transition-colors ${
                            item.isPinned 
                              ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400' 
                              : 'text-gray-300 hover:text-gray-600 dark:text-zinc-600 dark:hover:text-zinc-300'
                          }`}
                        >
                          <Pin size={13} className={item.isPinned ? 'fill-current' : ''} />
                        </button>
                      </td>

                      {/* Title & Preview */}
                      <td className="border-r border-gray-200 px-2.5 py-1.5 dark:border-zinc-800">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 font-sans">
                            {item.title}
                          </span>
                          {item.isPinned && (
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold">
                              [Pinned]
                            </span>
                          )}
                          {item.attachment && (
                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                              📎
                            </span>
                          )}
                        </div>
                        {item.summary && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-sans">
                            {item.summary}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="border-r border-gray-200 px-2.5 py-1.5 font-mono text-[11px] dark:border-zinc-800 whitespace-nowrap">
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">
                          {item.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="border-r border-gray-200 px-2.5 py-1.5 text-center dark:border-zinc-800 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Date */}
                      <td className="border-r border-gray-200 px-2.5 py-1.5 font-mono text-[11px] text-gray-600 dark:text-gray-400 dark:border-zinc-800 whitespace-nowrap">
                        {item.status === 'Scheduled' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold" title={item.scheduledAt}>
                            {formatDate(item.scheduledAt)}
                          </span>
                        ) : (
                          <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-2.5 py-1.5 text-right font-mono text-xs whitespace-nowrap select-none space-x-1.5">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewModal(item)}
                          className="text-gray-700 hover:text-blue-600 hover:underline dark:text-zinc-300 dark:hover:text-blue-400 cursor-pointer"
                          title="Preview student-facing modal layout"
                        >
                          Preview
                        </button>
                        <span className="text-gray-300 dark:text-zinc-700">|</span>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300 dark:text-zinc-700">|</span>

                        {/* Publish / Archive Quick Toggle */}
                        {item.status === 'Draft' || item.status === 'Scheduled' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item, 'Published')}
                              className="text-emerald-600 hover:underline dark:text-emerald-400 font-medium cursor-pointer"
                              title="Publish announcement now"
                            >
                              Publish
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                          </>
                        ) : item.status === 'Published' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item, 'Archived')}
                              className="text-amber-600 hover:underline dark:text-amber-400 cursor-pointer"
                              title="Archive announcement"
                            >
                              Archive
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                          </>
                        ) : item.status === 'Archived' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item, 'Published')}
                              className="text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
                              title="Restore to published"
                            >
                              Restore
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                          </>
                        ) : null}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteModal(item);
                          }}
                          className="text-red-600 hover:underline dark:text-red-400 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT ANNOUNCEMENT MODAL ── */}
      {formModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => !formSubmitting && setFormModal(null)}
        >
          <div
            className="w-full max-w-2xl border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-xl dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                <Megaphone size={16} className="text-blue-500" />
                <span>{formModal.mode === 'create' ? 'Create Announcement' : 'Edit Announcement'}</span>
              </h2>
              <button
                type="button"
                onClick={() => !formSubmitting && setFormModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 border border-red-200 bg-red-50 p-2.5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 font-mono text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-3.5 space-y-3 font-sans">
              {/* Title */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formModal.data.title}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, title: e.target.value }
                  })}
                  placeholder="e.g. Odd Semester 2026 CIE-1 Schedule & Examination Guidelines"
                  className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              {/* Category & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formModal.data.category}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, category: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Publication Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formModal.data.status}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, status: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                  >
                    <option value="Published">Published (Live to Students)</option>
                    <option value="Draft">Draft (Private in Admin)</option>
                    <option value="Scheduled">Scheduled (Auto-publish at time)</option>
                    <option value="Archived">Archived (Hidden from Feed)</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date Field (If Scheduled) */}
              {formModal.data.status === 'Scheduled' && (
                <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <label className="block text-blue-900 dark:text-blue-300 font-semibold mb-1 font-mono text-[11px]">
                    Schedule Publication Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={formModal.data.scheduledAt}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, scheduledAt: e.target.value }
                    })}
                    className="w-full sm:w-64 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                    Announcement will be automatically released to student Plus feeds at this time.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Summary / Teaser
                </label>
                <input
                  type="text"
                  value={formModal.data.summary}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, summary: e.target.value }
                  })}
                  placeholder="Single-line preview shown in student list items..."
                  className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Full Announcement Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formModal.data.content}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, content: e.target.value }
                  })}
                  placeholder="Enter complete circular text, instructions, and bullet points..."
                  className="w-full rounded-none border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans leading-relaxed"
                />
              </div>

              {/* Optional Expiry & Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Expiry Date */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Expiry Date / Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formModal.data.expiresAt}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, expiresAt: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    Auto-archives after this date.
                  </span>
                </div>

                {/* Attachment File Placeholder */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    PDF Attachment File Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formModal.data.attachmentName}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, attachmentName: e.target.value }
                    })}
                    placeholder="e.g. CIE1_Schedule_Odd_2026.pdf"
                    className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    Shown with PDF badge and download button.
                  </span>
                </div>
              </div>

              {/* Pin Checkbox */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={formModal.data.isPinned}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, isPinned: e.target.checked }
                    })}
                    className="rounded-none border-gray-300 text-blue-600 focus:ring-0"
                  />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Pin this announcement to top of student feed
                  </span>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                {/* Live Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewModal({
                    ...formModal.data,
                    author: {
                      name: admin?.name || 'Administrator',
                      role: 'Institutional Authority'
                    },
                    publishedAt: new Date().toISOString(),
                    attachment: formModal.data.attachmentName ? {
                      name: formModal.data.attachmentName,
                      size: '1.2 MB'
                    } : null
                  })}
                  className="inline-flex items-center gap-1.5 border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer font-sans"
                >
                  <Eye size={13} />
                  <span>Preview Student View</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => setFormModal(null)}
                    className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer font-sans"
                  >
                    {formSubmitting
                      ? 'Saving...'
                      : formModal.mode === 'create'
                      ? 'Create Announcement'
                      : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STUDENT VIEW PREVIEW MODAL ── */}
      {previewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0716] text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Banner */}
            <div className="px-5 py-2.5 bg-purple-950/60 border-b border-purple-500/20 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-purple-300">
                <Eye size={14} />
                <span className="font-semibold">STUDENT VIEW PREVIEW</span>
                <span className="text-purple-400/70 hidden sm:inline">(AskUrSenior Plus Modal Layout)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="text-purple-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated Student Reader Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 font-sans">
              {/* Category */}
              <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 font-mono">
                {previewModal.category} Notice
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {previewModal.title || 'Untitled Announcement'}
              </h1>

              {/* Understated Metadata Row */}
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-500 shrink-0" />
                  <span className="text-slate-300">{previewModal.author?.name || 'Administrator'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500 shrink-0" />
                  <span>{formatDate(previewModal.publishedAt || new Date().toISOString())}</span>
                </div>
              </div>

              <div className="h-px bg-white/[0.08] my-4" />

              {/* Content */}
              <div className="space-y-3.5 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {previewModal.content || 'No content provided.'}
              </div>

              {/* Attachment Preview Card */}
              {previewModal.attachment && (
                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Official Circular
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-300 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                          {previewModal.attachment.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {previewModal.attachment.size || '1.2 MB'} • PDF Document
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Attachment preview: ${previewModal.attachment.name}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 flex items-center gap-1.5 cursor-pointer ml-3 shrink-0"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="px-6 py-3 border-t border-white/[0.08] bg-[#080512] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/15 cursor-pointer font-sans"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>Delete Announcement</span>
              </h2>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deleteError && (
              <div className="mt-2.5 border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 font-mono text-[11px]">
                {deleteError}
              </div>
            )}

            <div className="mt-3 space-y-2 font-mono">
              <p className="font-semibold text-gray-900 dark:text-gray-100 font-sans text-sm">
                "{deleteModal.title}"
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-sans">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal(null)}
                className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="border border-red-600 bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 active:bg-red-800 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;

