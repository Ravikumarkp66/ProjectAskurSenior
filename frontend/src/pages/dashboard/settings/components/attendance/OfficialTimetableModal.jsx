import React from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';
import WeeklyTimetableGrid from '../WeeklyTimetableGrid';

const OfficialTimetableModal = ({
    isOpen,
    onClose,
    slots = [],
    config = null,
    subjects = [],
    registeredSubjects = [],
    userProfile = null,
    allottedTimetable = null
}) => {
    const { isDark = true } = useTheme?.() || {};

    const t = {
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
        surfaceElevated: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
        text: isDark ? '#F1F5F9' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        bannerBg: isDark ? 'rgba(16, 185, 129, 0.06)' : '#ECFDF5',
        bannerBorder: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0',
        bannerText: isDark ? '#6EE7B7' : '#065F46',
    };

    if (!isOpen) return null;

    const sectionName = allottedTimetable?.sectionName || userProfile?.section || 'K';
    const batchName = allottedTimetable?.labBatch || userProfile?.labBatch || 'B1';
    const branchName = allottedTimetable?.branchName || userProfile?.branch || 'Engineering';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div 
                className="w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors"
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
                    className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{
                        backgroundColor: t.surfaceSubtle,
                        borderBottom: `1px solid ${t.border}`
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                color: isDark ? '#34D399' : '#059669',
                                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`
                            }}
                        >
                            <Lock size={15} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: t.text }}>
                                    OFFICIAL ALLOTTED TIMETABLE
                                </h3>
                                <span 
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                        color: isDark ? '#34D399' : '#059669',
                                        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`
                                    }}
                                >
                                    Read-only Baseline
                                </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                                Section {sectionName} · Batch {batchName} · {branchName} · Allotted by College Administration
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.surfaceElevated; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sub-banner notification */}
                <div 
                    className="px-6 py-2.5 flex items-center gap-2 text-xs shrink-0"
                    style={{
                        backgroundColor: t.bannerBg,
                        borderBottom: `1px solid ${t.bannerBorder}`,
                        color: t.bannerText
                    }}
                >
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>
                        This is your official institutional schedule. Customizations made to your personal timetable do not modify this baseline.
                    </span>
                </div>

                {/* Grid Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    <WeeklyTimetableGrid
                        slots={slots}
                        config={config}
                        subjects={subjects}
                        registeredSubjects={registeredSubjects}
                        user={userProfile}
                        allottedTimetable={{ ...allottedTimetable, isOfficial: true }}
                        isReadOnly={true}
                        onCellClick={() => {}}
                    />
                </div>

                {/* Footer */}
                <div 
                    className="px-6 py-3.5 flex items-center justify-between shrink-0 text-xs font-mono"
                    style={{
                        backgroundColor: t.surfaceSubtle,
                        borderTop: `1px solid ${t.border}`,
                        color: t.textFaint
                    }}
                >
                    <span>Immutable College Baseline</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            backgroundColor: t.surfaceElevated,
                            color: t.text,
                            border: `1px solid ${t.border}`
                        }}
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OfficialTimetableModal;
