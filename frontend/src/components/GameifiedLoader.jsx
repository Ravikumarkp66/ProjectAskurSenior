import React, { useState, useEffect } from 'react';

const GameifiedLoader = ({ 
    isLoading = true, 
    loadingText = "Loading", 
    progress = 0, 
    showProgress = true,
    variant = 'default', // 'default', 'upload', 'auth', 'data'
    tips = [],
    duration = 3000 
}) => {
    const [currentTip, setCurrentTip] = useState(0);
    const [points, setPoints] = useState(0);
    const [level, setLevel] = useState(1);
    const [showAchievement, setShowAchievement] = useState(false);
    const [animationProgress, setAnimationProgress] = useState(0);

    // Default tips for different variants
    const defaultTips = {
        default: [
            "💡 Did you know? You can switch between light and dark themes!",
            "🎯 Pro tip: Use the CGPA calculator to track your academic progress",
            "📚 Upload your study materials to help fellow students",
            "🔔 Enable notifications to stay updated with announcements",
            "⭐ Rate your experience to help us improve AskUrSenior"
        ],
        upload: [
            "📤 Uploading your file... This helps the entire student community!",
            "🏆 Every upload earns you contributor points!",
            "📊 Large files might take a moment - perfect quality takes time",
            "💪 You're making a difference by sharing knowledge!",
            "🚀 Almost there! Your contribution will be available soon"
        ],
        auth: [
            "🔐 Securing your connection...",
            "✨ Setting up your personalized dashboard",
            "📱 Syncing your academic data",
            "🎨 Preparing your study environment",
            "🏁 Almost ready to explore AskUrSenior!"
        ],
        data: [
            "📊 Processing your academic data...",
            "🧮 Calculating your progress metrics",
            "📈 Analyzing your performance trends",
            "🎯 Preparing personalized recommendations",
            "📚 Loading your study materials"
        ]
    };

    const currentTips = tips.length > 0 ? tips : (defaultTips[variant] || defaultTips.default);

    // Animate progress and change tips
    useEffect(() => {
        if (!isLoading) return;

        const progressInterval = setInterval(() => {
            setAnimationProgress(prev => {
                const newProgress = Math.min(prev + Math.random() * 15, progress || 90);
                
                // Add points based on progress
                if (newProgress > prev + 10) {
                    setPoints(p => p + 10);
                }

                // Level up every 50 points
                if (points >= level * 50 && level < 5) {
                    setLevel(l => l + 1);
                    setShowAchievement(true);
                    setTimeout(() => setShowAchievement(false), 2000);
                }

                return newProgress;
            });
        }, 200);

        const tipInterval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % currentTips.length);
        }, 2500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(tipInterval);
        };
    }, [isLoading, progress, points, level, currentTips.length]);

    // Reset when loading completes
    useEffect(() => {
        if (!isLoading) {
            const timeout = setTimeout(() => {
                setPoints(0);
                setLevel(1);
                setAnimationProgress(0);
                setCurrentTip(0);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    if (!isLoading) return null;

    const getVariantColors = () => {
        switch (variant) {
            case 'upload':
                return {
                    primary: 'from-green-500 to-emerald-600',
                    secondary: 'text-green-400',
                    bg: 'bg-green-500/10',
                    border: 'border-green-400/20'
                };
            case 'auth':
                return {
                    primary: 'from-blue-500 to-purple-600',
                    secondary: 'text-blue-400',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-400/20'
                };
            case 'data':
                return {
                    primary: 'from-orange-500 to-red-600',
                    secondary: 'text-orange-400',
                    bg: 'bg-orange-500/10',
                    border: 'border-orange-400/20'
                };
            default:
                return {
                    primary: 'from-purple-500 to-pink-600',
                    secondary: 'text-purple-400',
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-400/20'
                };
        }
    };

    const colors = getVariantColors();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                {/* Header with Level and Points */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center text-white font-bold text-xl`}>
                            {level}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Level {level}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{points} XP</p>
                        </div>
                    </div>
                    
                    {/* Loading Animation */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                        <div className={`absolute inset-0 w-16 h-16 rounded-full border-4 border-t-transparent bg-gradient-to-r ${colors.primary} animate-spin`}></div>
                        <div className="absolute inset-2 w-12 h-12 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                            <svg className={`w-6 h-6 ${colors.secondary} animate-pulse`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Achievement Notification */}
                {showAchievement && (
                    <div className={`mb-4 p-3 rounded-lg ${colors.bg} ${colors.border} border animate-bounce`}>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            <div>
                                <p className="font-bold text-yellow-600 dark:text-yellow-400">Level Up!</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">You reached Level {level}!</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Text */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {loadingText}...
                    </h3>
                    
                    {/* Progress Bar */}
                    {showProgress && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                                <span className={`text-sm font-bold ${colors.secondary}`}>{Math.round(animationProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full bg-gradient-to-r ${colors.primary} transition-all duration-300 ease-out`}
                                    style={{ width: `${animationProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* XP Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">XP to next level</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {points % 50}/50
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                                className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-300"
                                style={{ width: `${(points % 50) * 2}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Tips */}
                <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border min-h-[80px] flex items-center`}>
                    <div className="w-full">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl animate-bounce">💡</div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed animate-fade-in">
                                    {currentTips[currentTip]}
                                </p>
                            </div>
                        </div>
                        
                        {/* Tip Progress Dots */}
                        <div className="flex justify-center gap-2 mt-3">
                            {currentTips.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        index === currentTip 
                                            ? `bg-gradient-to-r ${colors.primary}` 
                                            : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading Actions */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>System Status: Online</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

// Higher-order component to wrap any component with gamified loading
export const withGameifiedLoading = (WrappedComponent, loadingProps = {}) => {
    return function GameifiedComponent(props) {
        const { isLoading, ...restProps } = props;
        
        return (
            <>
                <GameifiedLoader isLoading={isLoading} {...loadingProps} />
                {!isLoading && <WrappedComponent {...restProps} />}
            </>
        );
    };
};

export default GameifiedLoader;