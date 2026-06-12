import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText } from 'lucide-react';
import { useAuth } from '../utils/hooks';
import { apiClient } from '../services/api';
import Logo from './Logo';
// import VoiceCallModal from './voice/VoiceCallModal';
import { useTheme } from '../context/ThemeContext';
import './Hero.css';

export default function Hero() {
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState({ subjects: [], papers: [], notes: [] });
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    // const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    // Transparent → floating pill on scroll
    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 100);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const placeholders = [
        "Search subject, code, topic...",
        "Search Data Structures",
        "Search 22CS41",
        "Search PYQs",
        "Search Mathematics notes",
        "Search DBMS Papers"
    ];

    // Auto changing placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Keyboard shortcut '/'
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Suggestions Logic
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions({ subjects: [], papers: [], notes: [] });
            setShowSuggestions(false);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const response = await apiClient.get(`/documents/suggestions?q=${encodeURIComponent(searchQuery)}`);
                setSuggestions(response.data);
                setShowSuggestions(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        };

        fetchSuggestions();
    }, [searchQuery]);

    const handleSearch = (e) => {
        e?.preventDefault();
        const query = searchQuery || placeholders[placeholderIndex].replace('Search ', '');
        navigate(`/ask-finder?search=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
    };

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    const handleKeyDown = (e) => {
        const totalItems = suggestions.subjects.length + suggestions.papers.length + suggestions.notes.length;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            // Get the item at selectedIndex
            const allItems = [...suggestions.subjects, ...suggestions.papers, ...suggestions.notes];
            const item = allItems[selectedIndex];
            navigate(`/ask-finder?search=${encodeURIComponent(item.name)}`);
            setShowSuggestions(false);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="landing-page">
            {/* Background Elements */}
            <div className="bg-gradient-layer" />
            <div className="bg-grid-pattern" />
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />

            {/* Navigation */}
            <nav className={`landing-nav px-4 py-3 md:px-6 md:py-4${navScrolled ? ' scrolled' : ''}${mobileMenuOpen ? ' menu-open' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
                        <Logo size="sm" />
                    </Link>
                    <div className="nav-links desktop-only hidden md:flex items-center gap-4">
                        <Link to="/ask-finder" className="nav-link nav-link-highlight flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all border border-purple-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Materials
                        </Link>
                        <Link to="/interview" className="nav-link nav-link-highlight flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Interview Experiences
                        </Link>
                        {user && (

                            <Link to="/dashboard" className="nav-link nav-link-highlight flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                Dashboard
                            </Link>
                        )}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                                    title="Account"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase">
                                        {(user?.name || user?.usn || 'U').charAt(0)}
                                    </div>
                                    <span className="text-slate-300 text-sm font-semibold hidden md:inline max-w-[80px] truncate">
                                        {user?.name || user?.usn}
                                    </span>
                                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <>
                                        {/* Backdrop */}
                                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                        {/* Dropdown */}                                        <div className={`absolute right-0 top-full mt-2 w-52 z-50 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'border-white/10 bg-[#141416]/95 shadow-black/60 text-white' : 'border-slate-200 bg-white/95 shadow-slate-200/50 text-slate-800'}`}>
                                            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-black uppercase tracking-widest text-purple-400">
                                                        {user?.isAdmin ? 'Admin' : 'Student'}
                                                    </p>
                                                    <p className={`text-sm font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || user?.usn}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                </div>
                                                <button
                                                    onClick={toggleTheme}
                                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                                    className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer flex-shrink-0 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950'}`}
                                                >
                                                    {isDark ? (
                                                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="4" strokeWidth="2.5" strokeLinecap="round" />
                                                            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2.5" strokeLinecap="round" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {user?.isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border mb-1 ${isDark ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 border-amber-500/10' : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 border-amber-200'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        Admin Panel
                                                    </Link>
                                                )}
                                                <Link
                                                    to="/calculator"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    CGPA Calculator
                                                </Link>
                                                <Link
                                                    to="/blog"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                                    </svg>
                                                    Blogs
                                                </Link>

                                                <div className={`border-t my-1 ${isDark ? 'border-white/5' : 'border-slate-100'}`} />
                                                <button
                                                    onClick={handleLogout}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200"
                                >
                                    {isDark ? (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="4" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>

                                {/* Get Started with arrow */}
                                <Link
                                    to="/signup"
                                    className="nav-btn nav-btn-primary flex items-center gap-1.5"
                                >
                                    Get Started
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Navigation Actions */}
                    <div className="flex md:hidden items-center">
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all"
                            aria-label="Toggle Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden border-t border-white/5 bg-[#030712]/95 backdrop-blur-xl overflow-hidden"
                        >
                            <div className="flex flex-col gap-2 p-4">
                                <Link to="/ask-finder" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 text-purple-400 font-bold border border-purple-500/10">
                                    <Search size={18} /> Materials Finder
                                </Link>
                                <Link to="/calculator" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 font-bold transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    CGPA Calculator
                                </Link>
                                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 font-bold transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                    Guides & Blogs
                                </Link>
                                <Link to="/interview" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/10">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Interview Experiences
                                </Link>
                                
                                <div className="border-t border-white/5 my-2" />
                                
                                {user ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                                            Dashboard
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 font-bold transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="mt-4">
                                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-3 p-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-lg shadow-2xl shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.24 5.36-7.84 5.36-4.8 0-8.72-3.92-8.72-8.72s3.92-8.72 8.72-8.72c2.72 0 4.56 1.12 5.6 2.16l2.56-2.56C18.16 1.12 15.52 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.2 0 12-5.04 12-12.24 0-.8-.08-1.44-.24-2.08h-11.76z"/>
                                            </svg>
                                            Continue with Google
                                        </Link>
                                        <p className="text-[10px] text-slate-500 text-center mt-4 px-6 leading-relaxed">
                                            By continuing, you'll be able to sign in or create a new account automatically.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-28 md:pt-36 pb-6 md:pb-8 px-6 flex flex-col items-center justify-center">
                <div className="max-w-4xl mx-auto w-full text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight font-[Outfit]">
                            Find Notes, PYQs and Study Materials for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">SIT</span> Students
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                            Access curated notes, previous year question papers, and academic tools built specifically for SIT students.
                        </p>

                        <div className="relative max-w-2xl mx-auto mb-8 transition-all duration-300 ease-out" ref={searchRef} style={{ width: searchFocused ? '100%' : '90%', maxWidth: '720px' }}>
                            <form onSubmit={handleSearch} className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <svg className={`w-6 h-6 transition-colors duration-300 ${searchFocused ? 'text-purple-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholders[placeholderIndex]}
                                    className={`w-full bg-[#141416]/80 backdrop-blur-xl border rounded-full py-4 md:py-5 pl-14 pr-36 text-white text-base md:text-lg outline-none transition-all duration-300 ${
                                        searchFocused 
                                        ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]' 
                                        : 'border-white/10 shadow-2xl shadow-purple-900/10'
                                    }`}
                                />
                                <div className="absolute inset-y-2 right-2 flex items-center gap-2">
                                    {!searchFocused && searchQuery === '' && (
                                        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 mr-2">
                                            <span>/</span>
                                        </kbd>
                                    )}
                                    <button
                                        type="submit"
                                        className="h-full px-6 md:px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full font-bold text-sm md:text-base transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>

                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {searchFocused && showSuggestions && (suggestions.subjects.length > 0 || suggestions.papers.length > 0 || suggestions.notes.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-3 bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[60]"
                                    >
                                        <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                                            {/* Subjects Category */}
                                            {suggestions.subjects.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                        Subjects
                                                    </div>
                                                    <div className="space-y-1">
                                                        {suggestions.subjects.map((s, idx) => {
                                                            const itemIdx = idx;
                                                            return (
                                                                <button
                                                                    key={`s-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(s.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Search size={14} className={selectedIndex === itemIdx ? 'text-white' : 'text-purple-400'} />
                                                                        <span className="text-sm font-bold truncate">{s.name}</span>
                                                                    </div>
                                                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${selectedIndex === itemIdx ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{s.code}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PYQs Category */}
                                            {suggestions.papers.length > 0 && (
                                                <div className="mb-4 text-left">
                                                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Past Year Papers
                                                    </div>
                                                    <div className="space-y-1">
                                                        {suggestions.papers.map((p, idx) => {
                                                            const itemIdx = suggestions.subjects.length + idx;
                                                            return (
                                                                <button
                                                                    key={`p-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(p.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                        <FileText size={14} className="text-emerald-400" />
                                                                    </div>
                                                                    <div className="flex flex-col items-start overflow-hidden">
                                                                        <span className="text-sm font-bold truncate">{p.name}</span>
                                                                        <span className={`text-[10px] ${selectedIndex === itemIdx ? 'text-emerald-100' : 'text-slate-500'}`}>Official University Paper</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes Category */}
                                            {suggestions.notes.length > 0 && (
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Curated Notes
                                                    </div>
                                                    <div className="space-y-1">
                                                        {suggestions.notes.map((n, idx) => {
                                                            const itemIdx = suggestions.subjects.length + suggestions.papers.length + idx;
                                                            return (
                                                                <button
                                                                    key={`n-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(n.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                                        <div className="w-3.5 h-3.5 border-2 border-amber-400 rounded-sm" />
                                                                    </div>
                                                                    <div className="flex flex-col items-start overflow-hidden">
                                                                        <span className="text-sm font-bold truncate">{n.name}</span>
                                                                        <span className={`text-[10px] ${selectedIndex === itemIdx ? 'text-amber-100' : 'text-slate-500'}`}>Handwritten / PDF Study Material</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">ΓåæΓåô</kbd> Navigate</span>
                                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Enter</kbd> Select</span>
                                            </div>
                                            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Esc</kbd> Close</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400 mb-4">
                            <span className="font-semibold text-slate-500">Popular:</span>
                            <button onClick={()=>navigate('/ask-finder?search=Chemistry')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Chemistry</button>
                            <button onClick={()=>navigate('/ask-finder?search=Electrical')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Electrical</button>
                            <button onClick={()=>navigate('/ask-finder?search=Mathematics')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Mathematics</button>
                        </div>

                        {/* <div className="mt-8 mb-10">
                            <button
                                onClick={() => setIsVoiceCallOpen(true)}
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-full font-bold text-lg text-white transition-all overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-2xl animate-pulse">🎙️</span>
                                Talk With A Senior
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity -z-10" />
                            </button>
                        </div> */}

                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm md:text-base font-semibold text-slate-300 bg-white/5 py-4 px-6 md:px-8 rounded-2xl border border-white/10 inline-flex backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-green-500/20 rounded-full"><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                                Search real exam papers
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-green-500/20 rounded-full"><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                                Notes shared by seniors
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-green-500/20 rounded-full"><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></div>
                                SIT accurate CGPA calculator
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* <VoiceCallModal isOpen={isVoiceCallOpen} onClose={() => setIsVoiceCallOpen(false)} /> */}
        </div>
    );
}
