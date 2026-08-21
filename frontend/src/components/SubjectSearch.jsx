import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT SEARCH — Premium Linear/Notion-style search field
   • 46px height, glass-style focus ring
   • Ctrl+K badge (browser safe)
═══════════════════════════════════════════════════════════════════ */
const SubjectSearch = ({ value, onChange, inputRef }) => {
    return (
        <div style={{ padding: '10px 14px 8px' }}>
            <div
                className="subject-search-box"
                style={{
                    background: 'var(--sidebar-search-bg)',
                    border: '1px solid var(--sidebar-search-border)',
                    borderRadius: 12,
                    padding: '0 12px',
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
                onFocusCapture={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)';
                }}
                onBlurCapture={e => {
                    e.currentTarget.style.borderColor = 'var(--sidebar-search-border)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                }}
            >
                {/* Search SVG — slightly larger, consistent stroke */}
                <svg
                    width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'var(--sidebar-search-placeholder)', flexShrink: 0, opacity: 0.7 }}
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <input
                    ref={inputRef}
                    value={value}
                    onChange={onChange}
                    placeholder="Search subjects"
                    className="subject-search-input"
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--sidebar-search-text)',
                        fontSize: 13,
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
                    }}
                />

                {/* Ctrl K badge — browser safe shortcut hint */}
                <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'var(--sidebar-search-placeholder)',
                    background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.12)',
                    borderRadius: 5,
                    padding: '2px 5px',
                    userSelect: 'none',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    opacity: 0.8,
                }}>
                    Ctrl K
                </span>
            </div>
        </div>
    );
};

export default SubjectSearch;
