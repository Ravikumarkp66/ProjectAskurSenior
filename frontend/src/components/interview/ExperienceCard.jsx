import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ThumbsUp, 
  Bookmark, 
  Copy, 
  CheckCircle, 
  Quote, 
  MessageSquare, 
  Terminal, 
  AlertCircle
} from 'lucide-react';
import { interviewExperiencesAPI } from '../../services/api';

const ExperienceCard = ({ data: initialData, isLightMode }) => {
  const [data, setData] = useState(initialData);
  const [isOpen, setIsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(data.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const overviewText = Array.isArray(data.overview) ? data.overview.join('\n') : data.overview;
    const text = `${data.experienceId}\n\nOVERVIEW:\n${overviewText}\n\nQUESTIONS:\n${data.questions.join('\n')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!hasUpvoted) {
      setUpvoteCount(prev => prev + 1);
      setHasUpvoted(true);
      try {
        await interviewExperiencesAPI.upvoteExperience(data._id);
      } catch (error) {
        console.error('Failed to upvote:', error);
      }
    } else {
      setUpvoteCount(prev => prev - 1);
      setHasUpvoted(false);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <motion.div 
      layout
      className={`group relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
        isLightMode 
          ? 'bg-white border-slate-200/80 hover:border-purple-300 shadow-xl shadow-purple-500/5' 
          : 'bg-[#161B22]/40 backdrop-blur-2xl border-white/5 hover:border-white/10 shadow-2xl hover:shadow-purple-500/5'
      }`}
    >
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-8 md:p-10 cursor-pointer"
      >
        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform duration-500 group-hover:scale-105 shadow-inner ${
              isLightMode ? 'bg-purple-50 text-purple-600' : 'bg-white/5 text-purple-400 border border-white/5'
            }`}>
              <Quote size={24} className="opacity-80" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                  {data.experienceId}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-xs font-bold text-slate-400">
                  Round {data.roundNumber}: {data.roundType}
                </span>
              </div>
              <h3 className={`text-xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {data.companyName}
              </h3>
              {data.role && (
                <span className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    {data.role}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-slate-500 mr-4">
                <button 
                  onClick={handleUpvote}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                    hasUpvoted ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-lg shadow-purple-900/10' : 'bg-white/5 border-white/5 hover:border-purple-500/30'
                  }`}
                >
                  <ThumbsUp size={14} fill={hasUpvoted ? "currentColor" : "none"} />
                  <span className="text-[10px] font-black">{upvoteCount}</span>
                </button>
                
                <button 
                  onClick={handleBookmark}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isBookmarked ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/5 border-white/5 hover:border-purple-500/30'
                  }`}
                >
                  <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                </button>
                
                <button 
                  onClick={handleCopy}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isCopied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                  }`}
                >
                  {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                className={isLightMode ? 'text-slate-400' : 'text-slate-600 group-hover:text-purple-400 transition-colors'}
              >
                <ChevronDown size={20} strokeWidth={3} />
              </motion.div>
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isOpen && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500 line-clamp-2 mt-8 font-medium leading-relaxed"
            >
                {Array.isArray(data.overview) 
                  ? (typeof data.overview[0] === 'string' ? data.overview[0] : '') 
                  : (typeof data.overview === 'string' ? data.overview : '')}
            </motion.p>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden"
            >
                <div className="pt-8 md:pt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Overview Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={16} className="text-purple-500 opacity-50" />
                                <h4 className={`text-[11px] font-black uppercase tracking-[0.25em] ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Detailed Overview
                                </h4>
                            </div>
                        </div>

                        <div className={`text-[15px] leading-[1.8] font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'} whitespace-pre-line`}>
                          {Array.isArray(data.overview) ? (
                            <ul className="space-y-4">
                              {data.overview.map((point, idx) => (
                                <li key={idx} className="flex gap-4">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                                {typeof data.overview === 'string' ? data.overview : 'No overview provided'}
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Questions Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Terminal size={16} className="text-purple-500 opacity-50" />
                                <h4 className={`text-[11px] font-black uppercase tracking-[0.25em] ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Interview Questions
                                </h4>
                            </div>
                        </div>

                        {data.questions && data.questions.length > 0 ? (
                        <div className="space-y-4">
                            {data.questions.map((q, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={idx} 
                              onClick={(e) => e.stopPropagation()}
                              className={`p-6 rounded-3xl border transition-all duration-300 ${
                                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#1F2937]/50 border-white/5 text-slate-200'
                              } group/q hover:scale-[1.02] hover:-translate-y-1`}
                            >
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <span className="text-purple-500 font-black opacity-30 select-none">Q{idx + 1}</span>
                                    <p className="flex-1">
                                      {(() => {
                                        if (typeof q === 'string') return q;
                                        if (q && q.text) return q.text;
                                        const parts = Object.keys(q || {})
                                          .filter(k => !isNaN(k))
                                          .sort((a, b) => Number(a) - Number(b))
                                          .map(k => q[k]);
                                        return parts.length > 0 ? parts.join('') : '';
                                      })()}
                                    </p>
                                  </div>
                                  
                                  {q.solveLink && (
                                    <a 
                                      href={q.solveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-3 self-center sm:self-end px-5 py-2.5 rounded-full border border-purple-500/50 bg-purple-500/5 text-purple-400 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-lg shadow-purple-900/10"
                                    >
                                      Solve Problem
                                      <div className="flex items-center bg-[#0a0a0b] h-7 sm:h-8 px-2 rounded-full border border-white/20 group-hover:border-white/40 transition-all overflow-hidden shrink-0">
                                        <img 
                                          src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/takeuforward-icon-filled-256.png" 
                                          alt="TUF" 
                                          className="h-full w-auto object-contain scale-125"
                                        />
                                      </div>
                                    </a>
                                  )}
                                </div>
                            </motion.div>
                            ))}
                        </div>
                        ) : (
                        <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <AlertCircle size={20} className="text-slate-700" />
                            </div>
                            <p className="text-xs italic text-slate-600">No questions provided for this round.</p>
                        </div>
                        )}
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
