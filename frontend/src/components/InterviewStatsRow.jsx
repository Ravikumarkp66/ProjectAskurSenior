import React from 'react';

const InterviewStatsRow = ({ totalCount, stats, isLightMode }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
                <span className={`text-2xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Found <span className="text-purple-500">{totalCount}</span> Experiences
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    SDE: {stats.sde || 0}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Intern: {stats.intern || 0}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Selected: {stats.selected || 0}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Others: {stats.others || 0}
                </div>
            </div>
        </div>
    );
};

export default InterviewStatsRow;
