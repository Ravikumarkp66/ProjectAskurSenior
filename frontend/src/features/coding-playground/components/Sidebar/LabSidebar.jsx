import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronDown, ChevronRight, 
    CheckCircle2, Circle, Search, PanelLeftClose, 
    PanelLeftOpen, Terminal, X, FlaskConical 
} from 'lucide-react';
import { useAuth } from '../../../../utils/hooks';
import Logo, { ASLogo } from '../../../../components/Logo';

// Navigation SVG Icons
const HomeIcon = ({ size = 15, color = "#60A5FA" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const PlusIcon = ({ size = 15, color = "#A855F7" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
    </svg>
);

const LabIcon = ({ size = 15, color = "#C084FC" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31a2 2 0 0 1-.45 1.26L4.22 17.2A2 2 0 0 0 5.76 20h12.48a2 2 0 0 0 1.54-2.8l-5.33-6.63A2 2 0 0 1 14 9.31V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
    </svg>
);

const ThemeMoonIcon = ({ size = 13, color = "#858585" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const ThemeSunIcon = ({ size = 13, color = "#F59E0B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

// High-Visibility Language Identity Icons (Dark & Light Accessible)
const RenderLanguageIcon = ({ slug, badge, isSelected, isDark }) => {
    const key = (badge || slug || '').toLowerCase();
    if (key.includes('python') || key.includes('plc6')) {
        return (
            <div style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: isDark ? 'rgba(250, 204, 21, 0.18)' : 'rgba(202, 138, 4, 0.12)',
                border: isDark ? '1px solid rgba(250, 204, 21, 0.5)' : '1px solid rgba(202, 138, 4, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <span style={{ fontSize: 13 }}>🐍</span>
            </div>
        );
    }
    if (key.includes('plc5')) {
        return (
            <div style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(37, 99, 235, 0.12)',
                border: isDark ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(37, 99, 235, 0.35)',
                color: isDark ? '#60A5FA' : '#2563EB',
                fontWeight: 900,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"JetBrains Mono", monospace',
                flexShrink: 0
            }}>
                C
            </div>
        );
    }
    // Default PSCL5 / C Lab
    return (
        <div style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.12)',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(2, 132, 199, 0.35)',
            color: isDark ? '#38BDF8' : '#0284C7',
            fontWeight: 900,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            flexShrink: 0
        }}>
            C
        </div>
    );
};

const LabSidebar = ({
    languages = [],
    activeLanguageSlug,
    activeLabId,
    activeProblemId,
    onSelectProgram,
    isCollapsed,
    onToggleCollapse,
    isLoading = false,
    theme = 'dark',
    onToggleTheme
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const profilePic = user?.profilePicture || user?.avatar || user?.picture || user?.photo || '';

    useEffect(() => {
        setImgError(false);
    }, [profilePic]);

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    const [expandedLanguages, setExpandedLanguages] = useState({});
    const [expandedLabs, setExpandedLabs] = useState({});

    // By default all should be closed, ONLY open the language track and the specific lab folder containing the active problem
    useEffect(() => {
        if (!languages || languages.length === 0) return;
        
        let foundLangSlug = null;
        let foundLabKey = null;

        // 1. First priority: Find the lab that contains the active problem
        if (activeProblemId) {
            for (const lang of languages) {
                for (const lab of (lang.labs || [])) {
                    const hasMatchingProg = (lab.programs || []).some(
                        p => p.id === activeProblemId || p.slug === activeProblemId || p._id === activeProblemId
                    );
                    if (hasMatchingProg) {
                        foundLangSlug = lang.slug;
                        foundLabKey = `${lang.slug}_${lab.id}`;
                        break;
                    }
                }
                if (foundLabKey) break;
            }
        }

        // 2. Fallback to activeLabId if no problem match was found
        if (!foundLabKey && activeLabId) {
            for (const lang of languages) {
                const targetLab = (lang.labs || []).find(l => l.id === activeLabId || l._id === activeLabId);
                if (targetLab) {
                    foundLangSlug = lang.slug;
                    foundLabKey = `${lang.slug}_${targetLab.id}`;
                    break;
                }
            }
        }

        if (foundLangSlug && foundLabKey) {
            setExpandedLanguages({ [foundLangSlug]: true });
            setExpandedLabs({ [foundLabKey]: true });
        }
    }, [languages, activeLabId, activeProblemId]);

    const toggleLanguage = (langSlug) => {
        setExpandedLanguages(prev => ({
            ...prev,
            [langSlug]: !prev[langSlug]
        }));
    };

    const toggleLab = (labId) => {
        setExpandedLabs(prev => ({
            ...prev,
            [labId]: !prev[labId]
        }));
    };

    const filteredLanguages = useMemo(() => {
        if (!languages || languages.length === 0) return [];

        return languages.map(lang => {
            const labs = lang.labs || [];
            const matchingLabs = [];

            for (const lab of labs) {
                const programs = lab.programs || [];
                const matchingPrograms = programs.filter(prog => {
                    if (!searchQuery.trim()) return true;
                    return (
                        prog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        prog.concepts?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        `program ${prog.programNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                });

                if (matchingPrograms.length > 0) {
                    matchingLabs.push({
                        ...lab,
                        programs: matchingPrograms
                    });
                }
            }

            return {
                ...lang,
                labs: matchingLabs
            };
        }).filter(lang => lang.labs.length > 0);
    }, [languages, searchQuery]);

    // Distinct language border/bg for active language in Dark and Light themes
    const getLanguageSelectionStyle = (slug, isSelected) => {
        if (!isSelected) return { background: 'transparent', borderLeft: '3px solid transparent' };
        if (isDark) {
            switch (slug?.toLowerCase()) {
                case 'c': return { background: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid #38BDF8' };
                case 'cpp': return { background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid #6366F1' };
                case 'java': return { background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #F59E0B' };
                case 'python': return { background: 'rgba(59, 130, 246, 0.08)', borderLeft: '3px solid #3B82F6' };
                default: return { background: 'rgba(168, 85, 247, 0.08)', borderLeft: '3px solid #A855F7' };
            }
        } else {
            switch (slug?.toLowerCase()) {
                case 'c': return { background: 'rgba(2, 132, 199, 0.06)', borderLeft: '3px solid #0284C7' };
                case 'cpp': return { background: 'rgba(79, 70, 229, 0.06)', borderLeft: '3px solid #4F46E5' };
                case 'java': return { background: 'rgba(217, 119, 6, 0.06)', borderLeft: '3px solid #D97706' };
                case 'python': return { background: 'rgba(37, 99, 235, 0.06)', borderLeft: '3px solid #2563EB' };
                default: return { background: 'rgba(126, 34, 206, 0.06)', borderLeft: '3px solid #7E22CE' };
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // COLLAPSED SIDEBAR
    // ─────────────────────────────────────────────────────────────
    if (isCollapsed) {
        return (
            <aside style={{
                width: 68,
                backgroundColor: isDark ? '#0B0B0B' : '#FFFFFF',
                borderRight: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 8px 12px 8px',
                height: '100vh',
                position: 'relative',
                flexShrink: 0,
                boxSizing: 'border-box',
                zIndex: 30,
                transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}>
                {/* Top: Logo + Open Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0 2px'
                    }}>
                        <div 
                            onClick={() => navigate('/plus')} 
                            title="AskUrSenior" 
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <ASLogo size={22} primaryColor={isDark ? "#FFFFFF" : "#111827"} accentColor={isDark ? "#A855F7" : "#7C3AED"} />
                        </div>

                        <button
                            onClick={onToggleCollapse}
                            title="Open Sidebar"
                            style={{
                                background: isDark ? '#111111' : '#F3F4F6',
                                border: isDark ? '1px solid #222222' : '1px solid #E5E7EB',
                                color: isDark ? '#858585' : '#6B7280',
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? '#1C1C1C' : '#E5E7EB';
                                e.currentTarget.style.color = isDark ? '#FFFFFF' : '#111827';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? '#111111' : '#F3F4F6';
                                e.currentTarget.style.color = isDark ? '#858585' : '#6B7280';
                            }}
                        >
                            <PanelLeftOpen size={14} />
                        </button>
                    </div>

                    <div style={{ width: '80%', height: 1, backgroundColor: isDark ? '#1A1A1A' : '#E5E7EB' }} />

                    {/* Navigation Buttons: Home, Plus, Lab */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                        {/* Home */}
                        <button
                            onClick={() => navigate('/')}
                            title="Home"
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: isDark ? '#111111' : '#F3F4F6',
                                border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                color: isDark ? '#60A5FA' : '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <HomeIcon size={16} color={isDark ? "#60A5FA" : "#2563EB"} />
                        </button>

                        {/* Plus */}
                        <button
                            onClick={() => navigate('/plus')}
                            title="Plus Dashboard"
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: isDark ? '#111111' : '#F3F4F6',
                                border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                color: isDark ? '#A855F7' : '#7C3AED',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <PlusIcon size={16} color={isDark ? "#A855F7" : "#7C3AED"} />
                        </button>

                        {/* Lab (Active Section) */}
                        <button
                            title="College Labs (Active Section)"
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: isDark ? '#181424' : '#F3E8FF',
                                border: isDark ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(124, 58, 237, 0.4)',
                                color: isDark ? '#C084FC' : '#7E22CE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'default'
                            }}
                        >
                            <LabIcon size={16} color={isDark ? "#C084FC" : "#7E22CE"} />
                        </button>
                    </div>
                </div>

                {/* Bottom Profile Avatar */}
                <button
                    onClick={() => navigate('/profile')}
                    title={user?.name || 'Student Profile'}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#16131F' : '#F3E8FF',
                        border: isDark ? '1px solid #333333' : '1px solid #E5E7EB',
                        color: isDark ? '#FFFFFF' : '#7E22CE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.15s ease'
                    }}
                >
                    {profilePic && !imgError ? (
                        <img
                            src={getProfilePicUrl(profilePic)}
                            alt="Avatar"
                            onError={() => setImgError(true)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                </button>
            </aside>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // EXPANDED SIDEBAR
    // ─────────────────────────────────────────────────────────────
    return (
        <aside style={{
            width: 270,
            backgroundColor: isDark ? '#0B0B0B' : '#FFFFFF',
            borderRight: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            flexShrink: 0,
            userSelect: 'none',
            boxSizing: 'border-box',
            zIndex: 30,
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}>
            {/* 1. TOP HEADER */}
            <div style={{
                padding: '12px 14px',
                borderBottom: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Logo 
                            size={20} 
                            showText={true} 
                            primaryColor={isDark ? "#FFFFFF" : "#111827"} 
                            accentColor={isDark ? "#A855F7" : "#7C3AED"} 
                            onClick={() => navigate('/plus')} 
                        />
                    </div>

                    {/* Top Right Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                            onClick={() => setIsSearchOpen(prev => !prev)}
                            title="Search labs & algorithms"
                            style={{
                                background: isSearchOpen || searchQuery 
                                    ? (isDark ? '#1C1C1C' : '#E5E7EB')
                                    : (isDark ? '#111111' : '#F3F4F6'),
                                border: isSearchOpen || searchQuery 
                                    ? (isDark ? '1px solid #333333' : '1px solid #D1D5DB')
                                    : (isDark ? '1px solid #202020' : '1px solid #E5E7EB'),
                                color: isSearchOpen || searchQuery 
                                    ? (isDark ? '#FFFFFF' : '#111827')
                                    : (isDark ? '#858585' : '#6B7280'),
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Search size={13} />
                        </button>

                        <button
                            onClick={onToggleCollapse}
                            title="Collapse Sidebar"
                            style={{
                                background: isDark ? '#111111' : '#F3F4F6',
                                border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                color: isDark ? '#858585' : '#6B7280',
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <PanelLeftClose size={13} />
                        </button>
                    </div>
                </div>

                {/* Expandable Search Input */}
                {(isSearchOpen || searchQuery) && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: isDark ? '#070707' : '#F3F4F6',
                        border: isDark ? '1px solid #252525' : '1px solid #E5E7EB',
                        borderRadius: 6,
                        padding: '5px 8px',
                        gap: 6
                    }}>
                        <Search size={12} color={isDark ? "#707070" : "#9CA3AF"} />
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={searchQuery}
                            autoFocus
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: isDark ? '#FFFFFF' : '#111827',
                                fontSize: 12,
                                width: '100%',
                                fontFamily: 'Outfit, sans-serif'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: isDark ? '#707070' : '#6B7280',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex'
                                }}
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 2. MIDDLE: SCROLLABLE CURRICULUM TREE */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
            }}>
                {isLoading ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: isDark ? '#555555' : '#9CA3AF', fontSize: 12 }}>
                        Loading curriculum...
                    </div>
                ) : filteredLanguages.length === 0 ? (
                    <div style={{
                        padding: '30px 16px',
                        textAlign: 'center',
                        color: isDark ? '#555555' : '#9CA3AF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <Terminal size={18} color={isDark ? "#444444" : "#D1D5DB"} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#858585' : '#6B7280' }}>
                            {searchQuery ? 'No matching programs' : 'No programs available'}
                        </span>
                    </div>
                ) : (
                    filteredLanguages.map(lang => {
                        const isLangExpanded = Boolean(expandedLanguages[lang.slug]);
                        const isSelectedLanguage = activeLanguageSlug === lang.slug;
                        const langStyle = getLanguageSelectionStyle(lang.slug, isSelectedLanguage);

                        return (
                            <div key={lang.slug || lang.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Language Row */}
                                <div
                                    onClick={() => toggleLanguage(lang.slug)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 8px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        backgroundColor: langStyle.background,
                                        borderLeft: langStyle.borderLeft
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelectedLanguage) e.currentTarget.style.backgroundColor = isDark ? '#141414' : '#F3F4F6';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelectedLanguage) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                        <RenderLanguageIcon 
                                            slug={lang.slug}
                                            badge={lang.badge}
                                            isSelected={isSelectedLanguage} 
                                            isDark={isDark}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {lang.badge && (
                                                    <span style={{
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                                                        color: isDark ? '#D1D5DB' : '#374151',
                                                        padding: '1px 5px',
                                                        borderRadius: 4
                                                    }}>
                                                        [{lang.badge}]
                                                    </span>
                                                )}
                                                <span style={{
                                                    fontSize: 13,
                                                    fontWeight: isSelectedLanguage ? 800 : 700,
                                                    color: isDark ? '#FFFFFF' : '#111827',
                                                    fontFamily: 'Outfit, sans-serif',
                                                    letterSpacing: '-0.01em'
                                                }}>
                                                    {lang.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', color: isDark ? '#707070' : '#9CA3AF' }}>
                                        {isLangExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                </div>

                                {/* Nested Labs & Programs */}
                                {isLangExpanded && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        paddingLeft: 12,
                                        marginTop: 2,
                                        borderLeft: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                                        marginLeft: 11,
                                        gap: 2
                                    }}>
                                        {lang.labs?.map(lab => {
                                            const labKey = `${lang.slug}_${lab.id}`;
                                            const isLabExpanded = Boolean(expandedLabs[labKey]);

                                            return (
                                                <div key={lab.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {/* Lab Header - Full width clickable button with larger text & icon */}
                                                    <div
                                                        onClick={() => toggleLab(labKey)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '8px 10px',
                                                            borderRadius: 6,
                                                            cursor: 'pointer',
                                                            backgroundColor: isLabExpanded 
                                                                ? (isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(124, 58, 237, 0.06)') 
                                                                : 'transparent',
                                                            border: isLabExpanded
                                                                ? (isDark ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(124, 58, 237, 0.2)')
                                                                : (isDark ? '1px solid transparent' : '1px solid transparent'),
                                                            color: isDark ? '#E5E7EB' : '#111827',
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            fontFamily: 'Outfit, sans-serif',
                                                            transition: 'all 0.15s ease',
                                                            userSelect: 'none',
                                                            width: '100%',
                                                            boxSizing: 'border-box'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isLabExpanded) e.currentTarget.style.backgroundColor = isDark ? '#161616' : '#F3F4F6';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isLabExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 4,
                                                                backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                <FlaskConical size={14} color={isDark ? "#C084FC" : "#7C3AED"} />
                                                            </div>
                                                            <span style={{
                                                                color: isDark ? '#F3F4F6' : '#111827',
                                                                fontSize: 13,
                                                                fontWeight: 700,
                                                                letterSpacing: '-0.01em'
                                                            }}>
                                                                Lab {lab.labNumber}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                                                                color: isDark ? '#9CA3AF' : '#4B5563',
                                                                padding: '1px 6px',
                                                                borderRadius: 10
                                                            }}>
                                                                {lab.programs?.length || 0}
                                                            </span>
                                                            {isLabExpanded ? <ChevronDown size={14} color={isDark ? "#A855F7" : "#7C3AED"} /> : <ChevronRight size={14} color={isDark ? "#666666" : "#9CA3AF"} />}
                                                        </div>
                                                    </div>

                                                    {/* Program Items */}
                                                    {isLabExpanded && (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            paddingLeft: 4,
                                                            gap: 1,
                                                            marginTop: 1
                                                        }}>
                                                            {lab.programs?.map(prog => {
                                                                const isSelected = activeProblemId === prog.id || activeProblemId === prog.slug;
                                                                const isDone = !!prog.isCompleted;

                                                                return (
                                                                    <button
                                                                        key={prog.id}
                                                                        onClick={() => onSelectProgram(lang.languageSlug || (lang.slug?.includes('python') ? 'python' : 'c'), lab.id, prog.slug || prog.id, lang.slug)}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            padding: '7px 10px',
                                                                            borderRadius: 4,
                                                                            border: 'none',
                                                                            borderLeft: isSelected 
                                                                                ? (isDark ? '3px solid #A855F7' : '3px solid #7E22CE')
                                                                                : '3px solid transparent',
                                                                            backgroundColor: isSelected 
                                                                                ? (isDark ? '#181424' : '#F3E8FF')
                                                                                : 'transparent',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left',
                                                                            transition: 'all 0.15s ease',
                                                                            width: '100%'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (!isSelected) e.currentTarget.style.backgroundColor = isDark ? '#141414' : '#F3F4F6';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                                                        }}
                                                                    >
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 7,
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {isDone ? (
                                                                                <CheckCircle2 size={12} color={isDark ? "#22C55E" : "#16A34A"} style={{ flexShrink: 0 }} />
                                                                            ) : isSelected ? (
                                                                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isDark ? '#A855F7' : '#7E22CE', flexShrink: 0 }} />
                                                                            ) : (
                                                                                <Circle size={8} color={isDark ? "#444444" : "#D1D5DB"} style={{ flexShrink: 0 }} />
                                                                            )}
                                                                            <span style={{
                                                                                fontSize: 12,
                                                                                fontWeight: isSelected ? 700 : 500,
                                                                                color: isSelected 
                                                                                    ? (isDark ? '#FFFFFF' : '#111827')
                                                                                    : (isDone 
                                                                                        ? (isDark ? '#D0D0D0' : '#374151') 
                                                                                        : (isDark ? '#858585' : '#6B7280')),
                                                                                fontFamily: 'Outfit, sans-serif',
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis'
                                                                            }}>
                                                                                P{prog.programNumber}. {prog.title}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. BOTTOM CONTROLS: [PLUS] [LAB] [THEME] + PROFILE */}
            <div style={{
                borderTop: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                backgroundColor: isDark ? '#0B0B0B' : '#FFFFFF',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0
            }}>
                {/* Action Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 6
                }}>
                    {/* Plus */}
                    <button
                        onClick={() => navigate('/plus')}
                        title="Plus Dashboard"
                        style={{
                            background: isDark ? '#111111' : '#F3F4F6',
                            border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                            borderRadius: 6,
                            padding: '6px 4px',
                            color: isDark ? '#A855F7' : '#7C3AED',
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? 'rgba(168, 85, 247, 0.15)' : '#EDE9FE';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#111111' : '#F3F4F6';
                        }}
                    >
                        <PlusIcon size={12} color={isDark ? "#A855F7" : "#7C3AED"} />
                        <span>Plus</span>
                    </button>

                    {/* Lab (Active Section) */}
                    <button
                        title="Current Section: College Lab Programs"
                        style={{
                            background: isDark ? '#181424' : '#F3E8FF',
                            border: isDark ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(124, 58, 237, 0.4)',
                            borderRadius: 6,
                            padding: '6px 4px',
                            color: isDark ? '#C084FC' : '#7E22CE',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'default'
                        }}
                    >
                        <LabIcon size={12} color={isDark ? "#C084FC" : "#7E22CE"} />
                        <span>Lab</span>
                    </button>

                    {/* Theme (Dark / Light Switcher) */}
                    <button
                        onClick={onToggleTheme}
                        title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
                        style={{
                            background: isDark ? '#111111' : '#F3F4F6',
                            border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                            borderRadius: 6,
                            padding: '6px 4px',
                            color: isDark ? '#858585' : '#111827',
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#1C1C1C' : '#E5E7EB';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#111111' : '#F3F4F6';
                        }}
                    >
                        {isDark ? <ThemeMoonIcon size={12} color="#858585" /> : <ThemeSunIcon size={12} color="#D97706" />}
                        <span>{isDark ? 'Dark' : 'Light'}</span>
                    </button>
                </div>

                {/* Profile Row */}
                <button
                    onClick={() => navigate('/profile')}
                    title="View Student Profile"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isDark ? '#111111' : '#F9FAFB',
                        border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        width: '100%',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1C1C1C' : '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#111111' : '#F9FAFB'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: isDark ? '#16131F' : '#F3E8FF',
                            border: isDark ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(124, 58, 237, 0.3)',
                            color: isDark ? '#FFFFFF' : '#7E22CE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}>
                            {profilePic && !imgError ? (
                                <img
                                    src={getProfilePicUrl(profilePic)}
                                    alt="Avatar"
                                    onError={() => setImgError(true)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: isDark ? '#FFFFFF' : '#111827',
                                fontFamily: 'Outfit, sans-serif',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user?.name || 'Student Account'}
                            </span>
                            <span style={{
                                fontSize: 9.5,
                                color: isDark ? '#707070' : '#6B7280',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user?.branch || user?.usn || user?.email || 'AskUrSenior Plus'}
                            </span>
                        </div>
                    </div>

                    <ChevronRight size={13} color={isDark ? "#555555" : "#9CA3AF"} />
                </button>
            </div>
        </aside>
    );
};

export default LabSidebar;
