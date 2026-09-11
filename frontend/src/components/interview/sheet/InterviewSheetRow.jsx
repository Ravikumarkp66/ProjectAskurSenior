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

const InterviewSheetRow = ({ item, index }) => {
    const navigate = useNavigate();
    const slug = item._navSlug || item.companyId || item._id;

    const formattedCtc = formatCtc(item.ctc || item.representativeCtc);
    const cutoffText = item.cutoff ? `≥ ${item.cutoff} CGPA` : 'None';
    const isProduct = (item.type || '').toLowerCase() === 'product';

    const handleRowClick = () => {
        navigate(`/home/interview/${slug}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
        }
    };

    return (
        <tr 
            tabIndex={0}
            onClick={handleRowClick}
            onKeyDown={handleKeyDown}
            className="group h-16 border-b border-white/[0.05] hover:bg-purple-500/[0.06] focus:bg-purple-500/[0.08] transition-all cursor-pointer outline-none relative select-none"
        >
            {/* 1. Company Logo + Name + Category Type */}
            <td className="py-3 px-4 sm:px-6">
                <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="transition-transform duration-200 group-hover:scale-105">
                        <CompanyLogo company={item.company || item.name} logoUrl={item.logo} className="w-9 h-9" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                                {item.company || item.name}
                            </span>
                            {item.type && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                    isProduct 
                                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                }`}>
                                    {item.type}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-slate-400 truncate block">
                            {item.industry || 'Tech & Engineering'}
                        </span>
                    </div>
                </div>
            </td>

            {/* 2. Target Role */}
            <td className="py-3 px-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold max-w-[220px] truncate">
                    <Briefcase size={13} className="text-purple-400 shrink-0 opacity-75" />
                    <span className="truncate" title={item.role}>
                        {item.role || 'Software Development Engineer'}
                    </span>
                </div>
            </td>

            {/* 3. Batch */}
            <td className="py-3 px-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 font-mono text-xs font-semibold">
                    <Calendar size={12} className="text-indigo-400" />
                    {item.batch || '2026'}
                </span>
            </td>

            {/* 4. CTC Package */}
            <td className="py-3 px-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-emerald-400">
                    <CircleDollarSign size={13} className="text-emerald-400 opacity-90" />
                    {formattedCtc}
                </span>
            </td>

            {/* 5. CGPA Cutoff */}
            <td className="py-3 px-4 whitespace-nowrap text-xs">
                <span className={`inline-flex items-center gap-1 font-semibold ${
                    item.cutoff ? 'text-amber-300' : 'text-slate-500'
                }`}>
                    <Award size={13} className="opacity-75" />
                    {cutoffText}
                </span>
            </td>

            {/* 6. Stories / Experiences Count */}
            <td className="py-3 px-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-xs">
                    <CheckCircle2 size={12} className="text-purple-400" />
                    {item.totalExperiences || item.experienceCount || 0} Stories
                </span>
            </td>

            {/* 7. Action CTA Button */}
            <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] group-hover:bg-purple-600 border border-white/[0.08] group-hover:border-purple-500 text-slate-300 group-hover:text-white text-xs font-bold transition-all shadow-sm group-hover:shadow-purple-600/30"
                >
                    <span>View Rounds</span>
                    <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </td>
        </tr>
    );
};

export default InterviewSheetRow;
