import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ListTodo, Sparkles } from 'lucide-react';

const ExperienceMiniCard = ({ experience, isLightMode }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
        isLightMode 
          ? 'bg-white border-slate-200 hover:shadow-2xl hover:shadow-purple-500/10' 
          : 'bg-[#111827] border-white/5 hover:bg-white/[0.02] hover:border-white/10 hover:shadow-2xl hover:shadow-black'
      }`}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/10 text-purple-500">
                <Sparkles size={14} />
             </div>
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-500/80">
                {experience.experienceId}
             </span>
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-purple-500/20 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Overview Section */}
          <div className="space-y-4">
            <h5 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              <MessageSquare size={14} className="text-purple-500/50" />
              Round Overview
            </h5>
            <div className={`p-6 rounded-2xl font-medium leading-relaxed italic ${
              isLightMode ? 'bg-slate-50 text-slate-600' : 'bg-black/20 text-slate-400'
            }`}>
              "{experience.overview}"
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <h5 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              <ListTodo size={14} className="text-purple-500/50" />
              Key Questions
            </h5>
            {experience.questions && experience.questions.length > 0 ? (
              <div className="space-y-3">
                {experience.questions.map((q, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                      isLightMode 
                        ? 'bg-white border-slate-100 hover:border-purple-200' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                    <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-black uppercase tracking-widest text-slate-600 italic px-2">No specific questions recorded.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceMiniCard;
