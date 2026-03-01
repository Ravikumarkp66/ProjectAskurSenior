import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaCrown, FaTrash, FaUndo, FaSpinner, FaCheckCircle, FaInfoCircle, FaShieldAlt, FaHistory, FaTimes, FaCheck } from 'react-icons/fa';
import { analyticsAPI } from '../services/analyticsAPI';
import { paymentAPI } from '../services/api';

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
        activeSubscriptions: 0,
        pendingPayments: 0,
        expiringSoon: 0
    });

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

    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter, sortBy, filter]);

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

    const handleApprovePayment = async (paymentId) => {
        setConfirmModal({
            show: true,
            action: 'APPROVE_PAYMENT',
            data: { paymentId, title: 'Approve Payment?', message: 'This will automatically upgrade the user to ASK+ for 30 days.' }
        });
    };

    const handleRejectPayment = async (paymentId) => {
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;
        setActioningUserId(selectedUser._id);
        try {
            await paymentAPI.verifyPayment(paymentId, 'rejected', reason);
            await loadUsers();
            setShowModal(false);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to reject payment');
        } finally {
            setActioningUserId(null);
        }
    };

    const handleExecuteAction = async () => {
        const { action, data } = confirmModal;
        setActioningUserId(selectedUser._id);
        setConfirmModal({ show: false, action: null, data: null });

        try {
            if (action === 'APPROVE_PAYMENT') {
                await paymentAPI.verifyPayment(data.paymentId, 'approved');
            } else if (action === 'MANUAL_PLAN') {
                await analyticsAPI.togglePremium(selectedUser._id, data.isPremium);
            } else if (action === 'MANUAL_STATUS') {
                await analyticsAPI.banUser(selectedUser._id, data.isBanned);
            } else if (action === 'RESET_ROLE') {
                await analyticsAPI.resetUserRole(selectedUser._id);
            }
            await loadUsers();
            setShowModal(false);
        } catch (err) {
            setError(err?.response?.data?.error || 'Action failed');
        } finally {
            setActioningUserId(null);
        }
    };

    const StatCard = ({ label, value, colorClass }) => (
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>{label}</p>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={summary.totalUsers} colorClass={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
                <StatCard label="Active ASK+" value={summary.activeSubscriptions} colorClass={isLightMode ? 'text-amber-600' : 'text-amber-400'} />
                <StatCard label="Pending Payments" value={summary.pendingPayments} colorClass={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
                <StatCard label="Expiring Soon" value={summary.expiringSoon} colorClass={isLightMode ? 'text-red-600' : 'text-red-400'} />
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
                    { id: 'free', label: 'Free Plan', roleFilter: 'user' },
                    { id: 'askplus', label: 'ASK+', roleFilter: 'user' },
                    { id: 'pending_payment', label: 'Pending Payments' }
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
                            <option value="active">Recently Active</option>
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
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Student Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Plan / Expiry</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Payment Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Method</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">UTR (Manual)</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500">Account Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user._id} className={`transition-colors hover:bg-white/5 group`}>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                        {user.name || 'Anonymous'}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-secondary-500 uppercase mt-0.5">
                                                        {user.usn || 'No Student ID'}
                                                    </span>
                                                    <span className="text-[10px] text-secondary-600 mt-0.5">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${user.subscription === 'askplus' ? 'text-amber-500' : 'text-secondary-400'}`}>
                                                        {user.subscription === 'askplus' ? 'ASK+ Active' : 'Free Plan'}
                                                    </span>
                                                    {user.subscription === 'askplus' && user.subscriptionExpiry && (
                                                        <span className="text-[10px] text-secondary-500 mt-1">
                                                            Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center">
                                                    {user.paymentStatus === 'approved' && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Approved
                                                        </span>
                                                    )}
                                                    {user.paymentStatus === 'pending' && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {user.paymentStatus === 'rejected' && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                            Rejected
                                                        </span>
                                                    )}
                                                    {!user.paymentStatus && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-secondary-400 border border-white/5">
                                                            No Payment
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] font-bold text-secondary-500 uppercase">
                                                    Manual
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {user.utrNumber ? (
                                                    <span
                                                        title={user.utrNumber}
                                                        className="font-mono text-[11px] text-secondary-400 cursor-help border-b border-dashed border-secondary-600"
                                                    >
                                                        {user.utrNumber.length > 10
                                                            ? `${user.utrNumber.substring(0, 6)}...${user.utrNumber.slice(-4)}`
                                                            : user.utrNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-secondary-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isBanned ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                        <span className={`text-xs font-bold ${user.isBanned ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {user.isBanned ? 'Suspended' : 'Active Account'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-secondary-500 mt-1 pl-3.5">
                                                        Joined: {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <p className="text-[10px] uppercase font-black text-secondary-500 tracking-widest mb-1">Current Plan</p>
                                    <p className={`text-lg font-bold ${selectedUser.subscription === 'askplus' ? 'text-amber-500' : isLightMode ? 'text-slate-700' : 'text-white'}`}>
                                        {selectedUser.subscription === 'askplus' ? 'ASK+' : 'Free Plan'}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <p className="text-[10px] uppercase font-black text-secondary-500 tracking-widest mb-1">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedUser.isBanned ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <p className={`text-lg font-bold ${selectedUser.isBanned ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {selectedUser.isBanned ? 'Suspended' : 'Active'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Section */}
                            {selectedUser.paymentStatus === 'pending' && (
                                <div className={`p-6 rounded-3xl border bg-purple-500/5 border-purple-500/20 relative overflow-hidden group`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <FaCrown className="w-12 h-12 text-purple-500" />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 mt-1">
                                                <FaInfoCircle />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-purple-300">Pending Payment Approval</h3>
                                                <p className="text-xs text-secondary-400 mt-1">UTR: <span className="font-mono text-purple-400">{selectedUser.utrNumber}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprovePayment(selectedUser.latestPayment[0]?._id)}
                                                className="flex-grow flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-black text-xs hover:bg-purple-600 transition-all"
                                            >
                                                <FaCheckCircle /> Approve & Upgrade
                                            </button>
                                            <button
                                                onClick={() => handleRejectPayment(selectedUser.latestPayment[0]?._id)}
                                                className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-xs hover:bg-red-500/20 transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan Control */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FaCrown className="text-amber-500" />
                                    <h3 className={`text-sm font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Subscription Control</h3>
                                </div>
                                <div className={`space-y-4 p-5 rounded-3xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black uppercase text-secondary-500">Change Subscription Plan Manually</label>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={selectedUser.subscription === 'free'}
                                                onClick={() => setConfirmModal({ show: true, action: 'MANUAL_PLAN', data: { isPremium: false, title: 'Downgrade to Free?', message: 'Remove all ASK+ benefits from this student.' } })}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedUser.subscription === 'free' ? 'opacity-30 bg-white/5 border-white/5' : 'bg-white/5 border-white/10 hover:bg-white/10 text-secondary-300'}`}
                                            >
                                                Free Plan
                                            </button>
                                            <button
                                                disabled={selectedUser.subscription === 'askplus'}
                                                onClick={() => setConfirmModal({ show: true, action: 'MANUAL_PLAN', data: { isPremium: true, title: 'Upgrade to ASK+?', message: 'Grant 30 days of premium access without payment verification.' } })}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedUser.subscription === 'askplus' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white/5 border-white/10 hover:bg-white/10 text-amber-500'}`}
                                            >
                                                ASK+
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-dashed border-white/10">
                                        <label className={`flex items-start gap-3 cursor-pointer group`}>
                                            <div className="relative mt-0.5">
                                                <input type="checkbox" className="sr-only" checked={planConfirm} onChange={(e) => setPlanConfirm(e.target.checked)} />
                                                <div className={`w-4 h-4 rounded border transition-colors ${planConfirm ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
                                                    {planConfirm && <FaCheck className="text-[8px] text-white absolute left-0.5 top-0.5" />}
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-medium text-secondary-400 group-hover:text-secondary-300 leading-tight">I understand that manual changes override payment verification logs.</span>
                                        </label>
                                    </div>
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
                                        onClick={() => setConfirmModal({ show: true, action: 'MANUAL_STATUS', data: { isBanned: !selectedUser.isBanned, title: selectedUser.isBanned ? 'Activate Account?' : 'Suspend Account?', message: selectedUser.isBanned ? 'User will regain access to the platform.' : 'User will be blocked from logging in.' } })}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedUser.isBanned
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                                    >
                                        {selectedUser.isBanned ? 'Activate Account' : 'Suspend Account'}
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ show: true, action: 'RESET_ROLE', data: { title: 'Emergency Reset?', message: 'This will reset role to student, unban user, and clear all special permissions.' } })}
                                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-secondary-400 hover:bg-white/10 transition-all"
                                    >
                                        Emergency Reset
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
        </div>
    );
};

export default UserManagementPage;
