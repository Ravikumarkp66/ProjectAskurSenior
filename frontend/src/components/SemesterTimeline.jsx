import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimelineSetupModal from './TimelineSetupModal';
import { apiClient } from '../services/api';

const SemesterTimeline = ({ currentUser, onTimelineUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const [hoveredPin, setHoveredPin] = useState(false);
    
    const timeline = currentUser?.semesterTimeline;

    // Helper to verify a date string is actually mathematically valid
    const isValidDate = (d) => d && !isNaN(new Date(d).getTime());
    
    const isConfigured = isValidDate(timeline?.collegeStart) && isValidDate(timeline?.lastWorkingDay);

    const handleSave = async (dates) => {
        try {
            const res = await apiClient.put('/auth/timeline', dates);
            if (onTimelineUpdate) onTimelineUpdate(res.data);
        } catch (err) {
            console.error('Failed to save timeline', err);
        }
    };

    if (!isConfigured) {
        return (
            <div className="flex items-center">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow-purple-600/10 flex items-center gap-2"
                >
                    <span>📅</span> Setup Timeline
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
    // Prevent division by zero if user selects the same date for start and end
    const totalDuration = Math.max(1, end - start);
    
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
    const nextMilestone = allMilestones.find(m => m.date.getTime() > nowTime);
    const lastWorkingDayDate = allMilestones.find(m => m.key === 'lastWorkingDay')?.date;
    const collegeDaysLeft = lastWorkingDayDate ? Math.max(0, getDaysDiff(lastWorkingDayDate)) : 0;
    const seeStartDate = allMilestones.find(m => m.key === 'seeStart')?.date;
    const seeStartsIn = seeStartDate ? Math.max(0, getDaysDiff(seeStartDate)) : 0;

    return (
        <div className="flex flex-col gap-5 w-full max-w-[500px] hidden md:flex relative group px-2">
            
            {/* Quick Insights Row & Setup Icon */}
            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                {collegeDaysLeft > 0 && (
                    <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        📅 {collegeDaysLeft} College Days Left
                    </span>
                )}
                {nextMilestone && (
                    <span className="text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                        🎯 {getDaysDiff(nextMilestone.date)} Days Until {nextMilestone.label}
                    </span>
                )}
                {seeStartsIn > 0 && (
                    <span className="text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                        📝 SEE in {seeStartsIn} Days
                    </span>
                )}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-slate-500 hover:text-purple-400 transition-colors text-sm"
                    title="Edit Timeline"
                >
                    ⚙️
                </button>
            </div>

            {/* Visual Timeline */}
            <div className="relative h-6 flex items-center mt-6 mb-2">
                {/* Background track */}
                <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full" />
                
                {/* Progress fill */}
                <motion.div 
                    className="absolute left-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Milestones */}
                {allMilestones.map((m, i) => {
                    const posPercent = ((m.date.getTime() - start) / totalDuration) * 100;
                    const isPassed = nowTime >= m.date.getTime();
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
                                className={`w-2.5 h-2.5 rounded-full border-[2.5px] border-[#0a0a0b] cursor-pointer transition-transform ${isPassed ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-slate-600 hover:bg-slate-500'}`}
                                whileHover={{ scale: 1.5 }}
                            />
                            
                            {/* Label */}
                            <span className={`absolute top-4 text-[9px] font-bold whitespace-nowrap tracking-wider ${isPassed ? 'text-purple-300' : 'text-slate-500'}`}>
                                {m.label}
                            </span>

                            {/* Hover Tooltip */}
                            <AnimatePresence>
                                {hoveredMilestone === m.key && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                        className="absolute bottom-6 flex flex-col items-center pointer-events-none z-50"
                                    >
                                        <div className="bg-[#111113] border border-purple-500/30 shadow-xl rounded-lg px-3 py-2 text-center whitespace-nowrap backdrop-blur-md">
                                            <p className="text-[11px] font-bold text-white">{m.label}</p>
                                            <p className="text-[10px] text-purple-300 mt-0.5">{formatDate(m.date)}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                                                {daysDiff > 0 ? `${daysDiff} Days Remaining` : daysDiff < 0 ? `${Math.abs(daysDiff)} Days Ago` : 'Today'}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 bg-[#111113] border-b border-r border-purple-500/30 rotate-45 -mt-1.5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}

                {/* Current Date Pin */}
                {progressPercent > 0 && progressPercent < 100 && (
                    <motion.div
                        className="absolute flex flex-col items-center -translate-x-1/2 -top-[18px] z-20 cursor-pointer"
                        initial={{ left: 0 }}
                        animate={{ left: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        onMouseEnter={() => setHoveredPin(true)}
                        onMouseLeave={() => setHoveredPin(false)}
                    >
                        <span className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse hover:animate-none hover:scale-125 transition-transform duration-200">📍</span>
                        
                        <AnimatePresence>
                            {hoveredPin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                                    className="absolute top-7 flex flex-col items-center pointer-events-none z-50"
                                >
                                    <div className="w-2 h-2 bg-[#111113] border-t border-l border-white/20 rotate-45 -mb-1.5 z-10" />
                                    <div className="bg-[#111113] border border-white/20 shadow-2xl rounded-lg px-3 py-2 text-center whitespace-nowrap backdrop-blur-md">
                                        <p className="text-[11px] font-bold text-white">Today</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Day {dayOfSemester} of Semester</p>
                                        {nextMilestone && (
                                            <p className="text-[10px] text-purple-400 font-semibold mt-1">
                                                {getDaysDiff(nextMilestone.date)} Days Until {nextMilestone.label}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
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

export default SemesterTimeline;
