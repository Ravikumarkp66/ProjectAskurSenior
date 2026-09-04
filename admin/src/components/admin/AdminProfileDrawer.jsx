import React, { useState, useEffect } from 'react';
import adminManagementService from '../../services/adminManagementService';

const TIME_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' }
];

export default function AdminProfileDrawer({ adminId, onClose, onOpenDiffModal }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [error, setError] = useState(null);

  const fetchProfile = async (range = 'all') => {
    if (!adminId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminManagementService.getAdminProfile(adminId, range);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load admin profile:', err);
      setError('Failed to load administrator details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(timeRange);
  }, [adminId, timeRange]);

  if (!adminId) return null;

  const admin = profile?.admin;
  const contributions = profile?.contributions;
  const recentActivities = profile?.recentActivities || [];

  const isSuper = admin?.role === 'SUPER_ADMIN';
  const permissions = admin?.permissions || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#121214] border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full font-mono text-xs">
        {/* Top Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                {admin?.name || 'Administrator Profile'}
              </h3>
              {admin && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    admin.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      admin.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                  />
                  {admin.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-zinc-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {isSuper
                  ? 'SUPER ADMIN'
                  : `${admin?.department?.shortName || 'General'} Admin`}
              </span>
              <span>•</span>
              <span className="text-gray-500">{admin?.email}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-gray-100 dark:divide-zinc-800/80">
          {loading && !profile ? (
            <div className="py-16 text-center text-gray-400 dark:text-zinc-500">
              Loading administrator profile & contributions...
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 rounded">
              {error}
            </div>
          ) : (
            <>
              {/* SECTION 1: ACCESS */}
              <div className="pt-2 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-500 dark:text-zinc-400">
                    ACCESS & PERMISSIONS
                  </h4>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                    Dept: {isSuper ? 'ALL (Unrestricted)' : (admin?.department?.shortName || 'None')}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-900/40 rounded border border-gray-200 dark:border-zinc-800/80 space-y-2">
                  <div className="text-[11px]">
                    <span className="text-gray-500 dark:text-zinc-400">Scope: </span>
                    <strong className="text-gray-900 dark:text-zinc-100">
                      {isSuper
                        ? 'Global Super Admin (Full Read/Write Access to All Branches)'
                        : `${admin?.department?.shortName || ''} - ${admin?.department?.name || 'Assigned Department'}`}
                    </strong>
                  </div>

                  {/* Modules checklist */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200 dark:border-zinc-800 text-[11px]">
                    {['users', 'subjects', 'materials', 'queries', 'requests'].map((mod) => {
                      const modPerms = permissions[mod] || {};
                      const hasView = isSuper || modPerms.view;
                      const hasEdit =
                        isSuper ||
                        modPerms.create ||
                        modPerms.update ||
                        modPerms.delete ||
                        modPerms.publish ||
                        modPerms.archive ||
                        modPerms.respond ||
                        modPerms.approve;

                      return (
                        <div
                          key={mod}
                          className="flex items-center justify-between px-2 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded"
                        >
                          <span className="capitalize font-semibold text-gray-800 dark:text-zinc-200">
                            {mod}
                          </span>
                          <span className="text-[10px]">
                            {hasView ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓ {hasEdit ? 'Full' : 'Read'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-600">✕ None</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTRIBUTIONS */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-500 dark:text-zinc-400">
                    CONTRIBUTIONS (ORIGINAL CREATOR CREDIT)
                  </h4>
                </div>

                {/* Time Range Filter Bar */}
                <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-800 text-[11px]">
                  {TIME_RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setTimeRange(r.key)}
                      className={`flex-1 py-1 px-2 rounded font-medium transition ${
                        timeRange === r.key
                          ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                          : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Contribution Breakdown Dense Table */}
                <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-3">Content Category</th>
                        <th className="py-1.5 px-3 text-right">Items Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 bg-white dark:bg-[#151518]">
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Notes</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.notes || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Previous Year Questions (PYQs)</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.pyqs || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Question Banks</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.questionBanks || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Syllabus</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.syllabus || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Lab Manuals</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.labManuals || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Textbooks</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.textbooks || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Other Materials</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.otherMaterials || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Academic Subjects</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.subjects || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-gray-700 dark:text-zinc-300">Announcements</td>
                        <td className="py-1.5 px-3 text-right font-bold text-gray-900 dark:text-zinc-100">
                          {contributions?.announcements || 0}
                        </td>
                      </tr>
                      <tr className="bg-blue-50/50 dark:bg-blue-950/20 font-bold border-t border-gray-200 dark:border-zinc-800">
                        <td className="py-2 px-3 text-blue-900 dark:text-blue-200 uppercase text-[11px]">
                          TOTAL CONTRIBUTIONS
                        </td>
                        <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400 text-sm font-bold">
                          {contributions?.total || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: RECENT ACTIVITY */}
              <div className="pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-500 dark:text-zinc-400">
                    RECENT ACTIVITY STREAM
                  </h4>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                    Last {recentActivities.length} Actions
                  </span>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-900/30 rounded border border-gray-200 dark:border-zinc-800 text-[11px]">
                    No recent administrative actions recorded for this admin.
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-zinc-800 rounded divide-y divide-gray-100 dark:divide-zinc-800/80 overflow-hidden bg-white dark:bg-[#141416]">
                    {recentActivities.map((act) => {
                      const timeStr = new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const dateStr = new Date(act.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      });

                      const hasChanges =
                        (act.metadata?.changes && Object.keys(act.metadata.changes).length > 0) ||
                        (act.metadata?.affectedIds && act.metadata.affectedIds.length > 0);

                      return (
                        <div
                          key={act._id}
                          className="p-2.5 hover:bg-gray-50/80 dark:hover:bg-zinc-900/50 transition flex items-start justify-between gap-3 text-[11px]"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 dark:text-zinc-500 text-[10px] whitespace-nowrap">
                                {dateStr} {timeStr}
                              </span>
                              <span
                                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                  act.action === 'CREATE'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : act.action === 'DELETE'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                    : act.action === 'UPDATE'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : act.action === 'PUBLISH'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                              >
                                {act.action}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                                {act.resourceType}
                              </span>
                            </div>

                            <p className="text-gray-800 dark:text-zinc-200 truncate">
                              {act.metadata?.title || `${act.action} ${act.resourceType}`}
                            </p>
                          </div>

                          {hasChanges && onOpenDiffModal && (
                            <button
                              onClick={() => onOpenDiffModal(act)}
                              className="px-1.5 py-0.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 underline whitespace-nowrap"
                            >
                              Diff
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
