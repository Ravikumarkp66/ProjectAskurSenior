import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Calendar, Target, Briefcase, ChevronDown, CheckCircle2, XCircle, Building2, CircleDollarSign } from 'lucide-react';

const ExperienceCard = ({ experience, isExpanded, onToggle, isLightMode }) => {
    // Extract top topics from questions array in rounds
    const topTopics = React.useMemo(() => {
        const topics = new Set();
        experience.rounds.forEach(r => {
            if (r.questions) {
                r.questions.forEach(q => {
                    if (q.includes('DSA') || q.includes('React') || q.includes('Java') || q.includes('Python') || q.includes('System Design')) {
                        topics.add(q.split(' ')[0]);
                    }
                });
            }
        });
        return Array.from(topics).slice(0, 3);
    }, [experience.rounds]);

    return (
        <motion.div
            layout
            className={`group rounded-[2rem] border transition-all overflow-hidden h-fit ${
                isLightMode 
                ? 'bg-white border-slate-200 hover:shadow-xl' 
                : 'bg-white/5 border-white/10 hover:border-purple-500/30'
            } ${isExpanded ? 'ring-2 ring-purple-500/50' : ''}`}
        >
            <div className="p-6 sm:p-8">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
                             <img 
                                src={experience.company?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} 
                                alt={experience.company?.name} 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors truncate max-w-[150px] uppercase">
                                {experience.company?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                <Briefcase size={12} className="text-purple-500" />
                                {experience.role}
                            </div>
                        </div>
                    </div>
                    {experience.selected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={12} />
                            Selected
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider">
                            <XCircle size={12} />
                            Not Selected
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <CircleDollarSign size={16} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">CTC (LPA)</p>
                            <p className="text-sm font-black text-white">{experience.ctc} LPA</p>
                        </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Target size={16} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Difficulty</p>
                            <p className="text-sm font-black text-white">{experience.difficulty}</p>
                        </div>
                    </div>
                </div>

                {/* Topics & Metadata */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex -space-x-2">
                         {topTopics.length > 0 ? topTopics.map((topic, i) => (
                             <div key={i} className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${
                                 isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'
                             }`}>
                                 {topic}
                             </div>
                         )) : <span className="text-[9px] font-black text-slate-600 uppercase">General</span>}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {experience.year}
                        </div>
                    </div>
                </div>

                {/* Preview Text */}
                <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2 italic leading-relaxed">
                    "{experience.overallExperience || "No preview available..."}"
                </p>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 group/like cursor-pointer">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/like:bg-purple-500 group-hover/like:text-white transition-all">
                                <ThumbsUp size={16} />
                            </div>
                            <span className="text-xs font-black text-slate-500 group-hover/like:text-purple-400">{experience.upvotes || 0}</span>
                        </button>
                    </div>

                    <button 
                        onClick={onToggle}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            isExpanded 
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-900/40' 
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {isExpanded ? 'Hide Rounds' : `${experience.rounds?.length || 0} Rounds Detail`}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 mt-8 border-t border-dashed border-white/10 space-y-8">
                                {experience.rounds?.map((round, idx) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-purple-500/20">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-purple-500" />
                                        <div className="mb-4">
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Round {round.roundNumber}</span>
                                            <h4 className="text-lg font-black text-white mt-1 uppercase">{round.type}</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {round.questions?.map((q, qidx) => (
                                                <li key={qidx} className="flex gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-2 shrink-0" />
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{q}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Overall Senior Advice</h4>
                                    <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                                        {experience.overallExperience}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ExperienceCard;
