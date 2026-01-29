import React from 'react';
import { motion } from 'framer-motion';

// Simple LeetCode-style heatmap with placeholder data.
// Expects an optional `activityByDate` map: { 'YYYY-MM-DD': count }

const levels = ['bg-slate-800', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400'];

const getLevelClass = (count) => {
    if (!count) return levels[0];
    if (count < 2) return levels[1];
    if (count < 4) return levels[2];
    if (count < 7) return levels[3];
    return levels[4];
};

const ActivityHeatmap = ({ activityByDate = {} }) => {
    const today = new Date();
    const days = [];

    for (let i = 119; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ key, date: d, count: activityByDate[key] || 0 });
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-slate-100">Practice Activity</p>
                    <p className="text-xs text-slate-400">Last 4 months overview (prototype)</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Less</span>
                    {levels.map((cls, idx) => (
                        <span key={idx} className={`h-3 w-3 rounded-sm ${cls}`} />
                    ))}
                    <span>More</span>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto py-1">
                {Array.from({ length: 17 }).map((_, col) => (
                    <div key={col} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, row) => {
                            const index = row * 17 + col;
                            const day = days[index];
                            if (!day) return <span key={row} className="h-3 w-3 rounded-sm bg-transparent" />;
                            const title = `${day.date.toDateString()} • ${day.count} question${
                                day.count === 1 ? '' : 's'
                            } solved`;
                            return (
                                <motion.div
                                    key={day.key}
                                    className={`h-3 w-3 rounded-sm ${getLevelClass(day.count)}`}
                                    whileHover={{ scale: 1.6 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    title={title}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityHeatmap;
