import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';

const AcademicProfileCompletionBanner = ({ student, onUpdated }) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [overviewData, setOverviewData] = useState(null);

    const fetchOverview = async () => {
        try {
            const res = await apiClient.get('/student/academics/overview');
            if (res.data?.success) {
                setOverviewData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch academic onboarding overview:', err);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, [student]);

    const onboarding = overviewData?.academicOnboarding;
    const isBatchConfigured = !!overviewData?.batch && onboarding?.batchConfigured !== false;
    const isComplete = Boolean(onboarding?.isComplete || student?.academicProfileComplete);
    const percentage = onboarding?.completionPercentage ?? student?.academicProfileCompletion ?? 0;
    const missing = onboarding?.missingFields || [];

    // If completely done or 100% complete, do not clutter screen
    if (isComplete || percentage >= 100) {
        return null;
    }

    // ONLY ask to complete academic profile for batches configured in the admin panel!
    if (!isBatchConfigured) {
        return null;
    }

    const containerClass = isDark
        ? 'bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 border-purple-500/20 text-white'
        : 'bg-gradient-to-r from-purple-50 via-indigo-50/80 to-purple-50 border-purple-200/90 shadow-sm text-slate-900';

    const iconBoxClass = isDark
        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        : 'bg-purple-100 text-purple-700 border-purple-200';

    const titleClass = isDark ? 'text-white' : 'text-slate-900';
    const subtextClass = isDark ? 'text-gray-300' : 'text-slate-600';
    const strongClass = isDark ? 'text-purple-300 font-semibold' : 'text-purple-700 font-bold';

    const badgeClass = isDark
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-purple-100 text-purple-700 border-purple-200';

    const progressTrackClass = isDark ? 'bg-white/10' : 'bg-slate-200';

    return (
        <div className={`w-full mb-3 rounded-2xl border p-4 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans ${containerClass}`}>
            <div className="flex items-start sm:items-center gap-3.5">
                <div className={`p-2.5 rounded-xl border shrink-0 ${iconBoxClass}`}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${titleClass}`}>Complete Your Academic Profile</h4>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {percentage}% Complete
                        </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${subtextClass}`}>
                        {missing.length > 0 ? (
                            <span>Pending: <strong className={strongClass}>{missing.join(', ')}</strong></span>
                        ) : (
                            <span>Verify your institutional USN and select your section placement</span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <div className={`w-24 sm:w-32 rounded-full h-2 overflow-hidden ${progressTrackClass}`}>
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/profile/edit/basic')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                    <span>Complete in Profile</span>
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default AcademicProfileCompletionBanner;
