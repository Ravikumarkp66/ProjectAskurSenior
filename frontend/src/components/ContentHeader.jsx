import React from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   CONTENT HEADER — Responsive Header (Desktop: Original, Mobile: Compact "Subjects ▼" + Title below tabs)
═══════════════════════════════════════════════════════════════════ */
const ContentHeader = ({
    subjectName,
    subjectCode,
    user,
    activeTab,
    tabLabel,
    onOpenSubjectsModal,
    isSubjectsOpen,
    onToggleSubjectsModal,
    children // The tabs
}) => {
    return (
        <>
            {/* ════ DESKTOP HEADER (≥ 768px) ════ */}
            <div
                className="content-sticky-header hidden md:block"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    background: 'var(--content-tabs-bg)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    borderBottom: '1px solid var(--content-tabs-border)',
                    padding: '24px 24px 0 28px',
                    margin: '0 -24px 24px -28px',
                }}
            >
                {/* Subject name (Top Row) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 24 }}>
                    <div style={{
                        width: 3,
                        height: 48,
                        borderRadius: 99,
                        background: 'linear-gradient(180deg, #00f5b8, #7c3aed)',
                        flexShrink: 0,
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <h2
                            style={{
                                color: 'var(--theme-text)',
                                fontSize: 'clamp(22px, 3vw, 28px)',
                                fontWeight: 750,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.1,
                                margin: 0,
                            }}
                        >
                            {subjectName || 'Subject'}
                        </h2>
                        {subjectCode && subjectCode !== '—' && (
                            <span style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--theme-text-muted)',
                                letterSpacing: '0.02em',
                            }}>
                                {subjectCode}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 16,
                    gap: 16,
                }}>
                    {children}
                </div>
            </div>

            {/* ════ MOBILE HEADER (< 768px) ════ */}
            <div className="block md:hidden">
                {/* Tabs Row (Horizontally Scrollable) */}
                <div style={{
                    padding: '0 0 12px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '16px'
                }}>
                    {children}
                </div>

                {/* Selected Subject Title (Below Tabs on Mobile) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    marginBottom: '18px',
                    padding: '0 4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: 3,
                            height: 24,
                            borderRadius: 99,
                            background: 'linear-gradient(180deg, #00f5b8, #7c3aed)',
                            flexShrink: 0
                        }} />
                        <h2 style={{
                            color: 'var(--theme-text, #fff)',
                            fontSize: '20px',
                            fontWeight: 750,
                            letterSpacing: '-0.02em',
                            margin: 0,
                            lineHeight: 1.2
                        }}>
                            {subjectName || 'Subject'}
                        </h2>
                    </div>
                    {subjectCode && subjectCode !== '—' && (
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--theme-text-muted, rgba(148, 163, 184, 0.65))',
                            paddingLeft: '11px'
                        }}>
                            {subjectCode}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};

export default ContentHeader;
