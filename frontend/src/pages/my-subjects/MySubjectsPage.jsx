import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, 
    FileText, 
    ClipboardList, 
    MessagesSquare, 
    Sparkles, 
    ChevronDown, 
    Layers, 
    Clock, 
    AlertCircle, 
    Menu, 
    X,
    FolderKanban
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { apiV2 } from '../../services/authService';
import { subjectAPI } from '../../services/api/subjectApi';
import { MY_SUBJECTS_TABS } from '../../data/mySubjectsData';
import MySubjectsSidebar from './components/MySubjectsSidebar';

/* ═══════════════════════════════════════════════════════════════════
   TAB METADATA (Editorial, PYQs, Discussion)
═══════════════════════════════════════════════════════════════════ */
const TAB_CONFIGS = {
    editorial: {
        id: 'editorial',
        label: 'Editorial',
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.35)',
        icon: FileText,
        title: 'Module Editorial & Explanations',
        description: 'In-depth conceptual breakdowns, verified formulas, and handwritten solution explanations curated by top seniors.'
    },
    pyqs: {
        id: 'pyqs',
        label: 'PYQs',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.35)',
        icon: ClipboardList,
        title: 'Previous Year Exam Questions',
        description: 'Module-wise examination question papers with year tagging, mark distributions, and model answers.'
    },
    discussion: {
        id: 'discussion',
        label: 'Discussion',
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.35)',
        icon: MessagesSquare,
        title: 'Module Doubts & Discussions',
        description: 'Ask questions, discuss challenging numericals with peers, and get verified answers from senior mentors.'
    }
};

/* ═══════════════════════════════════════════════════════════════════
   MY SUBJECTS PAGE
═══════════════════════════════════════════════════════════════════ */
const MySubjectsPage = () => {
    const { subjectSlug, moduleSlug, section } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    // Registered Subjects data (loaded dynamically from database)
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Derive base path prefix (/plus/my-subjects or /my-subjects)
    const basePath = location.pathname.startsWith('/plus/my-subjects') 
        ? '/plus/my-subjects' 
        : '/my-subjects';

    // Fetch subjects & modules directly from database
    useEffect(() => {
        let isMounted = true;
        const fetchSubjectsFromDatabase = async () => {
            try {
                setLoading(true);
                const res = await apiV2.getRegisteredSubjects();
                
                if (isMounted && res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    // Extract subject data and module names fetched from database
                    const formatted = res.data.data.map((item, idx) => {
                        const sObj = item.subject || item;
                        const sName = sObj.name || item.customName || `Subject ${idx + 1}`;
                        const sCode = (sObj.code || item.customCode || '').toUpperCase().trim();
                        const sId = sObj._id || item._id || `subj-${idx}`;
                        const sSlug = (sName || sId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                        // Modules retrieved directly from database Subject collection
                        const dbModules = sObj.modules || [];
                        const modules = dbModules.length > 0
                            ? dbModules.map((m, mIdx) => ({
                                id: `module-${m.moduleNumber || mIdx + 1}`,
                                slug: `module-${m.moduleNumber || mIdx + 1}`,
                                moduleNumber: m.moduleNumber || mIdx + 1,
                                name: m.name || m.title || `Module ${m.moduleNumber || mIdx + 1}`
                            }))
                            : [1, 2, 3, 4, 5].map(num => ({
                                id: `module-${num}`,
                                slug: `module-${num}`,
                                moduleNumber: num,
                                name: `Module ${num}`
                            }));

                        return {
                            id: sSlug || sId,
                            slug: sSlug || sId,
                            name: sName,
                            code: sCode || 'SUB101',
                            credits: sObj.credits || item.registeredCredits || 4,
                            modules
                        };
                    });

                    setSubjects(formatted);
                } else if (isMounted) {
                    // Fallback: Query all subjects directly from database /api/subjects
                    const userBranch = user?.branch || 'CS';
                    const dbRes = await subjectAPI.getSubjectsByBranch(userBranch);
                    const dbList = Array.isArray(dbRes.data) ? dbRes.data : [];

                    const formatted = dbList.map((s, idx) => {
                        const sName = s.name || `Subject ${idx + 1}`;
                        const sCode = (s.code || '').toUpperCase().trim();
                        const sId = s._id || `subj-${idx}`;
                        const sSlug = (sName || sId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                        const dbModules = s.modules || [];
                        const modules = dbModules.map((m, mIdx) => ({
                            id: `module-${m.moduleNumber || mIdx + 1}`,
                            slug: `module-${m.moduleNumber || mIdx + 1}`,
                            moduleNumber: m.moduleNumber || mIdx + 1,
                            name: m.title || m.name || `Module ${m.moduleNumber || mIdx + 1}`
                        }));

                        return {
                            id: sSlug || sId,
                            slug: sSlug || sId,
                            name: sName,
                            code: sCode,
                            credits: s.credits || 4,
                            modules
                        };
                    });

                    setSubjects(formatted);
                }
            } catch (err) {
                console.warn('[MySubjects] Falling back to department database subjects:', err);
                if (isMounted) {
                    try {
                        const userBranch = user?.branch || 'CS';
                        const dbRes = await subjectAPI.getSubjectsByBranch(userBranch);
                        const dbList = Array.isArray(dbRes.data) ? dbRes.data : [];
                        const formatted = dbList.map((s, idx) => ({
                            id: s.slug || s._id || `subj-${idx}`,
                            slug: s.slug || s._id || `subj-${idx}`,
                            name: s.name,
                            code: s.code,
                            credits: s.credits || 4,
                            modules: (s.modules || []).map((m, mIdx) => ({
                                id: `module-${m.moduleNumber || mIdx + 1}`,
                                slug: `module-${m.moduleNumber || mIdx + 1}`,
                                moduleNumber: m.moduleNumber || mIdx + 1,
                                name: m.title || m.name || `Module ${m.moduleNumber || mIdx + 1}`
                            }))
                        }));
                        setSubjects(formatted);
                    } catch (fallbackErr) {
                        console.error('[MySubjects] Fallback fetch failed:', fallbackErr);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSubjectsFromDatabase();
        return () => { isMounted = false; };
    }, [user?.branch]);

    // ── Active Subject & Active Module Resolution ────────────────────
    const activeSubject = useMemo(() => {
        if (!subjects.length) return null;
        if (subjectSlug) {
            const found = subjects.find(s => s.slug === subjectSlug || s.id === subjectSlug);
            if (found) return found;
        }
        return subjects[0];
    }, [subjects, subjectSlug]);

    const activeModule = useMemo(() => {
        if (!activeSubject || !activeSubject.modules?.length) return null;
        if (moduleSlug) {
            const found = activeSubject.modules.find(m => m.slug === moduleSlug || `module-${m.moduleNumber}` === moduleSlug);
            if (found) return found;
        }
        return activeSubject.modules[0];
    }, [activeSubject, moduleSlug]);

    const activeTab = useMemo(() => {
        if (section && TAB_CONFIGS[section.toLowerCase()]) {
            return section.toLowerCase();
        }
        return 'editorial';
    }, [section]);

    // Accordion expand state: Default to active subject
    const [expandedSubjectId, setExpandedSubjectId] = useState(() => activeSubject?.id || null);

    useEffect(() => {
        if (activeSubject?.id) {
            setExpandedSubjectId(activeSubject.id);
        }
    }, [activeSubject?.id]);

    // ── Navigation Handlers ──────────────────────────────────────────
    const handleToggleExpandSubject = (subId) => {
        setExpandedSubjectId(prev => (prev === subId ? null : subId));
    };

    const handleSelectModule = (subject, module) => {
        setExpandedSubjectId(subject.id);
        navigate(`${basePath}/${subject.slug}/${module.slug}/${activeTab}`);
    };

    const handleSelectTab = (tabId) => {
        if (!activeSubject || !activeModule) return;
        navigate(`${basePath}/${activeSubject.slug}/${activeModule.slug}/${tabId}`);
    };

    const activeTabMeta = TAB_CONFIGS[activeTab] || TAB_CONFIGS.editorial;
    const TabIcon = activeTabMeta.icon;

    return (
        <div 
            className="my-subjects-workspace-container"
            style={{
                width: '100%',
                height: '100%',
                minHeight: 'calc(100vh - 40px)',
                display: 'flex',
                background: 'var(--dashboard-bg, #0b0716)',
                color: '#f8fafc',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* ══════════════════════════════════════════════════════════════
                DESKTOP SIDEBAR (≥ 768px)
            ══════════════════════════════════════════════════════════════ */}
            <div 
                className="hidden md:block shrink-0"
                style={{
                    width: '300px',
                    height: '100%',
                    borderRight: '1px solid rgba(139, 92, 246, 0.15)'
                }}
            >
                <MySubjectsSidebar
                    subjects={subjects}
                    loading={loading}
                    activeSubjectId={activeSubject?.id}
                    activeModuleId={activeModule?.id}
                    expandedSubjectId={expandedSubjectId}
                    onToggleExpandSubject={handleToggleExpandSubject}
                    onSelectModule={handleSelectModule}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE DRAWER MODAL (< 768px)
            ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileDrawerOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 90,
                                background: 'rgba(0,0,0,0.75)',
                                backdropFilter: 'blur(6px)'
                            }}
                            className="block md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '85vw',
                                maxWidth: '320px',
                                zIndex: 100,
                                background: '#0e091b',
                                boxShadow: '0 0 30px rgba(0,0,0,0.8)'
                            }}
                            className="block md:hidden"
                        >
                            <div style={{ position: 'relative', height: '100%' }}>
                                <button
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    style={{
                                        position: 'absolute',
                                        top: 14,
                                        right: 12,
                                        background: 'rgba(255,255,255,0.06)',
                                        border: 'none',
                                        color: '#94a3b8',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={15} />
                                </button>
                                <MySubjectsSidebar
                                    subjects={subjects}
                                    loading={loading}
                                    activeSubjectId={activeSubject?.id}
                                    activeModuleId={activeModule?.id}
                                    expandedSubjectId={expandedSubjectId}
                                    onToggleExpandSubject={handleToggleExpandSubject}
                                    onSelectModule={handleSelectModule}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════
                MAIN CONTENT AREA
            ══════════════════════════════════════════════════════════════ */}
            <main 
                className="flex-1 flex flex-col h-full overflow-y-auto overscroll-contain scrollbar-none"
                style={{
                    padding: '20px 24px 40px 28px',
                    boxSizing: 'border-box'
                }}
            >
                {/* ── Mobile Subject Selector Bar (< 768px) ── */}
                <div className="block md:hidden mb-4">
                    <button
                        type="button"
                        onClick={() => setIsMobileDrawerOpen(true)}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(139, 92, 246, 0.08)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#f8fafc',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <Layers size={16} color="#a78bfa" />
                            <div style={{ textAlign: 'left', minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 650, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {activeSubject?.name || 'Select Subject'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#a78bfa' }}>
                                    {activeModule ? `Module ${activeModule.moduleNumber}` : 'Modules'}
                                </div>
                            </div>
                        </div>
                        <ChevronDown size={16} color="#a78bfa" />
                    </button>
                </div>

                {/* ── Subject & Module Header ───────────────────────────── */}
                {loading && !activeSubject ? (
                    <div className="animate-pulse space-y-4 pb-5 border-b border-white/10 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-12 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="h-6 w-52 rounded bg-white/10" />
                                <div className="h-4 w-36 rounded bg-white/5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <header
                        style={{
                            paddingBottom: '20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: '20px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            {/* Gradient Vertical Accent Bar */}
                            <div 
                                style={{
                                    width: 4,
                                    height: 52,
                                    borderRadius: 99,
                                    background: 'linear-gradient(180deg, #00f5b8, #7c3aed)',
                                    flexShrink: 0,
                                    marginTop: 2
                                }} 
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                    <h1
                                        style={{
                                            fontSize: 'clamp(22px, 3.2vw, 30px)',
                                            fontWeight: 800,
                                            letterSpacing: '-0.03em',
                                            color: '#ffffff',
                                            margin: 0,
                                            lineHeight: 1.15
                                        }}
                                    >
                                        {activeSubject?.name || 'Subject'}
                                    </h1>
                                    {activeSubject?.code && (
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(139, 92, 246, 0.15)',
                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                color: '#c4b5fd',
                                                letterSpacing: '0.04em'
                                            }}
                                        >
                                            {activeSubject.code}
                                        </span>
                                    )}
                                </div>

                                {/* Active Module Banner */}
                                {activeModule && (
                                    <div 
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginTop: '4px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#00f5b8',
                                            background: 'rgba(0, 245, 184, 0.08)',
                                            border: '1px solid rgba(0, 245, 184, 0.2)',
                                            padding: '4px 10px',
                                            borderRadius: '6px'
                                        }}
                                    >
                                        <span style={{ fontWeight: 750 }}>Module {activeModule.moduleNumber}:</span>
                                        <span style={{ color: 'rgba(241, 245, 249, 0.9)' }}>{activeModule.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Navigation Tabs (Editorial, PYQs, Discussion) ── */}
                        <div 
                            className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-5"
                            style={{
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            {MY_SUBJECTS_TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const meta = TAB_CONFIGS[tab.id];
                                const Icon = meta.icon;

                                return (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => handleSelectTab(tab.id)}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '0 18px',
                                            height: '40px',
                                            borderRadius: '999px',
                                            border: `1px solid ${isActive ? meta.border : 'rgba(255, 255, 255, 0.08)'}`,
                                            background: isActive ? meta.bg : 'rgba(255, 255, 255, 0.02)',
                                            color: isActive ? meta.color : 'rgba(148, 163, 184, 0.8)',
                                            fontSize: '13px',
                                            fontWeight: isActive ? 650 : 500,
                                            cursor: 'pointer',
                                            outline: 'none',
                                            boxShadow: isActive ? `0 0 16px ${meta.color}25` : 'none',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease'
                                        }}
                                        className={isActive ? '' : 'hover:bg-white/5 hover:text-slate-200'}
                                    >
                                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ opacity: isActive ? 1 : 0.7 }} />
                                        <span>{tab.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </header>
                )}

                {/* ── Placeholder Content Body ──────────────────────────── */}
                <div 
                    className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4"
                    style={{
                        minHeight: '340px'
                    }}
                >
                    <motion.div
                        key={`${activeSubject?.id}-${activeModule?.id}-${activeTab}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            maxWidth: '480px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        {/* Tab Icon with Ambient Radial Glow */}
                        <div 
                            style={{
                                width: 68,
                                height: 68,
                                borderRadius: '20px',
                                background: activeTabMeta.bg,
                                border: `1px solid ${activeTabMeta.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: activeTabMeta.color,
                                boxShadow: `0 0 32px ${activeTabMeta.color}30`,
                                marginBottom: 4
                            }}
                        >
                            <TabIcon size={30} strokeWidth={1.8} />
                        </div>

                        {/* Title & Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <h3 
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 750,
                                    color: '#f1f5f9',
                                    margin: 0,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                {activeTabMeta.title}
                            </h3>
                            <span 
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#94a3b8',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Coming Soon
                            </span>
                        </div>

                        {/* Context summary */}
                        <p 
                            style={{
                                fontSize: '13px',
                                color: 'rgba(148, 163, 184, 0.7)',
                                margin: '4px 0 12px',
                                lineHeight: 1.6
                            }}
                        >
                            {activeTabMeta.description}
                        </p>

                        <div
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'rgba(139, 92, 246, 0.06)',
                                border: '1px dashed rgba(139, 92, 246, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                color: '#c4b5fd'
                            }}
                        >
                            <Sparkles size={14} color="#00f5b8" />
                            <span>
                                Active Context: <strong>{activeSubject?.name}</strong> → <strong>Module {activeModule?.moduleNumber}</strong>
                            </span>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default MySubjectsPage;
