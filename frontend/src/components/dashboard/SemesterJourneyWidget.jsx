import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimelineSetupModal from '../TimelineSetupModal';
import { apiClient } from '../../services/api';
import { useAuth } from '../../utils/hooks';

const SemesterJourneyWidget = () => {
    const { user, updateUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const [hoveredPin, setHoveredPin] = useState(false);
    
    const timeline = user?.semesterTimeline;

    // Helper to verify a date string is actually mathematically valid
    const isValidDate = (d) => d && !isNaN(new Date(d).getTime());
    
    const isConfigured = isValidDate(timeline?.collegeStart) && isValidDate(timeline?.lastWorkingDay);

    const handleSave = async (dates) => {
        try {
            const res = await apiClient.put('/auth/timeline', dates);
            if (updateUser) updateUser(res.data);
        } catch (err) {
            console.error('Failed to save timeline', err);
        }
    };

    if (!isConfigured) {
        return (
            <div className="w-full bg-[#111113]/80 border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/5">
                    📅
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Semester Journey</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                        Track important academic milestones, CIEs, and countdowns to your exams.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-95 z-10"
                >
                    Setup Timeline
                </button>
                <TimelineSetupModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={timeline}
                    onSave={handleSave}
                />
            </div>
        );
    }

    const now = new Date();
    const nowTime = now.getTime();
    
    // Sort milestones sequentially
    const allMilestones = [
        { key: 'collegeStart', label: 'Start', date: isValidDate(timeline.collegeStart) ? new Date(timeline.collegeStart) : null },
        { key: 'cie1', label: 'CIE 1', date: isValidDate(timeline.cie1) ? new Date(timeline.cie1) : null },
        { key: 'cie2', label: 'CIE 2', date: isValidDate(timeline.cie2) ? new Date(timeline.cie2) : null },
        { key: 'lastWorkingDay', label: 'Last Day', date: isValidDate(timeline.lastWorkingDay) ? new Date(timeline.lastWorkingDay) : null },
        { key: 'seeStart', label: 'SEE', date: isValidDate(timeline.seeStart) ? new Date(timeline.seeStart) : null },
        { key: 'nextSem', label: 'Next Sem', date: isValidDate(timeline.nextSem) ? new Date(timeline.nextSem) : null }
    ].filter(m => m.date !== null).sort((a, b) => a.date.getTime() - b.date.getTime());

    const start = allMilestones[0].date.getTime();
    const end = allMilestones[allMilestones.length - 1].date.getTime();
    const totalDuration = Math.max(1, end - start); // Prevent div by zero
    
    let progressPercent = 0;
    if (nowTime >= end) progressPercent = 100;
    else if (nowTime > start) progressPercent = ((nowTime - start) / totalDuration) * 100;

    const getDaysDiff = (targetDate) => {
        const diffTime = targetDate.getTime() - nowTime;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const dayOfSemester = nowTime > start ? Math.ceil((nowTime - start) / (1000 * 60 * 60 * 24)) : 0;
    const totalSemesterDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    const nextMilestone = allMilestones.find(m => m.date.getTime() > nowTime);
    const lastWorkingDayDate = allMilestones.find(m => m.key === 'lastWorkingDay')?.date;
    const collegeDaysLeft = lastWorkingDayDate ? Math.max(0, getDaysDiff(lastWorkingDayDate)) : 0;

    return (
        <div className="w-full bg-[#111113]/80 border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col gap-8 shadow-xl backdrop-blur-md relative group">
            
            {/* Header section */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                        Semester Journey
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Day</span>
                            <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">{dayOfSemester} / {totalSemesterDays}</span>
                        </div>
                        {collegeDaysLeft > 0 && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span className="text-emerald-500/80 uppercase tracking-wider text-[10px]">College Left</span>
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{collegeDaysLeft} Days</span>
                            </div>
                        )}
                        {nextMilestone && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span className="text-purple-400/80 uppercase tracking-wider text-[10px]">Next</span>
                                <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{nextMilestone.label} in {getDaysDiff(nextMilestone.date)} Days</span>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-slate-500 hover:text-purple-400 transition-colors text-sm p-2 bg-white/5 hover:bg-purple-500/10 rounded-lg border border-transparent hover:border-purple-500/20 flex-shrink-0"
                    title="Edit Timeline"
                >
                    ⚙️ <span className="hidden sm:inline-block ml-1 text-xs font-bold uppercase tracking-wider">Edit</span>
                </button>
            </div>

            {/* Visual Timeline Graphic */}
            <div className="relative h-12 flex items-center mt-4 mb-2 mx-4">
                {/* Background track */}
                <div className="absolute left-0 right-0 h-1.5 bg-slate-800 rounded-full" />
                
                {/* Progress fill */}
                <motion.div 
                    className="absolute left-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Milestones */}
                {allMilestones.map((m, i) => {
                    const posPercent = ((m.date.getTime() - start) / totalDuration) * 100;
                    const isPassed = nowTime >= m.date.getTime();
                    const isNext = nextMilestone?.key === m.key;
                    const daysDiff = getDaysDiff(m.date);
                    
                    return (
                        <div 
                            key={m.key}
                            className="absolute flex flex-col items-center -translate-x-1/2 -top-1.5 z-10"
                            style={{ left: `${posPercent}%` }}
                            onMouseEnter={() => setHoveredMilestone(m.key)}
                            onMouseLeave={() => setHoveredMilestone(null)}
                        >
                            {/* Dot */}
                            <motion.div 
                                className={`w-4 h-4 rounded-full border-[3px] border-[#111113] cursor-pointer transition-transform ${isPassed ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : isNext ? 'bg-indigo-400 animate-pulse border-indigo-400/30' : 'bg-slate-700 hover:bg-slate-500'}`}
                                whileHover={{ scale: 1.3 }}
                            />
                            
                            {/* Label */}
                            <span className={`absolute top-6 text-[10px] sm:text-xs font-bold whitespace-nowrap tracking-wide ${isPassed ? 'text-purple-300' : isNext ? 'text-indigo-300' : 'text-slate-500'}`}>
                                {m.label}
                            </span>

                            {/* Enhanced Hover Tooltip */}
                            <AnimatePresence>
                                {hoveredMilestone === m.key && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute bottom-8 flex flex-col items-center pointer-events-none z-50 min-w-[140px]"
                                    >
                                        <div className="bg-[#1a1a1f] border border-white/10 shadow-2xl rounded-xl p-3 text-left w-full backdrop-blur-xl">
                                            <p className="text-sm font-bold text-white mb-1 border-b border-white/5 pb-1">{m.label}</p>
                                            <div className="space-y-1 mt-2">
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Date</span>
                                                    <span className="text-xs text-white font-medium">{formatDate(m.date)}</span>
                                                </div>
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Status</span>
                                                    <span className={`text-xs font-bold ${isPassed ? 'text-emerald-400' : isNext ? 'text-indigo-400' : 'text-amber-400'}`}>
                                                        {isPassed ? 'Completed' : isNext ? 'Upcoming' : 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-4 pt-1">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Time</span>
                                                    <span className="text-[11px] font-semibold text-purple-300">
                                                        {daysDiff > 0 ? `${daysDiff} Days Away` : daysDiff < 0 ? `${Math.abs(daysDiff)} Days Ago` : 'Today'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-3 h-3 bg-[#1a1a1f] border-b border-r border-white/10 rotate-45 -mt-1.5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}

                {/* Current Date Pin */}
                {progressPercent > 0 && progressPercent < 100 && (
                    <motion.div
                        className="absolute flex flex-col items-center -translate-x-1/2 -top-[20px] z-20 cursor-pointer"
                        initial={{ left: 0 }}
                        animate={{ left: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        onMouseEnter={() => setHoveredPin(true)}
                        onMouseLeave={() => setHoveredPin(false)}
                    >
                        <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-pulse hover:animate-none hover:scale-110 transition-transform duration-200">📍</span>
                        
                        {/* Enhanced Current Position Hover */}
                        <AnimatePresence>
                            {hoveredPin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                    className="absolute top-8 flex flex-col items-center pointer-events-none z-50 min-w-[180px]"
                                >
                                    <div className="w-3 h-3 bg-[#1a1a1f] border-t border-l border-white/10 rotate-45 -mb-1.5 z-10" />
                                    <div className="bg-[#1a1a1f] border border-white/10 shadow-2xl rounded-xl p-3 text-left w-full backdrop-blur-xl">
                                        <p className="text-sm font-bold text-white mb-1 border-b border-white/5 pb-1">Today</p>
                                        <div className="space-y-1.5 mt-2">
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Position</span>
                                                <span className="text-xs text-white font-medium">Day {dayOfSemester} of {totalSemesterDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Progress</span>
                                                <span className="text-xs font-bold text-emerald-400">{Math.round(progressPercent)}%</span>
                                            </div>
                                            {collegeDaysLeft > 0 && (
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Classes</span>
                                                    <span className="text-xs font-medium text-slate-300">{collegeDaysLeft} Days Left</span>
                                                </div>
                                            )}
                                            {nextMilestone && (
                                                <div className="flex justify-between items-center gap-4 pt-1 mt-1 border-t border-white/5">
                                                    <span className="text-[10px] text-purple-400/80 uppercase tracking-wider">Next</span>
                                                    <span className="text-[11px] font-bold text-purple-300">
                                                        {nextMilestone.label} in {getDaysDiff(nextMilestone.date)}d
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Status Strip underneath */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {allMilestones.map((m, i) => {
                    const isPassed = nowTime >= m.date.getTime();
                    const isNext = nextMilestone?.key === m.key;
                    
                    return (
                        <div key={`status-${m.key}`} className="flex items-center gap-1.5 text-xs">
                            {isPassed ? (
                                <span className="text-emerald-500">✓</span>
                            ) : isNext ? (
                                <span className="text-indigo-400 animate-pulse">⏳</span>
                            ) : (
                                <span className="text-slate-600">○</span>
                            )}
                            <span className={`${isPassed ? 'text-slate-400' : isNext ? 'text-indigo-300 font-semibold' : 'text-slate-600'}`}>
                                {m.label} {isPassed ? 'Completed' : isNext ? 'Upcoming' : 'Pending'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <TimelineSetupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={timeline}
                onSave={handleSave}
            />
        </div>
    );
};

export default SemesterJourneyWidget;
