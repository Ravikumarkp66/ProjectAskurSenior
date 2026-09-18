import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyInsightAPI } from '../../services/api/facultyInsightApi';

const TEACHING_LABELS = {
  1: 'Very poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

const RECOMMENDATION_LABELS = {
  1: 'Very unlikely',
  2: 'Unlikely',
  3: 'Neutral',
  4: 'Likely',
  5: 'Very likely',
};

export default function FacultyFeedbackFormModal({
  isOpen,
  onClose,
  faculty,
  onSuccess,
}) {
  const isEditing = Boolean(faculty?.userFeedback?.id);
  
  // Subject selection states
  const [subjectsList, setSubjectsList] = useState(faculty?.availableDepartmentSubjects || []);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(4);
  const [maxCie, setMaxCie] = useState(faculty?.configuredMaxCie || 50);
  const [academicYear, setAcademicYear] = useState('2024-25');

  // Form states
  const [cieScore, setCieScore] = useState('');
  const [cieNotReceived, setCieNotReceived] = useState(false);
  const [receivedNE, setReceivedNE] = useState(null); // true | false | null
  const [teachingRating, setTeachingRating] = useState(0);
  const [recommendationRating, setRecommendationRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch department curriculum subjects if not provided
  useEffect(() => {
    if (!isOpen || !faculty) return;

    if (faculty.availableDepartmentSubjects && faculty.availableDepartmentSubjects.length > 0) {
      setSubjectsList(faculty.availableDepartmentSubjects);
    } else {
      setLoadingSubjects(true);
      facultyInsightAPI
        .getDepartmentSubjects({
          facultyId: faculty.facultyId,
          department: faculty.department,
          departmentId: faculty.departmentId,
        })
        .then((res) => {
          if (res?.success && Array.isArray(res.data)) {
            setSubjectsList(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSubjects(false));
    }
  }, [isOpen, faculty]);

  // Pre-fill subject and existing submission if editing or pre-selected
  useEffect(() => {
    if (!isOpen || !faculty) return;

    const initialCode =
      faculty?.userFeedback?.subjectCode ||
      (faculty?.selectedSubjectCode && faculty.selectedSubjectCode !== 'ALL'
        ? faculty.selectedSubjectCode
        : faculty?.subjectCode || '');

    if (initialCode) {
      setSelectedSubjectCode(initialCode);
      const matched = subjectsList.find((s) => s.code === initialCode);
      if (matched) {
        setSelectedSubjectName(matched.name);
        setSelectedSubjectId(matched.id || null);
        setSelectedSemester(matched.semester || 4);
        setMaxCie(matched.maxCie || 50);
        setIsCustomSubject(false);
      } else if (faculty.subjectName) {
        setSelectedSubjectName(faculty.subjectName);
        setSelectedSubjectId(faculty.subjectId || null);
        setSelectedSemester(faculty.semester || 4);
        setIsCustomSubject(false);
      }
    } else if (subjectsList.length > 0 && !selectedSubjectCode) {
      const first = subjectsList[0];
      setSelectedSubjectCode(first.code);
      setSelectedSubjectName(first.name);
      setSelectedSubjectId(first.id || null);
      setSelectedSemester(first.semester || 4);
      setMaxCie(first.maxCie || 50);
      setIsCustomSubject(false);
    }

    if (faculty?.userFeedback) {
      const fb = faculty.userFeedback;
      if (fb.cieAvailable === false) {
        setCieNotReceived(true);
        setCieScore('');
      } else {
        setCieNotReceived(false);
        setCieScore(fb.cieScore !== null ? String(fb.cieScore) : '');
      }
      setReceivedNE(fb.receivedNE === true);
      setTeachingRating(fb.teachingRating || 0);
      setRecommendationRating(fb.recommendationRating || 0);
      setComment(fb.comment || '');
      if (fb.academicYear) setAcademicYear(fb.academicYear);
      if (fb.semester) setSelectedSemester(fb.semester);
    } else {
      setCieScore('');
      setCieNotReceived(false);
      setReceivedNE(null);
      setTeachingRating(0);
      setRecommendationRating(0);
      setComment('');
    }
    setErrorMessage('');
  }, [faculty, isOpen, subjectsList]);

  const handleSubjectChange = (val) => {
    if (val === '__CUSTOM__') {
      setIsCustomSubject(true);
      setSelectedSubjectCode('__CUSTOM__');
      setSelectedSubjectName('');
      setSelectedSubjectId(null);
      return;
    }
    setIsCustomSubject(false);
    setSelectedSubjectCode(val);
    const sub = subjectsList.find((s) => s.code === val);
    if (sub) {
      setSelectedSubjectName(sub.name);
      setSelectedSubjectId(sub.id || null);
      setSelectedSemester(sub.semester || 4);
      setMaxCie(sub.maxCie || 50);
    }
  };

  if (!isOpen || !faculty) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const finalCode = isCustomSubject
      ? customSubjectCode.toUpperCase().trim()
      : selectedSubjectCode;
    const finalName = isCustomSubject
      ? (customSubjectName.trim() || customSubjectCode.toUpperCase().trim())
      : (selectedSubjectName || selectedSubjectCode);

    if (!finalCode || finalCode === '__CUSTOM__') {
      setErrorMessage('Please select or specify the subject this faculty taught you.');
      return;
    }

    // Question 01 validation
    let finalCie = null;
    if (!cieNotReceived) {
      if (cieScore.trim() === '') {
        setErrorMessage('Please enter your CIE score or mark as not received yet.');
        return;
      }
      const num = Number(cieScore);
      if (isNaN(num) || num < 0 || num > maxCie) {
        setErrorMessage(`CIE score must be between 0 and ${maxCie}.`);
        return;
      }
      finalCie = num;
    }

    // Question 02 validation
    if (receivedNE === null) {
      setErrorMessage('Please answer Question 02: Did you receive NE in this subject?');
      return;
    }

    // Question 03 validation
    if (!teachingRating || teachingRating < 1 || teachingRating > 5) {
      setErrorMessage("Please rate the faculty's teaching (1–5).");
      return;
    }

    // Question 04 validation
    if (!recommendationRating || recommendationRating < 1 || recommendationRating > 5) {
      setErrorMessage('Please provide a recommendation rating (1–5).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        facultyId: faculty.facultyId,
        subjectCode: finalCode,
        subjectName: finalName,
        subjectId: isCustomSubject ? null : selectedSubjectId,
        academicYear: academicYear || '2024-25',
        semester: selectedSemester || 4,
        cieScore: finalCie,
        cieAvailable: !cieNotReceived,
        receivedNE,
        teachingRating,
        recommendationRating,
        comment: comment.trim(),
      };

      if (isEditing && faculty.userFeedback?.id) {
        await facultyInsightAPI.updateFeedback(faculty.userFeedback.id, payload);
      } else {
        await facultyInsightAPI.submitFeedback(payload);
      }

      toast.success('Feedback submitted successfully.', {
        style: {
          background: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '12px',
        },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[#0B0F19] text-slate-100 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-form-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                  {isEditing ? 'EDIT FEEDBACK' : 'GIVE FEEDBACK'}
                </span>
                <span className="text-xs text-slate-500 font-mono">~30 sec</span>
              </div>
              <h2
                id="feedback-form-title"
                className="text-base font-semibold text-white mt-1 leading-snug"
              >
                {faculty.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {faculty.designation} · <span className="text-purple-300">{faculty.department}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-center gap-2.5 text-xs text-red-200">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Subject Selection */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800/80">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono flex items-center justify-between">
                <span>SELECT SUBJECT</span>
                <span className="text-[10px] text-purple-400 font-normal">REQUIRED</span>
              </label>
              <p className="text-xs text-slate-400">
                Choose or specify the subject this faculty member taught you:
              </p>
              {loadingSubjects ? (
                <div className="py-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-purple-400" />
                  <span>Loading subjects...</span>
                </div>
              ) : !isCustomSubject ? (
                <div className="space-y-2">
                  <select
                    value={selectedSubjectCode}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#070B14] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  >
                    <option value="" disabled>-- Choose a Subject --</option>
                    {subjectsList.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name} {s.semester ? `(Sem ${s.semester})` : ''}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Other / Type Custom Course Code...</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-[#070B14] border border-purple-900/50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">
                        Course Code (e.g. 21CS42)
                      </span>
                      <input
                        type="text"
                        value={customSubjectCode}
                        onChange={(e) => setCustomSubjectCode(e.target.value)}
                        placeholder="e.g. 21CS42"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">
                        Course Name (Optional)
                      </span>
                      <input
                        type="text"
                        value={customSubjectName}
                        onChange={(e) => setCustomSubjectName(e.target.value)}
                        placeholder="e.g. Database Management Systems"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSubject(false);
                      setSelectedSubjectCode(subjectsList[0]?.code || '');
                    }}
                    className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline"
                  >
                    ← Choose from curriculum subjects list
                  </button>
                </div>
              )}
            </div>

            {/* Question 01 */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
                  Question 01
                </label>
                <span className="text-[11px] text-slate-400">CIE Score</span>
              </div>
              <p className="text-xs text-slate-300">
                What was your CIE score in this subject?
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={maxCie}
                    disabled={cieNotReceived}
                    value={cieScore}
                    onChange={(e) => setCieScore(e.target.value)}
                    placeholder="—"
                    className={`w-24 px-3 py-1.5 text-sm font-mono bg-slate-900 border rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors ${
                      cieNotReceived
                        ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed'
                        : 'border-slate-700'
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-400">/ {maxCie}</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={cieNotReceived}
                    onChange={(e) => {
                      setCieNotReceived(e.target.checked);
                      if (e.target.checked) setCieScore('');
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <span>I haven't received my CIE marks yet</span>
                </label>
              </div>
            </div>

            <div className="h-px bg-slate-800/60" />

            {/* Question 02 */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
                  Question 02
                </label>
                <span className="text-[11px] text-slate-400">Eligibility</span>
              </div>
              <p className="text-xs text-slate-300">
                Did you receive NE in this subject?
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setReceivedNE(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                    receivedNE === true
                      ? 'bg-red-950/60 text-red-200 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setReceivedNE(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                    receivedNE === false
                      ? 'bg-emerald-950/60 text-emerald-200 border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-800/60" />

            {/* Question 03 */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
                  Question 03
                </label>
                <span className="text-[11px] text-purple-400 font-mono">
                  {teachingRating > 0 ? `${teachingRating} / 5 · ${TEACHING_LABELS[teachingRating]}` : '1–5 scale'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                How would you rate the faculty's teaching?
              </p>

              <div className="flex items-center gap-2 pt-1" role="radiogroup" aria-label="Teaching rating">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isFilled = val <= teachingRating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTeachingRating(val)}
                      aria-label={`Teaching rating: ${val} out of 5 (${TEACHING_LABELS[val]})`}
                      aria-checked={teachingRating === val}
                      role="radio"
                      className="p-1 rounded hover:scale-110 active:scale-95 transition-all text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <Star
                        size={22}
                        className={isFilled ? 'fill-purple-400 text-purple-400' : 'text-slate-600'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-800/60" />

            {/* Question 04 */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
                  Question 04
                </label>
                <span className="text-[11px] text-purple-400 font-mono">
                  {recommendationRating > 0
                    ? `${recommendationRating} / 5 · ${RECOMMENDATION_LABELS[recommendationRating]}`
                    : 'Recommendation'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                How likely are you to recommend this faculty to your friends?
              </p>

              <div className="flex items-center gap-2 pt-1" role="radiogroup" aria-label="Recommendation rating">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isFilled = val <= recommendationRating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRecommendationRating(val)}
                      aria-label={`Recommendation: ${val} out of 5 (${RECOMMENDATION_LABELS[val]})`}
                      aria-checked={recommendationRating === val}
                      role="radio"
                      className="p-1 rounded hover:scale-110 active:scale-95 transition-all text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <Star
                        size={22}
                        className={isFilled ? 'fill-purple-400 text-purple-400' : 'text-slate-600'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-800/60" />

            {/* Optional Question 05 */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
                  Anything useful to share?
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Optional</span>
              </div>
              <textarea
                rows={2}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a short comment..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-colors"
              />
              <p className="text-[10px] text-slate-500 font-mono text-right">
                {comment.length} / 1000 · Anonymously published
              </p>
            </div>
          </form>

          {/* Footer CTA */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Feedback' : 'Submit Feedback'}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
