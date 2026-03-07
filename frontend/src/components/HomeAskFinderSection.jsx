import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';

const HomeAskFinderSection = () => {
    const navigate = useNavigate();
    const [searchFocused, setSearchFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState({ subjects: [], papers: [], notes: [] });
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    const placeholders = [
        "Search by topic, exam, or tags...",
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

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e) => {
        e?.preventDefault();
        const query = searchQuery || placeholders[placeholderIndex].replace('Search ', '');
        navigate(`/ask-finder?search=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
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
        <section className="py-24 bg-[#0a0a0b] relative z-10 border-t border-white/5 font-sans overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Left: Content */}
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
                            <FileText size={16} />
                            <span>ASK+ Materials Finder</span>
                        </div>
                        
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 font-outfit leading-tight">
                            Find exactly what you <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                need to study
                            </span>
                        </h2>
                        
                        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto md:mx-0 font-outfit">
                            Access a vast repository of previous year questions, curated notes, and study materials shared by seniors who've been exactly where you are.
                        </p>
                        
                        <div className="relative max-w-sm md:max-w-md mx-auto md:mx-0 transition-all duration-300 ease-out" ref={searchRef} style={{ width: searchFocused ? '120%' : '100%', maxWidth: '100%' }}>
                            <form onSubmit={handleSearch} className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={20} className={`transition-colors duration-300 ${searchFocused ? 'text-purple-400' : 'text-slate-500'}`} />
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
                                    className={`w-full bg-[#141416]/50 border rounded-full py-4 pl-12 pr-32 text-white focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                                        searchFocused
                                        ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                                        : 'border-white/10 shadow-lg shadow-purple-900/10'
                                    }`}
                                />
                                <button
                                    type="submit"
                                    className="absolute inset-y-2 right-2 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    Find
                                </button>
                            </form>

                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {searchFocused && showSuggestions && (suggestions.subjects.length > 0 || suggestions.papers.length > 0 || suggestions.notes.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-3 bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                                    >
                                        <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
                                            {/* Subjects */}
                                            {suggestions.subjects.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Subjects</div>
                                                    <div className="space-y-1">
                                                        {suggestions.subjects.map((s, idx) => {
                                                            const itemIdx = idx;
                                                            return (
                                                                <button
                                                                    key={`hs-s-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(s.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Search size={12} className={selectedIndex === itemIdx ? 'text-white' : 'text-purple-400'} />
                                                                        <span className="text-sm font-bold truncate">{s.name}</span>
                                                                    </div>
                                                                    <span className="text-[10px] opacity-50 font-mono">{s.code}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Papers */}
                                            {suggestions.papers.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Papers</div>
                                                    <div className="space-y-1">
                                                        {suggestions.papers.map((p, idx) => {
                                                            const itemIdx = suggestions.subjects.length + idx;
                                                            return (
                                                                <button
                                                                    key={`hs-p-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(p.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <FileText size={12} className={selectedIndex === itemIdx ? 'text-white' : 'text-emerald-400'} />
                                                                    <span className="text-sm font-bold truncate">{p.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {suggestions.notes.length > 0 && (
                                                <div className="text-left">
                                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</div>
                                                    <div className="space-y-1">
                                                        {suggestions.notes.map((n, idx) => {
                                                            const itemIdx = suggestions.subjects.length + suggestions.papers.length + idx;
                                                            return (
                                                                <button
                                                                    key={`hs-n-${idx}`}
                                                                    onClick={() => { navigate(`/ask-finder?search=${encodeURIComponent(n.name)}`); setShowSuggestions(false); }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="w-3 h-3 border-2 border-amber-400 rounded-sm" />
                                                                    <span className="text-sm font-bold truncate">{n.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {/* Right: Visual / CTA Cards */}
                    <div className="flex-1 w-full relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card 1 */}
                            <motion.div 
                                className="bg-[#141416]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-purple-500/30 transition-colors cursor-pointer group"
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/ask-finder')}
                            >
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Previous Papers</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Access real exam papers and internal assessments.</p>
                                </div>
                            </motion.div>
                            
                            {/* Card 2 */}
                            <motion.div 
                                className="bg-[#141416]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-purple-500/30 transition-colors cursor-pointer group mt-0 sm:mt-10"
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/ask-finder')}
                            >
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Study Notes</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Curated comprehensive notes organized by module.</p>
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Interactive floating element */}
                        <div className="absolute -bottom-8 -left-8 bg-[#141416]/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-slow">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl border-2 border-[#0a0a0b]">
                                +
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Contribute</p>
                                <p className="text-slate-400 text-xs">Upload your own material</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeAskFinderSection;
