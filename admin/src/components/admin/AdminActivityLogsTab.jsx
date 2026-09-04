import React, { useState, useEffect } from 'react';
import adminManagementService from '../../services/adminManagementService';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
  PUBLISH: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  UNPUBLISH: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  RESTORE: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  REASSIGN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  ENABLE: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800',
  DISABLE: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  LOGIN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
};

export default function AdminActivityLogsTab({ branches = [], onOpenDiffModal }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminManagementService.getActivityLogs({
        page: targetPage,
        limit,
        search: search.trim() || undefined,
        action: action || undefined,
        resourceType: resourceType || undefined,
        department: department || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      setLogs(data.activities || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setError('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action, resourceType, department, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setResourceType('');
    setDepartment('');
    setStartDate('');
    setEndDate('');
    fetchLogs(1);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Search & Filter Toolbar */}
      <div className="p-3 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          {/* Search text */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search admin, email, resource title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded text-xs text-gray-800 dark:text-zinc-200"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="UNPUBLISH">UNPUBLISH</option>
            <option value="RESTORE">RESTORE</option>
            <option value="REASSIGN">REASSIGN</option>
            <option value="ENABLE">ENABLE</option>
            <option value="DISABLE">DISABLE</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded text-xs text-gray-800 dark:text-zinc-200"
          >
            <option value="">All Resources</option>
            <option value="MATERIAL">MATERIAL</option>
            <option value="SUBJECT">SUBJECT</option>
            <option value="USER">USER</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded text-xs text-gray-800 dark:text-zinc-200"
          >
            <option value="">All Departments</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.shortName} - {b.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition"
          >
            Search
          </button>

          {(search || action || resourceType || department || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded text-xs transition"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
          ✕ {error}
        </div>
      )}

      {/* Main Audit Log Table */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden bg-white dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800 text-gray-500 dark:text-zinc-400">
              <tr>
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3 whitespace-nowrap">Date / Time</th>
                <th className="py-2 px-3">Admin</th>
                <th className="py-2 px-3 text-center">Action</th>
                <th className="py-2 px-3">Resource</th>
                <th className="py-2 px-3 text-center">Dept</th>
                <th className="py-2 px-3">Details / Target</th>
                <th className="py-2 px-3 text-right">Diff / Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-gray-400 dark:text-zinc-500">
                    Loading audit activities...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-gray-400 dark:text-zinc-500">
                    No activity records found matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const hasChanges =
                    (log.metadata?.changes && Object.keys(log.metadata.changes).length > 0) ||
                    (log.metadata?.affectedIds && log.metadata.affectedIds.length > 0) ||
                    log.metadata?.extra;

                  const dateObj = new Date(log.createdAt);
                  const formattedDate = dateObj.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/75 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-center text-gray-400 text-[11px]">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-zinc-400 whitespace-nowrap text-[11px]">
                        {formattedDate} {formattedTime}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-gray-900 dark:text-zinc-100">
                          {log.adminName}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                          {log.adminEmail}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-700 dark:text-zinc-300 text-[11px]">
                        {log.resourceType}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] text-gray-700 dark:text-zinc-300 font-semibold">
                          {log.departmentCode || log.department?.shortName || 'ALL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate text-[11px] text-gray-800 dark:text-zinc-200">
                        {log.metadata?.title || (
                          <span className="text-gray-400 italic">
                            {log.action} on {log.resourceType}
                          </span>
                        )}
                        {log.metadata?.count > 1 && (
                          <span className="ml-1.5 px-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] rounded">
                            {log.metadata.count} items
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {hasChanges ? (
                          <button
                            onClick={() => onOpenDiffModal(log)}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-[10px] font-semibold transition"
                          >
                            View Diff
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-[11px] text-gray-600 dark:text-zinc-400">
          <div>
            Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of <strong>{total}</strong> activities
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Prev
            </button>
            <span className="px-2 text-gray-700 dark:text-zinc-300">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= pages || loading}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
