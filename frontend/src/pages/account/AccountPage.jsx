import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, 
    ShieldCheck, 
    History,
    ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AccountSummarySection from './sections/AccountSummarySection';
import AccountSecuritySection from './sections/AccountSecuritySection';
import AccountLoginHistorySection from './sections/AccountLoginHistorySection';

export const ACCOUNT_TABS = [
    { id: 'summary', label: 'Plan', icon: CreditCard },
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
        <div 
            style={{
                width: '100%',
                height: 'calc(100vh - 32px)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
            }}
            className="text-slate-900 dark:text-white"
        >
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
                    className="settings-left-col rounded-2xl border p-4 sm:p-5 flex flex-col gap-3.5 h-full box-border transition-all duration-200 bg-white dark:bg-[#0D111C] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl text-slate-900 dark:text-white"
                >
                    {/* Back to Profile link */}
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors cursor-pointer self-start bg-transparent border-0 p-0"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Profile</span>
                    </button>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                            Settings
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Configure your academic profile workspace
                        </span>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-white/[0.08] my-1" />

                    {/* Navigation list */}
                    <nav className="flex flex-col gap-1.5 flex-1">
                        {TABS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleTabChange(item.id)}
                                    className={`w-full text-left py-2.5 px-3 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/30 font-semibold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent font-medium'
                                    }`}
                                >
                                    <Icon size={15} />
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
                    className="settings-content-col rounded-2xl border p-5 sm:p-7 min-w-0 h-full overflow-y-auto box-border transition-all duration-200 bg-white dark:bg-[#0D111C] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl text-slate-900 dark:text-white"
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
                <div className="flex items-center gap-2.5 p-3.5 px-4 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0D111C]/95 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 cursor-pointer shrink-0"
                    >
                        <ArrowLeft size={13} />
                        <span>Back</span>
                    </button>
                    <span className="flex-1 text-center text-sm font-extrabold text-slate-900 dark:text-white">
                        Account Settings
                    </span>
                </div>

                {/* Mobile Tabs */}
                <div className="flex gap-2 p-2.5 px-4 overflow-x-auto border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
                    {TABS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTabChange(item.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-all ${
                                    isActive
                                        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-transparent font-medium'
                                }`}
                            >
                                <Icon size={13} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#0D111C]">
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
