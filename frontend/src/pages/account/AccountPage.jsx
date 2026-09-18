import React from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutList, 
    ShieldCheck, 
    History,
    ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AccountSummarySection from './sections/AccountSummarySection';
import AccountSecuritySection from './sections/AccountSecuritySection';
import AccountLoginHistorySection from './sections/AccountLoginHistorySection';

export const ACCOUNT_TABS = [
    { id: 'summary', label: 'Summary', icon: LayoutList },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'login-history', label: 'Login History', icon: History }
];
const TABS = ACCOUNT_TABS;

const AccountPage = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const { tab } = useParams();

    // Default to 'summary' if no tab param or invalid tab
    const activeTab = tab && TABS.some(t => t.id === tab) ? tab : 'summary';

    const handleTabChange = (tabId) => {
        navigate(`/account/${tabId}`);
    };

    const renderSection = () => {
        switch (activeTab) {
            case 'security':
                return <AccountSecuritySection />;
            case 'login-history':
                return <AccountLoginHistorySection />;
            case 'summary':
            default:
                return <AccountSummarySection />;
        }
    };

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 32px)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* ══════════════════════════════════════════════════════════════
                DESKTOP LAYOUT (≥ 768px) — Sidebar + Content Panel
            ══════════════════════════════════════════════════════════════ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: '16px',
                    width: '100%',
                    height: '100%',
                }}
                className="settings-layout-grid"
            >
                {/* ── Left Navigation Column ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        height: '100%',
                        boxSizing: 'border-box'
                    }}
                    className="settings-left-col"
                >
                    {/* Back to Profile link */}
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'rgba(148, 163, 184, 0.65)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            cursor: 'pointer',
                            alignSelf: 'flex-start',
                            background: 'transparent',
                            border: 'none',
                            padding: 0
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)'}
                    >
                        <ArrowLeft size={12} />
                        <span>Back to Profile</span>
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                            Settings
                        </h2>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', fontWeight: 500 }}>
                            Configure your academic profile workspace
                        </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />

                    {/* Navigation list */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        {TABS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleTabChange(item.id)}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        color: isActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.65)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))'
                                            : 'transparent',
                                        border: isActive
                                            ? '1px solid rgba(139, 92, 246, 0.25)'
                                            : '1px solid transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                                        fontSize: '12.5px',
                                        fontWeight: isActive ? 600 : 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none',
                                        transition: 'all 0.18s',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.85)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)';
                                        }
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </motion.div>

                {/* ── Right Content Column ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        boxSizing: 'border-box'
                    }}
                    className="settings-content-col"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderSection()}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE LAYOUT (< 768px) — Mobile Header + Content
            ══════════════════════════════════════════════════════════════ */}
            <div className="mobile-edit-shell">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 16px 12px',
                    boxSizing: 'border-box',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(139,92,246,0.08)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            borderRadius: '8px',
                            color: '#c4b5fd',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '5px 11px',
                            outline: 'none',
                            flexShrink: 0
                        }}
                    >
                        <ArrowLeft size={13} />
                        <span>Back</span>
                    </button>
                    <span style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#fff'
                    }}>
                        Account Settings
                    </span>
                </div>

                {/* Mobile Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '10px 16px',
                    overflowX: 'auto',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(19, 18, 26, 0.3)'
                }}>
                    {TABS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTabChange(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: isActive ? 600 : 500,
                                    whiteSpace: 'nowrap',
                                    color: isActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.65)',
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))'
                                        : 'transparent',
                                    border: isActive
                                        ? '1px solid rgba(139, 92, 246, 0.25)'
                                        : '1px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <Icon size={13} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    background: 'rgba(19, 18, 26, 0.45)'
                }}>
                    {renderSection()}
                </div>
            </div>

            {/* Responsive CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                @media (min-width: 768px) {
                    .settings-layout-grid {
                        display: grid !important;
                    }
                    .mobile-edit-shell {
                        display: none !important;
                    }
                }
                @media (max-width: 767px) {
                    .settings-layout-grid {
                        display: none !important;
                    }
                    .mobile-edit-shell {
                        display: flex !important;
                        flex-direction: column;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: transparent;
                    }
                    .settings-left-col {
                        display: none !important;
                    }
                    .settings-content-col {
                        height: auto !important;
                        min-height: 300px !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AccountPage;
