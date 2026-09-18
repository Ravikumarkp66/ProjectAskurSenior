import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, 
    FileText, 
    ClipboardList, 
    MessagesSquare, 
    ChevronDown, 
    Folder,
    Layers, 
    Clock, 
    Calendar,
    UserCheck,
    AlertCircle, 
    Inbox,
    PanelLeftOpen,
    PanelLeftClose
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiV2 } from '../../services/authService';
import { MY_SUBJECTS_TABS } from '../../data/mySubjectsData';
import { ASLogo } from '../../components/Logo';
import MySubjectsSidebar from './components/MySubjectsSidebar';
import TopicEditorialView from './components/TopicEditorialView';
import { getAcademicContentTree } from '../../services/academicContentApi';
import { mapApiTreeToNavigation, mergeSubjectWithContentTree } from '../../services/academicContentMapper';

// In-memory cache for loaded subject content trees
export const CONTENT_TREE_CACHE = new Map();

// Warm tree cache from sessionStorage if present for instant 0ms navigation
try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
        // Clean up legacy stale cache keys
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith('ask_tree_cache_') && !k.startsWith('ask_tree_cache_v3_')) {
                try { sessionStorage.removeItem(k); } catch (e) {}
            }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith('ask_tree_cache_v3_')) {
                const sKey = k.replace('ask_tree_cache_v3_', '');
                const raw = sessionStorage.getItem(k);
                if (raw) {
                    try {
                        CONTENT_TREE_CACHE.set(sKey, JSON.parse(raw));
                    } catch (e) {}
                }
            }
        }
    }
} catch (e) {}

/* ═══════════════════════════════════════════════════════════════════
   TAB CONFIGURATIONS (Editorial, PYQs, Discussion)
   • Synced with Lab Programs IDE palette:
     - Editorial:  #34D399 (dark) / #059669 (light) [BookOpen]
     - PYQs:       #FBBF24 (dark) / #D97706 (light) [ClipboardList]
     - Discussion: #C084FC (dark) / #9333EA (light) [MessagesSquare]
═══════════════════════════════════════════════════════════════════ */
const TAB_CONFIGS = {
    editorial: {
        id: 'editorial',
        label: 'Editorial',
        color: '#34D399',
        bg: 'rgba(52, 211, 153, 0.12)',
        border: 'rgba(52, 211, 153, 0.35)',
        icon: BookOpen,
        title: 'Module Editorial & Explanations',
        description: 'In-depth conceptual breakdowns, verified formulas, and handwritten solution explanations curated by top seniors.'
    },
    pyqs: {
        id: 'pyqs',
        label: 'PYQs',
        color: '#FBBF24',
        bg: 'rgba(251, 191, 36, 0.12)',
        border: 'rgba(251, 191, 36, 0.35)',
        icon: ClipboardList,
        title: 'Previous Year Exam Questions',
        description: 'Module-wise examination question papers with year tagging, mark distributions, and model answers.'
    },
    discussion: {
        id: 'discussion',
        label: 'Discussion',
        color: '#C084FC',
        bg: 'rgba(192, 132, 252, 0.12)',
        border: 'rgba(192, 132, 252, 0.35)',
        icon: MessagesSquare,
        title: 'Module Doubts & Discussions',
        description: 'Ask questions, discuss challenging numericals with peers, and get verified answers from senior mentors.'
    }
};

const getTabMeta = (tabId, isDark) => {
    const base = TAB_CONFIGS[tabId] || TAB_CONFIGS.editorial;
    if (isDark) {
        if (tabId === 'editorial') {
            return {
                ...base,
                color: '#34D399',
                bg: 'rgba(52, 211, 153, 0.12)',
                border: 'rgba(52, 211, 153, 0.35)',
                shadow: '0 0 16px rgba(52, 211, 153, 0.22)'
            };
        }
        if (tabId === 'pyqs') {
            return {
                ...base,
                color: '#FBBF24',
                bg: 'rgba(251, 191, 36, 0.12)',
                border: 'rgba(251, 191, 36, 0.35)',
                shadow: '0 0 16px rgba(251, 191, 36, 0.22)'
            };
        }
        if (tabId === 'discussion') {
            return {
                ...base,
                color: '#C084FC',
                bg: 'rgba(192, 132, 252, 0.12)',
                border: 'rgba(192, 132, 252, 0.35)',
                shadow: '0 0 16px rgba(192, 132, 252, 0.22)'
            };
        }
        return base;
    }
    
    if (tabId === 'editorial') {
        return {
            ...base,
            color: '#059669',
            bg: '#ECFDF5',
            border: '#A7F3D0',
            shadow: '0 2px 10px rgba(5, 150, 105, 0.15)'
        };
    }
    if (tabId === 'pyqs') {
        return {
            ...base,
            color: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
            shadow: '0 2px 10px rgba(217, 119, 6, 0.15)'
        };
    }
    if (tabId === 'discussion') {
        return {
            ...base,
            color: '#9333EA',
            bg: '#FAF5FF',
            border: '#E9D5FF',
            shadow: '0 2px 10px rgba(147, 51, 234, 0.15)'
        };
    }
    return base;
};

/* ═══════════════════════════════════════════════════════════════════
   MY SUBJECTS WORKSPACE PAGE
   • Derived authoritatively from the student's SectionTimetable
   • Zero manual enrollment / registration
   • Automatic synchronization with admin section timetable changes
═══════════════════════════════════════════════════════════════════ */
const CACHE_KEY = 'my_subjects_cache_v2';

const getInitialCachedData = () => {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed?.subjects) && parsed.subjects.length > 0) {
                return parsed;
            }
        }
    } catch (e) {}
    return null;
};


// NOTE: BASICS_DEFAULT_TOPICS and PLC5_MODULE1_TOPICS navigation constants were removed in Step 11.
// MongoDB (CourseModule → Topic) is now the authoritative navigation source via the Academic Content API.
// Editorial content for TopicEditorialView fallback is preserved in data/editorial/plc5/ (separate concern).

const MySubjectsPage = () => {
    const { subjectSlug, moduleSlug, section, topicSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { isDark } = useTheme();

    const initialData = useMemo(() => getInitialCachedData(), []);

    // Timetable-derived subjects state (initializes immediately from cache for 0ms load)
    const [subjects, setSubjects] = useState(() => initialData?.subjects || []);
    const [sectionName, setSectionName] = useState(() => initialData?.sectionName || '');
    const [semesterNumber, setSemesterNumber] = useState(() => initialData?.semester || 1);
    const [contentTrees, setContentTrees] = useState({});
    const [loading, setLoading] = useState(() => !(initialData?.subjects?.length > 0));
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const isFetchingRef = useRef(false);
    const mainScrollRef = useRef(null);

    // Desktop sidebar collapse state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            return sessionStorage.getItem('my_subjects_sidebar_collapsed') === 'true';
        } catch (e) {
            return false;
        }
    });

    const handleToggleCollapseSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            try {
                sessionStorage.setItem('my_subjects_sidebar_collapsed', String(next));
            } catch (e) {}
            return next;
        });
    };

    // Theme Tokens (Light SaaS / Dark CSE Sheet)
    const t = useMemo(() => {
        if (!isDark) {
            return {
                pageBg: '#F7F8FC',
                textColor: '#171225',
                // Mobile top bar
                mobileTopBg: '#FFFFFF',
                mobileTopBorder: '#EAE6F5',
                mobileLogoText: '#171225',
                mobileDrawerBtnBg: '#F3EEFF',
                mobileDrawerBtnBorder: '#DDD6FE',
                mobileDrawerBtnText: '#6D28D9',
                mobileDrawerIcon: '#059669',
                mobileDrawerChevron: '#7C3AED',
                // Mobile drawer modal
                mobileDrawerBg: '#FFFFFF',
                mobileDrawerCloseBg: '#F1F5F9',
                mobileDrawerCloseText: '#475569',
                // Header
                headingText: '#171225',
                codeBadgeBg: '#F3EEFF',
                codeBadgeBorder: '#DDD6FE',
                codeBadgeText: '#6D28D9',
                specLabel: '#64748B',
                specValue: '#171225',
                // Inactive tabs
                tabInactiveBg: '#FFFFFF',
                tabInactiveBorder: '#E2E8F0',
                tabInactiveText: '#475569',
                tabInactiveShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                // Empty / coming soon state
                emptyCardBg: '#FFFFFF',
                emptyCardBorder: '1px solid #EAE6F5',
                emptyCardShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.025)',
                emptyTitle: '#171225',
                emptyDesc: '#5F5A70',
                badgeBg: '#F1F5F9',
                badgeBorder: '#E2E8F0',
                badgeText: '#475569',
                // Active context pill
                contextBg: '#F8FAFC',
                contextBorder: '1px dashed #CBD5E1',
                contextText: '#475569',
                contextHighlight: '#171225',
                contextIcon: '#059669'
            };
        }
        return {
            pageBg: '#161616',
            textColor: '#EDEDED',
            // Mobile top bar
            mobileTopBg: '#161616',
            mobileTopBorder: '#2A2A2A',
            mobileLogoText: '#EDEDED',
            mobileDrawerBtnBg: '#1C1C1C',
            mobileDrawerBtnBorder: '#2A2A2A',
            mobileDrawerBtnText: '#B5B5B5',
            mobileDrawerIcon: '#34D399',
            mobileDrawerChevron: '#8A8A8A',
            // Mobile drawer modal
            mobileDrawerBg: '#161616',
            mobileDrawerCloseBg: 'rgba(255,255,255,0.06)',
            mobileDrawerCloseText: '#EDEDED',
            // Header
            headingText: '#ffffff',
            codeBadgeBg: 'rgba(139, 92, 246, 0.14)',
            codeBadgeBorder: 'rgba(139, 92, 246, 0.3)',
            codeBadgeText: '#c4b5fd',
            specLabel: 'rgba(148, 163, 184, 0.7)',
            specValue: '#f1f5f9',
            // Inactive tabs
            tabInactiveBg: 'rgba(255, 255, 255, 0.02)',
            tabInactiveBorder: 'rgba(255, 255, 255, 0.08)',
            tabInactiveText: 'rgba(148, 163, 184, 0.8)',
            tabInactiveShadow: 'none',
            // Empty / coming soon state
            emptyCardBg: 'transparent',
            emptyCardBorder: 'none',
            emptyCardShadow: 'none',
            emptyTitle: '#f1f5f9',
            emptyDesc: 'rgba(148, 163, 184, 0.75)',
            badgeBg: 'rgba(255, 255, 255, 0.06)',
            badgeBorder: 'rgba(255, 255, 255, 0.12)',
            badgeText: '#94a3b8',
            // Active context pill
            contextBg: 'rgba(139, 92, 246, 0.06)',
            contextBorder: '1px dashed rgba(139, 92, 246, 0.25)',
            contextText: '#c4b5fd',
            contextHighlight: '#c4b5fd',
            contextIcon: '#00f5b8'
        };
    }, [isDark]);

    // Base path prefix (/plus/my-subjects or /my-subjects)
    const basePath = location.pathname.startsWith('/plus/my-subjects') 
        ? '/plus/my-subjects' 
        : '/my-subjects';

    const userSectionKey = typeof user?.section === 'object' ? (user.section?.name || user.section?.section || '') : (user?.section || '');
    const userSemesterKey = typeof user?.academicSemester === 'object' ? (user.academicSemester?.semesterNumber || '') : (user?.semester || '');

    // Fetch authoritative timetable-derived subjects (SWR pattern)
    useEffect(() => {
        let isMounted = true;
        const fetchAllocatedSubjects = async () => {
            try {
                // If we don't have subjects cached in memory, show loading spinner
                if (!subjects || subjects.length === 0) {
                    setLoading(true);
                }

                const res = await apiV2.getMySubjects();
                
                if (res?.data?.success && res.data.data) {
                    const data = res.data.data;
                    const fetchedSubjects = data.subjects || [];
                    if (isMounted) {
                        setSubjects(fetchedSubjects);
                        setSectionName(data.sectionName || '');
                        setSemesterNumber(data.semester || 1);
                    }

                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                            subjects: fetchedSubjects,
                            sectionName: data.sectionName || '',
                            semester: data.semester || 1,
                            timestamp: Date.now()
                        }));
                    } catch (cacheErr) {
                        // ignore storage quota error
                    }
                } else if (isMounted) {
                    // Fallback to getRegisteredSubjects if needed
                    const regRes = await apiV2.getRegisteredSubjects();
                    if (regRes?.data?.data && Array.isArray(regRes.data.data)) {
                        const fallbackSubjects = regRes.data.data.map(item => item.subject || item);
                        if (isMounted) setSubjects(fallbackSubjects);
                    }
                }
            } catch (err) {
                console.warn('[MySubjects] Error fetching allocated subjects:', err);
                if (isMounted && (!subjects || subjects.length === 0)) {
                    // Graceful fallback to avoid blank screen
                    try {
                        const regRes = await apiV2.getRegisteredSubjects();
                        if (regRes?.data?.data && Array.isArray(regRes.data.data)) {
                            const fallbackSubjects = regRes.data.data.map(item => item.subject || item);
                            if (isMounted) setSubjects(fallbackSubjects);
                        }
                    } catch (fallbackErr) {
                        console.error('[MySubjects] Fallback fetch failed:', fallbackErr);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllocatedSubjects();
        return () => { isMounted = false; };
    }, [userSectionKey, userSemesterKey]);

    // ── Pre-calculate active subject key from URL or first subject ───────────
    const currentSubjectIdentifier = useMemo(() => {
        const raw = subjectSlug || subjects[0]?.slug || subjects[0]?.code;
        return raw ? String(raw).toLowerCase() : 'default';
    }, [subjectSlug, subjects]);

    // Fetch authoritative academic content tree from MongoDB API (SWR: instant cached display + background revalidation)
    useEffect(() => {
        let isMounted = true;
        if (!currentSubjectIdentifier || currentSubjectIdentifier === 'default') return;

        // If in-memory cache exists, populate immediately for 0ms instant display
        if (CONTENT_TREE_CACHE.has(currentSubjectIdentifier)) {
            const cached = CONTENT_TREE_CACHE.get(currentSubjectIdentifier);
            setContentTrees(prev => (prev[currentSubjectIdentifier] === cached ? prev : {
                ...prev,
                [currentSubjectIdentifier]: cached
            }));
        }

        // Always revalidate from server in background to pick up newly added/updated topics
        getAcademicContentTree(currentSubjectIdentifier)
            .then(res => {
                if (!isMounted) return;
                if (res?.success && res?.data?.modules && Array.isArray(res.data.modules) && res.data.modules.length > 0) {
                    const normalizedModules = mapApiTreeToNavigation(res.data);
                    if (normalizedModules && normalizedModules.length > 0) {
                        CONTENT_TREE_CACHE.set(currentSubjectIdentifier, normalizedModules);
                        try {
                            sessionStorage.setItem(`ask_tree_cache_v3_${currentSubjectIdentifier}`, JSON.stringify(normalizedModules));
                        } catch (e) {}
                        setContentTrees(prev => ({
                            ...prev,
                            [currentSubjectIdentifier]: normalizedModules
                        }));
                    }
                }
            })
            .catch(() => {
                // Non-blocking: Timetable subject baseline modules/topics remain active as fallback
            });

        return () => { isMounted = false; };
    }, [currentSubjectIdentifier]);

    // Enhanced subjects list: API tree is primary when loaded, baseline subjects used as fallback
    const enhancedSubjects = useMemo(() => {
        if (!subjects || subjects.length === 0) return [];
        return subjects.map(s => {
            const sKey = (s.slug || s.code || '').toLowerCase();
            const sCode = (s.code || '').toLowerCase();
            const sSlug = (s.slug || '').toLowerCase();
            const apiModules = contentTrees[sKey] || CONTENT_TREE_CACHE.get(sKey)
                || (sCode ? (contentTrees[sCode] || CONTENT_TREE_CACHE.get(sCode)) : null)
                || (sSlug ? (contentTrees[sSlug] || CONTENT_TREE_CACHE.get(sSlug)) : null);
            return mergeSubjectWithContentTree(s, apiModules);
        });
    }, [subjects, contentTrees]);

    // ── Active Subject Resolution (from enhanced subjects) ─────────────
    const activeSubject = useMemo(() => {
        if (!enhancedSubjects.length) return null;
        if (subjectSlug) {
            const lowerSlug = subjectSlug.toLowerCase();
            const found = enhancedSubjects.find(s => 
                s.slug?.toLowerCase() === lowerSlug || 
                s.code?.toLowerCase() === lowerSlug ||
                s.branchCode?.toLowerCase() === lowerSlug ||
                s.displayCode?.toLowerCase() === lowerSlug ||
                s._id === subjectSlug || 
                s.id === subjectSlug
            );
            if (found) return found;
        }
        return enhancedSubjects[0];
    }, [enhancedSubjects, subjectSlug]);

    // ── Editorial Completion Persistence (Local Cache + Backend API) ─────────────
    const activeSubjectKey = useMemo(() => {
        if (!activeSubject) return 'default';
        return activeSubject.slug || activeSubject.code?.toLowerCase() || 'default';
    }, [activeSubject]);


    const progressStorageKey = useMemo(() => {
        const uid = user?._id || user?.id || 'guest';
        return `ask_editorial_progress_${uid}_${activeSubjectKey}`;
    }, [user, activeSubjectKey]);

    const [completedTopicKeys, setCompletedTopicKeys] = useState(() => {
        try {
            const saved = localStorage.getItem(`ask_editorial_progress_${user?._id || user?.id || 'guest'}_${activeSubjectKey}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return new Set(parsed);
            }
        } catch (e) {}
        return new Set();
    });

    // Sync from localStorage and API whenever subject or user changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(progressStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCompletedTopicKeys(new Set(parsed));
                }
            } else {
                setCompletedTopicKeys(new Set());
            }
        } catch (e) {
            setCompletedTopicKeys(new Set());
        }

        // Also fetch from API if subject is present
        if (activeSubjectKey && activeSubjectKey !== 'default') {
            apiV2.getEditorialProgress(activeSubjectKey)
                .then(res => {
                    const progressData = res.data?.data;
                    if (progressData?.completedTopics && Array.isArray(progressData.completedTopics)) {
                        const keysFromDb = new Set();
                        progressData.completedTopics.forEach(t => {
                            if (t.moduleSlug && t.topicSlug) {
                                keysFromDb.add(`${t.moduleSlug}__${t.topicSlug}`);
                            }
                            if (t.moduleSlug && t.topicId) {
                                keysFromDb.add(`${t.moduleSlug}__${t.topicId}`);
                            }
                            if (t.topicSlug) keysFromDb.add(t.topicSlug);
                            if (t.topicId) keysFromDb.add(t.topicId);
                        });

                        setCompletedTopicKeys(prev => {
                            const merged = new Set([...prev, ...keysFromDb]);
                            try {
                                localStorage.setItem(progressStorageKey, JSON.stringify([...merged]));
                            } catch (e) {}
                            return merged;
                        });
                    }
                })
                .catch(() => {
                    // Silently fail if offline or not logged in - localStorage already works seamlessly
                });
        }
    }, [progressStorageKey, activeSubjectKey]);

    const handleToggleTopicCompletion = (mod, topic) => {
        const modSlug = mod?.slug || (mod?.moduleNumber === 0 ? 'basics' : `module-${mod?.moduleNumber || 1}`);
        const tSlug = topic?.slug || topic?.id || 'topic';
        const tId = topic?.id || topic?.slug || 'topic';
        const primaryKey = `${modSlug}__${tSlug}`;

        setCompletedTopicKeys(prev => {
            const next = new Set(prev);
            const isCurrentlyCompleted = next.has(primaryKey) || next.has(tSlug);
            if (isCurrentlyCompleted) {
                next.delete(primaryKey);
                next.delete(`${modSlug}__${tId}`);
                next.delete(tSlug);
                next.delete(tId);
            } else {
                next.add(primaryKey);
                next.add(`${modSlug}__${tId}`);
                next.add(tSlug);
                next.add(tId);
            }

            try {
                localStorage.setItem(progressStorageKey, JSON.stringify([...next]));
            } catch (e) {}

            return next;
        });

        // Backend persistence call
        if (activeSubjectKey && activeSubjectKey !== 'default') {
            apiV2.toggleTopicCompletion({
                subjectSlug: activeSubjectKey,
                moduleSlug: modSlug,
                topicSlug: tSlug,
                topicId: tId
            }).catch(err => {
                console.warn('Failed to sync topic completion to server:', err);
            });
        }
    };

    // ── Active Module Resolution ──────────────────────────────────────
    const activeModule = useMemo(() => {
        if (!activeSubject) return null;

        // If modules were populated by the authoritative API content tree, use them directly
        let modules = [];
        if (activeSubject.contentSource === 'api' && Array.isArray(activeSubject.modules) && activeSubject.modules.length > 0) {
            modules = activeSubject.modules;
        } else if (Array.isArray(activeSubject.modules) && activeSubject.modules.length > 0) {
            // Legacy fallback subject modules with label normalization
            // Navigation topics come from the subject's own data; no PLC5-specific hardcoded arrays (removed Step 11)
            modules = activeSubject.modules.map((m, idx) => {
                const modNum = (m.moduleNumber !== undefined && m.moduleNumber !== null) 
                    ? m.moduleNumber 
                    : (idx + 1);
                const numPadded = String(modNum).padStart(2, '0');
                const rawTitle = m.title || m.name || '';
                const isBasics = modNum === 0 || rawTitle.toLowerCase().trim() === 'basics' || rawTitle.toLowerCase().trim() === '0. basics';

                const isGeneric = !rawTitle || 
                    rawTitle.toLowerCase().trim() === `module ${modNum}` || 
                    rawTitle.toLowerCase().trim() === `module ${numPadded}`;
                const cleanTitle = isBasics ? '0. Basics' : (isGeneric ? `Module ${numPadded}` : rawTitle);
                const displayLabel = isBasics ? '0. Basics' : (isGeneric ? `Module ${numPadded}` : `M${numPadded} · ${rawTitle}`);

                const topics = (Array.isArray(m.topics) && m.topics.length > 0)
                    ? m.topics.map((t, tIdx) => {
                        const tSlug = t.slug || (typeof t === 'string' ? t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `topic-${tIdx + 1}`);
                        const tTitle = t.title || t.name || (typeof t === 'string' ? t : `Topic ${tIdx + 1}`);
                        const tDisplay = t.displayLabel || (isBasics ? `0.${tIdx + 1} ${tTitle}` : `${modNum}.${tIdx + 1} ${tTitle}`);
                        return {
                            id: t.id || tSlug,
                            topicId: t.topicId || t.id || tSlug,
                            slug: tSlug,
                            title: tTitle,
                            displayLabel: tDisplay
                        };
                    })
                    : []; // No hardcoded fallback topics; API provides authoritative navigation

                return {
                    ...m,
                    id: m.id || m._id || (isBasics ? 'basics' : `module-${modNum}`),
                    slug: m.slug || (isBasics ? 'basics' : `module-${modNum}`),
                    moduleNumber: modNum,
                    title: cleanTitle,
                    displayLabel: displayLabel,
                    topics: topics
                };
            });
        } else {
            // General fallback structure when no modules are registered at all
            modules = [1, 2, 3, 4, 5].map(num => ({
                id: `module-${num}`,
                slug: `module-${num}`,
                moduleNumber: num,
                title: `Module ${String(num).padStart(2, '0')}`,
                displayLabel: `Module ${String(num).padStart(2, '0')}`,
                topics: [] // No hardcoded topics; API provides authoritative navigation
            }));
        }

        if (moduleSlug) {
            const lowerModuleSlug = moduleSlug.toLowerCase();
            const found = modules.find(m => 
                m.slug?.toLowerCase() === lowerModuleSlug || 
                `module-${m.moduleNumber}`.toLowerCase() === lowerModuleSlug ||
                String(m.moduleNumber) === lowerModuleSlug ||
                ((lowerModuleSlug === 'basics' || lowerModuleSlug === 'module-0') && (m.moduleNumber === 0 || m.title?.toLowerCase() === 'basics' || m.title?.toLowerCase() === '0. basics'))
            );
            if (found) return found;
        }
        return modules[0] || null;
    }, [activeSubject, moduleSlug]);

    // ── Active Topic Resolution ───────────────────────────────────────
    const activeTopic = useMemo(() => {
        if (!activeModule || !activeModule.topics || activeModule.topics.length === 0) return null;
        if (topicSlug) {
            const lower = topicSlug.toLowerCase();
            const found = activeModule.topics.find(t => 
                t.slug?.toLowerCase() === lower || 
                t.id?.toLowerCase() === lower
            );
            if (found) return found;
        }
        return activeModule.topics[0] || null;
    }, [activeModule, topicSlug]);

    // ── Previous / Next Topic Resolution for Sequential Editorial Navigation ───
    const prevTopic = useMemo(() => {
        if (!activeModule || !activeModule.topics || !activeTopic) return null;
        const currIdx = activeModule.topics.findIndex(t => t.slug === activeTopic.slug || t.id === activeTopic.id);
        if (currIdx > 0) {
            return activeModule.topics[currIdx - 1];
        }
        return null;
    }, [activeModule, activeTopic]);

    const nextTopic = useMemo(() => {
        if (!activeModule || !activeModule.topics || !activeTopic) return null;
        const currIdx = activeModule.topics.findIndex(t => t.slug === activeTopic.slug || t.id === activeTopic.id);
        if (currIdx >= 0 && currIdx < activeModule.topics.length - 1) {
            return activeModule.topics[currIdx + 1];
        }
        return null;
    }, [activeModule, activeTopic]);

    // ── Active Tab Resolution ─────────────────────────────────────────
    const activeTab = useMemo(() => {
        if (section && TAB_CONFIGS[section.toLowerCase()]) {
            return section.toLowerCase();
        }
        return 'editorial';
    }, [section]);

    // ── Content Scroll Reset ──────────────────────────────────────────
    // Ensure content scroll starts from the top on any topic/module navigation
    useEffect(() => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }, [topicSlug, moduleSlug, subjectSlug]);

    // ── Navigation Handlers ───────────────────────────────────────────
    const handleSelectSubject = (subject) => {
        const uid = user?._id || user?.id || 'guest';
        const sSlug = subject.slug || subject.code?.toLowerCase();
        try {
            const savedRaw = localStorage.getItem(`ask_last_opened_${uid}_${sSlug}`);
            if (savedRaw) {
                const saved = JSON.parse(savedRaw);
                if (saved?.moduleSlug) {
                    const topicPart = saved.topicSlug ? `/${saved.topicSlug}` : '';
                    navigate(`${basePath}/${sSlug}/${saved.moduleSlug}/${saved.section || activeTab || 'editorial'}${topicPart}`);
                    return;
                }
            }
        } catch (e) {}

        const firstMod = subject.modules?.[0]?.slug || (subject.modules?.[0]?.moduleNumber !== undefined ? (subject.modules[0].moduleNumber === 0 ? 'basics' : `module-${subject.modules[0].moduleNumber}`) : 'module-1');
        navigate(`${basePath}/${sSlug}/${firstMod}/${activeTab}`);
    };

    const handleSelectModule = (subject, mod) => {
        const subj = subject || activeSubject;
        if (!subj) return;
        const uid = user?._id || user?.id || 'guest';
        const sSlug = subj.slug || subj.code?.toLowerCase();
        const targetSlug = mod.slug || (mod.moduleNumber === 0 ? 'basics' : `module-${mod.moduleNumber}`);

        try {
            const savedRaw = localStorage.getItem(`ask_last_opened_${uid}_${sSlug}_${targetSlug}`);
            if (savedRaw) {
                const saved = JSON.parse(savedRaw);
                if (saved?.topicSlug) {
                    navigate(`${basePath}/${sSlug}/${targetSlug}/${activeTab}/${saved.topicSlug}`);
                    setIsMobileDrawerOpen(false);
                    return;
                }
            }
        } catch (e) {}

        const firstTopicSlug = mod.topics?.[0]?.slug || mod.topics?.[0]?.id;
        const topicPart = firstTopicSlug ? `/${firstTopicSlug}` : '';
        navigate(`${basePath}/${sSlug}/${targetSlug}/${activeTab}${topicPart}`);
        setIsMobileDrawerOpen(false);
    };

    const handleSelectTopic = (subject, mod, topic) => {
        const subj = subject || activeSubject;
        const targetMod = mod || activeModule;
        if (!subj || !targetMod) return;
        const modSlug = targetMod.slug || (targetMod.moduleNumber === 0 ? 'basics' : `module-${targetMod.moduleNumber}`);
        navigate(`${basePath}/${subj.slug || subj.code?.toLowerCase()}/${modSlug}/${activeTab}/${topic.slug}`);
        setIsMobileDrawerOpen(false);

        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    };

    const handleSelectTab = (tabId) => {
        if (!activeSubject || !activeModule) return;
        const modSlug = activeModule.slug || (activeModule.moduleNumber === 0 ? 'basics' : `module-${activeModule.moduleNumber}`);
        const topicSuffix = activeTopic?.slug ? `/${activeTopic.slug}` : '';
        navigate(`${basePath}/${activeSubject.slug || activeSubject.code?.toLowerCase()}/${modSlug}/${tabId}${topicSuffix}`);
    };

    // ── Track and persist last opened subject, module, and topic per user ─────────
    useEffect(() => {
        if (!activeSubject || !activeModule) return;
        const uid = user?._id || user?.id || 'guest';
        const sKey = activeSubject.slug || activeSubject.code?.toLowerCase();
        const mKey = activeModule.slug || (activeModule.moduleNumber === 0 ? 'basics' : `module-${activeModule.moduleNumber}`);
        const tKey = activeTopic?.slug || activeTopic?.id || '';

        const record = {
            subjectSlug: sKey,
            moduleSlug: mKey,
            topicSlug: tKey,
            section: activeTab,
            timestamp: Date.now()
        };

        try {
            // Overall last opened
            localStorage.setItem(`ask_last_opened_${uid}`, JSON.stringify(record));
            // Per-subject last opened
            localStorage.setItem(`ask_last_opened_${uid}_${sKey}`, JSON.stringify(record));
            // Per-module last opened topic
            if (tKey) {
                localStorage.setItem(`ask_last_opened_${uid}_${sKey}_${mKey}`, JSON.stringify(record));
            }
        } catch (e) {}
    }, [user, activeSubject, activeModule, activeTopic, activeTab]);

    // ── Restore last opened module & topic when user comes back ───────────────────
    const hasAttemptedRestoreRef = useRef(false);

    useEffect(() => {
        if (hasAttemptedRestoreRef.current || !subjects || subjects.length === 0) return;

        const uid = user?._id || user?.id || 'guest';

        // Case A: User opens /my-subjects or /plus/my-subjects without a subject in URL
        if (!subjectSlug) {
            hasAttemptedRestoreRef.current = true;
            try {
                const savedRaw = localStorage.getItem(`ask_last_opened_${uid}`);
                if (savedRaw) {
                    const saved = JSON.parse(savedRaw);
                    const matchingSubject = subjects.find(s => 
                        s.slug === saved.subjectSlug || 
                        s.code?.toLowerCase() === saved.subjectSlug?.toLowerCase() ||
                        s._id === saved.subjectSlug ||
                        s.id === saved.subjectSlug
                    );
                    if (matchingSubject && saved.moduleSlug) {
                        const sSlug = matchingSubject.slug || matchingSubject.code?.toLowerCase();
                        const tSlugPart = saved.topicSlug ? `/${saved.topicSlug}` : '';
                        navigate(`${basePath}/${sSlug}/${saved.moduleSlug}/${saved.section || 'editorial'}${tSlugPart}`, { replace: true });
                        return;
                    }
                }
            } catch (e) {}

            // Fallback: First subject's first module
            if (subjects[0]) {
                const s = subjects[0];
                const sSlug = s.slug || s.code?.toLowerCase();
                const firstMod = s.modules?.[0]?.slug || (s.modules?.[0]?.moduleNumber !== undefined ? (s.modules[0].moduleNumber === 0 ? 'basics' : `module-${s.modules[0].moduleNumber}`) : 'module-1');
                navigate(`${basePath}/${sSlug}/${firstMod}/editorial`, { replace: true });
            }
        } else if (subjectSlug && !moduleSlug) {
            // Case B: User opened a subject URL directly without moduleSlug
            hasAttemptedRestoreRef.current = true;
            const currentSubjKey = activeSubject?.slug || activeSubject?.code?.toLowerCase() || subjectSlug.toLowerCase();
            try {
                const savedRaw = localStorage.getItem(`ask_last_opened_${uid}_${currentSubjKey}`);
                if (savedRaw) {
                    const saved = JSON.parse(savedRaw);
                    if (saved?.moduleSlug) {
                        const tSlugPart = saved.topicSlug ? `/${saved.topicSlug}` : '';
                        navigate(`${basePath}/${currentSubjKey}/${saved.moduleSlug}/${saved.section || 'editorial'}${tSlugPart}`, { replace: true });
                        return;
                    }
                }
            } catch (e) {}

            // Fallback: Open first module
            if (activeSubject) {
                const firstMod = activeSubject.modules?.[0]?.slug || (activeSubject.modules?.[0]?.moduleNumber !== undefined ? (activeSubject.modules[0].moduleNumber === 0 ? 'basics' : `module-${activeSubject.modules[0].moduleNumber}`) : 'module-1');
                navigate(`${basePath}/${currentSubjKey}/${firstMod}/editorial`, { replace: true });
            }
        } else if (subjectSlug && moduleSlug && !topicSlug && activeTab === 'editorial') {
            // Case C: User opened a module URL without topicSlug in editorial
            const currentSubjKey = activeSubject?.slug || activeSubject?.code?.toLowerCase() || subjectSlug.toLowerCase();
            const currentModKey = moduleSlug.toLowerCase();
            try {
                const savedRaw = localStorage.getItem(`ask_last_opened_${uid}_${currentSubjKey}_${currentModKey}`);
                if (savedRaw) {
                    const saved = JSON.parse(savedRaw);
                    if (saved?.topicSlug) {
                        navigate(`${basePath}/${currentSubjKey}/${currentModKey}/editorial/${saved.topicSlug}`, { replace: true });
                        return;
                    }
                }
            } catch (e) {}
        }
    }, [subjects, subjectSlug, moduleSlug, topicSlug, activeTab, user, basePath, navigate, activeSubject]);

    const activeTabMeta = getTabMeta(activeTab, isDark);
    const TabIcon = activeTabMeta.icon;

    const isCurrentTopicCompleted = useMemo(() => {
        if (!activeTopic) return false;
        const mSlug = activeModule?.slug || (activeModule?.moduleNumber === 0 ? 'basics' : `module-${activeModule?.moduleNumber || 1}`);
        const tSlug = activeTopic.slug;
        const tId = activeTopic.id;
        return (
            completedTopicKeys.has(`${mSlug}__${tSlug}`) ||
            completedTopicKeys.has(`${mSlug}__${tId}`) ||
            completedTopicKeys.has(tSlug) ||
            completedTopicKeys.has(tId)
        );
    }, [completedTopicKeys, activeModule, activeTopic]);

    return (
        <div 
            className="my-subjects-workspace-container flex flex-col md:flex-row w-full h-full min-h-0"
            style={{
                width: '100%',
                height: '100%',
                maxHeight: '100dvh',
                minHeight: 0,
                background: t.pageBg,
                color: t.textColor,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* ══════════════════════════════════════════════════════════════
                MOBILE TOP BAR (< 768px)
            ══════════════════════════════════════════════════════════════ */}
            <div 
                className="flex md:hidden items-center justify-between px-4 h-14 border-b shrink-0 z-20"
                style={{
                    background: t.mobileTopBg,
                    borderColor: t.mobileTopBorder,
                    backdropFilter: 'blur(12px)'
                }}
            >
                <Link to="/" className="flex items-center gap-2 text-decoration-none outline-none">
                    <ASLogo size={24} accentColor="#8B5CF6" />
                    <span 
                        style={{ 
                            fontFamily: "'Plus Jakarta Sans', sans-serif", 
                            fontWeight: 750, 
                            fontSize: '14px', 
                            letterSpacing: '-0.02em', 
                            color: t.mobileLogoText 
                        }}
                    >
                        Ask<span style={{ color: '#8B5CF6' }}>UR</span>Senior
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 11px',
                        borderRadius: '8px',
                        background: t.mobileDrawerBtnBg,
                        border: `1px solid ${t.mobileDrawerBtnBorder}`,
                        color: t.mobileDrawerBtnText,
                        fontSize: '12px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                    title="Open syllabus navigation"
                >
                    <Folder size={13} color={t.mobileDrawerIcon} />
                    {activeSubject && (
                        <span style={{ fontFamily: 'monospace', fontWeight: 750 }}>
                            [{activeSubject.branchCode || activeSubject.displayCode || activeSubject.code}]
                        </span>
                    )}
                    <span>Syllabus</span>
                    <ChevronDown size={13} style={{ color: t.mobileDrawerChevron }} />
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                DESKTOP SIDEBAR (≥ 768px)
            ══════════════════════════════════════════════════════════════ */}
            <motion.div 
                animate={{
                    width: isSidebarCollapsed ? 0 : 280,
                    opacity: isSidebarCollapsed ? 0 : 1
                }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="hidden md:block shrink-0 overflow-hidden"
                style={{
                    height: '100%'
                }}
            >
                <div style={{ width: '280px', height: '100%' }}>
                    <MySubjectsSidebar
                        subjects={enhancedSubjects}
                        loading={loading}
                        activeSubjectId={activeSubject?.slug || activeSubject?.code || activeSubject?._id}
                        activeModuleSlug={activeModule?.slug || (activeModule?.moduleNumber === 0 ? 'basics' : `module-${activeModule?.moduleNumber}`)}
                        activeTopicSlug={activeTopic?.slug}
                        completedTopicKeys={completedTopicKeys}
                        onSelectSubject={handleSelectSubject}
                        onSelectModule={handleSelectModule}
                        onSelectTopic={handleSelectTopic}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onToggleCollapse={handleToggleCollapseSidebar}
                    />
                </div>
            </motion.div>

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
                                width: 'min(90vw, 340px)',
                                zIndex: 100,
                                background: t.mobileDrawerBg,
                                boxShadow: isDark ? '0 0 30px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.15)'
                            }}
                            className="block md:hidden"
                        >
                            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                                <MySubjectsSidebar
                                    subjects={enhancedSubjects}
                                    loading={loading}
                                    activeSubjectId={activeSubject?.slug || activeSubject?.code || activeSubject?._id}
                                    activeModuleSlug={activeModule?.slug || (activeModule?.moduleNumber === 0 ? 'basics' : `module-${activeModule?.moduleNumber}`)}
                                    activeTopicSlug={activeTopic?.slug}
                                    completedTopicKeys={completedTopicKeys}
                                    onSelectSubject={handleSelectSubject}
                                    onSelectModule={handleSelectModule}
                                    onSelectTopic={handleSelectTopic}
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
                ref={mainScrollRef}
                className={`flex-1 min-h-0 w-full flex flex-col overflow-y-auto overscroll-contain scrollbar-none ${
                    activeTab === 'editorial'
                        ? 'px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-7 pb-10 sm:pb-8 md:pb-6'
                        : 'p-5 sm:p-7 md:p-8'
                }`}
                style={{
                    boxSizing: 'border-box',
                    background: activeTab === 'editorial' 
                        ? (isDark ? '#1E1E1E' : '#F6F7F9') 
                        : t.pageBg
                }}
            >
                {loading ? (
                    /* Loading Skeleton matching theme */
                    <div className="space-y-4 max-w-xl animate-pulse">
                        <div className={`h-8 rounded-lg w-1/3 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                        <div className={`h-4 rounded-md w-1/4 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                        <div className="flex gap-2 pt-2">
                            <div className={`h-9 w-28 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                            <div className={`h-9 w-28 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                            <div className={`h-9 w-28 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                        </div>
                    </div>
                ) : subjects.length === 0 ? (
                    /* Global Empty State (when student has 0 subjects configured in their timetable) */
                    <div 
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'center',
                            padding: '40px 20px'
                        }}
                    >
                        <div 
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: '16px',
                                background: t.emptyIconBg,
                                border: `1px solid ${t.emptyIconBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: t.emptyIconColor,
                                marginBottom: '14px'
                            }}
                        >
                            <Inbox size={28} strokeWidth={1.8} />
                        </div>
                        <h3 
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: t.headingText,
                                margin: '0 0 8px 0'
                            }}
                        >
                            No subjects allocated yet
                        </h3>
                        <p 
                            style={{
                                fontSize: '13px',
                                color: t.emptyDesc,
                                margin: 0,
                                maxWidth: '320px',
                                lineHeight: 1.5
                            }}
                        >
                            Your subjects will appear here automatically when your section timetable is configured.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Minimal Subject Header ─────────────────────────────────────── */}
                        <header style={{ marginBottom: '28px' }}>
                            {/* Expand Sidebar Trigger Button when collapsed (Desktop) */}
                            {isSidebarCollapsed && (
                                <div className="hidden md:flex items-center mb-3">
                                    <button
                                        type="button"
                                        onClick={handleToggleCollapseSidebar}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            background: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F3EEFF',
                                            border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #DDD6FE',
                                            color: isDark ? '#c4b5fd' : '#6D28D9',
                                            fontSize: '12px',
                                            fontWeight: 650,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                        className={isDark ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100'}
                                        title="Expand subjects sidebar"
                                    >
                                        <PanelLeftOpen size={15} />
                                        <span>Show Subjects</span>
                                    </button>
                                </div>
                            )}

                            {/* Subject Title & Code Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <h1
                                    style={{
                                        fontSize: 'clamp(19px, 2.2vw, 24px)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.025em',
                                        color: activeTab === 'editorial' ? (isDark ? '#EDEDED' : '#1F242D') : t.headingText,
                                        margin: 0,
                                        lineHeight: 1.25
                                    }}
                                >
                                    {activeSubject?.displayName || activeSubject?.name || 'Subject'}
                                </h1>
                                {(activeSubject?.branchCode || activeSubject?.displayCode || activeSubject?.code) && (
                                    <span
                                        style={{
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            fontFamily: 'monospace',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : (activeTab === 'editorial' ? '#FFFFFF' : t.codeBadgeBg),
                                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : (activeTab === 'editorial' ? '#E2E4E8' : t.codeBadgeBorder)}`,
                                            color: isDark ? '#A5D6FF' : (activeTab === 'editorial' ? '#4B5563' : t.codeBadgeText),
                                            letterSpacing: '0.04em'
                                        }}
                                    >
                                        [{activeSubject.branchCode || activeSubject.displayCode || activeSubject.code}]
                                    </span>
                                )}
                            </div>

                            {/* Feature Tabs: [ Editorial ] [ PYQs ] [ Discussion ] */}
                            <div 
                                className="flex items-center gap-2 overflow-x-auto scrollbar-none"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {MY_SUBJECTS_TABS.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const meta = getTabMeta(tab.id, isDark);
                                    const Icon = meta.icon;

                                    const isEditorialTheme = activeTab === 'editorial';
                                    let tabBg, tabBorder, tabColor, tabShadow;

                                    if (isActive) {
                                        tabBg = meta.bg;
                                        tabBorder = meta.border;
                                        tabColor = meta.color;
                                        tabShadow = meta.shadow || `0 0 16px ${meta.color}25`;
                                    } else {
                                        tabBg = isDark ? '#202020' : '#FFFFFF';
                                        tabBorder = isDark ? '#2E2E2E' : '#E2E4E8';
                                        tabColor = isDark ? '#8A8A8A' : '#57606A';
                                        tabShadow = isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.03)';
                                    }

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
                                                height: '38px',
                                                borderRadius: '999px',
                                                border: `1px solid ${tabBorder}`,
                                                background: tabBg,
                                                color: tabColor,
                                                fontSize: '12px',
                                                fontWeight: isActive ? 700 : 600,
                                                cursor: 'pointer',
                                                outline: 'none',
                                                boxShadow: tabShadow,
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                                transition: 'all 0.2s ease'
                                            }}
                                            className={isActive ? '' : (isDark ? 'hover:bg-white/5 hover:text-slate-200' : 'hover:bg-slate-100 hover:text-slate-900')}
                                        >
                                            <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ opacity: isActive ? 1 : 0.8 }} />
                                            <span>{tab.label}</span>
                                        </motion.button>
                                    );
                                })}
                                </div>
                            </header>

                            {/* ── Tab Content / Editorial / PYQ / Discussion Body ── */}
                            {activeTab === 'editorial' && activeTopic ? (
                                <div className="flex-1 w-full">
                                    <TopicEditorialView 
                                        key={`${activeSubjectKey}-${activeModule?.slug || activeModule?.moduleNumber || 'mod'}-${activeTopic?.slug || activeTopic?.id || 'top'}`}
                                        activeSubject={activeSubject}
                                        activeModule={activeModule}
                                        activeTopic={activeTopic}
                                        prevTopic={prevTopic}
                                        nextTopic={nextTopic}
                                        onSelectPrevTopic={prevTopic ? () => handleSelectTopic(activeSubject, activeModule, prevTopic) : undefined}
                                        onSelectNextTopic={nextTopic ? () => handleSelectTopic(activeSubject, activeModule, nextTopic) : undefined}
                                        isCompleted={isCurrentTopicCompleted}
                                        onToggleCompletion={() => handleToggleTopicCompletion(activeModule, activeTopic)}
                                        isDark={isDark}
                                    />
                                </div>
                        ) : (
                            <div 
                                className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4"
                                style={{ minHeight: '300px' }}
                            >
                                <motion.div
                                    key={`${activeSubject?.code}-${activeModule?.moduleNumber}-${activeTab}-${activeTopic?.slug || 'none'}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22 }}
                                    style={{
                                        maxWidth: '520px',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '14px',
                                        background: t.emptyCardBg,
                                        border: t.emptyCardBorder,
                                        borderRadius: isDark ? '0' : '20px',
                                        padding: isDark ? '0' : '36px 28px',
                                        boxShadow: t.emptyCardShadow
                                    }}
                                >
                                {/* Ambient Icon */}
                                <div 
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '18px',
                                        background: activeTabMeta.bg,
                                        border: `1px solid ${activeTabMeta.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: activeTabMeta.color,
                                        boxShadow: activeTabMeta.shadow || `0 0 28px ${activeTabMeta.color}25`
                                    }}
                                >
                                    <TabIcon size={26} strokeWidth={1.8} />
                                </div>

                                {/* Title & Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <h3 
                                        style={{
                                            fontSize: '17px',
                                            fontWeight: 750,
                                            color: t.emptyTitle,
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
                                            background: t.badgeBg,
                                            border: `1px solid ${t.badgeBorder}`,
                                            color: t.badgeText,
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Coming Soon
                                    </span>
                                </div>

                                {/* Description */}
                                <p 
                                    style={{
                                        fontSize: '13px',
                                        color: t.emptyDesc,
                                        margin: '2px 0 10px',
                                        lineHeight: 1.55,
                                        maxWidth: '400px'
                                    }}
                                >
                                    {activeTabMeta.description}
                                </p>

                                {/* Active Context Pill */}
                                <div
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        background: t.contextBg,
                                        border: t.contextBorder,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px',
                                        color: t.contextText
                                    }}
                                >
                                    <Folder size={14} color={t.contextIcon} />
                                    <span>
                                        Active Context: <strong style={{ color: t.contextHighlight }}>[{activeSubject?.branchCode || activeSubject?.displayCode || activeSubject?.code}] {activeSubject?.displayName || activeSubject?.name}</strong> → <strong style={{ color: t.contextHighlight }}>{activeModule?.displayLabel || activeModule?.title || `Module ${String(activeModule?.moduleNumber || 1).padStart(2, '0')}`}</strong>{activeTopic && <> → <strong style={{ color: t.contextHighlight }}>{activeTopic.displayLabel || activeTopic.title}</strong></>}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    </>
                )}
            </main>
        </div>
    );
};

export default MySubjectsPage;
