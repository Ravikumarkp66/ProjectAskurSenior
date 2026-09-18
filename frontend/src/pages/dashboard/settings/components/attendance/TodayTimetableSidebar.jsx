import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Sliders } from 'lucide-react';

const TodayTimetableSidebar = ({
    selectedDate,
    dayClasses = [],
    sectionName = 'P',
    labBatch = 'B2',
    onCustomizeTimetable
}) => {
    const navigate = useNavigate();

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
            navigate('/home/timetable');
        }
    };

    return (
        <aside 
            className="w-full rounded-xl flex flex-col select-none"
            style={{
                background: 'linear-gradient(180deg, #12141C 0%, #0F1017 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <div className="p-4 pb-3 border-b border-white/[0.06] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                        YOUR TIMETABLE
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                        Sec {sectionName}{labBatch ? ` · ${labBatch}` : ''}
                    </span>
                </div>
                <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-zinc-500" />
                    <span>{formatDateStr(selectedDate)}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300 font-mono">{dayClasses.length} {dayClasses.length === 1 ? 'slot' : 'slots'}</span>
                </div>
            </div>

            {/* Timeline List */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[580px] scrollbar-none">
                {dayClasses.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <Clock size={24} className="text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs text-zinc-500 font-medium">
                            No scheduled classes for this day.
                        </p>
                    </div>
                ) : (
                    <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-[1px] before:bg-zinc-800">
                        {dayClasses.map((item, idx) => {
                            const startTime = item.timeSlot ? item.timeSlot.split('-')[0].trim() : '–';
                            const isLab = String(item.lectureType || '').toLowerCase() === 'lab';

                            return (
                                <div key={idx} className="relative group">
                                    {/* Timeline Node */}
                                    <div 
                                        className="absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-600 group-hover:border-violet-400 group-hover:bg-violet-500 transition-colors"
                                    />

                                    <div className="flex flex-col gap-0.5">
                                        {/* Time Anchor */}
                                        <span className="text-[11px] font-mono font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                            {item.timeSlot || startTime}
                                        </span>

                                        {/* Subject Name */}
                                        <div className="text-[13px] font-semibold text-zinc-200 leading-tight">
                                            {item.subjectName || item.subject?.name || 'Class'}
                                        </div>

                                        {/* Meta Pill */}
                                        <div className="text-[10.5px] font-mono text-zinc-500 flex items-center gap-1.5 pt-0.5">
                                            {item.subjectCode && (
                                                <span className="text-zinc-400 font-medium">{item.subjectCode}</span>
                                            )}
                                            <span>·</span>
                                            <span className={isLab ? 'text-amber-400/90' : 'text-zinc-400'}>
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
            <div className="p-3 border-t border-white/[0.06] bg-black/20">
                <button
                    type="button"
                    onClick={handleCustomizeClick}
                    className="w-full py-2 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                >
                    <Sliders size={13} className="text-zinc-500" />
                    <span>✎ Customize timetable</span>
                </button>
            </div>
        </aside>
    );
};

export default TodayTimetableSidebar;
