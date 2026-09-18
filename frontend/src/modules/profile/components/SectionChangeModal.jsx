import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Clock, Send, Lock } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';

const SectionChangeModal = ({ isOpen, onClose, student, onSubmitted }) => {
    const { isDark } = useTheme();
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);
    const [targetSectionId, setTargetSectionId] = useState('');
    const [requestedLabBatch, setRequestedLabBatch] = useState(student?.labBatch || 'B1');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [existingRequest, setExistingRequest] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setError('');
        setSuccessMsg('');
        setReason('');

        const fetchData = async () => {
            setLoadingSections(true);
            try {
                const [secRes, reqRes] = await Promise.all([
                    apiClient.get('/student/academics/sections'),
                    apiClient.get('/student/academics/section-change-request').catch(() => ({ data: { data: [] } }))
                ]);

                if (secRes.data?.success) {
                    const secs = secRes.data.data?.sections || [];
                    setAvailableSections(secs);
                    const diffSec = secs.find(s => !s.isCurrent);
                    if (diffSec) setTargetSectionId(diffSec.id);
                }

                const requests = reqRes.data?.data || [];
                const pending = requests.find(r => r.status === 'PENDING');
                if (pending) {
                    setExistingRequest(pending);
                } else {
                    setExistingRequest(null);
                }
            } catch (err) {
                console.error('Failed to load sections for change request:', err);
                setError(err.response?.data?.error || err.message || 'Failed to load sections');
            } finally {
                setLoadingSections(false);
            }
        };

        fetchData();
    }, [isOpen, student]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!targetSectionId) {
            setError('Please select a target section');
            return;
        }
        if (!reason || reason.trim().length < 10) {
            setError('Please provide a reason with at least 10 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await apiClient.post('/student/academics/section-change-request', {
                requestedSectionId: targetSectionId,
                requestedLabBatch,
                reason: reason.trim()
            });

            if (res.data?.success) {
                setSuccessMsg('Section change request submitted successfully!');
                setExistingRequest(res.data.data);
                if (onSubmitted) onSubmitted(res.data.data);
            } else {
                setError(res.data?.error || 'Failed to submit request');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const modalBg = isDark ? 'bg-[#14151a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl';
    const headerBorder = isDark ? 'border-white/10' : 'border-slate-200';
    const subtextColor = isDark ? 'text-gray-400' : 'text-slate-500';
    const labelColor = isDark ? 'text-gray-300' : 'text-slate-700';
    const inputBg = isDark ? 'bg-[#1b1c22] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';
    const infoCardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200';
    const currentTextColor = isDark ? 'text-white' : 'text-slate-900';

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/75 backdrop-blur-sm' : 'bg-slate-900/40 backdrop-blur-sm'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`relative w-full max-w-lg border rounded-2xl shadow-2xl p-6 overflow-hidden font-sans ${modalBg}`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between pb-4 border-b ${headerBorder}`}>
                        <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                <Lock size={18} />
                            </div>
                            <div>
                                <h3 className={`text-base font-semibold ${currentTextColor}`}>Section Change Request</h3>
                                <p className={`text-xs ${subtextColor}`}>Class Section & Lab Batch are administrative records</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-4 space-y-4">
                        {existingRequest ? (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                                    <Clock size={16} />
                                    <span>Pending Request Under Review</span>
                                </div>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                    You have an active request to transfer from{' '}
                                    <strong className={currentTextColor}>Section {existingRequest.currentSection?.name || student?.section}</strong> to{' '}
                                    <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>Section {existingRequest.requestedSection?.name}</strong>{' '}
                                    ({existingRequest.requestedLabBatch || 'B1'}).
                                </p>
                                <div className={`text-[11px] pt-1 ${subtextColor}`}>
                                    Submitted on: {new Date(existingRequest.createdAt).toLocaleDateString()} · Status: <span className="text-amber-500 uppercase font-semibold">Pending</span>
                                </div>
                                <p className="text-[11px] text-gray-500 italic">
                                    Until approved by college administration, your timetable, attendance, and classes remain on your current section.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs">
                                        <CheckCircle2 size={16} />
                                        <span>{successMsg}</span>
                                    </div>
                                )}

                                {/* Current Assignment */}
                                <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border text-xs ${infoCardBg}`}>
                                    <div>
                                        <span className={`block mb-0.5 ${subtextColor}`}>Current Section</span>
                                        <span className={`font-semibold ${currentTextColor}`}>Section {student?.section || 'A'}</span>
                                    </div>
                                    <div>
                                        <span className={`block mb-0.5 ${subtextColor}`}>Current Lab Batch</span>
                                        <span className={`font-semibold ${currentTextColor}`}>Batch {student?.labBatch || 'B1'}</span>
                                    </div>
                                </div>

                                {/* Target Section Selection */}
                                <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                                        Requested Target Section
                                    </label>
                                    {loadingSections ? (
                                        <div className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                                    ) : (
                                        <select
                                            value={targetSectionId}
                                            onChange={(e) => setTargetSectionId(e.target.value)}
                                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-purple-500 transition-colors ${inputBg}`}
                                        >
                                            {availableSections.map(sec => (
                                                <option key={sec.id} value={sec.id} disabled={sec.isCurrent}>
                                                    Section {sec.name} {sec.isCurrent ? '(Current)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Requested Lab Batch Selection */}
                                <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                                        Requested Lab Batch
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['B1', 'B2'].map(batch => (
                                            <button
                                                key={batch}
                                                type="button"
                                                onClick={() => setRequestedLabBatch(batch)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                                    requestedLabBatch === batch
                                                        ? (isDark ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm' : 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm')
                                                        : (isDark ? 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:border-white/20' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
                                                }`}
                                            >
                                                Batch {batch}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                                        Reason for Change <span className="text-gray-400 text-[11px]">(min. 10 chars)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why you are requesting a section transfer..."
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none ${inputBg}`}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : (
                                            <>
                                                <span>Submit Request</span>
                                                <Send size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SectionChangeModal;
