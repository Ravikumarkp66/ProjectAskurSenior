import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ClipboardList, FolderArchive, ChartColumn, MessagesSquare } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM PILL TABS — GitHub / Linear / Notion style
   Neutral when inactive. Colored when active.
═══════════════════════════════════════════════════════════════════ */

const ICON_PROPS = { size: 17, strokeWidth: 1.75 };

const TAB_META = {
    notes: {
        color: '#10B981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.35)',
        icon: <FileText {...ICON_PROPS} />,
    },
    pyqs: {
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.35)',
        icon: <ClipboardList {...ICON_PROPS} />,
    },
    others: {
        color: '#A855F7',
        bg: 'rgba(168,85,247,0.08)',
        border: 'rgba(168,85,247,0.35)',
        icon: <FolderArchive {...ICON_PROPS} />,
    },
    cie: {
        color: '#0EA5E9',
        bg: 'rgba(14,165,233,0.08)',
        border: 'rgba(14,165,233,0.35)',
        icon: <ChartColumn {...ICON_PROPS} />,
    },
    discussion: {
        color: '#EC4899',
        bg: 'rgba(236,72,153,0.08)',
        border: 'rgba(236,72,153,0.35)',
        icon: <MessagesSquare {...ICON_PROPS} />,
    },
};

const ContentTabs = ({ tabs, activeTab, setActiveTab }) => {
    return (
        <>
            <div
                className="content-tabs-bar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                }}
            >
                {tabs.map(t => {
                    const isActive = activeTab === t.id;
                    const meta = TAB_META[t.id] || { color: t.color, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };

                    return (
                        <motion.button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            whileTap={{ scale: 0.96 }}
                            animate={{ scale: isActive ? 1.03 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '0 16px',
                                height: 42,
                                borderRadius: 9999,
                                border: `1px solid ${isActive ? meta.border : 'transparent'}`,
                                background: isActive ? meta.bg : 'transparent',
                                color: isActive ? meta.color : 'var(--theme-text-muted)',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 500,
                                letterSpacing: isActive ? '0' : '0.01em',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: isActive ? `0 1px 4px rgba(0,0,0,0.05)` : 'none',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--card-btn-secondary-bg)';
                                    e.currentTarget.style.color = 'var(--theme-text)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--theme-text-muted)';
                                }
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.65 }}>
                                {meta.icon}
                            </span>
                            {t.label}
                        </motion.button>
                    );
                })}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 767px) {
                    .content-tabs-bar {
                        overflow-x: auto !important;
                        flex-wrap: nowrap !important;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        padding-bottom: 4px;
                    }
                    .content-tabs-bar::-webkit-scrollbar {
                        display: none;
                    }
                }
                @media (min-width: 768px) {
                    .content-tabs-bar {
                        flex-wrap: wrap !important;
                    }
                }
            `}} />
        </>
    );
};

export default ContentTabs;
