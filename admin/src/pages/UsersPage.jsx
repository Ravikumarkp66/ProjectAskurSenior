import React, { useState, useEffect, useCallback, useMemo } from 'react';
import userService from '../services/userService';
import { isEmptyField, getMissingProfileFields, isNeverActive } from '../utils/userValidation';
import { X, Calendar, AlertTriangle, Sparkles, Shield, Clock } from 'lucide-react';
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

const REASON_PRESETS = [
  'Academic Excellence Scholarship',
  'Hackathon / Contest Winner',
  'Offline Direct Payment / Cash',
  'Faculty / Mentor Recommendation',
  'Beta Tester & Community Contributor'
];

export const UsersPage = () => {
  const { admin } = useAdminAuth();
  const { canView, canUpdate } = useMemo(() => canManageUsers(admin), [admin]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'plus' | 'free' | 'manual' | 'testUsers' | 'incomplete' | 'neverActive'
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    plusCount: 0,
    freeCount: 0,
    manualCount: 0,
    testUserCount: 0,
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
  const [actionMessage, setActionMessage] = useState(null);

  // Review modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [togglingTestUser, setTogglingTestUser] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // null | 'enable' | 'disable'

  // Manual Plus Grant modal state
  const [showManualPlusModal, setShowManualPlusModal] = useState(false);
  const [manualValidFrom, setManualValidFrom] = useState('');
  const [manualValidUntil, setManualValidUntil] = useState('');
  const [manualPreset, setManualPreset] = useState('1m');
  const [manualReason, setManualReason] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState(null);
  const [confirmRevokeManual, setConfirmRevokeManual] = useState(false);
  const [revokingManualPlus, setRevokingManualPlus] = useState(false);

  const fetchUsers = useCallback(async (targetPage = 1, query = '', tab = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers({
        page: targetPage,
        limit,
        search: query,
        filter: tab !== 'all' ? tab : ''
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

  const handleToggleTestAccess = async () => {
    if (!selectedUser || !canUpdate) return;
    const targetState = confirmAction === 'enable';
    try {
      setTogglingTestUser(true);
      setError(null);
      const res = await userService.setTestUserAccess(selectedUser._id || selectedUser.id, targetState);

      const updatedAccess = res.user?.access || {
        plan: targetState ? 'PLUS' : 'FREE',
        source: targetState ? 'TEST_USER' : 'NONE'
      };

      const updatedUser = {
        ...selectedUser,
        isTestUser: targetState,
        access: updatedAccess
      };

      setSelectedUser(updatedUser);

      // Update in local table list
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === (selectedUser._id || selectedUser.id) ? updatedUser : u))
      );

      setActionMessage(res.message || `Test access ${targetState ? 'enabled' : 'disabled'} successfully.`);
      setConfirmAction(null);
      setTimeout(() => setActionMessage(null), 4000);

      // Refresh stats
      fetchUsers(page, activeSearch, activeTab);
    } catch (err) {
      console.error('Failed to toggle test access:', err);
      setError(err.response?.data?.error || 'Failed to update test user access.');
    } finally {
      setTogglingTestUser(false);
    }
  };

  const applyPresetDuration = (presetKey, fromDateStr) => {
    const base = fromDateStr ? new Date(fromDateStr) : new Date();
    const d = new Date(base);
    if (presetKey === '1m') {
      d.setDate(d.getDate() + 30);
    } else if (presetKey === '3m') {
      d.setDate(d.getDate() + 90);
    } else if (presetKey === '6m') {
      d.setDate(d.getDate() + 180);
    } else if (presetKey === '1y') {
      d.setDate(d.getDate() + 365);
    }
    setManualPreset(presetKey);
    if (presetKey !== 'custom') {
      setManualValidUntil(d.toISOString().split('T')[0]);
    }
  };

  const handleOpenManualPlusModal = (user) => {
    const target = user || selectedUser;
    if (!target) return;
    setManualError(null);
    const todayStr = new Date().toISOString().split('T')[0];

    const existingGrant = target.plusGrant || (target.access?.source === 'MANUAL' ? target.access : null);
    if (existingGrant && existingGrant.validUntil) {
      const fromStr = existingGrant.validFrom ? new Date(existingGrant.validFrom).toISOString().split('T')[0] : todayStr;
      const untilStr = new Date(existingGrant.validUntil).toISOString().split('T')[0];
      setManualValidFrom(fromStr);
      setManualValidUntil(untilStr);
      setManualReason(existingGrant.reason || 'Manual Admin Grant');
      setManualPreset('custom');
    } else {
      setManualValidFrom(todayStr);
      const defaultUntil = new Date();
      defaultUntil.setDate(defaultUntil.getDate() + 30);
      setManualValidUntil(defaultUntil.toISOString().split('T')[0]);
      setManualPreset('1m');
      setManualReason('Academic Excellence Scholarship');
    }
    setShowManualPlusModal(true);
  };

  const handleSaveManualPlusGrant = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser || !canUpdate) return;

    if (!manualValidUntil) {
      setManualError('Please select a valid Expiry Date.');
      return;
    }

    const fromDate = manualValidFrom ? new Date(manualValidFrom) : new Date();
    const untilDate = new Date(manualValidUntil);

    if (untilDate <= fromDate) {
      setManualError('Expiry Date must be strictly after the Start Date.');
      return;
    }

    try {
      setManualSubmitting(true);
      setManualError(null);
      const res = await userService.grantManualPlusAccess(selectedUser._id || selectedUser.id, {
        validFrom: manualValidFrom || new Date().toISOString(),
        validUntil: manualValidUntil,
        reason: manualReason || 'Manual Admin Grant'
      });

      const updatedUser = {
        ...selectedUser,
        access: res.user?.access || {
          plan: 'PLUS',
          source: 'MANUAL',
          validFrom: manualValidFrom,
          validUntil: manualValidUntil,
          reason: manualReason
        },
        plusGrant: res.user?.plusGrant || {
          source: 'MANUAL',
          validFrom: new Date(manualValidFrom),
          validUntil: new Date(manualValidUntil),
          reason: manualReason,
          isActive: true
        }
      };

      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === (selectedUser._id || selectedUser.id) ? updatedUser : u))
      );

      setShowManualPlusModal(false);
      setActionMessage(`Manual Plus access successfully granted until ${new Date(manualValidUntil).toLocaleDateString('en-GB')}.`);
      setTimeout(() => setActionMessage(null), 5000);

      fetchUsers(page, activeSearch, activeTab);
    } catch (err) {
      console.error('Failed to grant manual plus:', err);
      setManualError(err.response?.data?.error || 'Failed to grant manual Plus access.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleRevokeManualPlus = async () => {
    if (!selectedUser || !canUpdate) return;
    try {
      setRevokingManualPlus(true);
      setError(null);
      const res = await userService.revokeManualPlusAccess(selectedUser._id || selectedUser.id, {
        reason: 'Revoked by admin'
      });

      const updatedUser = {
        ...selectedUser,
        access: res.user?.access || {
          plan: 'FREE',
          source: 'NONE'
        },
        plusGrant: res.user?.plusGrant || {
          isActive: false
        }
      };

      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === (selectedUser._id || selectedUser.id) ? updatedUser : u))
      );

      setConfirmRevokeManual(false);
      setActionMessage('Manual Plus access successfully revoked.');
      setTimeout(() => setActionMessage(null), 4000);

      fetchUsers(page, activeSearch, activeTab);
    } catch (err) {
      console.error('Failed to revoke manual plus:', err);
      setError(err.response?.data?.error || 'Failed to revoke manual Plus access.');
    } finally {
      setRevokingManualPlus(false);
    }
  };

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
            {activeTab === 'plus'
              ? 'Plus Users'
              : activeTab === 'free'
              ? 'Free Users'
              : activeTab === 'manual'
              ? 'Manual Plus Grants'
              : activeTab === 'testUsers'
              ? 'Test Users'
              : activeTab === 'incomplete'
              ? 'Incomplete Profiles'
              : activeTab === 'neverActive'
              ? 'Never Active Users'
              : 'Users'}
          </h1>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {activeTab === 'plus' ? (
              <>
                <span>Accounts with active AskUrSenior Plus entitlement.</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Plus Users: <span className="font-semibold text-purple-600 dark:text-purple-400">{(summary.plusCount || 0).toLocaleString()}</span></span>
              </>
            ) : activeTab === 'free' ? (
              <>
                <span>Standard accounts on Free student plan.</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Free Users: <span className="font-semibold text-gray-900 dark:text-gray-100">{(summary.freeCount || 0).toLocaleString()}</span></span>
              </>
            ) : activeTab === 'manual' ? (
              <>
                <span>Students granted Plus manually by Admin (non-payment override).</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Manual Grants: <span className="font-semibold text-blue-600 dark:text-blue-400">{(summary.manualCount || 0).toLocaleString()}</span></span>
              </>
            ) : activeTab === 'testUsers' ? (
              <>
                <span>Designated test accounts with manual Plus testing access.</span>
                <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
                <span>Test Users: <span className="font-semibold text-amber-600 dark:text-amber-400">{(summary.testUserCount || 0).toLocaleString()}</span></span>
              </>
            ) : activeTab === 'incomplete' ? (
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
                <span>Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.totalUsers.toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Plus: <span className="font-semibold text-purple-600 dark:text-purple-400">{(summary.plusCount || 0).toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Free: <span className="font-semibold text-gray-900 dark:text-gray-100">{(summary.freeCount || 0).toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Manual: <span className="font-semibold text-blue-600 dark:text-blue-400">{(summary.manualCount || 0).toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Test: <span className="font-semibold text-amber-600 dark:text-amber-400">{(summary.testUserCount || 0).toLocaleString()}</span></span>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <span>Live: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summary.liveUsers.toLocaleString()}</span></span>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-1 md:pt-0">
          {/* CSES Navigation Tabs */}
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
              All ({summary.totalUsers.toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('plus')}
              className={`${
                activeTab === 'plus'
                  ? 'text-purple-600 underline font-bold dark:text-purple-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Plus ({(summary.plusCount || 0).toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('free')}
              className={`${
                activeTab === 'free'
                  ? 'text-blue-600 underline font-bold dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Free ({(summary.freeCount || 0).toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('manual')}
              className={`${
                activeTab === 'manual'
                  ? 'text-blue-600 underline font-bold dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Manual ({(summary.manualCount || 0).toLocaleString()})
            </button>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => handleTabSwitch('testUsers')}
              className={`${
                activeTab === 'testUsers'
                  ? 'text-amber-600 underline font-bold dark:text-amber-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Test Users ({(summary.testUserCount || 0).toLocaleString()})
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
              Incomplete ({summary.incompleteProfileCount.toLocaleString()})
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
              placeholder="Name, USN, or email..."
              className="h-7 w-full sm:w-44 border border-gray-300 bg-white px-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-zinc-500 rounded-[6px]"
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setActiveSearch('');
                  setPage(1);
                  setVisibleCount(INITIAL_CHUNK_SIZE);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="h-7 border border-gray-300 bg-gray-50 px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-[6px]"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-[6px] font-mono">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 font-mono rounded-[6px]">
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
          <div className="py-6 text-xs text-gray-600 dark:text-gray-400 font-mono border border-gray-300 dark:border-zinc-700 p-4 text-center rounded-[8px]">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-gray-300 dark:border-zinc-700">
            <table className="w-full border-collapse text-left text-xs text-gray-900 dark:text-gray-200">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                  <th className="border-r border-gray-300 px-2 py-1 font-semibold dark:border-zinc-700 w-10 text-center text-gray-500 dark:text-gray-400 font-mono">#</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Name</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-32">USN</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700">Email</th>
                  <th className="border-r border-gray-300 px-2.5 py-1 font-semibold dark:border-zinc-700 w-32 text-center">Access</th>
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
                        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700/60 animate-pulse mx-auto" />
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
                        onClick={() => {
                          setSelectedUser(u);
                          setConfirmAction(null);
                          setConfirmRevokeManual(false);
                        }}
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
                        <td className="border-r border-gray-200 px-2.5 py-1 dark:border-zinc-800 text-center whitespace-nowrap">
                          {u.access?.plan === 'PLUS' ? (
                            u.access?.source === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                PLUS <span className="font-normal text-[9px] opacity-75">Admin</span>
                              </span>
                            ) : u.access?.source === 'MANUAL' ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                title={u.access?.validUntil ? `Expires: ${new Date(u.access.validUntil).toLocaleDateString()}` : 'Manual Admin Grant'}
                              >
                                PLUS <span className="font-normal text-[9px] opacity-75">Manual</span>
                              </span>
                            ) : u.access?.source === 'TEST_USER' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                PLUS <span className="font-normal text-[9px] opacity-75">Test User</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                PLUS <span className="font-normal text-[9px] opacity-75">Sub</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/50">
                              FREE
                            </span>
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

            {/* Chunked Progressive Loaded Users Bar */}
            {users.length > visibleCount && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-300 dark:border-zinc-700 bg-gray-50/90 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-mono">
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
          onClick={() => {
            setSelectedUser(null);
            setConfirmAction(null);
            setConfirmRevokeManual(false);
          }}
        >
          <div
            className="w-full max-w-lg border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 rounded-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  User Review
                </h2>
                {selectedUser.access?.plan === 'PLUS' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    PLUS ({selectedUser.access.source})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setConfirmAction(null);
                  setConfirmRevokeManual(false);
                }}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1.5 font-mono max-h-[70vh] overflow-y-auto pr-1">
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

              {/* ACCESS & ENTITLEMENT SECTION */}
              <div className="pt-2.5 border-t border-gray-200 dark:border-zinc-800 mt-2 space-y-2">
                <div className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-zinc-400 uppercase">
                  Access & Entitlement
                </div>

                {/* Case A: User is Admin */}
                {(selectedUser.access?.source === 'ADMIN' || selectedUser.isAdmin || selectedUser.role === 'admin' || selectedUser.role === 'SUPER_ADMIN') ? (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-[8px] font-sans">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        PLUS
                      </span>
                      <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                        Source: ADMIN
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Automatically granted through administrator role.
                    </p>
                  </div>
                ) : (
                  /* Case B: Student (Manual Grant / Test User / Free) */
                  <div className="space-y-2">
                    {/* Active Manual Grant Card */}
                    {selectedUser.access?.source === 'MANUAL' ? (
                      <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/70 rounded-[8px] font-sans space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                              PLUS
                            </span>
                            <span className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                              Manual Admin Grant
                            </span>
                          </div>

                          {canUpdate && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenManualPlusModal(selectedUser)}
                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 dark:bg-zinc-800 dark:text-blue-300 dark:border-blue-700 rounded-[6px]"
                              >
                                Extend / Edit Dates
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRevokeManual(true)}
                                className="px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50 dark:bg-zinc-800 dark:text-red-400 dark:border-red-800 rounded-[6px]"
                              >
                                Revoke Access
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Grant Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/70 dark:bg-zinc-900/60 p-2 rounded border border-blue-100 dark:border-blue-900/40 font-mono">
                          <div>
                            <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase">Valid From:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {formatDate(selectedUser.access?.validFrom || selectedUser.plusGrant?.validFrom)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase">Expires On:</span>
                            <span className="font-semibold text-blue-700 dark:text-blue-400">
                              {formatDate(selectedUser.access?.validUntil || selectedUser.plusGrant?.validUntil)}
                            </span>
                          </div>
                          {selectedUser.access?.reason && (
                            <div className="col-span-2 pt-1 border-t border-blue-100/60 dark:border-blue-900/30">
                              <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase">Reason / Notes:</span>
                              <span className="text-gray-800 dark:text-gray-200">{selectedUser.access.reason}</span>
                            </div>
                          )}
                        </div>

                        {/* Revoke Confirmation Box */}
                        {confirmRevokeManual && (
                          <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded mt-2 space-y-1.5">
                            <p className="font-semibold text-red-900 dark:text-red-200 text-xs">
                              Revoke Manual Plus Access?
                            </p>
                            <p className="text-[11px] text-red-800 dark:text-red-300">
                              This student will immediately lose all AskUrSenior Plus privileges and return to Free access.
                            </p>
                            <div className="flex justify-end gap-2 pt-1 font-mono">
                              <button
                                type="button"
                                onClick={() => setConfirmRevokeManual(false)}
                                className="px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={revokingManualPlus}
                                onClick={handleRevokeManualPlus}
                                className="px-2.5 py-0.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                              >
                                {revokingManualPlus ? 'Revoking...' : 'Confirm Revoke'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Non-Manual or Free User Card */
                      <div className="p-3 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 rounded-[8px] font-sans space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {selectedUser.access?.plan === 'PLUS' ? (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                PLUS
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                FREE
                              </span>
                            )}
                            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                              Source: {selectedUser.access?.source || (selectedUser.isTestUser ? 'TEST_USER' : 'NONE')}
                            </span>
                          </div>

                          {canUpdate && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenManualPlusModal(selectedUser)}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                              >
                                Grant Manual Plus
                              </button>
                              <button
                                type="button"
                                disabled={togglingTestUser}
                                onClick={() => setConfirmAction(selectedUser.isTestUser ? 'disable' : 'enable')}
                                className={`px-2 py-1 rounded text-xs font-medium transition ${
                                  selectedUser.isTestUser
                                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900'
                                    : 'bg-zinc-100 text-zinc-700 border border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {selectedUser.isTestUser ? 'Remove Test' : 'Test User'}
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {selectedUser.isTestUser
                            ? 'Testing Account Entitlement — Full AskUrSenior Plus access enabled for internal testing.'
                            : 'Standard Free Student Access — No Plus entitlement active.'}
                        </p>

                        {/* Inline Test User Confirmation Box */}
                        {confirmAction && (
                          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded mt-2 space-y-1.5">
                            <p className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                              {confirmAction === 'enable' ? 'Enable Test Access?' : 'Remove Test Access?'}
                            </p>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                              {confirmAction === 'enable'
                                ? 'This user will receive full AskUrSenior Plus access for testing without payment.'
                                : "This will remove the user's TEST USER Plus entitlement."}
                            </p>
                            <div className="flex justify-end gap-2 pt-1 font-mono">
                              <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={togglingTestUser}
                                onClick={handleToggleTestAccess}
                                className={`px-2.5 py-0.5 text-xs font-semibold text-white rounded disabled:opacity-50 ${
                                  confirmAction === 'enable' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                {togglingTestUser ? 'Updating...' : confirmAction === 'enable' ? 'Enable Test Access' : 'Remove Access'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                onClick={() => {
                  setSelectedUser(null);
                  setConfirmAction(null);
                  setConfirmRevokeManual(false);
                }}
                className="border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-[6px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MANUAL PLUS GRANT MODAL */}
      {showManualPlusModal && selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowManualPlusModal(false)}
        >
          <div
            className="w-full max-w-lg border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-xl dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 rounded-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100">
                  Grant Manual AskUrSenior Plus Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualPlusModal(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Student Identity Banner */}
            <div className="mt-3 p-2.5 bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 rounded-[6px] font-mono text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{selectedUser.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">({selectedUser.usn || selectedUser.studentId})</span>
              </div>
              <span className="text-blue-600 dark:text-blue-400 text-[11px]">{selectedUser.email}</span>
            </div>

            {/* MANDATORY EXPLICIT MANUAL NOTICE */}
            <div className="mt-2.5 p-2.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-[6px] text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">MANUAL ADMINISTRATIVE GRANT:</strong> This entitlement is an administrative override marked with <span className="font-mono font-bold">source: MANUAL</span>. It is <strong className="underline">NOT</strong> recorded as a payment gateway transaction and will not affect financial reconciliation.
              </div>
            </div>

            {/* Error Message */}
            {manualError && (
              <div className="mt-2.5 p-2 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-[6px] text-red-700 dark:text-red-300 text-xs font-mono">
                {manualError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveManualPlusGrant} className="mt-3.5 space-y-3">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Start Date (Valid From)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={manualValidFrom}
                    onChange={(e) => {
                      setManualValidFrom(e.target.value);
                      if (manualPreset !== 'custom') {
                        applyPresetDuration(manualPreset, e.target.value);
                      }
                    }}
                    className="w-full h-8 px-2.5 text-xs font-mono border border-gray-300 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 rounded-[6px] focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Expiry Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Duration Preset
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {[
                    { key: '1m', label: '1 Month' },
                    { key: '3m', label: '3 Months (Sem)' },
                    { key: '6m', label: '6 Months' },
                    { key: '1y', label: '1 Year' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPresetDuration(p.key, manualValidFrom)}
                      className={`h-7 px-2 border rounded-[6px] text-[11px] font-medium transition ${
                        manualPreset === p.key
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300 font-bold'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* End / Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date (Valid Until / Expiration) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={manualValidUntil}
                  onChange={(e) => {
                    setManualValidUntil(e.target.value);
                    setManualPreset('custom');
                  }}
                  className="w-full h-8 px-2.5 text-xs font-mono border border-gray-300 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 rounded-[6px] focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* Reason / Administrative Rationale */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Reason & Administrative Reference Notes
                </label>
                {/* Reason Presets */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {REASON_PRESETS.map((presetText) => (
                    <button
                      key={presetText}
                      type="button"
                      onClick={() => setManualReason(presetText)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                        manualReason === presetText
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200 font-bold'
                          : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {presetText}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Enter specific grant justification (e.g. Scholarship #104, Hackathon 1st place, Dean's approval)..."
                  className="w-full p-2 text-xs border border-gray-300 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 rounded-[6px] focus:border-blue-600 focus:outline-none font-sans"
                  required
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowManualPlusModal(false)}
                  className="px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[6px] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {manualSubmitting ? 'Granting Access...' : 'Confirm & Grant Plus Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
