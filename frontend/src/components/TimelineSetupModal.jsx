import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TimelineSetupModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [dates, setDates] = useState({
        collegeStart: initialData?.collegeStart ? new Date(initialData.collegeStart).toISOString().split('T')[0] : '',
        cie1: initialData?.cie1 ? new Date(initialData.cie1).toISOString().split('T')[0] : '',
        cie2: initialData?.cie2 ? new Date(initialData.cie2).toISOString().split('T')[0] : '',
        lastWorkingDay: initialData?.lastWorkingDay ? new Date(initialData.lastWorkingDay).toISOString().split('T')[0] : '',
        seeStart: initialData?.seeStart ? new Date(initialData.seeStart).toISOString().split('T')[0] : '',
        seeEnd: initialData?.seeEnd ? new Date(initialData.seeEnd).toISOString().split('T')[0] : '',
        nextSem: initialData?.nextSem ? new Date(initialData.nextSem).toISOString().split('T')[0] : ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!(initialData?.collegeStart || initialData?.cie1);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(dates);
        setIsSaving(false);
        onClose();
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to completely remove this timeline?")) return;
        setIsSaving(true);
        await onSave({});
        setIsSaving(false);
        onClose();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 9999 }}
                >
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="absolute inset-0" 
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[#111113] border border-slate-800 rounded-2xl p-6 shadow-2xl custom-scrollbar-premium"
                        style={{ maxWidth: '520px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">Semester Timeline Setup</h2>
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                    Configure your key semester milestones.<br/>
                                    This only needs to be done once.
                                </p>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: 'College Start Date', name: 'collegeStart' },
                                    { label: 'CIE 1 Date', name: 'cie1' },
                                    { label: 'CIE 2 Date', name: 'cie2' },
                                    { label: 'Last Working Day', name: 'lastWorkingDay' },
                                    { label: 'SEE Start Date', name: 'seeStart' },
                                    { label: 'SEE End Date', name: 'seeEnd' },
                                ].map((field) => (
                                    <div key={field.name} className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-300">{field.label} {['collegeStart', 'lastWorkingDay'].includes(field.name) && <span className="text-red-400">*</span>}</label>
                                        <input
                                            type="date"
                                            name={field.name}
                                            value={dates[field.name]}
                                            onChange={handleChange}
                                            required={['collegeStart', 'lastWorkingDay'].includes(field.name)}
                                            className="w-full bg-[#0a0a0b] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all color-scheme-dark"
                                        />
                                    </div>
                                ))}
                                
                                {/* Full width for Next Sem Start Date */}
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-[13px] font-semibold text-slate-300">Next Semester Start Date</label>
                                    <input
                                        type="date"
                                        name="nextSem"
                                        value={dates.nextSem}
                                        onChange={handleChange}
                                        className="w-full bg-[#0a0a0b] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all color-scheme-dark"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                {isEditing ? (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-semibold text-red-500/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        Reset Timeline
                                    </button>
                                ) : <div />}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? 'Saving...' : isEditing ? 'Update Timeline' : 'Create Timeline'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default TimelineSetupModal;
