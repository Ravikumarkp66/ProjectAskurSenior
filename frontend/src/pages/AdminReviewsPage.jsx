import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from '../utils/hooks';

const AdminReviewsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('feedback');

    const [feedbackItems, setFeedbackItems] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');

    const [bugItems, setBugItems] = useState([]);
    const [bugLoading, setBugLoading] = useState(false);
    const [bugError, setBugError] = useState('');

    const [userItems, setUserItems] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState('');

    const [resolvingId, setResolvingId] = useState('');

    const isAdmin = !!user?.isAdmin;

    const loadFeedback = async () => {
        setFeedbackLoading(true);
        setFeedbackError('');
        try {
            const res = await apiClient.get('/feedback');
            setFeedbackItems(res?.data?.items || []);
        } catch (e) {
            setFeedbackError(e?.response?.data?.error || 'Failed to load feedback');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const loadBugs = async () => {
        setBugLoading(true);
        setBugError('');
        try {
            const res = await apiClient.get('/bugs');
            setBugItems(res?.data?.items || []);
        } catch (e) {
            setBugError(e?.response?.data?.error || 'Failed to load bug reports');
        } finally {
            setBugLoading(false);
        }
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        setUsersError('');
        try {
            const res = await apiClient.get('/auth/users');
            setUserItems(res?.data?.items || []);
        } catch (e) {
            setUsersError(e?.response?.data?.error || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        loadFeedback();
        loadBugs();
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const bugStats = useMemo(() => {
        const open = bugItems.filter((b) => b.status !== 'resolved').length;
        const resolved = bugItems.filter((b) => b.status === 'resolved').length;
        return { open, resolved, total: bugItems.length };
    }, [bugItems]);

    const resolveBug = async (id, nextStatus) => {
        if (!id || resolvingId) return;
        setResolvingId(id);
        try {
            await apiClient.patch(`/bugs/${id}/status`, { status: nextStatus });
            await loadBugs();
        } catch (e) {
            setBugError(e?.response?.data?.error || 'Failed to update bug status');
        } finally {
            setResolvingId('');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-xl font-extrabold text-slate-900">Admin Reviews</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        You are logged in, but this account does not have admin access.
                    </p>
                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                        Tip: make sure your user has <span className="font-semibold">isAdmin: true</span> in MongoDB and then log out + log in again.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Admin Reviews</h1>
                        <p className="mt-1 text-sm text-slate-600">Feedback and bug reports submitted by users</p>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                loadFeedback();
                                loadBugs();
                                loadUsers();
                            }}
                            className="h-10 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-500 transition"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('feedback')}
                            className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'feedback'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Feedback
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('bugs')}
                            className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'bugs'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Bugs
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'users'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Users ({userItems.length})
                        </button>

                        <div className="sm:ml-auto text-xs text-slate-600 px-3">
                            Bugs: <span className="font-semibold">{bugStats.open}</span> open,{' '}
                            <span className="font-semibold">{bugStats.resolved}</span> resolved
                        </div>
                    </div>

                    {activeTab === 'feedback' && (
                        <div className="p-4">
                            {feedbackLoading ? (
                                <div className="text-sm text-slate-600">Loading feedback...</div>
                            ) : feedbackError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {feedbackError}
                                </div>
                            ) : feedbackItems.length === 0 ? (
                                <div className="text-sm text-slate-600">No feedback submitted yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {feedbackItems.map((f) => (
                                        <div
                                            key={f._id}
                                            className="rounded-2xl border border-slate-200 bg-white p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-900">
                                                        {f?.userId?.email || f?.userId?.usn || 'User'}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {new Date(f.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-extrabold text-amber-600">
                                                    {f.rating}/5
                                                </div>
                                            </div>
                                            {f.message ? (
                                                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                                                    {f.message}
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-sm text-slate-500">No message</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bugs' && (
                        <div className="p-4">
                            {bugLoading ? (
                                <div className="text-sm text-slate-600">Loading bug reports...</div>
                            ) : bugError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {bugError}
                                </div>
                            ) : bugItems.length === 0 ? (
                                <div className="text-sm text-slate-600">No bug reports submitted yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {bugItems.map((b) => {
                                        const isResolved = b.status === 'resolved';
                                        return (
                                            <div
                                                key={b._id}
                                                className="rounded-2xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-extrabold text-slate-900">
                                                            {b.title}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            {b?.userId?.email || b?.userId?.usn || 'User'} •{' '}
                                                            {new Date(b.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs font-bold px-2 py-1 rounded-full border ${
                                                        isResolved
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {isResolved ? 'Resolved' : 'Open'}
                                                    </div>
                                                </div>

                                                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                                                    {b.description}
                                                </div>

                                                <div className="mt-3 text-xs text-slate-600 break-all">
                                                    <span className="font-semibold">URL:</span> {b.pageUrl}
                                                </div>

                                                <div className="mt-4 flex items-center justify-end gap-2">
                                                    {isResolved ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => resolveBug(b._id, 'open')}
                                                            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                                                            disabled={resolvingId === b._id}
                                                        >
                                                            {resolvingId === b._id ? 'Updating...' : 'Reopen'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => resolveBug(b._id, 'resolved')}
                                                            className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 transition"
                                                            disabled={resolvingId === b._id}
                                                        >
                                                            {resolvingId === b._id ? 'Updating...' : 'Mark Resolved'}
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

                    {activeTab === 'users' && (
                        <div className="p-4">
                            {usersLoading ? (
                                <div className="text-sm text-slate-600">Loading users...</div>
                            ) : usersError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {usersError}
                                </div>
                            ) : userItems.length === 0 ? (
                                <div className="text-sm text-slate-600">No users found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-left">
                                                <th className="pb-3 font-semibold text-slate-700">USN</th>
                                                <th className="pb-3 font-semibold text-slate-700">Email</th>
                                                <th className="pb-3 font-semibold text-slate-700">Branch</th>
                                                <th className="pb-3 font-semibold text-slate-700">Role</th>
                                                <th className="pb-3 font-semibold text-slate-700">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {userItems.map((u) => (
                                                <tr key={u._id} className="hover:bg-slate-50">
                                                    <td className="py-3 font-mono font-semibold text-slate-900">
                                                        {u.usn}
                                                    </td>
                                                    <td className="py-3 text-slate-700">{u.email}</td>
                                                    <td className="py-3 text-slate-700">{u.branch}</td>
                                                    <td className="py-3">
                                                        {u.isAdmin ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                                User
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-slate-500 text-xs">
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReviewsPage;
