import React, { useState, useEffect, useCallback } from 'react';
import { adminSubjectsAPI, branchesAPI, adminSchemesAPI } from '../../../services/api';

const STATUS_COLORS = {
    Published: 'bg-green-500/20 text-green-400 border-green-500/30',
    Hidden: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
};

const EMPTY_FORM = {
    name: '', code: '', credits: 4,
    year: '1st Year', scheme: '', status: 'Published', branch: ''
};
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const CREDITS_OPTIONS = [4, 3, 2, 1, 0];

export default function AdminSubjects() {
    const [theme] = useState(() => {
        try { return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark'; }
        catch { return 'dark'; }
    });
    const isLight = theme === 'light';
    const card = isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white';
    const input = isLight
        ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
        : 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500';
    const muted = isLight ? 'text-gray-500' : 'text-gray-400';
    const tableRow = isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-700/50';

    // Data state
    const [stats, setStats] = useState({ total: 0, byYear: {} });
    const [subjects, setSubjects] = useState([]);
    const [branches, setBranches] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filter state
    const [search, setSearch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterScheme, setFilterScheme] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterCredits, setFilterCredits] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [viewSubject, setViewSubject] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminSubjectsAPI.getStats();
            setStats(res.data);
        } catch (e) { console.error(e); }
    }, []);

    const fetchBranches = useCallback(async () => {
        try {
            const res = await branchesAPI.getPublic();
            setBranches(res.data || []);
        } catch (e) { console.error(e); }
    }, []);

    const fetchSchemes = useCallback(async () => {
        try {
            const res = await adminSchemesAPI.getAll();
            setSchemes(res.data.data || []);
        } catch (e) { console.error(e); }
    }, []);

    const fetchSubjects = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminSubjectsAPI.getAll({
                search: search || undefined,
                year: filterYear || undefined,
                scheme: filterScheme || undefined,
                branch: filterBranch || undefined,
                credits: filterCredits !== '' ? filterCredits : undefined,
                status: filterStatus || undefined,
                page, limit: 15
            });
            setSubjects(res.data.subjects);
            setPagination(res.data.pagination);
        } catch (e) {
            setError('Failed to load subjects. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, filterYear, filterScheme, filterBranch, filterCredits, filterStatus, page]);

    useEffect(() => {
        fetchStats();
        fetchBranches();
        fetchSchemes();
    }, [fetchStats, fetchBranches, fetchSchemes]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const openAdd = () => { 
        const commonBranch = branches.find(b => b.shortName === 'Common' || b.shortName === 'COMMON');
        const defaultScheme = schemes.find(s => s.name === '2025') || schemes[0];
        setForm({
            ...EMPTY_FORM,
            branch: commonBranch ? commonBranch._id : '',
            scheme: defaultScheme ? defaultScheme._id : ''
        }); 
        setEditingId(null); 
        setModalOpen(true); 
    };

    const openEdit = (s) => {
        setForm({
            name: s.name, 
            code: s.code, 
            credits: s.credits,
            year: s.year || '1st Year',
            scheme: s.scheme?._id || s.scheme || '',
            branch: s.branch?._id || s.branch || '',
            status: s.status || 'Published'
        });
        setEditingId(s._id);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                code: form.code,
                credits: Number(form.credits),
                year: form.year,
                scheme: form.scheme,
                branch: form.branch,
                status: form.status
            };
            if (editingId) {
                await adminSubjectsAPI.update(editingId, payload);
            } else {
                await adminSubjectsAPI.create(payload);
            }
            closeModal();
            fetchSubjects();
            fetchStats();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to save subject');
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicate = async (id) => {
        try {
            await adminSubjectsAPI.duplicate(id);
            fetchSubjects();
            fetchStats();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to duplicate subject');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminSubjectsAPI.delete(id);
            setDeleteConfirmId(null);
            fetchSubjects();
            fetchStats();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to hide subject');
        }
    };

    const statCards = [
        { label: 'Total Subjects', value: stats.total, color: 'from-blue-600 to-blue-700' },
        { label: '1st Year', value: stats.byYear?.year1 || 0, color: 'from-purple-600 to-purple-700' },
        { label: '2nd Year', value: stats.byYear?.year2 || 0, color: 'from-indigo-600 to-indigo-700' },
        { label: '3rd Year', value: stats.byYear?.year3 || 0, color: 'from-cyan-600 to-cyan-700' },
        { label: '4th Year', value: stats.byYear?.year4 || 0, color: 'from-teal-600 to-teal-700' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>📚 Subjects</h1>
                    <p className={`text-sm mt-1 ${muted}`}>Manage academic subjects stored as the Single Source of Truth.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-900/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subject
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map(c => (
                    <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-xl p-4 text-white shadow-lg`}>
                        <p className="text-3xl font-bold">{c.value}</p>
                        <p className="text-sm opacity-80 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className={`rounded-xl border p-4 ${card}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <input
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        placeholder="Search by name, code..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterYear}
                        onChange={e => { setFilterYear(e.target.value); setPage(1); }}
                    >
                        <option value="">All Years</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterScheme}
                        onChange={e => { setFilterScheme(e.target.value); setPage(1); }}
                    >
                        <option value="">All Schemes</option>
                        {schemes.map(s => <option key={s._id} value={s._id}>{s.name} Scheme</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterBranch}
                        onChange={e => { setFilterBranch(e.target.value); setPage(1); }}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.shortName}</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterCredits}
                        onChange={e => { setFilterCredits(e.target.value); setPage(1); }}
                    >
                        <option value="">All Credits</option>
                        {CREDITS_OPTIONS.map(c => <option key={c} value={c}>{c} Credits</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Hidden">Hidden</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${card}`}>
                {error && (
                    <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">{error}</div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`border-b ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-700'}`}>
                                {['Subject Name', 'Code', 'Branch', 'Year', 'Scheme', 'Credits', 'Status', 'Actions'].map(h => (
                                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-opacity-50">
                            {loading ? (
                                <tr><td colSpan={8} className={`text-center py-12 ${muted}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <span className="ml-2">Loading subjects...</span>
                                    </div>
                                </td></tr>
                            ) : subjects.length === 0 ? (
                                <tr><td colSpan={8} className={`text-center py-12 ${muted}`}>
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <p className="font-medium">No subjects found</p>
                                    <p className="text-xs mt-1">Try adjusting your filters or add a new subject.</p>
                                </td></tr>
                            ) : subjects.map(s => (
                                <tr key={s._id} className={`border-b transition ${tableRow}`}>
                                    <td className="px-4 py-3">
                                        <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{s.name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`font-mono text-xs px-2 py-1 rounded ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-400'}`}>{s.code}</span>
                                    </td>
                                    <td className={`px-4 py-3 ${muted}`}>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                            s.branch?.shortName === 'COMMON'
                                                ? (isLight ? 'bg-gray-100 text-gray-700' : 'bg-gray-700 text-gray-300')
                                                : (isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-900/30 text-indigo-400')
                                        }`}>
                                            {s.branch?.shortName || '—'}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 ${muted}`}>{s.year || '—'}</td>
                                    <td className={`px-4 py-3 ${muted}`}>{s.scheme?.name || s.scheme || '—'}</td>
                                    <td className={`px-4 py-3 ${muted}`}>{s.credits}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[s.status] || STATUS_COLORS.Hidden}`}>{s.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setViewSubject(s)} title="View"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-gray-700 text-gray-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            <button onClick={() => openEdit(s)} title="Edit"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => handleDuplicate(s._id)} title="Duplicate"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-purple-50 text-purple-600' : 'hover:bg-purple-900/30 text-purple-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(s._id)} title="Hide"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className={`px-4 py-3 border-t flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                        <span className={`text-xs ${muted}`}>
                            Showing {subjects.length} of {pagination.total} subjects
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className={`px-3 py-1 text-xs rounded border transition ${page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:border-blue-600 hover:text-white'} ${isLight ? 'border-gray-300' : 'border-gray-600'}`}>
                                Previous
                            </button>
                            <span className={`px-3 py-1 text-xs ${muted}`}>{page} / {pagination.pages}</span>
                            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                                className={`px-3 py-1 text-xs rounded border transition ${page === pagination.pages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:border-blue-600 hover:text-white'} ${isLight ? 'border-gray-300' : 'border-gray-600'}`}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} overflow-y-auto max-h-[90vh]`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {editingId ? 'Edit Subject' : 'Add New Subject'}
                            </h2>
                            <button onClick={closeModal} className={`p-1.5 rounded-lg transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Subject Name *</label>
                                    <input required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Operating Systems" />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Subject Code *</label>
                                    <input required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. BCS501" />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Credits (0 to 4) *</label>
                                    <input type="number" min={0} max={4} required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Year *</label>
                                    <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.year} onChange={e => {
                                            const y = e.target.value;
                                            const commonBranch = branches.find(b => b.shortName === 'COMMON');
                                            const iseBranch = branches.find(b => b.shortName === 'ISE');
                                            setForm(f => ({
                                                ...f,
                                                year: y,
                                                branch: y === '1st Year' ? (commonBranch?._id || '') : (f.branch === (commonBranch?._id || '') ? (iseBranch?._id || '') : f.branch)
                                            }));
                                        }}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Branch *</label>
                                    <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.shortName} - {b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Scheme *</label>
                                    <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.scheme} onChange={e => setForm(f => ({ ...f, scheme: e.target.value }))}>
                                        <option value="">Select Scheme</option>
                                        {schemes.map(s => <option key={s._id} value={s._id}>{s.name} Scheme</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${muted}`}>Status *</label>
                                    <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                        value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="Published">Published</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60">
                                    {saving ? 'Saving...' : editingId ? 'Update Subject' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewSubject(null)} />
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Subject Details</h2>
                            <button onClick={() => setViewSubject(null)} className={`p-1.5 rounded-lg transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                ['Name', viewSubject.name],
                                ['Code', viewSubject.code],
                                ['Branch', viewSubject.branch?.name || viewSubject.branch?.shortName || '—'],
                                ['Credits', viewSubject.credits],
                                ['Year', viewSubject.year],
                                ['Scheme', `${viewSubject.scheme?.name || viewSubject.scheme || '—'} Scheme`],
                                ['Status', viewSubject.status],
                                ['Slug', viewSubject.slug]
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between items-start gap-4">
                                    <span className={`text-sm font-medium flex-shrink-0 ${muted}`}>{label}</span>
                                    <span className={`text-sm text-right ${isLight ? 'text-gray-900' : 'text-white'}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
                    <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Hide Subject?</h3>
                                <p className={`text-sm ${muted}`}>This will change the subject status to Hidden.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirmId)}
                                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition">
                                Hide Subject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
