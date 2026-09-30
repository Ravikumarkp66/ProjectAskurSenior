import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Sliders } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';

const TodayTimetableSidebar = ({
    selectedDate,
    dayClasses = [],
    sectionName = 'P',
    labBatch = 'B2',
    onCustomizeTimetable
}) => {
    const navigate = useNavigate();
    const { isDark = true } = useTheme?.() || { isDark: true };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const handleCustomizeClick = () => {
        if (onCustomizeTimetable) {
            onCustomizeTimetable();
        } else {
            navigate('/plus/timetable');
        }
    };

    return (
        <aside 
            className={`w-full rounded-xl flex flex-col select-none border transition-colors ${
                isDark 
                    ? 'bg-gradient-to-b from-[#12141C] to-[#0F1017] border-white/[0.07] shadow-[0_8px_24px_rgba(0,0,0,0.35)]' 
                    : 'bg-white border-slate-200 shadow-xs'
            }`}
        >
            {/* Header */}
            <div className={`p-4 pb-3 border-b flex flex-col gap-1.5 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        YOUR TIMETABLE
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium border ${
                        isDark 
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                        Sec {sectionName}{labBatch ? ` · ${labBatch}` : ''}
                    </span>
                </div>
                <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <Calendar size={13} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                    <span>{formatDateStr(selectedDate)}</span>
                    <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>·</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                        {dayClasses.length} {dayClasses.length === 1 ? 'slot' : 'slots'}
                    </span>
                </div>
            </div>

            {/* Timeline List */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[580px] scrollbar-none">
                {dayClasses.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <Clock size={24} className={`${isDark ? 'text-zinc-600' : 'text-slate-300'} stroke-[1.5]`} />
                        <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            No scheduled classes for this day.
                        </p>
                    </div>
                ) : (
                    <div className={`relative pl-4 space-y-4 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-[1px] ${
                        isDark ? 'before:bg-zinc-800' : 'before:bg-slate-200'
                    }`}>
                        {dayClasses.map((item, idx) => {
                            const startTime = item.timeSlot ? item.timeSlot.split('-')[0].trim() : '–';
                            const isLab = String(item.lectureType || '').toLowerCase() === 'lab';

                            return (
                                <div key={idx} className="relative group">
                                    {/* Timeline Node */}
                                    <div 
                                        className={`absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full border transition-colors ${
                                            isDark 
                                                ? 'bg-zinc-900 border-zinc-600 group-hover:border-violet-400 group-hover:bg-violet-500' 
                                                : 'bg-white border-slate-400 group-hover:border-purple-600 group-hover:bg-purple-600'
                                        }`}
                                    />

                                    <div className="flex flex-col gap-0.5">
                                        {/* Time Anchor */}
                                        <span className={`text-[11px] font-mono font-bold transition-colors ${
                                            isDark 
                                                ? 'text-zinc-400 group-hover:text-zinc-200' 
                                                : 'text-purple-700 font-semibold'
                                        }`}>
                                            {item.timeSlot || startTime}
                                        </span>

                                        {/* Subject Name */}
                                        <div className={`text-[13px] font-semibold leading-tight ${
                                            isDark ? 'text-zinc-200' : 'text-slate-900'
                                        }`}>
                                            {item.subjectName || item.subject?.name || 'Class'}
                                        </div>

                                        {/* Meta Pill */}
                                        <div className={`text-[10.5px] font-mono flex items-center gap-1.5 pt-0.5 ${
                                            isDark ? 'text-zinc-500' : 'text-slate-500'
                                        }`}>
                                            {item.subjectCode && (
                                                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                                                    {item.subjectCode}
                                                </span>
                                            )}
                                            <span>·</span>
                                            <span className={isLab 
                                                ? (isDark ? 'text-amber-400/90 font-medium' : 'text-amber-700 font-semibold')
                                                : (isDark ? 'text-zinc-400' : 'text-slate-500')
                                            }>
                                                {isLab ? `Lab${item.batchGroup && item.batchGroup !== 'ALL' ? ` (${item.batchGroup})` : ''}` : 'Theory'}
                                            </span>
                                            {item.room && (
                                                <>
                                                    <span>·</span>
                                                    <span>Rm {item.room}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Reference Link */}
            <div className={`p-3 border-t ${isDark ? 'border-white/[0.06] bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
                <button
                    type="button"
                    onClick={handleCustomizeClick}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                        isDark 
                            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border-transparent hover:border-white/[0.08]' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                    }`}
                >
                    <Sliders size={13} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                    <span>✎ Customize timetable</span>
                </button>
            </div>
        </aside>
    );
};

export default TodayTimetableSidebar;
