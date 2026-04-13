import React from 'react';
import { Brain, Terminal, Users, UserCheck } from 'lucide-react';

const RoundItem = ({ round, isLightMode }) => {
    return (
        <div className="relative pl-8 pb-10 last:pb-0">
            {/* Timeline Trace */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5"></div>
            <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-1">Round {round.roundNumber}</p>
                        <h4 className={`text-xl font-bold uppercase tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {round.type} Experience
                        </h4>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                        isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                        {round.type} Phase
                    </div>
                </div>

                {/* Topics */}
                {round.topics && round.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {round.topics.map((topic, index) => (
                            <span 
                                key={index}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20"
                            >
                                <Brain size={10} />
                                {topic}
                            </span>
                        ))}
                    </div>
                )}

                {/* Notes */}
                {round.notes && (
                    <div className={`p-5 rounded-2xl border leading-relaxed text-sm font-medium font-outfit ${
                        isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600 italic' : 'bg-[#0a0a0b] border-white/5 text-slate-400 italic'
                    }`}>
                        "{round.notes}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoundItem;
