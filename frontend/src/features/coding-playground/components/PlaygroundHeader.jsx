import React, { useState } from 'react';
import { 
    Clock, Maximize2, Minimize2, Keyboard, 
    Play, Pause, Send, RotateCcw, Loader2 
} from 'lucide-react';

const PlaygroundHeader = ({ 
    theme = 'dark',
    secondsElapsed = 0,
    isTimerRunning = false,
    onToggleTimer,
    onResetTimer,
    onOpenShortcuts,
    onRunCode,
    onSubmitCode,
    isRunning = false,
    isSubmitting = false,
    isAuthenticated = true,
    hasPlusAccess = true,
    onPlusAction
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRunHovered, setIsRunHovered] = useState(false);
    const isDark = theme === 'dark';
    const plusTooltip = isAuthenticated ? "Upgrade for plus access" : "Login for plus access";

    const formatTimer = (totalSeconds = 0) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    return (
        <header style={{
            height: 50,
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
            borderBottom: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            flexShrink: 0,
            userSelect: 'none',
            zIndex: 20,
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}>
            {/* Center Controls: Timer to Submit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Lab Session Timer with Play/Pause Control (Starts paused) */}
                <div 
                    title={!hasPlusAccess ? plusTooltip : undefined}
                    onClick={!hasPlusAccess ? onPlusAction : undefined}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isDark ? '#111111' : '#F3F4F6',
                        border: isDark 
                            ? (isTimerRunning ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #202020')
                            : (isTimerRunning ? '1px solid rgba(2, 132, 199, 0.5)' : '1px solid #E5E7EB'),
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 12,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: isDark ? (isTimerRunning ? '#38BDF8' : '#D1D5DB') : (isTimerRunning ? '#0284C7' : '#111827'),
                        cursor: !hasPlusAccess ? 'not-allowed' : 'default',
                        opacity: !hasPlusAccess ? 0.55 : 1,
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Clock size={13} color={isDark ? (isTimerRunning ? '#38BDF8' : '#707070') : (isTimerRunning ? '#0284C7' : '#9CA3AF')} />
                    <span style={{ fontWeight: 700, minWidth: 42 }}>{formatTimer(secondsElapsed)}</span>

                    {/* Dedicated Play / Pause Button */}
                    <button
                        onClick={hasPlusAccess ? onToggleTimer : onPlusAction}
                        disabled={!hasPlusAccess}
                        title={!hasPlusAccess ? plusTooltip : (isTimerRunning ? 'Pause Timer' : 'Start Timer')}
                        style={{
                            background: isDark 
                                ? (isTimerRunning ? 'rgba(56, 189, 248, 0.18)' : 'rgba(34, 197, 94, 0.18)')
                                : (isTimerRunning ? 'rgba(2, 132, 199, 0.15)' : 'rgba(22, 163, 74, 0.12)'),
                            border: isDark 
                                ? (isTimerRunning ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)')
                                : (isTimerRunning ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(22, 163, 74, 0.3)'),
                            borderRadius: 4,
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: !hasPlusAccess ? 'not-allowed' : 'pointer',
                            color: isDark ? (isTimerRunning ? '#38BDF8' : '#22C55E') : (isTimerRunning ? '#0284C7' : '#16A34A'),
                            padding: 0,
                            marginLeft: 2,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {isTimerRunning ? (
                            <Pause size={11} fill="currentColor" />
                        ) : (
                            <Play size={11} fill="currentColor" />
                        )}
                    </button>
                </div>

                {/* Shortcuts Trigger */}
                <div title={!hasPlusAccess ? plusTooltip : "Keyboard Shortcuts"} style={{ display: 'inline-flex' }}>
                    <button
                        onClick={hasPlusAccess ? onOpenShortcuts : onPlusAction}
                        disabled={!hasPlusAccess}
                        title={!hasPlusAccess ? plusTooltip : "Keyboard Shortcuts"}
                        style={{
                            background: isDark ? '#111111' : '#FFFFFF',
                            border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                            color: isDark ? '#858585' : '#6B7280',
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: !hasPlusAccess ? 'not-allowed' : 'pointer',
                            opacity: !hasPlusAccess ? 0.5 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (hasPlusAccess) e.currentTarget.style.color = isDark ? '#FFFFFF' : '#111827';
                        }}
                        onMouseLeave={(e) => {
                            if (hasPlusAccess) e.currentTarget.style.color = isDark ? '#858585' : '#6B7280';
                        }}
                    >
                        <Keyboard size={14} />
                    </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    style={{
                        background: isDark ? '#111111' : '#FFFFFF',
                        border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                        color: isDark ? '#858585' : '#6B7280',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#FFFFFF' : '#111827'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#858585' : '#6B7280'}
                >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Run Action with Ctrl+' shortcut & loading state */}
                <div 
                    title={!hasPlusAccess ? plusTooltip : (!isAuthenticated ? "Sign in to run code" : "Run (Ctrl + ')")}
                    style={{ display: 'inline-flex' }}
                >
                    <button
                        onClick={hasPlusAccess ? onRunCode : onPlusAction}
                        disabled={!hasPlusAccess || isRunning || isSubmitting}
                        title={!hasPlusAccess ? plusTooltip : "Run (Ctrl + ')"}
                        onMouseEnter={() => setIsRunHovered(true)}
                        onMouseLeave={() => setIsRunHovered(false)}
                        style={{
                            background: isDark 
                                ? (isRunHovered && hasPlusAccess ? '#1C1C1C' : '#111111')
                                : (isRunHovered && hasPlusAccess ? '#F0FDF4' : '#FFFFFF'),
                            border: isDark 
                                ? (isRunHovered && hasPlusAccess ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid #333333')
                                : (isRunHovered && hasPlusAccess ? '1px solid rgba(22, 163, 74, 0.4)' : '1px solid #D1D5DB'),
                            color: !hasPlusAccess ? (isDark ? '#71717A' : '#9CA3AF') : (isDark ? '#FFFFFF' : '#111827'),
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '6px 14px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: !hasPlusAccess ? 'not-allowed' : (isRunning ? 'wait' : 'pointer'),
                            opacity: !hasPlusAccess ? 0.45 : (isRunning ? 0.7 : 1),
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {isRunning ? (
                            <Loader2 size={13} className="animate-spin" color={isDark ? "#22C55E" : "#16A34A"} />
                        ) : (
                            <Play size={12} fill={!hasPlusAccess ? (isDark ? "#52525B" : "#9CA3AF") : (isDark ? "#22C55E" : "#16A34A")} color={!hasPlusAccess ? (isDark ? "#52525B" : "#9CA3AF") : (isDark ? "#22C55E" : "#16A34A")} />
                        )}
                        <span>{isRunning ? 'Evaluating...' : "Run (Ctrl + ')"}</span>
                    </button>
                </div>

                {/* Submit Action: Modern Gradient Send CTA with Ctrl+Enter shortcut */}
                <div 
                    title={!hasPlusAccess ? plusTooltip : (!isAuthenticated ? "Sign in to submit solution" : 'Submit Solution (Ctrl + Enter)')}
                    style={{ display: 'inline-flex' }}
                >
                    <button
                        onClick={hasPlusAccess ? onSubmitCode : onPlusAction}
                        disabled={!hasPlusAccess || isRunning || isSubmitting}
                        title={!hasPlusAccess ? plusTooltip : 'Submit Solution (Ctrl + Enter)'}
                        style={{
                            background: !hasPlusAccess
                                ? (isDark ? '#27272A' : '#E5E7EB')
                                : (isSubmitting
                                    ? (isDark ? '#4C1D95' : '#6D28D9')
                                    : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'),
                            border: !hasPlusAccess
                                ? (isDark ? '1px solid #3F3F46' : '1px solid #D1D5DB')
                                : '1px solid rgba(139, 92, 246, 0.4)',
                            color: !hasPlusAccess ? (isDark ? '#71717A' : '#9CA3AF') : '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 16px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: !hasPlusAccess ? 'not-allowed' : (isSubmitting ? 'wait' : 'pointer'),
                            opacity: !hasPlusAccess ? 0.5 : (isSubmitting ? 0.75 : 1),
                            boxShadow: !hasPlusAccess ? 'none' : (isDark ? '0 2px 10px rgba(124, 58, 237, 0.35)' : '0 2px 8px rgba(124, 58, 237, 0.25)'),
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {isSubmitting ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Send size={13} />
                        )}
                        <span>{isSubmitting ? 'Submitting...' : 'Submit (Ctrl + Enter)'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default PlaygroundHeader;
