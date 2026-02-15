import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaStar, FaBan, FaUndo } from 'react-icons/fa';
import { analyticsAPI } from '../services/analyticsAPI';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [actioningUserId, setActioningUserId] = useState(null);

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
            const response = await analyticsAPI.getUsers(search, roleFilter, sortBy);
            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err?.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, sortBy]);

    useEffect(() => {
        const timer = setTimeout(loadUsers, 300);
        return () => clearTimeout(timer);
    }, [search, roleFilter, sortBy, loadUsers]);

    const handleTogglePremium = async (userId) => {
        setActioningUserId(userId);
        try {
            const user = users.find(u => u._id === userId);
            const isPremium = user.role === 'premium';
            await analyticsAPI.togglePremium(userId, !isPremium);
            await loadUsers();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to update premium status');
        } finally {
            setActioningUserId(null);
        }
    };

    const handleBanUser = async (userId) => {
        setActioningUserId(userId);
        try {
            const user = users.find(u => u._id === userId);
            await analyticsAPI.banUser(userId, !user.isBanned);
            await loadUsers();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to update user status');
        } finally {
            setActioningUserId(null);
        }
    };

    const handleResetRole = async (userId) => {
        if (!window.confirm('Reset user to default role?')) return;
        
        setActioningUserId(userId);
        try {
            await analyticsAPI.resetUserRole(userId);
            await loadUsers();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to reset user role');
        } finally {
            setActioningUserId(null);
        }
    };

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50' : 'bg-primary-900'}`}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        User Management
                    </h1>
                    <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                        Manage users, roles, and permissions
                    </p>
                </div>

                {error && (
                    <div className={`rounded-lg border p-4 mb-6 ${isLightMode
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}>
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className={`rounded-xl border p-6 mb-6 ${isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-dark-100 border-white/10'
                }`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-secondary-300'}`}>
                                Search
                            </label>
                            <div className={`mt-2 relative rounded-lg overflow-hidden ${isLightMode ? 'bg-slate-50' : 'bg-white/5'}`}>
                                <FaSearch className={`absolute left-3 top-3 ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name, USN, email..."
                                    className={`pl-10 pr-4 py-2 w-full bg-transparent outline-none text-sm ${isLightMode
                                        ? 'text-slate-900 placeholder-slate-400'
                                        : 'text-white placeholder-secondary-500'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-secondary-300'}`}>
                                Role
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className={`mt-2 w-full px-3 py-2 rounded-lg border text-sm outline-none ${isLightMode
                                    ? 'bg-white border-slate-200 text-slate-900'
                                    : 'bg-slate-800 border-slate-600 text-white'
                                }`}
                            >
                                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Roles</option>
                                <option value="user" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">User</option>
                                <option value="admin" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Admin</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-secondary-300'}`}>
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={`mt-2 w-full px-3 py-2 rounded-lg border text-sm outline-none ${isLightMode
                                    ? 'bg-white border-slate-200 text-slate-900'
                                    : 'bg-slate-800 border-slate-600 text-white'
                                }`}
                            >
                                <option value="recent" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Recently Joined</option>
                                <option value="active" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Recently Active</option>
                            </select>
                        </div>

                        {/* Total Count */}
                        <div>
                            <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-secondary-300'}`}>
                                Total Users
                            </label>
                            <div className={`mt-2 px-3 py-2 rounded-lg ${isLightMode
                                ? 'bg-slate-50 text-slate-900'
                                : 'bg-white/5 text-white'
                            } text-lg font-semibold`}>
                                {users.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className={`rounded-xl border overflow-hidden ${isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-dark-100 border-white/10'
                }`}>
                    {loading ? (
                        <div className={`p-8 text-center ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <p>Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className={`p-8 text-center ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                            No users found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`border-b ${isLightMode
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-white/5 border-white/10'
                                }`}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Name
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            USN
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Email
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Role
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Status
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Joined
                                        </th>
                                        <th className={`px-6 py-3 text-right text-xs font-semibold ${isLightMode
                                            ? 'text-slate-700'
                                            : 'text-secondary-300'
                                        }`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id} className={`border-b ${isLightMode
                                            ? 'border-slate-200 hover:bg-slate-50'
                                            : 'border-white/10 hover:bg-white/5'
                                        } transition`}>
                                            <td className={`px-6 py-4 text-sm font-medium ${isLightMode
                                                ? 'text-slate-900'
                                                : 'text-white'
                                            }`}>
                                                {user.name}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${isLightMode
                                                ? 'text-slate-600'
                                                : 'text-secondary-300'
                                            }`}>
                                                {user.usn || 'N/A'}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${isLightMode
                                                ? 'text-slate-600'
                                                : 'text-secondary-300'
                                            }`}>
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    user.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : user.role === 'premium'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : 'Free'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isBanned
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {user.isBanned ? 'Banned' : 'Active'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${isLightMode
                                                ? 'text-slate-600'
                                                : 'text-secondary-300'
                                            }`}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleTogglePremium(user._id)}
                                                        disabled={actioningUserId === user._id || user.role === 'admin'}
                                                        title={user.role === 'premium' ? 'Remove Premium' : 'Mark as Premium'}
                                                        className={`p-2 rounded-lg transition ${
                                                            actioningUserId === user._id || user.role === 'admin'
                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                : isLightMode
                                                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                        }`}
                                                    >
                                                        <FaStar className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleBanUser(user._id)}
                                                        disabled={actioningUserId === user._id}
                                                        title={user.isBanned ? 'Unban' : 'Ban'}
                                                        className={`p-2 rounded-lg transition ${
                                                            actioningUserId === user._id
                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                : isLightMode
                                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                        }`}
                                                    >
                                                        <FaBan className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetRole(user._id)}
                                                        disabled={actioningUserId === user._id}
                                                        title="Reset to default role"
                                                        className={`p-2 rounded-lg transition ${
                                                            actioningUserId === user._id
                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                : isLightMode
                                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                                        }`}
                                                    >
                                                        <FaUndo className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;
