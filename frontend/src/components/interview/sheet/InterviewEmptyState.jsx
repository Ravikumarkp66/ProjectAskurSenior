import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

const InterviewEmptyState = ({ searchQuery, onReset }) => {
    return (
        <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center rounded-xl bg-zinc-50/50 dark:bg-[#0e1015]/60 border border-zinc-200 dark:border-white/[0.06]">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
                <SearchX size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                No matching companies found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-5 font-mono">
                {searchQuery ? (
                    <>No placement track matching "{searchQuery}".</>
                ) : (
                    <>No placement records found.</>
                )}
            </p>
            {searchQuery && (
                <button
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-mono transition-colors"
                >
                    <RotateCcw size={12} />
                    <span>Clear Search</span>
                </button>
            )}
        </div>
    );
};

export default InterviewEmptyState;
