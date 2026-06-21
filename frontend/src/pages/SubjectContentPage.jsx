import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subjectAPI, apiClient, uploadAPI, documentsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ResourceCard from '../components/ResourceCard';
import { generatePDFThumbnail } from '../utils/pdfThumbnail';
import CIECalculatorModal from '../components/CIECalculatorPanel';
import DiscussionPanel from '../components/DiscussionPanel';

/* ─── Tab config ─────────────────────────────────────────────────── */
const TABS = [
    {
        id: 'notes',
        label: 'Notes',
        color: '#10B981',
        placeholder: { emoji: '📖', headline: 'No notes available yet', sub: 'Check back later or upload notes to help your juniors.' },
    },
    {
        id: 'pyqs',
        label: 'PYQs',
        color: '#8B5CF6',
        placeholder: { emoji: '📝', headline: 'No PYQs uploaded yet', sub: 'Previous year papers will appear here once available.' },
    },
    {
        id: 'others',
        label: 'Others',
        color: '#3B82F6',
        placeholder: { emoji: '📂', headline: 'No resources available yet', sub: 'Additional resources will be listed here.' },
    },
    {
        id: 'cie',
        label: 'CIE Analyzer',
        color: '#F59E0B',
        placeholder: { emoji: '📊', headline: 'CIE Analyzer Coming Soon', sub: 'CIE tracking and eligibility analysis coming soon.' },
    },
    {
        id: 'discussion',
        label: 'Discussion',
        color: '#EC4899',
        placeholder: { emoji: '💬', headline: 'Discussion Coming Soon', sub: 'Subject-specific discussions and doubt solving coming soon.' },
    },
];

/* ─── Static sidebar IDs ─────────────────────────────────────────── */
const LOCAL_SUBJECTS = {
    math1:   { name: 'Mathematics-I',        code: 'AMS1',   credits: 4, semester: '1' },
    physics: { name: 'Physics',              code: 'PHY101', credits: 4, semester: '1' },
    chem:    { name: 'Chemistry',            code: 'CHE101', credits: 4, semester: '1' },
    elec:    { name: 'Electronics',          code: 'ELE101', credits: 3, semester: '1' },
    engraph: { name: 'Engineering Graphics', code: 'EG101',  credits: 3, semester: '1' },
    ai:      { name: 'AI Fundamentals',      code: 'AI101',  credits: 3, semester: '1' },
};
const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

/* ═══════════════════════════════════════════════════════════════════
   MINIMAL PLACEHOLDER
═══════════════════════════════════════════════════════════════════ */
const Placeholder = ({ tab }) => (
    <motion.div
        key={tab.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center select-none"
    >
        <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{tab.placeholder.emoji}</span>
            <h3 className="text-[13px] font-bold tracking-widest uppercase" style={{ color: tab.color }}>
                {tab.placeholder.headline.replace(' Coming Soon', '')} Module
            </h3>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.7)' }}>
            Coming Soon
        </div>

        <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>
            {tab.placeholder.sub}
        </p>
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════
   CONTENT LIST  (when API returns files)
═══════════════════════════════════════════════════════════════════ */
const ContentList = ({ items, contentType, onView, onDownload, onDelete, showDelete, color }) => {
    if (!items?.length) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 w-full">
            {items.map((item, i) => (
                <ResourceCard 
                    key={item._id || i}
                    resource={item}
                    onPreview={() => onView(contentType, item._id)}
                    onDownload={() => onDownload(item._id, item.originalName || item.fileName || 'download')}
                    onDelete={onDelete}
                    showDelete={showDelete}
                    color={color}
                />
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT CONTENT PAGE
═══════════════════════════════════════════════════════════════════ */
const SubjectContentPage = () => {
    const { subjectId } = useParams();
    const navigate      = useNavigate();
    const { user }      = useContext(AuthContext);

    const [subject,      setSubject]      = useState(null);
    const [content,      setContent]      = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [activeTab,    setActiveTab]    = useState('notes');
    const [pdfUrl,       setPdfUrl]       = useState(null);
    const [pdfTitle,     setPdfTitle]     = useState('');
    const [showPdf,      setShowPdf]      = useState(false);

    const fileInputRef = useRef(null);

    const handleAdminFastUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let backendContentType = 'others';
        if (activeTab === 'pyqs') backendContentType = 'see';
        else if (activeTab === 'notes') backendContentType = 'notes';
        else if (activeTab === 'questionBanks') backendContentType = 'internals';

        setLoading(true);
        try {
            // Generate thumbnails for PDFs before upload
            const items = await Promise.all(files.map(async (file) => {
                const { thumbnail, pageCount } = await generatePDFThumbnail(file);
                return { file, thumbnail, pageCount };
            }));

            // Prepare metadata payload
            const metadata = {
                subjectName: subject.name,
                subjectCode: subject.code && subject.code !== '—' ? subject.code : subject.name, // Use name as code for generic subjects
                semester: subject.semester || '1',
                branch: subject.branch || 'ALL',
                documentType: backendContentType,
                paperType: 'regular'
            };

            await documentsAPI.uploadDocument(metadata, items);

            alert('Upload successful!');
            await loadContent(); // Refresh the materials
        } catch (err) {
            console.error('Fast upload error:', err);
            alert('Failed to upload material');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /* ESC closes PDF */
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') setShowPdf(false); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    /* Load subject */
    const loadContent = useCallback(async () => {
        setLoading(true); setError(null);

        if (!isObjectId(subjectId)) {
            const decodedName = decodeURIComponent(subjectId);
            const local = LOCAL_SUBJECTS[decodedName] || Object.values(LOCAL_SUBJECTS).find(s => s.name === decodedName);
            setSubject(local || { name: decodedName, code: '—', credits: '—', semester: '1' });
            
            try {
                // Fetch materials specifically for this string-based subject
                const params = new URLSearchParams();
                params.append('subject', decodedName.toLowerCase());
                const res = await apiClient.get(`/documents/search?${params.toString()}`);
                const docs = res.data.documents || res.data || [];
                
                setContent({
                    notes:         docs.filter(d => d.documentType === 'notes'),
                    pyqs:          docs.filter(d => d.documentType === 'see'),
                    questionBanks: docs.filter(d => d.documentType === 'internals'),
                    others:        docs.filter(d => d.documentType === 'others'),
                    syllabus:      docs.filter(d => d.documentType === 'syllabus'),
                });
            } catch (err) {
                console.error('Failed to fetch documents for generic subject', err);
                setContent({ notes: [], pyqs: [], questionBanks: [], others: [], syllabus: [] });
            }
            setLoading(false);
            return;
        }

        try {
            const res  = await subjectAPI.getSubjectContent(subjectId);
            const data = res.data;
            if (!data) { setError('Subject not found'); return; }
            
            const subjName = data.subjectInfo?.name || data.name || 'Subject';
            const subjCredits = parseFloat(data.subjectInfo?.credits ?? data.credits) || 0;
            const subjNameLC = subjName.toLowerCase();
            const isLab = /\blab(oratory)?\b|\bpractical\b/.test(subjNameLC) && !subjNameLC.includes('theory');
            setSubject({
                _id:      subjectId,
                name:     subjName,
                code:     data.subjectInfo?.code     || data.code     || '—',
                credits:  subjCredits,
                semester: data.subjectInfo?.semester || data.semester || '—',
                isLab,
            });

            // Fetch materials from single source of truth based on subject name
            const params = new URLSearchParams();
            params.append('subject', subjName.toLowerCase());
            const docRes = await apiClient.get(`/documents/search?${params.toString()}`);
            const docs = docRes.data.documents || docRes.data || [];
            
            setContent({
                notes:         docs.filter(d => d.documentType === 'notes'),
                pyqs:          docs.filter(d => d.documentType === 'see'),
                questionBanks: docs.filter(d => d.documentType === 'internals'),
                others:        docs.filter(d => d.documentType === 'others'),
                syllabus:      docs.filter(d => d.documentType === 'syllabus'),
            });
        } catch (err) {
            setError(err.response?.status === 404 ? 'Subject not found' : 'Failed to load. Please try again.');
            setContent({ notes: [], pyqs: [], questionBanks: [], syllabus: [], others: [] });
        } finally { setLoading(false); }
    }, [subjectId]);

    useEffect(() => { loadContent(); }, [loadContent]);

    const handleView = async (contentType, contentId) => {
        try {
            const res = await apiClient.get(`/documents/${contentId}/preview-url`);
            setPdfUrl(res.data.previewUrl); setPdfTitle(res.data.title || 'Document'); setShowPdf(true);
        } catch (err) { alert(err.response?.data?.error || 'Failed to load content'); }
    };

    const handleDownload = async (contentId, originalName) => {
        try {
            const res = await apiClient.get(`/documents/${contentId}/download`);
            if (res.data && res.data.downloadUrl) {
                const link = document.createElement('a');
                link.href = res.data.downloadUrl;
                link.setAttribute('download', originalName || 'download');
                link.setAttribute('target', '_blank'); // Ensures it doesn't navigate away if it opens in a browser
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to download file');
        }
    };

    const handleDeleteMaterial = async (resource) => {
        if (!window.confirm(`Are you sure you want to delete "${resource.originalName || resource.fileName || 'this document'}"?`)) return;
        try {
            await documentsAPI.deleteDocument(resource._id);
            alert('Document deleted successfully');
            loadContent();
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const tab        = TABS.find(t => t.id === activeTab);
    const activeItems = content
        ? (activeTab === 'notes' ? content.notes : activeTab === 'pyqs' ? content.pyqs : activeTab === 'others' ? content.others : [])
        : [];

    /* ── Loading ── */
    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-base font-bold text-white">{error}</p>
            <button onClick={() => navigate('/dashboard')}
                className="text-sm text-purple-400 hover:underline">← Dashboard</button>
        </div>
    );

    /* ═════════════════════════════════════════════════════════════
       RENDER
    ═════════════════════════════════════════════════════════════ */
    return (
        /*
         * Break out of DashboardLayout's side padding only.
         * Top padding is perfectly handled by DashboardLayout (pt-56px).
         */
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">

            {/* ══════════════════════════════════════════════════
                STICKY TAB NAV — directly below 56px TopBar
            ══════════════════════════════════════════════════ */}
            <div
                className="sticky z-20 flex flex-col"
                style={{
                    top: '56px',
                    background: 'rgba(8,4,22,0.97)',
                    borderBottom: '1px solid rgba(139,92,246,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {/* ── Breadcrumb ── */}
                <div className="px-4 sm:px-6 lg:px-10 pt-2 flex items-center">
                    <span className="text-[12px] font-medium text-slate-400 opacity-60 flex items-center gap-1.5 select-none">
                        📘 {subject?.name || 'Subject'}
                    </span>
                </div>

                <div className="flex w-full px-0 sm:px-2">
                    {TABS.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className="relative flex-1 flex items-center justify-center py-3.5 text-[15px] sm:text-[16px] font-semibold transition-colors duration-200 outline-none border-none bg-transparent cursor-pointer tracking-wide"
                                style={{ color: isActive ? t.color : 'rgba(100,116,139,0.7)' }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(203,213,225,0.9)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(100,116,139,0.7)'; }}
                            >
                                {t.label}

                                {/* Animated active underline */}
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full"
                                        style={{ background: t.color, boxShadow: `0 -2px 10px ${t.color}40` }}
                                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                TAB CONTENT
            ══════════════════════════════════════════════════ */}
            <div className="px-4 sm:px-6 lg:px-10 w-full">
                
                {/* Section Header for Admin Fast Upload */}
                {user?.isAdmin && ['notes', 'pyqs', 'others'].includes(activeTab) && (
                    <div className="flex justify-end pt-4 w-full">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5"
                            title={`Upload ${tab?.label}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Upload {tab?.label}
                        </button>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.zip,.rar"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleAdminFastUpload}
                        />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'discussion' ? (
                        <DiscussionPanel 
                            key="discussion-panel" 
                            subjectId={subjectId} 
                            subjectName={subject?.name || subjectId}
                            currentUser={user}
                        />
                    ) : activeTab === 'cie' ? (
                        <motion.div
                            key="cie-analyzer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full pb-10 pt-4 max-w-5xl mx-auto"
                        >
                            <CIECalculatorModal subject={subject} inline={true} />
                        </motion.div>
                    ) : activeItems.length > 0
                        ? <ContentList key={activeTab + '-list'} items={activeItems} contentType={activeTab} onView={handleView} onDownload={handleDownload} onDelete={handleDeleteMaterial} showDelete={user?.isAdmin} color={tab?.color || '#8B5CF6'} />
                        : <Placeholder key={activeTab} tab={tab} />
                    }
                </AnimatePresence>
            </div>

            {/* ══════════════════════════════════════════════════
                PDF MODAL
            ══════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showPdf && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/75" style={{ backdropFilter: 'blur(8px)' }}
                            onClick={() => setShowPdf(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                            className="relative w-full max-w-4xl h-[82vh] rounded-2xl overflow-hidden flex flex-col"
                            style={{ background: 'rgba(8,4,22,0.99)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 80px rgba(139,92,246,0.2)' }}
                        >
                            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                                <p className="text-sm font-semibold text-white truncate pr-4">{pdfTitle}</p>
                                <button onClick={() => setShowPdf(false)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-white/6"
                                    style={{ color: 'rgba(148,163,184,0.5)', flexShrink: 0 }}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 p-3">
                                <iframe src={pdfUrl} className="w-full h-full rounded-xl" title={pdfTitle} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectContentPage;