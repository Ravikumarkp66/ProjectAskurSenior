import React from 'react';

export default function ActivityDiffModal({ activity, onClose }) {
  if (!activity) return null;

  const changes = activity.metadata?.changes || null;
  const affectedIds = activity.metadata?.affectedIds || [];
  const extra = activity.metadata?.extra || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <div>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">
              Activity Details & Diffs
            </span>
            <span className="ml-2 text-[11px] text-gray-500 dark:text-zinc-400">
              [{activity.action}] {activity.resourceType}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Action Overview */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 dark:bg-zinc-900/40 rounded border border-gray-200 dark:border-zinc-800/80 text-[11px]">
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Admin: </span>
              <strong className="text-gray-800 dark:text-zinc-200">{activity.adminName}</strong>
            </div>
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Email: </span>
              <span className="text-gray-700 dark:text-zinc-300">{activity.adminEmail}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Department: </span>
              <span className="text-gray-800 dark:text-zinc-200">{activity.departmentCode || 'ALL'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Date/Time: </span>
              <span className="text-gray-800 dark:text-zinc-200">
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
            {activity.metadata?.title && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-zinc-400">Resource: </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {activity.metadata.title}
                </span>
              </div>
            )}
          </div>

          {/* Field Changes Diff */}
          {changes && Object.keys(changes).length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                Field Diffs (Old vs New):
              </h4>
              <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
                {Object.entries(changes).map(([field, diff]) => (
                  <div key={field} className="p-2.5 bg-white dark:bg-[#141416]">
                    <div className="font-bold text-gray-800 dark:text-zinc-200 mb-1.5 uppercase text-[10px] tracking-wider">
                      {field}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded">
                        <span className="block text-[9px] uppercase font-bold text-red-500 dark:text-red-400 mb-0.5">
                          - Old Value
                        </span>
                        <pre className="whitespace-pre-wrap break-all font-mono">
                          {typeof diff?.old === 'object' ? JSON.stringify(diff?.old, null, 2) : String(diff?.old ?? 'None')}
                        </pre>
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded">
                        <span className="block text-[9px] uppercase font-bold text-emerald-500 dark:text-emerald-400 mb-0.5">
                          + New Value
                        </span>
                        <pre className="whitespace-pre-wrap break-all font-mono">
                          {typeof diff?.new === 'object' ? JSON.stringify(diff?.new, null, 2) : String(diff?.new ?? 'None')}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 dark:text-zinc-400 italic">
              No specific field diffs recorded for this action.
            </div>
          )}

          {/* Bulk Affected IDs */}
          {affectedIds && affectedIds.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  Affected Records ({affectedIds.length}):
                </h4>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-zinc-900/40 rounded border border-gray-200 dark:border-zinc-800 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] text-gray-600 dark:text-zinc-400">
                  {affectedIds.map((id, i) => (
                    <div key={i} className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded truncate">
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Extra metadata */}
          {extra && Object.keys(extra).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                Extra Parameters:
              </h4>
              <pre className="p-2 bg-gray-50 dark:bg-zinc-900/50 rounded border border-gray-200 dark:border-zinc-800 text-[11px] overflow-x-auto text-gray-700 dark:text-zinc-300">
                {JSON.stringify(extra, null, 2)}
              </pre>
            </div>
          )}

          {/* Network context */}
          {(activity.metadata?.ip || activity.metadata?.userAgent) && (
            <div className="text-[10px] text-gray-400 dark:text-zinc-500 border-t border-gray-100 dark:border-zinc-800/80 pt-2 space-y-0.5">
              {activity.metadata?.ip && <div>IP Address: {activity.metadata.ip}</div>}
              {activity.metadata?.userAgent && (
                <div className="truncate" title={activity.metadata.userAgent}>
                  User Agent: {activity.metadata.userAgent}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-2.5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
