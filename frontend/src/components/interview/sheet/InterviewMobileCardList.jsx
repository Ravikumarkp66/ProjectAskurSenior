import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CompanyLogo from '../../CompanyLogo';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useAuth } from '../../../utils/hooks';

const formatCtc = (rawCtc) => {
    if (!rawCtc || rawCtc === 'Role Based' || rawCtc === 'Not Disclosed') return rawCtc || 'Role Based';
    return /lpa|lakh|L$/i.test(rawCtc) ? rawCtc : `${rawCtc} LPA`;
};

const InterviewMobileCardList = ({ items = [] }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, hasPlusAccess } = useAuth();

    const viewTooltip = !isAuthenticated 
        ? "Login to view experiences" 
        : "Upgrade to Plus to view experiences";

    const getTargetRoute = (slug) => {
        const basePath = location.pathname.startsWith('/plus') ? '/plus/interview' : '/home/interview';
        return `${basePath}/${slug}`;
    };

    const handleActionClick = (e, slug) => {
        e.stopPropagation();
        if (!hasPlusAccess) {
            if (!isAuthenticated) {
                navigate('/login');
            } else {
                navigate('/plus');
            }
            return;
        }
        navigate(getTargetRoute(slug));
    };

    return (
        <div className="w-full flex flex-col gap-2.5">
            {items.map((item, index) => {
                const slug = item._navSlug || item.companyId || item._id;
                const formattedCtc = formatCtc(item.ctc || item.representativeCtc);

                return (
                    <div
                        key={`${item.companyId || item._id}-${item.batch || ''}-${index}`}
                        onClick={() => navigate(getTargetRoute(slug))}
                        className="group p-3.5 rounded-xl bg-white dark:bg-[#0e1015] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer shadow-sm relative overflow-hidden"
                    >
                        {/* Top: Logo + Name + Category + Action */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900">
                                    <CompanyLogo company={item.company || item.name} logoUrl={item.logo} className="w-6 h-6 object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                            {item.company || item.name}
                                        </h3>
                                        {item.type && (
                                            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
                                                {item.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                        {item.industry || 'Technology'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => handleActionClick(e, slug)}
                                title={viewTooltip}
                                aria-label={viewTooltip}
                                className="p-1 rounded-md text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0"
                            >
                                {hasPlusAccess ? (
                                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                ) : (
                                    <Lock size={13} className="text-zinc-400 dark:text-zinc-500" />
                                )}
                            </button>
                        </div>

                        {/* Mid Meta: Role, Batch, Package */}
                        <div className="flex flex-wrap items-center gap-2 py-1.5 border-t border-zinc-100 dark:border-white/[0.04] text-xs">
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[140px]">
                                {item.role || 'Software Engineer'}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                                Batch {item.batch || '2026'}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                {formattedCtc}
                            </span>
                        </div>

                        {/* Bottom Row: Stories Count + Cutoff */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-white/[0.04] text-[11px] font-mono">
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {item.totalExperiences || item.experienceCount || 0} experiences
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-500">
                                {item.cutoff ? `≥ ${item.cutoff} CGPA` : 'No cutoff'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InterviewMobileCardList;
