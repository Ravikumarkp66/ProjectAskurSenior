import React, { useState, useEffect, useContext, useMemo, useRef, Suspense, lazy } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget
} from '../../components/dashboard/RightPanel';
import { 
    Search, BookOpen, FileText, Download, Eye, X, ExternalLink, 
    Layers, GraduationCap, ChevronRight, ChevronDown, ArrowLeft, Bookmark, 
    Sparkles, Folder, Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api/apiClient';
import { documentsAPI } from '../../services/api/documentApi';
import { formatSize, getTimeAgo } from '../../utils/askUtils';

const CampusMap = lazy(() => import('../CampusMap'));
const CampusHub = lazy(() => import('../CampusHub'));
const AskFinderPage = lazy(() => import('../AskFinderPage'));
const InterviewExperiencesPage = lazy(() => import('../interviews/InterviewPage'));
const SGPACalculatorFeaturePage = lazy(() => import('../../features/academic-calculators/sgpa/pages/SGPACalculatorPage'));
const CGPACalculatorFeaturePage = lazy(() => import('../../features/academic-calculators/cgpa/pages/CGPACalculatorPage'));
const GuidesPage = lazy(() => import('../GuidesPage'));
const FacultyDirectoryPage = lazy(() => import('../faculty/FacultyDirectoryPage'));
const LostFoundPage = lazy(() => import('../../features/lost-found/pages/LostFoundPage'));
const MarketplacePage = lazy(() => import('../../features/marketplace/pages/MarketplacePage'));

/* ═══════════════════════════════════════════════════════════════════
   NESTED FEATURE MODAL WRAPPER
═══════════════════════════════════════════════════════════════════ */
const NestedFeatureModal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div style={{ backgroundColor: '#0D1117', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#161B22' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#F1F5F9', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Suspense fallback={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: 14 }}>
                            Loading section…
                        </div>
                    }>
                        {children}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};



/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE SECTION COMPONENT (/home)
═══════════════════════════════════════════════════════════════════ */
const UserHomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark: themeDark } = useTheme();
    const context = useOutletContext() || {};
    const { isDark: contextDark, activeMobileTab = 'home' } = context;

    // Reactively observe HTML dark mode and data-theme
    const [htmlDark, setHtmlDark] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
        }
        return true;
    });

    useEffect(() => {
        const updateTheme = () => {
            if (typeof document !== 'undefined') {
                const isDarkActive = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
                setHtmlDark(isDarkActive);
            }
        };
        updateTheme();
        window.addEventListener('uiThemeChange', updateTheme);
        const observer = new MutationObserver(updateTheme);
        if (typeof document !== 'undefined') {
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        }
        return () => {
            window.removeEventListener('uiThemeChange', updateTheme);
            observer.disconnect();
        };
    }, []);

    // isDark is derived dynamically from html attributes, context or theme hook
    const isDark = contextDark !== undefined ? (contextDark && htmlDark) : (themeDark !== undefined ? (themeDark && htmlDark) : htmlDark);
    const isLight = !isDark;
    const { user } = useContext(AuthContext);

    // Responsive State
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const isDesktop = windowWidth >= 1024;

    // Platform Materials Statistics
    const [stats, setStats] = useState({
        total: 360,
        notes: 216,
        pyqs: 107,
        others: 37
    });

    // Documents & Loading State
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('All Years');
    const [selectedSem, setSelectedSem] = useState('All Semesters');
    const [selectedType, setSelectedType] = useState('all'); // 'all' | 'notes' | 'pyqs' | 'others'
    const [activeSubject, setActiveSubject] = useState(null); // When a subject card is chosen

    // Preview Modal State
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    const searchInputRef = useRef(null);

    // Keyboard shortcut '/' to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch dynamic materials stats overview
    useEffect(() => {
        let mounted = true;
        const fetchOverview = async () => {
            try {
                const res = await documentsAPI.getMaterialsOverview();
                if (!mounted) return;
                const notes = Number(res.data?.notes || 216);
                const pyqs = Number(res.data?.pyqs || 107);
                const others = Number(res.data?.others || 37);
                setStats({
                    total: notes + pyqs + others,
                    notes,
                    pyqs,
                    others
                });
            } catch (err) {
                console.warn('Using baseline materials overview data', err);
            }
        };
        fetchOverview();
        return () => { mounted = false; };
    }, []);

    // Fetch documents on mount for zero-latency client search & browsing
    useEffect(() => {
        let mounted = true;
        const fetchDocs = async () => {
            setLoadingDocs(true);
            try {
                const res = await apiClient.get('/documents/search');
                if (!mounted) return;
                const docs = res.data?.documents || res.data || [];
                setDocuments(docs);
            } catch (err) {
                console.error('Failed to load documents', err);
            } finally {
                if (mounted) setLoadingDocs(false);
            }
        };
        fetchDocs();
        return () => { mounted = false; };
    }, []);

    // Available Semesters dynamically mapping to Year selection
    const availableSemesters = useMemo(() => {
        if (selectedYear === 'Year 1') return ['1st Sem', '2nd Sem'];
        if (selectedYear === 'Year 2') return ['3rd Sem', '4th Sem'];
        if (selectedYear === 'Year 3') return ['5th Sem', '6th Sem'];
        if (selectedYear === 'Year 4') return ['7th Sem', '8th Sem'];
        return ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];
    }, [selectedYear]);

    // Group documents into academic subjects for the current Year/Semester/Type scope
    const subjectCards = useMemo(() => {
        const map = new Map();

        documents.forEach((doc) => {
            const rawName = (doc.subjectName || '').trim();
            if (!rawName || rawName.toLowerCase() === 'general' || rawName === '—') return;

            // Year match
            if (selectedYear !== 'All Years') {
                const yNum = selectedYear.replace(/[^0-9]/g, '');
                const docYStr = String(doc.yearLevel || doc.semester || '').toLowerCase();
                const docYNum = docYStr.replace(/[^0-9]/g, '');
                const matchesYear = docYNum === yNum || docYStr.includes(`${yNum}st`) || docYStr.includes(`${yNum}nd`) || docYStr.includes(`${yNum}rd`) || docYStr.includes(`${yNum}th`);
                if (!matchesYear) return;
            }

            // Semester match
            if (selectedSem !== 'All Semesters') {
                const semNum = selectedSem.replace(/[^0-9]/g, '');
                const docSemStr = String(doc.semester || '').replace(/[^0-9]/g, '');
                if (docSemStr && semNum && docSemStr !== semNum) return;
            }

            const code = (doc.subjectCode && doc.subjectCode !== '—') ? doc.subjectCode.trim().toUpperCase() : '';
            const key = code ? `${rawName.toLowerCase()}::${code}` : rawName.toLowerCase();

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: rawName,
                    code: code || 'CORE',
                    semester: doc.semester || doc.yearLevel || 'Sem',
                    yearLevel: doc.yearLevel || 'Undergrad',
                    notesCount: 0,
                    pyqsCount: 0,
                    othersCount: 0,
                    totalCount: 0
                });
            }

            const item = map.get(key);
            item.totalCount += 1;
            if (doc.documentType === 'notes') item.notesCount += 1;
            else if (doc.documentType === 'see' || doc.documentType === 'internals') item.pyqsCount += 1;
            else item.othersCount += 1;
        });

        return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount);
    }, [documents, selectedYear, selectedSem]);

    // Filtered Document items (for search or when browsing a selected subject)
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            // Type filter
            if (selectedType === 'notes' && doc.documentType !== 'notes') return false;
            if (selectedType === 'pyqs' && doc.documentType !== 'see' && doc.documentType !== 'internals') return false;
            if (selectedType === 'others' && (doc.documentType === 'notes' || doc.documentType === 'see' || doc.documentType === 'internals')) return false;

            // Active Subject filter (if user selected a specific subject card)
            if (activeSubject) {
                const nameMatch = (doc.subjectName || '').trim().toLowerCase() === activeSubject.name.toLowerCase();
                const codeMatch = activeSubject.code && activeSubject.code !== 'CORE' && (doc.subjectCode || '').trim().toUpperCase() === activeSubject.code;
                if (!nameMatch && !codeMatch) return false;
            } else {
                // Year filter
                if (selectedYear !== 'All Years') {
                    const yNum = selectedYear.replace(/[^0-9]/g, '');
                    const docYStr = String(doc.yearLevel || doc.semester || '').toLowerCase();
                    const docYNum = docYStr.replace(/[^0-9]/g, '');
                    const matchesYear = docYNum === yNum || docYStr.includes(`${yNum}st`) || docYStr.includes(`${yNum}nd`) || docYStr.includes(`${yNum}rd`) || docYStr.includes(`${yNum}th`);
                    if (!matchesYear) return false;
                }

                // Semester filter
                if (selectedSem !== 'All Semesters') {
                    const semNum = selectedSem.replace(/[^0-9]/g, '');
                    const docSemStr = String(doc.semester || '').replace(/[^0-9]/g, '');
                    if (docSemStr && semNum && docSemStr !== semNum) return false;
                }
            }

            // Text search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const combined = [
                    doc.title || '',
                    doc.fileName || '',
                    doc.originalName || '',
                    doc.subjectName || '',
                    doc.subjectCode || '',
                    doc.tags || '',
                    doc.documentType || ''
                ].join(' ').toLowerCase();

                const terms = q.split(/\s+/).filter(Boolean);
                return terms.every(t => combined.includes(t));
            }

            return true;
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [documents, selectedType, activeSubject, selectedYear, selectedSem, searchQuery]);

    // Handle Document Download
    const handleDownload = async (docId) => {
        try {
            const res = await apiClient.get(`/documents/${docId}/download`);
            const url = res.data?.downloadUrl;
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to generate download link');
        }
    };

    // Handle Document Preview
    const handlePreview = async (doc) => {
        setPreviewDoc(doc);
        setLoadingPreview(true);
        try {
            const res = await apiClient.get(`/documents/${doc._id}/preview-url`);
            setPreviewUrl(res.data?.previewUrl || '');
        } catch (err) {
            console.error('Preview failed', err);
            alert('Unable to load document preview');
            setPreviewDoc(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    // Deep subroute handling (keeps subroutes like /home/marketplace working if routed)
    const isInterviews = location.pathname.includes('/interview-experiences');
    const isFaculty = location.pathname.includes('/faculty-ratings') || location.pathname.includes('/faculty-directory');
    const isCampusExplorer = location.pathname.includes('/campus-explorer');
    const isLostFound = location.pathname.includes('/lost-and-found');
    const isMarketplace = location.pathname.includes('/marketplace');
    const isSGPA = location.pathname.includes('/sgpa-calculator');
    const isCGPA = location.pathname.includes('/cgpa-calculator');
    const isBlogs = location.pathname.includes('/blogs');

    if (isInterviews) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading Interview Experiences...</div>}>
                    <InterviewExperiencesPage />
                </Suspense>
            </div>
        );
    }
    if (isFaculty) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading Faculty Directory...</div>}>
                    <FacultyDirectoryPage />
                </Suspense>
            </div>
        );
    }
    if (isLostFound) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading Lost & Found...</div>}>
                    <LostFoundPage />
                </Suspense>
            </div>
        );
    }
    if (isMarketplace) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading Marketplace...</div>}>
                    <MarketplacePage />
                </Suspense>
            </div>
        );
    }
    if (isSGPA) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading SGPA Calculator...</div>}>
                    <SGPACalculatorFeaturePage />
                </Suspense>
            </div>
        );
    }
    if (isCGPA) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6">
                <Suspense fallback={<div className="p-8 text-slate-400">Loading CGPA Calculator...</div>}>
                    <CGPACalculatorFeaturePage />
                </Suspense>
            </div>
        );
    }

    return (
        <div id="dashboard-main-sections" className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-6">

            {/* OVERVIEW TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'overview' && (
                <div id="dashboard-overview-section" className="flex flex-col gap-4">
                    <div className="mb-2">
                        <h2 className={`text-xl font-bold font-['Outfit'] m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>Student Overview</h2>
                        <p className={`text-xs m-0 mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your profile info & study material statistics</p>
                    </div>
                    <StudentDetailsWidget user={user} />
                    <MaterialsOverviewWidget user={user} />
                </div>
            )}

            {/* PLANNER TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'planner' && (
                <div id="dashboard-planner-section" className="flex flex-col gap-4">
                    <div className="mb-2">
                        <h2 className={`text-xl font-bold font-['Outfit'] m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>Daily Planner & Streaks</h2>
                        <p className={`text-xs m-0 mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Track your study habits, tasks and academic streak</p>
                    </div>
                    <AcademicStreakWidget user={user} />
                    <DailyPlannerWidget />
                </div>
            )}

            {/* MAIN FREE MATERIALS CONTENT (DESKTOP OR MOBILE HOME TAB) */}
            {(isDesktop || activeMobileTab === 'home') && (
                <div className="flex flex-col w-full gap-6">

                    {/* ═══════════════════════════════════════════════════════
                        1. HEADER: Materials (NO "FREE" BADGE)
                    ═══════════════════════════════════════════════════════ */}
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-2xl md:text-3xl font-bold tracking-tight font-['Outfit'] m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Materials
                        </h1>
                        <p className={`text-xs md:text-sm font-medium m-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Notes, previous-year questions and academic resources.
                        </p>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        2. PROMINENT MODERN SAAS SEARCH BAR (FULL WIDTH)
                    ═══════════════════════════════════════════════════════ */}
                    <div className="relative w-full">
                        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (activeSubject) setActiveSubject(null);
                            }}
                            placeholder="Search notes, subjects, PYQs..."
                            className={`w-full pl-10 pr-20 py-2.5 rounded-xl text-sm transition-all font-sans outline-none ${
                                isLight
                                    ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm'
                                    : 'bg-[#121622] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20'
                            }`}
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer ${
                                    isLight ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                                }`}
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <kbd className={`hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-mono rounded pointer-events-none ${
                                isLight
                                    ? 'text-slate-500 bg-slate-100 border border-slate-200'
                                    : 'text-slate-400 bg-white/5 border border-white/10'
                            }`}>
                                /
                            </kbd>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        3. CLEAN TWO-LEVEL FILTER AREA
                    ═══════════════════════════════════════════════════════ */}
                    <div className="flex flex-col gap-3">
                        {/* ROW 1: CONTENT TYPE PILLS */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <button
                                onClick={() => setSelectedType('all')}
                                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedType === 'all'
                                        ? isLight
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200'
                                            : 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm shadow-purple-950/40'
                                        : isLight
                                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                <span className={`font-bold ${selectedType === 'all' ? (isLight ? 'text-white' : 'text-purple-200') : (isLight ? 'text-slate-900' : 'text-slate-200')}`}>{stats.total}</span>
                                <span className={selectedType === 'all' ? (isLight ? 'text-white' : 'text-purple-200') : (isLight ? 'text-slate-700' : 'text-slate-300')}>All Materials</span>
                            </button>
                            <button
                                onClick={() => setSelectedType(selectedType === 'notes' ? 'all' : 'notes')}
                                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedType === 'notes'
                                        ? isLight
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200'
                                            : 'bg-emerald-500/30 border-emerald-500 text-emerald-200'
                                        : isLight
                                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${selectedType === 'notes' ? (isLight ? 'bg-white' : 'bg-emerald-300') : 'bg-emerald-500'}`} />
                                <span className={`font-bold ${selectedType === 'notes' ? (isLight ? 'text-white' : 'text-emerald-200') : (isLight ? 'text-slate-900' : 'text-slate-200')}`}>{stats.notes}</span>
                                <span className={selectedType === 'notes' ? (isLight ? 'text-white' : 'text-emerald-200') : (isLight ? 'text-slate-700' : 'text-slate-300')}>Notes</span>
                            </button>
                            <button
                                onClick={() => setSelectedType(selectedType === 'pyqs' ? 'all' : 'pyqs')}
                                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedType === 'pyqs'
                                        ? isLight
                                            ? 'bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-200'
                                            : 'bg-amber-500/30 border-amber-500 text-amber-200'
                                        : isLight
                                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${selectedType === 'pyqs' ? (isLight ? 'bg-white' : 'bg-amber-300') : 'bg-amber-500'}`} />
                                <span className={`font-bold ${selectedType === 'pyqs' ? (isLight ? 'text-white' : 'text-amber-200') : (isLight ? 'text-slate-900' : 'text-slate-200')}`}>{stats.pyqs}</span>
                                <span className={selectedType === 'pyqs' ? (isLight ? 'text-white' : 'text-amber-200') : (isLight ? 'text-slate-700' : 'text-slate-300')}>PYQs</span>
                            </button>
                            <button
                                onClick={() => setSelectedType(selectedType === 'others' ? 'all' : 'others')}
                                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedType === 'others'
                                        ? isLight
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200'
                                            : 'bg-purple-500/30 border-purple-500 text-purple-200'
                                        : isLight
                                            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${selectedType === 'others' ? (isLight ? 'bg-white' : 'bg-purple-300') : 'bg-purple-500'}`} />
                                <span className={`font-bold ${selectedType === 'others' ? (isLight ? 'text-white' : 'text-purple-200') : (isLight ? 'text-slate-900' : 'text-slate-200')}`}>{stats.others}</span>
                                <span className={selectedType === 'others' ? (isLight ? 'text-white' : 'text-purple-200') : (isLight ? 'text-slate-700' : 'text-slate-300')}>Others</span>
                            </button>
                        </div>

                        {/* ROW 2: SCOPE / HIERARCHY DROPDOWNS */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Year Dropdown */}
                            <div className="relative inline-flex items-center">
                                <select
                                    id="filter-year-select"
                                    aria-label="Filter by Year"
                                    value={selectedYear}
                                    onChange={(e) => {
                                        const newYear = e.target.value;
                                        setSelectedYear(newYear);
                                        setSelectedSem('All Semesters');
                                        setActiveSubject(null);
                                    }}
                                    className={`text-xs font-semibold pl-3 pr-8 py-2 rounded-xl border appearance-none cursor-pointer outline-none transition-all ${
                                        isLight 
                                            ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-200 hover:border-white/20 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20'
                                    }`}
                                >
                                    <option value="All Years" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>All Years</option>
                                    <option value="Year 1" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>Year 1</option>
                                    <option value="Year 2" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>Year 2</option>
                                    <option value="Year 3" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>Year 3</option>
                                    <option value="Year 4" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>Year 4</option>
                                </select>
                                <ChevronDown size={14} className={`absolute right-2.5 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>

                            {/* Semester Dropdown */}
                            <div className="relative inline-flex items-center">
                                <select
                                    id="filter-sem-select"
                                    aria-label="Filter by Semester"
                                    value={selectedSem}
                                    onChange={(e) => {
                                        setSelectedSem(e.target.value);
                                        setActiveSubject(null);
                                    }}
                                    className={`text-xs font-semibold pl-3 pr-8 py-2 rounded-xl border appearance-none cursor-pointer outline-none transition-all ${
                                        isLight 
                                            ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm'
                                            : 'bg-[#121622] border-white/10 text-slate-200 hover:border-white/20 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20'
                                    }`}
                                >
                                    <option value="All Semesters" className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>All Semesters</option>
                                    {availableSemesters.map((sem) => (
                                        <option key={sem} value={sem} className={isLight ? 'bg-white text-slate-900' : 'bg-[#121622] text-slate-100'}>{sem}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className={`absolute right-2.5 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>

                            {/* Reset filters button if any filter applied */}
                            {(selectedYear !== 'All Years' || selectedSem !== 'All Semesters' || selectedType !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSelectedYear('All Years');
                                        setSelectedSem('All Semesters');
                                        setSelectedType('all');
                                        setActiveSubject(null);
                                    }}
                                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                                        isLight ? 'text-purple-600 hover:bg-purple-50' : 'text-purple-400 hover:bg-purple-500/10'
                                    }`}
                                >
                                    <X size={12} />
                                    <span>Reset filters</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        4. CARDS GRID (RESPONSIVE 3-COLUMN DESKTOP GRID)
                           Shown when not searching and no subject card is active
                    ═══════════════════════════════════════════════════════ */}
                    {!searchQuery.trim() && !activeSubject && (
                        <div className="flex flex-col gap-3">
                            {/* Subject Count Label */}
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {subjectCards.length} Subjects available
                                </span>
                            </div>

                            {loadingDocs ? (
                                <div className={`py-12 flex items-center justify-center text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Loading academic resources...
                                </div>
                            ) : subjectCards.length === 0 ? (
                                <div className={`p-8 text-center rounded-2xl border text-xs ${
                                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#121622] border-white/10 text-slate-400'
                                }`}>
                                    No subjects found for this selection. Try selecting "All Years".
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                    {subjectCards.map((subj) => (
                                        <div
                                            key={subj.key}
                                            onClick={() => setActiveSubject(subj)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setActiveSubject(subj);
                                                }
                                            }}
                                            className={`group relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 cursor-pointer select-none min-h-[140px] ${
                                                isLight
                                                    ? 'bg-white border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md hover:-translate-y-0.5 text-slate-900'
                                                    : 'bg-[#121622] border-white/10 hover:border-purple-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-950/30 text-white'
                                            }`}
                                        >
                                            {/* Top Tag & Code */}
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                                                        isLight 
                                                            ? 'bg-slate-100 border-slate-200 text-slate-700' 
                                                            : 'bg-white/5 border-white/10 text-slate-300'
                                                    }`}>
                                                        {subj.code}
                                                    </span>
                                                    <span className={`text-[11px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {subj.semester}
                                                    </span>
                                                </div>

                                                {/* Subject Name */}
                                                <h3 className={`text-sm font-bold line-clamp-2 leading-snug m-0 transition-colors ${
                                                    isLight 
                                                        ? 'text-slate-900 group-hover:text-purple-600' 
                                                        : 'text-white group-hover:text-purple-300'
                                                }`}>
                                                    {subj.name}
                                                </h3>
                                            </div>

                                            {/* Bottom Resource Counts & Action */}
                                            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                                                isLight ? 'border-slate-100' : 'border-white/[0.06]'
                                            }`}>
                                                <div className={`flex items-center gap-1.5 text-[11px] font-mono ${
                                                    isLight ? 'text-slate-500' : 'text-slate-400'
                                                }`}>
                                                    {subj.notesCount > 0 && (
                                                        <span className={`font-semibold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                                                            {subj.notesCount} Notes
                                                        </span>
                                                    )}
                                                    {subj.notesCount > 0 && subj.pyqsCount > 0 && <span>·</span>}
                                                    {subj.pyqsCount > 0 && (
                                                        <span className={`font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                                                            {subj.pyqsCount} PYQs
                                                        </span>
                                                    )}
                                                    {subj.notesCount === 0 && subj.pyqsCount === 0 && (
                                                        <span>{subj.totalCount} Files</span>
                                                    )}
                                                </div>
                                                <ChevronRight size={15} className={`group-hover:translate-x-1 transition-transform ${
                                                    isLight ? 'text-purple-600' : 'text-purple-400'
                                                }`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        5. CSES SHEET RESOURCE LISTING
                           Shown when searching OR when a subject card is chosen
                    ═══════════════════════════════════════════════════════ */}
                    {(searchQuery.trim() || activeSubject) && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {activeSubject ? activeSubject.name : `Results for "${searchQuery}"`}
                                    </span>
                                    {activeSubject && activeSubject.code && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                            isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                        }`}>
                                            {activeSubject.code}
                                        </span>
                                    )}
                                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>({filteredDocuments.length} resources)</span>
                                </div>
                                {activeSubject && (
                                    <button
                                        onClick={() => setActiveSubject(null)}
                                        className={`font-semibold cursor-pointer flex items-center gap-1 ${
                                            isLight ? 'text-purple-600 hover:text-purple-700' : 'text-purple-400 hover:text-purple-300'
                                        }`}
                                    >
                                        <ArrowLeft size={13} />
                                        <span>Back to all subjects</span>
                                    </button>
                                )}
                            </div>

                            {loadingDocs ? (
                                <div className={`py-12 flex items-center justify-center text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Loading resources...
                                </div>
                            ) : filteredDocuments.length === 0 ? (
                                <div className={`p-8 text-center rounded-2xl border text-xs ${
                                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#121622] border-white/10 text-slate-400'
                                }`}>
                                    No resources found matching your search.
                                </div>
                            ) : (
                                <div className={`rounded-2xl border overflow-hidden ${
                                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121622] border-white/10'
                                }`}>
                                    {/* CSES Sheet Table Header */}
                                    <div className={`hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b text-[11px] font-mono font-bold uppercase tracking-wider ${
                                        isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/10 text-slate-400'
                                    }`}>
                                        <span className="col-span-1 text-center">#</span>
                                        <span className="col-span-4">Material Title</span>
                                        <span className="col-span-2">Subject</span>
                                        <span className="col-span-1 text-center">Sem</span>
                                        <span className="col-span-1 text-center">Type</span>
                                        <span className="col-span-3 text-right">Actions</span>
                                    </div>

                                    {/* CSES Sheet Table Rows */}
                                    <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/[0.06]'}`}>
                                        {filteredDocuments.map((doc, idx) => {
                                            const typeLabel = doc.documentType === 'notes' ? 'Notes' 
                                                : doc.documentType === 'see' ? 'PYQ' 
                                                : doc.documentType === 'internals' ? 'Internal' 
                                                : 'Other';
                                            
                                            const typeColor = doc.documentType === 'notes' 
                                                ? (isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30')
                                                : (doc.documentType === 'see' || doc.documentType === 'internals')
                                                ? (isLight ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-amber-400 bg-amber-500/10 border-amber-500/30')
                                                : (isLight ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-purple-400 bg-purple-500/10 border-purple-500/30');

                                            return (
                                                <div
                                                    key={doc._id || idx}
                                                    className={`p-3.5 md:px-4 md:py-3 flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 transition-colors ${
                                                        isLight ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.02]'
                                                    }`}
                                                >
                                                    {/* Row # */}
                                                    <span className={`hidden md:block col-span-1 text-center font-mono text-[11px] ${
                                                        isLight ? 'text-slate-400' : 'text-slate-500'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>

                                                    {/* Title & Metadata */}
                                                    <div className="col-span-4 min-w-0">
                                                        <span
                                                            onClick={() => handlePreview(doc)}
                                                            className={`text-xs md:text-sm font-semibold cursor-pointer transition-colors truncate block ${
                                                                isLight ? 'text-slate-900 hover:text-purple-600' : 'text-slate-200 hover:text-purple-300'
                                                            }`}
                                                            title={doc.title || doc.originalName || doc.fileName}
                                                        >
                                                            {doc.title || doc.originalName || doc.fileName}
                                                        </span>
                                                        <div className={`flex items-center gap-2 text-[11px] mt-0.5 font-sans ${
                                                            isLight ? 'text-slate-500' : 'text-slate-500'
                                                        }`}>
                                                            <span>{formatSize(doc.fileSize)}</span>
                                                            <span>·</span>
                                                            <span>{getTimeAgo(doc.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Subject info */}
                                                    <div className="col-span-2 min-w-0 hidden md:block">
                                                        <p className={`text-[11px] font-mono truncate m-0 ${
                                                            isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'
                                                        }`}>
                                                            {doc.subjectCode || '—'}
                                                        </p>
                                                        <p className={`text-[10px] truncate m-0 ${
                                                            isLight ? 'text-slate-500' : 'text-slate-500'
                                                        }`} title={doc.subjectName}>
                                                            {doc.subjectName || 'General'}
                                                        </p>
                                                    </div>

                                                    {/* Semester */}
                                                    <span className={`col-span-1 text-center text-[11px] font-mono hidden md:block ${
                                                        isLight ? 'text-slate-600' : 'text-slate-400'
                                                    }`}>
                                                        {doc.semester || doc.yearLevel || '—'}
                                                    </span>

                                                    {/* Type Badge */}
                                                    <div className="col-span-1 text-center hidden md:block">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeColor}`}>
                                                            {typeLabel}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-3 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
                                                        <span className={`md:hidden px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeColor}`}>
                                                            {typeLabel}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 ml-auto">
                                                            <button
                                                                onClick={() => handlePreview(doc)}
                                                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                                                                    isLight
                                                                        ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                                                                        : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                                                                }`}
                                                            >
                                                                <Eye size={12} />
                                                                <span>Preview</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(doc._id)}
                                                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                                                                    isLight
                                                                        ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
                                                                        : 'text-purple-200 hover:text-white bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40'
                                                                }`}
                                                            >
                                                                <Download size={12} />
                                                                <span>Download</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                DOCUMENT PREVIEW MODAL
            ═══════════════════════════════════════════════════════════ */}
            {previewDoc && (
                <div 
                    className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex flex-col p-4 md:p-6"
                    role="dialog"
                    aria-label="Document Preview"
                >
                    <div className={`relative w-full h-full max-w-5xl mx-auto flex flex-col rounded-2xl border overflow-hidden shadow-2xl ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#0D1117] border-purple-500/30'
                    }`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161B22] border-white/10'
                        }`}>
                            <div className="flex items-center gap-2 min-w-0 pr-4">
                                <FileText size={18} className={isLight ? 'text-purple-600 shrink-0' : 'text-purple-400 shrink-0'} />
                                <span className={`text-sm font-bold truncate font-['Outfit'] ${
                                    isLight ? 'text-slate-900' : 'text-white'
                                }`}>
                                    {previewDoc.title || previewDoc.originalName || previewDoc.fileName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {previewUrl && (
                                    <button
                                        onClick={() => window.open(previewUrl, '_blank')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                            isLight
                                                ? 'text-slate-700 bg-white hover:bg-slate-100 border-slate-300'
                                                : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                                        }`}
                                    >
                                        <ExternalLink size={13} />
                                        <span>Pop Out</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setPreviewDoc(null);
                                        setPreviewUrl('');
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isLight
                                            ? 'text-slate-500 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-200'
                                            : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
                                    }`}
                                    aria-label="Close preview"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 flex items-center justify-center overflow-hidden ${
                            isLight ? 'bg-slate-100' : 'bg-black/30'
                        }`}>
                            {loadingPreview ? (
                                <div className={`text-xs font-mono animate-pulse ${
                                    isLight ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                    Loading preview...
                                </div>
                            ) : previewUrl ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=1`}
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Preview not available. Please use Download.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* NESTED SUBROUTE MODALS (PRESERVED FOR ROUTING COMPATIBILITY) */}
            <NestedFeatureModal isOpen={isCampusExplorer} title="Campus Explorer & Interactive Map" onClose={() => navigate('/home')}>
                <CampusMap />
            </NestedFeatureModal>
            <NestedFeatureModal isOpen={isLostFound} title="Campus Lost & Found Noticeboard" onClose={() => navigate('/home')}>
                <CampusHub initialTab="lost" />
            </NestedFeatureModal>
            <NestedFeatureModal isOpen={isMarketplace} title="Campus Student Marketplace" onClose={() => navigate('/home')}>
                <CampusHub initialTab="mkt" />
            </NestedFeatureModal>
            <NestedFeatureModal isOpen={isBlogs} title="Senior Blogs & Placement Guides" onClose={() => navigate('/home')}>
                <GuidesPage />
            </NestedFeatureModal>
        </div>
    );
};

export default UserHomePage;
