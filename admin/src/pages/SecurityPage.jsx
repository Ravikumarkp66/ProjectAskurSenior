import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import securityService from '../services/securityService';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('suspicious'); // 'suspicious' | 'logs' | 'sessions'
  const [overview, setOverview] = useState({
    activeSessions: 0,
    highRiskSessions: 0,
    replacedSessions: 0,
    recentLogins24h: 0,
    suspiciousAccounts: 0
  });

  // Suspicious Feed
  const [suspiciousList, setSuspiciousList] = useState([]);
  const [loadingSuspicious, setLoadingSuspicious] = useState(false);

  // All Logs
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [logFilters, setLogFilters] = useState({
    search: '',
    riskLevel: 'ALL',
    status: 'ALL',
    deviceType: 'ALL'
  });
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Modal for Detailed View
  const [selectedSession, setSelectedSession] = useState(null);

  // Notification message
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    loadOverview();
    loadSuspiciousFeed();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'sessions') {
      loadActiveSessions();
    } else if (activeTab === 'suspicious') {
      loadSuspiciousFeed();
    }
  }, [activeTab]);

  const showNotice = (msg, isError = false) => {
    setActionNotice({ msg, isError });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const loadOverview = async () => {
    try {
      const res = await securityService.getOverview();
      if (res?.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to load security overview:', err);
    }
  };

  const loadSuspiciousFeed = async () => {
    try {
      setLoadingSuspicious(true);
      const res = await securityService.getSuspiciousLogins();
      if (res?.success) {
        setSuspiciousList(res.data);
      }
    } catch (err) {
      showNotice('Failed to load suspicious logins', true);
    } finally {
      setLoadingSuspicious(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      setLoadingLogs(true);
      const res = await securityService.getLogs({
        page,
        limit: 15,
        ...logFilters
      });
      if (res?.success) {
        setLogs(res.data.logs);
        setLogPagination({
          page: res.data.page,
          totalPages: res.data.totalPages,
          total: res.data.total
        });
      }
    } catch (err) {
      showNotice('Failed to load login history', true);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await securityService.getActiveSessions({ search: sessionSearch });
      if (res?.success) {
        setActiveSessions(res.data);
      }
    } catch (err) {
      showNotice('Failed to load active sessions', true);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevoke = async (id, email) => {
    if (!window.confirm(`Revoke active session for ${email}?`)) return;
    try {
      await securityService.revokeSession(id, 'Admin manual revocation');
      showNotice(`Session for ${email} revoked.`);
      loadOverview();
      if (activeTab === 'suspicious') loadSuspiciousFeed();
      if (activeTab === 'logs') loadLogs(logPagination.page);
      if (activeTab === 'sessions') loadActiveSessions();
    } catch (err) {
      showNotice('Failed to revoke session', true);
    }
  };

  const handleRevokeAllUser = async (userId, email) => {
    if (!window.confirm(`Revoke ALL active sessions for ${email}?`)) return;
    try {
      await securityService.revokeAllUserSessions(userId, 'Admin bulk revocation');
      showNotice(`All active sessions for ${email} revoked.`);
      loadOverview();
      if (activeTab === 'sessions') loadActiveSessions();
      if (activeTab === 'logs') loadLogs(logPagination.page);
    } catch (err) {
      showNotice('Failed to revoke user sessions', true);
    }
  };

  const handleMarkSafe = async (id) => {
    try {
      await securityService.markSafe(id);
      showNotice('Login marked as safe. Account security status cleared.');
      loadOverview();
      loadSuspiciousFeed();
    } catch (err) {
      showNotice('Failed to mark safe', true);
    }
  };

  const handleToggleAccount = async (userId, currentlyDisabled, email) => {
    const actionText = currentlyDisabled ? 're-enable' : 'DISABLE (suspend)';
    if (!window.confirm(`Are you sure you want to ${actionText} account ${email}?`)) return;

    try {
      await securityService.toggleAccount(userId, !currentlyDisabled, 'Admin manual action');
      showNotice(`Account ${email} ${currentlyDisabled ? 'enabled' : 'disabled'}.`);
      loadOverview();
      if (activeTab === 'suspicious') loadSuspiciousFeed();
    } catch (err) {
      showNotice('Failed to change account status', true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toast / Banner */}
      {actionNotice && (
        <div
          className={`p-3 rounded-md text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-150 ${
            actionNotice.isError
              ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          <span>{actionNotice.msg}</span>
          <button onClick={() => setActionNotice(null)} className="text-xs font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Security & Login Monitoring
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Single-device session enforcement, risk scoring, impossible travel detection, and active session control.
          </p>
        </div>

        <button
          onClick={() => {
            loadOverview();
            if (activeTab === 'suspicious') loadSuspiciousFeed();
            if (activeTab === 'logs') loadLogs(logPagination.page);
            if (activeTab === 'sessions') loadActiveSessions();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            Active Sessions
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {overview.activeSessions}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            High Risk Logins
          </div>
          <div className="text-xl font-mono font-bold text-red-600 dark:text-red-400 mt-1">
            {overview.highRiskSessions}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            Replaced Sessions
          </div>
          <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
            {overview.replacedSessions}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            24h Logins
          </div>
          <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
            {overview.recentLogins24h}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            Suspicious Accounts
          </div>
          <div className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
            {overview.suspiciousAccounts}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold gap-4 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('suspicious')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'suspicious'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Suspicious Logins</span>
          {suspiciousList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-mono">
              {suspiciousList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-500" />
          <span>Active Sessions Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Global Login History</span>
        </button>
      </div>

      {/* TAB 1: SUSPICIOUS LOGINS FEED */}
      {activeTab === 'suspicious' && (
        <div className="space-y-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Logins triggered by anomaly rules (Risk $\ge 50$ or Impossible Travel). High risk marks the user as suspicious for review, leaving account active unless you choose to disable.
          </div>

          {loadingSuspicious ? (
            <div className="text-center py-12 text-xs text-gray-500">Scanning for suspicious activity...</div>
          ) : suspiciousList.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">No Suspicious Logins</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All recent logins appear normal and match expected device and geographic profiles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousList.map((item) => {
                const isHigh = item.riskLevel === 'HIGH' || item.riskScore >= 70;
                return (
                  <div
                    key={item._id}
                    className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {item.email}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            isHigh
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          RISK {item.riskScore} ({item.riskLevel})
                        </span>

                        {item.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {item.status}
                          </span>
                        )}

                        {item.isAccountDisabled && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white">
                            ACCOUNT SUSPENDED
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          {item.deviceType === 'Mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                          {item.operatingSystem} • {item.browser}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          IP: {item.ipAddress} ({item.location?.city || 'Unknown'}, {item.location?.country || 'Unknown'})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.loginTime).toLocaleString()}
                        </span>
                      </div>

                      {/* Triggered Signals */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(item.riskSignals || []).map((sig) => (
                          <span
                            key={sig}
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            {sig.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedSession(item)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>

                      <button
                        onClick={() => handleMarkSafe(item._id)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Safe
                      </button>

                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(item._id, item.email)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Revoke Session
                        </button>
                      )}

                      {item.userId && (
                        <button
                          onClick={() => handleToggleAccount(item.userId, item.isAccountDisabled, item.email)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${
                            item.isAccountDisabled
                              ? 'bg-blue-600 text-white hover:bg-blue-500'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {item.isAccountDisabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          {item.isAccountDisabled ? 'Enable Account' : 'Disable Account'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE SESSIONS DIRECTORY */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadActiveSessions()}
                placeholder="Search active sessions by email or IP..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              onClick={loadActiveSessions}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-500 text-white"
            >
              Search
            </button>
          </div>

          {loadingSessions ? (
            <div className="text-center py-12 text-xs text-gray-500">Loading active sessions...</div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
              No active sessions found.
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 uppercase font-semibold text-[10px]">
                    <th className="p-3">User</th>
                    <th className="p-3">Device & Browser</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Signed In</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {activeSessions.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="p-3 font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {s.email}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {s.operatingSystem} • {s.browser}
                      </td>
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                        {s.ipAddress}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {s.location?.city || 'Unknown'}, {s.location?.country || ''}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">
                        {new Date(s.loginTime).toLocaleDateString()} {new Date(s.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">
                        {s.lastActive ? new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleRevoke(s._id, s.email)}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          Revoke
                        </button>
                        {s.userId && (
                          <button
                            onClick={() => handleRevokeAllUser(s.userId, s.email)}
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                          >
                            Revoke All
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GLOBAL LOGIN HISTORY */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={logFilters.search}
                onChange={(e) => setLogFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && loadLogs(1)}
                placeholder="Search email, IP, browser, city..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Risk:</span>
              <select
                value={logFilters.riskLevel}
                onChange={(e) => setLogFilters((prev) => ({ ...prev, riskLevel: e.target.value }))}
                className="border border-gray-300 dark:border-zinc-700 rounded py-1 px-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              >
                <option value="ALL">All Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Status:</span>
              <select
                value={logFilters.status}
                onChange={(e) => setLogFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 dark:border-zinc-700 rounded py-1 px-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="REPLACED">REPLACED</option>
                <option value="LOGGED_OUT">LOGGED_OUT</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>

            <button
              onClick={() => loadLogs(1)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white"
            >
              Apply Filters
            </button>
          </div>

          {loadingLogs ? (
            <div className="text-center py-12 text-xs text-gray-500">Loading login history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
              No login logs match criteria.
            </div>
          ) : (
            <>
              <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 uppercase font-semibold text-[10px]">
                      <th className="p-3">Time</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Device / OS</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Risk</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="p-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(log.loginTime).toLocaleDateString()}{' '}
                          <span className="font-mono text-[11px]">
                            {new Date(log.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {log.email}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {log.operatingSystem} • {log.browser}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                          {log.ipAddress}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {log.location?.city || 'Unknown'}, {log.location?.country || ''}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              log.riskLevel === 'HIGH'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : log.riskLevel === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {log.riskScore}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.status === 'REPLACED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : log.status === 'REVOKED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedSession(log)}
                            className="text-blue-600 hover:underline dark:text-blue-400 font-semibold"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                <span>
                  Showing {logs.length} of {logPagination.total} logs
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logPagination.page <= 1}
                    onClick={() => loadLogs(logPagination.page - 1)}
                    className="p-1 rounded border border-gray-300 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {logPagination.page} of {logPagination.totalPages || 1}
                  </span>
                  <button
                    disabled={logPagination.page >= logPagination.totalPages}
                    onClick={() => loadLogs(logPagination.page + 1)}
                    className="p-1 rounded border border-gray-300 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SESSION DETAILS MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Session Metadata & Risk Inspection
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">User Email:</span>
                <span className="col-span-2 font-mono font-bold">{selectedSession.email}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Session ID:</span>
                <span className="col-span-2 font-mono break-all">{selectedSession.sessionId}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Device & OS:</span>
                <span className="col-span-2">
                  {selectedSession.operatingSystem} ({selectedSession.deviceType})
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Browser:</span>
                <span className="col-span-2">{selectedSession.browser}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">IP Address:</span>
                <span className="col-span-2 font-mono">{selectedSession.ipAddress}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Approx Location:</span>
                <span className="col-span-2">
                  {selectedSession.location?.city || 'Unknown'}, {selectedSession.location?.state || ''},{' '}
                  {selectedSession.location?.country || 'Unknown'} (Approximate)
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Risk Score:</span>
                <span className="col-span-2 font-bold font-mono">
                  {selectedSession.riskScore}/100 ({selectedSession.riskLevel})
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Triggered Signals:</span>
                <span className="col-span-2 font-mono">
                  {(selectedSession.riskSignals || []).join(', ') || 'None'}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="font-semibold text-gray-500">Login Time:</span>
                <span className="col-span-2">{new Date(selectedSession.loginTime).toLocaleString()}</span>
              </div>
              {selectedSession.logoutTime && (
                <div className="grid grid-cols-3 py-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-semibold text-gray-500">Logout Time:</span>
                  <span className="col-span-2">
                    {new Date(selectedSession.logoutTime).toLocaleString()} ({selectedSession.logoutReason || 'Normal'})
                  </span>
                </div>
              )}
              <div className="py-1">
                <span className="font-semibold text-gray-500 block mb-1">User-Agent:</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all bg-gray-50 dark:bg-zinc-800 p-2 rounded block">
                  {selectedSession.userAgent || 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
