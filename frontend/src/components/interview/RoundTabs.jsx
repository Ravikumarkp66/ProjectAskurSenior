import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RoundTabs = ({ groupedRounds, activeRound, setActiveRound, isLightMode }) => {
  const roundNumbers = Object.keys(groupedRounds).sort((a, b) => Number(a) - Number(b));

  return (
    <div className={`flex flex-wrap gap-2 p-2 rounded-[2rem] border backdrop-blur-3xl sticky top-8 z-20 shadow-2xl ${
      isLightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827]/80 border-white/5'
    }`}>
      {roundNumbers.map((round) => {
        const isActive = Number(activeRound) === Number(round);
        const count = groupedRounds[round]?.length || 0;

        return (
          <button
            key={round}
            onClick={() => setActiveRound(Number(round))}
            className={`relative px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden group flex-1 md:flex-none ${
              isActive 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {/* Background Glow/Gradient for Active Tab */}
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_10px_30px_rgba(139,92,246,0.3)]"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
                />
              )}
            </AnimatePresence>
            
            {/* Hover State for Inactive Tabs */}
            {!isActive && (
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : ''}`}>
                Round {String(round).padStart(2, '0')}
              </span>
              <div className={`w-1 h-3 rounded-full transition-colors ${isActive ? 'bg-white/40' : 'bg-slate-700'}`} />
              <span className={`text-[9px] ${isActive ? 'text-white/60 font-black' : 'text-slate-600'}`}>
                {count} {count === 1 ? 'Story' : 'Stories'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default RoundTabs;
