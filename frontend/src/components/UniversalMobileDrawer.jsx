import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Sun, Moon, LogOut, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../utils/hooks';
import NavLogo from './navbar/NavLogo';

const PlusDashboardIcon = ({ className, size = 19 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
    </svg>
);

const UniversalMobileDrawer = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { logout } = useAuth();

    // Automatically close drawer when entering desktop view (>= 768px)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isOpen) {
                onClose();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, onClose]);

    // Automatically close drawer whenever route changes
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    // Lock body scroll while drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleNavigate = (e, path) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
        if (path) {
            navigate(path);
        }
    };

    const handleLogoutClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
        logout?.();
        navigate('/login');
    };

    const navItems = [
        {
            id: 'home',
            label: 'Home',
            path: '/home',
            icon: Home,
            isActive: location.pathname.startsWith('/home') || location.pathname === '/',
        },
        {
            id: 'plus',
            label: 'Plus',
            path: '/plus',
            icon: PlusDashboardIcon,
            isActive: location.pathname.startsWith('/plus'),
        },
        {
            id: 'profile',
            label: 'My Profile',
            path: '/profile',
            icon: User,
            isActive: location.pathname.startsWith('/profile'),
        },
    ];

    return (
        <div
            className={`md:hidden fixed inset-0 z-[99999] transition-all duration-300 ${
                isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'
            }`}
        >
            {/* Backdrop Overlay */}
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Right-Side Mobile Drawer Panel */}
            <aside
                className={`fixed top-0 bottom-0 right-0 w-80 max-w-[85vw] flex flex-col justify-between p-5 shadow-2xl overflow-y-auto border-l transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                } ${
                    isDark
                        ? 'bg-[#0d091f] border-white/10 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
            >
                {/* Top Section */}
                <div className="flex flex-col gap-6">
                    {/* Header: Logo + Close X Button */}
                    <div className={`flex items-center justify-between pb-4 border-b ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                    }`}>
                        <div onClick={(e) => handleNavigate(e, '/home')} className="cursor-pointer">
                            <NavLogo />
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer border ${
                                isDark
                                    ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
                            }`}
                            aria-label="Close menu"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Navigation Items: Home, Plus, My Profile */}
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => handleNavigate(e, item.path)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                                        item.isActive
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/35 border border-purple-500 font-bold'
                                            : (isDark
                                                ? 'text-slate-300 hover:text-white hover:bg-white/5'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-white/80')
                                    }`}
                                >
                                    <Icon size={19} className={item.isActive ? 'text-white' : (isDark ? 'text-purple-400' : 'text-purple-600')} strokeWidth={2.2} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Appearance / Theme Toggle */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleTheme();
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer mt-1 ${
                                isDark
                                    ? 'text-slate-300 hover:bg-white/5'
                                    : 'text-slate-700 hover:bg-white/80'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                {isDark ? (
                                    <Sun size={19} className="text-amber-400" strokeWidth={2.2} />
                                ) : (
                                    <Moon size={19} className="text-indigo-600" strokeWidth={2.2} />
                                )}
                                <span>Appearance</span>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                                isDark ? 'bg-white/10 text-slate-300' : 'bg-purple-100 text-purple-700'
                            }`}>
                                {isDark ? 'Dark' : 'Light'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Bottom Action: Logout */}
                <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        className={`w-full flex items-center justify-start gap-3.5 px-4 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer ${
                            isDark
                                ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
                                : 'text-red-600 hover:bg-red-50 active:bg-red-100'
                        }`}
                    >
                        <LogOut size={19} strokeWidth={2.5} className="shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default UniversalMobileDrawer;
