import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExperienceCard from './ExperienceCard';

const ExperienceList = ({ experiences, activeRound, isLightMode }) => {
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRound}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="space-y-10 pb-20"
        >
          {experiences && experiences.length > 0 ? (
            experiences.map((exp, idx) => (
              <ExperienceCard 
                key={`${activeRound}-${idx}`} 
                data={exp} 
                isLightMode={isLightMode} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border border-dashed border-white/10 bg-white/5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-600 mb-6">
                 ---
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">
                No reports for this round found yet
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ExperienceList;
