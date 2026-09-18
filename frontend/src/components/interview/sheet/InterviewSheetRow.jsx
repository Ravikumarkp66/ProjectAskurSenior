import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLogo from '../../CompanyLogo';
import { ArrowUpRight } from 'lucide-react';

const formatCtc = (rawCtc) => {
    if (!rawCtc || rawCtc === 'Role Based' || rawCtc === 'Not Disclosed') return rawCtc || 'Role Based';
    return /lpa|lakh|L$/i.test(rawCtc) ? rawCtc : `${rawCtc} LPA`;
};

const InterviewSheetRow = ({ item }) => {
    const navigate = useNavigate();
    const slug = item._navSlug || item.companyId || item._id;

    const formattedCtc = formatCtc(item.ctc || item.representativeCtc);
    const cutoffText = item.cutoff ? `≥ ${item.cutoff} CGPA` : 'None';

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
            className="group h-14 border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.03] focus:bg-zinc-100 dark:focus:bg-white/[0.05] transition-colors cursor-pointer outline-none select-none"
        >
            {/* 1. Company Logo + Name + Category Type */}
            <td className="py-2.5 px-4 sm:px-6">
                <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900">
                        <CompanyLogo company={item.company || item.name} logoUrl={item.logo} className="w-6 h-6 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                {item.company || item.name}
                            </span>
                            {item.type && (
                                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
                                    {item.type}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block">
                            {item.industry || 'Technology'}
                        </span>
                    </div>
                </div>
            </td>

            {/* 2. Target Role */}
            <td className="py-2.5 px-4">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate block max-w-[220px]" title={item.role}>
                    {item.role || 'Software Engineer'}
                </span>
            </td>

            {/* 3. Batch */}
            <td className="py-2.5 px-4 whitespace-nowrap">
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {item.batch || '2026'}
                </span>
            </td>

            {/* 4. Package / CTC */}
            <td className="py-2.5 px-4 whitespace-nowrap">
                <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {formattedCtc}
                </span>
            </td>

            {/* 5. CGPA Cutoff */}
            <td className="py-2.5 px-4 whitespace-nowrap text-xs">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {cutoffText}
                </span>
            </td>

            {/* 6. Stories Count */}
            <td className="py-2.5 px-4 whitespace-nowrap text-center">
                <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {item.totalExperiences || item.experienceCount || 0}
                </span>
            </td>

            {/* 7. Action Button */}
            <td className="py-2.5 px-4 sm:px-6 text-right whitespace-nowrap">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 group-hover:border-purple-500/40 text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors"
                >
                    <span>View</span>
                    <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </td>
        </tr>
    );
};

export default InterviewSheetRow;
