import React, { useState, useEffect } from 'react';
import { adminMaterialsAPI, subjectAPI } from '../../../services/api';

export default function MaterialHealth() {
    const [theme] = useState(() => localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark');
    const isLight = theme === 'light';

    // Tailwind-like shorthand styling classes
    const card = isLight ? 'bg-white border-gray-200 text-gray-900 shadow-sm' : 'bg-gray-800 border-gray-700 text-white shadow-md shadow-black/10';
    const input = isLight ? 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500' : 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400';
    const muted = isLight ? 'text-gray-500' : 'text-gray-400';
    const tableRow = isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-700/50';

    // Main States
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('duplicates'); // 'duplicates' | 'orphans' | 'hidden' | 'trash'
    const [duplicates, setDuplicates] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [hiddenFiles, setHiddenFiles] = useState([]);
    const [trashFiles, setTrashFiles] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [actionLoading, setActionLoading] = useState({});

    // Fetch Health Stats
    const fetchHealthStats = async () => {
        try {
            const res = await adminMaterialsAPI.getHealthStats();
            setStats(res.data);
        } catch (e) {
            console.error('Failed to fetch health stats:', e);
        }
    };

    // Fetch Active Section Data
    const loadSectionData = async () => {
        setLoading(true);
        try {
            if (activeSection === 'duplicates') {
                const res = await adminMaterialsAPI.getDuplicatesList();
                setDuplicates(res.data);
            } else if (activeSection === 'orphans') {
                const res = await adminMaterialsAPI.getAll({ subjectId: 'null', limit: 100 });
                setOrphans(res.data.materials);
                // Also load subjects for mapping dropdown
                const subRes = await subjectAPI.getAll();
                setSubjects(subRes.data);
            } else if (activeSection === 'hidden') {
                const res = await adminMaterialsAPI.getAll({ status: 'Hidden', trash: 'false', limit: 100 });
                setHiddenFiles(res.data.materials);
            } else if (activeSection === 'trash') {
                const res = await adminMaterialsAPI.getAll({ trash: 'true', limit: 100 });
                setTrashFiles(res.data.materials);
            }
        } catch (e) {
            console.error('Failed to load section data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealthStats();
    }, []);

    useEffect(() => {
        loadSectionData();
    }, [activeSection]);

    // Format Storage Size
    const formatBytes = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Actions implementation
    const handleDownload = async (id) => {
        try {
            const res = await adminMaterialsAPI.getFileUrl(id, true);
            window.open(res.data.url, '_blank');
        } catch (e) {
            alert('Failed to get download URL');
        }
    };

    const handleOpen = async (id) => {
        try {
            const res = await adminMaterialsAPI.getFileUrl(id, false);
            window.open(res.data.url, '_blank');
        } catch (e) {
            alert('Failed to open file');
        }
    };

    const handleIgnoreDuplicate = async (id) => {
        if (!confirm('Are you sure you want to mark this file as safe? It will no longer show up as a duplicate.')) return;
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await adminMaterialsAPI.ignoreDuplicate(id);
            await fetchHealthStats();
            await loadSectionData();
        } catch (e) {
            alert('Failed to ignore duplicate');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleMoveToTrash = async (id) => {
        if (!confirm('Are you sure you want to move this file to Trash? It will be deleted permanently in 30 days.')) return;
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await adminMaterialsAPI.delete(id, false); // soft-delete
            await fetchHealthStats();
            await loadSectionData();
        } catch (e) {
            alert('Failed to delete file');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!confirm('WARNING: Are you sure you want to permanently delete this material? This will delete the file from AWS S3 and cannot be undone.')) return;
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await adminMaterialsAPI.delete(id, true); // permanent delete
            await fetchHealthStats();
            await loadSectionData();
        } catch (e) {
            alert('Failed to permanently delete');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleRestore = async (id) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await adminMaterialsAPI.restore(id);
            await fetchHealthStats();
            await loadSectionData();
        } catch (e) {
            alert('Failed to restore file');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleMapSubject = async (materialId, subjectId) => {
        if (!subjectId) return;
        setActionLoading(prev => ({ ...prev, [materialId]: true }));
        try {
            await adminMaterialsAPI.update(materialId, { subject: subjectId });
            await fetchHealthStats();
            await loadSectionData();
        } catch (e) {
            alert('Failed to map subject');
        } finally {
            setActionLoading(prev => ({ ...prev, [materialId]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>🛡 Material Health & Maintenance</h1>
                <p className={`text-sm mt-1 ${muted}`}>Run structural checks, deduplicate documents, resolve orphaned topics, and manage deleted resources.</p>
            </div>

            {/* Health Stat Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button onClick={() => setActiveSection('duplicates')}
                        className={`text-left p-4 rounded-xl border transition-all ${card} hover:scale-[1.02] ${activeSection === 'duplicates' ? 'ring-2 ring-amber-500 border-transparent' : ''}`}>
                        <div className="text-2xl mb-1">🚨</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold ${muted}`}>Duplicates</div>
                        <div className="text-xl font-bold mt-1">{stats.possibleDuplicates} files</div>
                    </button>

                    <button onClick={() => setActiveSection('orphans')}
                        className={`text-left p-4 rounded-xl border transition-all ${card} hover:scale-[1.02] ${activeSection === 'orphans' ? 'ring-2 ring-amber-500 border-transparent' : ''}`}>
                        <div className="text-2xl mb-1">🔗</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold ${muted}`}>Orphans</div>
                        <div className="text-xl font-bold mt-1">{stats.orphanMaterials} files</div>
                    </button>

                    <button onClick={() => setActiveSection('hidden')}
                        className={`text-left p-4 rounded-xl border transition-all ${card} hover:scale-[1.02] ${activeSection === 'hidden' ? 'ring-2 ring-amber-500 border-transparent' : ''}`}>
                        <div className="text-2xl mb-1">👁</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold ${muted}`}>Hidden Files</div>
                        <div className="text-xl font-bold mt-1">{stats.hiddenFiles} files</div>
                    </button>

                    <button onClick={() => setActiveSection('trash')}
                        className={`text-left p-4 rounded-xl border transition-all ${card} hover:scale-[1.02] ${activeSection === 'trash' ? 'ring-2 ring-amber-500 border-transparent' : ''}`}>
                        <div className="text-2xl mb-1">🗑</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold ${muted}`}>Trash Can</div>
                        <div className="text-xl font-bold mt-1">{stats.trashCount} files</div>
                    </button>

                    <div className={`p-4 rounded-xl border ${card}`}>
                        <div className="text-2xl mb-1">💾</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold ${muted}`}>Total Storage</div>
                        <div className="text-xl font-bold mt-1">{formatBytes(stats.totalStorage)}</div>
                    </div>
                </div>
            )}

            {/* Content Lists */}
            <div className={`rounded-xl border ${card} p-6`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">
                        {activeSection === 'duplicates' && 'Duplicate Review Panel'}
                        {activeSection === 'orphans' && 'Orphan Materials Mapper'}
                        {activeSection === 'hidden' && 'Hidden Materials Registry'}
                        {activeSection === 'trash' && 'Soft-Deleted Trash Bin'}
                    </h2>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                    </div>
                ) : (
                    <>
                        {/* 1. DUPLICATE SECTION */}
                        {activeSection === 'duplicates' && (
                            duplicates.length === 0 ? (
                                <p className={`text-center py-8 ${muted}`}>No dynamic duplicates found. Clean database health!</p>
                            ) : (
                                <div className="space-y-8">
                                    {duplicates.map((group, gIdx) => (
                                        <div key={group.groupId} className={`p-4 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/40 border-gray-700'}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${group.matchType.includes('Hash') ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        {group.matchType}
                                                    </span>
                                                    <span className={`text-xs ${muted}`}>Group ID: {group.groupId}</span>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${muted}`}>
                                                            <th className="py-2 px-3">Title</th>
                                                            <th className="py-2 px-3">Subject</th>
                                                            <th className="py-2 px-3">Type</th>
                                                            <th className="py-2 px-3">Size</th>
                                                            <th className="py-2 px-3">Uploader</th>
                                                            <th className="py-2 px-3">Uploaded Date</th>
                                                            <th className="py-2 px-3 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.materials.map(m => (
                                                            <tr key={m._id} className={`border-b text-sm ${tableRow}`}>
                                                                <td className="py-3 px-3 font-medium truncate max-w-[200px]" title={m.originalFileName || m.title}>
                                                                    {m.originalFileName || m.title}
                                                                </td>
                                                                <td className="py-3 px-3">
                                                                    {m.subject ? `${m.subject.name} (${m.subject.code})` : <span className="text-red-400 font-semibold">Orphan</span>}
                                                                </td>
                                                                <td className="py-3 px-3">{m.materialType}</td>
                                                                <td className="py-3 px-3 font-mono text-xs">{formatBytes(m.fileSize)}</td>
                                                                <td className="py-3 px-3 text-xs">{m.uploaderEmail || m.uploadedBy?.email || 'System'}</td>
                                                                <td className="py-3 px-3 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                                                                <td className="py-3 px-3 text-right">
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button onClick={() => handleOpen(m._id)} title="Open File" className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Open</button>
                                                                        <button onClick={() => handleDownload(m._id)} title="Download" className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold">Download</button>
                                                                        <button onClick={() => handleIgnoreDuplicate(m._id)} title="Keep File" className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Keep</button>
                                                                        <button onClick={() => handleMoveToTrash(m._id)} title="Move to Trash" className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">Trash</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* 2. ORPHAN MATERIALS SECTION */}
                        {activeSection === 'orphans' && (
                            orphans.length === 0 ? (
                                <p className={`text-center py-8 ${muted}`}>No orphaned materials found. Excellent link integrity!</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${muted}`}>
                                                <th className="py-2 px-3">Title</th>
                                                <th className="py-2 px-3">Material Type</th>
                                                <th className="py-2 px-3">File Size</th>
                                                <th className="py-2 px-3">Legacy Subject Info</th>
                                                <th className="py-2 px-3">Map to Academic Subject</th>
                                                <th className="py-2 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orphans.map(m => (
                                                <tr key={m._id} className={`border-b text-sm ${tableRow}`}>
                                                    <td className="py-3 px-3 font-medium truncate max-w-[220px]" title={m.originalFileName || m.title}>
                                                        {m.originalFileName || m.title}
                                                    </td>
                                                    <td className="py-3 px-3">{m.materialType}</td>
                                                    <td className="py-3 px-3 font-mono text-xs">{formatBytes(m.fileSize)}</td>
                                                    <td className={`py-3 px-3 text-xs italic ${muted}`}>{m.legacySubjectName || 'None'}</td>
                                                    <td className="py-3 px-3">
                                                        <select onChange={(e) => handleMapSubject(m._id, e.target.value)}
                                                            defaultValue=""
                                                            className={`px-2 py-1 rounded text-xs w-48 ${input}`}>
                                                            <option value="" disabled>Select Subject...</option>
                                                            {subjects.map(s => (
                                                                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => handleOpen(m._id)} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Open</button>
                                                            <button onClick={() => handleMoveToTrash(m._id)} className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">Trash</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* 3. HIDDEN MATERIALS SECTION */}
                        {activeSection === 'hidden' && (
                            hiddenFiles.length === 0 ? (
                                <p className={`text-center py-8 ${muted}`}>No hidden materials registry matches.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${muted}`}>
                                                <th className="py-2 px-3">Title</th>
                                                <th className="py-2 px-3">Subject</th>
                                                <th className="py-2 px-3">Type</th>
                                                <th className="py-2 px-3">Size</th>
                                                <th className="py-2 px-3">Status</th>
                                                <th className="py-2 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hiddenFiles.map(m => (
                                                <tr key={m._id} className={`border-b text-sm ${tableRow}`}>
                                                    <td className="py-3 px-3 font-medium truncate max-w-[250px]">{m.originalFileName || m.title}</td>
                                                    <td className="py-3 px-3">{m.subject ? `${m.subject.name} (${m.subject.code})` : 'Orphan'}</td>
                                                    <td className="py-3 px-3">{m.materialType}</td>
                                                    <td className="py-3 px-3 font-mono text-xs">{formatBytes(m.fileSize)}</td>
                                                    <td className="py-3 px-3"><span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">Hidden</span></td>
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => handleOpen(m._id)} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Open</button>
                                                            <button onClick={() => handleMoveToTrash(m._id)} className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">Move to Trash</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* 4. SOFT-DELETED TRASH CAN SECTION */}
                        {activeSection === 'trash' && (
                            trashFiles.length === 0 ? (
                                <p className={`text-center py-8 ${muted}`}>Trash can is empty.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${muted}`}>
                                                <th className="py-2 px-3">Title</th>
                                                <th className="py-2 px-3">Subject</th>
                                                <th className="py-2 px-3">Type</th>
                                                <th className="py-2 px-3">Trash Date</th>
                                                <th className="py-2 px-3">Days to Auto-Purge</th>
                                                <th className="py-2 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trashFiles.map(m => {
                                                const deletedDate = m.deletedAt ? new Date(m.deletedAt) : new Date(m.updatedAt);
                                                const diffTime = Math.abs(new Date() - deletedDate);
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                const remainingDays = Math.max(0, 30 - diffDays);

                                                return (
                                                    <tr key={m._id} className={`border-b text-sm ${tableRow}`}>
                                                        <td className="py-3 px-3 font-medium truncate max-w-[250px]">{m.originalFileName || m.title}</td>
                                                        <td className="py-3 px-3">{m.subject ? `${m.subject.name} (${m.subject.code})` : 'Orphan'}</td>
                                                        <td className="py-3 px-3">{m.materialType}</td>
                                                        <td className="py-3 px-3 text-xs">{deletedDate.toLocaleDateString()}</td>
                                                        <td className="py-3 px-3">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${remainingDays <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                {remainingDays} days left
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleRestore(m._id)} title="Restore File" className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Restore</button>
                                                                <button onClick={() => handlePermanentDelete(m._id)} title="Delete Permanently" className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">Purge</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
