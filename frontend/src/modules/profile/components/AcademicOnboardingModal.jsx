import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';

const AcademicOnboardingModal = ({ isOpen, onClose, student, onCompleted }) => {
    const { isDark } = useTheme();
    // Steps: 1 = Section & Lab Batch, 2 = Complete
    const [step, setStep] = useState(1);

    // Section & Lab Batch Step States
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(student?.academicSection?.id || student?.academicSection || '');
    const [selectedLabBatch, setSelectedLabBatch] = useState(student?.labBatch || 'B1');
    const [loadingSections, setLoadingSections] = useState(false);
    const [confirmingPlacement, setConfirmingPlacement] = useState(false);

    // General feedback
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setError('');
        setSuccessMessage('');
        setStep(1);

        // Fetch sections for student's branch & batch
        setLoadingSections(true);
        apiClient.get('/student/academics/sections')
            .then(res => {
                if (res.data?.success) {
                    const secs = res.data.data?.sections || [];
                    setSections(secs);
                    if (secs.length > 0 && !selectedSectionId) {
                        const current = secs.find(s => s.isCurrent) || secs[0];
                        setSelectedSectionId(current.id);
                    }
                }
            })
            .catch(err => {
                console.error('Failed to load sections:', err);
                setError('Failed to load available sections for your branch.');
            })
            .finally(() => {
                setLoadingSections(false);
            });
    }, [isOpen, student, selectedSectionId]);

    // Handle Section & Lab Batch Placement Confirmation
    const handleConfirmPlacement = async () => {
        if (!selectedSectionId) {
            setError('Please select your assigned Class Section');
            return;
        }
        if (!selectedLabBatch) {
            setError('Please select your assigned Lab Batch');
            return;
        }

        setConfirmingPlacement(true);
        setError('');

        try {
            const res = await apiClient.post('/student/academics/onboarding/confirm-placement', {
                sectionId: selectedSectionId,
                labBatch: selectedLabBatch
            });

            if (res.data?.success) {
                setStep(2);
                if (onCompleted) onCompleted(res.data.data);
            } else {
                setError(res.data?.error || 'Failed to confirm section placement.');
            }
        } catch (err) {
            console.error('Error confirming placement:', err);
            setError(err.response?.data?.error || err.message || 'Failed to submit placement confirmation.');
        } finally {
            setConfirmingPlacement(false);
        }
    };

    if (!isOpen) return null;

    const modalBg = isDark ? 'bg-[#13141a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl';
    const headerBorder = isDark ? 'border-white/10' : 'border-slate-200';
    const subtextColor = isDark ? 'text-gray-400' : 'text-slate-500';
    const titleColor = isDark ? 'text-white' : 'text-slate-900';
    const labelColor = isDark ? 'text-gray-300' : 'text-slate-700';
    const noticeBg = isDark ? 'bg-white/[0.02] border-white/5 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600';

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/75 backdrop-blur-sm' : 'bg-slate-900/40 backdrop-blur-sm'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`relative w-full max-w-xl border rounded-2xl shadow-2xl p-6 overflow-hidden font-sans ${modalBg}`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between pb-4 border-b ${headerBorder}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className={`text-base font-bold ${titleColor}`}>Complete Academic Profile</h2>
                                <p className={`text-xs ${subtextColor}`}>
                                    {step === 1 ? 'Step 1 of 2: Class Section & Lab Batch' : 'Step 2 of 2: Confirmation Complete'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="flex items-center gap-2 my-4">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-purple-600' : (isDark ? 'bg-white/10' : 'bg-slate-200')}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : (isDark ? 'bg-white/10' : 'bg-slate-200')}`} />
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs">
                            <CheckCircle2 size={16} />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* STEP 1: SECTION & LAB BATCH ALLOCATION */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                Select your assigned <strong>Class Section</strong> and <strong>Lab Batch</strong>. This automatically configures your personalized weekly timetable, lab blocks, and attendance tracking.
                            </p>

                            {/* Section Selection */}
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                                    Official Class Section
                                </label>
                                {loadingSections ? (
                                    <div className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                                ) : sections.length === 0 ? (
                                    <div className={`p-3 rounded-xl border text-xs ${noticeBg}`}>
                                        No sections available for your branch in this semester yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-6 gap-2">
                                        {sections.map(sec => (
                                            <button
                                                key={sec.id}
                                                type="button"
                                                onClick={() => setSelectedSectionId(sec.id)}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                                    selectedSectionId === sec.id
                                                        ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                                                        : (isDark ? 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
                                                }`}
                                            >
                                                {sec.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lab Batch Selection */}
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                                    Assigned Lab Batch
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'B1', title: 'Batch B1', desc: 'Attends physics / first-half lab cycle' },
                                        { id: 'B2', title: 'Batch B2', desc: 'Attends maths / second-half lab cycle' }
                                    ].map(b => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setSelectedLabBatch(b.id)}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                selectedLabBatch === b.id
                                                    ? (isDark ? 'bg-purple-600/15 border-purple-500 shadow-sm' : 'bg-purple-50 border-purple-500 shadow-sm')
                                                    : (isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold ${selectedLabBatch === b.id ? (isDark ? 'text-purple-300' : 'text-purple-700') : (isDark ? 'text-white' : 'text-slate-900')}`}>
                                                    {b.title}
                                                </span>
                                                {selectedLabBatch === b.id && <Check size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />}
                                            </div>
                                            <p className={`text-[11px] ${subtextColor}`}>{b.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Locking Notice */}
                            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${noticeBg}`}>
                                <Lock size={15} className={`shrink-0 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                <span>
                                    Upon confirmation, your Section and Lab Batch will be locked to personalize your schedule. Any future transfers can be requested via [Request Section Change].
                                </span>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmPlacement}
                                    disabled={confirmingPlacement || !selectedSectionId}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {confirmingPlacement ? 'Confirming...' : (
                                        <>
                                            <span>Confirm Placement & Activate</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SUCCESS */}
                    {step === 2 && (
                        <div className="py-6 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={36} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${titleColor}`}>Academic Placement Confirmed!</h3>
                                <p className={`text-xs max-w-sm mx-auto mt-1 ${subtextColor}`}>
                                    Your class section and lab allocations are now active. Your timetable and subjects have been generated.
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl border text-xs max-w-md mx-auto text-left ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
                                💡 <strong>USN Verification:</strong> You can verify your permanent institutional USN with OTP code anytime from your <strong>Profile &gt; Academic Identity</strong> settings.
                            </div>
                            <button
                                type="button"
                                onClick={() => { onClose(); window.location.reload(); }}
                                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                            >
                                Done &amp; View My Timetable
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AcademicOnboardingModal;
