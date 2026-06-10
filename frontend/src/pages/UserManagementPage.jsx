import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaCrown, FaTrash, FaUndo, FaSpinner, FaCheckCircle, FaInfoCircle, FaShieldAlt, FaHistory, FaTimes, FaCheck, FaDownload } from 'react-icons/fa';
import { analyticsAPI } from '../services/analyticsAPI';
import socket from '../services/socket';
import DownloadReportsModal from '../components/admin/DownloadReportsModal';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [filter, setFilter] = useState('');
    const [actioningUserId, setActioningUserId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isLogLoading, setIsLogLoading] = useState(false);
    const [planConfirm, setPlanConfirm] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null, data: null });

    const [summary, setSummary] = useState({
        totalUsers: 0,
        recentlyActiveCount: 0,
        liveUsers: 0
    });

    // Socket states
    const [liveUsersCount, setLiveUsersCount] = useState(0);
    const [trafficCount, setTrafficCount] = useState(0);
    const [liveUsersList, setLiveUsersList] = useState([]);
    const [isLiveUsersModalOpen, setIsLiveUsersModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await analyticsAPI.getUsers(search, roleFilter, sortBy, currentPage, 10, filter);
            setUsers(response.data.users || []);
            setTotalPages(response.data.pages || 1);
            setTotalUsers(response.data.total || 0);
            if (response.data.summary) {
                setSummary(response.data.summary);
            }
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err?.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, sortBy, currentPage, filter]);

    useEffect(() => {
        const timer = setTimeout(loadUsers, 300);
        return () => clearTimeout(timer);
    }, [search, roleFilter, sortBy, currentPage, loadUsers, filter]);

    // Auto-refresh summary data every 30 seconds
    useEffect(() => {
        const interval = setInterval(loadUsers, 30000);
        return () => clearInterval(interval);
    }, [loadUsers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter, sortBy, filter]);

    // Socket listeners
    useEffect(() => {
        socket.on('dashboard_live_stats', (data) => {
            setLiveUsersCount(data.liveUsers);
            setTrafficCount(data.trafficTabs);
        });

        socket.on('live_users_list', (data) => {
            setLiveUsersList(data);
        });

        // Request initial stats immediately on mount
        socket.emit('request_dashboard_stats');

        return () => {
            socket.off('dashboard_live_stats');
            socket.off('live_users_list');
        };
    }, []);

    const handleOpenManageModal = async (user) => {
        setSelectedUser(user);
        setShowModal(true);
        setLogs([]);
        setPlanConfirm(false);
        setIsLogLoading(true);
        try {
            const res = await analyticsAPI.getAdminLogs(user._id);
            setLogs(res.data || []);
        } catch (err) {
            console.error('Error loading logs:', err);
        } finally {
            setIsLogLoading(false);
        }
    };



    const handleExecuteAction = async () => {
        const { action, data } = confirmModal;
        setActioningUserId(selectedUser._id);
        setConfirmModal({ show: false, action: null, data: null });

        try {
            if (action === 'MANUAL_STATUS') {
                await analyticsAPI.suspendUser(selectedUser._id, data.isSuspended);
            }
            await loadUsers();
            setShowModal(false);
        } catch (err) {
            setError(err?.response?.data?.error || 'Action failed');
        } finally {
            setActioningUserId(null);
        }
    };

    const StatCard = ({ label, value, colorClass, onClick, pulse }) => (
        <div 
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''} ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}
        >
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                {pulse && <span className={`w-2 h-2 rounded-full animate-pulse ${colorClass.replace('text-', 'bg-')}`} />}
                {label}
            </p>
            <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        User & Subscription Control
                    </h1>
                    <p className={`text-sm mt-1 font-medium ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                        Manage student accounts, payments, subscriptions, and access permissions.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Live Users" value={liveUsersCount} colorClass={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} onClick={() => setIsLiveUsersModalOpen(true)} pulse={true} />
                <StatCard label="Traffic Tabs" value={trafficCount} colorClass={isLightMode ? 'text-blue-600' : 'text-blue-400'} pulse={true} />
                <StatCard label="Total Users" value={summary.totalUsers} colorClass={isLightMode ? 'text-slate-600' : 'text-slate-400'} />
                {sortBy === 'recentlyActive' && (
                    <StatCard label="Recently Active Users (24h)" value={`${summary.recentlyActiveCount || 0} Users`} colorClass={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
                )}
                
                <div 
                    onClick={() => setIsReportModalOpen(true)}
                    className={`cursor-pointer p-4 rounded-2xl border flex flex-col justify-center items-center gap-2 transition-all hover:-translate-y-1 ${isLightMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-500 shadow-blue-500/30 shadow-lg text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white shadow-blue-500/20 shadow-lg'}`}
                >
                    <FaDownload className="text-xl mb-1" />
                    <span className="text-xs font-black tracking-widest uppercase">Download Reports</span>
                </div>
            </div>

            {error && (
                <div className={`rounded-lg border p-4 ${isLightMode
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}>
                    {error}
                </div>
            )}

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { id: '', label: 'All Accounts' },
                    { id: 'suspended', label: 'Suspended Accounts' }
                ].map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => {
                            if (btn.roleFilter) setRoleFilter(btn.roleFilter);
                            setFilter(btn.id);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${(filter === btn.id && (!btn.roleFilter || roleFilter === btn.roleFilter))
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : isLightMode
                                ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                : 'bg-dark-100 border-white/5 text-secondary-400 hover:border-white/20'
                            }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className={`rounded-2xl border p-4 ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="relative flex-grow lg:flex-[2]">
                        <FaSearch className={`absolute left-3 top-3 ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Name, USN, email..."
                            className={`pl-10 pr-4 py-2 w-full rounded-xl border outline-none text-sm transition ${isLightMode
                                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                                : 'bg-white/5 border-white/10 text-white focus:border-blue-500'
                                }`}
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-grow lg:flex-[3]">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className={`px-3 py-2 rounded-xl border text-sm outline-none transition ${isLightMode ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'}`}
                        >
                            <option value="all">All Roles</option>
                            <option value="user">User Only</option>
                            <option value="admin">Admin Only</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`px-3 py-2 rounded-xl border text-sm outline-none transition ${isLightMode ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'}`}
                        >
                            <option value="recent">Recently Joined</option>
                            <option value="recentlyActive">Recently Active</option>
                        </select>

                        <div className={`hidden lg:flex items-center justify-center px-4 py-2 rounded-xl text-center font-bold text-sm ${isLightMode ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-secondary-400 border-slate-700'} border truncate`}>
                            {totalUsers} Students
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-dark-100 border-white/10'}`}>
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <p className="animate-pulse flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin" />
                            Syncing user data...
                        </p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No students match your search
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`${isLightMode ? 'bg-slate-50 border-b border-slate-200' : 'bg-white/5 border-b border-white/10'}`}>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Name</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">USN</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Joined Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Last Active</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Account Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user._id} className={`transition-colors hover:bg-white/5 group`}>
                                            <td className="px-6 py-5">
                                                <span className={`font-bold text-sm tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                    {user.name || 'Anonymous'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[11px] font-mono text-secondary-500 uppercase">
                                                    {user.usn || 'No Student ID'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] text-secondary-600">
                                                    {user.email}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] text-secondary-500">
                                                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-xs font-bold whitespace-nowrap ${isLightMode ? 'text-slate-700' : 'text-secondary-300'}`}>
                                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(user.lastActiveAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                    <span className={`text-xs font-bold ${user.isSuspended ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {user.isSuspended ? 'Suspended' : 'Active'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleOpenManageModal(user)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isLightMode
                                                        ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                                                        : 'bg-white/5 border-white/10 text-secondary-300 hover:bg-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className={`px-6 py-4 flex items-center justify-between border-t ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-white/5'}`}>
                                <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    Showing {Math.min(currentPage * 10, totalUsers)} of {totalUsers} students
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-xs">Prev</button>
                                    <span className="text-xs text-secondary-400">Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-xs">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Manage User Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 p-6 flex items-center justify-between border-b bg-inherit backdrop-blur-md rounded-t-3xl border-inherit">
                            <div>
                                <h2 className={`text-xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Manage Account</h2>
                                <p className="text-xs text-secondary-500 mt-1 font-mono uppercase">{selectedUser.usn} • {selectedUser.email}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-secondary-400">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Summary Section */}
                                <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <p className="text-[10px] uppercase font-black text-secondary-500 tracking-widest mb-1">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedUser.isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <p className={`text-lg font-bold ${selectedUser.isSuspended ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {selectedUser.isSuspended ? 'Suspended' : 'Active'}
                                        </p>
                                    </div>
                                </div>

                            {/* Danger Zone */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FaShieldAlt className="text-red-500" />
                                    <h3 className={`text-sm font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Security & Status</h3>
                                </div>
                                <div className={`flex flex-wrap gap-2 p-5 rounded-3xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-red-500/5 border-red-500/10'}`}>
                                    <button
                                        onClick={() => setConfirmModal({ show: true, action: 'MANUAL_STATUS', data: { isSuspended: !selectedUser.isSuspended, title: selectedUser.isSuspended ? 'Activate Account?' : 'Suspend Account?', message: selectedUser.isSuspended ? 'User will regain access to the platform.' : 'User will be blocked from logging in.' } })}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedUser.isSuspended
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                                    >
                                        {selectedUser.isSuspended ? 'Activate Account' : 'Suspend Account'}
                                    </button>
                                </div>
                            </div>

                            {/* Audit Trail */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-secondary-400">
                                    <FaHistory className="text-xs" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Audit Trail</h3>
                                </div>
                                {isLogLoading ? (
                                    <div className="py-8 text-center"><FaSpinner className="animate-spin inline-block text-secondary-600" /></div>
                                ) : logs.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-secondary-600">No admin actions recorded for this user.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {logs.map(log => (
                                            <div key={log._id} className={`p-3 rounded-2xl flex items-start gap-4 ${isLightMode ? 'bg-slate-50' : 'bg-white/5'}`}>
                                                <div className="mt-1">
                                                    {log.action.includes('UPGRADE') || log.action.includes('APPROVED') ? <FaCheckCircle className="text-emerald-500" /> : <FaHistory className="text-secondary-600" />}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-secondary-200'}`}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] text-secondary-500 flex items-center gap-2 mt-0.5">
                                                        <span>by {log.adminId?.name || 'Admin'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Double Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mb-4">
                            <FaShieldAlt className="w-5 h-5" />
                        </div>
                        <h3 className={`text-lg font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{confirmModal.data.title}</h3>
                        <p className="text-xs text-secondary-500 mt-2 mb-6 leading-relaxed">{confirmModal.data.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal({ show: false, action: null, data: null })} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-secondary-400 font-bold text-xs hover:bg-white/10">
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteAction}
                                disabled={actioningUserId === selectedUser?._id}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-black text-xs shadow-lg transition-all ${confirmModal.action === 'SUSPENDED_USER' ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}
                            >
                                {actioningUserId === selectedUser?._id ? <FaSpinner className="animate-spin inline-block" /> : 'Confirm Action'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Users Modal */}
            {isLiveUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsLiveUsersModalOpen(false)}>
                    <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`} onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center justify-between p-6 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h2 className={`text-xl font-bold flex items-center gap-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Logged-In Users ({liveUsersCount})
                            </h2>
                            <button onClick={() => setIsLiveUsersModalOpen(false)} className={`p-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
                            <table className={`w-full text-left border-collapse ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                                <thead>
                                    <tr className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                                        <th className="py-3 px-4 font-semibold text-sm">Name</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Email</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Role</th>
                                        <th className="py-3 px-4 font-semibold text-sm text-center">Active Tabs</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Online Since</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveUsersList.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500 italic">No users currently online.</td>
                                        </tr>
                                    ) : (
                                        liveUsersList.map((u, i) => (
                                            <tr key={u.userId || i} className={`border-b transition-colors ${isLightMode ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800 hover:bg-slate-800/50'}`}>
                                                <td className="py-3 px-4 font-medium">{u.name}</td>
                                                <td className="py-3 px-4">{u.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 font-mono">
                                                        {u.sockets?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {new Date(u.joinedAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            <DownloadReportsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                isLightMode={isLightMode}
            />
        </div>
    );
};

export default UserManagementPage;
