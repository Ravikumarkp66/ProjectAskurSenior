import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
    Folder, FileText, BookOpen, Users, UserCheck, MessageSquare, Building2, 
    Star, GraduationCap, MapPin, Search, ShoppingBag, Calculator, TrendingUp, 
    Award, BarChart3, Target, Sparkles, PenTool, Cpu, Database, Layers, 
    Brain, Bot, Rocket, ShieldCheck, CheckCircle2, Lock, AlertTriangle, 
    TrendingDown, GitBranch, Calendar, Clock, LayoutGrid, Compass, Video, 
    Flame, CheckSquare, Trophy, Crown, Tag, Package, AlertCircle, BarChart2,
    Shield, ListChecks, Radio, Key, Book, ShieldAlert, FileSpreadsheet, ArrowRight
} from 'lucide-react';

/* Custom Atom SVG Icon for Physics / 1st Year */
const AtomIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(90 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(150 12 12)" />
    </svg>
);

/* MAP SVGs PRESETS mapping icon key to 3-5 SVG element scene */
const SCENE_PRESETS = {
    materials: {
        accent: '#8B5CF6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-22px, -8px) rotate(-8deg)', opacity: isDark ? 0.5 : 0.65 }}>
                    <BookOpen size={36} color={accent} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(24px, -14px) rotate(12deg)', opacity: isDark ? 0.7 : 0.85 }}>
                    <FileText size={38} color={isDark ? '#C4B5FD' : '#7C3AED'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.4))' : 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.25))' }}>
                    <Folder size={56} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.12)'} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 20px)', opacity: 0.9 }}>
                    <Sparkles size={20} color={isDark ? '#DDD6FE' : '#8B5CF6'} strokeWidth={2} />
                </div>
            </>
        )
    },
    interviews: {
        accent: '#A78BFA',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(167, 139, 250, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: isDark ? 0.4 : 0.55 }}>
                    <Building2 size={40} color="#7C3AED" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, -18px)', opacity: 0.85 }}>
                    <MessageSquare size={34} color={isDark ? accent : '#7C3AED'} strokeWidth={1.8} fill={isDark ? 'rgba(167, 139, 250, 0.2)' : 'rgba(124, 58, 237, 0.12)'} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(167, 139, 250, 0.4))' : 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.22))' }}>
                    <UserCheck size={54} color={isDark ? '#EDE9FE' : '#6D28D9'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(-24px, 22px)', opacity: 0.75 }}>
                    <FileText size={24} color={isDark ? accent : '#7C3AED'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    faculty: {
        accent: '#818CF8',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(129, 140, 248, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -16px) rotate(-15deg)', opacity: 0.85 }}>
                    <Star size={24} color="#FBBF24" fill="#FBBF24" strokeWidth={1.5} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -18px) rotate(15deg)', opacity: 0.85 }}>
                    <Star size={28} color="#FBBF24" fill="#FBBF24" strokeWidth={1.5} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(129, 140, 248, 0.4))' : 'drop-shadow(0 6px 14px rgba(99, 102, 241, 0.25))' }}>
                    <GraduationCap size={56} color={isDark ? accent : '#6366F1'} strokeWidth={1.8} fill={isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.12)'} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(0px, 26px)', opacity: 0.95 }}>
                    <MessageSquare size={26} color={isDark ? '#C7D2FE' : '#4F46E5'} strokeWidth={1.8} fill={isDark ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.12)'} />
                </div>
            </>
        )
    },
    campusMap: {
        accent: '#3B82F6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-24px, -10px)', opacity: isDark ? 0.5 : 0.65 }}>
                    <Building2 size={42} color={isDark ? '#1D4ED8' : '#2563EB'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, 14px)', opacity: isDark ? 0.75 : 0.9 }}>
                    <Compass size={32} color={isDark ? '#93C5FD' : '#1D4ED8'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.25))' }}>
                    <MapPin size={56} color={isDark ? accent : '#2563EB'} strokeWidth={1.8} fill={isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.12)'} />
                </div>
            </>
        )
    },
    lostFound: {
        accent: '#F97316',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(249, 115, 22, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.6 }}>
                    <Package size={40} color="#EA580C" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(24px, -16px)', opacity: 0.9 }}>
                    <AlertCircle size={26} color={isDark ? '#FDBA74' : '#EA580C'} strokeWidth={2} fill={isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(234, 88, 12, 0.12)'} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(249, 115, 22, 0.4))' : 'drop-shadow(0 6px 14px rgba(234, 88, 12, 0.25))' }}>
                    <Search size={54} color={isDark ? accent : '#C2410C'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    marketplace: {
        accent: '#10B981',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-26px, -14px) rotate(-10deg)', opacity: isDark ? 0.75 : 0.85 }}>
                    <Tag size={32} color={isDark ? '#A7F3D0' : '#059669'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.65 }}>
                    <Package size={34} color="#059669" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.4))' : 'drop-shadow(0 6px 14px rgba(5, 150, 105, 0.25))' }}>
                    <ShoppingBag size={54} color={isDark ? accent : '#059669'} strokeWidth={1.8} fill={isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)'} />
                </div>
            </>
        )
    },
    cgpaCalculator: {
        accent: '#8B5CF6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: isDark ? 0.75 : 0.85 }}>
                    <GraduationCap size={36} color={isDark ? '#C4B5FD' : '#7C3AED'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -10px)', opacity: isDark ? 0.85 : 0.95 }}>
                    <TrendingUp size={34} color={isDark ? '#A78BFA' : '#6D28D9'} strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.4))' : 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.25))' }}>
                    <Calculator size={54} color={isDark ? accent : '#7C3AED'} strokeWidth={1.8} fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.12)'} />
                </div>
            </>
        )
    },
    sgpaCalculator: {
        accent: '#10B981',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: isDark ? 0.75 : 0.85 }}>
                    <BarChart3 size={38} color={isDark ? '#6EE7B7' : '#059669'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 14px)', opacity: 0.85 }}>
                    <Target size={30} color={isDark ? accent : '#047857'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.4))' : 'drop-shadow(0 6px 14px rgba(5, 150, 105, 0.25))' }}>
                    <Calculator size={54} color={isDark ? accent : '#059669'} strokeWidth={1.8} fill={isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)'} />
                </div>
            </>
        )
    },
    blogs: {
        accent: '#14B8A6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(20, 184, 166, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-26px, -14px) rotate(-10deg)', opacity: 0.7 }}>
                    <PenTool size={32} color={isDark ? '#99F6E4' : '#0D9488'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color={isDark ? '#5EEAD4' : '#0F766E'} strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(20, 184, 166, 0.4))' : 'drop-shadow(0 6px 14px rgba(13, 148, 136, 0.25))' }}>
                    <BookOpen size={54} color={isDark ? accent : '#0D9488'} strokeWidth={1.8} fill={isDark ? 'rgba(20, 184, 166, 0.2)' : 'rgba(13, 148, 136, 0.12)'} />
                </div>
            </>
        )
    },
    year1: {
        accent: '#8B5CF6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: isDark ? 0.75 : 0.85 }}>
                    <BookOpen size={34} color={isDark ? '#C4B5FD' : '#7C3AED'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, 14px)', opacity: 0.85 }}>
                    <Sparkles size={26} color={isDark ? '#DDD6FE' : '#8B5CF6'} strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.45))' : 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.25))' }}>
                    <AtomIcon size={56} color={isDark ? accent : '#7C3AED'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year2: {
        accent: '#A855F7',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.7 }}>
                    <Database size={34} color={isDark ? '#E9D5FF' : '#9333EA'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.75 }}>
                    <Layers size={32} color={isDark ? '#C084FC' : '#7E22CE'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(168, 85, 247, 0.45))' : 'drop-shadow(0 6px 14px rgba(168, 85, 247, 0.25))' }}>
                    <Cpu size={56} color={isDark ? accent : '#9333EA'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year3: {
        accent: '#6366F1',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -14px)', opacity: 0.8 }}>
                    <Bot size={34} color={isDark ? '#C7D2FE' : '#4F46E5'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color={isDark ? '#818CF8' : '#4338CA'} strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.45))' : 'drop-shadow(0 6px 14px rgba(99, 102, 241, 0.25))' }}>
                    <Brain size={56} color={isDark ? accent : '#4F46E5'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year4: {
        accent: '#D946EF',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(217, 70, 239, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, 14px)', opacity: 0.75 }}>
                    <Target size={32} color={isDark ? '#F5D0FE' : '#C026D3'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -14px)', opacity: 0.85 }}>
                    <Trophy size={32} color={isDark ? '#E879F9' : '#A21CAF'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(217, 70, 239, 0.45))' : 'drop-shadow(0 6px 14px rgba(217, 70, 239, 0.25))' }}>
                    <Rocket size={56} color={isDark ? accent : '#C026D3'} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    cieAnalyzer: {
        accent: '#F97316',
        subtitle: 'Calculate your CIE from labs, internals, quizzes, assignments & more',
        icon: Calculator,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(249, 115, 22, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const cardFill = isDark ? '#1C0E07' : '#FFFFFF';
            const cardStroke = isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.22)';
            const labelFill = isDark ? '#FDBA74' : '#EA580C';
            const valFill = isDark ? '#FFFFFF' : '#0F172A';
            const subScoreFill = isDark ? '#FDBA74' : '#EA580C';
            const calcBg = isDark ? 'url(#cieGrad)' : '#FFFFFF';
            const screenBg = isDark ? '#0D0502' : '#FFF7ED';
            const screenStroke = isDark ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.25)';
            const screenText = isDark ? '#FFEDD5' : '#EA580C';
            const keyBg = isDark ? '#3B1C0A' : '#FFEDD5';
            const keyStroke = isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.2)';
            const rightCardBg = isDark ? '#1A0A04' : '#FFFFFF';
            const rightCardStroke = isDark ? 'rgba(249,115,22,0.7)' : 'rgba(249,115,22,0.3)';
            const filterEffect = isDark ? 'url(#cieGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="cieGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="cieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2E1408" />
                            <stop offset="100%" stopColor="#140904" />
                        </linearGradient>
                        <marker id="cieArrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F97316" />
                        </marker>
                    </defs>

                    {/* Top 4 Category Cards */}
                    <g transform="translate(15, 20)">
                        {/* Lab */}
                        <g transform="translate(0, 0)">
                            <rect width="112" height="68" rx="14" fill={cardFill} stroke={cardStroke} strokeWidth="1.5" />
                            <text x="56" y="24" textAnchor="middle" fill={labelFill} fontSize="12" fontWeight="700">Lab</text>
                            <text x="56" y="52" textAnchor="middle" fill={valFill} fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">18<tspan fontSize="12" fill={subScoreFill}>/20</tspan></text>
                        </g>
                        {/* Internals */}
                        <g transform="translate(130, 0)">
                            <rect width="112" height="68" rx="14" fill={cardFill} stroke={cardStroke} strokeWidth="1.5" />
                            <text x="56" y="24" textAnchor="middle" fill={labelFill} fontSize="12" fontWeight="700">Internals</text>
                            <text x="56" y="52" textAnchor="middle" fill={valFill} fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">17<tspan fontSize="12" fill={subScoreFill}>/20</tspan></text>
                        </g>
                        {/* Quizzes */}
                        <g transform="translate(260, 0)">
                            <rect width="112" height="68" rx="14" fill={cardFill} stroke={cardStroke} strokeWidth="1.5" />
                            <text x="56" y="24" textAnchor="middle" fill={labelFill} fontSize="12" fontWeight="700">Quizzes</text>
                            <text x="56" y="52" textAnchor="middle" fill={valFill} fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">16<tspan fontSize="12" fill={subScoreFill}>/20</tspan></text>
                        </g>
                        {/* Assignments */}
                        <g transform="translate(390, 0)">
                            <rect width="112" height="68" rx="14" fill={cardFill} stroke={cardStroke} strokeWidth="1.5" />
                            <text x="56" y="24" textAnchor="middle" fill={labelFill} fontSize="12" fontWeight="700">Assignments</text>
                            <text x="56" y="52" textAnchor="middle" fill={valFill} fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">19<tspan fontSize="12" fill={subScoreFill}>/20</tspan></text>
                        </g>
                    </g>

                    {/* Dotted Flow Connectors with Arrowheads */}
                    <g opacity="0.85" stroke="#FB923C" strokeWidth="2.5">
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 70 88 C 70 120, 200 130, 210 148" markerEnd="url(#cieArrowHead)" />
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 200 88 C 200 120, 220 130, 225 148" markerEnd="url(#cieArrowHead)" />
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 330 88 C 330 120, 260 130, 255 148" markerEnd="url(#cieArrowHead)" />
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 460 88 C 460 120, 280 130, 270 148" markerEnd="url(#cieArrowHead)" />
                    </g>

                    {/* Center Calculator Console */}
                    <g transform="translate(180, 125)">
                        <rect width="120" height="135" rx="18" fill={calcBg} stroke="#F97316" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        {/* Display Screen */}
                        <rect x="15" y="15" width="90" height="32" rx="8" fill={screenBg} stroke={screenStroke} strokeWidth="1.2" />
                        <text x="60" y="37" textAnchor="middle" fill={screenText} fontSize="15" fontWeight="900" letterSpacing="2">CIE</text>
                        {/* 3x3 Keypad Grid */}
                        {[0, 1, 2].map(r => [0, 1, 2].map(c => (
                            <rect key={`${r}-${c}`} x={22 + c * 28} y={60 + r * 20} width="20" height="14" rx="4" fill={keyBg} stroke={keyStroke} strokeWidth="1" />
                        )))}
                    </g>

                    {/* Arrow pointing right */}
                    <g transform="translate(305, 185)" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round">
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="0" y1="0" x2="52" y2="0" markerEnd="url(#cieArrowHead)" />
                    </g>

                    {/* Right CIE Score Card */}
                    <g transform="translate(365, 140)">
                        <rect width="155" height="105" rx="18" fill={rightCardBg} stroke={rightCardStroke} strokeWidth={isDark ? 2 : 1.8} filter={filterEffect} />
                        <text x="77" y="32" textAnchor="middle" fill={labelFill} fontSize="12" fontWeight="800" letterSpacing="1.5">CIE SCORE</text>
                        <text x="77" y="70" textAnchor="middle" fill={valFill} fontSize="34" fontWeight="900" fontFamily="Outfit, sans-serif">42<tspan fontSize="20" fill={subScoreFill}>/50</tspan></text>
                        <line x1="30" y1="86" x2="125" y2="86" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                    </g>
                </svg>
            );
        }
    },
    eligibilityChecker: {
        accent: '#10B981',
        subtitle: 'Check if you are eligible to appear for the semester exams',
        icon: ShieldCheck,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const tileFill = isDark ? '#071912' : '#FFFFFF';
            const tileStroke = isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.22)';
            const iconBoxBg = isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)';
            const iconStroke = isDark ? '#34D399' : '#059669';
            const iconInner = isDark ? '#A7F3D0' : '#059669';
            const tileTitle = isDark ? '#FFFFFF' : '#0F172A';
            const tileSub = isDark ? '#6EE7B7' : '#059669';
            const checkBg = isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.12)';
            const checkBorder = '#10B981';
            const checkMark = isDark ? '#34D399' : '#059669';
            const pedOuter = isDark ? '#042014' : 'rgba(16, 185, 129, 0.08)';
            const pedOuterStroke = isDark ? '#10B981' : 'rgba(16, 185, 129, 0.2)';
            const pedInner = isDark ? '#052E1D' : 'rgba(16, 185, 129, 0.12)';
            const pedInnerStroke = isDark ? '#34D399' : 'rgba(16, 185, 129, 0.35)';
            const shieldBg = isDark ? 'url(#elgShieldGrad)' : '#ECFDF5';
            const shieldBorder = '#10B981';
            const shieldInner = isDark ? '#34D399' : 'rgba(16,185,129,0.4)';
            const shieldCheck = isDark ? '#6EE7B7' : '#059669';
            const elgText = isDark ? '#6EE7B7' : '#059669';
            const filterEffect = isDark ? 'url(#elgGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="elgGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="elgShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0B3021" />
                            <stop offset="100%" stopColor="#04140D" />
                        </linearGradient>
                        <marker id="elgArrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#34D399" />
                        </marker>
                    </defs>

                    {/* 3 Left Stacked Tiles */}
                    <g transform="translate(20, 20)">
                        {/* Tile 1: Attendance */}
                        <g transform="translate(0, 0)">
                            <rect width="260" height="70" rx="14" fill={tileFill} stroke={tileStroke} strokeWidth="1.5" />
                            <rect x="16" y="16" width="38" height="38" rx="10" fill={iconBoxBg} stroke={iconStroke} strokeWidth="1.2" />
                            <path d="M 28 26 H 42 M 28 34 H 42 M 28 42 H 36" stroke={iconInner} strokeWidth="2.2" strokeLinecap="round" />
                            <text x="66" y="36" fill={tileTitle} fontSize="14" fontWeight="800">Attendance</text>
                            <text x="66" y="52" fill={tileSub} fontSize="11" fontWeight="600">85% and above</text>
                            <circle cx="225" cy="35" r="13" fill={checkBg} stroke={checkBorder} strokeWidth="1.8" />
                            <path d="M 219 35 L 223 39 L 231 31" stroke={checkMark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Tile 2: CIE Marks */}
                        <g transform="translate(0, 84)">
                            <rect width="260" height="70" rx="14" fill={tileFill} stroke={tileStroke} strokeWidth="1.5" />
                            <rect x="16" y="16" width="38" height="38" rx="10" fill={iconBoxBg} stroke={iconStroke} strokeWidth="1.2" />
                            <path d="M 25 44 V 34 M 35 44 V 26 M 45 44 V 20" stroke={iconInner} strokeWidth="3" strokeLinecap="round" />
                            <text x="66" y="36" fill={tileTitle} fontSize="14" fontWeight="800">CIE Marks</text>
                            <text x="66" y="52" fill={tileSub} fontSize="11" fontWeight="600">Minimum required</text>
                            <circle cx="225" cy="35" r="13" fill={checkBg} stroke={checkBorder} strokeWidth="1.8" />
                            <path d="M 219 35 L 223 39 L 231 31" stroke={checkMark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Tile 3: Credits Earned */}
                        <g transform="translate(0, 168)">
                            <rect width="260" height="70" rx="14" fill={tileFill} stroke={tileStroke} strokeWidth="1.5" />
                            <rect x="16" y="16" width="38" height="38" rx="10" fill={iconBoxBg} stroke={iconStroke} strokeWidth="1.2" />
                            <path d="M 23 32 L 35 25 L 47 32 L 35 39 Z" stroke={iconInner} strokeWidth="2" fill="none" />
                            <text x="66" y="36" fill={tileTitle} fontSize="14" fontWeight="800">Credits Earned</text>
                            <text x="66" y="52" fill={tileSub} fontSize="11" fontWeight="600">No backlog</text>
                            <circle cx="225" cy="35" r="13" fill={checkBg} stroke={checkBorder} strokeWidth="1.8" />
                            <path d="M 219 35 L 223 39 L 231 31" stroke={checkMark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>

                    {/* Dotted Flow Connectors with Arrowheads */}
                    <g stroke="#34D399" strokeWidth="2.5" opacity="0.85">
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 55 C 330 55, 340 125, 385 125" markerEnd="url(#elgArrowHead)" />
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 139 L 385 139" markerEnd="url(#elgArrowHead)" />
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 223 C 330 223, 340 150, 385 150" markerEnd="url(#elgArrowHead)" />
                    </g>

                    {/* Right Shield & Pedestal */}
                    <g transform="translate(440, 125)">
                        <ellipse cx="0" cy="100" rx="75" ry="24" fill={pedOuter} stroke={pedOuterStroke} strokeWidth="2" filter={filterEffect} />
                        <ellipse cx="0" cy="100" rx="55" ry="16" fill={pedInner} stroke={pedInnerStroke} strokeWidth="2" />

                        <g transform="translate(0, 5)">
                            <path d="M 0 -70 C 45 -70, 50 -55, 50 0 C 50 45, 20 65, 0 78 C -20 65, -50 45, -50 0 C -50 -55, -45 -70, 0 -70 Z" fill={shieldBg} stroke={shieldBorder} strokeWidth={isDark ? 3.5 : 2.5} filter={filterEffect} />
                            <path d="M 0 -60 C 38 -60, 42 -47, 42 0 C 42 38, 17 55, 0 66 C -17 55, -42 38, -42 0 C -42 -47, -38 -60, 0 -60 Z" fill="none" stroke={shieldInner} strokeWidth="1.8" opacity="0.75" />
                            <path d="M -16 0 L -4 14 L 20 -12" stroke={shieldCheck} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        <text x="0" y="125" textAnchor="middle" fill={elgText} fontSize="16" fontWeight="900" letterSpacing="3" fontFamily="Outfit, sans-serif">ELIGIBLE</text>
                    </g>
                </svg>
            );
        }
    },
    yearbackPredictor: {
        accent: '#8B5CF6',
        subtitle: 'Predict if you will move to the next year based on your earned credits',
        icon: TrendingUp,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const cardBg = isDark ? '#13092B' : '#FFFFFF';
            const cardStroke = isDark ? '#8B5CF6' : 'rgba(139,92,246,0.25)';
            const rightStroke = isDark ? 'rgba(167,139,250,0.6)' : 'rgba(139,92,246,0.25)';
            const titleColor = isDark ? '#C4B5FD' : '#7C3AED';
            const valColor = isDark ? '#FFFFFF' : '#0F172A';
            const subColor = isDark ? '#A78BFA' : '#7C3AED';
            const barEmpty = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.08)';
            const filterEffect = isDark ? 'url(#ybGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="ybGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="ybBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7C3AED" />
                            <stop offset="100%" stopColor="#C084FC" />
                        </linearGradient>
                        <marker id="ybArrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#C084FC" />
                        </marker>
                    </defs>

                    {/* Left Glass Card */}
                    <g transform="translate(25, 45)">
                        <rect width="180" height="190" rx="20" fill={cardBg} stroke={cardStroke} strokeWidth={isDark ? 2 : 1.5} filter={filterEffect} />
                        <g transform="translate(20, 22)">
                            <rect width="32" height="32" rx="8" fill={isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.1)'} stroke="#C4B5FD" strokeWidth="1.2" />
                            <path d="M 9 16 L 16 10 L 23 16 M 9 22 L 16 16 L 23 22" stroke={isDark ? '#E9D5FF' : '#7C3AED'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="42" y="21" fill={titleColor} fontSize="13" fontWeight="800">Credits Earned</text>
                        </g>

                        <text x="90" y="112" textAnchor="middle" fill={valColor} fontSize="42" fontWeight="900" fontFamily="Outfit, sans-serif">36<tspan fontSize="24" fill={titleColor}>/40</tspan></text>
                        <rect x="20" y="130" width="140" height="10" rx="5" fill={barEmpty} />
                        <rect x="20" y="130" width="126" height="10" rx="5" fill="url(#ybBarGrad)" />
                        <text x="90" y="166" textAnchor="middle" fill={subColor} fontSize="11" fontWeight="700">Minimum Required: 32</text>
                    </g>

                    {/* Center Ascending Growth Curve with Flow Arrow */}
                    <g transform="translate(215, 75)">
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 0 65 L 36 65" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#ybArrowHead)" />
                        
                        <rect x="45" y="90" width="22" height="40" rx="5" fill={isDark ? '#2A1454' : '#F3E8FF'} stroke="#7C3AED" strokeWidth="1.5" />
                        <rect x="73" y="70" width="22" height="60" rx="5" fill={isDark ? '#3B1C78' : '#E9D5FF'} stroke="#8B5CF6" strokeWidth="1.5" />
                        <rect x="101" y="45" width="22" height="85" rx="5" fill={isDark ? '#4C1D95' : '#DDD6FE'} stroke="#A78BFA" strokeWidth="1.5" />

                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 35 110 C 65 95, 80 40, 138 10" stroke="#C084FC" strokeWidth={isDark ? 5 : 4} strokeLinecap="round" fill="none" filter={filterEffect} markerEnd="url(#ybArrowHead)" />
                    </g>

                    {/* Right Promotion Badge */}
                    <g transform="translate(365, 45)">
                        <rect width="150" height="190" rx="20" fill={cardBg} stroke={rightStroke} strokeWidth={isDark ? 2 : 1.5} filter={filterEffect} />
                        {[-40, -20, 0, 20, 40].map((dx, i) => (
                            <rect key={i} x={75 + dx} y="-6" width="6" height="16" rx="3" fill="#A78BFA" />
                        ))}

                        <text x="75" y="55" textAnchor="middle" fill={titleColor} fontSize="13" fontWeight="800">Promoted to</text>
                        <text x="75" y="105" textAnchor="middle" fill={valColor} fontSize="26" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="1">YEAR 2</text>

                        <circle cx="120" cy="148" r="18" fill={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.12)'} stroke="#A78BFA" strokeWidth="2" />
                        <path d="M 111 148 L 117 154 L 129 142" stroke={isDark ? '#EDE9FE' : '#7C3AED'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </svg>
            );
        }
    },
    branchChange: {
        accent: '#3B82F6',
        subtitle: 'Predict your chances of branch change based on CGPA & merit',
        icon: GitBranch,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const cardBg = isDark ? '#0A1438' : '#FFFFFF';
            const cardStroke = isDark ? '#3B82F6' : 'rgba(59,130,246,0.25)';
            const rightCardStroke = isDark ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.25)';
            const titleColor = isDark ? '#93C5FD' : '#2563EB';
            const subLabelColor = isDark ? '#93C5FD' : '#64748B';
            const valColor = isDark ? '#FFFFFF' : '#0F172A';
            const chartLine = isDark ? '#60A5FA' : '#3B82F6';
            const chartDot = isDark ? '#3B82F6' : '#2563EB';
            const bullseyeOuter = isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)';
            const bullseyeRing = isDark ? '#60A5FA' : '#3B82F6';
            const bullseyeCenter = '#2563EB';
            const rankTitle = isDark ? '#93C5FD' : '#2563EB';
            const rankVal = isDark ? '#60A5FA' : '#1D4ED8';
            const currentBranchBg = isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF';
            const currentBranchStroke = isDark ? 'rgba(96,165,250,0.4)' : 'rgba(59,130,246,0.25)';
            const currentBranchText = isDark ? '#BFDBFE' : '#1E40AF';
            const predBranchBg = isDark ? '#1D4ED8' : '#2563EB';
            const predBranchStroke = isDark ? '#60A5FA' : '#1D4ED8';
            const predBranchText = '#FFFFFF';
            const filterEffect = isDark ? 'url(#bcGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="bcGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <marker id="bcArrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#60A5FA" />
                        </marker>
                    </defs>

                    {/* Left CGPA Card */}
                    <g transform="translate(25, 45)">
                        <rect width="165" height="190" rx="20" fill={cardBg} stroke={cardStroke} strokeWidth={isDark ? 2 : 1.5} filter={filterEffect} />
                        <text x="82" y="38" textAnchor="middle" fill={titleColor} fontSize="13" fontWeight="800">Your CGPA</text>
                        <text x="82" y="92" textAnchor="middle" fill={valColor} fontSize="42" fontWeight="900" fontFamily="Outfit, sans-serif">9.25</text>

                        <path d="M 25 155 L 55 135 L 85 145 L 115 115 L 140 128" stroke={chartLine} strokeWidth="3" strokeLinecap="round" fill="none" />
                        {[[25,155],[55,135],[85,145],[115,115],[140,128]].map(([cx,cy], i) => (
                            <circle key={i} cx={cx} cy={cy} r="4" fill={chartDot} stroke="#FFFFFF" strokeWidth="1.5" />
                        ))}
                    </g>

                    {/* Center Target Bullseye with Arrow Flow Lines */}
                    <g transform="translate(270, 140)">
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="-75" y1="0" x2="-48" y2="0" stroke="#60A5FA" strokeWidth="2.5" markerEnd="url(#bcArrowHead)" />
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="48" y1="0" x2="78" y2="0" stroke="#60A5FA" strokeWidth="2.5" markerEnd="url(#bcArrowHead)" />

                        <circle cx="0" cy="0" r="42" fill={bullseyeOuter} stroke="#3B82F6" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <circle cx="0" cy="0" r="28" fill="none" stroke={bullseyeRing} strokeWidth="2" />
                        <circle cx="0" cy="0" r="14" fill={bullseyeCenter} />
                        <path d="M -18 -18 L -4 -4 M 18 -18 L 4 -4" stroke={isDark ? '#93C5FD' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" />

                        <text x="0" y="-54" textAnchor="middle" fill={rankTitle} fontSize="12" fontWeight="700">Merit Rank</text>
                        <text x="0" y="66" textAnchor="middle" fill={rankVal} fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">Top 15%</text>
                    </g>

                    {/* Right Branch Transition Card */}
                    <g transform="translate(355, 45)">
                        <rect width="160" height="190" rx="20" fill={cardBg} stroke={rightCardStroke} strokeWidth={isDark ? 2 : 1.5} filter={filterEffect} />
                        
                        <text x="80" y="32" textAnchor="middle" fill={subLabelColor} fontSize="11" fontWeight="700">Current Branch</text>
                        <rect x="30" y="42" width="100" height="34" rx="10" fill={currentBranchBg} stroke={currentBranchStroke} strokeWidth="1" />
                        <text x="80" y="65" textAnchor="middle" fill={currentBranchText} fontSize="18" fontWeight="900" letterSpacing="1">ISE</text>

                        {/* Down Arrow Flow */}
                        <g transform="translate(80, 95)" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round">
                            <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="0" y1="-8" x2="0" y2="12" markerEnd="url(#bcArrowHead)" />
                        </g>

                        <text x="80" y="125" textAnchor="middle" fill={titleColor} fontSize="11" fontWeight="700">Predicted Branch</text>
                        <rect x="25" y="135" width="110" height="38" rx="10" fill={predBranchBg} stroke={predBranchStroke} strokeWidth={isDark ? 2 : 1.5} filter={filterEffect} />
                        <text x="80" y="160" textAnchor="middle" fill={predBranchText} fontSize="20" fontWeight="900" letterSpacing="1">CSE</text>
                    </g>
                </svg>
            );
        }
    },
    attendance: {
        accent: '#3B82F6',
        subtitle: 'Track your attendance percentage in each subject in real-time',
        icon: Calendar,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBaseFill = isDark ? '#040D24' : 'rgba(59, 130, 246, 0.08)';
            const pedBaseStroke = isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59, 130, 246, 0.2)';
            const pedInnerStroke = isDark ? '#60A5FA' : 'rgba(59, 130, 246, 0.35)';
            const clockBg = isDark ? '#0A1633' : '#FFFFFF';
            const clockInner = isDark ? '#60A5FA' : 'rgba(59, 130, 246, 0.25)';
            const clockHands = isDark ? '#93C5FD' : '#2563EB';
            const calBg = isDark ? 'url(#attGrad)' : '#FFFFFF';
            const calRing = isDark ? '#60A5FA' : '#3B82F6';
            const checkBg = isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)';
            const checkStroke = isDark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.25)';
            const checkMark = isDark ? '#60A5FA' : '#2563EB';
            const avatarBg = isDark ? '#0A183C' : '#FFFFFF';
            const avatarStroke = isDark ? '#60A5FA' : '#3B82F6';
            const avatarIcon = isDark ? '#93C5FD' : '#2563EB';
            const sparkleColor = isDark ? '#93C5FD' : '#3B82F6';
            const filterEffect = isDark ? 'url(#attGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="attGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="attGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0B1A3A" />
                            <stop offset="100%" stopColor="#040B1A" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="140" ry="25" fill={pedBaseFill} stroke={pedBaseStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke={pedInnerStroke} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* Left Wall Clock */}
                    <g transform="translate(130, 110)">
                        <circle cx="0" cy="0" r="46" fill={clockBg} stroke="#3B82F6" strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        <circle cx="0" cy="0" r="38" fill="none" stroke={clockInner} strokeWidth="1.5" opacity="0.6" />
                        <line x1="0" y1="0" x2="0" y2="-20" stroke={clockHands} strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="0" y1="0" x2="15" y2="0" stroke={clockHands} strokeWidth="3" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="4" fill="#60A5FA" />
                    </g>

                    {/* Main 3D Calendar Card */}
                    <g transform="translate(190, 45)">
                        <rect width="180" height="150" rx="20" fill={calBg} stroke="#3B82F6" strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        {/* Top Rings */}
                        <rect x="40" y="-8" width="10" height="20" rx="5" fill={calRing} />
                        <rect x="130" y="-8" width="10" height="20" rx="5" fill={calRing} />

                        {/* 2x3 Grid of Checkmarks */}
                        {[0, 1].map(r => [0, 1, 2].map(c => (
                            <g key={`${r}-${c}`} transform={`translate(${22 + c * 48}, ${35 + r * 48})`}>
                                <rect width="40" height="36" rx="8" fill={checkBg} stroke={checkStroke} strokeWidth="1.5" />
                                <path d="M 11 18 L 17 24 L 29 11" stroke={checkMark} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                        )))}
                    </g>

                    {/* Bottom Right User Avatar Badge */}
                    <g transform="translate(390, 160)">
                        <circle cx="0" cy="0" r="32" fill={avatarBg} stroke={avatarStroke} strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        <circle cx="0" cy="-6" r="10" stroke={avatarIcon} strokeWidth="2.5" fill="none" />
                        <path d="M -16 18 C -16 10, -8 8, 0 8 C 8 8, 16 10, 16 18" stroke={avatarIcon} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={sparkleColor} opacity="0.8">
                        <circle cx="100" cy="70" r="2.5" />
                        <circle cx="450" cy="80" r="2.5" />
                        <circle cx="470" cy="190" r="2" />
                    </g>
                </svg>
            );
        }
    },
    todaysClasses: {
        accent: '#10B981',
        subtitle: 'View today\'s class schedule, subjects and upcoming deadlines',
        icon: Clock,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#041A10' : 'rgba(16, 185, 129, 0.08)';
            const pedStroke = isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16, 185, 129, 0.2)';
            const calBg = isDark ? 'url(#tcGrad)' : '#FFFFFF';
            const calRing = isDark ? '#34D399' : '#10B981';
            const calDots = isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.12)';
            const clockBg = isDark ? '#062417' : '#FFFFFF';
            const clockHands = isDark ? '#6EE7B7' : '#059669';
            const bellBg = isDark ? '#09301F' : '#FFFFFF';
            const bellStroke = isDark ? '#A7F3D0' : '#059669';
            const filterEffect = isDark ? 'url(#tcGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="tcGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="tcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0B3021" />
                            <stop offset="100%" stopColor="#04140D" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="140" ry="25" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke={isDark ? '#34D399' : 'rgba(16,185,129,0.3)'} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* Background Calendar Card */}
                    <g transform="translate(140, 45)">
                        <rect width="160" height="135" rx="18" fill={calBg} stroke="#10B981" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <rect x="30" y="-8" width="10" height="18" rx="5" fill={calRing} />
                        <rect x="120" y="-8" width="10" height="18" rx="5" fill={calRing} />
                        
                        {/* Calendar Dots */}
                        {[0, 1, 2].map(r => [0, 1, 2].map(c => (
                            <circle key={`${r}-${c}`} cx={35 + c * 45} cy={45 + r * 30} r="7" fill={calDots} stroke="#34D399" strokeWidth="1.5" />
                        )))}
                    </g>

                    {/* Leaning 3D Clock */}
                    <g transform="translate(340, 130)">
                        <circle cx="0" cy="0" r="52" fill={clockBg} stroke="#10B981" strokeWidth={isDark ? 3.5 : 2} filter={filterEffect} />
                        <circle cx="0" cy="0" r="42" fill="none" stroke="#34D399" strokeWidth="1.8" opacity="0.7" />
                        <line x1="0" y1="0" x2="0" y2="-22" stroke={clockHands} strokeWidth="4" strokeLinecap="round" />
                        <line x1="0" y1="0" x2="22" y2="12" stroke={clockHands} strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="4.5" fill="#34D399" />
                    </g>

                    {/* Bell Notification Badge */}
                    <g transform="translate(425, 160)">
                        <circle cx="0" cy="0" r="30" fill={bellBg} stroke="#34D399" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        {/* Bell Icon */}
                        <path d="M 0 -14 C -7 -14, -10 -8, -10 2 L -13 6 H 13 L 10 2 C 10 -8, 7 -14, 0 -14 Z" fill="none" stroke={bellStroke} strokeWidth="2.2" strokeLinejoin="round" />
                        <path d="M -4 9 C -4 12, 4 12, 4 9" stroke={bellStroke} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={isDark ? '#6EE7B7' : '#10B981'} opacity="0.8">
                        <circle cx="90" cy="80" r="2.5" />
                        <circle cx="470" cy="70" r="2" />
                        <circle cx="110" cy="180" r="2" />
                    </g>
                </svg>
            );
        }
    },
    timetable: {
        accent: '#8B5CF6',
        subtitle: 'Your personalized timetable with lectures, labs and breaks',
        icon: LayoutGrid,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#120526' : 'rgba(139, 92, 246, 0.08)';
            const pedStroke = isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139, 92, 246, 0.2)';
            const cardBg = isDark ? 'url(#ttGrad)' : '#FFFFFF';
            const cardLines = isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.18)';
            const iconStroke = isDark ? '#C4B5FD' : '#7C3AED';
            const clockBg = isDark ? '#1A0A38' : '#FFFFFF';
            const clockHands = isDark ? '#E9D5FF' : '#7C3AED';
            const filterEffect = isDark ? 'url(#ttGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="ttGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="ttGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E0B3A" />
                            <stop offset="100%" stopColor="#0B041A" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="140" ry="25" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke={isDark ? '#C084FC' : 'rgba(139,92,246,0.3)'} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* Main Schedule Grid Card */}
                    <g transform="translate(130, 40)">
                        <rect width="260" height="155" rx="20" fill={cardBg} stroke="#8B5CF6" strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        
                        {/* Grid Layout */}
                        <line x1="20" y1="80" x2="240" y2="80" stroke={cardLines} strokeWidth="1.5" />
                        <line x1="90" y1="20" x2="90" y2="135" stroke={cardLines} strokeWidth="1.5" />
                        <line x1="165" y1="20" x2="165" y2="135" stroke={cardLines} strokeWidth="1.5" />

                        {/* Book Icon (Top Left Cell) */}
                        <g transform="translate(55, 48)">
                            <path d="M -12 6 C -6 2, 0 6, 0 6 C 0 6, 6 2, 12 6 V -8 C 6 -12, 0 -8, 0 -8 C 0 -8, -6 -12, -12 -8 Z" stroke={iconStroke} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
                        </g>

                        {/* Lab Flask Icon (Center Cell) */}
                        <g transform="translate(128, 108)">
                            <path d="M -4 -12 H 4 M 0 -12 V -4 L -8 8 C -9 10, -7 12, -4 12 H 4 C 7 12, 9 10, 8 8 L 0 -4" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>

                        {/* Code Icon </> (Bottom Left Cell) */}
                        <g transform="translate(55, 108)">
                            <text x="0" y="4" textAnchor="middle" fill={iconStroke} fontSize="16" fontWeight="900" fontFamily="monospace">&lt;/&gt;</text>
                        </g>
                    </g>

                    {/* Clock Badge (Bottom Right) */}
                    <g transform="translate(390, 155)">
                        <circle cx="0" cy="0" r="32" fill={clockBg} stroke="#A78BFA" strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        <line x1="0" y1="0" x2="0" y2="-14" stroke={clockHands} strokeWidth="3" strokeLinecap="round" />
                        <line x1="0" y1="0" x2="12" y2="0" stroke={clockHands} strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="3" fill="#8B5CF6" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={isDark ? '#C4B5FD' : '#8B5CF6'} opacity="0.8">
                        <circle cx="90" cy="70" r="2.5" />
                        <circle cx="450" cy="65" r="2" />
                        <circle cx="470" cy="180" r="2.5" />
                    </g>
                </svg>
            );
        }
    },
    cgpaPlus: {
        accent: '#F59E0B',
        subtitle: 'Track your CGPA progress and semester wise performance',
        icon: Award,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#1C1002' : 'rgba(245, 158, 11, 0.08)';
            const pedStroke = isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245, 158, 11, 0.2)';
            const ribbonBg = isDark ? '#2E1C03' : '#FEF3C7';
            const ribbonBorder = isDark ? '#F59E0B' : '#D97706';
            const medalCircleBg = isDark ? 'url(#cgRibbon)' : '#FFFFFF';
            const bar1 = isDark ? '#2E1C03' : '#FEF3C7';
            const bar2 = isDark ? '#422804' : '#FDE68A';
            const bar3 = isDark ? '#5E3906' : '#FCD34D';
            const filterEffect = isDark ? 'url(#cgGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="cgGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="cgRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3A2404" />
                            <stop offset="100%" stopColor="#1C1102" />
                        </linearGradient>
                        <marker id="cgArrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FBBF24" />
                        </marker>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="140" ry="25" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke={isDark ? '#FBBF24' : 'rgba(245,158,11,0.3)'} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* 3D Gold Star Medal Ribbon Award (Left/Center) */}
                    <g transform="translate(190, 110)">
                        {/* Medal Ribbons */}
                        <path d="M -30 25 L -45 75 L -20 65 L 5 75 L -10 25 Z" fill={ribbonBg} stroke={ribbonBorder} strokeWidth="2" />
                        <path d="M 10 25 L -5 75 L 20 65 L 45 75 L 30 25 Z" fill={ribbonBg} stroke={ribbonBorder} strokeWidth="2" />

                        {/* Outer Medal Circular Badge */}
                        <circle cx="0" cy="-20" r="50" fill={medalCircleBg} stroke="#F59E0B" strokeWidth={isDark ? 4 : 2.5} filter={filterEffect} />
                        <circle cx="0" cy="-20" r="40" fill="none" stroke="#FBBF24" strokeWidth="1.8" />
                        
                        {/* Star in Center */}
                        <path d="M 0 -40 L 5 -28 L 18 -26 L 8 -17 L 11 -4 L 0 -11 L -11 -4 L -8 -17 L -18 -26 L -5 -28 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" />
                    </g>

                    {/* Ascending Growth Arrow & Bar Chart (Right) */}
                    <g transform="translate(340, 60)">
                        {/* Growth Arrow Line */}
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 0 85 L 65 30" stroke="#FBBF24" strokeWidth={4} strokeLinecap="round" filter={filterEffect} markerEnd="url(#cgArrowHead)" />

                        {/* Bar Chart Columns */}
                        <rect x="25" y="80" width="18" height="40" rx="4" fill={bar1} stroke="#F59E0B" strokeWidth="1.5" />
                        <rect x="52" y="60" width="18" height="60" rx="4" fill={bar2} stroke="#FBBF24" strokeWidth="1.5" />
                        <rect x="79" y="35" width="18" height="85" rx="4" fill={bar3} stroke="#FCD34D" strokeWidth="1.8" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill="#FBBF24" opacity="0.85">
                        <circle cx="100" cy="70" r="2.5" />
                        <circle cx="470" cy="65" r="2" />
                        <circle cx="450" cy="180" r="2.5" />
                        <circle cx="120" cy="170" r="2" />
                    </g>
                </svg>
            );
        }
    },
    roadmaps: {
        accent: '#3B82F6',
        subtitle: 'Structured roadmaps to guide you from 1st year to placement.',
        icon: Compass,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#040D24' : 'rgba(59, 130, 246, 0.08)';
            const pedStroke = isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59, 130, 246, 0.2)';
            const nodeBg = isDark ? '#0A183C' : '#FFFFFF';
            const nodeInner = isDark ? '#93C5FD' : '#2563EB';
            const filterEffect = isDark ? 'url(#rmGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="rmGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="rmRoadGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#1D4ED8" />
                            <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 235)">
                        <ellipse cx="0" cy="15" rx="110" ry="22" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="80" ry="14" fill="none" stroke={isDark ? '#60A5FA' : 'rgba(59,130,246,0.3)'} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* Winding 3D Road Highway */}
                    <g>
                        {/* Outer Highway Glow */}
                        <path d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="#2563EB" strokeWidth="18" strokeLinecap="round" fill="none" opacity={isDark ? 0.4 : 0.15} filter={filterEffect} />
                        {/* Main Highway Path */}
                        <path d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="url(#rmRoadGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
                        {/* Center Dashed Lane */}
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </g>

                    {/* Top Finish Line Flag Post */}
                    <g transform="translate(270, 28)">
                        <line x1="0" y1="0" x2="0" y2="-28" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 0 -28 L 26 -20 L 0 -12 Z" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" filter={filterEffect} />
                    </g>

                    {/* 4 Floating Circular Milestone Badges */}
                    {/* 1. Target Bullseye (Top Left) */}
                    <g transform="translate(210, 75)">
                        <circle cx="0" cy="0" r="24" fill={nodeBg} stroke="#3B82F6" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <circle cx="0" cy="0" r="16" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="8" fill="#2563EB" />
                        <path d="M -9 -9 L -2 -2" stroke={nodeInner} strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* 2. Open Book (Center Left) */}
                    <g transform="translate(180, 145)">
                        <circle cx="0" cy="0" r="24" fill={nodeBg} stroke="#3B82F6" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <path d="M -10 4 C -5 1, 0 4, 0 4 C 0 4, 5 1, 10 4 V -6 C 5 -9, 0 -6, 0 -6 C 0 -6, -5 -9, -10 -6 Z" stroke={nodeInner} strokeWidth="2" strokeLinejoin="round" fill="none" />
                    </g>

                    {/* 3. Code </> (Middle Right) */}
                    <g transform="translate(350, 115)">
                        <circle cx="0" cy="0" r="24" fill={nodeBg} stroke="#3B82F6" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <text x="0" y="5" textAnchor="middle" fill={nodeInner} fontSize="14" fontWeight="900" fontFamily="monospace">&lt;/&gt;</text>
                    </g>

                    {/* 4. User Profile (Bottom Left) */}
                    <g transform="translate(160, 205)">
                        <circle cx="0" cy="0" r="22" fill={nodeBg} stroke="#3B82F6" strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <circle cx="0" cy="-4" r="7" stroke={nodeInner} strokeWidth="2" fill="none" />
                        <path d="M -11 12 C -11 6, -5 5, 0 5 C 5 5, 11 6, 11 12" stroke={nodeInner} strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={isDark ? '#93C5FD' : '#3B82F6'} opacity="0.8">
                        <circle cx="100" cy="60" r="2" />
                        <circle cx="450" cy="70" r="2.5" />
                        <circle cx="430" cy="180" r="2" />
                    </g>
                </svg>
            );
        }
    },
    sessions: {
        accent: '#8B5CF6',
        subtitle: 'Live sessions with seniors, ask questions & learn.',
        icon: Video,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const bubbleBg = isDark ? '#1A0A38' : '#FFFFFF';
            const bubbleStroke = isDark ? '#C084FC' : 'rgba(139,92,246,0.3)';
            const dotsColor = isDark ? '#E9D5FF' : '#7C3AED';
            const mentorBg = isDark ? '#1E0B3A' : '#FFFFFF';
            const mentorStroke = isDark ? '#C084FC' : '#7C3AED';
            const cameraBg = isDark ? '#1A0A38' : '#FFFFFF';
            const cameraStroke = isDark ? '#C084FC' : 'rgba(139,92,246,0.3)';
            const playStroke = isDark ? '#E9D5FF' : '#7C3AED';
            const flowStroke = isDark ? '#A78BFA' : '#8B5CF6';
            const dotFill = isDark ? '#E9D5FF' : '#7C3AED';
            const sparkleFill = isDark ? '#C4B5FD' : '#8B5CF6';
            const filterEffect = isDark ? 'url(#seGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            .flow-arrow-line {
                                stroke-dasharray: 6 6;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .flow-arrow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                        `}</style>
                        <filter id="seGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="seGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E0B3A" />
                            <stop offset="100%" stopColor="#0B041A" />
                        </linearGradient>
                    </defs>

                    {/* Left: Chat Speech Bubble */}
                    <g transform="translate(130, 110)">
                        <rect x="-42" y="-32" width="84" height="64" rx="20" fill={bubbleBg} stroke={bubbleStroke} strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        {/* Tail */}
                        <path d="M 0 32 L -12 44 L 12 32 Z" fill={bubbleBg} stroke={bubbleStroke} strokeWidth={isDark ? 3 : 2} strokeLinejoin="round" />
                        {/* 3 Dots */}
                        <circle cx="-18" cy="0" r="4.5" fill={dotsColor} />
                        <circle cx="0" cy="0" r="4.5" fill={dotsColor} />
                        <circle cx="18" cy="0" r="4.5" fill={dotsColor} />
                    </g>

                    {/* Center: Mentor Profile Silhouette */}
                    <g transform="translate(270, 110)">
                        <circle cx="0" cy="-22" r="26" fill={mentorBg} stroke={mentorStroke} strokeWidth={isDark ? 3.5 : 2.5} filter={filterEffect} />
                        <path d="M -38 35 C -38 12, -20 8, 0 8 C 20 8, 38 12, 38 35" fill={mentorBg} stroke={mentorStroke} strokeWidth={isDark ? 3.5 : 2.5} strokeLinecap="round" filter={filterEffect} />
                    </g>

                    {/* Right: Video Camera Player */}
                    <g transform="translate(410, 110)">
                        <rect x="-38" y="-28" width="76" height="56" rx="16" fill={cameraBg} stroke={cameraStroke} strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        {/* Camera Side Lens Trapezoid */}
                        <path d="M 38 -12 L 56 -22 V 22 L 38 12 Z" fill={cameraBg} stroke={cameraStroke} strokeWidth={isDark ? 3 : 2} strokeLinejoin="round" />
                        {/* Play Icon Inside Camera */}
                        <path d="M -8 -14 L 14 0 L -8 14 Z" fill="none" stroke={playStroke} strokeWidth={2.5} strokeLinejoin="round" />
                    </g>

                    {/* Bottom Flow Connector Curve with Animated Dashes */}
                    <g>
                        <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 130 160 C 180 200, 220 205, 270 185 C 320 205, 360 200, 410 160" stroke={flowStroke} strokeWidth={2.5} strokeLinecap="round" fill="none" />
                        <circle cx="270" cy="185" r="5" fill={dotFill} filter={filterEffect} />
                        <circle cx="130" cy="160" r="4" fill={flowStroke} />
                        <circle cx="410" cy="160" r="4" fill={flowStroke} />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={sparkleFill} opacity="0.8">
                        <circle cx="90" cy="65" r="2.5" />
                        <circle cx="460" cy="60" r="2" />
                        <circle cx="470" cy="190" r="2.5" />
                        <circle cx="80" cy="190" r="2" />
                    </g>
                </svg>
            );
        }
    },
    streaks: {
        accent: '#F59E0B',
        subtitle: 'Build daily habits and keep your streak alive.',
        icon: Flame,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#1C1002' : 'rgba(245, 158, 11, 0.08)';
            const pedStroke = isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245, 158, 11, 0.2)';
            const calBg = isDark ? '#1E1204' : '#FFFFFF';
            const calStroke = isDark ? '#F59E0B' : 'rgba(245, 158, 11, 0.3)';
            const tileBg = isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7';
            const tileStroke = isDark ? 'rgba(251,191,36,0.4)' : 'rgba(245, 158, 11, 0.25)';
            const ringColor = isDark ? '#FBBF24' : '#D97706';
            const filterEffect = isDark ? 'url(#stGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="stGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="stFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#D97706" />
                            <stop offset="50%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#FDE68A" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="130" ry="24" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="90" ry="15" fill="none" stroke={ringColor} strokeWidth={1.5} opacity="0.6" />
                    </g>

                    {/* Background 3D Calendar Grid */}
                    <g transform="translate(140, 45)">
                        <rect width="180" height="145" rx="18" fill={calBg} stroke={calStroke} strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        <rect x="40" y="-8" width="10" height="18" rx="5" fill={ringColor} />
                        <rect x="130" y="-8" width="10" height="18" rx="5" fill={ringColor} />
                        
                        {/* 2x3 Grid Tiles */}
                        {[0, 1].map(r => [0, 1, 2].map(c => (
                            <rect key={`${r}-${c}`} x={25 + c * 48} y={38 + r * 45} width="36" height="34" rx="8" fill={tileBg} stroke={tileStroke} strokeWidth="1.5" />
                        )))}
                    </g>

                    {/* Overlapping 3D Glowing Fiery Flame (Front Right) */}
                    <g transform="translate(340, 140)">
                        {/* Outer Flame Glow */}
                        <path d="M 0 50 C -35 50, -45 20, -25 -15 C -20 -25, -10 -40, 0 -60 C 15 -35, 45 -10, 45 20 C 45 50, 25 50, 0 50 Z" fill="url(#stFlame)" stroke="#FBBF24" strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        {/* Inner Core Flame */}
                        <path d="M 0 45 C -20 45, -25 25, -12 2 C -8 -5, -4 -15, 0 -28 C 8 -15, 25 5, 25 25 C 25 45, 15 45, 0 45 Z" fill="#FFFBEB" opacity="0.9" />
                    </g>

                    {/* Ambient Orbit Dash Ring */}
                    <ellipse cx="270" cy="140" rx="190" ry="85" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="6 8" opacity={isDark ? 0.5 : 0.3} transform="rotate(-8 270 140)" />

                    {/* Ambient Sparkles */}
                    <g fill="#FDE68A" opacity="0.85">
                        <circle cx="90" cy="70" r="2.5" />
                        <circle cx="460" cy="75" r="2" />
                        <circle cx="440" cy="190" r="2.5" />
                    </g>
                </svg>
            );
        }
    },
    todo: {
        accent: '#10B981',
        subtitle: 'Plan your tasks and stay on track.',
        icon: CheckSquare,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#041A10' : 'rgba(16, 185, 129, 0.08)';
            const pedStroke = isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16, 185, 129, 0.2)';
            const cardBg = isDark ? 'url(#tdGrad)' : '#FFFFFF';
            const cardStroke = isDark ? '#10B981' : 'rgba(16, 185, 129, 0.3)';
            const clipBg = isDark ? '#052E1D' : '#ECFDF5';
            const clipStroke = isDark ? '#34D399' : '#10B981';
            const checkStroke = isDark ? '#34D399' : '#059669';
            const lineStroke = isDark ? '#A7F3D0' : '#059669';
            const badgeBg = isDark ? '#062B1E' : '#FFFFFF';
            const badgeBorder = isDark ? '#34D399' : '#10B981';
            const badgeInner = isDark ? '#6EE7B7' : 'rgba(16, 185, 129, 0.2)';
            const badgeCheck = isDark ? '#A7F3D0' : '#059669';
            const filterEffect = isDark ? 'url(#tdGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="tdGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="tdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0B3021" />
                            <stop offset="100%" stopColor="#04140D" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="130" ry="24" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="90" ry="15" fill="none" stroke="#34D399" strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* Center 3D Task Clipboard Checklist */}
                    <g transform="translate(180, 40)">
                        <rect width="180" height="160" rx="20" fill={cardBg} stroke={cardStroke} strokeWidth={isDark ? 3 : 1.8} filter={filterEffect} />
                        {/* Top Clip */}
                        <rect x="65" y="-12" width="50" height="24" rx="8" fill={clipBg} stroke={clipStroke} strokeWidth={1.5} />
                        <circle cx="90" cy="0" r="4" fill="#6EE7B7" />

                        {/* 3 Checklist Items */}
                        {[0, 1, 2].map(i => (
                            <g key={i} transform={`translate(28, ${42 + i * 38})`}>
                                <path d="M 0 10 L 6 16 L 16 4" stroke={checkStroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="28" y1="10" x2="120" y2="10" stroke={lineStroke} strokeWidth={3} strokeLinecap="round" />
                            </g>
                        ))}
                    </g>

                    {/* Front Right Circular Checkmark Badge */}
                    <g transform="translate(390, 160)">
                        <circle cx="0" cy="0" r="32" fill={badgeBg} stroke={badgeBorder} strokeWidth={isDark ? 3 : 2} filter={filterEffect} />
                        <circle cx="0" cy="0" r="24" fill="none" stroke={badgeInner} strokeWidth="1.5" opacity="0.7" />
                        <path d="M -12 0 L -3 9 L 12 -7" stroke={badgeCheck} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Left Speed Dash Lines */}
                    <g stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" opacity={isDark ? 0.65 : 0.45}>
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="90" y1="90" x2="140" y2="90" />
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="110" y1="120" x2="150" y2="120" />
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="80" y1="150" x2="135" y2="150" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill="#6EE7B7" opacity="0.8">
                        <circle cx="70" cy="70" r="2.5" />
                        <circle cx="470" cy="75" r="2" />
                        <circle cx="450" cy="190" r="2.5" />
                    </g>
                </svg>
            );
        }
    },
    leaderboard: {
        accent: '#8B5CF6',
        subtitle: 'Compete with peers and climb to the top.',
        icon: Trophy,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedBase = isDark ? '#120526' : 'rgba(139, 92, 246, 0.08)';
            const pedStroke = isDark ? 'rgba(139,92,246,0.4)' : 'rgba(139, 92, 246, 0.2)';
            const step2Bg = isDark ? '#1E0B3A' : '#FFFFFF';
            const step2Stroke = isDark ? '#8B5CF6' : 'rgba(139, 92, 246, 0.25)';
            const step1Bg = isDark ? '#2A1454' : '#F5F3FF';
            const step1Stroke = isDark ? '#C084FC' : '#7C3AED';
            const step3Bg = isDark ? '#1E0B3A' : '#FFFFFF';
            const step3Stroke = isDark ? '#8B5CF6' : 'rgba(139, 92, 246, 0.25)';
            const trophyBg = isDark ? 'url(#lbGrad)' : '#FEF3C7';
            const trophyStroke = isDark ? '#C084FC' : '#F59E0B';
            const stemBg = isDark ? '#3B1C78' : '#FDE68A';
            const stemStroke = isDark ? '#A78BFA' : '#D97706';
            const starFill = isDark ? '#E9D5FF' : '#D97706';
            const filterEffect = isDark ? 'url(#lbGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <filter id="lbGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="lbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2A1454" />
                            <stop offset="100%" stopColor="#120526" />
                        </linearGradient>
                    </defs>

                    {/* Pedestal Base */}
                    <g transform="translate(270, 225)">
                        <ellipse cx="0" cy="15" rx="140" ry="25" fill={pedBase} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke={isDark ? '#C084FC' : 'rgba(139, 92, 246, 0.3)'} strokeWidth="1.5" opacity="0.6" />
                    </g>

                    {/* 3-Tier Podium Steps */}
                    <g transform="translate(170, 130)">
                        {/* 2nd Place Step (Left) */}
                        <rect x="0" y="35" width="60" height="55" rx="8" fill={step2Bg} stroke={step2Stroke} strokeWidth={1.5} />
                        {/* 1st Place Center Step (Center) */}
                        <rect x="68" y="10" width="64" height="80" rx="8" fill={step1Bg} stroke={step1Stroke} strokeWidth={2} filter={filterEffect} />
                        {/* 3rd Place Step (Right) */}
                        <rect x="140" y="50" width="60" height="40" rx="8" fill={step3Bg} stroke={step3Stroke} strokeWidth={1.5} />
                    </g>

                    {/* 3D Glowing Trophy Cup (Center Podium) */}
                    <g transform="translate(270, 95)">
                        {/* Trophy Handles */}
                        <path d="M -26 -28 C -36 -28, -36 -5, -20 0 M 26 -28 C 36 -28, 36 -5, 20 0" stroke={trophyStroke} strokeWidth={2.5} fill="none" />
                        {/* Trophy Cup Body */}
                        <path d="M -22 -35 H 22 L 18 0 C 12 16, -12 16, -18 0 Z" fill={trophyBg} stroke={trophyStroke} strokeWidth={2.5} filter={filterEffect} />
                        {/* Trophy Stem & Base */}
                        <rect x="-6" y="14" width="12" height="15" fill={stemBg} stroke={stemStroke} strokeWidth={1.5} />
                        <rect x="-18" y="28" width="36" height="10" rx="3" fill={step1Bg} stroke={trophyStroke} strokeWidth={1.5} />
                        {/* Star inside Trophy */}
                        <path d="M 0 -22 L 3 -14 L 11 -13 L 5 -7 L 7 1 L 0 -4 L -7 1 L -5 -7 L -11 -13 L -3 -14 Z" fill={starFill} />
                    </g>

                    {/* Floating Gold Crown (Top Left) */}
                    <g transform="translate(160, 90)">
                        <path d="M -20 10 L -25 -12 L -10 -2 L 0 -20 L 10 -2 L 25 -12 L 20 10 Z" fill="rgba(245,158,11,0.2)" stroke="#F59E0B" strokeWidth={2} strokeLinejoin="round" filter={filterEffect} />
                        <circle cx="0" cy="-20" r="3" fill="#FBBF24" />
                        <circle cx="-25" cy="-12" r="2.5" fill="#FBBF24" />
                        <circle cx="25" cy="-12" r="2.5" fill="#FBBF24" />
                    </g>

                    {/* Floating User Profile Silhouette (Top Right) */}
                    <g transform="translate(380, 120)">
                        <circle cx="0" cy="-12" r="14" stroke={isDark ? '#C084FC' : '#7C3AED'} strokeWidth={2} fill="none" />
                        <path d="M -20 18 C -20 5, -10 3, 0 3 C 10 3, 20 5, 20 18" stroke={isDark ? '#C084FC' : '#7C3AED'} strokeWidth={2} strokeLinecap="round" fill="none" />
                    </g>

                    {/* Ambient Sparkles */}
                    <g fill={isDark ? '#C4B5FD' : '#8B5CF6'} opacity="0.85">
                        <circle cx="90" cy="65" r="2.5" />
                        <circle cx="460" cy="60" r="2" />
                        <circle cx="470" cy="190" r="2.5" />
                        <circle cx="80" cy="190" r="2" />
                    </g>
                </svg>
            );
        }
    },
    whatsapp: {
        accent: '#25D366',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(37, 211, 102, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: isDark ? 0.8 : 0.9 }}>
                    <Users size={34} color={isDark ? '#86EFAC' : '#16A34A'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color={isDark ? '#4ADE80' : '#15803D'} strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 16px rgba(37, 211, 102, 0.45))' : 'drop-shadow(0 6px 14px rgba(22, 163, 74, 0.25))' }}>
                    <MessageSquare size={54} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(37, 211, 102, 0.25)' : 'rgba(22, 163, 74, 0.12)'} />
                </div>
            </>
        )
    },
    subjectRegistration: {
        accent: '#8B5CF6',
        subtitle: 'Set up your current semester and subjects.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-32px, -16px) rotate(-12deg)', opacity: isDark ? 0.7 : 0.85 }}>
                    <BookOpen size={38} color={isDark ? '#C4B5FD' : '#7C3AED'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(32px, -18px) rotate(14deg)', opacity: isDark ? 0.85 : 0.95 }}>
                    <GraduationCap size={42} color={isDark ? '#A78BFA' : '#6D28D9'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 20px rgba(139, 92, 246, 0.5))' : 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.25))' }}>
                    <CheckSquare size={58} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(124, 58, 237, 0.12)'} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 22px)', opacity: 0.9 }}>
                    <Sparkles size={24} color={isDark ? '#DDD6FE' : '#8B5CF6'} strokeWidth={2} />
                </div>
            </>
        )
    },
    sgpaGpa: {
        accent: '#10B981',
        subtitle: 'Calculate your semester result and track your CGPA.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -14px)', opacity: isDark ? 0.75 : 0.85 }}>
                    <TrendingUp size={38} color={isDark ? '#6EE7B7' : '#059669'} strokeWidth={2} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -16px)', opacity: isDark ? 0.85 : 0.95 }}>
                    <Trophy size={36} color={isDark ? '#A7F3D0' : '#047857'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 20px rgba(16, 185, 129, 0.5))' : 'drop-shadow(0 6px 14px rgba(5, 150, 105, 0.25))' }}>
                    <Calculator size={56} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(5, 150, 105, 0.12)'} />
                </div>
            </>
        )
    },
    academicSummary: {
        accent: '#EC4899',
        subtitle: 'Review your complete academic journey.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(236, 72, 153, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -14px)', opacity: isDark ? 0.75 : 0.85 }}>
                    <BarChart3 size={38} color={isDark ? '#F472B6' : '#DB2777'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -16px)', opacity: isDark ? 0.85 : 0.95 }}>
                    <Award size={38} color={isDark ? '#F472B6' : '#BE185D'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 20px rgba(236, 72, 153, 0.5))' : 'drop-shadow(0 6px 14px rgba(219, 39, 119, 0.25))' }}>
                    <GraduationCap size={58} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(236, 72, 153, 0.25)' : 'rgba(219, 39, 119, 0.12)'} />
                </div>
            </>
        )
    },
    labPrograms: {
        accent: '#A855F7',
        subtitle: 'Practice and master your college lab programs.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => {
            const pedFill = isDark ? '#0C051D' : 'rgba(168, 85, 247, 0.08)';
            const pedStroke = isDark ? 'rgba(168,85,247,0.4)' : 'rgba(168, 85, 247, 0.2)';
            const cBg = isDark ? 'url(#cGrad)' : '#F0F9FF';
            const cppBg = isDark ? 'url(#cppGrad)' : '#EEF2FF';
            const javaBg = isDark ? 'url(#javaGrad)' : '#FFFBEB';
            const pyBg = isDark ? 'url(#pyGrad)' : '#ECFDF5';
            const windowBg = isDark ? 'url(#lpWindowGrad)' : '#FFFFFF';
            const windowStroke = isDark ? '#A855F7' : 'rgba(168, 85, 247, 0.3)';
            const headerBg = isDark ? 'url(#lpHeaderGrad)' : '#F8FAFC';
            const tabBg = isDark ? 'url(#lpTabGrad)' : '#FFFFFF';
            const tabStroke = isDark ? 'rgba(168,85,247,0.4)' : 'rgba(168, 85, 247, 0.2)';
            const tabText = isDark ? '#E9D5FF' : '#7C3AED';
            const codeDefault = isDark ? '#E2E8F0' : '#0F172A';
            const codeComment = isDark ? '#6EE7B7' : '#059669';
            const badgeBg = isDark ? '#0C2419' : '#ECFDF5';
            const badgeText = isDark ? '#6EE7B7' : '#059669';
            const filterEffect = isDark ? 'url(#lpGlow)' : undefined;
            const softFilter = isDark ? 'url(#lpSoftGlow)' : undefined;

            return (
                <svg viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <style>{`
                            @keyframes strokeFlow {
                                from { stroke-dashoffset: 24; }
                                to { stroke-dashoffset: 0; }
                            }
                            @keyframes cursorPulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0; }
                            }
                            .lp-flow-line {
                                stroke-dasharray: 5 5;
                                stroke-dashoffset: 0;
                                transition: stroke 0.3s ease;
                            }
                            .lp-flow-animated {
                                animation: strokeFlow 0.65s linear infinite !important;
                            }
                            .lp-cursor {
                                animation: cursorPulse 0.9s ease-in-out infinite;
                            }
                        `}</style>
                        <filter id="lpGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="lpSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="lpWindowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1B0E36" />
                            <stop offset="100%" stopColor="#0B0518" />
                        </linearGradient>
                        <linearGradient id="lpHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#25124A" />
                            <stop offset="100%" stopColor="#140A28" />
                        </linearGradient>
                        <linearGradient id="lpTabGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B1768" />
                            <stop offset="100%" stopColor="#240D42" />
                        </linearGradient>
                        <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0E2847" />
                            <stop offset="100%" stopColor="#061324" />
                        </linearGradient>
                        <linearGradient id="cppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E164D" />
                            <stop offset="100%" stopColor="#0A0724" />
                        </linearGradient>
                        <linearGradient id="javaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#331A05" />
                            <stop offset="100%" stopColor="#170A02" />
                        </linearGradient>
                        <linearGradient id="pyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#062922" />
                            <stop offset="100%" stopColor="#021410" />
                        </linearGradient>
                    </defs>

                    {/* 1. Pedestal Base Lighting */}
                    <g transform="translate(270, 235)">
                        <ellipse cx="0" cy="15" rx="145" ry="24" fill={pedFill} stroke={pedStroke} strokeWidth={isDark ? 2 : 1} filter={filterEffect} />
                        <ellipse cx="0" cy="15" rx="105" ry="15" fill="none" stroke={isDark ? '#C084FC' : 'rgba(168,85,247,0.3)'} strokeWidth="1.5" opacity="0.65" />
                    </g>

                    {/* 2. Connecting Flow Paths from Languages to Main IDE */}
                    <g stroke="#C084FC" strokeWidth="2" opacity="0.75">
                        <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 115 85 C 135 85, 140 100, 155 105" />
                        <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 125 170 C 145 170, 145 155, 155 145" />
                        <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 425 85 C 405 85, 400 100, 385 105" />
                        <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 415 170 C 395 170, 395 155, 385 145" />
                    </g>

                    {/* 3. Left Language Badges: C & C++ */}
                    <g transform="translate(35, 55)">
                        <rect width="80" height="60" rx="14" fill={cBg} stroke="#38BDF8" strokeWidth="1.8" filter={softFilter} />
                        <text x="40" y="32" textAnchor="middle" fill="#0284C7" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">C</text>
                        <text x="40" y="48" textAnchor="middle" fill={isDark ? '#93C5FD' : '#0369A1'} fontSize="10" fontWeight="700" letterSpacing="0.8">PROGRAM</text>
                        <circle cx="68" cy="14" r="3" fill="#38BDF8" />
                    </g>

                    <g transform="translate(38, 140)">
                        <rect width="88" height="60" rx="14" fill={cppBg} stroke="#818CF8" strokeWidth="1.8" filter={softFilter} />
                        <text x="44" y="32" textAnchor="middle" fill="#4F46E5" fontSize="20" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">C++</text>
                        <text x="44" y="48" textAnchor="middle" fill={isDark ? '#C7D2FE' : '#4338CA'} fontSize="10" fontWeight="700" letterSpacing="0.8">OOP LAB</text>
                        <circle cx="76" cy="14" r="3" fill="#818CF8" />
                    </g>

                    {/* 4. Right Language Badges: Java & Python */}
                    <g transform="translate(425, 55)">
                        <rect width="80" height="60" rx="14" fill={javaBg} stroke="#F59E0B" strokeWidth="1.8" filter={softFilter} />
                        <text x="40" y="32" textAnchor="middle" fill="#D97706" fontSize="19" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">Java</text>
                        <text x="40" y="48" textAnchor="middle" fill={isDark ? '#FDE68A' : '#B45309'} fontSize="10" fontWeight="700" letterSpacing="0.8">LAB CODE</text>
                        <circle cx="68" cy="14" r="3" fill="#F59E0B" />
                    </g>

                    <g transform="translate(414, 140)">
                        <rect width="88" height="60" rx="14" fill={pyBg} stroke="#10B981" strokeWidth="1.8" filter={softFilter} />
                        <text x="44" y="32" textAnchor="middle" fill="#059669" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">Python</text>
                        <text x="44" y="48" textAnchor="middle" fill={isDark ? '#A7F3D0' : '#047857'} fontSize="10" fontWeight="700" letterSpacing="0.8">DATA LAB</text>
                        <circle cx="76" cy="14" r="3" fill="#10B981" />
                    </g>

                    {/* 5. Center Code Terminal / IDE Window */}
                    <g transform="translate(155, 30)">
                        <rect width="230" height="175" rx="18" fill={windowBg} stroke={windowStroke} strokeWidth={isDark ? 2.5 : 1.8} filter={filterEffect} />
                        
                        {/* Title Bar Header */}
                        <path d="M 0 18 C 0 8, 8 0, 18 0 H 212 C 222 0, 230 8, 230 18 V 32 H 0 Z" fill={headerBg} />
                        <line x1="0" y1="32" x2="230" y2="32" stroke="rgba(168,85,247,0.2)" strokeWidth="1" />

                        {/* Window Controls */}
                        <circle cx="16" cy="16" r="4" fill="#F43F5E" />
                        <circle cx="28" cy="16" r="4" fill="#F59E0B" />
                        <circle cx="40" cy="16" r="4" fill="#10B981" />

                        {/* Active Tab */}
                        <g transform="translate(58, 6)">
                            <rect width="105" height="20" rx="6" fill={tabBg} stroke={tabStroke} strokeWidth="1" />
                            <path d="M 10 7 L 14 10 L 10 13 M 16 13 H 20" stroke={tabText} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="58" y="14" textAnchor="middle" fill={tabText} fontSize="10" fontWeight="700" fontFamily="monospace">lab_suite.c</text>
                        </g>

                        {/* Line Numbers Gutter */}
                        <g fill={isDark ? '#7C3AED' : '#94A3B8'} fontSize="10.5" fontFamily="monospace" fontWeight="600" opacity="0.75">
                            <text x="16" y="56">1</text>
                            <text x="16" y="76">2</text>
                            <text x="16" y="96">3</text>
                            <text x="16" y="116">4</text>
                            <text x="16" y="136">5</text>
                            <text x="16" y="156">6</text>
                        </g>
                        <line x1="28" y1="40" x2="28" y2="165" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />

                        {/* Code Lines */}
                        <g transform="translate(36, 56)" fontFamily="monospace" fontSize="11" fontWeight="600">
                            <text x="0" y="0" fill="#DB2777">#include</text>
                            <text x="56" y="0" fill="#0284C7">&lt;stdio.h&gt;</text>
                        </g>

                        <g transform="translate(36, 76)" fontFamily="monospace" fontSize="11" fontWeight="600">
                            <text x="0" y="0" fill="#6366F1">void</text>
                            <text x="32" y="0" fill="#D97706">runCollegeLab</text>
                            <text x="114" y="0" fill={codeDefault}>{"() {"}</text>
                        </g>

                        <g transform="translate(48, 96)" fontFamily="monospace" fontSize="10" fontWeight="500">
                            <text x="0" y="0" fill={codeComment}>// compile &amp; test code</text>
                        </g>

                        <g transform="translate(48, 116)" fontFamily="monospace" fontSize="11" fontWeight="600">
                            <text x="0" y="0" fill="#7C3AED">execute_lab</text>
                            <text x="74" y="0" fill={codeDefault}>(cases);</text>
                        </g>

                        <g transform="translate(48, 136)" fontFamily="monospace" fontSize="11" fontWeight="600">
                            <text x="0" y="0" fill="#DB2777">return</text>
                            <text x="46" y="0" fill="#059669">SUCCESS;</text>
                        </g>

                        <g transform="translate(36, 156)" fontFamily="monospace" fontSize="11" fontWeight="700">
                            <text x="0" y="0" fill={codeDefault}>{"}"}</text>
                            <rect className="lp-cursor" x="14" y="-10" width="7" height="12" rx="1.5" fill="#10B981" />
                        </g>
                    </g>

                    {/* 6. Floating Status Pill / Badge on Terminal */}
                    <g transform="translate(290, 178)">
                        <rect width="112" height="28" rx="9" fill={badgeBg} stroke="#10B981" strokeWidth="1.5" filter={softFilter} />
                        <circle cx="15" cy="14" r="7" fill={isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.12)'} stroke="#34D399" strokeWidth="1.2" />
                        <path d="M 12 14 L 14 16 L 18 12" stroke={badgeText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="63" y="18" textAnchor="middle" fill={badgeText} fontSize="10.5" fontWeight="800" fontFamily="Outfit, sans-serif" letterSpacing="0.4">LAB READY</text>
                    </g>

                    {/* 7. Ambient Sparkles / Tech Accents */}
                    <g fill={isDark ? '#E9D5FF' : '#A855F7'} opacity="0.85">
                        <circle cx="75" cy="35" r="2" />
                        <circle cx="465" cy="38" r="2.5" />
                        <circle cx="475" cy="215" r="2" />
                        <circle cx="70" cy="220" r="2.5" />
                        <circle cx="270" cy="20" r="2" />
                    </g>
                </svg>
            );
        }
    },
    library: {
        accent: '#38BDF8',
        subtitle: 'Comprehensive curriculum library, modules & reference notes.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(56, 189, 248, 0.28) 0%, rgba(8, 14, 28, 0.98) 100%)',
        render: (accent, isHovered, isDark = true) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-32px, -14px) rotate(-12deg)', opacity: isDark ? 0.55 : 0.7 }}>
                    <BookOpen size={40} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(32px, -12px) rotate(14deg)', opacity: isDark ? 0.75 : 0.9 }}>
                    <Book size={38} color={isDark ? '#7DD3FC' : '#0369A1'} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: isDark ? 'drop-shadow(0 8px 20px rgba(56, 189, 248, 0.5))' : 'drop-shadow(0 6px 14px rgba(2, 132, 199, 0.25))' }}>
                    <Layers size={58} color={accent} strokeWidth={1.8} fill={isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.12)'} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 22px)', opacity: 0.9 }}>
                    <Sparkles size={22} color={isDark ? '#BAE6FD' : '#0284C7'} strokeWidth={2} />
                </div>
            </>
        )
    }
};

/**
 * IllustrationCard — Premium Academic Product Catalog Card
 *
 * Design system:
 *   40% CSES academic hierarchy (strong title, structured info, consistent alignment)
 *   40% Modern premium SaaS (clean spacing, subtle borders, excellent hover)
 *   20% AskUrSenior brand (violet/purple accent, per-feature accent color)
 *
 * Card anatomy (top → bottom):
 *   ┌─────────────────────────────┐
 *   │   Illustration area ~40%   │  subtle tinted bg, preserved icons
 *   ├─────────────────────────────┤
 *   │   Feature name  (strong)   │
 *   │   Description   (muted)    │
 *   ├─────────────────────────────┤
 *   │   CTA text             →   │  inline, accent-colored
 *   └─────────────────────────────┘
 */
const IllustrationCard = ({
    presetKey,
    featureKey,
    featureState = 'new',  // 'new' | 'visited' | 'active'
    title,
    subtitle,
    onClick,
    customAccent,
    customBgGradient,
    isSubdued = false,
    dependencyText,
    onGoToRegistration,
    ctaText,
    metadataText,
    isActiveGlow = false
}) => {
    const [hovered, setHovered] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const { isDark } = useTheme();

    const preset = SCENE_PRESETS[presetKey] || SCENE_PRESETS.materials;
    const accent = customAccent || preset.accent;
    const cardSubtitle = subtitle || preset.subtitle;

    // ── Theme tokens ─────────────────────────────────────────────────
    const tokens = {
        // Page → Card → Card surface hierarchy
        cardBg:          isDark ? '#0D111C' : '#FFFFFF',
        contentBg:       isDark ? '#0D111C' : '#FFFFFF',
        borderIdle:      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)',
        borderHover:     isDark ? `${accent}55` : `${accent}70`,
        borderSubdued:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        // Illustration tinted area
        illustBgDark:    `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 75%)`,
        illustBgLight:   `radial-gradient(ellipse at 50% 0%, ${accent}10 0%, transparent 80%)`,
        illustDivider:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
        // Content typography
        titleColor:      isDark ? '#F1F5F9' : '#0F172A',
        titleColorHover: isDark ? '#FFFFFF' : '#0F172A',
        descColor:       isDark ? '#64748B' : '#64748B',
        descColorActive: isDark ? '#94A3B8' : '#475569',
        // CTA divider
        ctaDivider:      isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
        // Subdued popover
        popoverBg:       isDark ? '#0A0E18' : '#FFFFFF',
        popoverBorder:   isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.25)',
        popoverText:     isDark ? '#CBD5E1' : '#334155',
    };

    const handleCardClick = (e) => {
        if (isSubdued) {
            e.stopPropagation();
            setShowPopover(prev => !prev);
        } else {
            // Record feature visit in localStorage (non-invasive, no backend needed)
            if (featureKey) {
                try {
                    const lsKey = `asus_fv_${featureKey}`;
                    if (!localStorage.getItem(lsKey)) {
                        localStorage.setItem(lsKey, new Date().toISOString());
                    }
                } catch (_) { /* localStorage may be unavailable */ }
            }
            if (onClick) {
                onClick(e);
            }
        }
    };

    const ctaLabel = ctaText || 'Explore →';

    // ── Feature state indicator ───────────────────────────────────────
    const StateIndicator = () => {
        if (isSubdued) return null;
        if (featureState === 'active') {
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#10B981',
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '0.01em',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                }}>
                    <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'inline-block',
                        flexShrink: 0,
                    }} />
                    Active
                </span>
            );
        }
        if (featureState === 'visited') {
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 500,
                    color: isDark ? '#475569' : '#94A3B8',
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '0.01em',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Visited
                </span>
            );
        }
        // 'new' — default
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 500,
                color: isDark ? `${accent}99` : `${accent}BB`,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '0.01em',
                flexShrink: 0,
                whiteSpace: 'nowrap',
            }}>
                <span style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: isDark ? `${accent}88` : `${accent}99`,
                    display: 'inline-block',
                    flexShrink: 0,
                }} />
                New
            </span>
        );
    };

    return (
        <div
            onMouseEnter={() => {
                setHovered(true);
                if (isSubdued) setShowPopover(true);
            }}
            onMouseLeave={() => {
                setHovered(false);
                if (isSubdued) setShowPopover(false);
            }}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            aria-label={`${title}. ${isSubdued ? dependencyText || 'Complete subject registration first' : cardSubtitle || ''}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(e);
                }
            }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 14,
                border: `1px solid ${
                    isSubdued
                        ? tokens.borderSubdued
                        : (hovered || isActiveGlow)
                            ? tokens.borderHover
                            : tokens.borderIdle
                }`,
                backgroundColor: tokens.cardBg,
                opacity: isSubdued ? 0.62 : 1,
                cursor: isSubdued ? 'default' : 'pointer',
                transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
                transform: (!isSubdued && hovered) ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: (!isSubdued && hovered)
                    ? isDark
                        ? '0 12px 28px -6px rgba(0,0,0,0.55)'
                        : '0 8px 20px -4px rgba(15,23,42,0.12), 0 2px 6px -1px rgba(15,23,42,0.07)'
                    : isDark
                        ? '0 2px 8px rgba(0,0,0,0.35)'
                        : '0 1px 4px rgba(15,23,42,0.06)',
                overflow: 'visible',
                position: 'relative',
                height: '100%',
                userSelect: 'none',
                outline: 'none',
            }}
        >
            {/* ── INNER WRAPPER keeps corner radius + overflow hidden ── */}
            <div style={{ borderRadius: 13, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

                {/* ── ILLUSTRATION AREA ─────────────────────────────── */}
                <div style={{
                    height: 140,
                    background: isDark ? tokens.illustBgDark : tokens.illustBgLight,
                    backgroundColor: isDark ? '#0B0F1C' : '#F8FAFC',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: `1px solid ${tokens.illustDivider}`,
                    filter: isSubdued ? 'saturate(0.5) brightness(0.85)' : 'none',
                    transition: 'filter 200ms ease',
                }}>
                    {/* Illustration scene — exactly as authored in SCENE_PRESETS */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: hovered && !isSubdued ? 'scale(1.02)' : 'scale(1)',
                        transition: 'transform 200ms ease',
                    }}>
                        {preset.render(accent, hovered && !isSubdued, isDark)}
                    </div>
                </div>

                {/* ── CONTENT AREA ──────────────────────────────────── */}
                <div style={{
                    padding: '14px 16px 13px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: tokens.contentBg,
                    flex: 1,
                    gap: 8,
                }}>
                    {/* Title row: feature name + subtle state indicator */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <h3 style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: hovered && !isSubdued ? tokens.titleColorHover : tokens.titleColor,
                                margin: 0,
                                fontFamily: 'Outfit, sans-serif',
                                letterSpacing: '-0.015em',
                                lineHeight: 1.25,
                                transition: 'color 150ms ease',
                                minWidth: 0,
                                flex: 1,
                            }}>
                                {title}
                            </h3>
                            <StateIndicator />
                        </div>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: hovered && !isSubdued ? tokens.descColorActive : tokens.descColor,
                            margin: 0,
                            lineHeight: 1.55,
                            fontFamily: 'Outfit, sans-serif',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            transition: 'color 150ms ease',
                        }}>
                            {isSubdued ? 'Complete subject setup to unlock this feature.' : cardSubtitle}
                        </p>
                    </div>

                    {/* ── CTA ROW ─────────────────────────────────── */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 10,
                        borderTop: `1px solid ${tokens.ctaDivider}`,
                        marginTop: 'auto',
                        minHeight: 32,
                    }}>
                        {isSubdued ? (
                            <span style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: isDark ? '#475569' : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontFamily: 'Outfit, sans-serif',
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Setup required
                            </span>
                        ) : (
                            <>
                                {/* Metadata tag (e.g. "4 Languages • Lab-wise") */}
                                {metadataText && (
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: isDark ? '#475569' : '#94A3B8',
                                        fontFamily: 'Outfit, sans-serif',
                                        letterSpacing: '0.01em',
                                        flexShrink: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {metadataText}
                                    </span>
                                )}

                                {/* CTA — inline text with animated arrow */}
                                <span style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: accent,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontFamily: 'Outfit, sans-serif',
                                    letterSpacing: '0.01em',
                                    marginLeft: 'auto',
                                    flexShrink: 0,
                                    transition: 'gap 150ms ease',
                                }}>
                                    {ctaLabel.replace(' →', '')}
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transition: 'transform 150ms ease',
                                            transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── DEPENDENCY POPOVER (subdued cards) ──────────────── */}
            {isSubdued && (showPopover || hovered) && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 16px)',
                    maxWidth: 300,
                    zIndex: 50,
                    backgroundColor: tokens.popoverBg,
                    border: `1px solid ${tokens.popoverBorder}`,
                    borderRadius: 12,
                    padding: '11px 13px',
                    boxShadow: isDark
                        ? '0 12px 30px rgba(0,0,0,0.85), 0 0 0 1px rgba(139,92,246,0.15)'
                        : '0 8px 24px rgba(15,23,42,0.14), 0 0 0 1px rgba(139,92,246,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    pointerEvents: 'auto',
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 500,
                        color: tokens.popoverText,
                        lineHeight: 1.5,
                        fontFamily: 'Outfit, sans-serif',
                    }}>
                        {dependencyText || 'Complete Subject Registration first to continue.'}
                    </p>
                    {onGoToRegistration && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onGoToRegistration();
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '6px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                width: 'fit-content',
                                alignSelf: 'flex-start',
                                fontFamily: 'Outfit, sans-serif',
                                letterSpacing: '0.01em',
                                transition: 'opacity 150ms ease',
                            }}
                        >
                            Go to Registration →
                        </button>
                    )}
                    {/* Tooltip arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '7px solid transparent',
                        borderRight: '7px solid transparent',
                        borderTop: `7px solid ${tokens.popoverBg}`,
                    }} />
                </div>
            )}
        </div>
    );
};

export default IllustrationCard;
