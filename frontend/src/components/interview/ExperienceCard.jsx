import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ThumbsUp, 
  Bookmark, 
  Copy, 
  Check, 
  MessageSquare, 
  Terminal, 
  ExternalLink,
  AlertCircle,
  Lock
} from 'lucide-react';
import { interviewExperiencesAPI } from '../../services/api';
import { useAuth } from '../../utils/hooks';

const ExperienceCard = ({ data: initialData, isLightMode, defaultExpanded = true }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(initialData);
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(data.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  React.useEffect(() => {
    setData(initialData);
    setUpvoteCount(initialData?.upvotes || 0);
  }, [initialData]);

  const isLocked = Boolean(data?.isLocked);

  const handleUnlockAction = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/plus');
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    const overviewText = Array.isArray(data.overview) ? data.overview.join('\n') : data.overview;
    const questionsText = (data.questions || []).map((q, i) => {
      const qText = typeof q === 'string' ? q : q?.text || '';
      const link = typeof q === 'object' && q?.solveLink ? ` (${q.solveLink})` : '';
      return `Q${i + 1}: ${qText}${link}`;
    }).join('\n');
    const text = `${data.experienceId || 'Interview Experience'} - ${data.companyName || ''} (Round ${data.roundNumber})\n\nOVERVIEW:\n${overviewText}\n\nQUESTIONS:\n${questionsText}`;
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
    <div 
      className={`rounded-xl border transition-colors overflow-hidden ${
        isLightMode 
          ? 'bg-white border-slate-200 hover:border-slate-300' 
          : 'bg-[#0e1117] border-white/[0.08] hover:border-white/[0.16]'
      }`}
    >
      {/* Experience Header Row */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 border-b transition-colors select-none ${
          isLightMode 
            ? 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200' 
            : 'bg-[#121620]/80 hover:bg-[#161b26] border-white/[0.06]'
        }`}
      >
        {/* Left: Metadata Hierarchy */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-400 shrink-0">
            {data.experienceId || 'Experience'}
          </span>
          <span className="text-slate-600 dark:text-slate-500">•</span>
          <span className="text-xs text-slate-400 font-medium shrink-0">
            Round {data.roundNumber}
          </span>
          {(data.roundType || data.role) && (
            <>
              <span className="text-slate-600 dark:text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide truncate max-w-[200px] sm:max-w-xs">
                {data.roundType || data.role}
              </span>
            </>
          )}
        </div>

        {/* Right: Actions + Chevron */}
        {isLocked ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/[0.04]">
              <Lock size={10} className="text-zinc-400 dark:text-zinc-500" />
              <span>Locked</span>
            </span>
            <div className="pl-1 text-slate-400">
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} 
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button 
              type="button"
              onClick={handleUpvote}
              title="Upvote"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border ${
                hasUpvoted 
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <ThumbsUp size={12} fill={hasUpvoted ? "currentColor" : "none"} />
              <span>{upvoteCount}</span>
            </button>
            
            <button 
              type="button"
              onClick={handleBookmark}
              title={isBookmarked ? "Bookmarked" : "Bookmark"}
              className={`p-1.5 rounded transition-colors border ${
                isBookmarked 
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-purple-400'
              }`}
            >
              <Bookmark size={13} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            
            <button 
              type="button"
              onClick={handleCopy}
              title="Copy Experience"
              className={`p-1.5 rounded transition-colors border ${
                isCopied 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              {isCopied ? <Check size={13} /> : <Copy size={13} />}
            </button>

            <div className="pl-1 text-slate-400">
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Collapsed One-line Preview */}
      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 text-xs text-slate-400 hover:text-slate-300 line-clamp-1 italic cursor-pointer font-sans"
        >
          {isLocked ? (
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 not-italic">
              <Lock size={11} className="text-zinc-400 shrink-0" />
              <span>Interview experience locked · Click to preview topics</span>
            </span>
          ) : Array.isArray(data.overview) 
            ? (data.overview[0] || 'Click to expand overview & questions...') 
            : (data.overview || 'Click to expand overview & questions...')}
        </div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isLocked ? (
              <div className="p-4 sm:p-5 font-sans space-y-4">
                {/* Topics Covered Preview */}
                {Array.isArray(data.topicsCovered) && data.topicsCovered.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Topics covered
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      {data.topicsCovered.map((topic, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-purple-500 dark:text-purple-400 font-bold select-none">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concise Locked Box */}
                <div className="p-5 rounded-lg bg-zinc-50 dark:bg-[#121620] border border-zinc-200 dark:border-white/[0.08] text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2.5">
                    <Lock size={15} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Interview experience locked
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Detailed interview questions, round-by-round experiences and candidate insights are available with AskUrSenior Plus.
                  </p>
                  <button
                    type="button"
                    onClick={handleUnlockAction}
                    className="mt-3.5 px-4 py-2 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <Lock size={12} />
                    <span>{!isAuthenticated ? "Login to Unlock" : "Unlock with Plus"}</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 font-sans">
              {/* Left Column: Detailed Overview */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <MessageSquare size={13} className="text-purple-400" />
                  <span>Detailed Overview</span>
                </div>

                <div className={`text-xs sm:text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                  {Array.isArray(data.overview) && data.overview.length > 0 ? (
                    <ul className="space-y-2">
                      {data.overview.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 select-none font-bold mt-0.5">•</span>
                          <span className="flex-1">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : typeof data.overview === 'string' && data.overview.trim() ? (
                    <p className="whitespace-pre-line leading-relaxed">{data.overview}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 rounded-lg border border-dashed border-white/[0.08]">
                      No detailed overview provided for this round.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Interview Questions */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <Terminal size={13} className="text-purple-400" />
                    <span>Interview Questions ({data.questions?.length || 0})</span>
                  </div>
                </div>

                {data.questions && data.questions.length > 0 ? (
                  <div className="space-y-2">
                    {data.questions.map((q, idx) => {
                      const qText = typeof q === 'string' 
                        ? q 
                        : (q?.text || (Object.keys(q || {}).filter(k => !isNaN(k)).sort((a,b) => a-b).map(k => q[k]).join('')));
                      const solveLink = typeof q === 'object' ? q?.solveLink : null;

                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-[#141721] border border-white/[0.05] hover:border-white/[0.12] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className="font-mono text-xs font-bold text-purple-400 shrink-0 select-none pt-0.5">
                              Q{idx + 1}
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed break-words">
                              {qText}
                            </p>
                          </div>

                          {solveLink && (
                            <a 
                              href={solveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-mono font-medium shrink-0 transition-colors self-start sm:self-center"
                            >
                              <span>Solve Problem</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/[0.08] rounded-lg flex items-center gap-2 text-xs text-slate-500 italic">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>No specific questions recorded for this round.</span>
                  </div>
                )}
              </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExperienceCard;
