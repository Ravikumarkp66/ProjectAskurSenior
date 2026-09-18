import React, { useState, useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../../../services/authService';
import { useTheme } from '../../../../../context/ThemeContext';

const BaselineSetupModal = ({
    isOpen,
    onClose,
    semester,
    registeredSubjects = [],
    onBaselineSaved
}) => {
    const { isDark = true } = useTheme?.() || {};

    const t = {
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
        surfaceElevated: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.06)' : '#CBD5E1',
        text: isDark ? '#F1F5F9' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        inputBg: isDark ? '#141724' : '#FFFFFF',
        accent: '#6D28D9',
        accentLight: isDark ? '#C4B5FD' : '#6D28D9'
    };

    const [baselineData, setBaselineData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (registeredSubjects && registeredSubjects.length > 0) {
            const initial = {};
            registeredSubjects.forEach(reg => {
                initial[reg._id] = {
                    present: reg.baseline?.present || 0,
                    conducted: reg.baseline?.conducted || 0
                };
            });
            setBaselineData(initial);
        }
    }, [registeredSubjects, isOpen]);

    if (!isOpen) return null;

    const handlePresentChange = (id, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setBaselineData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { conducted: 0 }),
                present: num
            }
        }));
    };

    const handleConductedChange = (id, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setBaselineData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { present: 0 }),
                conducted: num
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const baselinesPayload = registeredSubjects.map(reg => ({
                registeredSubjectId: reg._id,
                present: baselineData[reg._id]?.present || 0,
                conducted: baselineData[reg._id]?.conducted || 0
            }));

            const res = await apiV2.saveBaselineAttendance({
                semester,
                baselines: baselinesPayload
            });

            if (res.data?.success) {
                toast.success('Baseline attendance saved successfully!');
                if (onBaselineSaved) onBaselineSaved();
                onClose();
            } else {
                toast.error(res.data?.message || 'Failed to save baseline');
            }
        } catch (err) {
            console.error('Error saving baseline attendance:', err);
            toast.error('Failed to save baseline attendance. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[560px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans transition-colors"
                style={{
                    backgroundColor: t.surface,
                    borderColor: t.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: t.text
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div 
                    className="p-5 sm:px-6 flex justify-between items-center shrink-0"
                    style={{ borderBottom: `1px solid ${t.borderSubtle}` }}
                >
                    <div>
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: t.text }}>
                            Mid-Semester Baseline Setup
                        </h3>
                        <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                            Semester {semester} · Enter past aggregate classes attended before starting on AskUrSenior.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.surfaceElevated; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Info Alert */}
                <div className="px-5 sm:px-6 pt-4 shrink-0">
                    <div 
                        className="p-3 rounded-xl flex gap-2.5 text-xs"
                        style={{
                            backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : '#F5F3FF',
                            border: `1px solid ${isDark ? 'rgba(124, 58, 237, 0.2)' : '#DDD6FE'}`,
                            color: isDark ? '#C4B5FD' : '#6D28D9'
                        }}
                    >
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <span>
                            These baseline numbers will be added to your daily tracked classes for overall percentage calculation without generating fake calendar dates.
                        </span>
                    </div>
                </div>

                {/* Subject List Form */}
                <div className="p-5 sm:px-6 overflow-y-auto flex flex-col gap-3 flex-1">
                    {registeredSubjects.length === 0 ? (
                        <div className="text-center py-8 text-xs" style={{ color: t.textMuted }}>
                            No registered subjects found for Semester {semester}.
                        </div>
                    ) : (
                        registeredSubjects.map(reg => {
                            const id = reg._id;
                            const name = reg.customName || reg.subject?.name || 'Subject';
                            const code = reg.customCode || reg.subject?.code || '';
                            const presentVal = baselineData[id]?.present ?? 0;
                            const conductedVal = baselineData[id]?.conducted ?? 0;

                            return (
                                <div 
                                    key={id} 
                                    className="p-3.5 rounded-xl flex justify-between items-center gap-4 flex-wrap"
                                    style={{
                                        backgroundColor: t.surfaceSubtle,
                                        border: `1px solid ${t.borderSubtle}`
                                    }}
                                >
                                    <div className="flex-1 min-w-[160px]">
                                        <div className="text-sm font-semibold truncate" style={{ color: t.text }}>
                                            {name}
                                        </div>
                                        <div className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>
                                            {code ? `${code} · ` : ''}{reg.category || 'Theory'} · {reg.registeredCredits || 0} Credits
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div>
                                            <label className="block text-[10px] uppercase font-mono tracking-wider mb-1" style={{ color: t.textMuted }}>
                                                Present
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={presentVal}
                                                onChange={(e) => handlePresentChange(id, e.target.value)}
                                                className="w-16 h-8 rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:border-violet-500"
                                                style={{
                                                    backgroundColor: t.inputBg,
                                                    border: `1px solid ${t.borderSubtle}`,
                                                    color: isDark ? '#34D399' : '#059669'
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm mt-4" style={{ color: t.textFaint }}>/</span>
                                        <div>
                                            <label className="block text-[10px] uppercase font-mono tracking-wider mb-1" style={{ color: t.textMuted }}>
                                                Conducted
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={conductedVal}
                                                onChange={(e) => handleConductedChange(id, e.target.value)}
                                                className="w-16 h-8 rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:border-violet-500"
                                                style={{
                                                    backgroundColor: t.inputBg,
                                                    border: `1px solid ${t.borderSubtle}`,
                                                    color: t.text
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div 
                    className="p-4 sm:px-6 flex justify-end gap-2.5 shrink-0"
                    style={{ borderTop: `1px solid ${t.borderSubtle}` }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium rounded-xl transition-all"
                        style={{
                            backgroundColor: t.surfaceElevated,
                            color: t.textMuted,
                            border: `1px solid ${t.border}`
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-violet-600 hover:bg-violet-500 transition-all flex items-center gap-1.5 shadow-sm shadow-violet-600/30 disabled:opacity-50"
                    >
                        <Save size={14} />
                        <span>{isSaving ? 'Saving...' : 'Save Baseline'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BaselineSetupModal;
