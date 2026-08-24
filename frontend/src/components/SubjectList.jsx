import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT LIST
   • Typography-only section headers (Linear / Notion style)
   • Minimal SVG pin icon (GitHub/Linear quality)
   • No active dot — left accent border + glass bg + glow
   • Natural 2-line name wrapping
   • Auto-hiding scrollbar via .subject-list-scroll CSS class
═══════════════════════════════════════════════════════════════════ */

/* Minimal pin — thin stroke, filled when pinned */
const PinSVG = ({ pinned }) => (
    <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={pinned ? 0 : 1.8}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
    >
        {/* Thumbtack / pin shape */}
        <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" />
    </svg>
);

const SubjectList = ({ subjects, activeId, onSelect, loading, pinnedIds = [], onTogglePin }) => {

    const renderSubjectItem = (s, isPinned) => {
        const isActive = activeId === s.id;

        return (
            <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(s)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(s);
                    }
                }}
                className={`subject-list-item group w-full text-left rounded-xl cursor-pointer border-none outline-none mb-0.5 flex items-start justify-between gap-2 relative ${isActive ? 'active' : ''}`}
                style={{
                    padding: '8px 10px 8px 13px',
                    color: isActive ? 'var(--sidebar-item-active-text)' : 'var(--sidebar-item-text)',
                    fontWeight: isActive ? 600 : 420,
                    fontSize: 13,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.45,
                    background: isActive ? 'var(--sidebar-item-active-bg)' : 'transparent',
                    borderLeft: isActive
                        ? '2.5px solid var(--sidebar-item-border-left)'
                        : '2.5px solid transparent',
                    boxShadow: isActive
                        ? '0 0 18px rgba(0,245,184,0.05), inset 0 0 0 1px rgba(139,92,246,0.09)'
                        : 'none',
                    backdropFilter: isActive ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isActive ? 'blur(12px)' : 'none',
                    transitionProperty: 'background, border-color, color, box-shadow, backdrop-filter',
                    transitionDuration: '200ms',
                    transitionTimingFunction: 'ease-in-out',
                    userSelect: 'none',
                }}
                onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'var(--sidebar-item-hover-bg)';
                }}
                onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
            >
                {/* Name — wraps naturally, never truncates */}
                <span
                    style={{
                        flex: 1,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {s.name}
                </span>

                {/* Pin button — appears on hover; filled when pinned */}
                {onTogglePin && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onTogglePin(s.id); }}
                        className={`shrink-0 p-1 rounded-md cursor-pointer border-none outline-none flex items-center justify-center transition-all duration-150 mt-0.5 ${
                            isPinned ? 'opacity-80' : 'opacity-0 group-hover:opacity-60'
                        }`}
                        style={{
                            background: 'transparent',
                            color: isPinned
                                ? 'var(--sidebar-item-active-text)'
                                : 'var(--sidebar-item-text)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.opacity = isPinned ? '0.8' : '';
                        }}
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        <PinSVG pinned={isPinned} />
                    </button>
                )}
            </div>
        );
    };

    /* ── Skeleton ── */
    if (loading) {
        return (
            <div style={{ flex: 1, padding: '6px 14px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{
                        height: 34, borderRadius: 10, marginBottom: 5,
                        background: 'rgba(139,92,246,0.05)',
                        animation: 'pulse 1.8s infinite',
                    }} />
                ))}
            </div>
        );
    }

    const pinnedSubjects  = subjects.filter(s => pinnedIds.includes(s.id));
    const regularSubjects = subjects.filter(s => !pinnedIds.includes(s.id));

    /* ── Section label — typography only, no icons ── */
    const SectionLabel = ({ text }) => (
        <div style={{
            padding: '14px 13px 5px',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--sidebar-section-label)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            userSelect: 'none',
            borderBottom: '1px solid var(--sidebar-border)',
            marginBottom: 6,
        }}>
            {text}
        </div>
    );

    return (
        <div
            className="subject-list-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '2px 6px' }}
        >
            {/* Pinned section */}
            {pinnedSubjects.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                    <SectionLabel text="Pinned" />
                    {pinnedSubjects.map(s => renderSubjectItem(s, true))}
                </div>
            )}

            {/* Subjects section */}
            <div>
                {pinnedSubjects.length > 0 && <SectionLabel text="Subjects" />}
                {regularSubjects.length === 0 && pinnedSubjects.length === 0 ? (
                    <div style={{ padding: '28px 12px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.5 }}>🗂️</div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-section-label)', margin: '0 0 4px', letterSpacing: '0.01em' }}>
                            No subjects available yet
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', margin: 0, lineHeight: 1.5 }}>
                            We'll add them soon.
                        </p>
                    </div>
                ) : (
                    regularSubjects.map(s => renderSubjectItem(s, false))
                )}
            </div>
        </div>
    );
};

export default SubjectList;
