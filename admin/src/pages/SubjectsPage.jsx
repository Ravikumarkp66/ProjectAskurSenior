import React, { useState, useEffect, useCallback, useMemo } from 'react';
import subjectService from '../services/subjectService';
import { X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canManageSubjects } from '../utils/permissions';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const CREDITS = [0, 1, 2, 3, 4];

export const SubjectsPage = () => {
  const { admin } = useAdminAuth();
  const { canView, canCreate, canUpdate, canDelete } = useMemo(
    () => canManageSubjects(admin),
    [admin]
  );

  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, byYear: { year1: 0, year2: 0, year3: 0, year4: 0 } });
  const [branches, setBranches] = useState([]);
  const [schemes, setSchemes] = useState([]);

  // Filter & Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal state: null | { mode: 'create' | 'edit', data: object }
  const [formModal, setFormModal] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Modal state: null | subject object
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Initial reference data load (branches & schemes)
  useEffect(() => {
    const loadRefData = async () => {
      try {
        const [branchRes, schemeRes] = await Promise.all([
          subjectService.getBranches(),
          subjectService.getSchemes()
        ]);
        const branchList = Array.isArray(branchRes) ? branchRes : (branchRes.data || branchRes.branches || []);
        const schemeList = Array.isArray(schemeRes) ? schemeRes : (schemeRes.data || schemeRes.schemes || []);
        setBranches(branchList);
        setSchemes(schemeList);
      } catch (err) {
        console.error('Failed to load branches/schemes:', err);
      }
    };
    loadRefData();
  }, []);

  // Fetch subjects list & stats
  const fetchSubjects = useCallback(async (targetPage = 1) => {
    if (!canView) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const [statsData, subjectData] = await Promise.all([
        subjectService.getStats(),
        subjectService.getSubjects({
          page: targetPage,
          limit,
          search: activeSearch,
          year: selectedYear,
          branch: selectedBranch,
          scheme: selectedScheme
        })
      ]);

      if (statsData) {
        setStats(statsData);
      }

      setSubjects(subjectData.subjects || []);
      setTotalPages(subjectData.pagination?.pages || 1);
      setTotalCount(subjectData.pagination?.total || 0);
      setPage(subjectData.pagination?.page || targetPage);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Error loading subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [limit, activeSearch, selectedYear, selectedBranch, selectedScheme, canView]);

  useEffect(() => {
    fetchSubjects(page);
  }, [fetchSubjects, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedYear('');
    setSelectedBranch('');
    setSelectedScheme('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const getPaginationRange = () => {
    const delta = 3;
    const range = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  // Open Create Form
  const openCreateModal = () => {
    if (!canCreate) return;
    setFormError(null);
    setFormModal({
      mode: 'create',
      data: {
        name: '',
        code: '',
        credits: 4,
        year: '2nd Year',
        branch: branches[0]?._id || '',
        scheme: schemes[0]?._id || '',
        status: 'Published'
      }
    });
  };

  // Open Edit Form
  const openEditModal = (subject) => {
    if (!canUpdate) return;
    setFormError(null);
    setFormModal({
      mode: 'edit',
      id: subject._id,
      data: {
        name: subject.name || '',
        code: subject.code || '',
        credits: subject.credits ?? 4,
        year: subject.year || '2nd Year',
        branch: subject.branch?._id || subject.branch || '',
        scheme: subject.scheme?._id || subject.scheme || '',
        status: subject.status || 'Published'
      }
    });
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { mode, id, data } = formModal;

    if (!data.name || !data.name.trim()) {
      setFormError('Subject Name is required');
      return;
    }
    if (!data.code || !data.code.trim()) {
      setFormError('Course Code is required');
      return;
    }
    if (!data.branch) {
      setFormError('Branch is required');
      return;
    }
    if (!data.scheme) {
      setFormError('Scheme is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        credits: parseInt(data.credits, 10),
        year: data.year,
        branch: data.branch,
        scheme: data.scheme,
        status: data.status || 'Published'
      };

      if (mode === 'create') {
        await subjectService.createSubject(payload);
      } else {
        await subjectService.updateSubject(id, payload);
      }

      setFormModal(null);
      fetchSubjects(page);
    } catch (err) {
      console.error('Save failed:', err);
      setFormError(err.response?.data?.error || err.message || 'Failed to save subject');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete / Archive
  const handleDelete = async (hard = false) => {
    if (!deleteModal) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await subjectService.deleteSubject(deleteModal._id, hard);

      setDeleteModal(null);
      fetchSubjects(page);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = activeSearch || selectedYear || selectedBranch || selectedScheme;

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Top Section: Title, Stats & Filter Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Subjects
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span>Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.total.toLocaleString()}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>1st Year: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.byYear?.year1 || 0}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>2nd Year: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.byYear?.year2 || 0}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>3rd Year: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.byYear?.year3 || 0}</span></span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span>4th Year: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.byYear?.year4 || 0}</span></span>
            </div>
          </div>

          {/* Action Button: + Add Subject */}
          {canCreate && (
            <div className="pt-1 sm:pt-0">
              <button
                type="button"
                onClick={openCreateModal}
                className="w-full sm:w-auto rounded-none border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700 font-sans"
              >
                + Add Subject
              </button>
            </div>
          )}
        </div>

        {/* Filters Bar: Search + Year + Branch + Scheme Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
            <label htmlFor="subject-search" className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
              Search:
            </label>
            <input
              id="subject-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or Course Code"
              className="flex-1 sm:w-52 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            />
            <button
              type="submit"
              className="rounded-none border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 font-sans"
            >
              Search
            </button>
          </form>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Year Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="year-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
              Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Branch Dropdown */}
          <div className="flex items-center gap-1 max-w-full">
            <label htmlFor="branch-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
              Branch:
            </label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(1);
              }}
              className="max-w-[140px] sm:max-w-xs truncate rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.shortName} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Scheme Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="scheme-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
              Scheme:
            </label>
            <select
              id="scheme-select"
              value={selectedScheme}
              onChange={(e) => {
                setSelectedScheme(e.target.value);
                setPage(1);
              }}
              className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            >
              <option value="">All Schemes</option>
              {schemes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} Scheme
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs ml-1 font-sans"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main CSES Subject Table */}
      <div className="pt-1">
        {loading ? (
          <div className="py-6 text-xs text-gray-600 dark:text-gray-400 font-mono">
            Loading subjects...
          </div>
        ) : error ? (
          <div className="py-4 text-xs text-red-600 dark:text-red-400 font-mono">
            {error}
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-6 text-xs text-gray-600 dark:text-gray-400 font-mono">
            No subjects found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-left text-xs text-gray-900 dark:border-zinc-700 dark:text-gray-200">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                  <th className="border-r border-gray-300 px-2 py-1 font-semibold dark:border-zinc-700 w-10 text-center text-gray-500 dark:text-gray-400 font-mono">#</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Name</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28">Code</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-16 text-center">Credits</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28">Year</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-24">Branch</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-24">Scheme</th>
                  <th className="px-2.5 py-1 font-semibold w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowNumber = (page - 1) * limit + idx + 1;
                  const branchDisplay = sub.branch?.shortName || sub.branch?.name || sub.branch || '—';
                  const schemeDisplay = sub.scheme?.name || sub.scheme || '—';

                  return (
                    <tr
                      key={sub._id || idx}
                      className={`border-b border-gray-200 transition-colors dark:border-zinc-800 ${
                        isEven ? 'bg-white dark:bg-[#18181b]' : 'bg-gray-50/70 dark:bg-zinc-900/50'
                      } hover:bg-blue-50/70 dark:hover:bg-zinc-800/80`}
                    >
                      <td className="border-r border-gray-200 px-2 py-1 font-mono text-center text-[11px] text-gray-500 dark:text-zinc-500 dark:border-zinc-800">
                        {rowNumber}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-medium dark:border-zinc-800">
                        <span className="text-gray-900 dark:text-gray-100 font-sans">
                          {sub.name}
                        </span>
                        {sub.status === 'Hidden' && (
                          <span className="ml-2 text-[10px] uppercase text-zinc-500 font-mono italic">
                            (Hidden)
                          </span>
                        )}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-mono dark:border-zinc-800 whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">
                        {sub.code}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-mono dark:border-zinc-800 text-center">
                        {sub.credits ?? 0}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-mono text-[11px] dark:border-zinc-800 whitespace-nowrap">
                        {sub.year || '—'}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-mono text-[11px] dark:border-zinc-800 whitespace-nowrap">
                        {branchDisplay}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-1 font-mono text-[11px] dark:border-zinc-800 whitespace-nowrap">
                        {schemeDisplay}
                      </td>
                      <td className="px-2.5 py-1 text-right font-mono text-xs whitespace-nowrap select-none">
                        {(() => {
                          const actions = [];
                          if (canUpdate) {
                            actions.push(
                              <button
                                key="edit"
                                type="button"
                                onClick={() => openEditModal(sub)}
                                className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                              >
                                Edit
                              </button>
                            );
                          }
                          if (canDelete) {
                            actions.push(
                              <button
                                key="delete"
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteModal(sub);
                                }}
                                className="text-red-600 hover:underline dark:text-red-400 font-medium"
                              >
                                Delete
                              </button>
                            );
                          }
                          if (actions.length === 0) {
                            return <span className="text-gray-400 dark:text-zinc-600">—</span>;
                          }
                          return actions.map((act, i) => (
                            <React.Fragment key={act.key || i}>
                              {i > 0 && <span className="mx-1 text-gray-300 dark:text-zinc-700">|</span>}
                              {act}
                            </React.Fragment>
                          ));
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Compact Text-Based Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono text-gray-700 dark:text-gray-300 select-none">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline dark:text-blue-400 dark:disabled:text-zinc-600"
            >
              Previous
            </button>
            <span className="text-gray-400 dark:text-zinc-600">|</span>

            {getPaginationRange().map((p) => (
              <React.Fragment key={p}>
                {p === page ? (
                  <span className="font-bold text-gray-900 underline dark:text-white">
                    {p}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {p}
                  </button>
                )}
                <span className="text-gray-400 dark:text-zinc-600">|</span>
              </React.Fragment>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline dark:text-blue-400 dark:disabled:text-zinc-600"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {formModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !formSubmitting && setFormModal(null)}
        >
          <div
            className="w-full max-w-lg border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                {formModal.mode === 'create' ? 'Add Subject' : 'Edit Subject'}
              </h2>
              <button
                type="button"
                onClick={() => !formSubmitting && setFormModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-2.5 border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 font-mono text-[11px]">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-3 space-y-3 font-sans">
              {/* Subject Name */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formModal.data.name}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, name: e.target.value }
                  })}
                  placeholder="e.g. Data Structures and Applications"
                  className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formModal.data.code}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, code: e.target.value.toUpperCase() }
                  })}
                  placeholder="e.g. 21CS32"
                  className="w-full rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 uppercase font-mono focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              {/* Grid: Credits & Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formModal.data.credits}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, credits: parseInt(e.target.value, 10) }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                  >
                    {CREDITS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formModal.data.year}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, year: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid: Branch & Scheme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formModal.data.branch}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, branch: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.shortName} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                    Scheme <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formModal.data.scheme}
                    onChange={(e) => setFormModal({
                      ...formModal,
                      data: { ...formModal.data, scheme: e.target.value }
                    })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                  >
                    <option value="">Select Scheme</option>
                    {schemes.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} Scheme
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5">
                  Visibility Status
                </label>
                <select
                  value={formModal.data.status}
                  onChange={(e) => setFormModal({
                    ...formModal,
                    data: { ...formModal.data, status: e.target.value }
                  })}
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                >
                  <option value="Published">Published</option>
                  <option value="Hidden">Hidden (Archived)</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="mt-4 pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setFormModal(null)}
                  className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : formModal.mode === 'create'
                    ? 'Create Subject'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Delete Subject
              </h2>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
                {deleteModal.name} ({deleteModal.code})
              </p>
              <p className="text-gray-600 dark:text-gray-400 font-sans text-xs">
                This subject may be referenced by study materials, question papers, or syllabus documents.
              </p>
              <p className="text-amber-700 dark:text-amber-400 font-sans text-xs">
                Recommended: <strong>Archive / Hide</strong> to keep existing relationships safe without displaying it publicly.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal(null)}
                className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(false)}
                className="border border-amber-600 bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 dark:border-amber-500 dark:bg-amber-600 font-sans"
              >
                {deleting ? 'Archiving...' : 'Archive / Hide'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(true)}
                className="border border-red-600 bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600 font-sans"
                title="Permanently remove only if no materials are linked"
              >
                {deleting ? 'Deleting...' : 'Permanent Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
