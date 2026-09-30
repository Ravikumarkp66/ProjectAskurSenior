import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bug,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  User,
  Mail,
  Copy,
  Check,
  FileText,
  X,
  Filter
} from 'lucide-react';
import bugService from '../services/bugService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { isSuperAdmin, hasPermission } from '../utils/permissions';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const PROBLEM_TYPES = [
  'All',
  'UI / Design',
  'Feature not working',
  'Performance',
  'Login / Account',
  'Academic data',
  'Other'
];

export const BugReportsPage = () => {
  const { admin } = useAdminAuth();
  const isSuper = isSuperAdmin(admin);
  const canUpdate = isSuper || hasPermission(admin, 'bugs', 'update');
  const canDelete = isSuper || hasPermission(admin, 'bugs', 'delete');

  // State
  const [bugs, setBugs] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  // Selected Bug Modal State
  const [activeBug, setActiveBug] = useState(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Delete Modal State
  const [deleteBugTarget, setDeleteBugTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Success message toast simulation inside component
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Fetch bugs from API
  const fetchBugs = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        problemType: selectedType === 'All' ? undefined : selectedType,
        search: activeSearch || undefined
      };

      const res = await bugService.getBugs(params);
      if (res) {
        setBugs(res.items || []);
        setStats(res.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
        setPage(res.page || targetPage);
      }
    } catch (err) {
      console.error('Failed to fetch bug reports:', err);
      setError(err.response?.data?.error || 'Failed to load bug reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedType, activeSearch, limit]);

  useEffect(() => {
    fetchBugs(page);
  }, [fetchBugs, page]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedStatus('all');
    setSelectedType('All');
    setPage(1);
  };

  // Handle Status Update
  const handleUpdateStatus = async (bugId, newStatus) => {
    try {
      setStatusUpdating(true);
      const res = await bugService.updateBugStatus(bugId, { status: newStatus });
      showFeedback(`Status updated to "${newStatus.replace('_', ' ')}"`);

      // Update in active modal if open
      if (activeBug && activeBug._id === bugId) {
        setActiveBug((prev) => ({
          ...prev,
          status: newStatus,
          resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date() : null
        }));
      }

      // Refresh list
      fetchBugs(page);
    } catch (err) {
      console.error('Failed to update status:', err);
      showFeedback(err.response?.data?.error || 'Failed to update bug status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Save Internal Admin Notes
  const handleSaveNotes = async () => {
    if (!activeBug) return;
    try {
      setSavingNotes(true);
      await bugService.updateBugStatus(activeBug._id, { adminNotes: adminNotesInput });
      setActiveBug((prev) => ({ ...prev, adminNotes: adminNotesInput }));
      showFeedback('Resolution notes saved successfully');
      fetchBugs(page);
    } catch (err) {
      console.error('Failed to save notes:', err);
      showFeedback(err.response?.data?.error || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  // Handle Delete
  const handleDeleteBug = async () => {
    if (!deleteBugTarget) return;
    try {
      setDeleting(true);
      await bugService.deleteBug(deleteBugTarget._id);
      showFeedback('Bug report deleted');
      setDeleteBugTarget(null);
      if (activeBug && activeBug._id === deleteBugTarget._id) {
        setActiveBug(null);
      }
      fetchBugs(page);
    } catch (err) {
      console.error('Failed to delete bug:', err);
      showFeedback(err.response?.data?.error || 'Failed to delete report', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Open modal with bug details
  const handleOpenDetailModal = (bug) => {
    setActiveBug(bug);
    setAdminNotesInput(bug.adminNotes || '');
  };

  // Export bug reports to CSV
  const handleExportCSV = () => {
    if (bugs.length === 0) return;
    const headers = ['ID', 'Title', 'Category', 'Status', 'Plan', 'Reported By', 'USN', 'Email', 'Page URL', 'Description', 'Created At'];
    const rows = bugs.map((b) => [
      b._id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${b.problemType || ''}"`,
      `"${b.status || 'open'}"`,
      `"${b.user?.plan || (b.user ? 'FREE' : 'GUEST')}"`,
      `"${(b.user?.name || (b.contactEmail ? `Guest (${b.contactEmail})` : 'Anonymous')).replace(/"/g, '""')}"`,
      `"${b.user?.usn || ''}"`,
      `"${b.user?.email || b.contactEmail || ''}"`,
      `"${(b.pageUrl || '').replace(/"/g, '""')}"`,
      `"${(b.description || '').replace(/"/g, '""')}"`,
      `"${new Date(b.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bug_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Styling Helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
            <AlertCircle size={12} />
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
            <Clock size={12} />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
            <CheckCircle2 size={12} />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
            <XCircle size={12} />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  const getProblemTypeBadge = (type) => {
    const styleMap = {
      'UI / Design': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/60',
      'Feature not working': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/60',
      'Performance': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60',
      'Login / Account': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/60',
      'Academic data': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60',
      'Other': 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
    };
    const style = styleMap[type] || styleMap['Other'];
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${style}`}>
        {type}
      </span>
    );
  };

  const hasActiveFilters = activeSearch || selectedStatus !== 'all' || selectedType !== 'All';

  return (
    <div className="space-y-4">
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          {feedbackMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── HEADER & STATS BAR ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bug className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Student Bug Reports</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Live feedback and error reports submitted directly by students across the platform.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => fetchBugs(page)}
              title="Refresh bug reports"
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={bugs.length === 0}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113]">
            <div className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">Total Reports</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{stats.total}</div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={12} />
              <span>Open (Needs Triage)</span>
            </div>
            <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{stats.open}</div>
          </div>

          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <Clock size={12} />
              <span>In Progress</span>
            </div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-0.5">{stats.inProgress}</div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Resolved</span>
            </div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{stats.resolved}</div>
          </div>
        </div>

        {/* ── TOOLBAR: SEARCH & FILTERS ── */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, student, URL..."
                className="w-full pl-8 pr-2 py-1 rounded border border-gray-300 bg-white text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              className="rounded border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Search
            </button>
          </form>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <label className="text-gray-500 dark:text-zinc-400 text-[11px]">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Problem Type Filter */}
          <div className="flex items-center gap-1">
            <label className="text-gray-500 dark:text-zinc-400 text-[11px]">Category:</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
            >
              {PROBLEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Categories' : type}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <>
              <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchBugs(page)}
            className="text-xs underline font-semibold hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-[#111113] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-900/50 text-[11px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Bug Issue & Summary</th>
                <th className="py-2.5 px-3">Student Reporter</th>
                <th className="py-2.5 px-3">Page / Target URL</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-purple-600" />
                      <span>Loading bug reports...</span>
                    </div>
                  </td>
                </tr>
              ) : bugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="font-semibold text-gray-700 dark:text-zinc-300">No bug reports found</p>
                      <p className="text-[11px] text-gray-400 max-w-sm">
                        {hasActiveFilters
                          ? 'Try adjusting your filters or search keywords to see matching reports.'
                          : 'Great job! There are currently no unresolved bug reports submitted by students.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bugs.map((bug) => {
                  const student = bug.user;
                  const dateStr = new Date(bug.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={bug._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getStatusBadge(bug.status)}
                      </td>

                      {/* Problem Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getProblemTypeBadge(bug.problemType)}
                      </td>

                      {/* Bug Issue & Summary */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(bug)}
                          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-left line-clamp-1 cursor-pointer transition-colors"
                          title={bug.title}
                        >
                          {bug.title}
                        </button>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {bug.description}
                        </p>
                      </td>

                      {/* Student Reporter */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {student ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
                              <span>{student.name || 'Student'}</span>
                              {student.plan === 'PLUS' ? (
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                  PLUS
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 rounded text-[9px] font-medium tracking-wider uppercase bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                  FREE
                                </span>
                              )}
                              {student.branch && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                                  {student.branch}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                              {student.usn ? student.usn : student.email}
                            </div>
                          </div>
                        ) : bug.contactEmail ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1">
                              <span>Guest</span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                VISITOR
                              </span>
                            </div>
                            <a
                              href={`mailto:${bug.contactEmail}`}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono"
                            >
                              {bug.contactEmail}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500 italic">Anonymous Guest</span>
                        )}
                      </td>

                      {/* Target Page URL */}
                      <td className="py-2.5 px-3 max-w-[180px] truncate">
                        {bug.pageUrl ? (
                          <a
                            href={bug.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 truncate font-mono"
                            title={bug.pageUrl}
                          >
                            <span className="truncate">{bug.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                            <ExternalLink size={11} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 dark:text-zinc-400 text-[11px]">
                        {dateStr}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(bug)}
                            className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="View details & triage"
                          >
                            <Eye size={14} />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteBugTarget(bug)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Delete bug report"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        {!loading && totalCount > 0 && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 bg-gray-50/50 dark:bg-zinc-900/30">
            <div>
              Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{bugs.length}</span> of{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalCount}</span> reports
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer text-xs"
              >
                Previous
              </button>
              <span className="px-1 text-[11px]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BUG DETAIL & TRIAGE MODAL ── */}
      {activeBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#131316] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Bug size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Bug Report Details
                </h3>
                {getProblemTypeBadge(activeBug.problemType)}
                {getStatusBadge(activeBug.status)}
              </div>
              <button
                type="button"
                onClick={() => setActiveBug(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Issue Summary
                </label>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 font-semibold text-gray-900 dark:text-gray-100">
                  {activeBug.title}
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Reported Details & Steps
                </label>
                <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {activeBug.description}
                </div>
              </div>

              {/* Page URL Box */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Originating Page URL
                </label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 font-mono text-[11px]">
                  <span className="flex-1 truncate text-gray-700 dark:text-zinc-300">
                    {activeBug.pageUrl || 'None specified'}
                  </span>
                  {activeBug.pageUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(activeBug.pageUrl)}
                        className="px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-1 text-[10px] text-gray-600 dark:text-zinc-300"
                      >
                        {copiedUrl ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={activeBug.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400"
                      >
                        <ExternalLink size={11} />
                        <span>Open</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Student / Reporter Metadata Card */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Reported By
                </label>
                {activeBug.user ? (
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Student Name:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {activeBug.user.name || 'Student'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Plan & Tier:</span>
                      {activeBug.user.plan === 'PLUS' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          AskUrSenior Plus ({activeBug.user.source || 'Active'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Free Student Plan
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">USN:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {activeBug.user.usn || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Email Address:</span>
                      <a
                        href={`mailto:${activeBug.user.email}?subject=Regarding%20your%20bug%20report:%20${encodeURIComponent(activeBug.title)}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Mail size={11} />
                        <span>{activeBug.user.email}</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Branch & Semester:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {activeBug.user.branch || '—'} {activeBug.user.semester ? `(Sem ${activeBug.user.semester})` : ''}
                      </span>
                    </div>
                  </div>
                ) : activeBug.contactEmail ? (
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Unauthenticated Guest User</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        VISITOR
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <span>Contact Email:</span>
                      <a
                        href={`mailto:${activeBug.contactEmail}?subject=Regarding%20your%20bug%20report:%20${encodeURIComponent(activeBug.title)}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-mono flex items-center gap-1"
                      >
                        <Mail size={11} />
                        <span>{activeBug.contactEmail}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 italic bg-gray-50/50 dark:bg-zinc-900/40">
                    Reported anonymously without an account or contact email attached.
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              {canUpdate && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Update Bug Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={statusUpdating || activeBug.status === 'open'}
                      onClick={() => handleUpdateStatus(activeBug._id, 'open')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        activeBug.status === 'open'
                          ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <AlertCircle size={13} />
                      <span>Mark Open</span>
                    </button>

                    <button
                      type="button"
                      disabled={statusUpdating || activeBug.status === 'in_progress'}
                      onClick={() => handleUpdateStatus(activeBug._id, 'in_progress')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        activeBug.status === 'in_progress'
                          ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Clock size={13} />
                      <span>Mark In Progress</span>
                    </button>

                    <button
                      type="button"
                      disabled={statusUpdating || activeBug.status === 'resolved'}
                      onClick={() => handleUpdateStatus(activeBug._id, 'resolved')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        activeBug.status === 'resolved'
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Resolved</span>
                    </button>

                    <button
                      type="button"
                      disabled={statusUpdating || activeBug.status === 'closed'}
                      onClick={() => handleUpdateStatus(activeBug._id, 'closed')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        activeBug.status === 'closed'
                          ? 'bg-zinc-200 border-zinc-400 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <XCircle size={13} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Admin Resolution Notes */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Internal Engineering & Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Notes on cause, PR/commit hash, or workaround deployed..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 text-xs resize-none"
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveNotes}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {savingNotes ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>

              {/* Meta details footer */}
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[11px] text-gray-400">
                <span>Report ID: <span className="font-mono">{activeBug._id}</span></span>
                <span>Submitted: {new Date(activeBug.createdAt).toLocaleString()}</span>
                {activeBug.resolvedAt && (
                  <span>Resolved: {new Date(activeBug.resolvedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteBugTarget(activeBug);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Report</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setActiveBug(null)}
                className="px-3.5 py-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteBugTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#131316] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Delete Bug Report?
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Are you sure you want to dismiss and permanently delete this bug report?
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-800 dark:text-zinc-200 line-clamp-2">
              "{deleteBugTarget.title}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteBugTarget(null)}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteBug}
                className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <RefreshCw size={12} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReportsPage;
