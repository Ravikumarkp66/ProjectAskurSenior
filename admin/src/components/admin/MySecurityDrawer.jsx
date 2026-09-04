import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import securityService from '../../services/securityService';

export default function MySecurityDrawer({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ currentSession: null, pastLogins: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await securityService.getMySecurityHistory();
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load personal security history:', err);
      setError('Could not load security history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Combine and deduplicate sessions
  const sessions = [];
  if (data.currentSession) {
    sessions.push(data.currentSession);
  }
  if (Array.isArray(data.pastLogins)) {
    data.pastLogins.forEach((s) => {
      const exists = sessions.some(
        (existing) => existing.sessionId === s.sessionId || (existing._id && s._id && existing._id === s._id)
      );
      if (!exists) {
        sessions.push(s);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl border-l border-gray-200 dark:border-zinc-800 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                My Security & Active Sessions
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Simple Table */}
          <div className="flex-1 overflow-y-auto p-5 text-xs">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                Loading sessions...
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400">
                {error}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">No session history found.</div>
            ) : (
              <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Device Type</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300">
                    {sessions.map((s) => {
                      const locationParts = [s.location?.city, s.location?.country].filter(Boolean);
                      const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown';
                      const deviceLabel = s.deviceType
                        ? `${s.deviceType} (${s.operatingSystem} • ${s.browser})`
                        : `${s.operatingSystem} • ${s.browser}`;

                      return (
                        <tr
                          key={s._id || s.sessionId}
                          className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition"
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">
                            {deviceLabel}
                          </td>
                          <td className="py-2.5 px-3">{locationText}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {new Date(s.loginTime).toLocaleDateString()}{' '}
                            <span className="font-mono text-[11px]">
                              {new Date(s.loginTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                            {s.ipAddress}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80 text-right">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
