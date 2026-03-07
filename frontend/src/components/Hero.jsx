import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import Logo from './Logo';
import './Hero.css';

export default function Hero() {
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    return (
        <div className="landing-page">
            {/* Background Elements */}
            <div className="bg-gradient-layer" />
            <div className="bg-grid-pattern" />
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <Logo size="md" />
                    </Link>
                    <div className="nav-links flex items-center gap-4">
                        <Link to="/calculator" className="nav-link nav-link-highlight hidden md:flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            CGPA Calculator
                        </Link>
                        <Link to="/ask-finder" className="nav-link nav-link-highlight flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all border border-purple-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Materials
                        </Link>
                        <Link to="/blog" className="nav-link nav-link-highlight flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            Blog
                        </Link>
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
                                        {/* Dropdown */}
                                        <div className="absolute right-0 top-full mt-2 w-52 z-50 rounded-2xl border border-white/10 bg-[#141416]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-white/5">
                                                <p className="text-xs font-black uppercase tracking-widest text-purple-400">
                                                    {user?.isAdmin ? 'Admin' : 'Student'}
                                                </p>
                                                <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name || user?.usn}</p>
                                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                                    </svg>
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/ask-finder?bookmarks=true"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                    Saved Materials
                                                </Link>
                                                <div className="border-t border-white/5 my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
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
                                <Link to="/login" className="nav-link">Sign In</Link>
                                <Link to="/signup" className="nav-btn nav-btn-primary">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
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

                        <form onSubmit={(e) => { e.preventDefault(); navigate(`/ask-finder?search=${encodeURIComponent(e.target.search.value)}`); }} className="relative max-w-2xl mx-auto mb-8 group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <svg className="w-6 h-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                placeholder="Search subject, code, topic..."
                                className="w-full bg-[#141416]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 md:py-5 pl-14 pr-36 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-2xl shadow-purple-900/20"
                            />
                            <button
                                type="submit"
                                className="absolute inset-y-2 right-2 px-6 md:px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full font-bold text-sm md:text-base transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                Search
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400 mb-4">
                            <span className="font-semibold text-slate-500">Popular:</span>
                            <button onClick={()=>navigate('/ask-finder?search=Chemistry')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Chemistry</button>
                            <button onClick={()=>navigate('/ask-finder?search=Electrical')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Electrical</button>
                            <button onClick={()=>navigate('/ask-finder?search=Mathematics')} className="hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 font-medium tracking-wide">Mathematics</button>
                        </div>

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
        </div>
    );
}
