/**
 * Navbar.jsx  — AskUrSenior V3 Global Navbar
 * ─────────────────────────────────────────────────────────
 * Mobile-First expanded full-width navbar on mobile viewports (< 768px)
 * with SVG icons for Home, Plus, Pricing links, Theme Toggle, and Arrow CTA.
 * Floating glass pill container on desktop viewports (>= 768px).
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_ITEMS } from './navConfig';

import NavLogo from './NavLogo';
import NavigationItems from './NavigationItems';
import ThemeToggle from './ThemeToggle';
import AuthSection from './AuthSection';
import ProfileDropdown from './ProfileDropdown';

/* SVG Icons for Mobile Quick Links */
const HomeSvgIcon = () => (
    <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
);

const PlusSvgIcon = () => (
    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const PricingSvgIcon = () => (
    <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const Navbar = () => {
    const { user, logout } = React.useContext(AuthContext);
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const [scrolled, setScrolled] = useState(false);

    /* Scroll-aware elevation */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = useCallback(() => {
        logout?.();
        navigate('/');
    }, [logout, navigate]);

    return (
        <>
            {/* Shimmer animation */}
            <style>{`
                @keyframes navShimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            {/* Sticky Wrapper — Full Width on Mobile (< md), Inset Padded Container on Desktop (>= md) */}
            <header
                className="fixed top-0 left-0 right-0 z-[990] w-full p-0 md:p-3 pointer-events-none"
                aria-label="Site header"
            >
                {/* Header Container */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    className={`pointer-events-auto flex items-center justify-between w-full transition-all duration-300 ${
                        // Mobile: 100% Full-width edge-to-edge navbar (0px margins)
                        'h-16 rounded-none px-3 sm:px-4 bg-[#030712]/90 backdrop-blur-xl border-b border-white/10 shadow-lg ' +
                        // Desktop: Floating Glass Pill Container
                        'md:h-18 md:max-w-7xl md:mx-auto md:rounded-full md:px-6 md:border md:shadow-2xl ' +
                        (isDark
                            ? scrolled
                                ? 'md:bg-[#060314]/90 md:border-purple-500/30 md:shadow-purple-900/20'
                                : 'md:bg-[#060314]/75 md:border-purple-500/20 md:shadow-black/40'
                            : scrolled
                                ? 'md:bg-white/95 md:border-slate-300 md:shadow-slate-300/30'
                                : 'md:bg-white/85 md:border-slate-200 md:shadow-slate-200/20')
                    }`}
                >
                    {/* LEFT: Logo */}
                    <div className="shrink-0 flex items-center">
                        <NavLogo />
                    </div>

                    {/* MOBILE QUICK LINKS (< md): Home, Plus, Pricing with SVG Icons */}
                    <nav className="flex md:hidden items-center gap-1 sm:gap-1.5 text-xs font-semibold">
                        <Link
                            to={user ? "/home" : "/"}
                            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all flex items-center gap-1.5"
                        >
                            <HomeSvgIcon />
                            <span>Home</span>
                        </Link>
                        <Link
                            to="/plus"
                            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all flex items-center gap-1.5"
                        >
                            <PlusSvgIcon />
                            <span>Plus</span>
                        </Link>
                        <Link
                            to="/pricing"
                            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all flex items-center gap-1.5"
                        >
                            <PricingSvgIcon />
                            <span>Pricing</span>
                        </Link>
                    </nav>

                    {/* DESKTOP NAV ITEMS (>= md) */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <NavigationItems items={NAV_ITEMS} isDark={isDark} />
                    </div>

                    {/* RIGHT ACTIONS: Dark/Light Toggle + Get Started Arrow CTA */}
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        {/* Theme Toggle (Dark/Light mode icon) */}
                        <ThemeToggle />

                        {/* Desktop Auth Section / Mobile Arrow CTA */}
                        <div className="hidden md:block">
                            <AuthSection user={user} isDark={isDark} onLogout={handleLogout} />
                        </div>

                        {/* Mobile Auth Button / Arrow CTA (< md) */}
                        <div className="md:hidden">
                            {user ? (
                                <ProfileDropdown user={user} onLogout={handleLogout} />
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/login')}
                                    aria-label="Get Started"
                                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/30 border border-white/20 active:bg-purple-700 cursor-pointer"
                                >
                                    <span className="hidden xs:inline">Get Started</span>
                                    <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </header>
        </>
    );
};

export default Navbar;
