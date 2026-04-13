import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    Building2, 
    Calendar, 
    Target, 
    HelpCircle, 
    Layers, 
    Loader2, 
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import RoundTabs from '../../components/interview/RoundTabs';
import ExperienceList from '../../components/interview/ExperienceList';
import { transformExperiencesByRound } from '../../utils/interviewTransform';

const DUMMY_COMPANY_ROLE = {
  company: "Loading...",
  role: "Interview Experiences",
  batch: "...",
  ctc: "Role Based",
  totalExperiences: 0,
  avgRounds: 0
};

const CompanyRolePage = () => {
    const { id } = useParams();
    const [theme] = useState(() => localStorage.getItem('uiTheme') || 'dark');
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState(DUMMY_COMPANY_ROLE);
    
    const parsedParams = useMemo(() => {
        if (!id || !id.includes('-')) return { company: id?.toUpperCase() || '', role: 'INTERVIEW EXPERIENCES', batch: '2026' };
        const parts = id.split('-');
        const batch = parts.pop();
        const company = parts[0] ? parts[0].toUpperCase() : '';
        const role = parts.length > 1 ? parts.slice(1).join(' ').toUpperCase() : 'INTERVIEW EXPERIENCES';
        return { company, role, batch };
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Support batch-encoded slugs: "companyId--batch" (used for Amazon split)
                const hasBatch = id.includes('--');
                const actualId = hasBatch ? id.split('--')[0] : id;
                const batchFilter = hasBatch ? id.split('--')[1] : null;

                const compRes = await fetch('/api/experiences/companies');
                const companies = await compRes.json();
                
                if (!Array.isArray(companies)) {
                    console.error('Expected array from companies API');
                    return;
                }

                // Find company by _id (primary) or name slug (fallback)
                const targetComp = companies.find(c => c._id === actualId) 
                    || companies.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === actualId.toLowerCase());
                
                if (targetComp) {
                    // Fetch experiences, filtering by batch if specified
                    let url = `/api/experiences/list?companyId=${targetComp._id}`;
                    if (batchFilter) url += `&batch=${batchFilter}`;

                    const expRes = await fetch(url);
                    const expData = await expRes.json();
                    const experiences = Array.isArray(expData) ? expData : [];

                    setExperiences(experiences);

                    // Company-specific display overrides
                    const companyOverrides = {
                        'MORGAN STANLEY': { role: 'INTERN (PPO)', ctc: '87K - 1.07L' }
                    };
                    const overrides = companyOverrides[targetComp.name.toUpperCase()] || {};

                    setCompanyInfo({
                        ...DUMMY_COMPANY_ROLE,
                        company: targetComp.name,
                        role: overrides.role || (targetComp.representativeRole || 'Interview Experiences').toUpperCase(),
                        batch: batchFilter || targetComp.representativeBatch || '2026',
                        totalExperiences: experiences.length,
                        logo: targetComp.logo,
                        ctc: overrides.ctc || targetComp.representativeCtc || targetComp.ctc || 'Role Based',
                        avgRounds: experiences.length > 0 
                            ? Math.round(experiences.reduce((acc, e) => acc + (e.rounds?.length || 0), 0) / experiences.length)
                            : 0
                    });
                } else {
                    console.warn(`Company not found for id: ${actualId}`);
                }
            } catch (error) {
                console.error('Failed to load experiences:', error);
            } finally {
                setTimeout(() => setIsLoading(false), 500);
            }
        };
        fetchData();
    }, [id]);

    const groupedRounds = useMemo(() => {
        return transformExperiencesByRound(experiences);
    }, [experiences]);

    const roundNumbers = useMemo(() => Object.keys(groupedRounds).sort((a, b) => Number(a) - Number(b)), [groupedRounds]);
    const [activeRound, setActiveRound] = useState(1);

    useEffect(() => {
        if (roundNumbers.length > 0) {
            setActiveRound(Number(roundNumbers[0]));
        }
    }, [roundNumbers]);

    const isLightMode = theme === 'light';

    const statsConfig = [
        { label: 'Batch Year', value: companyInfo.batch, icon: Calendar, color: 'text-slate-400' },
        { 
            label: 'CTC Package', 
            value: (companyInfo.ctc === "Role Based" || /lpa|lakh|L$/i.test(companyInfo.ctc)) ? companyInfo.ctc : `${companyInfo.ctc} LPA`, 
            icon: Target, 
            shadow: "shadow-emerald-900/10", 
            color: 'text-emerald-400', 
            special: true 
        },
        { label: 'Total Stories', value: companyInfo.totalExperiences, icon: Layers, color: 'text-slate-400' },
        { label: 'Avg Rounds', value: companyInfo.avgRounds, icon: HelpCircle, color: 'text-slate-400' },
    ];

    if (isLoading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="animate-spin text-purple-500" size={64} strokeWidth={1.5} />
                    <Sparkles className="absolute -top-2 -right-2 text-purple-400 animate-pulse" size={20} />
                </div>
                <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px]">Assembling Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-6 pb-40">
            {/* Header Area */}
            <div className="mb-24 pt-10">
                <Link 
                    to="/interview"
                    className="flex items-center gap-2 text-slate-500 hover:text-purple-500 transition-all font-black mb-16 text-[10px] uppercase tracking-[0.3em] group w-fit"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Companies
                </Link>

                <div className="flex flex-col gap-12">
                    {/* Brand Title - Visual Hierarchy Fix */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row md:items-center gap-10"
                    >
                        <div className="w-28 h-28 rounded-[2.5rem] bg-white border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] p-6 shrink-0 transition-all duration-700 hover:scale-110 hover:-rotate-3 group relative">
                            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-full" />
                            {companyInfo.logo ? (
                                <img src={companyInfo.logo} alt={companyInfo.company} className="w-full h-full object-contain relative z-10" />
                            ) : (
                                <Building2 size={40} className="text-slate-800 relative z-10" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className={`text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                    {companyInfo.company}
                                </h1>
                                <div className="hidden md:flex p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <ShieldCheck size={24} className="text-emerald-500" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 shadow-lg shadow-purple-900/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">{companyInfo.role}</p>
                                </div>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">SIT Exclusive Report</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Enhanced Stats Bar - Premium Product Feel */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`grid grid-cols-2 md:grid-cols-4 gap-0 p-2 rounded-[3rem] border shadow-2xl overflow-hidden ${
                            isLightMode ? 'bg-white border-slate-200' : 'bg-[#111827]/80 backdrop-blur-3xl border-white/5'
                        }`}
                    >
                        {statsConfig.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className={`relative px-8 py-10 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/[0.04] border-white/5 group ${
                                        idx !== statsConfig.length - 1 ? 'md:border-r border-b md:border-b-0' : ''
                                    }`}
                                >
                                    <div className={`mb-5 p-3 rounded-2xl bg-white/5 transition-transform group-hover:scale-110 group-hover:rotate-3 ${stat.color}`}>
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] mb-3">{stat.label}</p>
                                    <p className={`text-2xl font-black tracking-tight ${stat.color} group-hover:scale-105 transition-transform`}>
                                        {stat.value}
                                    </p>
                                    {stat.special && (
                                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Preparation Board Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-10 mb-12 md:mb-20 px-6 md:px-8">
                <div className="flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <Layers size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className={`text-4xl font-black uppercase tracking-tighter leading-none mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            Interview <span className="text-purple-500">rounds</span>
                        </h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Curated by SIT Seniors</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{experiences.length} Seniors shared</p>
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <RoundTabs 
                groupedRounds={groupedRounds} 
                activeRound={activeRound} 
                setActiveRound={setActiveRound} 
                isLightMode={isLightMode} 
            />

            <div className="mt-12">
                <ExperienceList 
                    experiences={groupedRounds[activeRound]} 
                    activeRound={activeRound}
                    isLightMode={isLightMode} 
                />
            </div>
        </div>
    );
};

export default CompanyRolePage;
