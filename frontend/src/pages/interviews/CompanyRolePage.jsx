import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewExperiencesAPI } from '../../services/api';
import { 
    ChevronLeft, 
    Building2, 
    ShieldCheck, 
    Loader2
} from 'lucide-react';
import InterviewRounds from '../../components/interview/InterviewRounds';
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

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Support batch-encoded slugs: "companyId--batch" (used for Amazon split)
                const hasBatch = id.includes('--');
                const actualId = hasBatch ? id.split('--')[0] : id;
                const batchFilter = hasBatch ? id.split('--')[1] : null;

                // Use centralized API service instead of raw fetch to ensure base URL is used
                const compRes = await interviewExperiencesAPI.getCompanies();
                const companies = Array.isArray(compRes.data) ? compRes.data : [];
                
                if (companies.length === 0) {
                    console.error('Expected array from companies API');
                    return;
                }

                // Find company by _id (primary) or name slug (fallback)
                const targetComp = companies.find(c => c._id === actualId) 
                    || companies.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === actualId.toLowerCase());
                
                if (targetComp) {
                    // Fetch experiences, filtering by batch if specified via service
                    const expRes = await interviewExperiencesAPI.getExperiences({
                        companyId: targetComp._id,
                        batch: batchFilter
                    });
                    const expList = Array.isArray(expRes.data) ? expRes.data : [];

                    setExperiences(expList);

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
                        totalExperiences: expList.length,
                        logo: targetComp.logo,
                        ctc: overrides.ctc || targetComp.representativeCtc || targetComp.ctc || 'Role Based',
                        avgRounds: expList.length > 0 
                            ? Math.round(expList.reduce((acc, e) => acc + (e.rounds?.length || 0), 0) / expList.length)
                            : 0
                    });
                } else {
                    console.warn(`Company not found for id: ${actualId}`);
                }
            } catch (error) {
                console.error('Failed to load experiences:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const groupedRounds = useMemo(() => {
        return transformExperiencesByRound(experiences);
    }, [experiences]);

    const isLightMode = theme === 'light';
    const formattedCtc = (companyInfo.ctc === "Role Based" || /lpa|lakh|L$/i.test(companyInfo.ctc)) 
        ? companyInfo.ctc 
        : `${companyInfo.ctc} LPA`;

    if (isLoading) {
        return (
            <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-purple-500" size={36} strokeWidth={2} />
                <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                    Loading Interview Experiences...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-28">
            {/* Top Navigation: Back to Companies */}
            <div className="pt-6 pb-2">
                <Link 
                    to="/home/interview"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 font-medium transition-colors group mb-4"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Companies</span>
                </Link>

                {/* Simplified Company Header: Compact Logo + Hierarchy */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3.5">
                        {/* Compact Company Logo (44px) */}
                        <div className="w-11 h-11 rounded-lg bg-white p-1.5 flex items-center justify-center shrink-0 border border-white/10 shadow-sm overflow-hidden">
                            {companyInfo.logo ? (
                                <img 
                                    src={companyInfo.logo} 
                                    alt={companyInfo.company} 
                                    className="w-full h-full object-contain" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <Building2 size={22} className="text-slate-700" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                                    {companyInfo.company}
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    <ShieldCheck size={12} strokeWidth={2.5} />
                                    <span>Verified</span>
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-1">
                                <span className="font-medium text-slate-300">{companyInfo.role}</span>
                                <span>·</span>
                                <span>{companyInfo.batch}</span>
                                <span>·</span>
                                <span className="text-purple-400 font-mono font-medium">
                                    {experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Statistics Row (CSES / SaaS Dashboard Strip) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] bg-[#11141c] border border-white/[0.08] rounded-xl my-5 p-3 sm:p-4 text-center">
                    <div className="px-3 py-2 sm:py-0">
                        <div className="text-sm sm:text-base font-bold text-white font-mono">
                            {companyInfo.batch || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                            Batch
                        </div>
                    </div>

                    <div className="px-3 py-2 sm:py-0">
                        <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                            {formattedCtc}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                            CTC
                        </div>
                    </div>

                    <div className="px-3 py-2 sm:py-0">
                        <div className="text-sm sm:text-base font-bold text-white font-mono">
                            {companyInfo.totalExperiences}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                            Experiences
                        </div>
                    </div>

                    <div className="px-3 py-2 sm:py-0">
                        <div className="text-sm sm:text-base font-bold text-white font-mono">
                            {companyInfo.avgRounds}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                            Avg Rounds
                        </div>
                    </div>
                </div>
            </div>

            {/* Information-Dense CSES Interview Rounds Section */}
            <InterviewRounds 
                groupedRounds={groupedRounds} 
                isLightMode={isLightMode} 
            />
        </div>
    );
};

export default CompanyRolePage;
