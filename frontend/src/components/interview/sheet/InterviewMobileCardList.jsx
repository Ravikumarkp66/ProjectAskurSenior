import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLogo from '../../CompanyLogo';
import { 
    ArrowUpRight, 
    Briefcase, 
    Calendar, 
    CircleDollarSign, 
    Award, 
    CheckCircle2 
} from 'lucide-react';

const formatCtc = (rawCtc) => {
    if (!rawCtc || rawCtc === 'Role Based' || rawCtc === 'Not Disclosed') return rawCtc || 'Role Based';
    return /lpa|lakh|L$/i.test(rawCtc) ? rawCtc : `${rawCtc} LPA`;
};

const InterviewMobileCardList = ({ items = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="w-full flex flex-col gap-3">
            {items.map((item, index) => {
                const slug = item._navSlug || item.companyId || item._id;
                const formattedCtc = formatCtc(item.ctc || item.representativeCtc);
                const isProduct = (item.type || '').toLowerCase() === 'product';

                return (
                    <div
                        key={`${item.companyId || item._id}-${item.batch || ''}-${index}`}
                        onClick={() => navigate(`/home/interview/${slug}`)}
                        className="group p-4 rounded-2xl bg-[#0e1015] border border-white/[0.08] hover:border-purple-500/40 active:scale-[0.99] transition-all cursor-pointer shadow-lg relative overflow-hidden"
                    >
                        {/* Top: Logo + Name + Category + Action CTA */}
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                <CompanyLogo company={item.company || item.name} logoUrl={item.logo} className="w-10 h-10 shrink-0" />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                                            {item.company || item.name}
                                        </h3>
                                        {item.type && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                                isProduct 
                                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                            }`}>
                                                {item.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {item.industry || 'Tech & Engineering'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-purple-600 text-slate-400 group-hover:text-white transition-all shrink-0">
                                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>

                        {/* Mid Meta: Role, Batch, CTC */}
                        <div className="flex flex-wrap items-center gap-2 py-2 border-t border-white/[0.04] text-xs">
                            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <Briefcase size={12} className="text-purple-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{item.role || 'SDE'}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                                <Calendar size={11} className="text-indigo-400 shrink-0" />
                                <span>Batch {item.batch || '2026'}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1 text-emerald-400 font-mono font-semibold text-[11px]">
                                <CircleDollarSign size={11} className="shrink-0" />
                                <span>{formattedCtc}</span>
                            </div>
                        </div>

                        {/* Bottom Row: Stories Count + Cutoff */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                                <CheckCircle2 size={11} className="text-purple-400" />
                                {item.totalExperiences || item.experienceCount || 0} Senior Stories
                            </span>

                            {item.cutoff ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                                    <Award size={11} />
                                    ≥ {item.cutoff} CGPA
                                </span>
                            ) : (
                                <span className="text-slate-500">No CGPA Cutoff</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InterviewMobileCardList;
