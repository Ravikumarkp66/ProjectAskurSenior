import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Edit2, PlusCircle, AlertCircle, Lock, BookOpen, Loader2 } from 'lucide-react';
import { facultyInsightAPI } from '../../services/api/facultyInsightApi';

const renderStars = (rating) => {
  if (rating === null || rating === undefined) {
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">— / 5</span>;
  }
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rounded ? 'fill-purple-500 text-purple-500 dark:fill-purple-400 dark:text-purple-400' : 'text-slate-300 dark:text-slate-700'}
        />
      ))}
      <span className="text-xs font-mono font-semibold ml-1 text-slate-800 dark:text-slate-200">
        {rating.toFixed(1)} / 5
      </span>
    </div>
  );
};

export default function FacultyInsightDetailModal({
  isOpen,
  onClose,
  faculty,
  onOpenFeedback,
  hasPlusAccess = true,
  lockedTooltip = '',
  onLockedAction = () => {},
}) {
  const [insightData, setInsightData] = useState(faculty);
  const [activeSubject, setActiveSubject] = useState('ALL');
  const [loadingSubject, setLoadingSubject] = useState(false);

  // Sync state whenever open or incoming faculty prop changes
  useEffect(() => {
    if (faculty) {
      setInsightData(faculty);
      const initialSubject =
        faculty.selectedSubjectCode && faculty.selectedSubjectCode !== 'ALL'
          ? faculty.selectedSubjectCode
          : 'ALL';
      setActiveSubject(initialSubject);
    }
  }, [faculty, isOpen]);

  if (!isOpen || !insightData) return null;

  const currentFaculty = insightData;
  const maxCie =
    currentFaculty.configuredMaxCie ||
    currentFaculty.academicOutcomes?.configuredMaxCie ||
    50;
  const hasMetThreshold = currentFaculty.hasMetThreshold;
  const hasResponses = currentFaculty.totalResponses > 0;
  const userFeedback = currentFaculty.userFeedback;
  const hasSubmitted = Boolean(userFeedback);
  const reviewedSubjects = currentFaculty.reviewedSubjects || [];

  const handleSubjectChange = async (subjectCode) => {
    if (subjectCode === activeSubject || loadingSubject) return;
    setActiveSubject(subjectCode);

    const isDemo = String(currentFaculty.id || currentFaculty.facultyId || '').startsWith('demo-');
    if (isDemo || !hasPlusAccess) {
      if (subjectCode === 'ALL') {
        setInsightData({
          ...faculty,
          selectedSubjectCode: 'ALL',
        });
      } else {
        const foundSub = (faculty.reviewedSubjects || []).find((s) => s.code === subjectCode);
        if (foundSub) {
          setInsightData({
            ...faculty,
            selectedSubjectCode: subjectCode,
            totalResponses: foundSub.totalResponses || faculty.totalResponses,
            studentExperience: {
              teachingRating: foundSub.avgTeaching || faculty.studentExperience?.teachingRating,
              recommendationRating: foundSub.avgRecommendation || faculty.studentExperience?.recommendationRating,
            },
            academicOutcomes: {
              avgCie: foundSub.avgCie || faculty.academicOutcomes?.avgCie,
              medianCie: foundSub.medianCie || faculty.academicOutcomes?.medianCie,
              neReported: foundSub.neReported !== undefined ? foundSub.neReported : faculty.academicOutcomes?.neReported,
            },
            comments: (faculty.comments || []).filter(
              (c) => !c.subjectCode || c.subjectCode === subjectCode
            ),
          });
        }
      }
      return;
    }

    setLoadingSubject(true);

    try {
      const res = await facultyInsightAPI.getSingle(
        currentFaculty.facultyId || currentFaculty.id,
        subjectCode === 'ALL' ? null : subjectCode
      );
      if (res?.success && res.data) {
        setInsightData({
          ...res.data,
          reviewedSubjects: currentFaculty.reviewedSubjects || res.data.reviewedSubjects,
          availableDepartmentSubjects:
            currentFaculty.availableDepartmentSubjects || res.data.availableDepartmentSubjects,
        });
      }
    } catch (err) {
      console.error('Failed to load subject insight:', err);
    } finally {
      setLoadingSubject(false);
    }
  };

  const handleOpenFeedbackModal = () => {
    if (!hasPlusAccess) {
      onLockedAction();
      return;
    }
    onOpenFeedback({
      ...currentFaculty,
      selectedSubjectCode: activeSubject !== 'ALL' ? activeSubject : '',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white dark:bg-[#0F1115] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faculty-detail-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15181D]">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-purple-700 dark:text-purple-400 uppercase">
                FACULTY INSIGHTS
              </span>
              <h2
                id="faculty-detail-title"
                className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug"
              >
                {currentFaculty.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentFaculty.designation} · {currentFaculty.department}
              </p>
              <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {currentFaculty.totalResponses}{' '}
                  {currentFaculty.totalResponses === 1 ? 'response' : 'responses'}
                </span>
                {activeSubject !== 'ALL' && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-purple-600 dark:text-purple-300 font-medium">
                      Subject: {activeSubject}
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-white dark:bg-[#0F1115]">
            {/* Student Feedback Across Different Subjects Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  STUDENTS' FEEDBACK BY SUBJECT ({reviewedSubjects.length})
                </h3>
                {loadingSubject && (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                    <Loader2 size={12} className="animate-spin" /> Loading...
                  </span>
                )}
              </div>

              {reviewedSubjects.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-[#15181D]">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#090E1B] text-slate-600 dark:text-slate-400">
                        <th className="py-2.5 px-3 text-left font-medium">Subject</th>
                        <th className="py-2.5 px-3 text-center font-medium">Feedbacks</th>
                        <th className="py-2.5 px-3 text-center font-medium">Teaching</th>
                        <th className="py-2.5 px-3 text-right font-medium">Filter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      <tr
                        className={`transition-colors ${
                          activeSubject === 'ALL' ? 'bg-purple-50 dark:bg-purple-950/20' : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                          <span className="font-semibold text-purple-700 dark:text-purple-300">All Subjects</span>
                          <span className="text-slate-500 block text-[11px]">
                            Aggregated across all courses
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-900 dark:text-slate-100 font-semibold">
                          {currentFaculty.totalResponses}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                          {currentFaculty.studentExperience?.teachingRating
                            ? `★ ${currentFaculty.studentExperience.teachingRating}`
                            : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSubjectChange('ALL')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                              activeSubject === 'ALL'
                                ? 'bg-purple-600 text-white font-semibold'
                                : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-slate-300 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
                            }`}
                          >
                            {activeSubject === 'ALL' ? 'Active' : 'Select'}
                          </button>
                        </td>
                      </tr>

                      {reviewedSubjects.map((sub) => (
                        <tr
                          key={sub.code}
                          className={`transition-colors ${
                            activeSubject === sub.code ? 'bg-purple-50 dark:bg-purple-950/20' : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                            <span className="font-semibold text-purple-700 dark:text-purple-300">{sub.code}</span>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px] truncate max-w-[200px]" title={sub.name}>
                              {sub.name}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-slate-900 dark:text-slate-100 font-semibold">
                            {sub.totalResponses} {sub.totalResponses === 1 ? 'student' : 'students'}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                            {sub.avgTeaching ? `★ ${sub.avgTeaching}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSubjectChange(sub.code)}
                              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                                activeSubject === sub.code
                                  ? 'bg-purple-600 text-white font-semibold'
                                  : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-slate-300 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
                              }`}
                            >
                              {activeSubject === sub.code ? 'Active' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-[#15181D] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <BookOpen size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    No subject feedback recorded yet. Be the first student to review this faculty member!
                  </span>
                </div>
              )}
            </div>

            {/* Low Response / Insufficient data notice if below threshold */}
            {hasResponses && !hasMetThreshold && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-lg flex items-start gap-2 text-xs font-mono text-purple-800 dark:text-purple-300">
                <AlertCircle size={15} className="shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">
                    Student Insights: Not enough responses yet.
                  </span>
                  <span>
                    {currentFaculty.totalResponses} responses collected so far.
                    Statistics unlock at {currentFaculty.minThreshold || 5} responses.
                  </span>
                </div>
              </div>
            )}

            {/* Academic Outcomes Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  ACADEMIC OUTCOMES
                </h3>
                {activeSubject !== 'ALL' && (
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-300">
                    Subject: {activeSubject}
                  </span>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-[#15181D]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#090E1B] text-slate-600 dark:text-slate-400 font-mono">
                      <th className="py-2.5 px-4 text-left font-medium">Metric</th>
                      <th className="py-2.5 px-4 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">Average CIE</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {hasMetThreshold &&
                        currentFaculty.academicOutcomes?.avgCie !== null &&
                        currentFaculty.academicOutcomes?.avgCie !== undefined
                          ? `${currentFaculty.academicOutcomes.avgCie} / ${maxCie}`
                          : `— / ${maxCie}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">Median CIE</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {hasMetThreshold &&
                        currentFaculty.academicOutcomes?.medianCie !== null &&
                        currentFaculty.academicOutcomes?.medianCie !== undefined
                          ? `${currentFaculty.academicOutcomes.medianCie} / ${maxCie}`
                          : `— / ${maxCie}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">NE reported</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {hasMetThreshold &&
                        currentFaculty.academicOutcomes?.neReported !== undefined &&
                        currentFaculty.academicOutcomes?.neReported !== null
                          ? `${currentFaculty.academicOutcomes.neReported}%`
                          : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Experience Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                STUDENT EXPERIENCE
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-[#15181D]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#090E1B] text-slate-600 dark:text-slate-400 font-mono">
                      <th className="py-2.5 px-4 text-left font-medium">Metric</th>
                      <th className="py-2.5 px-4 text-right font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">Teaching style</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex justify-end">
                          {renderStars(currentFaculty.studentExperience?.teachingRating)}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">Recommendation</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex justify-end">
                          {renderStars(currentFaculty.studentExperience?.recommendationRating)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Anonymous Student Comments (when present) */}
            {hasMetThreshold &&
              currentFaculty.comments &&
              currentFaculty.comments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      STUDENT COMMENTS
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Anonymous
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentFaculty.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 dark:bg-[#15181D] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 space-y-1.5"
                      >
                        <p className="italic">&ldquo;{c.comment}&rdquo;</p>
                        {(c.subjectCode || c.subjectName) && (
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/50">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              Subject: {c.subjectCode} {c.subjectName ? `· ${c.subjectName}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Submission status banner if user already submitted */}
            {hasSubmitted && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-lg flex items-center justify-between text-xs">
                <span className="text-purple-900 dark:text-purple-200 font-medium">
                  You&apos;ve submitted feedback for this faculty.
                </span>
                <button
                  type="button"
                  onClick={handleOpenFeedbackModal}
                  className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-white font-mono font-semibold underline underline-offset-2"
                >
                  <Edit2 size={12} />
                  <span>Edit Feedback</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA - Anyone can give feedback */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15181D]">
            <span className="text-xs text-slate-500 font-mono">
              AskUrSenior · F-011 Academic Utility
            </span>

            <button
              type="button"
              onClick={handleOpenFeedbackModal}
              title={!hasPlusAccess ? lockedTooltip : (hasSubmitted ? 'Edit Feedback' : 'Give Feedback')}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {!hasPlusAccess ? (
                <Lock size={13} className="text-purple-200 shrink-0" />
              ) : hasSubmitted ? (
                <Edit2 size={13} />
              ) : (
                <PlusCircle size={13} />
              )}
              <span>{hasSubmitted ? 'Edit Feedback' : 'Give Feedback'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
