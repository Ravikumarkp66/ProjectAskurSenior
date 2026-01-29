import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, sublabel, icon, accent }) => {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative overflow-hidden rounded-2xl border border-slate-900/60 bg-slate-900 text-slate-50 shadow-lg px-5 py-4 flex items-center gap-4"
        >
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-300/90">{label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{value}</p>
                {sublabel && <p className="mt-0.5 text-xs text-slate-300/80">{sublabel}</p>}
            </div>
        </motion.div>
    );
};

const StatsCards = ({ subjects = [], progress = 0 }) => {
    const totalSubjects = subjects.length;
    const modules = subjects.flatMap((s) => s.modules || []);
    const totalModules = modules.length;
    const questions = modules.flatMap((m) => m.questions || []);
    const totalQuestions = questions.length;
    const solvedQuestions = questions.filter((q) => q.completed).length;

    // simple streak placeholder: days with any completion in last 7 days
    const dailyByDate = questions
        .filter((q) => q.completedAt)
        .reduce((acc, q) => {
            const day = new Date(q.completedAt).toDateString();
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});
    const streak = Object.keys(dailyByDate).length;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
                label="Total Subjects"
                value={totalSubjects || '--'}
                sublabel="Across current branch"
                accent="from-orange-500 to-amber-400"
                icon={
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect x="3" y="4" width="7" height="16" rx="2" fill="currentColor" opacity="0.9" />
                        <rect x="10" y="4" width="7" height="16" rx="2" fill="currentColor" opacity="0.7" />
                        <path
                            d="M7 8H9"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M14 8H16"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                }
            />
            <StatCard
                label="Modules Completed"
                value={`${modules.filter((m) => (m.questions || []).every((q) => q.completed)).length}/${
                    totalModules || 0
                }`}
                sublabel="Fully completed modules"
                accent="from-blue-500 to-sky-400"
                icon={
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="4"
                            y="5"
                            width="16"
                            height="14"
                            rx="2.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        />
                        <path
                            d="M4 10H20"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        />
                        <path
                            d="M10 15H14"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                        />
                    </svg>
                }
            />
            <StatCard
                label="Questions Solved"
                value={`${solvedQuestions}/${totalQuestions || 0}`}
                sublabel="Checked as completed"
                accent="from-emerald-500 to-lime-400"
                icon={
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        />
                        <path
                            d="M8 12.5L10.7 15L16 9"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                }
            />
            <StatCard
                label="Daily Streak"
                value={streak || 0}
                sublabel="Active days (prototype)"
                accent="from-purple-500 to-fuchsia-400"
                icon={
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 3.5C12 3.5 9.5 6 9.5 9C7.5 9.5 6 11.3 6 13.5C6 16.5 8.2 19 12 19C15.8 19 18 16.5 18 13.5C18 10.2 15.5 8.5 14.5 7.5C13.8 8.8 13 9.5 13 9.5C13 7 12 3.5 12 3.5Z"
                            fill="currentColor"
                        />
                        <path
                            d="M10 14.5C10 16 10.9 17.2 12.3 17.2C13.7 17.2 14.7 16.1 14.7 14.7C14.7 13.7 14.2 12.9 13.7 12.3C13.3 13.1 12.8 13.6 12.3 14C12.1 13 11.6 11.9 11 11.3C10.5 12 10 13.1 10 14.5Z"
                            fill="#F9A8FF"
                        />
                    </svg>
                }
            />
        </div>
    );
};

export default StatsCards;
