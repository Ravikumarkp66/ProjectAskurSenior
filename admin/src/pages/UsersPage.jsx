import React, { useState, useEffect, useCallback, useMemo } from 'react';
import userService from '../services/userService';
import { isEmptyField, getMissingProfileFields, isNeverActive } from '../utils/userValidation';
import { X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canManageUsers } from '../utils/permissions';

const formatDate = (dateString) => {
  if (isEmptyField(dateString)) return <span className="text-gray-400 dark:text-zinc-500 italic">—</span>;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return <span className="text-gray-400 dark:text-zinc-500 italic">—</span>;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return <span className="text-gray-400 dark:text-zinc-500 italic">—</span>;
  }
};

const formatRelativeTime = (dateString) => {
  if (isEmptyField(dateString)) return <span className="text-gray-400 dark:text-zinc-500 font-mono text-[11px]">Never</span>;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return <span className="text-gray-400 dark:text-zinc-500 font-mono text-[11px]">Never</span>;
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    return formatDate(dateString);
  } catch {
    return <span className="text-gray-400 dark:text-zinc-500 italic">—</span>;
  }
};

export const UsersPage = () => {
  const { admin } = useAdminAuth();
  const { canView } = useMemo(() => canManageUsers(admin), [admin]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'incomplete' | 'neverActive'
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    recentlyActiveCount: 0,
    liveUsers: 0,
    incompleteProfileCount: 0,
    neverActiveCount: 0
  });
  const INITIAL_CHUNK_SIZE = 6;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [visibleCount, setVisibleCount] = useState(INITIAL_CHUNK_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review modal state
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async (targetPage = 1, query = '', tab = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers({
        page: targetPage,
        limit,
        search: query,
        filter: tab === 'incomplete' ? 'incomplete' : (tab === 'neverActive' ? 'neverActive' : '')
      });

      const loadedUsers = data.users || [];
      setUsers(loadedUsers);
      setVisibleCount(Math.min(INITIAL_CHUNK_SIZE, loadedUsers.length));
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || loadedUsers.length);
      setPage(data.page || targetPage);

      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Error loading users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUsers(page, activeSearch, activeTab);
  }, [fetchUsers, page, activeSearch, activeTab]);

  const handleTabSwitch = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setPage(1);
      setVisibleCount(INITIAL_CHUNK_SIZE);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setVisibleCount(INITIAL_CHUNK_SIZE);
    setActiveSearch(searchInput);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      setVisibleCount(INITIAL_CHUNK_SIZE);
    }
  };

  const visibleUsers = useMemo(() => {
    return users.slice(0, visibleCount);
  }, [users, visibleCount]);

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

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Title & View Description */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {activeTab === 'incomplete'
              ? 'Incomplete Profiles'
              : activeTab === 'neverActive'
              ? 'Never Active Users'
              : 'Users'}
          </h1>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {activeTab === 'incomplete' ? (
              <>
                <span>Users with missing Name, USN, or Email.</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Incomplete Profiles: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount.toLocaleString()}</span></span>
              </>
            ) : activeTab === 'neverActive' ? (
              <>
                <span>Registered accounts with no recorded platform activity.</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Never Active: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount.toLocaleString()}</span></span>
              </>
            ) : (
              <>
                <span>Total Users: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.totalUsers.toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Recently Active: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.recentlyActiveCount.toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Live Users: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.liveUsers.toLocaleString()}</span></span>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-1 md:pt-0">
          {/* Simple CSES Text Tabs (Scrollable on small screens) */}
          <div className="text-xs font-semibold select-none flex items-center gap-1.5 font-mono overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleTabSwitch('all')}
              className={`${
                activeTab === 'all'
                  ? 'text-blue-600 underline font-bold dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              All Users ({summary.totalUsers.toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('incomplete')}
              className={`${
                activeTab === 'incomplete'
                  ? 'text-blue-600 underline font-bold dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Incomplete Profiles ({summary.incompleteProfileCount.toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('neverActive')}
              className={`${
                activeTab === 'neverActive'
                  ? 'text-blue-600 underline font-bold dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Never Active ({summary.neverActiveCount.toLocaleString()})
            </button>
          </div>

          <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

          {/* Compact Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <label htmlFor="user-search" className="text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono text-[11px]">
              Search:
            </label>
            <input
              id="user-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, USN, Email"
              className="flex-1 sm:w-48 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
            />
            <button
              type="submit"
              className="rounded-none border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 font-sans"
            >
              Search
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setActiveSearch('');
                  setPage(1);
                }}
                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs ml-0.5 font-sans"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="py-2 px-3 text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchUsers(page, activeSearch, activeTab)}
            className="underline hover:text-red-800 dark:hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main CSES Sheet Table */}
      <div className="pt-1">
        {!loading && !error && users.length === 0 ? (
          <div className="py-6 text-xs text-gray-600 dark:text-gray-400 font-mono border border-gray-300 dark:border-zinc-700 p-4 text-center">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-left text-xs text-gray-900 dark:border-zinc-700 dark:text-gray-200">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                  <th className="border-r border-gray-300 px-2 py-1 font-semibold dark:border-zinc-700 w-10 text-center text-gray-500 dark:text-gray-400 font-mono">#</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Name</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-32">USN</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Email</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28">Joined Date</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-28">Last Active</th>
                  {activeTab === 'incomplete' && (
                    <th className="px-2.5 py-1 font-semibold w-36 text-amber-700 dark:text-amber-400">Missing Fields</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={`skel-${i}`} className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2 py-2 text-center">
                        <div className="h-3 w-4 bg-gray-200 dark:bg-zinc-700/60 animate-pulse mx-auto" />
                      </td>
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2.5 py-2">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                      </td>
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2.5 py-2">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                      </td>
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2.5 py-2">
                        <div className="h-3 w-36 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                      </td>
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2.5 py-2">
                        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                      </td>
                      <td className="border-r border-gray-200 dark:border-zinc-800 px-2.5 py-2">
                        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                      </td>
                      {activeTab === 'incomplete' && (
                        <td className="px-2.5 py-2">
                          <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700/60 animate-pulse" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  visibleUsers.map((u, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowNumber = (page - 1) * limit + idx + 1;
                    const missingProfileFields = getMissingProfileFields(u);

                    return (
                      <tr
                        key={u._id || u.id || idx}
                        onClick={() => setSelectedUser(u)}
                        className={`border-b border-gray-200 cursor-pointer transition-colors dark:border-zinc-800 ${
                          isEven ? 'bg-white dark:bg-[#18181b]' : 'bg-gray-50/70 dark:bg-zinc-900/50'
                        } hover:bg-blue-50/70 dark:hover:bg-zinc-800/80`}
                      >
                        <td className="border-r border-gray-200 px-2 py-1 font-mono text-center text-[11px] text-gray-500 dark:text-zinc-500 dark:border-zinc-800">
                          {rowNumber}
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-1 font-medium dark:border-zinc-800">
                          {!isEmptyField(u.name) ? (
                            <span className="text-gray-900 dark:text-gray-100">{u.name}</span>
                          ) : !isEmptyField(u.username) ? (
                            <span className="text-gray-600 dark:text-gray-400">@{u.username}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-zinc-500 italic">—</span>
                          )}
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-1 font-mono dark:border-zinc-800 whitespace-nowrap">
                          {!isEmptyField(u.usn) ? (
                            <span>{u.usn}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-zinc-500 italic">—</span>
                          )}
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-1 dark:border-zinc-800">
                          {!isEmptyField(u.email) ? (
                            <span className="text-blue-600 hover:underline dark:text-blue-400 font-mono text-[11px]">
                              {u.email}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-zinc-500 italic">—</span>
                          )}
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-1 dark:border-zinc-800 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className={`${activeTab === 'incomplete' ? 'border-r border-gray-200 dark:border-zinc-800' : ''} px-2.5 py-1 whitespace-nowrap text-gray-600 dark:text-gray-400 text-[11px] font-mono`}>
                          {formatRelativeTime(u.lastActiveAt || u.updatedAt || u.createdAt)}
                        </td>
                        {activeTab === 'incomplete' && (
                          <td className="px-2.5 py-1 font-mono text-[11px] text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {missingProfileFields.join(', ')}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Chunked Progressive Loaded Users Bar: don't dump all loaded users at once! */}
            {users.length > visibleCount && (
              <div className="flex flex-wrap items-center justify-between gap-2 border border-t-0 border-gray-300 dark:border-zinc-700 bg-gray-50/90 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-mono">
                <span className="text-gray-600 dark:text-gray-400">
                  Showing <strong className="text-gray-900 dark:text-gray-100">{visibleUsers.length}</strong> of <strong className="text-gray-900 dark:text-gray-100">{users.length}</strong> loaded users on this page
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 6, users.length))}
                    className="text-blue-600 underline font-semibold hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Show next {Math.min(6, users.length - visibleCount)}
                  </button>
                  <span className="text-gray-300 dark:text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(users.length)}
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Show all {users.length}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Text-Based Pagination & Page Size Control */}
        {!error && totalCount > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-gray-700 dark:text-gray-300 select-none">
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5">
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
            ) : (
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Page 1 of 1
              </div>
            )}

            {/* Page Limit Selector */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <span>Per page:</span>
              {[15, 30, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (limit !== size) {
                      setLimit(size);
                      setPage(1);
                      setVisibleCount(INITIAL_CHUNK_SIZE);
                    }
                  }}
                  className={`${
                    limit === size
                      ? 'font-bold text-gray-900 underline dark:text-white'
                      : 'text-blue-600 hover:underline dark:text-blue-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simple CSES User Review Sheet */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-lg border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                User Review
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1.5 font-mono">
              {selectedUser.studentId && (
                <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Student ID:</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser.studentId}</span></div>
              )}
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Name:</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{isEmptyField(selectedUser.name) ? <span className="italic text-gray-400">—</span> : selectedUser.name}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">USN:</span> <span>{isEmptyField(selectedUser.usn) ? <span className="italic text-gray-400">—</span> : selectedUser.usn}</span></div>
              {selectedUser.usnHistory && selectedUser.usnHistory.length > 0 && (
                <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">USN History:</span> <span className="text-gray-700 dark:text-gray-300">{selectedUser.usnHistory.map(h => h.usn).filter(Boolean).join(', ')}</span></div>
              )}
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Email:</span> <span>{isEmptyField(selectedUser.email) ? <span className="italic text-gray-400">—</span> : selectedUser.email}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">College:</span> <span>{selectedUser.collegeName || selectedUser.college || '—'}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Mobile / Phone:</span> <span>{selectedUser.phone || '—'}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Branch:</span> <span>{selectedUser.branchName || selectedUser.branch?.shortName || selectedUser.branch?.name || selectedUser.branch || selectedUser.currentBranch || '—'}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Scheme:</span> <span>{selectedUser.schemeName || selectedUser.scheme?.name || (typeof selectedUser.scheme === 'string' && !/^[0-9a-fA-F]{24}$/.test(selectedUser.scheme) ? selectedUser.scheme : (selectedUser.admissionYear ? `${selectedUser.admissionYear >= 2022 ? '2022' : selectedUser.admissionYear === 2021 ? '2021' : '2018'} Scheme` : '2022 Scheme'))}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Semester:</span> <span>{selectedUser.semester ? `Semester ${selectedUser.semester}` : '—'}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Date of Birth:</span> <span>{selectedUser.dob ? formatDate(selectedUser.dob) : '—'}</span></div>
              {selectedUser.graduationYear && (
                <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Graduation Year:</span> <span>{selectedUser.graduationYear}</span></div>
              )}
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Joined Date:</span> <span>{formatDate(selectedUser.createdAt)}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Last Active:</span> <span>{isNeverActive(selectedUser) ? <span className="text-gray-500">Never active</span> : formatRelativeTime(selectedUser.lastActiveAt || selectedUser.lastActive || selectedUser.updatedAt)}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400 inline-block w-36">Role:</span> <span>{selectedUser.isAdmin ? 'Admin' : (selectedUser.role || 'Student')}</span></div>

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 mt-2">
                <span className="text-gray-500 dark:text-gray-400 inline-block w-36">Profile Status:</span>
                {getMissingProfileFields(selectedUser).length > 0 ? (
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Missing: {getMissingProfileFields(selectedUser).join(', ')}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Complete Profile
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
