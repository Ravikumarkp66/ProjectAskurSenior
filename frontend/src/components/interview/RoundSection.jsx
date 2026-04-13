import React from 'react';
import { motion } from 'framer-motion';
import ExperienceMiniCard from './ExperienceMiniCard';

const RoundSection = ({ roundNumber, experiences, isLightMode }) => {
  return (
    <section className="mb-20">
      {/* Round Header */}
      <div className="flex items-center gap-6 mb-12 px-4">
        <div className="relative">
            <h3 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Round {roundNumber}
            </h3>
            <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-purple-600 rounded-full"></div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent"></div>
        <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">
                {experiences.length} {experiences.length === 1 ? 'Story' : 'Stories'}
            </span>
        </div>
      </div>
      
      {/* Experience Cards Stack */}
      <div className="space-y-8">
        {experiences.map((exp, idx) => (
          <ExperienceMiniCard 
            key={`${roundNumber}-${idx}`} 
            experience={exp} 
            isLightMode={isLightMode} 
          />
        ))}
      </div>
    </section>
  );
};

export default RoundSection;
