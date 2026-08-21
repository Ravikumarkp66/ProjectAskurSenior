import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminMaterialsAPI, adminSubjectsAPI, branchesAPI, adminSchemesAPI } from '../../../services/api';

const STATUS_COLORS = {
    Published: 'bg-green-500/20 text-green-400 border-green-500/30',
    Hidden: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const MIGRATION_COLORS = {
    'Auto Matched': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Needs Review': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Manually Assigned': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

const EXT_COLORS = {
    pdf: 'bg-red-500/20 text-red-400 border-red-500/30',
    ppt: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pptx: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    doc: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    docx: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    zip: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    xlsx: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    xls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const EMPTY_FORM = {
    title: '',
    subject: '',
    materialType: 'Others',
    status: 'Published'
};

export default function AdminMaterials() {
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
    const [stats, setStats] = useState({ total: 0, published: 0, hidden: 0, draft: 0, needsReview: 0, types: {} });
    const [materials, setMaterials] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [branches, setBranches] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filter state (Ordered by: Search, Branch, Year, Scheme, Subject, Material Type, Status, Migration Status)
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterScheme, setFilterScheme] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMigration, setFilterMigration] = useState('');
    const [filterDuplicateStatus, setFilterDuplicateStatus] = useState('');
    const [sortBy, setSortBy] = useState('');
    
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [files, setFiles] = useState([]);
    const [viewMaterial, setViewMaterial] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [loadingAction, setLoadingAction] = useState(null);
    const [duplicateWarnings, setDuplicateWarnings] = useState(null);
    const fileInputRef = useRef();

    const [possibleDuplicates, setPossibleDuplicates] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchStats = useCallback(async () => {
        try {
            const [statsRes, healthRes] = await Promise.all([
                adminMaterialsAPI.getStats(),
                adminMaterialsAPI.getHealthStats()
            ]);
            setStats(statsRes.data);
            setPossibleDuplicates(healthRes.data.possibleDuplicates);
        } catch (e) { console.error(e); }
    }, []);

    const handleOpenFile = async (m) => {
        if (loadingAction) return;
        setLoadingAction({ id: m._id, type: 'open' });
        try {
            const res = await adminMaterialsAPI.getFileUrl(m._id, false);
            window.open(res.data.url, '_blank');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Unable to open file.';
            alert(errorMsg);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDownloadFile = async (m) => {
        if (loadingAction) return;
        setLoadingAction({ id: m._id, type: 'download' });
        try {
            const res = await adminMaterialsAPI.getFileUrl(m._id, true);
            
            // Native S3 Content-Disposition download: simply open/redirect to trigger download with correct filename
            window.open(res.data.url, '_blank');

            // Increment local state count instantly
            setMaterials(prev => prev.map(item => {
                if (item._id === m._id) {
                    return { ...item, downloadCount: (item.downloadCount || 0) + 1 };
                }
                return item;
            }));
            if (viewMaterial && viewMaterial._id === m._id) {
                setViewMaterial(prev => ({ ...prev, downloadCount: (prev.downloadCount || 0) + 1 }));
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Unable to open file.';
            alert(errorMsg);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCopyUrl = async (m) => {
        if (loadingAction) return;
        setLoadingAction({ id: m._id, type: 'copy' });
        try {
            const res = await adminMaterialsAPI.getFileUrl(m._id, false);
            await navigator.clipboard.writeText(res.data.url);
            alert('Link copied successfully');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Unable to open file.';
            alert(errorMsg);
        } finally {
            setLoadingAction(null);
        }
    };

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminMaterialsAPI.getAll({
                search: search || undefined,
                branchId: filterBranch || undefined,
                year: filterYear || undefined,
                schemeId: filterScheme || undefined,
                subjectId: filterSubject || undefined,
                materialType: filterType || undefined,
                status: filterStatus || undefined,
                migrationStatus: filterMigration || undefined,
                duplicateStatus: filterDuplicateStatus || undefined,
                sortBy: sortBy || undefined,
                page,
                limit: 15
            });
            setMaterials(res.data.materials);
            setPagination(res.data.pagination);
            setSelectedIds([]);
        } catch (e) {
            setError('Failed to load materials. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, filterBranch, filterYear, filterScheme, filterSubject, filterType, filterStatus, filterMigration, filterDuplicateStatus, sortBy, page]);

    const fetchLookups = useCallback(async () => {
        try {
            const [subRes, branchRes, schemeRes] = await Promise.all([
                adminSubjectsAPI.getAll({ limit: 1000 }),
                branchesAPI.getAdmin(),
                adminSchemesAPI.getAll()
            ]);
            setSubjects(subRes.data.subjects || []);
            setBranches(branchRes.data || []);
            setSchemes(schemeRes.data?.data || []);
        } catch (e) { console.error('Lookups failed', e); }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchLookups();
    }, [fetchStats, fetchLookups]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    // Dynamically filter subjects dropdown based on chosen Branch, Year, and Scheme
    const filteredSubjectsList = subjects.filter(s => {
        if (filterBranch && s.branch?._id !== filterBranch) return false;
        if (filterYear && s.year !== filterYear) return false;
        if (filterScheme && s.scheme?._id !== filterScheme) return false;
        return true;
    });

    const openAdd = () => { setForm(EMPTY_FORM); setFiles([]); setEditingId(null); setModalOpen(true); };
    const openEdit = (m) => {
        setForm({
            title: m.title,
            subject: m.subject?._id || '',
            materialType: m.materialType || 'Others',
            status: m.status || 'Published',
            // fields below are read-only helper context for edit modal
            fileSize: m.fileSize,
            mimeType: m.mimeType,
            storedFileName: m.storedFileName,
            createdAt: m.createdAt,
            uploaderEmail: m.uploaderEmail
        });
        setFiles([]);
        setEditingId(m._id);
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); setFiles([]); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                // Update Material (PUT)
                await adminMaterialsAPI.update(editingId, {
                    title: form.title,
                    subject: form.subject,
                    materialType: form.materialType,
                    status: form.status
                });
            } else {
                // Upload Material / Bulk Upload (POST)
                if (files.length === 0) {
                    alert('Please select at least one file to upload');
                    setSaving(false);
                    return;
                }
                const formData = new FormData();
                formData.append('subject', form.subject);
                formData.append('materialType', form.materialType);
                formData.append('status', form.status);
                files.forEach(f => formData.append('files', f));

                const res = await adminMaterialsAPI.create(formData);
                if (res.data?.duplicate) {
                    // Show confirmation/warning modal
                    setDuplicateWarnings({
                        duplicates: res.data.duplicates,
                        formData: formData
                    });
                    setSaving(false);
                    return; // keep upload modal open
                }
            }
            closeModal();
            fetchMaterials();
            fetchStats();
            fetchLookups();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to save material');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadAnyway = async () => {
        if (!duplicateWarnings) return;
        setSaving(true);
        try {
            await adminMaterialsAPI.create(duplicateWarnings.formData, true);
            setDuplicateWarnings(null);
            closeModal();
            fetchMaterials();
            fetchStats();
            fetchLookups();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to override upload');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, permanent = false) => {
        try {
            await adminMaterialsAPI.delete(id, permanent);
            setDeleteConfirmId(null);
            fetchMaterials();
            fetchStats();
            fetchLookups();
            if (viewMaterial && viewMaterial._id === id) {
                setViewMaterial(null);
            }
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to delete material');
        }
    };

    const handleBulkDelete = async (permanent = false) => {
        const actionText = permanent ? 'permanently delete' : 'hide (move to Trash)';
        if (!confirm(`Are you sure you want to ${actionText} all ${selectedIds.length} selected materials?`)) return;
        try {
            await adminMaterialsAPI.bulkDelete(selectedIds, permanent);
            setSelectedIds([]);
            fetchMaterials();
            fetchStats();
            fetchLookups();
        } catch (e) {
            alert(e?.response?.data?.error || 'Failed to execute bulk deletion');
        }
    };

    const handleCopyLink = (url) => {
        navigator.clipboard.writeText(url);
        alert('CloudFront URL copied to clipboard!');
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const statCards = [
        { label: 'Total Materials', value: stats.total, color: 'from-blue-600 to-blue-700' },
        { label: 'Published', value: stats.published, color: 'from-green-600 to-green-700' },
        { label: 'Hidden', value: stats.hidden, color: 'from-orange-600 to-orange-700' },
        { label: 'Needs Review', value: stats.needsReview, color: 'from-red-600 to-red-700' },
        { label: 'Possible Duplicates', value: possibleDuplicates, color: 'from-amber-600 to-amber-700', clickable: true }
    ];

    const typeStats = [
        { label: 'Notes', count: stats.types?.Notes || 0 },
        { label: 'SEE', count: stats.types?.SEE || 0 },
        { label: 'Internals', count: stats.types?.Internals || 0 },
        { label: 'Others', count: stats.types?.Others || 0 }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>📁 Study Materials</h1>
                    <p className={`text-sm mt-1 ${muted}`}>Upload and organize documents linked to academic subjects.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-900/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Material
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {statCards.map(c => {
                    const content = (
                        <>
                            <p className="text-3xl font-bold">{c.value}</p>
                            <p className="text-sm opacity-80 mt-1">{c.label}</p>
                        </>
                    );
                    if (c.clickable) {
                        return (
                            <button
                                key={c.label}
                                onClick={() => setFilterDuplicateStatus(prev => prev === 'Possible Duplicate' ? '' : 'Possible Duplicate')}
                                className={`text-left bg-gradient-to-br ${c.color} rounded-xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] ${filterDuplicateStatus === 'Possible Duplicate' ? 'ring-4 ring-amber-300' : ''}`}
                            >
                                {content}
                            </button>
                        );
                    }
                    return (
                        <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-xl p-4 text-white shadow-lg`}>
                            {content}
                        </div>
                    );
                })}
            </div>

            {/* Type Count Overview */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border ${card}`}>
                {typeStats.map(t => (
                    <div key={t.label} className="text-center py-2">
                        <span className={`text-xs uppercase tracking-wider ${muted}`}>{t.label}</span>
                        <p className="text-lg font-bold mt-0.5">{t.count}</p>
                    </div>
                ))}
            </div>

            {/* Filters (Ordered: Search, Branch, Year, Scheme, Subject, Material Type, Status, Migration Status) */}
            <div className={`rounded-xl border p-4 ${card}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        placeholder="Search by title, code, file..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterBranch}
                        onChange={e => { setFilterBranch(e.target.value); setFilterSubject(''); setPage(1); }}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.shortName} – {b.name}</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterYear}
                        onChange={e => { setFilterYear(e.target.value); setFilterSubject(''); setPage(1); }}
                    >
                        <option value="">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterScheme}
                        onChange={e => { setFilterScheme(e.target.value); setFilterSubject(''); setPage(1); }}
                    >
                        <option value="">All Schemes</option>
                        {schemes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterSubject}
                        onChange={e => { setFilterSubject(e.target.value); setPage(1); }}
                    >
                        <option value="">All Subjects</option>
                        {filteredSubjectsList.map(s => <option key={s._id} value={s._id}>{s.code} – {s.name}</option>)}
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterType}
                        onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    >
                        <option value="">All Material Types</option>
                        <option value="Notes">Notes</option>
                        <option value="SEE">SEE</option>
                        <option value="Internals">Internals</option>
                        <option value="Others">Others</option>
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Hidden">Hidden</option>
                        <option value="Draft">Draft</option>
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterMigration}
                        onChange={e => { setFilterMigration(e.target.value); setPage(1); }}
                    >
                        <option value="">All Migration Statuses</option>
                        <option value="Auto Matched">Auto Matched</option>
                        <option value="Needs Review">Needs Review</option>
                        <option value="Manually Assigned">Manually Assigned</option>
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={filterDuplicateStatus}
                        onChange={e => { setFilterDuplicateStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">All Duplicate Statuses</option>
                        <option value="Normal">Normal</option>
                        <option value="Possible Duplicate">Possible Duplicate</option>
                    </select>
                    <select
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${input}`}
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value); setPage(1); }}
                    >
                        <option value="">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="fileSizeAsc">Sort: Size (Low to High)</option>
                        <option value="fileSizeDesc">Sort: Size (High to Low)</option>
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
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={materials.length > 0 && selectedIds.length === materials.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(materials.map(m => m._id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                {['Material Name', 'Subject', 'Branch', 'Type', 'File', 'File Size', 'Uploader Email', 'Downloads', 'Previews', 'Status', 'Migration', 'Actions'].map(h => (
                                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={13} className={`text-center py-12 ${muted}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <span className="ml-2">Loading materials...</span>
                                    </div>
                                </td></tr>
                            ) : materials.length === 0 ? (
                                <tr><td colSpan={13} className={`text-center py-12 ${muted}`}>
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <p className="font-medium">No materials found</p>
                                    <p className="text-xs mt-1">Upload a material to get started.</p>
                                </td></tr>
                            ) : materials.map(m => (
                                <tr key={m._id} className={`border-b transition ${tableRow}`}>
                                    <td className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(m._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(prev => [...prev, m._id]);
                                                } else {
                                                    setSelectedIds(prev => prev.filter(id => id !== m._id));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{m.title}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {m.subject ? (
                                            <div>
                                                <div className={`text-xs font-mono px-1.5 py-0.5 rounded inline-block ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-400'}`}>{m.subject.code}</div>
                                                <div className={`text-xs mt-0.5 ${muted} max-w-[130px] truncate`}>{m.subject.name}</div>
                                            </div>
                                        ) : <span className="text-red-400 italic">Needs Mapped</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-xs ${muted}`}>
                                        {m.subject?.branch?.shortName || 'Common'}
                                    </td>
                                    <td className={`px-4 py-3 text-xs ${muted}`}>{m.materialType || 'Others'}</td>
                                    <td className="px-4 py-3">
                                        {m.fileType ? (
                                            <button
                                                onClick={() => handleOpenFile(m)}
                                                disabled={!!loadingAction}
                                                title={m.originalFileName}
                                                className={`text-xs font-medium px-2 py-0.5 rounded border transition ${EXT_COLORS[m.fileType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'} disabled:opacity-50`}
                                            >
                                                {loadingAction?.id === m._id && loadingAction?.type === 'open' ? '...' : m.fileType.toUpperCase()}
                                            </button>
                                        ) : <span className={muted}>—</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-xs font-mono ${muted}`}>
                                        {formatBytes(m.fileSize)}
                                    </td>
                                    <td className={`px-4 py-3 text-xs font-mono truncate max-w-[130px] ${muted}`} title={m.uploaderEmail}>
                                        {m.uploaderEmail || '—'}
                                    </td>
                                    <td className={`px-4 py-3 text-xs text-center ${muted}`}>{m.downloadCount || 0}</td>
                                    <td className={`px-4 py-3 text-xs text-center ${muted}`}>{m.previewCount || 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[m.status] || STATUS_COLORS.Hidden}`}>{m.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {m.migrationStatus ? (
                                            <span className={`text-xs font-medium px-2 py-1 rounded border ${MIGRATION_COLORS[m.migrationStatus] || 'border-gray-700 text-gray-400'}`}>
                                                {m.migrationStatus}
                                            </span>
                                        ) : <span className={`text-xs font-medium px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-400`}>Fresh Upload</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setViewMaterial(m)} title="View Details"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-gray-700 text-gray-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            <button onClick={() => openEdit(m)} title="Edit"
                                                className={`p-1.5 rounded transition ${isLight ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(m._id)} title="Delete / Hide"
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
                        <span className={`text-xs ${muted}`}>Showing {materials.length} of {pagination.total} materials</span>
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
                    <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-y-auto max-h-[90vh] ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {editingId ? 'Edit Material' : 'Upload Academic Materials'}
                            </h2>
                            <button onClick={closeModal} className={`p-1.5 rounded-lg transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {editingId ? (
                                // Edit Form (Title, Subject, MaterialType, Status, Read-Only info)
                                <>
                                    <div>
                                        <label className={`block text-xs font-medium mb-1 ${muted}`}>Title *</label>
                                        <input required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-medium mb-1 ${muted}`}>Subject *</label>
                                            <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                                value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                                                <option value="">Select Subject</option>
                                                {subjects.map(s => <option key={s._id} value={s._id}>{s.code} – {s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-medium mb-1 ${muted}`}>Material Type *</label>
                                            <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                                value={form.materialType} onChange={e => setForm(f => ({ ...f, materialType: e.target.value }))}>
                                                <option value="Notes">Notes</option>
                                                <option value="SEE">SEE</option>
                                                <option value="Internals">Internals</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-medium mb-1 ${muted}`}>Status *</label>
                                            <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                                <option value="Published">Published</option>
                                                <option value="Hidden">Hidden</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={`text-xs p-3 rounded-lg border space-y-1.5 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-700'}`}>
                                        <p className="font-semibold uppercase tracking-wider mb-1 opacity-70">File Context</p>
                                        <div><span className={muted}>Stored File Name:</span> <span className="font-mono">{form.storedFileName}</span></div>
                                        <div><span className={muted}>File Size:</span> {formatBytes(form.fileSize)}</div>
                                        <div><span className={muted}>Mime Type:</span> <span className="font-mono">{form.mimeType}</span></div>
                                        <div><span className={muted}>Uploader Email:</span> {form.uploaderEmail || '—'}</div>
                                        <div><span className={muted}>Created Date:</span> {new Date(form.createdAt).toLocaleString()}</div>
                                    </div>
                                </>
                            ) : (
                                // Upload Form (Minimalist: Subject, Material Type, Files)
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-medium mb-1 ${muted}`}>Subject *</label>
                                            <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                                value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                                                <option value="">Select Subject</option>
                                                {subjects.map(s => <option key={s._id} value={s._id}>{s.code} – {s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-medium mb-1 ${muted}`}>Material Type *</label>
                                            <select required className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                                                value={form.materialType} onChange={e => setForm(f => ({ ...f, materialType: e.target.value }))}>
                                                <option value="Notes">Notes</option>
                                                <option value="SEE">SEE</option>
                                                <option value="Internals">Internals</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-medium mb-2 ${muted}`}>Attachments *</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isLight
                                                ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                : 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/10'}`}
                                        >
                                            <svg className={`w-8 h-8 mx-auto mb-2 ${muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Click to browse files</p>
                                            <p className={`text-xs mt-1 ${muted}`}>Upload up to 100 PDFs, PPTs, DOCX, ZIPs at once</p>
                                        </div>
                                        <input ref={fileInputRef} type="file" multiple className="hidden"
                                            accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.xlsx,.xls"
                                            onChange={e => setFiles(Array.from(e.target.files))} />
                                        {files.length > 0 && (
                                            <div className="mt-3 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                                {files.map((f, i) => (
                                                    <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-700'}`}>
                                                        <div className="flex items-center gap-2 truncate">
                                                            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                            <span className={`truncate ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{f.name}</span>
                                                        </div>
                                                        <span className={`text-[10px] flex-shrink-0 font-mono ml-2 ${muted}`}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60">
                                    {saving ? 'Processing...' : editingId ? 'Update Material' : 'Start Bulk Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewMaterial(null)} />
                    <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-y-auto max-h-[90vh] ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Material Details</h2>
                            <button onClick={() => setViewMaterial(null)} className={`p-1.5 rounded-lg transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                {[
                                    ['Material Name', viewMaterial.title],
                                    ['Subject Name', viewMaterial.subject?.name || '—'],
                                    ['Subject Code', viewMaterial.subject?.code || '—'],
                                    ['Branch', viewMaterial.subject?.branch?.name ? `${viewMaterial.subject.branch.shortName} – ${viewMaterial.subject.branch.name}` : 'Common'],
                                    ['Scheme', viewMaterial.subject?.scheme?.name || '—'],
                                    ['Year', viewMaterial.subject?.year || '—'],
                                    ['Credits', viewMaterial.subject?.credits || '—'],
                                    ['Material Type', viewMaterial.materialType || '—'],
                                    ['Original File Name', viewMaterial.originalFileName || '—'],
                                    ['Stored File Name', viewMaterial.storedFileName || '—'],
                                    ['File Type', viewMaterial.fileType ? viewMaterial.fileType.toUpperCase() : '—'],
                                    ['Mime Type', viewMaterial.mimeType || '—'],
                                    ['File Size', formatBytes(viewMaterial.fileSize)],
                                    ['Uploader', viewMaterial.uploadedBy?.name || 'System / Migrated'],
                                    ['Uploader Email', viewMaterial.uploaderEmail || '—'],
                                    ['Downloads', viewMaterial.downloadCount || 0],
                                    ['Preview Count', viewMaterial.previewCount || 0],
                                    ['Created At', new Date(viewMaterial.createdAt).toLocaleString()],
                                    ['Updated At', new Date(viewMaterial.updatedAt).toLocaleString()]
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between items-start gap-4 py-1 border-b border-gray-700/10 dark:border-gray-600/10 text-xs">
                                        <span className={`font-semibold flex-shrink-0 ${muted}`}>{label}</span>
                                        <span className={`text-right font-medium max-w-[280px] break-all ${isLight ? 'text-gray-900' : 'text-white'}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* CloudFront link actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => handleOpenFile(viewMaterial)}
                                    disabled={!!loadingAction}
                                    className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                                >
                                    {loadingAction?.id === viewMaterial._id && loadingAction?.type === 'open' ? 'Opening...' : 'Open file'}
                                </button>
                                <button
                                    onClick={() => handleDownloadFile(viewMaterial)}
                                    disabled={!!loadingAction}
                                    className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
                                >
                                    {loadingAction?.id === viewMaterial._id && loadingAction?.type === 'download' ? 'Downloading...' : 'Download'}
                                </button>
                                <button
                                    onClick={() => handleCopyUrl(viewMaterial)}
                                    disabled={!!loadingAction}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'} disabled:opacity-50`}
                                >
                                    {loadingAction?.id === viewMaterial._id && loadingAction?.type === 'copy' ? 'Copying...' : 'Copy URL'}
                                </button>
                            </div>
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
                                <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Delete Material?</h3>
                                <p className={`text-sm ${muted}`}>Choose whether to hide this material from students, or permanently remove it from the system.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <div className="flex gap-2">
                                <button onClick={() => handleDelete(deleteConfirmId, false)}
                                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition">
                                    Hide Material
                                </button>
                                <button onClick={() => handleDelete(deleteConfirmId, true)}
                                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition">
                                    Delete Permanently
                                </button>
                            </div>
                            <button onClick={() => setDeleteConfirmId(null)}
                                className={`w-full py-2 rounded-lg text-xs font-medium border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Warning Modal */}
            {duplicateWarnings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDuplicateWarnings(null)} />
                    <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 overflow-y-auto max-h-[85vh] ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>Possible Duplicate File(s) Detected</h3>
                                <p className={`text-sm ${muted}`}>One or more of the selected files match existing documents. Please review below.</p>
                            </div>
                        </div>

                        <div className="space-y-4 my-4 max-h-[45vh] overflow-y-auto pr-1">
                            {duplicateWarnings.duplicates.map((dup, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border text-xs space-y-2 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-700'}`}>
                                    <div>
                                        <span className="font-semibold text-amber-500">Incoming File:</span>
                                        <p className="font-medium mt-0.5">{dup.originalname}</p>
                                    </div>
                                    <div className="border-t pt-2 border-gray-600/30">
                                        <span className="font-semibold text-emerald-500">Matches Existing Material:</span>
                                        <p className="font-medium mt-0.5">{dup.existing.title}</p>
                                        <p className={`mt-0.5 ${muted}`}>Uploaded on: {new Date(dup.existing.uploadedAt).toLocaleDateString()} by {dup.existing.uploaderEmail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setDuplicateWarnings(null)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                Cancel Upload
                            </button>
                            <button onClick={handleUploadAnyway}
                                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition">
                                Upload Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900/95 text-white border border-gray-700/60 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-2xl animate-bounce">
                    <span className="text-xs font-semibold text-amber-400">
                        {selectedIds.length} materials selected
                    </span>
                    <div className="h-4 w-px bg-gray-700" />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkDelete(false)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                            Hide Selected
                        </button>
                        <button
                            onClick={() => handleBulkDelete(true)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition"
                        >
                            Deselect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
