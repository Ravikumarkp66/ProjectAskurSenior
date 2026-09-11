import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Layers, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExperienceCard from './ExperienceCard';

const ITEMS_PER_PAGE = 10;

const InterviewRounds = ({ groupedRounds = {}, isLightMode = false }) => {
  const roundNumbers = useMemo(() => {
    return Object.keys(groupedRounds).sort((a, b) => Number(a) - Number(b));
  }, [groupedRounds]);

  const totalStories = useMemo(() => {
    return roundNumbers.reduce((acc, r) => acc + (groupedRounds[r]?.length || 0), 0);
  }, [groupedRounds, roundNumbers]);

  // Track expanded rounds - default: expand all rounds initially so students see content immediately
  const [expandedRounds, setExpandedRounds] = useState(() => {
    return new Set(roundNumbers);
  });

  // Unified single page state across all or per filtered round
  const [currentPage, setCurrentPage] = useState(1);

  // Quick filter to isolate a specific round or show all
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('all');

  // Handle round filter switch
  const handleSelectFilter = (filterKey) => {
    setSelectedRoundFilter(filterKey);
    setCurrentPage(1);
    if (filterKey === 'all') {
      setExpandedRounds(new Set(roundNumbers));
    } else {
      setExpandedRounds(new Set([filterKey]));
    }
  };

  const toggleRound = (roundNum) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundNum)) {
        next.delete(roundNum);
      } else {
        next.add(roundNum);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedRounds(new Set(roundNumbers));
  };

  const handleCollapseAll = () => {
    setExpandedRounds(new Set());
  };

  // Merge active experiences: when 'all', concatenate R1 + R2 + ... into a single stream
  const activeExperiences = useMemo(() => {
    if (selectedRoundFilter === 'all') {
      return roundNumbers.flatMap((r) => groupedRounds[r] || []);
    }
    return groupedRounds[selectedRoundFilter] || [];
  }, [roundNumbers, groupedRounds, selectedRoundFilter]);

  const totalPages = Math.max(1, Math.ceil(activeExperiences.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  // Slice the 10 experiences for the current page
  const pageExperiences = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return activeExperiences.slice(start, start + ITEMS_PER_PAGE);
  }, [activeExperiences, safePage]);

  // Group the current page's 10 experiences by round so round headers are maintained
  const pageGroupedByRound = useMemo(() => {
    const groups = {};
    pageExperiences.forEach((exp) => {
      const r = String(exp.roundNumber || 1);
      if (!groups[r]) groups[r] = [];
      groups[r].push(exp);
    });
    return groups;
  }, [pageExperiences]);

  const pageRoundNumbers = useMemo(() => {
    return Object.keys(pageGroupedByRound).sort((a, b) => Number(a) - Number(b));
  }, [pageGroupedByRound]);

  if (roundNumbers.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-white/[0.08] rounded-xl my-8">
        <HelpCircle size={28} className="mx-auto text-slate-600 mb-2" />
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
          No interview rounds recorded for this company role yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 my-6">
      {/* Section Header & Compact Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Layers size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                INTERVIEW ROUNDS
              </h2>
              <span className="text-[11px] text-purple-400 font-mono font-medium">
                ({roundNumbers.length} {roundNumbers.length === 1 ? 'round' : 'rounds'} · {totalStories} {totalStories === 1 ? 'story' : 'stories'})
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Quick Filter Pills + Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-2">
          {roundNumbers.length > 1 && (
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => handleSelectFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedRoundFilter === 'all'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({totalStories})
              </button>
              {roundNumbers.map((r) => {
                const count = groupedRounds[r]?.length || 0;
                const isSelected = String(selectedRoundFilter) === String(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectFilter(r)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    R{r} ({count})
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-slate-400 hover:text-purple-400 transition-colors"
            >
              Expand All
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-slate-400 hover:text-purple-400 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* CSES-Style Round Sections */}
      <div className="space-y-3">
        {pageRoundNumbers.map((roundNum) => {
          const experiencesInPage = pageGroupedByRound[roundNum] || [];
          const totalInThisRound = groupedRounds[roundNum]?.length || experiencesInPage.length;
          const isExpanded = expandedRounds.has(roundNum);
          const representativeType = experiencesInPage[0]?.roundType || 'Round Details';

          return (
            <div
              key={roundNum}
              className={`rounded-xl border transition-colors overflow-hidden ${
                isLightMode
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-[#10131b] border-white/[0.08]'
              }`}
            >
              {/* Round Accordion Header Row */}
              <div
                onClick={() => toggleRound(roundNum)}
                className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                  isLightMode
                    ? 'hover:bg-slate-50'
                    : 'hover:bg-white/[0.02]'
                } ${isExpanded ? 'border-b border-white/[0.06]' : ''}`}
              >
                {/* Left: Round Number & Type Tag */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    ROUND {String(roundNum).padStart(2, '0')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    {representativeType}
                  </span>
                </div>

                {/* Right: Story Count & Chevron */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400 font-medium">
                    {totalInThisRound} {totalInThisRound === 1 ? 'STORY' : 'STORIES'}
                  </span>
                  <div className="p-1 rounded text-slate-400">
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-purple-400' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Collapsed/Expanded Experiences Area */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 sm:p-4 space-y-3 bg-[#0a0c10]/40">
                      {experiencesInPage.map((exp, idx) => (
                        <ExperienceCard
                          key={`${roundNum}-${exp._id || idx}`}
                          data={exp}
                          isLightMode={isLightMode}
                          defaultExpanded={true}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Unified Single Pagination Bar at the Bottom */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.08] text-xs font-mono my-4">
          <span className="text-slate-400 text-[11px]">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, activeExperiences.length)} of {activeExperiences.length} experiences
          </span>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors inline-flex items-center gap-1 text-[11px]"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                totalPages > 7 &&
                p !== 1 &&
                p !== totalPages &&
                Math.abs(p - safePage) > 1
              ) {
                if (p === 2 || p === totalPages - 1) {
                  return (
                    <span key={p} className="text-slate-600 px-1 select-none">
                      ...
                    </span>
                  );
                }
                return null;
              }

              const isActive = p === safePage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`min-w-[26px] h-[26px] px-1.5 rounded text-[11px] font-mono transition-colors border ${
                    isActive
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors inline-flex items-center gap-1 text-[11px]"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRounds;

