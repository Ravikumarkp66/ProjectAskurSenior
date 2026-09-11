import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

const InterviewEmptyState = ({ searchQuery, onReset }) => {
    return (
        <div className="w-full py-20 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-[#0e1015]/60 border border-white/[0.06]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <SearchX size={32} className="text-purple-400/60" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
                No matching companies found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
                {searchQuery ? (
                    <>We couldn't find any placement track matching <span className="text-purple-300 font-semibold">"{searchQuery}"</span> with the current filters.</>
                ) : (
                    <>No companies match your selected filters. Try broadening your criteria.</>
                )}
            </p>
            <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all"
            >
                <RotateCcw size={13} />
                <span>Reset All Filters</span>
            </button>
        </div>
    );
};

export default InterviewEmptyState;
