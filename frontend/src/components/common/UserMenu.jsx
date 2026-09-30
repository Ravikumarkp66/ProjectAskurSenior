import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    UserRound, 
    Settings2, 
    Bug, 
    CircleHelp, 
    LogOut, 
    Sun, 
    Moon,
    Plus,
    Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBugReportModal } from '../../context/BugReportModalContext';

const getInitials = (user) => {
    if (!user) return '?';
    if (user.name) {
        return user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
};

const getProfilePicUrl = (pic) => {
    if (!pic) return '';
    if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
        const key = pic.split('/profiles/')[1];
        return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
    }
    if (pic.startsWith('http')) return pic;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${pic.startsWith('/') ? '' : '/'}${pic}`;
};

const UserMenu = ({ direction = 'down', align = 'right' }) => {
    const { user, isAuthenticated, logout, hasPlusAccess } = useAuth();
    const { isDark, themeMode, setThemeMode } = useTheme();
    const { openBugReport } = useBugReportModal();
    const navigate = useNavigate();
    const location = useLocation();

    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const menuRef = useRef(null);

    const profilePic = user?.profilePicture || user?.avatar || user?.picture || user?.photo || '';

    useEffect(() => {
        setImgError(false);
    }, [profilePic]);

    // Automatically close menu immediately on any route / navigation change
    useEffect(() => {
        setOpen(false);
    }, [location.pathname, location.search, location.hash]);

    // Close on outside click or Escape key
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleItemClick = (path) => {
        setOpen(false);
        if (path) {
            navigate(path);
        }
    };

    const handleOpenBugReport = () => {
        setOpen(false);
        openBugReport('UI / Design');
    };

    const handleLogout = () => {
        setOpen(false);
        logout?.();
        navigate('/');
    };

    const initials = getInitials(user);

    const isProfileActive = location.pathname.startsWith('/profile');
    const isAccountActive = location.pathname.startsWith('/account');
    const isSupportActive = location.pathname.startsWith('/support');
    const isAnyUserSectionActive = isProfileActive || isAccountActive || isSupportActive;

    // Positioning styles for dropdown vs dropup
    const popoverPosition = direction === 'up'
        ? { bottom: 'calc(100% + 10px)', left: 0 }
        : align === 'left'
            ? { top: 'calc(100% + 10px)', left: 0 }
            : { top: 'calc(100% + 10px)', right: 0 };

    return (
        <div ref={menuRef} className="relative inline-block text-left z-50">
            {/* Avatar Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer select-none overflow-hidden border ${
                    open
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : isAnyUserSectionActive
                            ? 'border-purple-500/60 ring-2 ring-purple-500/20'
                            : isDark
                                ? 'border-purple-500/30 hover:border-purple-400 bg-purple-950/20'
                                : 'border-purple-200 hover:border-purple-400 bg-purple-50 shadow-sm'
                }`}
                title="Account menu"
                aria-haspopup="true"
                aria-expanded={open}
            >
                {profilePic && !imgError ? (
                    <img
                        src={getProfilePicUrl(profilePic)}
                        alt={user?.name || 'User'}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                    />
                ) : isAuthenticated ? (
                    <span className="text-xs font-bold tracking-tight text-purple-600 dark:text-purple-300">
                        {initials}
                    </span>
                ) : (
                    <UserRound size={16} className="text-purple-600 dark:text-purple-300" strokeWidth={1.75} />
                )}
            </button>

            {/* Dropdown Menu: rendered directly without AnimatePresence to ensure reliable immediate unmount */}
            {open && (
                <motion.div
                    key="user-menu-popover"
                    initial={{ opacity: 0, y: direction === 'up' ? 6 : -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    style={popoverPosition}
                    className={`absolute w-60 rounded-xl border shadow-2xl p-1.5 backdrop-blur-xl z-[9999] ${
                        isDark
                            ? 'bg-[#0B0D14]/95 border-slate-800 text-slate-200 shadow-purple-950/20'
                            : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10'
                    }`}
                >
                    {/* Header: Student Info / Guest Info */}
                    <div className={`px-3 py-2.5 mb-1 rounded-lg border-b ${
                        isDark ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'
                    }`}>
                        <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-xs shrink-0 overflow-hidden">
                                    {profilePic && !imgError ? (
                                        <img
                                            src={getProfilePicUrl(profilePic)}
                                            alt={user?.name || 'User'}
                                            onError={() => setImgError(true)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : isAuthenticated ? (
                                        initials
                                    ) : (
                                        <UserRound size={15} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                                        {isAuthenticated ? (user?.name || 'AskUrSenior Student') : 'Guest Student'}
                                    </p>
                                    <p className="text-[11px] truncate text-slate-500 dark:text-slate-400">
                                        {isAuthenticated ? user?.email : 'Sign in for full access'}
                                    </p>
                                </div>
                            </div>
                            {!isAuthenticated && (
                                <button
                                    type="button"
                                    onClick={() => handleItemClick('/login')}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0 transition-all cursor-pointer shadow-sm"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-0.5">
                        {/* Upgrade to Plus CTA / Plus Active Status */}
                        {!hasPlusAccess ? (
                            <button
                                type="button"
                                onClick={() => handleItemClick(isAuthenticated ? '/pricing' : '/plus')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 mb-1.5"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        <Plus size={11} strokeWidth={3} className="text-white" />
                                    </span>
                                    <span>Upgrade to Plus</span>
                                </div>
                                <span className="text-[11px] font-normal opacity-85">→</span>
                            </button>
                        ) : (
                            <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs mb-1.5 border ${
                                isDark
                                    ? 'bg-purple-950/20 border-purple-800/40 text-purple-300'
                                    : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                        <Plus size={11} strokeWidth={3} className="text-purple-600 dark:text-purple-400" />
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[11px] leading-tight">AskUrSenior Plus</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                    PLUS
                                </span>
                            </div>
                        )}

                        {/* My Profile — Login lock only */}
                        <button
                            type="button"
                            onClick={() => handleItemClick(isAuthenticated ? '/profile' : '/login')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                                isProfileActive
                                    ? isDark
                                        ? 'bg-purple-500/15 text-purple-300 font-semibold'
                                        : 'bg-purple-50 text-purple-700 font-semibold'
                                    : isDark
                                        ? 'hover:bg-slate-800/70 hover:text-white text-slate-300'
                                        : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <UserRound size={16} className="text-purple-500 shrink-0" strokeWidth={1.75} />
                                <span>My Profile</span>
                            </div>
                            {!isAuthenticated && <Lock size={12} className="text-slate-400 shrink-0" title="Login required" />}
                        </button>

                        {/* Account — Login lock only */}
                        <button
                            type="button"
                            onClick={() => handleItemClick(isAuthenticated ? '/account' : '/login')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                                isAccountActive
                                    ? isDark
                                        ? 'bg-purple-500/15 text-purple-300 font-semibold'
                                        : 'bg-purple-50 text-purple-700 font-semibold'
                                    : isDark
                                        ? 'hover:bg-slate-800/70 hover:text-white text-slate-300'
                                        : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Settings2 size={16} className="text-purple-500 shrink-0" strokeWidth={1.75} />
                                <span>Account</span>
                            </div>
                            {!isAuthenticated && <Lock size={12} className="text-slate-400 shrink-0" title="Login required" />}
                        </button>

                        {/* Bug Report — Login lock only */}
                        <button
                            type="button"
                            onClick={() => {
                                if (!isAuthenticated) {
                                    handleItemClick('/login');
                                } else {
                                    handleOpenBugReport();
                                }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                                isDark
                                    ? 'hover:bg-slate-800/70 hover:text-white text-slate-300'
                                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Bug size={16} className="text-purple-500 shrink-0" strokeWidth={1.75} />
                                <span>Bug Report</span>
                            </div>
                            {!isAuthenticated && <Lock size={12} className="text-slate-400 shrink-0" title="Login required" />}
                        </button>

                        {/* Theme Toggle (Light / Dark) — Free for all */}
                        <div className="px-3 py-1.5">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    Theme
                                </span>
                            </div>
                            <div className={`grid grid-cols-2 p-0.5 rounded-lg border text-center ${
                                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100/90 border-slate-200'
                            }`}>
                                <button
                                    type="button"
                                    onClick={() => setThemeMode('light')}
                                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                        !isDark
                                            ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                    title="Light mode"
                                >
                                    <Sun size={12} strokeWidth={1.75} />
                                    <span>Light</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setThemeMode('dark')}
                                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                        isDark
                                            ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                    title="Dark mode"
                                >
                                    <Moon size={12} strokeWidth={1.75} />
                                    <span>Dark</span>
                                </button>
                            </div>
                        </div>

                        {/* Help & Support — Free for all */}
                        <button
                            type="button"
                            onClick={() => handleItemClick('/support')}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                                isSupportActive
                                    ? isDark
                                        ? 'bg-purple-500/15 text-purple-300 font-semibold'
                                        : 'bg-purple-50 text-purple-700 font-semibold'
                                    : isDark
                                        ? 'hover:bg-slate-800/70 hover:text-white text-slate-300'
                                        : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'
                            }`}
                        >
                            <CircleHelp size={16} className="text-purple-500 shrink-0" strokeWidth={1.75} />
                            <span>Help & Support</span>
                        </button>
                    </div>

                    {/* Logout Button — Only shown when logged in */}
                    {isAuthenticated && (
                        <>
                            <div className={`h-px my-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                            <button
                                type="button"
                                onClick={handleLogout}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left text-red-500 hover:bg-red-500/10 cursor-pointer ${
                                    isDark ? 'hover:text-red-400' : 'hover:text-red-600'
                                }`}
                            >
                                <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
                                <span>Logout</span>
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default UserMenu;
