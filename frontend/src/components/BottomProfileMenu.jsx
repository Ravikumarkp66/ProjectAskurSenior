import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BottomProfileMenu = ({ user }) => {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const profilePic = user?.profilePicture || user?.avatar || user?.picture || user?.photo || '';

    useEffect(() => {
        setImgError(false);
    }, [profilePic]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleOutsideClick);
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('pointerdown', handleOutsideClick);
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [open]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || '?';

    const handleProfileClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        navigate('/profile');
    };

    const handleAcademicsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        navigate('/student-academics');
    };

    const handleThemeToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
    };

    return (
        <div ref={containerRef} className="relative z-[9999]">
            {/* Popover Menu (Floats right above avatar with high contrast light/dark styles) */}
            <div
                className={`absolute bottom-full left-2 mb-3 w-56 p-2 rounded-2xl border transition-all duration-200 origin-bottom-left flex flex-col gap-1 z-[9999] shadow-2xl ${
                    open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                } ${
                    isDark
                        ? 'bg-[#0d091f] border-purple-500/20 text-slate-100 shadow-black/80'
                        : 'bg-white border-slate-200 text-slate-900 shadow-purple-950/20'
                }`}
            >
                {/* 1. My Profile */}
                <button
                    type="button"
                    onClick={handleProfileClick}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDark
                            ? 'text-slate-200 hover:text-white hover:bg-purple-600/20'
                            : 'text-slate-800 hover:text-purple-950 hover:bg-purple-50'
                    }`}
                >
                    <User size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} strokeWidth={2.2} />
                    <span>My Profile</span>
                </button>

                {/* 2. Student Academics */}
                <button
                    type="button"
                    onClick={handleAcademicsClick}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDark
                            ? 'text-slate-200 hover:text-white hover:bg-purple-600/20'
                            : 'text-slate-800 hover:text-purple-950 hover:bg-purple-50'
                    }`}
                >
                    <GraduationCap size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} strokeWidth={2.2} />
                    <span>Student Academics</span>
                </button>

                {/* Divider */}
                <div className={`h-px my-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />

                {/* 2. Light / Dark Theme */}
                <button
                    type="button"
                    onClick={handleThemeToggle}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDark
                            ? 'text-slate-200 hover:text-white hover:bg-purple-600/20'
                            : 'text-slate-800 hover:text-purple-950 hover:bg-purple-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isDark ? (
                            <Sun size={16} className="text-amber-400" strokeWidth={2.2} />
                        ) : (
                            <Moon size={16} className="text-indigo-600" strokeWidth={2.2} />
                        )}
                        <span>Appearance</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                        isDark
                            ? 'bg-purple-600/30 text-purple-300 border-purple-500/30'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                    }`}>
                        {isDark ? 'Dark' : 'Light'}
                    </span>
                </button>
            </div>

            {/* Bottom Avatar Trigger Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(v => !v);
                }}
                title="Account Menu"
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 border-2 overflow-hidden shadow-md ${
                    open
                        ? 'border-purple-500 ring-2 ring-purple-500/40 scale-105'
                        : (isDark ? 'border-purple-500/50 hover:border-purple-400' : 'border-purple-400/80 hover:border-purple-600 shadow-purple-900/10')
                }`}
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.2))'
                        : 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
                    color: isDark ? '#c4b5fd' : '#6d28d9',
                }}
            >
                {profilePic && !imgError ? (
                    <img
                        src={getProfilePicUrl(profilePic)}
                        onError={() => setImgError(true)}
                        alt={user?.name || 'Profile'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-xs font-extrabold tracking-tight">{initials}</span>
                )}
            </button>
        </div>
    );
};

export default BottomProfileMenu;
