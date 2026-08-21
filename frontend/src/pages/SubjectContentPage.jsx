import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subjectAPI, apiClient, uploadAPI, documentsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { generatePDFThumbnail } from '../utils/pdfThumbnail';
import { logAcademicActivity } from '../utils/academicStreak';
import CIECalculatorModal from '../components/CIECalculatorPanel';
import DiscussionPanel from '../components/DiscussionPanel';
import ContentHeader from '../components/ContentHeader';
import ContentTabs from '../components/ContentTabs';
import ContentGrid from '../components/ContentGrid';
import SubjectBottomSheet from '../components/SubjectBottomSheet';
import { useSubjectContext } from '../contexts/SubjectContext';
import { FileText, ClipboardList, FolderArchive, ChartColumn, MessagesSquare } from 'lucide-react';

/* ─── Tab config ─────────────────────────────────────────────────── */
const ICON_PROPS = { size: 20, strokeWidth: 1.75 };
const TABS = [
    {
        id: 'notes',
        label: 'Notes',
        color: '#10B981',
        placeholder: { icon: <FileText {...ICON_PROPS} />, headline: 'No notes available yet', sub: 'Check back later or upload notes to help your juniors.' },
    },
    {
        id: 'pyqs',
        label: 'PYQs',
        color: '#8B5CF6',
        placeholder: { icon: <ClipboardList {...ICON_PROPS} />, headline: 'No PYQs uploaded yet', sub: 'Previous year papers will appear here once available.' },
    },
    {
        id: 'others',
        label: 'Others',
        color: '#3B82F6',
        placeholder: { icon: <FolderArchive {...ICON_PROPS} />, headline: 'No resources available yet', sub: 'Additional resources will be listed here.' },
    },
    {
        id: 'cie',
        label: 'CIE Analyzer',
        color: '#F59E0B',
        placeholder: { icon: <ChartColumn {...ICON_PROPS} />, headline: 'CIE Analyzer Coming Soon', sub: 'CIE tracking and eligibility analysis coming soon.' },
    },
    {
        id: 'discussion',
        label: 'Discussion',
        color: '#EC4899',
        placeholder: { icon: <MessagesSquare {...ICON_PROPS} />, headline: 'Discussion Coming Soon', sub: 'Subject-specific discussions and doubt solving coming soon.' },
    },
];

/* ─── Static sidebar IDs ─────────────────────────────────────────── */
const LOCAL_SUBJECTS = {
    math1: { name: 'Mathematics-I', code: 'AMS1', credits: 4, semester: '1' },
    physics: { name: 'Physics', code: 'PHY101', credits: 4, semester: '1' },
    chem: { name: 'Chemistry', code: 'CHE101', credits: 4, semester: '1' },
    elec: { name: 'Electronics', code: 'ELE101', credits: 3, semester: '1' },
    engraph: { name: 'Engineering Graphics', code: 'EG101', credits: 3, semester: '1' },
    ai: { name: 'AI Fundamentals', code: 'AI101', credits: 3, semester: '1' },
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
            <span style={{ color: tab.color, opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                {tab.placeholder.icon}
            </span>
            <h3 className="text-[13px] font-bold tracking-widest uppercase" style={{ color: tab.color }}>
                {(tab?.placeholder?.headline || '').replace(' Coming Soon', '')} Module
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
// ContentList component has been extracted to ContentGrid.jsx

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT CONTENT PAGE
═══════════════════════════════════════════════════════════════════ */
const SubjectContentPage = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const subjectCtx = useSubjectContext();

    const [subject, setSubject] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('notes');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');
    const [showPdf, setShowPdf] = useState(false);
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);

    const fileInputRef = useRef(null);
    const loggedSubjectRef = useRef(null);

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

    const loadContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/subjects/${encodeURIComponent(subjectId)}/materials`);
            const { subject: resolvedSubject, notes, see, internals, others } = res.data;
            
            if (resolvedSubject) {
                setSubject({
                    _id: resolvedSubject._id,
                    name: resolvedSubject.name,
                    code: resolvedSubject.code,
                    credits: resolvedSubject.credits ?? '—',
                    semester: resolvedSubject.year || '—',
                });

                const mapMaterial = (m) => ({
                    _id: m._id,
                    originalName: m.title || m.originalFileName,
                    fileName: m.title,
                    fileUrl: m.fileUrl,
                    fileSize: m.fileSize || 0,
                    documentType: m.materialType.toLowerCase() === 'see' ? 'see' : m.materialType.toLowerCase(),
                    subjectName: resolvedSubject.name,
                    subjectCode: resolvedSubject.code,
                    uploadedAt: m.createdAt,
                    tags: m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                    thumbnail: null,
                });

                setContent({
                    notes: (notes || []).map(mapMaterial),
                    pyqs: (see || []).map(mapMaterial),
                    questionBanks: (internals || []).map(mapMaterial),
                    others: (others || []).map(mapMaterial),
                    syllabus: [],
                });
            } else {
                setError('Subject not found');
            }
        } catch (err) {
            console.error('Failed to load content:', err);
            setError(err.response?.status === 404 ? 'Subject not found' : 'Failed to load materials. Please try again.');
            setContent({ notes: [], pyqs: [], questionBanks: [], others: [], syllabus: [] });
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => { loadContent(); }, [loadContent]);

    useEffect(() => {
        if (!subjectId || loggedSubjectRef.current === subjectId) return;
        loggedSubjectRef.current = subjectId;
        logAcademicActivity({ type: 'subject', label: `Opened Subject: ${decodeURIComponent(subjectId)}` });
    }, [subjectId]);

    const handleTabChange = (nextTab) => {
        setActiveTab(nextTab);
        if (nextTab === 'pyqs') {
            logAcademicActivity({ type: 'pyqs', label: `Opened PYQs: ${subject?.name || decodeURIComponent(subjectId)}` });
        }
    };

    const handleView = async (contentType, contentId) => {
        try {
            const res = await apiClient.get(`/documents/${contentId}/preview-url`);
            setPdfUrl(res.data.previewUrl); setPdfTitle(res.data.title || 'Document'); setShowPdf(true);
            if (contentType === 'notes') {
                logAcademicActivity({
                    type: 'notes_preview',
                    label: `Previewed Notes: ${res.data.title || 'Document'}`,
                    meta: { contentType, contentId },
                });
            } else if (contentType === 'pyqs') {
                logAcademicActivity({
                    type: 'pyqs',
                    label: `Opened PYQs: ${res.data.title || 'Document'}`,
                    meta: { contentType, contentId },
                });
            }
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
                if (activeTab === 'notes') {
                    logAcademicActivity({
                        type: 'notes_download',
                        label: `Downloaded Notes: ${originalName || res.data.title || 'Document'}`,
                        meta: { contentId },
                    });
                }
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

    const tab = TABS.find(t => t.id === activeTab);
    const activeItems = content
        ? (activeTab === 'notes' ? content.notes : activeTab === 'pyqs' ? content.pyqs : activeTab === 'others' ? content.others : [])
        : [];

    /* ── Loading Skeleton Grid ── */
    if (loading) return (
        <div style={{ width: '100%', padding: '24px 24px 24px 28px' }}>
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-6 animate-pulse">
                <div className="skeleton-block h-8 w-48 rounded-lg"></div>
                <div className="skeleton-block h-10 w-32 rounded-xl"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-3 mb-8 animate-pulse">
                <div className="skeleton-block h-9 w-24 rounded-full"></div>
                <div className="skeleton-block h-9 w-20 rounded-full"></div>
                <div className="skeleton-block h-9 w-22 rounded-full"></div>
                <div className="skeleton-block h-9 w-28 rounded-full"></div>
                <div className="skeleton-block h-9 w-26 rounded-full"></div>
            </div>

            {/* Grid Skeleton — responsive */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton-card rounded-3xl border p-5 flex flex-col gap-4 animate-pulse">
                        <div className="flex justify-between items-start">
                            <div className="skeleton-block h-6 w-3/4 rounded"></div>
                            <div className="skeleton-block h-5 w-5 rounded"></div>
                        </div>
                        <div className="skeleton-block h-4 w-1/3 rounded"></div>
                        <div className="skeleton-preview rounded-xl h-48 flex items-center justify-center">
                            <div className="skeleton-block h-12 w-12 rounded-full"></div>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <div className="skeleton-block flex-1 h-10 rounded-xl"></div>
                            <div className="skeleton-block flex-1 h-10 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-base font-bold" style={{ color: 'var(--theme-text)' }}>{error}</p>
            <button onClick={() => navigate('/dashboard')}
                className="text-sm text-purple-400 hover:underline cursor-pointer">← Dashboard</button>
        </div>
    );


    /* ═════════════════════════════════════════════════════════════
       RENDER
    ═════════════════════════════════════════════════════════════ */
    return (
        <div className="subject-content-container" style={{ width: '100%', height: '100%', padding: '0 24px 40px 28px' }}>

            {/* ══ STICKY HEADER: Subject name + Upload + Tabs ══ */}
            <ContentHeader
                subjectName={subject?.name}
                subjectCode={subject?.code}
                user={user}
                activeTab={activeTab}
                tabLabel={tab?.label}
                isSubjectsOpen={isSubjectsModalOpen}
                onToggleSubjectsModal={() => setIsSubjectsModalOpen(prev => !prev)}
                onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
            >
                {/* ── Category Tabs (pill style) ── */}
                <ContentTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                />
            </ContentHeader>

            {/* ══ TAB CONTENT ══ */}
            <div style={{ width: '100%' }}>
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
                        ? <ContentGrid key={activeTab + '-list'} items={activeItems} contentType={activeTab} onView={handleView} onDownload={handleDownload} onDelete={handleDeleteMaterial} showDelete={user?.isAdmin} color={tab?.color || '#8B5CF6'} />
                        : <Placeholder key={activeTab} tab={tab} />
                    }
                </AnimatePresence>
            </div>

            {/* ══ MOBILE SUBJECT DROPDOWN MENU ══ */}
            <SubjectBottomSheet
                isOpen={subjectCtx?.isSubjectsModalOpen ?? isSubjectsModalOpen}
                onClose={() => {
                    subjectCtx?.setIsSubjectsModalOpen?.(false);
                    setIsSubjectsModalOpen(false);
                }}
                subjects={subjectCtx?.subjects || []}
                filteredSubjects={subjectCtx?.filteredSubjects || []}
                subjectSearch={subjectCtx?.subjectSearch || ''}
                onSearchChange={subjectCtx?.setSubjectSearch}
                activeSubjectId={subjectCtx?.activeSubjectId || subjectId}
                onSelectSubject={subjectCtx?.onSelectSubject}
                loading={subjectCtx?.loadingSubjects}
                pinnedIds={subjectCtx?.pinnedIds}
                onTogglePin={subjectCtx?.onTogglePin}
            />

            {/* ══ PDF MODAL ══ */}
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
                            className="pdf-modal-inner relative w-full max-w-4xl h-[82vh] rounded-2xl overflow-hidden flex flex-col"
                            style={{
                                background: 'var(--preview-modal-bg)',
                                border: '1px solid var(--preview-modal-border)',
                                boxShadow: '0 0 80px rgba(139,92,246,0.2)'
                            }}
                        >
                            <div className="pdf-modal-header flex items-center justify-between px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid var(--preview-header-border)' }}>
                                <p className="pdf-modal-title text-sm font-semibold truncate pr-4" style={{ color: 'var(--theme-text)' }}>{pdfTitle}</p>
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

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 767px) {
                    .subject-content-container {
                        padding: 0 16px 40px 16px !important;
                    }
                }
            `}} />
        </div>
    );
};

export default SubjectContentPage;
