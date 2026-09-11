import React from 'react';
import InterviewSheetRow from './InterviewSheetRow';

const InterviewSheetTable = ({ items = [] }) => {
    return (
        <div className="w-full rounded-2xl bg-[#0e1015]/90 border border-white/[0.08] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="h-11 bg-[#13161f] border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 select-none">
                            <th className="py-3 px-4 sm:px-6 w-[28%]">Company</th>
                            <th className="py-3 px-4 w-[20%]">Target Role</th>
                            <th className="py-3 px-4 w-[11%]">Batch</th>
                            <th className="py-3 px-4 w-[14%]">Package / CTC</th>
                            <th className="py-3 px-4 w-[11%]">Cutoff</th>
                            <th className="py-3 px-4 w-[10%]">Stories</th>
                            <th className="py-3 px-4 sm:px-6 w-[6%] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
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
