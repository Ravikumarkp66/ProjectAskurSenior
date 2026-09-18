import React from 'react';
import InterviewSheetRow from './InterviewSheetRow';

const InterviewSheetTable = ({ items = [] }) => {
    return (
        <div className="w-full rounded-xl bg-white dark:bg-[#0e1015] border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="h-10 bg-zinc-50 dark:bg-[#13161f] border-b border-zinc-200 dark:border-white/[0.08] text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
                            <th className="py-2.5 px-4 sm:px-6 w-[28%]">Company</th>
                            <th className="py-2.5 px-4 w-[22%]">Target Role</th>
                            <th className="py-2.5 px-4 w-[11%]">Batch</th>
                            <th className="py-2.5 px-4 w-[14%]">Package</th>
                            <th className="py-2.5 px-4 w-[11%]">Cutoff</th>
                            <th className="py-2.5 px-4 w-[8%] text-center">Stories</th>
                            <th className="py-2.5 px-4 sm:px-6 w-[6%] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                        {items.map((item, index) => (
                            <InterviewSheetRow 
                                key={`${item.companyId || item._id}-${item.batch || ''}-${index}`} 
                                item={item} 
                                index={index} 
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InterviewSheetTable;
