import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, FlaskConical, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import { useTheme } from '../../../../../context/ThemeContext';

export default function AttendanceSectionSetupModal({
    isOpen,
    onClose,
    onSuccess,
    semester = 1
}) {
    const { user, updateUser } = useAuth();
    const { isDark } = useTheme();

    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedLabBatch, setSelectedLabBatch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Fetch available sections when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const loadSections = async () => {
            setLoadingSections(true);
            setFetchError(null);
            try {
                const res = await apiV2.getStudentAcademicsSections(semester);
                if (isMounted) {
                    if (res.data?.success && Array.isArray(res.data.data?.sections)) {
                        const list = res.data.data.sections;
                        setSections(list);
                        if (list.length > 0) {
                            // If student already has a section assigned, preselect it, else select first
                            const current = list.find(s => s.isCurrent || s.id === user?.academicSection);
                            const target = current || list[0];
                            setSelectedSectionId(target.id);
                            if (target.hasLabBatches && target.labBatches?.length > 0) {
                                setSelectedLabBatch(user?.labBatch || target.labBatches[0] || 'B1');
                            } else {
                                setSelectedLabBatch('');
                            }
                        }
                    } else {
                        setSections([]);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[AttendanceSectionSetupModal] Error loading sections:', err);
                    setFetchError('Unable to load class sections. Please check your network connection.');
                }
            } finally {
                if (isMounted) setLoadingSections(false);
            }
        };

        loadSections();
        return () => { isMounted = false; };
    }, [isOpen, semester, user]);

    // Currently selected section object
    const selectedSection = sections.find(s => String(s.id) === String(selectedSectionId)) || null;
    const hasLabBatches = Boolean(selectedSection?.hasLabBatches);
    const availableLabBatches = selectedSection?.labBatches?.length > 0 ? selectedSection.labBatches : ['B1', 'B2'];

    const handleSelectSection = (secId) => {
        setSelectedSectionId(secId);
        const sec = sections.find(s => String(s.id) === String(secId));
        if (sec?.hasLabBatches) {
            setSelectedLabBatch(user?.labBatch || sec.labBatches?.[0] || 'B1');
        } else {
            setSelectedLabBatch('');
        }
    };

    const handleConfirm = async () => {
        if (!selectedSectionId) {
            toast.error('Please select your class section.');
            return;
        }

        if (hasLabBatches && !selectedLabBatch) {
            toast.error('Please select your lab batch (e.g. B1 or B2).');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                sectionId: selectedSectionId,
                labBatch: hasLabBatches ? selectedLabBatch : null
            };

            const res = await apiV2.confirmStudentPlacement(payload);
            if (res.data?.success) {
                toast.success(res.data.message || `Section ${selectedSection?.name} timetable loaded!`);
                if (res.data.data?.student) {
                    updateUser(res.data.data.student);
                }
                if (onSuccess) {
                    onSuccess(res.data.data);
                }
                onClose();
            } else {
                toast.error(res.data?.error || res.data?.message || 'Failed to confirm section.');
            }
        } catch (err) {
            console.error('[AttendanceSectionSetupModal] Confirmation error:', err);
            toast.error(err.response?.data?.error || err.message || 'Failed to save section setup.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden font-sans ${
                    isDark ? 'bg-[#0D111C] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-violet-600/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/30">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                                Configure Attendance Timetable
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                                Select your class section to load your official schedule and track daily attendance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {loadingSections ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-violet-500" />
                            <span className="text-xs font-mono">Loading class sections for Semester {semester}...</span>
                        </div>
                    ) : fetchError ? (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{fetchError}</span>
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="p-5 text-center text-slate-400 space-y-2">
                            <Users size={28} className="mx-auto text-slate-500 opacity-60" />
                            <p className="text-xs">
                                No sections are currently published for Semester {semester}. Please contact your administrator.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Section Picker */}
                            <div className="space-y-2">
                                <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                                    1. Choose Your Class Section
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {sections.map(sec => {
                                        const isSelected = String(sec.id) === String(selectedSectionId);
                                        return (
                                            <button
                                                key={sec.id}
                                                type="button"
                                                onClick={() => handleSelectSection(sec.id)}
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-violet-600/15 border-violet-500 text-violet-300 ring-2 ring-violet-500/30 font-bold'
                                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-mono">{sec.name}</span>
                                                    {isSelected && <CheckCircle2 size={16} className="text-violet-400" />}
                                                </div>
                                                <span className="text-[11px] opacity-60 font-sans block mt-0.5">
                                                    {sec.hasLabBatches ? 'Lab batches present' : 'Common timetable'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lab Batch Selection (Conditional) */}
                            {hasLabBatches ? (
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-150">
                                    <div className="flex items-center gap-1.5">
                                        <FlaskConical size={14} className="text-violet-400" />
                                        <label className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                                            2. Select Your Lab Batch
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                                        Section {selectedSection?.name} splits laboratory slots by student batch. Pick your assigned batch:
                                    </p>
                                    <div className="flex gap-3 pt-1">
                                        {availableLabBatches.map(batch => {
                                            const isSelected = selectedLabBatch === batch;
                                            return (
                                                <button
                                                    key={batch}
                                                    type="button"
                                                    onClick={() => setSelectedLabBatch(batch)}
                                                    className={`flex-1 py-2.5 px-4 rounded-xl border text-center font-mono font-bold text-sm transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-violet-600 text-white border-violet-500 shadow-md ring-2 ring-violet-400/30'
                                                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                                    }`}
                                                >
                                                    Batch {batch}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : selectedSection ? (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                    <span>Section {selectedSection.name} has a unified timetable for all students. No lab batch selection required.</span>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting || loadingSections || !selectedSectionId || (hasLabBatches && !selectedLabBatch)}
                        className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Configuring...</span>
                            </>
                        ) : (
                            <>
                                <span>Confirm & Load Timetable</span>
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
