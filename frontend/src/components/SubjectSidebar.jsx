import React, { useEffect } from 'react';
import SubjectSearch from './SubjectSearch';
import SubjectList from './SubjectList';
import SubjectFooter from './SubjectFooter';
import { ASLogo } from './Logo';

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT SIDEBAR — Premium navigation rail
   300px expanded / 80px collapsed
═══════════════════════════════════════════════════════════════════ */

/* ── Chevron-in-circle collapse button ── */
const CollapseBtn = ({ isCollapsed, onClick, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="expand-toggle-btn"
        style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid rgba(139,92,246,0.18)',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'rgba(148,163,184,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
    >
        {/* Chevron — points left when expanded (to collapse), right when collapsed (to expand) */}
        <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2.3}
            strokeLinecap="round" strokeLinejoin="round"
            style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                display: 'block',
            }}
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    </button>
);

/* ── Collapsed rail nav icons ── */
const HomeIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const TrackIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

/* ════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════ */
const SubjectSidebar = ({
    search,
    onSearchChange,
    subjects,
    activeId,
    onSelectSubject,
    loading,
    onHome,
    onTrack,
    user,
    isCollapsed,
    onToggleCollapse,
    pinnedIds = [],
    onTogglePin,
    isHomeActive,
    isTrackActive
}) => {

    /* ── Ctrl+K → focus / select-all search ── */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                const el = document.querySelector('.subject-search-input');
                if (!el) return;
                e.preventDefault();
                el.focus();
                el.select();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* ════════════════════════════════════════
       COLLAPSED RAIL
    ════════════════════════════════════════ */
    if (isCollapsed) {
        return (
            <div
                className="subject-sidebar"
                style={{
                    position: 'relative', width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    background: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--sidebar-border)',
                    transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', flexDirection: 'row',
                    alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '10px 8px',
                    boxSizing: 'border-box', flexShrink: 0,
                }}>
                    <div onClick={() => { window.location.href = '/'; }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="AskUrSenior">
                        <ASLogo size={38} style={{ filter: 'drop-shadow(0 0 7px rgba(139,92,246,0.4))' }} />
                    </div>
                    <CollapseBtn isCollapsed={isCollapsed} onClick={onToggleCollapse} title="Expand sidebar" />
                </div>

                <div style={{ borderBottom: '1px solid var(--sidebar-border)', margin: '0 8px 12px', flexShrink: 0 }} />

                {/* Home + Track */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 9px', flexShrink: 0 }}>
                    <button onClick={onHome} className="collapsed-nav-item" title="Plus">
                        <div className={`collapsed-nav-icon-container ${isHomeActive ? 'active' : ''}`}>
                            <HomeIcon />
                        </div>
                        <span className={`collapsed-nav-label ${isHomeActive ? 'active' : ''}`}>Plus</span>
                    </button>
                    <button onClick={onTrack} className="collapsed-nav-item" title="Track">
                        <div className={`collapsed-nav-icon-container ${isTrackActive ? 'active' : ''}`}>
                            <TrackIcon />
                        </div>
                        <span className={`collapsed-nav-label ${isTrackActive ? 'active' : ''}`}>Track</span>
                    </button>
                </div>

                <div style={{ flex: 1 }} />

                {/* Collapsed dock (icon-only) */}
                <div style={{
                    padding: '10px 9px',
                    borderTop: '1px solid var(--sidebar-border)',
                    flexShrink: 0,
                }}>
                    <SubjectFooter
                        onHome={onHome} onTrack={onTrack}
                        isCollapsed={true}
                        isHomeActive={isHomeActive} isTrackActive={isTrackActive}
                    />
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════
       EXPANDED SIDEBAR
    ════════════════════════════════════════ */
    return (
        <div
            className="subject-sidebar"
            style={{
                position: 'relative', width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
                transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
            }}
        >
            {/* ── Header: Logo + Collapse ── */}
            <div style={{
                display: 'flex', flexDirection: 'row',
                alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '11px 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                boxSizing: 'border-box', flexShrink: 0,
            }}>
                <div
                    onClick={() => { window.location.href = '/'; }}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="AskUrSenior Home"
                >
                    <ASLogo
                        size={48}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.45))' }}
                    />
                </div>
                <CollapseBtn isCollapsed={isCollapsed} onClick={onToggleCollapse} title="Collapse sidebar" />
            </div>

            {/* ── Search ── */}
            <SubjectSearch value={search} onChange={onSearchChange} />

            {/* ── Subject list ── */}
            <SubjectList
                subjects={subjects}
                activeId={activeId}
                onSelect={onSelectSubject}
                loading={loading}
                pinnedIds={pinnedIds}
                onTogglePin={onTogglePin}
            />

            {/* ── Bottom dock ── */}
            <div style={{ marginTop: 'auto', flexShrink: 0 }}>
                <SubjectFooter
                    onHome={onHome} onTrack={onTrack}
                    isCollapsed={false}
                    isHomeActive={isHomeActive} isTrackActive={isTrackActive}
                />
            </div>
        </div>
    );
};

export default SubjectSidebar;
