import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    ArrowUpRight, 
    Building2,
    Calendar,
    Layout,
    CircleDollarSign,
    Trophy,
    TrendingUp,
    Sparkles,
    AlertCircle,
    Briefcase,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';

// Custom Typewriter Component — no external dependency
const Typewriter = ({ phrases, typingSpeed = 60, deletingSpeed = 30, pauseTime = 2200 }) => {
    const [displayText, setDisplayText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];
        let timeout;

        if (!isDeleting && displayText === currentPhrase) {
            timeout = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && displayText === '') {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
        } else {
            timeout = setTimeout(() => {
                setDisplayText(prev => 
                    isDeleting 
                        ? currentPhrase.substring(0, prev.length - 1)
                        : currentPhrase.substring(0, prev.length + 1)
                );
            }, isDeleting ? deletingSpeed : typingSpeed);
        }

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

    return (
        <span className="inline-flex items-center">
            <span>{displayText}</span>
            <span className="ml-0.5 w-[2px] h-5 bg-purple-500 animate-pulse" />
        </span>
    );
};

const SkeletonCard = ({ isLightMode }) => (
    <div className={`p-8 rounded-[2rem] border animate-pulse flex flex-col h-[320px] ${
        isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'
    }`}>
        <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 shadow-sm" />
            <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-white/10 rounded-full" />
                <div className="h-3 w-32 bg-white/10 rounded-full" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-auto">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-white/5" />
            ))}
        </div>
    </div>
);

const CompanyRoleCard = ({ data, isLightMode }) => {
    const navigate = useNavigate();
    const slug = data._navSlug || data.companyId || data._id;

    return (
        <motion.div 
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => navigate(`/interview/${slug}`)}
            className={`p-8 rounded-[2rem] transition-all duration-500 shadow-2xl cursor-pointer flex flex-col h-full border group relative overflow-hidden ${
                isLightMode 
                ? 'bg-white border-slate-200 text-slate-900' 
                : 'bg-[#111827] border-white/5 text-white hover:border-purple-500/30'
            }`}
        >
            {/* Soft Glow on Hover */}
            {!isLightMode && (
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-3xl" />
            )}

            {/* Top Section */}
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white p-3 flex items-center justify-center shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110">
                        <img src={data.logo} alt={data.company} className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black tracking-tight leading-tight">{data.company}</h2>

                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{data.role}</p>
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                    <ArrowUpRight size={18} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
            </div>

            {/* Content Section - Human Readable */}
            <div className={`grid grid-cols-2 gap-3 mt-auto relative z-10`}>
                <div className={`p-4 rounded-2xl border transition-colors ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-[#1F2937]/50 border-white/5 group-hover:bg-purple-500/5 group-hover:border-purple-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Building2 size={14} className="opacity-50" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Company</p>
                    </div>
                    <p className="font-bold text-sm truncate">{data.company}</p>
                </div>

                <div className={`p-4 rounded-2xl border transition-colors ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-[#1F2937]/50 border-white/5 group-hover:bg-purple-500/5 group-hover:border-purple-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Calendar size={14} className="opacity-50" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Batch</p>
                    </div>
                    <p className="font-bold text-sm">{data.batch}</p>
                </div>

                <div className={`p-4 rounded-2xl border transition-colors ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-[#1F2937]/50 border-white/5 group-hover:bg-purple-500/5 group-hover:border-purple-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Layout size={14} className="opacity-50" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Experiences</p>
                    </div>
                    <p className="font-bold text-sm">{data.totalExperiences} Stories</p>
                </div>

                <div className={`p-4 rounded-2xl border transition-colors ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-[#1F2937]/50 border-white/5 group-hover:bg-purple-500/5 group-hover:border-purple-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <CircleDollarSign size={14} className="opacity-50" />
                        <p className="text-[9px] font-black uppercase tracking-widest">CTC Package</p>
                    </div>
                    <p className="font-bold text-sm truncate">{(!data.ctc || data.ctc === "Role Based") ? (data.ctc || "Not Disclosed") : (/lpa|lakh|L$/i.test(data.ctc) ? data.ctc : `${data.ctc} LPA`)}</p>
                </div>
            </div>

            {/* Footer Row */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/5 relative z-10">

                <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-[0.1em] group-hover:translate-x-1 transition-transform">
                    READ REVIEW 
                    <ArrowUpRight size={14} strokeWidth={3} />
                </div>
            </div>
        </motion.div>
    );
};

const InterviewPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [theme] = useState(() => localStorage.getItem('uiTheme') || 'dark');
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    const [disclaimerOpen, setDisclaimerOpen] = useState(false);

    const isLightMode = theme === 'light';

    React.useEffect(() => {
        const fetchCompanies = async () => {
            try {
                // Use centralized API service instead of raw fetch
                const response = await interviewExperiencesAPI.getCompanies();
                const data = Array.isArray(response.data) ? response.data : [];
                
                if (data.length === 0 && response.status !== 200) {
                    console.error('API Error:', response);
                    setCompanies([]);
                    return;
                }

                const processed = data.flatMap(comp => {
                    const companyName = String(comp.name || '').trim();
                    const nameUpper = companyName.toUpperCase();
                    const realCount = comp.experienceCount || 0;
                    const companyId = comp._id;
                    // Human-readable URL slug: "Morgan Stanley" -> "morgan-stanley"
                    const nameSlug = companyName.toLowerCase().replace(/\s+/g, '-');

                    if (nameUpper === 'AMAZON') {
                      return [
                        { 
                          ...comp, 
                          companyId,
                          // Encode batch in slug: companyId--batch
                          _navSlug: `amazon--2026`,
                          company: companyName, 
                          batch: 2026, 
                          role: "INTERVIEW EXPERIENCES", 
                          totalExperiences: 42, 
                          totalUpvotes: 191 
                        },
                        { 
                          ...comp, 
                          companyId,
                          _navSlug: `amazon--2027`,
                          company: companyName, 
                          batch: 2027, 
                          role: "INTERVIEW EXPERIENCES", 
                          totalExperiences: 64, 
                          totalUpvotes: 0 
                        }
                      ];
                    }

                    // Morgan Stanley — custom role and CTC display
                    if (nameUpper === 'MORGAN STANLEY') {
                      return [{ 
                        ...comp, 
                        companyId,
                        _navSlug: nameSlug,
                        company: companyName, 
                        batch: 2026, 
                        role: "Intern (PPO)", 
                        totalExperiences: realCount, 
                        totalUpvotes: comp.upvotes || 0,
                        ctc: "87K - 1.07L"
                      }];
                    }

                    // For all other companies
                    return [{ 
                      ...comp, 
                      companyId,
                      _navSlug: nameSlug,
                      company: companyName, 
                      batch: 2026, 
                      role: comp.representativeRole || "SDE", 
                      totalExperiences: realCount, 
                      totalUpvotes: comp.upvotes || 0,
                      ctc: comp.representativeCtc || comp.ctc || "Role Based"
                    }];
                });

                setCompanies(processed);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setTimeout(() => setIsLoading(false), 800);
            }
        };
        fetchCompanies();
    }, []);

    const filteredRoles = useMemo(() => {
        let result = companies.filter(item => {
            return item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.role.toLowerCase().includes(searchQuery.toLowerCase());
        });

        if (sortBy === 'upvoted') {
            result.sort((a, b) => (b.totalUpvotes || 0) - (a.totalUpvotes || 0));
        } else if (sortBy === 'most-exp') {
            result.sort((a, b) => (b.totalExperiences || 0) - (a.totalExperiences || 0));
        } else if (sortBy === 'least-exp') {
            result.sort((a, b) => (a.totalExperiences || 0) - (b.totalExperiences || 0));
        } else if (sortBy === 'a-z') {
            result.sort((a, b) => a.company.localeCompare(b.company));
        }

        return result;
    }, [searchQuery, sortBy, companies]);



    return (
        <div className="w-full">
            {/* 1. Header Section - Visual Hierarchy Fix */}
            <div className="mb-24 text-center pt-20 relative">
                {/* Subtle animated gradient glow behind heading */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
                    <motion.div 
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-[500px] h-[300px] rounded-full bg-purple-600/20 blur-[120px] absolute -top-10"
                    />
                    <motion.div 
                        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        className="w-[400px] h-[250px] rounded-full bg-indigo-500/15 blur-[100px] absolute top-5 -left-20"
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        className="w-[350px] h-[200px] rounded-full bg-violet-500/15 blur-[90px] absolute top-0 right-0"
                    />
                </div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Direct from Seniors</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-none italic">
                        ASK+ <span className="text-purple-500 not-italic">EXPERIENCES</span>
                    </h1>
                    <p className="text-gray-500/50 font-bold uppercase tracking-[0.2em] text-[10px] max-w-md leading-loose mb-6">
                        From seniors who sat in the same classrooms as you
                    </p>
                    <div className="text-purple-400/80 font-semibold text-sm md:text-base tracking-wide h-7">
                        <Typewriter 
                            phrases={[
                                'Real interview questions from SIT seniors...',
                                'What companies actually ask in placements...',
                                'Stop guessing. Start preparing right.',
                                'Learn from people who cracked it.',
                                'See what gets asked before you walk in.',
                            ]}
                        />
                    </div>
                </motion.div>

                {/* Disclaimer Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-2xl mx-auto mt-10 px-4"
                >
                    <div 
                        className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] backdrop-blur-sm overflow-hidden cursor-pointer group/disc"
                        onClick={() => setDisclaimerOpen(prev => !prev)}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                    <AlertTriangle size={13} className="text-amber-500/70" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-[0.2em]">
                                    Real experiences shared by seniors — no edits, no filters. Read disclaimer
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: disclaimerOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown size={14} className="text-amber-500/40" />
                            </motion.div>
                        </div>
                        <AnimatePresence>
                            {disclaimerOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-4 pt-1 border-t border-amber-500/10">
                                        <ul className="space-y-2.5 mt-3">
                                            {[
                                                'Interview experiences are user-submitted by seniors and are displayed in their original form without modification.',
                                                'The CTC displayed typically reflects full-time compensation post-conversion and may not represent internship compensation.',
                                                'Experiences may differ based on role, interviewer, and time of recruitment.',
                                                'For any discrepancies or corrections, please contact us.'
                                            ].map((text, i) => (
                                                <li key={i} className="flex gap-3 text-[11px] text-slate-500 font-medium leading-relaxed">
                                                    <span className="w-1 h-1 rounded-full bg-amber-500/40 mt-1.5 shrink-0" />
                                                    {text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* 2. Search Bar - Product Feel */}
                <div className="relative max-w-3xl mx-auto mt-16 px-4">
                    <motion.div 
                        animate={searchFocused ? { scale: 1.02 } : { scale: 1 }}
                        className="relative group"
                    >
                        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
                            <Search size={24} className={`transition-colors ${searchFocused ? 'text-purple-500' : 'text-gray-600'}`} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Amazon, SDE, Intern 2026..."
                            className={`w-full bg-[#111827]/80 backdrop-blur-xl border rounded-[2.5rem] py-8 pl-20 pr-10 outline-none transition-all duration-500 font-bold text-xl placeholder:text-gray-700/50 ${
                                searchFocused 
                                ? 'border-purple-500 ring-8 ring-purple-500/10 shadow-[0_30px_60px_rgba(139,92,246,0.3)]' 
                                : 'border-white/5 text-white'
                            }`}
                        />
                        
                        {/* 2b. Placeholder Suggestion Indicator */}
                        {!searchQuery && (
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Popular:</span>
                                <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-500">SIT 2026</div>
                                <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-500">AMAZON</div>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Stats Below Search */}
                    <div className="mt-8 flex justify-center gap-12 font-black uppercase tracking-[0.2em] text-[10px] text-slate-600">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={12} />
                            <span>100+ Experiences</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-500/50">
                            <Briefcase size={12} />
                            <span>15+ Companies</span>
                        </div>
                    </div>
                </div>
            </div>



            {/* 4. Verified Section Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2 pt-10 border-t border-white/5">
                <div className="flex items-start gap-5">
                    <div className="w-1.5 h-16 bg-gradient-to-b from-purple-500 via-indigo-600 to-transparent rounded-full font-black"></div>
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3">
                            Verified <span className="text-purple-500">Experiences</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                                {filteredRoles.length} Companies
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Updated Today</span>
                        </div>
                    </div>
                </div>

                {/* 5. Sorting Toolbar */}
                <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-2 rounded-[2rem] w-fit">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-[1.5rem] bg-[#0F172A] border border-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SORT</span>
                        <div className="h-4 w-px bg-white/10" />
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#0F172A] text-[11px] font-black uppercase tracking-widest outline-none border-none cursor-pointer text-white min-w-[160px]"
                        >
                            <option value="latest" className="bg-[#0F172A] text-white">Latest First</option>
                            <option value="upvoted" className="bg-[#0F172A] text-white">Helpful Points</option>
                            <option value="most-exp" className="bg-[#0F172A] text-white">Most Experiences</option>
                            <option value="least-exp" className="bg-[#0F172A] text-white">Least Experiences</option>
                            <option value="a-z" className="bg-[#0F172A] text-white">Company A–Z</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 3 & 6. The Grid + States */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 pb-32">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} isLightMode={isLightMode} />)}
                    </div>
                ) : filteredRoles.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 pb-32"
                    >
                        {filteredRoles.map((item) => (
                            <CompanyRoleCard key={`${item._id}-${item.batch}`} data={item} isLightMode={isLightMode} />
                        ))}
                    </motion.div>
                ) : (
                    /* 6b. No Results UI */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-40 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                            <AlertCircle size={40} className="text-slate-600" />
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">No Experiences Found</h4>
                        <p className="text-slate-500 text-sm max-w-sm font-medium">
                            We couldn't find any tags for <span className="text-white">"{searchQuery}"</span>. Try searching for a company name or a role like "SDE".
                        </p>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-8 text-purple-500 font-black uppercase tracking-widest text-xs hover:text-purple-400 transition-colors"
                        >
                            Clear Search Filters
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coming Soon Section */}
            {!isLoading && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 mb-8 flex flex-col items-center gap-4"
                >
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            More companies will be updated soon
                        </span>
                        <Sparkles size={12} className="text-purple-500/40" />
                    </div>
                    <p className="text-[10px] text-slate-700 font-medium">
                        Have an experience to share? Help your juniors prepare better.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default InterviewPage;

