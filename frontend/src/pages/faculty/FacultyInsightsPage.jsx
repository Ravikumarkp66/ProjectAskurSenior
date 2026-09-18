import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, ArrowRight, Loader2, RotateCcw, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { facultyInsightAPI } from '../../services/api/facultyInsightApi';
import FacultyInsightDetailModal from '../../components/faculty/FacultyInsightDetailModal';
import FacultyFeedbackFormModal from '../../components/faculty/FacultyFeedbackFormModal';
import { FACULTY_DEPARTMENTS } from '../../data/facultyData';

const ITEMS_PER_PAGE = 20;

export default function FacultyInsightsPage() {
  const { facultyId: routeFacultyId, subjectCode: routeSubjectCode } = useParams();
  const contentTopRef = useRef(null);

  const [insightsList, setInsightsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [draftDept, setDraftDept] = useState('all');
  const [draftSemester, setDraftSemester] = useState('all');
  const [draftAcademicYear, setDraftAcademicYear] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleFilters = () => {
    if (!isFilterOpen) {
      setDraftDept(selectedDept);
      setDraftSemester(selectedSemester);
      setDraftAcademicYear(selectedAcademicYear);
    }
    setIsFilterOpen((prev) => !prev);
  };

  const handleApplyFilters = () => {
    setSelectedDept(draftDept);
    setSelectedSemester(draftSemester);
    setSelectedAcademicYear(draftAcademicYear);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setDraftDept('all');
    setDraftSemester('all');
    setDraftAcademicYear('all');
    setSelectedDept('all');
    setSelectedSemester('all');
    setSelectedAcademicYear('all');
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Modals state
  const [detailFaculty, setDetailFaculty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [feedbackFaculty, setFeedbackFaculty] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await facultyInsightAPI.getAll();
      if (res && res.success && Array.isArray(res.data)) {
        setInsightsList(res.data);
      }
    } catch (err) {
      console.error('Failed to load faculty insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedSemester, selectedAcademicYear]);

  // Route URL parameter matching (e.g. /faculty-insights/:facultyId)
  useEffect(() => {
    if (routeFacultyId && insightsList.length > 0) {
      const target = insightsList.find(
        (i) => i.facultyId === routeFacultyId || i.facultyCode === routeFacultyId || i.id === routeFacultyId
      );
      if (target) {
        setDetailFaculty(target);
        setIsDetailModalOpen(true);
        facultyInsightAPI
          .getSingle(target.facultyId, routeSubjectCode || null)
          .then((res) => {
            if (res?.success && res.data) {
              setDetailFaculty(res.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [routeFacultyId, routeSubjectCode, insightsList]);

  // Filter logic
  const filteredInsights = useMemo(() => {
    return insightsList.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.designation || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q) ||
        (item.reviewedSubjects || []).some(
          (s) =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.code || '').toLowerCase().includes(q)
        );

      const matchesDept =
        selectedDept === 'all' ||
        (item.department || '').toUpperCase() === selectedDept.toUpperCase();

      const matchesYear =
        selectedAcademicYear === 'all' ||
        (item.academicYear || '') === selectedAcademicYear;

      return matchesSearch && matchesDept && matchesYear;
    });
  }, [insightsList, searchQuery, selectedDept, selectedAcademicYear]);

  // Pagination calculations: exactly 20 faculties per page
  const totalPages = Math.ceil(filteredInsights.length / ITEMS_PER_PAGE) || 1;
  const paginatedInsights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInsights.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInsights, currentPage]);

  const startRecord = filteredInsights.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, filteredInsights.length);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (contentTopRef.current) {
        contentTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const hasActiveFilters =
    selectedDept !== 'all' || selectedSemester !== 'all' || selectedAcademicYear !== 'all';

  const handleOpenDetail = (item, subjectCode = null) => {
    setDetailFaculty({ ...item, selectedSubjectCode: subjectCode || 'ALL' });
    setIsDetailModalOpen(true);
    facultyInsightAPI
      .getSingle(item.facultyId, subjectCode)
      .then((res) => {
        if (res?.success && res.data) {
          setDetailFaculty(res.data);
        }
      })
      .catch(() => {});
  };

  const handleOpenFeedback = (item, subjectCode = null) => {
    setFeedbackFaculty({ ...item, selectedSubjectCode: subjectCode || '' });
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSuccess = () => {
    fetchInsights();
    if (detailFaculty) {
      facultyInsightAPI
        .getSingle(detailFaculty.facultyId, detailFaculty.selectedSubjectCode || null)
        .then((res) => {
          if (res?.success && res.data) {
            setDetailFaculty(res.data);
          }
        })
        .catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 pb-20">
      {/* 1. Header with Compact Meta */}
      <div className="border-b border-slate-800/80 bg-[#090D1A]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider font-mono text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                FACULTY INSIGHTS
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore student feedback, teaching ratings, and course insights.
              </p>
            </div>

            <div className="text-xs text-slate-400 font-mono shrink-0">
              <span className="text-purple-400 font-semibold">{filteredInsights.length}</span> faculty members
            </div>
          </div>
        </div>
      </div>

      <div ref={contentTopRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* 2. Compact CSES Utility Bar: Search + [Filters] Button */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty, subject, course code..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#0B101E] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filters Trigger */}
            <button
              type="button"
              onClick={toggleFilters}
              className={`px-3.5 py-2 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 shrink-0 ${
                hasActiveFilters || isFilterOpen
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                  : 'bg-[#0B101E] text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>

            {/* Reset */}
            {(hasActiveFilters || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 bg-[#0B101E] hover:bg-slate-800 transition-colors shrink-0"
                title="Reset filters"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Secondary Dropdowns (inside Filters toggle) */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-[#0B101E] border border-slate-800 rounded-lg text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter size={12} className="text-purple-400" />
                      FILTERS
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Refine academic pairings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Department
                      </label>
                      <select
                        value={draftDept}
                        onChange={(e) => setDraftDept(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#070B14] border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="all">All Departments</option>
                        {FACULTY_DEPARTMENTS.filter((d) => d.id !== 'all').map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Semester
                      </label>
                      <select
                        value={draftSemester}
                        onChange={(e) => setDraftSemester(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#070B14] border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="all">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Academic Year
                      </label>
                      <select
                        value={draftAcademicYear}
                        onChange={(e) => setDraftAcademicYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#070B14] border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="all">All Years</option>
                        <option value="2024-25">2024-25</option>
                        <option value="2023-24">2023-24</option>
                        <option value="2022-23">2022-23</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-3 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white rounded border border-slate-800 hover:border-slate-700 bg-[#070B14] transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="px-3.5 py-1.5 text-[11px] font-mono font-semibold text-white rounded bg-purple-600 hover:bg-purple-500 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Faculty Grid (20 faculties per page) */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-purple-400" />
            <span className="text-xs font-mono">Loading faculty insights...</span>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="py-12 text-center border border-slate-800 rounded-lg bg-[#0B101E]/60 text-xs font-mono text-slate-400">
            No matching faculty or course pairings found.
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedInsights.map((item) => {
                const hasResponses = item.totalResponses > 0;
                const hasMet = item.hasMetThreshold;
                const teaching = item.studentExperience?.teachingRating;
                const rec = item.studentExperience?.recommendationRating;

                return (
                  <div
                    key={item.id}
                    className="bg-[#0B101E] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md hover:shadow-black/50 group"
                  >
                    <div>
                      {/* Top Row: Initials & Department */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {item.initials}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          {item.department}
                        </span>
                      </div>

                      {/* Faculty Name & Designation */}
                      <div className="mt-2.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.designation}
                        </p>
                      </div>

                      {/* Student Feedback Across Subjects */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                          <span>FEEDBACK BY SUBJECT</span>
                          {item.reviewedSubjects && item.reviewedSubjects.length > 0 && (
                            <span className="text-purple-400 font-semibold">
                              {item.reviewedSubjects.length} {item.reviewedSubjects.length === 1 ? 'subject' : 'subjects'}
                            </span>
                          )}
                        </div>

                        {item.reviewedSubjects && item.reviewedSubjects.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.reviewedSubjects.slice(0, 3).map((sub) => (
                              <button
                                key={sub.code}
                                type="button"
                                onClick={() => handleOpenDetail(item, sub.code)}
                                className="w-full flex items-center justify-between px-2 py-1 bg-[#070B14] hover:bg-slate-900 border border-slate-800/80 hover:border-purple-800/60 rounded text-xs font-mono text-left transition-colors group/sub"
                                title={`View insights for ${sub.code} - ${sub.name}`}
                              >
                                <span className="text-slate-300 group-hover/sub:text-purple-300 truncate pr-2 font-medium">
                                  {sub.code}{' '}
                                  <span className="text-slate-500 text-[11px] font-normal truncate hidden sm:inline">
                                    · {sub.name}
                                  </span>
                                </span>
                                <span className="text-purple-300 shrink-0 text-[10px] font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900/40">
                                  {sub.totalResponses} {sub.totalResponses === 1 ? 'student' : 'students'}
                                </span>
                              </button>
                            ))}
                            {item.reviewedSubjects.length > 3 && (
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(item)}
                                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 block w-full text-right"
                              >
                                +{item.reviewedSubjects.length - 3} more subjects
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 bg-[#070B14]/60 border border-dashed border-slate-800/90 rounded flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                            <span>No student feedback yet · Be the first to review</span>
                          </div>
                        )}
                      </div>

                      {/* 2-Column Ratings Block */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">
                            Teaching
                          </span>
                          <span className="font-semibold text-slate-100 flex items-center gap-1">
                            {teaching !== null && teaching !== undefined && !isNaN(teaching) ? (
                              <>
                                <Star size={11} className="fill-purple-400 text-purple-400" />
                                <span>{Number(teaching).toFixed(1)} / 5</span>
                              </>
                            ) : (
                              <span className="text-slate-500">— / 5</span>
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">
                            Recommendation
                          </span>
                          <span className="font-semibold text-slate-100 flex items-center gap-1">
                            {rec !== null && rec !== undefined && !isNaN(rec) ? (
                              <>
                                <Star size={11} className="fill-purple-400 text-purple-400" />
                                <span>{Number(rec).toFixed(1)} / 5</span>
                              </>
                            ) : (
                              <span className="text-slate-500">— / 5</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Response count */}
                      <div className="mt-3 text-[11px] font-mono text-slate-400">
                        {item.totalResponses} {item.totalResponses === 1 ? 'total student response' : 'total student responses'}
                      </div>
                    </div>

                    {/* Action CTA */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#0E1528] hover:bg-purple-950/60 border border-slate-800 hover:border-purple-800/70 text-xs font-mono text-slate-200 hover:text-purple-200 transition-all flex items-center justify-between group/btn"
                      >
                        <span>View Insights</span>
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover/btn:translate-x-0.5 text-purple-400"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenFeedback(item)}
                        className="py-1.5 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 hover:border-purple-500 text-xs font-mono text-purple-300 hover:text-white transition-all flex items-center gap-1 shrink-0"
                        title="Give feedback for this faculty"
                      >
                        <PlusCircle size={12} />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (20 per page) */}
            {totalPages > 1 && (
              <div className="pt-4 pb-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">
                  Showing <span className="text-slate-200 font-semibold">{startRecord}–{endRecord}</span> of{' '}
                  <span className="text-purple-300 font-semibold">{filteredInsights.length}</span> faculty
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0B101E] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={13} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="px-1.5 text-slate-600 select-none">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handlePageChange(p)}
                              className={`w-7 h-7 rounded-md font-mono text-xs transition-colors flex items-center justify-center ${
                                currentPage === p
                                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                                  : 'bg-[#0B101E] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0B101E] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <FacultyInsightDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailFaculty(null);
        }}
        faculty={detailFaculty}
        onOpenFeedback={(fac) => {
          setIsDetailModalOpen(false);
          handleOpenFeedback(fac);
        }}
      />

      {/* Feedback Form Modal */}
      <FacultyFeedbackFormModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackFaculty(null);
        }}
        faculty={feedbackFaculty}
        onSuccess={handleFeedbackSuccess}
      />
    </div>
  );
}
