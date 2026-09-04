import React, { useState, useEffect } from 'react';
import adminManagementService from '../../services/adminManagementService';

const TIME_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' }
];

export default function AdminLeaderboardTab({ onSelectAdmin }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async (range = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminManagementService.getLeaderboard(range);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to compute contributions leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(timeRange);
  }, [timeRange]);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Header & Range Switcher */}
      <div className="p-3 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs">
            Administrator Contributions & Content Leaderboard
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
            Aggregated directly from original creation records. Creator credit is preserved independently from subsequent edits.
          </p>
        </div>

        {/* Time Range Bar */}
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-800">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setTimeRange(r.key)}
              className={`py-1 px-3 rounded font-medium transition text-xs ${
                timeRange === r.key
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
          ✕ {error}
        </div>
      )}

      {/* Dense Leaderboard Table */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden bg-white dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800 text-gray-500 dark:text-zinc-400">
              <tr>
                <th className="py-2 px-3 w-12 text-center">Rank</th>
                <th className="py-2 px-3">Administrator</th>
                <th className="py-2 px-3 text-center">Dept</th>
                <th className="py-2 px-3 text-right">Notes</th>
                <th className="py-2 px-3 text-right">PYQs</th>
                <th className="py-2 px-3 text-right">Q.Banks</th>
                <th className="py-2 px-3 text-right">Syllabus</th>
                <th className="py-2 px-3 text-right">Lab Manuals</th>
                <th className="py-2 px-3 text-right">Textbooks</th>
                <th className="py-2 px-3 text-right">Subjects</th>
                <th className="py-2 px-3 text-right">Announce</th>
                <th className="py-2 px-3 text-right bg-blue-50/40 dark:bg-blue-950/20 font-bold text-blue-700 dark:text-blue-300">
                  TOTAL
                </th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    Computing administrator contributions for "{timeRange}"...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                leaderboard.map((adm) => {
                  const rankBadge =
                    adm.rank === 1
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                      : adm.rank === 2
                      ? 'bg-gray-200 text-gray-800 dark:bg-zinc-700 dark:text-zinc-200 border-gray-300'
                      : adm.rank === 3
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300'
                      : 'text-gray-400 dark:text-zinc-500';

                  return (
                    <tr
                      key={adm.adminId}
                      className="hover:bg-gray-50/75 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      onClick={() => onSelectAdmin && onSelectAdmin(adm.adminId)}
                    >
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-bold border ${rankBadge}`}
                        >
                          #{adm.rank}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {adm.name}
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              adm.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                          {adm.email}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            adm.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {adm.department}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.notes}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.pyqs}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.questionBanks}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.syllabus}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.labManuals}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.textbooks}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.subjects}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-zinc-300">
                        {adm.announcements}
                      </td>
                      <td className="py-2 px-3 text-right bg-blue-50/40 dark:bg-blue-950/20 font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {adm.total}
                      </td>
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectAdmin && onSelectAdmin(adm.adminId)}
                          className="px-2 py-0.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
