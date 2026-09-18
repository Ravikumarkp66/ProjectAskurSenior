import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    X, 
    Folder, 
    FolderOpen, 
    ChevronDown, 
    ChevronRight, 
    FileText, 
    Sun, 
    Moon,
    Inbox,
    PanelLeftClose,
    ChevronsDownUp,
    ChevronsUpDown,
    Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import { ASLogo } from '../../../components/Logo';

/* ═══════════════════════════════════════════════════════════════════
   MY SUBJECTS SINGLE SIDEBAR
   Structure matching C Programming Lab Reference:
   • TOP: AskURSenior Branding
   • SEARCH: Subjects Search Filter
   • TREE: Folder-style Academic Subjects with Nested Modules
   • BOTTOM CONTROLS: [ Home ] [ Plus ] [ Dark/Light ]
   • PROFILE: Compact User Profile Card
   • Visual Language: CSE Sheet (Deep dark, purple & cyan accents)
 ═══════════════════════════════════════════════════════════════════ */

/* Navigation SVG Icons matching global DashboardSidebar & UniversalMobileDrawer */
const GlobalHomeIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const PlusDashboardIcon = ({ size = 13, color = '#8B5CF6' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
    </svg>
);

// NOTE: BASICS_DEFAULT_TOPICS and PLC5_MODULE1_TOPICS navigation constants were removed in Step 11.
// MongoDB (CourseModule → Topic) is now the authoritative navigation source via the Academic Content API.

const getNormalizedModules = (subject) => {
    if (Array.isArray(subject?.modules) && subject.modules.length > 0) {
        return subject.modules.map((m, idx) => {
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

            // API subjects: topics always come from the content tree (no hardcoded fallback)
            // Legacy subjects: topics come from subject's own data or empty
            const topics = (Array.isArray(m.topics) && m.topics.length > 0)
                ? m.topics.map((t, tIdx) => {
                    const tSlug = t.slug || (typeof t === 'string' ? t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `topic-${tIdx + 1}`);
                    const tTitle = t.title || t.name || (typeof t === 'string' ? t : `Topic ${tIdx + 1}`);
                    const tDisplay = t.displayLabel || (isBasics ? `0.${tIdx + 1} ${tTitle}` : `${modNum}.${tIdx + 1} ${tTitle}`);
                    const stableId = t.id || t.topicId || tSlug;
                    return {
                        id: stableId,
                        topicId: t.topicId || stableId,
                        slug: tSlug,
                        title: tTitle,
                        displayLabel: tDisplay
                    };
                })
                : []; // No hardcoded fallback topics; API provides authoritative navigation

            return {
                id: m.id || m._id || (isBasics ? 'basics' : `module-${modNum}`),
                slug: m.slug || (isBasics ? 'basics' : `module-${modNum}`),
                moduleNumber: modNum,
                title: m.title || cleanTitle,
                displayLabel: m.displayLabel || displayLabel,
                topics: topics
            };
        });
    }
    return [1, 2, 3, 4, 5].map(num => ({
        id: `module-${num}`,
        slug: `module-${num}`,
        moduleNumber: num,
        title: `Module ${String(num).padStart(2, '0')}`,
        displayLabel: `Module ${String(num).padStart(2, '0')}`,
        topics: []
    }));
};

const MySubjectsSidebar = ({
    subjects = [],
    loading = false,
    activeSubjectId,
    activeModuleSlug,
    activeTopicSlug,
    completedTopicKeys,
    onSelectSubject,
    onSelectModule,
    onSelectTopic,
    searchQuery = '',
    onSearchChange,
    className = '',
    onCloseMobileDrawer,
    onToggleCollapse
}) => {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Track which subjects and modules are expanded in the folder tree (collapsed by default)
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [expandedModuleIds, setExpandedModuleIds] = useState(new Set());
    const [imgError, setImgError] = useState(false);
    const prevActiveIdRef = useRef(null);

    // Automatically expand active subject and active module with topics
    useEffect(() => {
        if (activeSubjectId) {
            const activeSubj = subjects.find(s => 
                s._id === activeSubjectId || 
                s.id === activeSubjectId || 
                s.slug === activeSubjectId || 
                s.code?.toLowerCase() === String(activeSubjectId).toLowerCase()
            );
            if (activeSubj) {
                const sKey = activeSubj._id || activeSubj.id || activeSubj.code;
                setExpandedIds(prev => new Set(prev).add(sKey));
                if (activeModuleSlug) {
                    const mods = getNormalizedModules(activeSubj);
                    const activeM = mods.find(m => 
                        m.slug === activeModuleSlug || 
                        `module-${m.moduleNumber}` === activeModuleSlug || 
                        ((activeModuleSlug === 'basics' || activeModuleSlug === 'module-0') && (m.moduleNumber === 0 || m.slug === 'basics'))
                    );
                    if (activeM && activeM.topics?.length > 0) {
                        const mKey = `${sKey}-${activeM.slug || activeM.moduleNumber}`;
                        setExpandedModuleIds(prev => new Set(prev).add(mKey));
                    }
                }
            }
        }
    }, [activeSubjectId, activeModuleSlug, subjects]);

    // Profile data resolution
    const profilePic = user?.profilePicture || user?.avatar || user?.picture || user?.photo || '';
    const initials = (typeof user?.name === 'string' && user.name)
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (typeof user?.email === 'string' ? user.email[0]?.toUpperCase() : '?');

    const userBranchDisplay = useMemo(() => {
        if (!user) return 'Student';
        const b = user.branch || user.currentBranch;
        if (!b) return 'Student';
        if (typeof b === 'string') return b;
        if (typeof b === 'object') {
            return b.shortName || b.name || b.code || 'Student';
        }
        return 'Student';
    }, [user]);

    const userSectionDisplay = useMemo(() => {
        if (!user) return '';
        const s = user.section || user.academicSection;
        if (!s) return '';
        if (typeof s === 'string') return s;
        if (typeof s === 'object') {
            return s.name || s.section || '';
        }
        return '';
    }, [user]);

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    // Filter subjects by search query across subjects, modules, topics & subtopics
    const { filteredSubjects, matchingSubjectKeys, matchingModuleKeys, matchingTopicKeys } = useMemo(() => {
        if (!searchQuery.trim()) {
            return {
                filteredSubjects: subjects,
                matchingSubjectKeys: new Set(),
                matchingModuleKeys: new Set(),
                matchingTopicKeys: new Set()
            };
        }
        const q = searchQuery.toLowerCase().trim();
        const matchedSubs = [];
        const matchedSubKeys = new Set();
        const matchedModKeys = new Set();
        const matchedTopKeys = new Set();

        subjects.forEach(s => {
            const subjectKey = s._id || s.id || s.code;
            const matchesSubject = 
                s.name?.toLowerCase().includes(q) || 
                s.displayName?.toLowerCase().includes(q) ||
                s.code?.toLowerCase().includes(q) || 
                s.branchCode?.toLowerCase().includes(q) || 
                s.displayCode?.toLowerCase().includes(q);

            const modules = getNormalizedModules(s);
            let hasMatchingModuleOrTopic = false;

            modules.forEach(mod => {
                const modKey = `${subjectKey}-${mod.slug || mod.moduleNumber}`;
                const matchesMod = 
                    mod.title?.toLowerCase().includes(q) || 
                    mod.displayLabel?.toLowerCase().includes(q) ||
                    mod.slug?.toLowerCase().includes(q) ||
                    `module ${mod.moduleNumber}`.includes(q);

                let hasMatchingTopic = false;
                if (Array.isArray(mod.topics)) {
                    mod.topics.forEach(t => {
                        const tTitle = t.title || t.name || '';
                        const tDisplay = t.displayLabel || '';
                        const tSlug = t.slug || t.id || '';
                        const matchesTopic = 
                            tTitle.toLowerCase().includes(q) ||
                            tDisplay.toLowerCase().includes(q) ||
                            tSlug.toLowerCase().includes(q) ||
                            (typeof t === 'string' && t.toLowerCase().includes(q));

                        if (matchesTopic) {
                            hasMatchingTopic = true;
                            matchedTopKeys.add(`${modKey}__${t.id || tSlug}`);
                            matchedTopKeys.add(tSlug);
                            matchedTopKeys.add(t.id);
                        }
                    });
                }

                if (matchesMod || hasMatchingTopic) {
                    hasMatchingModuleOrTopic = true;
                    matchedModKeys.add(modKey);
                }
            });

            if (matchesSubject || hasMatchingModuleOrTopic) {
                matchedSubs.push(s);
                matchedSubKeys.add(subjectKey);
            }
        });

        return {
            filteredSubjects: matchedSubs,
            matchingSubjectKeys: matchedSubKeys,
            matchingModuleKeys: matchedModKeys,
            matchingTopicKeys: matchedTopKeys
        };
    }, [subjects, searchQuery]);

    // Automatically expand matched subjects and modules when searching
    useEffect(() => {
        if (searchQuery.trim()) {
            if (matchingSubjectKeys.size > 0) {
                setExpandedIds(prev => new Set([...prev, ...matchingSubjectKeys]));
            }
            if (matchingModuleKeys.size > 0) {
                setExpandedModuleIds(prev => new Set([...prev, ...matchingModuleKeys]));
            }
        }
    }, [searchQuery, matchingSubjectKeys, matchingModuleKeys]);

    // Check if all filtered subjects are currently expanded
    const areAllExpanded = useMemo(() => {
        if (!filteredSubjects.length) return false;
        return filteredSubjects.every(s => expandedIds.has(s._id || s.id || s.code));
    }, [filteredSubjects, expandedIds]);

    // 1-Click Toggle All Subjects (Expand All / Collapse All)
    const toggleAllSubjects = () => {
        if (areAllExpanded) {
            setExpandedIds(new Set());
        } else {
            const allKeys = new Set(filteredSubjects.map(s => s._id || s.id || s.code));
            setExpandedIds(allKeys);
        }
    };

    // Theme Tokens (Light & Neutral Charcoal Dark)
    const t = useMemo(() => ({
        sidebarBg: isDark ? '#161616' : '#FFFFFF',
        sidebarBorder: isDark ? '#2A2A2A' : '#EAE6F5',
        headerBorder: isDark ? '#262626' : '#EAE6F5',
        footerBg: isDark ? '#141414' : '#F8FAFC',
        footerBorder: isDark ? '#262626' : '#EAE6F5',
        
        logoText: isDark ? '#EDEDED' : '#171225',
        logoAccent: '#8B5CF6',

        searchBg: isDark ? '#1C1C1C' : '#FFFFFF',
        searchBorder: isDark ? '#2A2A2A' : '#DDD6FE',
        searchFocusBg: isDark ? '#222222' : '#FFFFFF',
        searchFocusBorder: isDark ? '#444444' : '#7C3AED',
        searchText: isDark ? '#EDEDED' : '#171225',
        searchPlaceholder: isDark ? '#737373' : '#64748B',
        searchIcon: isDark ? '#737373' : '#7C3AED',
        searchClear: isDark ? '#737373' : '#64748B',

        subjInactiveText: isDark ? '#B5B5B5' : '#171225',
        subjInactiveCode: isDark ? '#9CA3AF' : '#6D28D9',
        subjInactiveFolder: isDark ? '#8A8A8A' : '#64748B',
        subjHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F5F3FF',
        subjChevron: isDark ? '#737373' : '#64748B',
        
        subjExpandedBg: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFD',
        subjExpandedBorder: isDark ? '#2A2A2A' : '#E9D5FF',
        subjExpandedFolder: isDark ? '#D1D5DB' : '#7C3AED',

        subjActiveBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3EEFF',
        subjActiveBorder: isDark ? '#2E2E2E' : '#B98CFF',
        subjActiveShadow: 'none',
        subjActiveBar: isDark ? '#34D399' : '#00D9A5',
        subjActiveBarShadow: 'none',
        subjActiveText: isDark ? '#EDEDED' : '#5B21B6',
        subjActiveCode: isDark ? '#34D399' : '#059669',
        subjActiveFolder: isDark ? '#34D399' : '#7C3AED',
        subjActiveChevron: isDark ? '#EDEDED' : '#7C3AED',

        treeGuideLine: isDark ? '#262626' : '#DDD6FE',
        modInactiveText: isDark ? '#B5B5B5' : '#475569',
        modInactiveIcon: isDark ? '#737373' : '#64748B',
        modHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F5F3FF',
        modHoverText: isDark ? '#EDEDED' : '#171225',
        modActiveBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ECFDF5',
        modActiveBorder: isDark ? '#2E2E2E' : '#A7F3D0',
        modActiveText: isDark ? '#EDEDED' : '#065F46',
        modActiveIcon: isDark ? '#34D399' : '#059669',

        btnHomeBg: isDark ? '#1C1C1C' : '#FFFFFF',
        btnHomeBorder: isDark ? '#2A2A2A' : '#E2E8F0',
        btnHomeText: isDark ? '#B5B5B5' : '#1E293B',

        btnPlusBg: isDark ? '#1C1C1C' : '#F3EEFF',
        btnPlusBorder: isDark ? '#2A2A2A' : '#DDD6FE',
        btnPlusText: isDark ? '#C4B5FD' : '#6D28D9',
        btnPlusIcon: isDark ? '#C4B5FD' : '#6D28D9',

        btnThemeBg: isDark ? '#1C1C1C' : '#FFFFFF',
        btnThemeBorder: isDark ? '#2A2A2A' : '#E2E8F0',
        btnThemeColor: isDark ? '#fbbf24' : '#D97706',

        profileBg: isDark ? '#181818' : '#FFFFFF',
        profileBorder: isDark ? '#262626' : '#E2E8F0',
        profileShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        profileName: isDark ? '#EDEDED' : '#171225',
        profileBranch: isDark ? '#9CA3AF' : '#6D28D9',
        profileChevron: isDark ? '#737373' : '#64748B',
        profileAvatarBg: isDark ? '#2A2A2A' : 'linear-gradient(135deg, #EDE9FE, #E0E7FF)',
        profileAvatarBorder: isDark ? '#383838' : '#A78BFA',
        profileAvatarText: isDark ? '#EDEDED' : '#5B21B6',
        
        emptyIconBg: isDark ? '#1C1C1C' : '#F3EEFF',
        emptyIconBorder: isDark ? '#2A2A2A' : '#DDD6FE',
        emptyIconColor: isDark ? '#737373' : '#6D28D9',
        emptyTitle: isDark ? '#EDEDED' : '#171225',
        emptyDesc: isDark ? '#8A8A8A' : '#5F5A70',
    }), [isDark]);


    // Chevron ONLY toggles expand/collapse (does not select/navigate)
    const toggleExpand = (subjectKey, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(subjectKey)) {
                next.delete(subjectKey);
            } else {
                next.add(subjectKey);
            }
            return next;
        });
    };

    // Clicking subject row: toggles folder open/close (expands if closed, closes if open)
    const handleSubjectClick = (subj) => {
        const key = subj._id || subj.id || subj.code;
        const isSubjectActive = 
            subj._id === activeSubjectId || 
            subj.id === activeSubjectId || 
            subj.slug === activeSubjectId ||
            subj.code?.toLowerCase() === String(activeSubjectId).toLowerCase();

        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });

        // If clicking an inactive subject, select it and navigate to its first module
        if (!isSubjectActive && onSelectSubject) {
            onSelectSubject(subj);
        }
    };

    const toggleExpandModule = (modKey, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setExpandedModuleIds(prev => {
            const next = new Set(prev);
            if (next.has(modKey)) {
                next.delete(modKey);
            } else {
                next.add(modKey);
            }
            return next;
        });
    };

    // Clicking module: selects module and updates active context
    const handleModuleClick = (subj, mod, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const modKey = `${subj._id || subj.code}-${mod.slug || mod.moduleNumber}`;
        if (mod.topics?.length > 0) {
            setExpandedModuleIds(prev => {
                const next = new Set(prev);
                next.add(modKey);
                return next;
            });
        }
        if (onSelectModule) {
            onSelectModule(subj, mod);
        } else if (onSelectSubject) {
            onSelectSubject(subj);
        }
        if (onCloseMobileDrawer) {
            onCloseMobileDrawer();
        }
    };

    // Clicking topic: selects topic, module, and subject
    const handleTopicClick = (subj, mod, topic, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (onSelectTopic) {
            onSelectTopic(subj, mod, topic);
        } else if (onSelectModule) {
            onSelectModule(subj, mod);
        }
        if (onCloseMobileDrawer) {
            onCloseMobileDrawer();
        }
    };

    return (
        <aside
            className={`my-subjects-sidebar flex flex-col h-full select-none ${className}`}
            style={{
                width: '100%',
                background: t.sidebarBg,
                borderRight: `1px solid ${t.sidebarBorder}`,
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}
        >
            {/* ── 1. Top Header: AskURSenior Logo / Wordmark ─────────────── */}
            <div 
                style={{
                    padding: '14px 14px 10px 14px',
                    borderBottom: `1px solid ${t.headerBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flexShrink: 0
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link 
                            to="/" 
                            onClick={() => onCloseMobileDrawer && onCloseMobileDrawer()}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '7px', 
                                textDecoration: 'none',
                                outline: 'none'
                            }}
                            title="AskUrSenior Home"
                        >
                            <ASLogo size={24} accentColor="#8B5CF6" />
                            <span 
                                style={{ 
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", 
                                    fontWeight: 750, 
                                    fontSize: '15px', 
                                    letterSpacing: '-0.02em', 
                                    color: t.logoText 
                                }}
                            >
                                Ask<span style={{ color: t.logoAccent }}>UR</span>Senior
                            </span>
                        </Link>
                        {onCloseMobileDrawer && (
                            <span 
                                style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 750, 
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    padding: '2px 7px', 
                                    borderRadius: '5px', 
                                    background: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE', 
                                    color: isDark ? '#c4b5fd' : '#6D28D9',
                                    border: isDark ? '1px solid rgba(139, 92, 246, 0.28)' : '1px solid #DDD6FE'
                                }}
                            >
                                Syllabus
                            </span>
                        )}
                    </div>

                    {/* Mobile Drawer Close Button */}
                    {onCloseMobileDrawer ? (
                        <button
                            type="button"
                            onClick={onCloseMobileDrawer}
                            style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                color: isDark ? '#94a3b8' : '#475569',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            className={isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-200'}
                            title="Close navigation"
                        >
                            <X size={15} />
                        </button>
                    ) : onToggleCollapse ? (
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                color: isDark ? 'rgba(148, 163, 184, 0.8)' : '#64748B',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            className={isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-purple-100 hover:text-purple-900'}
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose size={15} />
                        </button>
                    ) : null}
                </div>

                {/* ── 2. Subjects Search ─────────────────────────────────── */}
                <div 
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Search 
                        size={13} 
                        style={{
                            position: 'absolute',
                            left: '9px',
                            color: t.searchIcon,
                            pointerEvents: 'none'
                        }}
                    />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        placeholder="Search subjects, topics, subtopics..."
                        style={{
                            width: '100%',
                            height: '32px',
                            padding: '0 26px 0 28px',
                            borderRadius: '6px',
                            background: t.searchBg,
                            border: `1px solid ${t.searchBorder}`,
                            color: t.searchText,
                            fontSize: '12px',
                            outline: 'none',
                            transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = t.searchFocusBorder;
                            e.target.style.background = t.searchFocusBg;
                            if (!isDark) e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.12)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = t.searchBorder;
                            e.target.style.background = t.searchBg;
                            if (!isDark) e.target.style.boxShadow = 'none';
                        }}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange && onSearchChange('')}
                            style={{
                                position: 'absolute',
                                right: '7px',
                                background: 'transparent',
                                border: 'none',
                                color: t.searchClear,
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Clear search"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* ── Sub-header with Subject Count & Expand/Collapse All ── */}
                <div 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        paddingTop: '2px',
                        userSelect: 'none'
                    }}
                >
                    <span 
                        style={{ 
                            fontSize: '10.5px', 
                            fontWeight: 700, 
                            color: isDark ? 'rgba(148, 163, 184, 0.65)' : '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                        }}
                    >
                        Subjects {filteredSubjects.length > 0 ? `(${filteredSubjects.length})` : ''}
                    </span>

                    {filteredSubjects.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleAllSubjects}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#B5B5B5' : '#6D28D9',
                                fontSize: '11px',
                                fontWeight: 650,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 4px',
                                borderRadius: '4px'
                            }}
                            className={isDark ? 'hover:text-[#EDEDED]' : 'hover:text-purple-800'}
                            title={areAllExpanded ? "Collapse all subjects" : "Expand all subjects"}
                        >
                            {areAllExpanded ? (
                                <>
                                    <ChevronsDownUp size={12} />
                                    <span>Collapse All</span>
                                </>
                            ) : (
                                <>
                                    <ChevronsUpDown size={12} />
                                    <span>Expand All</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── 3. Subject Folder / Tree Navigation ────────────────────── */}
            <div 
                className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {loading && subjects.length === 0 ? (
                    <div className="p-2 space-y-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div 
                                key={i} 
                                className={isDark 
                                    ? "h-9 rounded-md bg-white/[0.03] animate-pulse border border-white/[0.04]"
                                    : "h-9 rounded-md bg-slate-100 animate-pulse border border-slate-200"
                                } 
                            />
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <div 
                        style={{
                            padding: '32px 14px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <div 
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                background: t.emptyIconBg,
                                border: `1px solid ${t.emptyIconBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: t.emptyIconColor
                            }}
                        >
                            <Inbox size={20} strokeWidth={1.75} />
                        </div>
                        <h4 
                            style={{
                                fontSize: '13px',
                                fontWeight: 650,
                                color: t.emptyTitle,
                                margin: 0
                            }}
                        >
                            No subjects allocated yet
                        </h4>
                        <p 
                            style={{
                                fontSize: '11px',
                                color: t.emptyDesc,
                                margin: 0,
                                lineHeight: 1.5,
                                maxWidth: '200px'
                            }}
                        >
                            Your subjects will appear here automatically when your section timetable is configured.
                        </p>
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className="p-4 text-center text-xs" style={{ color: t.emptyDesc }}>
                        No subjects matching "{searchQuery}"
                    </div>
                ) : (
                    filteredSubjects.map((subject) => {
                        const subjectKey = subject._id || subject.id || subject.code;
                        const isSubjectActive = 
                            subject._id === activeSubjectId || 
                            subject.id === activeSubjectId ||
                            subject.slug === activeSubjectId ||
                            subject.code?.toLowerCase() === String(activeSubjectId).toLowerCase();

                        const isExpanded = expandedIds.has(subjectKey);
                        const modules = getNormalizedModules(subject);

                        return (
                            <div 
                                key={subjectKey} 
                                className="subject-tree-node"
                                style={{ width: '100%' }}
                            >
                                {/* ── Folder Style Subject Row ────────────────── */}
                                <div
                                    onClick={() => handleSubjectClick(subject)}
                                    style={{
                                        width: '100%',
                                        borderRadius: '6px',
                                        padding: '7px 8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        background: isSubjectActive 
                                            ? t.subjActiveBg 
                                            : isExpanded 
                                                ? t.subjExpandedBg 
                                                : 'transparent',
                                        border: `1px solid ${
                                            isSubjectActive 
                                                ? t.subjActiveBorder 
                                                : isExpanded 
                                                    ? t.subjExpandedBorder 
                                                    : 'transparent'
                                        }`,
                                        boxShadow: isSubjectActive ? t.subjActiveShadow : 'none',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease, border-color 0.15s ease'
                                    }}
                                    className={isSubjectActive ? '' : (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-purple-50/70')}
                                    title={`${subject.displayName || subject.name} [${subject.branchCode || subject.displayCode || subject.code}]`}
                                >
                                    {/* Active Left Accent Bar */}
                                    {isSubjectActive && (
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '18%',
                                                bottom: '18%',
                                                width: '2.5px',
                                                borderRadius: '0 3px 3px 0',
                                                background: t.subjActiveBar,
                                                boxShadow: t.subjActiveBarShadow
                                            }}
                                        />
                                    )}

                                    {/* Folder Icon */}
                                    <div 
                                        style={{
                                            color: isSubjectActive 
                                                ? t.subjActiveFolder 
                                                : isExpanded 
                                                    ? t.subjExpandedFolder 
                                                    : t.subjInactiveFolder,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            transition: 'color 0.15s'
                                        }}
                                    >
                                        {isExpanded ? (
                                            <FolderOpen size={15} strokeWidth={2} />
                                        ) : (
                                            <Folder size={15} strokeWidth={1.8} />
                                        )}
                                    </div>

                                    {/* Course Code Badge */}
                                    <span 
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 750,
                                            fontFamily: 'monospace',
                                            color: isSubjectActive ? t.subjActiveCode : t.subjInactiveCode,
                                            letterSpacing: '0.02em',
                                            flexShrink: 0
                                        }}
                                    >
                                        [{subject.branchCode || subject.displayCode || subject.code}]
                                    </span>

                                    {/* Subject Name */}
                                    <span 
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: isSubjectActive ? 700 : 550,
                                            color: isSubjectActive ? t.subjActiveText : t.subjInactiveText,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            minWidth: 0,
                                            lineHeight: 1.3
                                        }}
                                        title={subject.displayName || subject.name}
                                    >
                                        {subject.displayName || subject.name}
                                    </span>

                                    {/* Chevron: ONLY expands/collapses folder */}
                                    <button
                                        type="button"
                                        onClick={(e) => toggleExpand(subjectKey, e)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isSubjectActive ? t.subjActiveChevron : t.subjChevron,
                                            padding: '2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            borderRadius: '4px',
                                            transition: 'transform 0.18s ease, color 0.15s ease'
                                        }}
                                        aria-label={isExpanded ? 'Collapse modules' : 'Expand modules'}
                                        className={isDark ? "hover:text-white" : "hover:text-purple-950"}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={14} strokeWidth={2} />
                                        ) : (
                                            <ChevronRight size={14} strokeWidth={2} />
                                        )}
                                    </button>
                                </div>

                                {/* ── Nested Modules List (When Expanded) ─────── */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18, ease: 'easeInOut' }}
                                            style={{
                                                overflow: 'hidden',
                                                marginLeft: '16px',
                                                paddingLeft: '10px',
                                                borderLeft: `1px solid ${t.treeGuideLine}`
                                            }}
                                            className="module-nested-container space-y-0.5 pt-1 pb-1"
                                        >
                                            {modules.map((mod) => {
                                                const isModActive = isSubjectActive && (
                                                    activeModuleSlug === mod.slug || 
                                                    activeModuleSlug === `module-${mod.moduleNumber}` ||
                                                    activeModuleSlug === String(mod.moduleNumber) ||
                                                    ((activeModuleSlug === 'basics' || activeModuleSlug === 'module-0') && (mod.moduleNumber === 0 || mod.slug === 'basics'))
                                                );

                                                const modKey = `${subjectKey}-${mod.slug || mod.moduleNumber}`;
                                                const hasSubtopics = Array.isArray(mod.topics) && mod.topics.length > 0;
                                                const isModExpanded = expandedModuleIds.has(modKey);

                                                return (
                                                    <div key={mod.id || mod.slug || mod.moduleNumber} className="module-tree-node">
                                                        <div
                                                            onClick={(e) => handleModuleClick(subject, mod, e)}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                height: '28px',
                                                                padding: '0 8px',
                                                                borderRadius: '5px',
                                                                fontSize: '11.5px',
                                                                fontWeight: isModActive ? 650 : 500,
                                                                background: isModActive ? t.modActiveBg : 'transparent',
                                                                color: isModActive ? t.modActiveText : t.modInactiveText,
                                                                border: `1px solid ${isModActive ? t.modActiveBorder : 'transparent'}`,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            className={isModActive ? '' : (isDark ? 'hover:bg-white/[0.04] hover:text-[#EDEDED]' : 'hover:bg-slate-100 hover:text-slate-900')}
                                                        >
                                                            {/* Module Folder Icon */}
                                                            <div 
                                                                style={{ 
                                                                    color: isModActive 
                                                                        ? t.modActiveIcon 
                                                                        : (isDark ? '#8A8A8A' : '#7C3AED'),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                    transition: 'color 0.15s ease'
                                                                }}
                                                            >
                                                                {isModActive || isModExpanded ? (
                                                                    <FolderOpen size={13} strokeWidth={2} />
                                                                ) : (
                                                                    <Folder size={13} strokeWidth={1.8} />
                                                                )}
                                                            </div>

                                                            {/* Module Label */}
                                                            <span 
                                                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                                                                title={mod.title}
                                                            >
                                                                {mod.displayLabel}
                                                            </span>

                                                            {/* Optional chevron for subtopics */}
                                                            {hasSubtopics && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => toggleExpandModule(modKey, e)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: isModActive ? t.modActiveIcon : t.subjChevron,
                                                                        padding: '2px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        flexShrink: 0,
                                                                        borderRadius: '3px'
                                                                    }}
                                                                    aria-label={isModExpanded ? 'Collapse topics' : 'Expand topics'}
                                                                >
                                                                    {isModExpanded ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Subtopics Nested Container */}
                                                        <AnimatePresence initial={false}>
                                                            {hasSubtopics && isModExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                                                                    style={{
                                                                        overflow: 'hidden',
                                                                        marginLeft: '14px',
                                                                        paddingLeft: '8px',
                                                                        borderLeft: `1px dashed ${t.treeGuideLine}`
                                                                    }}
                                                                    className="subtopics-nested-container space-y-0.5 pt-0.5 pb-0.5"
                                                                >
                                                                    {mod.topics.map((topic, tIdx) => {
                                                                        const isTopicActive = isModActive && (
                                                                            activeTopicSlug === topic.slug ||
                                                                            activeTopicSlug === topic.id ||
                                                                            (!activeTopicSlug && tIdx === 0)
                                                                        );

                                                                        const topicKey1 = `${mod.slug || `module-${mod.moduleNumber}`}__${topic.slug || topic.id}`;
                                                                        const topicKey2 = `${mod.slug || `module-${mod.moduleNumber}`}__${topic.id}`;
                                                                        const isTopicCompleted = completedTopicKeys && (
                                                                            completedTopicKeys.has(topicKey1) ||
                                                                            completedTopicKeys.has(topicKey2) ||
                                                                            completedTopicKeys.has(topic.slug) ||
                                                                            completedTopicKeys.has(topic.id)
                                                                        );

                                                                         const isTopicMatch = Boolean(searchQuery.trim() && (
                                                                             matchingTopicKeys.has(topic.slug) ||
                                                                             matchingTopicKeys.has(topic.id) ||
                                                                             matchingTopicKeys.has(`${modKey}__${topic.slug || topic.id}`) ||
                                                                             topic.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                                                                             topic.displayLabel?.toLowerCase().includes(searchQuery.toLowerCase().trim())
                                                                         ));

                                                                         return (
                                                                             <button
                                                                                 key={topic.id || topic.slug || tIdx}
                                                                                 type="button"
                                                                                 onClick={(e) => handleTopicClick(subject, mod, topic, e)}
                                                                                 style={{
                                                                                     width: '100%',
                                                                                     textAlign: 'left',
                                                                                     display: 'flex',
                                                                                     alignItems: 'center',
                                                                                     gap: '6px',
                                                                                     height: '26px',
                                                                                     padding: '0 8px 0 7px',
                                                                                     borderRadius: isTopicActive ? '0 4px 4px 0' : '4px',
                                                                                     fontSize: '11px',
                                                                                     fontWeight: isTopicActive ? 650 : (isTopicMatch ? 600 : 450),
                                                                                     background: isTopicActive 
                                                                                         ? (isDark ? 'rgba(255, 255, 255, 0.055)' : '#F1F5F9') 
                                                                                         : (isTopicMatch 
                                                                                             ? (isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(5, 150, 105, 0.08)') 
                                                                                             : 'transparent'),
                                                                                     color: isTopicActive 
                                                                                         ? (isDark ? '#EDEDED' : '#0F172A') 
                                                                                         : (isTopicMatch 
                                                                                             ? (isDark ? '#34D399' : '#059669') 
                                                                                             : (isDark ? '#B5B5B5' : '#475569')),
                                                                                     borderLeft: isTopicActive
                                                                                         ? (isDark ? '2px solid #34D399' : '2px solid #059669')
                                                                                         : (isTopicMatch 
                                                                                             ? (isDark ? '2px solid rgba(52, 211, 153, 0.65)' : '2px solid rgba(5, 150, 105, 0.65)') 
                                                                                             : '2px solid transparent'),
                                                                                     borderTop: 'none',
                                                                                     borderRight: 'none',
                                                                                     borderBottom: 'none',
                                                                                     cursor: 'pointer',
                                                                                     transition: 'all 0.15s ease'
                                                                                 }}
                                                                                 className={isTopicActive ? '' : (isDark ? 'hover:text-[#EDEDED] hover:bg-white/[0.04]' : 'hover:text-slate-900 hover:bg-slate-100')}
                                                                                 title={topic.title}
                                                                             >
                                                                                 {/* Document Icon */}
                                                                                 <FileText 
                                                                                     size={12} 
                                                                                     style={{ 
                                                                                         color: (isTopicActive || isTopicMatch)
                                                                                             ? (isDark ? '#34D399' : '#059669') 
                                                                                             : (isDark ? '#737373' : '#94A3B8'),
                                                                                         flexShrink: 0 
                                                                                     }} 
                                                                                 />
                                                                                 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                                     {topic.displayLabel || topic.title || topic.name || topic}
                                                                                 </span>
                                                                                {isTopicCompleted && (
                                                                                    <Check 
                                                                                        size={11} 
                                                                                        strokeWidth={2.5} 
                                                                                        style={{ 
                                                                                            color: isDark ? '#34D399' : '#059669',
                                                                                            opacity: 0.9,
                                                                                            flexShrink: 0,
                                                                                            marginLeft: 'auto'
                                                                                        }} 
                                                                                        title="Completed"
                                                                                    />
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── 4. Bottom Controls & Profile Card ──────────────────────── */}
            <div 
                style={{
                    padding: '10px 12px 12px 12px',
                    borderTop: `1px solid ${t.footerBorder}`,
                    background: t.footerBg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flexShrink: 0
                }}
            >
                {/* ── Bottom Navigation: [ Home ] [ Plus ] [ Dark/Light ] ── */}
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                    }}
                >
                    {/* Home */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onCloseMobileDrawer) onCloseMobileDrawer();
                            navigate('/home');
                        }}
                        style={{
                            flex: 1,
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '6px',
                            background: t.btnHomeBg,
                            border: `1px solid ${t.btnHomeBorder}`,
                            color: t.btnHomeText,
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.15s, border-color 0.15s'
                        }}
                        className={isDark ? "hover:bg-white/[0.08] hover:text-white" : "hover:bg-slate-100 hover:text-slate-900"}
                        title="Home"
                    >
                        <GlobalHomeIcon size={13} color="currentColor" />
                        <span>Home</span>
                    </button>

                    {/* Plus */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onCloseMobileDrawer) onCloseMobileDrawer();
                            navigate('/plus');
                        }}
                        style={{
                            flex: 1,
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '6px',
                            background: t.btnPlusBg,
                            border: `1px solid ${t.btnPlusBorder}`,
                            color: t.btnPlusText,
                            fontSize: '11px',
                            fontWeight: 650,
                            cursor: 'pointer',
                            transition: 'background 0.15s, border-color 0.15s'
                        }}
                        className={isDark ? "hover:bg-white/[0.08] hover:text-white" : "hover:bg-purple-100/70 hover:text-purple-900"}
                        title="Plus Workspace"
                    >
                        <PlusDashboardIcon size={12} color={t.btnPlusIcon} />
                        <span>Plus</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            background: t.btnThemeBg,
                            border: `1px solid ${t.btnThemeBorder}`,
                            color: t.btnThemeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.15s, border-color 0.15s'
                        }}
                        className={isDark ? "hover:bg-white/[0.08]" : "hover:bg-slate-100"}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
                    </button>
                </div>

                {/* ── 5. User Profile Card ───────────────────────────────── */}
                <button
                    type="button"
                    onClick={() => {
                        if (onCloseMobileDrawer) onCloseMobileDrawer();
                        navigate('/profile');
                    }}
                    style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: t.profileBg,
                        border: `1px solid ${t.profileBorder}`,
                        boxShadow: t.profileShadow,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        transition: 'all 0.15s ease'
                    }}
                    className={isDark ? "hover:bg-white/[0.05] hover:border-neutral-700 group" : "hover:bg-purple-50/50 hover:border-purple-300 group"}
                    title="View profile"
                >
                    {/* Avatar */}
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: t.profileAvatarBg,
                            border: `1px solid ${t.profileAvatarBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: t.profileAvatarText,
                            fontSize: '11px',
                            fontWeight: 750
                        }}
                    >
                        {profilePic && !imgError ? (
                            <img
                                src={getProfilePicUrl(profilePic)}
                                alt={user?.name || 'Profile'}
                                onError={() => setImgError(true)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span>{initials}</span>
                        )}
                    </div>

                    {/* User Name & Branch */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 650,
                                color: t.profileName,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.25
                            }}
                        >
                            {typeof user?.name === 'string' ? user.name : 'Student Account'}
                        </div>
                        <div
                            style={{
                                fontSize: '10.5px',
                                fontWeight: 550,
                                color: t.profileBranch,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: '1px'
                            }}
                        >
                            {userBranchDisplay}
                            {userSectionDisplay ? ` • Sec ${userSectionDisplay}` : ''}
                        </div>
                    </div>

                    {/* Right Chevron Affordance */}
                    <ChevronRight
                        size={14}
                        style={{ color: t.profileChevron, flexShrink: 0 }}
                        className={isDark ? "group-hover:text-white transition-colors" : "group-hover:text-purple-900 transition-colors"}
                    />
                </button>
            </div>
        </aside>
    );
};

export default MySubjectsSidebar;
