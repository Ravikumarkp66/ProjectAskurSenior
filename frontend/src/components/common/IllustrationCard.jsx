import React, { useState } from 'react';
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
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-22px, -8px) rotate(-8deg)', opacity: 0.5 }}>
                    <BookOpen size={36} color={accent} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(24px, -14px) rotate(12deg)', opacity: 0.7 }}>
                    <FileText size={38} color="#C4B5FD" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.4))' }}>
                    <Folder size={56} color={accent} strokeWidth={1.8} fill="rgba(139, 92, 246, 0.2)" />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 20px)', opacity: 0.9 }}>
                    <Sparkles size={20} color="#DDD6FE" strokeWidth={2} />
                </div>
            </>
        )
    },
    interviews: {
        accent: '#A78BFA',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(167, 139, 250, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.4 }}>
                    <Building2 size={40} color="#7C3AED" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, -18px)', opacity: 0.85 }}>
                    <MessageSquare size={34} color={accent} strokeWidth={1.8} fill="rgba(167, 139, 250, 0.2)" />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(167, 139, 250, 0.4))' }}>
                    <UserCheck size={54} color="#EDE9FE" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(-24px, 22px)', opacity: 0.75 }}>
                    <FileText size={24} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    faculty: {
        accent: '#818CF8',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(129, 140, 248, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -16px) rotate(-15deg)', opacity: 0.85 }}>
                    <Star size={24} color="#FBBF24" fill="#FBBF24" strokeWidth={1.5} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -18px) rotate(15deg)', opacity: 0.85 }}>
                    <Star size={28} color="#FBBF24" fill="#FBBF24" strokeWidth={1.5} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(129, 140, 248, 0.4))' }}>
                    <GraduationCap size={56} color={accent} strokeWidth={1.8} fill="rgba(129, 140, 248, 0.2)" />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(0px, 26px)', opacity: 0.95 }}>
                    <MessageSquare size={26} color="#C7D2FE" strokeWidth={1.8} fill="rgba(129, 140, 248, 0.3)" />
                </div>
            </>
        )
    },
    campusMap: {
        accent: '#3B82F6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-24px, -10px)', opacity: 0.5 }}>
                    <Building2 size={42} color="#1D4ED8" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, 14px)', opacity: 0.75 }}>
                    <Compass size={32} color="#93C5FD" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(59, 130, 246, 0.5))' }}>
                    <MapPin size={56} color={accent} strokeWidth={1.8} fill="rgba(59, 130, 246, 0.25)" />
                </div>
            </>
        )
    },
    lostFound: {
        accent: '#F97316',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(249, 115, 22, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.6 }}>
                    <Package size={40} color="#EA580C" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(24px, -16px)', opacity: 0.9 }}>
                    <AlertCircle size={26} color="#FDBA74" strokeWidth={2} fill="rgba(249, 115, 22, 0.3)" />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(249, 115, 22, 0.4))' }}>
                    <Search size={54} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    marketplace: {
        accent: '#10B981',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-26px, -14px) rotate(-10deg)', opacity: 0.75 }}>
                    <Tag size={32} color="#A7F3D0" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.65 }}>
                    <Package size={34} color="#059669" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.4))' }}>
                    <ShoppingBag size={54} color={accent} strokeWidth={1.8} fill="rgba(16, 185, 129, 0.2)" />
                </div>
            </>
        )
    },
    cgpaCalculator: {
        accent: '#8B5CF6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.75 }}>
                    <GraduationCap size={36} color="#C4B5FD" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -10px)', opacity: 0.85 }}>
                    <TrendingUp size={34} color="#A78BFA" strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.4))' }}>
                    <Calculator size={54} color={accent} strokeWidth={1.8} fill="rgba(139, 92, 246, 0.2)" />
                </div>
            </>
        )
    },
    sgpaCalculator: {
        accent: '#10B981',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.75 }}>
                    <BarChart3 size={38} color="#6EE7B7" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 14px)', opacity: 0.85 }}>
                    <Target size={30} color={accent} strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.4))' }}>
                    <Calculator size={54} color={accent} strokeWidth={1.8} fill="rgba(16, 185, 129, 0.2)" />
                </div>
            </>
        )
    },
    blogs: {
        accent: '#14B8A6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(20, 184, 166, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-26px, -14px) rotate(-10deg)', opacity: 0.7 }}>
                    <PenTool size={32} color="#99F6E4" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color="#5EEAD4" strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(20, 184, 166, 0.4))' }}>
                    <BookOpen size={54} color={accent} strokeWidth={1.8} fill="rgba(20, 184, 166, 0.2)" />
                </div>
            </>
        )
    },
    year1: {
        accent: '#8B5CF6',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.75 }}>
                    <BookOpen size={34} color="#C4B5FD" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(26px, 14px)', opacity: 0.85 }}>
                    <Sparkles size={26} color="#DDD6FE" strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.45))' }}>
                    <AtomIcon size={56} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year2: {
        accent: '#A855F7',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.7 }}>
                    <Database size={34} color="#E9D5FF" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.75 }}>
                    <Layers size={32} color="#C084FC" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(168, 85, 247, 0.45))' }}>
                    <Cpu size={56} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year3: {
        accent: '#6366F1',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -14px)', opacity: 0.8 }}>
                    <Bot size={34} color="#C7D2FE" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color="#818CF8" strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.45))' }}>
                    <Brain size={56} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    year4: {
        accent: '#D946EF',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(217, 70, 239, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, 14px)', opacity: 0.75 }}>
                    <Target size={32} color="#F5D0FE" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, -14px)', opacity: 0.85 }}>
                    <Trophy size={32} color="#E879F9" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(217, 70, 239, 0.45))' }}>
                    <Rocket size={56} color={accent} strokeWidth={1.8} />
                </div>
            </>
        )
    },
    cieAnalyzer: {
        accent: '#F97316',
        subtitle: 'Calculate your CIE from labs, internals, quizzes, assignments & more',
        icon: Calculator,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(249, 115, 22, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                        <rect width="112" height="68" rx="14" fill="#1C0E07" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
                        <text x="56" y="24" textAnchor="middle" fill="#FDBA74" fontSize="12" fontWeight="700">Lab</text>
                        <text x="56" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">18<tspan fontSize="12" fill="#FDBA74">/20</tspan></text>
                    </g>
                    {/* Internals */}
                    <g transform="translate(130, 0)">
                        <rect width="112" height="68" rx="14" fill="#1C0E07" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
                        <text x="56" y="24" textAnchor="middle" fill="#FDBA74" fontSize="12" fontWeight="700">Internals</text>
                        <text x="56" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">17<tspan fontSize="12" fill="#FDBA74">/20</tspan></text>
                    </g>
                    {/* Quizzes */}
                    <g transform="translate(260, 0)">
                        <rect width="112" height="68" rx="14" fill="#1C0E07" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
                        <text x="56" y="24" textAnchor="middle" fill="#FDBA74" fontSize="12" fontWeight="700">Quizzes</text>
                        <text x="56" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">16<tspan fontSize="12" fill="#FDBA74">/20</tspan></text>
                    </g>
                    {/* Assignments */}
                    <g transform="translate(390, 0)">
                        <rect width="112" height="68" rx="14" fill="#1C0E07" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
                        <text x="56" y="24" textAnchor="middle" fill="#FDBA74" fontSize="12" fontWeight="700">Assignments</text>
                        <text x="56" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">19<tspan fontSize="12" fill="#FDBA74">/20</tspan></text>
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
                    <rect width="120" height="135" rx="18" fill="url(#cieGrad)" stroke="#F97316" strokeWidth="2.5" filter="url(#cieGlow)" />
                    {/* Display Screen */}
                    <rect x="15" y="15" width="90" height="32" rx="8" fill="#0D0502" stroke="rgba(249,115,22,0.5)" strokeWidth="1.2" />
                    <text x="60" y="37" textAnchor="middle" fill="#FFEDD5" fontSize="15" fontWeight="900" letterSpacing="2">CIE</text>
                    {/* 3x3 Keypad Grid */}
                    {[0, 1, 2].map(r => [0, 1, 2].map(c => (
                        <rect key={`${r}-${c}`} x={22 + c * 28} y={60 + r * 20} width="20" height="14" rx="4" fill="#3B1C0A" stroke="rgba(249,115,22,0.4)" strokeWidth="1" />
                    )))}
                </g>

                {/* Arrow pointing right */}
                <g transform="translate(305, 185)" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round">
                    <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="0" y1="0" x2="52" y2="0" markerEnd="url(#cieArrowHead)" />
                </g>

                {/* Right CIE Score Card */}
                <g transform="translate(365, 140)">
                    <rect width="155" height="105" rx="18" fill="#1A0A04" stroke="rgba(249,115,22,0.7)" strokeWidth="2" filter="url(#cieGlow)" />
                    <text x="77" y="32" textAnchor="middle" fill="#FDBA74" fontSize="12" fontWeight="800" letterSpacing="1.5">CIE SCORE</text>
                    <text x="77" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="34" fontWeight="900" fontFamily="Outfit, sans-serif">42<tspan fontSize="20" fill="#FDBA74">/50</tspan></text>
                    <line x1="30" y1="86" x2="125" y2="86" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                </g>
            </svg>
        )
    },
    eligibilityChecker: {
        accent: '#10B981',
        subtitle: 'Check if you are eligible to appear for the semester exams',
        icon: ShieldCheck,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                        <rect width="260" height="70" rx="14" fill="#071912" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5" />
                        <rect x="16" y="16" width="38" height="38" rx="10" fill="rgba(16,185,129,0.2)" stroke="#34D399" strokeWidth="1.2" />
                        <path d="M 28 26 H 42 M 28 34 H 42 M 28 42 H 36" stroke="#A7F3D0" strokeWidth="2.2" strokeLinecap="round" />
                        <text x="66" y="36" fill="#FFFFFF" fontSize="14" fontWeight="800">Attendance</text>
                        <text x="66" y="52" fill="#6EE7B7" fontSize="11" fontWeight="600">85% and above</text>
                        <circle cx="225" cy="35" r="13" fill="rgba(16,185,129,0.25)" stroke="#10B981" strokeWidth="1.8" />
                        <path d="M 219 35 L 223 39 L 231 31" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Tile 2: CIE Marks */}
                    <g transform="translate(0, 84)">
                        <rect width="260" height="70" rx="14" fill="#071912" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5" />
                        <rect x="16" y="16" width="38" height="38" rx="10" fill="rgba(16,185,129,0.2)" stroke="#34D399" strokeWidth="1.2" />
                        <path d="M 25 44 V 34 M 35 44 V 26 M 45 44 V 20" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
                        <text x="66" y="36" fill="#FFFFFF" fontSize="14" fontWeight="800">CIE Marks</text>
                        <text x="66" y="52" fill="#6EE7B7" fontSize="11" fontWeight="600">Minimum required</text>
                        <circle cx="225" cy="35" r="13" fill="rgba(16,185,129,0.25)" stroke="#10B981" strokeWidth="1.8" />
                        <path d="M 219 35 L 223 39 L 231 31" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Tile 3: Credits Earned */}
                    <g transform="translate(0, 168)">
                        <rect width="260" height="70" rx="14" fill="#071912" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5" />
                        <rect x="16" y="16" width="38" height="38" rx="10" fill="rgba(16,185,129,0.2)" stroke="#34D399" strokeWidth="1.2" />
                        <path d="M 23 32 L 35 25 L 47 32 L 35 39 Z" stroke="#A7F3D0" strokeWidth="2" fill="none" />
                        <text x="66" y="36" fill="#FFFFFF" fontSize="14" fontWeight="800">Credits Earned</text>
                        <text x="66" y="52" fill="#6EE7B7" fontSize="11" fontWeight="600">No backlog</text>
                        <circle cx="225" cy="35" r="13" fill="rgba(16,185,129,0.25)" stroke="#10B981" strokeWidth="1.8" />
                        <path d="M 219 35 L 223 39 L 231 31" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </g>

                {/* Dotted Flow Connectors with Arrowheads */}
                <g stroke="#34D399" strokeWidth="2.5" opacity="0.85">
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 55 C 330 55, 340 125, 385 125" markerEnd="url(#elgArrowHead)" />
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 139 L 385 139" markerEnd="url(#elgArrowHead)" />
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 280 223 C 330 223, 340 150, 385 150" markerEnd="url(#elgArrowHead)" />
                </g>

                {/* Right Neon Shield & Pedestal */}
                <g transform="translate(440, 125)">
                    <ellipse cx="0" cy="100" rx="75" ry="24" fill="#042014" stroke="#10B981" strokeWidth="2" filter="url(#elgGlow)" />
                    <ellipse cx="0" cy="100" rx="55" ry="16" fill="#052E1D" stroke="#34D399" strokeWidth="2" />

                    <g transform="translate(0, 5)">
                        <path d="M 0 -70 C 45 -70, 50 -55, 50 0 C 50 45, 20 65, 0 78 C -20 65, -50 45, -50 0 C -50 -55, -45 -70, 0 -70 Z" fill="url(#elgShieldGrad)" stroke="#10B981" strokeWidth="3.5" filter="url(#elgGlow)" />
                        <path d="M 0 -60 C 38 -60, 42 -47, 42 0 C 42 38, 17 55, 0 66 C -17 55, -42 38, -42 0 C -42 -47, -38 -60, 0 -60 Z" fill="none" stroke="#34D399" strokeWidth="1.8" opacity="0.75" />
                        <path d="M -16 0 L -4 14 L 20 -12" stroke="#6EE7B7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    <text x="0" y="125" textAnchor="middle" fill="#6EE7B7" fontSize="16" fontWeight="900" letterSpacing="3" fontFamily="Outfit, sans-serif">ELIGIBLE</text>
                </g>
            </svg>
        )
    },
    yearbackPredictor: {
        accent: '#8B5CF6',
        subtitle: 'Predict if you will move to the next year based on your earned credits',
        icon: TrendingUp,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <rect width="180" height="190" rx="20" fill="#13092B" stroke="#8B5CF6" strokeWidth="2" filter="url(#ybGlow)" />
                    <g transform="translate(20, 22)">
                        <rect width="32" height="32" rx="8" fill="rgba(139,92,246,0.25)" stroke="#C4B5FD" strokeWidth="1.2" />
                        <path d="M 9 16 L 16 10 L 23 16 M 9 22 L 16 16 L 23 22" stroke="#E9D5FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="42" y="21" fill="#C4B5FD" fontSize="13" fontWeight="800">Credits Earned</text>
                    </g>

                    <text x="90" y="112" textAnchor="middle" fill="#FFFFFF" fontSize="42" fontWeight="900" fontFamily="Outfit, sans-serif">36<tspan fontSize="24" fill="#C4B5FD">/40</tspan></text>
                    <rect x="20" y="130" width="140" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
                    <rect x="20" y="130" width="126" height="10" rx="5" fill="url(#ybBarGrad)" />
                    <text x="90" y="166" textAnchor="middle" fill="#A78BFA" fontSize="11" fontWeight="700">Minimum Required: 32</text>
                </g>

                {/* Center Ascending Growth Curve with Flow Arrow */}
                <g transform="translate(215, 75)">
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 0 65 L 36 65" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#ybArrowHead)" />
                    
                    <rect x="45" y="90" width="22" height="40" rx="5" fill="#2A1454" stroke="#7C3AED" strokeWidth="1.5" />
                    <rect x="73" y="70" width="22" height="60" rx="5" fill="#3B1C78" stroke="#8B5CF6" strokeWidth="1.5" />
                    <rect x="101" y="45" width="22" height="85" rx="5" fill="#4C1D95" stroke="#A78BFA" strokeWidth="1.5" />

                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 35 110 C 65 95, 80 40, 138 10" stroke="#C084FC" strokeWidth="5" strokeLinecap="round" fill="none" filter="url(#ybGlow)" markerEnd="url(#ybArrowHead)" />
                </g>

                {/* Right Promotion Badge */}
                <g transform="translate(365, 45)">
                    <rect width="150" height="190" rx="20" fill="#13092B" stroke="rgba(167,139,250,0.6)" strokeWidth="2" filter="url(#ybGlow)" />
                    {[-40, -20, 0, 20, 40].map((dx, i) => (
                        <rect key={i} x={75 + dx} y="-6" width="6" height="16" rx="3" fill="#A78BFA" />
                    ))}

                    <text x="75" y="55" textAnchor="middle" fill="#C4B5FD" fontSize="13" fontWeight="800">Promoted to</text>
                    <text x="75" y="105" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="1">YEAR 2</text>

                    <circle cx="120" cy="148" r="18" fill="rgba(139,92,246,0.3)" stroke="#A78BFA" strokeWidth="2" />
                    <path d="M 111 148 L 117 154 L 129 142" stroke="#EDE9FE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </svg>
        )
    },
    branchChange: {
        accent: '#3B82F6',
        subtitle: 'Predict your chances of branch change based on CGPA & merit',
        icon: GitBranch,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <rect width="165" height="190" rx="20" fill="#0A1438" stroke="#3B82F6" strokeWidth="2" filter="url(#bcGlow)" />
                    <text x="82" y="38" textAnchor="middle" fill="#93C5FD" fontSize="13" fontWeight="800">Your CGPA</text>
                    <text x="82" y="92" textAnchor="middle" fill="#FFFFFF" fontSize="42" fontWeight="900" fontFamily="Outfit, sans-serif">9.25</text>

                    <path d="M 25 155 L 55 135 L 85 145 L 115 115 L 140 128" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" fill="none" />
                    {[[25,155],[55,135],[85,145],[115,115],[140,128]].map(([cx,cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                    ))}
                </g>

                {/* Center Target Bullseye with Arrow Flow Lines */}
                <g transform="translate(270, 140)">
                    <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="-75" y1="0" x2="-48" y2="0" stroke="#60A5FA" strokeWidth="2.5" markerEnd="url(#bcArrowHead)" />
                    <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="48" y1="0" x2="78" y2="0" stroke="#60A5FA" strokeWidth="2.5" markerEnd="url(#bcArrowHead)" />

                    <circle cx="0" cy="0" r="42" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="2.5" filter="url(#bcGlow)" />
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#60A5FA" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="#2563EB" />
                    <path d="M -18 -18 L -4 -4 M 18 -18 L 4 -4" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />

                    <text x="0" y="-54" textAnchor="middle" fill="#93C5FD" fontSize="12" fontWeight="700">Merit Rank</text>
                    <text x="0" y="66" textAnchor="middle" fill="#60A5FA" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">Top 15%</text>
                </g>

                {/* Right Branch Transition Card */}
                <g transform="translate(355, 45)">
                    <rect width="160" height="190" rx="20" fill="#0A1438" stroke="rgba(96,165,250,0.6)" strokeWidth="2" filter="url(#bcGlow)" />
                    
                    <text x="80" y="32" textAnchor="middle" fill="#93C5FD" fontSize="11" fontWeight="700">Current Branch</text>
                    <rect x="30" y="42" width="100" height="34" rx="10" fill="rgba(59,130,246,0.2)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
                    <text x="80" y="65" textAnchor="middle" fill="#BFDBFE" fontSize="18" fontWeight="900" letterSpacing="1">ISE</text>

                    {/* Down Arrow Flow */}
                    <g transform="translate(80, 95)" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round">
                        <line className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} x1="0" y1="-8" x2="0" y2="12" markerEnd="url(#bcArrowHead)" />
                    </g>

                    <text x="80" y="125" textAnchor="middle" fill="#93C5FD" fontSize="11" fontWeight="700">Predicted Branch</text>
                    <rect x="25" y="135" width="110" height="38" rx="10" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="2" filter="url(#bcGlow)" />
                    <text x="80" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="900" letterSpacing="1">CSE</text>
                </g>
            </svg>
        )
    },
    attendance: {
        accent: '#3B82F6',
        subtitle: 'Track your attendance percentage in each subject in real-time',
        icon: Calendar,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="140" ry="25" fill="#040D24" stroke="rgba(59,130,246,0.35)" strokeWidth="2" filter="url(#attGlow)" />
                    <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Left Wall Clock */}
                <g transform="translate(130, 110)">
                    <circle cx="0" cy="0" r="46" fill="#0A1633" stroke="#3B82F6" strokeWidth="3" filter="url(#attGlow)" />
                    <circle cx="0" cy="0" r="38" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="0" y1="0" x2="15" y2="0" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="4" fill="#60A5FA" />
                </g>

                {/* Main 3D Calendar Card */}
                <g transform="translate(190, 45)">
                    <rect width="180" height="150" rx="20" fill="url(#attGrad)" stroke="#3B82F6" strokeWidth="3" filter="url(#attGlow)" />
                    {/* Top Rings */}
                    <rect x="40" y="-8" width="10" height="20" rx="5" fill="#60A5FA" />
                    <rect x="130" y="-8" width="10" height="20" rx="5" fill="#60A5FA" />

                    {/* 2x3 Grid of Checkmarks */}
                    {[0, 1].map(r => [0, 1, 2].map(c => (
                        <g key={`${r}-${c}`} transform={`translate(${22 + c * 48}, ${35 + r * 48})`}>
                            <rect width="40" height="36" rx="8" fill="rgba(59,130,246,0.2)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5" />
                            <path d="M 11 18 L 17 24 L 29 11" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    )))}
                </g>

                {/* Bottom Right User Avatar Badge */}
                <g transform="translate(390, 160)">
                    <circle cx="0" cy="0" r="32" fill="#0A183C" stroke="#60A5FA" strokeWidth="3" filter="url(#attGlow)" />
                    <circle cx="0" cy="-6" r="10" stroke="#93C5FD" strokeWidth="2.5" fill="none" />
                    <path d="M -16 18 C -16 10, -8 8, 0 8 C 8 8, 16 10, 16 18" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#93C5FD" opacity="0.8">
                    <circle cx="100" cy="70" r="2.5" />
                    <circle cx="450" cy="80" r="2.5" />
                    <circle cx="470" cy="190" r="2" />
                </g>
            </svg>
        )
    },
    todaysClasses: {
        accent: '#10B981',
        subtitle: 'View today\'s class schedule, subjects and upcoming deadlines',
        icon: Clock,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="140" ry="25" fill="#041A10" stroke="rgba(16,185,129,0.35)" strokeWidth="2" filter="url(#tcGlow)" />
                    <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke="#34D399" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Background Calendar Card */}
                <g transform="translate(140, 45)">
                    <rect width="160" height="135" rx="18" fill="url(#tcGrad)" stroke="#10B981" strokeWidth="2.5" filter="url(#tcGlow)" />
                    <rect x="30" y="-8" width="10" height="18" rx="5" fill="#34D399" />
                    <rect x="120" y="-8" width="10" height="18" rx="5" fill="#34D399" />
                    
                    {/* Calendar Dots */}
                    {[0, 1, 2].map(r => [0, 1, 2].map(c => (
                        <circle key={`${r}-${c}`} cx={35 + c * 45} cy={45 + r * 30} r="7" fill="rgba(16,185,129,0.25)" stroke="#34D399" strokeWidth="1.5" />
                    )))}
                </g>

                {/* Leaning 3D Clock */}
                <g transform="translate(340, 130)">
                    <circle cx="0" cy="0" r="52" fill="#062417" stroke="#10B981" strokeWidth="3.5" filter="url(#tcGlow)" />
                    <circle cx="0" cy="0" r="42" fill="none" stroke="#34D399" strokeWidth="1.8" opacity="0.7" />
                    <line x1="0" y1="0" x2="0" y2="-22" stroke="#6EE7B7" strokeWidth="4" strokeLinecap="round" />
                    <line x1="0" y1="0" x2="22" y2="12" stroke="#6EE7B7" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="4.5" fill="#34D399" />
                </g>

                {/* Bell Notification Badge */}
                <g transform="translate(425, 160)">
                    <circle cx="0" cy="0" r="30" fill="#09301F" stroke="#34D399" strokeWidth="2.5" filter="url(#tcGlow)" />
                    {/* Bell Icon */}
                    <path d="M 0 -14 C -7 -14, -10 -8, -10 2 L -13 6 H 13 L 10 2 C 10 -8, 7 -14, 0 -14 Z" fill="none" stroke="#A7F3D0" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M -4 9 C -4 12, 4 12, 4 9" stroke="#A7F3D0" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#6EE7B7" opacity="0.8">
                    <circle cx="90" cy="80" r="2.5" />
                    <circle cx="470" cy="70" r="2" />
                    <circle cx="110" cy="180" r="2" />
                </g>
            </svg>
        )
    },
    timetable: {
        accent: '#8B5CF6',
        subtitle: 'Your personalized timetable with lectures, labs and breaks',
        icon: LayoutGrid,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="140" ry="25" fill="#120526" stroke="rgba(139,92,246,0.35)" strokeWidth="2" filter="url(#ttGlow)" />
                    <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Main Schedule Grid Card */}
                <g transform="translate(130, 40)">
                    <rect width="260" height="155" rx="20" fill="url(#ttGrad)" stroke="#8B5CF6" strokeWidth="3" filter="url(#ttGlow)" />
                    
                    {/* Grid Layout */}
                    <line x1="20" y1="80" x2="240" y2="80" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" />
                    <line x1="90" y1="20" x2="90" y2="135" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" />
                    <line x1="165" y1="20" x2="165" y2="135" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" />

                    {/* Book Icon (Top Left Cell) */}
                    <g transform="translate(55, 48)">
                        <path d="M -12 6 C -6 2, 0 6, 0 6 C 0 6, 6 2, 12 6 V -8 C 6 -12, 0 -8, 0 -8 C 0 -8, -6 -12, -12 -8 Z" stroke="#C4B5FD" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
                    </g>

                    {/* Lab Flask Icon (Center Cell) */}
                    <g transform="translate(128, 108)">
                        <path d="M -4 -12 H 4 M 0 -12 V -4 L -8 8 C -9 10, -7 12, -4 12 H 4 C 7 12, 9 10, 8 8 L 0 -4" stroke="#C4B5FD" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>

                    {/* Code Icon </> (Bottom Left Cell) */}
                    <g transform="translate(55, 108)">
                        <text x="0" y="4" textAnchor="middle" fill="#C4B5FD" fontSize="16" fontWeight="900" fontFamily="monospace">&lt;/&gt;</text>
                    </g>
                </g>

                {/* Clock Badge (Bottom Right) */}
                <g transform="translate(390, 155)">
                    <circle cx="0" cy="0" r="32" fill="#1A0A38" stroke="#A78BFA" strokeWidth="3" filter="url(#ttGlow)" />
                    <line x1="0" y1="0" x2="0" y2="-14" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" />
                    <line x1="0" y1="0" x2="12" y2="0" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="3" fill="#C4B5FD" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#C4B5FD" opacity="0.8">
                    <circle cx="90" cy="70" r="2.5" />
                    <circle cx="450" cy="65" r="2" />
                    <circle cx="470" cy="180" r="2.5" />
                </g>
            </svg>
        )
    },
    cgpaPlus: {
        accent: '#F59E0B',
        subtitle: 'Track your CGPA progress and semester wise performance',
        icon: Award,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="140" ry="25" fill="#1C1002" stroke="rgba(245,158,11,0.35)" strokeWidth="2" filter="url(#cgGlow)" />
                    <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* 3D Gold Star Medal Ribbon Award (Left/Center) */}
                <g transform="translate(190, 110)">
                    {/* Medal Ribbons */}
                    <path d="M -30 25 L -45 75 L -20 65 L 5 75 L -10 25 Z" fill="#2E1C03" stroke="#F59E0B" strokeWidth="2" />
                    <path d="M 10 25 L -5 75 L 20 65 L 45 75 L 30 25 Z" fill="#2E1C03" stroke="#F59E0B" strokeWidth="2" />

                    {/* Outer Medal Circular Badge */}
                    <circle cx="0" cy="-20" r="50" fill="url(#cgRibbon)" stroke="#F59E0B" strokeWidth="4" filter="url(#cgGlow)" />
                    <circle cx="0" cy="-20" r="40" fill="none" stroke="#FBBF24" strokeWidth="1.8" />
                    
                    {/* Star in Center */}
                    <path d="M 0 -40 L 5 -28 L 18 -26 L 8 -17 L 11 -4 L 0 -11 L -11 -4 L -8 -17 L -18 -26 L -5 -28 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" />
                </g>

                {/* Ascending Growth Arrow & Bar Chart (Right) */}
                <g transform="translate(340, 60)">
                    {/* Growth Arrow Line */}
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 0 85 L 65 30" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" filter="url(#cgGlow)" markerEnd="url(#cgArrowHead)" />

                    {/* Bar Chart Columns */}
                    <rect x="25" y="80" width="18" height="40" rx="4" fill="#2E1C03" stroke="#F59E0B" strokeWidth="1.5" />
                    <rect x="52" y="60" width="18" height="60" rx="4" fill="#422804" stroke="#FBBF24" strokeWidth="1.5" />
                    <rect x="79" y="35" width="18" height="85" rx="4" fill="#5E3906" stroke="#FCD34D" strokeWidth="1.8" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#FBBF24" opacity="0.85">
                    <circle cx="100" cy="70" r="2.5" />
                    <circle cx="470" cy="65" r="2" />
                    <circle cx="450" cy="180" r="2.5" />
                    <circle cx="120" cy="170" r="2" />
                </g>
            </svg>
        )
    },
    roadmaps: {
        accent: '#3B82F6',
        subtitle: 'Structured roadmaps to guide you from 1st year to placement.',
        icon: Compass,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="110" ry="22" fill="#040D24" stroke="rgba(59,130,246,0.4)" strokeWidth="2" filter="url(#rmGlow)" />
                    <ellipse cx="0" cy="15" rx="80" ry="14" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Winding 3D Road Highway */}
                <g>
                    {/* Outer Highway Glow */}
                    <path d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="#2563EB" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.4" filter="url(#rmGlow)" />
                    {/* Main Highway Path */}
                    <path d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="url(#rmRoadGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
                    {/* Center Dashed Lane */}
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 270 235 C 230 190, 310 160, 270 120 C 230 80, 280 60, 270 30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>

                {/* Top Finish Line Flag Post */}
                <g transform="translate(270, 28)">
                    <line x1="0" y1="0" x2="0" y2="-28" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 0 -28 L 26 -20 L 0 -12 Z" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" filter="url(#rmGlow)" />
                </g>

                {/* 4 Floating Circular Milestone Badges */}
                {/* 1. Target Bullseye (Top Left) */}
                <g transform="translate(210, 75)">
                    <circle cx="0" cy="0" r="24" fill="#0A183C" stroke="#3B82F6" strokeWidth="2.5" filter="url(#rmGlow)" />
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="8" fill="#2563EB" />
                    <path d="M -9 -9 L -2 -2" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* 2. Open Book (Center Left) */}
                <g transform="translate(180, 145)">
                    <circle cx="0" cy="0" r="24" fill="#0A183C" stroke="#3B82F6" strokeWidth="2.5" filter="url(#rmGlow)" />
                    <path d="M -10 4 C -5 1, 0 4, 0 4 C 0 4, 5 1, 10 4 V -6 C 5 -9, 0 -6, 0 -6 C 0 -6, -5 -9, -10 -6 Z" stroke="#93C5FD" strokeWidth="2" strokeLinejoin="round" fill="none" />
                </g>

                {/* 3. Code </> (Middle Right) */}
                <g transform="translate(350, 115)">
                    <circle cx="0" cy="0" r="24" fill="#0A183C" stroke="#3B82F6" strokeWidth="2.5" filter="url(#rmGlow)" />
                    <text x="0" y="5" textAnchor="middle" fill="#93C5FD" fontSize="14" fontWeight="900" fontFamily="monospace">&lt;/&gt;</text>
                </g>

                {/* 4. User Profile (Bottom Left) */}
                <g transform="translate(160, 205)">
                    <circle cx="0" cy="0" r="22" fill="#0A183C" stroke="#3B82F6" strokeWidth="2.5" filter="url(#rmGlow)" />
                    <circle cx="0" cy="-4" r="7" stroke="#93C5FD" strokeWidth="2" fill="none" />
                    <path d="M -11 12 C -11 6, -5 5, 0 5 C 5 5, 11 6, 11 12" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#93C5FD" opacity="0.8">
                    <circle cx="100" cy="60" r="2" />
                    <circle cx="450" cy="70" r="2.5" />
                    <circle cx="430" cy="180" r="2" />
                </g>
            </svg>
        )
    },
    sessions: {
        accent: '#8B5CF6',
        subtitle: 'Live sessions with seniors, ask questions & learn.',
        icon: Video,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <rect x="-42" y="-32" width="84" height="64" rx="20" fill="#1A0A38" stroke="#C084FC" strokeWidth="3" filter="url(#seGlow)" />
                    {/* Tail */}
                    <path d="M 0 32 L -12 44 L 12 32 Z" fill="#1A0A38" stroke="#C084FC" strokeWidth="3" strokeLinejoin="round" />
                    {/* 3 Dots */}
                    <circle cx="-18" cy="0" r="4.5" fill="#E9D5FF" />
                    <circle cx="0" cy="0" r="4.5" fill="#E9D5FF" />
                    <circle cx="18" cy="0" r="4.5" fill="#E9D5FF" />
                </g>

                {/* Center: Mentor Profile Silhouette */}
                <g transform="translate(270, 110)">
                    <circle cx="0" cy="-22" r="26" fill="#1E0B3A" stroke="#C084FC" strokeWidth="3.5" filter="url(#seGlow)" />
                    <path d="M -38 35 C -38 12, -20 8, 0 8 C 20 8, 38 12, 38 35" fill="#1E0B3A" stroke="#C084FC" strokeWidth="3.5" strokeLinecap="round" filter="url(#seGlow)" />
                </g>

                {/* Right: Video Camera Player */}
                <g transform="translate(410, 110)">
                    <rect x="-38" y="-28" width="76" height="56" rx="16" fill="#1A0A38" stroke="#C084FC" strokeWidth="3" filter="url(#seGlow)" />
                    {/* Camera Side Lens Trapezoid */}
                    <path d="M 38 -12 L 56 -22 V 22 L 38 12 Z" fill="#1A0A38" stroke="#C084FC" strokeWidth="3" strokeLinejoin="round" />
                    {/* Play Icon Inside Camera */}
                    <path d="M -8 -14 L 14 0 L -8 14 Z" fill="none" stroke="#E9D5FF" strokeWidth="3" strokeLinejoin="round" />
                </g>

                {/* Bottom Flow Connector Curve with Animated Dashes */}
                <g>
                    <path className={`flow-arrow-line ${isHovered ? 'flow-arrow-animated' : ''}`} d="M 130 160 C 180 200, 220 205, 270 185 C 320 205, 360 200, 410 160" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <circle cx="270" cy="185" r="5" fill="#E9D5FF" filter="url(#seGlow)" />
                    <circle cx="130" cy="160" r="4" fill="#C084FC" />
                    <circle cx="410" cy="160" r="4" fill="#C084FC" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#C4B5FD" opacity="0.8">
                    <circle cx="90" cy="65" r="2.5" />
                    <circle cx="460" cy="60" r="2" />
                    <circle cx="470" cy="190" r="2.5" />
                    <circle cx="80" cy="190" r="2" />
                </g>
            </svg>
        )
    },
    streaks: {
        accent: '#F59E0B',
        subtitle: 'Build daily habits and keep your streak alive.',
        icon: Flame,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="130" ry="24" fill="#1C1002" stroke="rgba(245,158,11,0.35)" strokeWidth="2" filter="url(#stGlow)" />
                    <ellipse cx="0" cy="15" rx="90" ry="15" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Background 3D Calendar Grid */}
                <g transform="translate(140, 45)">
                    <rect width="180" height="145" rx="18" fill="#1E1204" stroke="#F59E0B" strokeWidth="2.5" filter="url(#stGlow)" />
                    <rect x="40" y="-8" width="10" height="18" rx="5" fill="#FBBF24" />
                    <rect x="130" y="-8" width="10" height="18" rx="5" fill="#FBBF24" />
                    
                    {/* 2x3 Grid Tiles */}
                    {[0, 1].map(r => [0, 1, 2].map(c => (
                        <rect key={`${r}-${c}`} x={25 + c * 48} y={38 + r * 45} width="36" height="34" rx="8" fill="rgba(245,158,11,0.2)" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" />
                    )))}
                </g>

                {/* Overlapping 3D Glowing Fiery Flame (Front Right) */}
                <g transform="translate(340, 140)">
                    {/* Outer Flame Glow */}
                    <path d="M 0 50 C -35 50, -45 20, -25 -15 C -20 -25, -10 -40, 0 -60 C 15 -35, 45 -10, 45 20 C 45 50, 25 50, 0 50 Z" fill="url(#stFlame)" stroke="#FBBF24" strokeWidth="3" filter="url(#stGlow)" />
                    {/* Inner Core Flame */}
                    <path d="M 0 45 C -20 45, -25 25, -12 2 C -8 -5, -4 -15, 0 -28 C 8 -15, 25 5, 25 25 C 25 45, 15 45, 0 45 Z" fill="#FFFBEB" opacity="0.9" />
                </g>

                {/* Ambient Orbit Dash Ring */}
                <ellipse cx="270" cy="140" rx="190" ry="85" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.5" transform="rotate(-8 270 140)" />

                {/* Ambient Sparkles */}
                <g fill="#FDE68A" opacity="0.85">
                    <circle cx="90" cy="70" r="2.5" />
                    <circle cx="460" cy="75" r="2" />
                    <circle cx="440" cy="190" r="2.5" />
                </g>
            </svg>
        )
    },
    todo: {
        accent: '#10B981',
        subtitle: 'Plan your tasks and stay on track.',
        icon: CheckSquare,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="130" ry="24" fill="#041A10" stroke="rgba(16,185,129,0.35)" strokeWidth="2" filter="url(#tdGlow)" />
                    <ellipse cx="0" cy="15" rx="90" ry="15" fill="none" stroke="#34D399" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* Center 3D Task Clipboard Checklist */}
                <g transform="translate(180, 40)">
                    <rect width="180" height="160" rx="20" fill="url(#tdGrad)" stroke="#10B981" strokeWidth="3" filter="url(#tdGlow)" />
                    {/* Top Clip */}
                    <rect x="65" y="-12" width="50" height="24" rx="8" fill="#052E1D" stroke="#34D399" strokeWidth="2" />
                    <circle cx="90" cy="0" r="4" fill="#6EE7B7" />

                    {/* 3 Checklist Items */}
                    {[0, 1, 2].map(i => (
                        <g key={i} transform={`translate(28, ${42 + i * 38})`}>
                            <path d="M 0 10 L 6 16 L 16 4" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="28" y1="10" x2="120" y2="10" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
                        </g>
                    ))}
                </g>

                {/* Front Right Circular Checkmark Badge */}
                <g transform="translate(390, 160)">
                    <circle cx="0" cy="0" r="32" fill="#062B1E" stroke="#34D399" strokeWidth="3" filter="url(#tdGlow)" />
                    <circle cx="0" cy="0" r="24" fill="none" stroke="#6EE7B7" strokeWidth="1.5" opacity="0.7" />
                    <path d="M -12 0 L -3 9 L 12 -7" stroke="#A7F3D0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Left Speed Dash Lines */}
                <g stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" opacity="0.65">
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
        )
    },
    leaderboard: {
        accent: '#8B5CF6',
        subtitle: 'Compete with peers and climb to the top.',
        icon: Trophy,
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="140" ry="25" fill="#120526" stroke="rgba(139,92,246,0.4)" strokeWidth="2" filter="url(#lbGlow)" />
                    <ellipse cx="0" cy="15" rx="100" ry="16" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.6" />
                </g>

                {/* 3-Tier Podium Steps */}
                <g transform="translate(170, 130)">
                    {/* 2nd Place Step (Left) */}
                    <rect x="0" y="35" width="60" height="55" rx="8" fill="#1E0B3A" stroke="#8B5CF6" strokeWidth="2" />
                    {/* 1st Place Center Step (Center) */}
                    <rect x="68" y="10" width="64" height="80" rx="8" fill="#2A1454" stroke="#C084FC" strokeWidth="2.5" filter="url(#lbGlow)" />
                    {/* 3rd Place Step (Right) */}
                    <rect x="140" y="50" width="60" height="40" rx="8" fill="#1E0B3A" stroke="#8B5CF6" strokeWidth="2" />
                </g>

                {/* 3D Glowing Trophy Cup (Center Podium) */}
                <g transform="translate(270, 95)">
                    {/* Trophy Handles */}
                    <path d="M -26 -28 C -36 -28, -36 -5, -20 0 M 26 -28 C 36 -28, 36 -5, 20 0" stroke="#C084FC" strokeWidth="3" fill="none" />
                    {/* Trophy Cup Body */}
                    <path d="M -22 -35 H 22 L 18 0 C 12 16, -12 16, -18 0 Z" fill="url(#lbGrad)" stroke="#C084FC" strokeWidth="3" filter="url(#lbGlow)" />
                    {/* Trophy Stem & Base */}
                    <rect x="-6" y="14" width="12" height="15" fill="#3B1C78" stroke="#A78BFA" strokeWidth="1.5" />
                    <rect x="-18" y="28" width="36" height="10" rx="3" fill="#2A1454" stroke="#C084FC" strokeWidth="2" />
                    {/* Star inside Trophy */}
                    <path d="M 0 -22 L 3 -14 L 11 -13 L 5 -7 L 7 1 L 0 -4 L -7 1 L -5 -7 L -11 -13 L -3 -14 Z" fill="#E9D5FF" />
                </g>

                {/* Floating Gold Crown (Top Left) */}
                <g transform="translate(160, 90)">
                    <path d="M -20 10 L -25 -12 L -10 -2 L 0 -20 L 10 -2 L 25 -12 L 20 10 Z" fill="rgba(245,158,11,0.2)" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" filter="url(#lbGlow)" />
                    <circle cx="0" cy="-20" r="3" fill="#FBBF24" />
                    <circle cx="-25" cy="-12" r="2.5" fill="#FBBF24" />
                    <circle cx="25" cy="-12" r="2.5" fill="#FBBF24" />
                </g>

                {/* Floating User Profile Silhouette (Top Right) */}
                <g transform="translate(380, 120)">
                    <circle cx="0" cy="-12" r="14" stroke="#C084FC" strokeWidth="2.5" fill="none" />
                    <path d="M -20 18 C -20 5, -10 3, 0 3 C 10 3, 20 5, 20 18" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>

                {/* Ambient Sparkles */}
                <g fill="#C4B5FD" opacity="0.85">
                    <circle cx="90" cy="65" r="2.5" />
                    <circle cx="460" cy="60" r="2" />
                    <circle cx="470" cy="190" r="2.5" />
                    <circle cx="80" cy="190" r="2" />
                </g>
            </svg>
        )
    },
    whatsapp: {
        accent: '#25D366',
        bgGradient: 'radial-gradient(circle at 50% 40%, rgba(37, 211, 102, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-28px, -12px)', opacity: 0.8 }}>
                    <Users size={34} color="#86EFAC" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 12px)', opacity: 0.85 }}>
                    <Sparkles size={28} color="#4ADE80" strokeWidth={2} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(37, 211, 102, 0.45))' }}>
                    <MessageSquare size={54} color={accent} strokeWidth={1.8} fill="rgba(37, 211, 102, 0.25)" />
                </div>
            </>
        )
    },
    subjectRegistration: {
        accent: '#8B5CF6',
        subtitle: 'Set up your current semester and subjects.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-32px, -16px) rotate(-12deg)', opacity: 0.7 }}>
                    <BookOpen size={38} color="#C4B5FD" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(32px, -18px) rotate(14deg)', opacity: 0.85 }}>
                    <GraduationCap size={42} color="#A78BFA" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 20px rgba(139, 92, 246, 0.5))' }}>
                    <CheckSquare size={58} color={accent} strokeWidth={1.8} fill="rgba(139, 92, 246, 0.25)" />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(28px, 22px)', opacity: 0.9 }}>
                    <Sparkles size={24} color="#DDD6FE" strokeWidth={2} />
                </div>
            </>
        )
    },
    sgpaGpa: {
        accent: '#10B981',
        subtitle: 'Calculate your semester result and track your CGPA.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -14px)', opacity: 0.75 }}>
                    <TrendingUp size={38} color="#6EE7B7" strokeWidth={2} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -16px)', opacity: 0.85 }}>
                    <Trophy size={36} color="#A7F3D0" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 20px rgba(16, 185, 129, 0.5))' }}>
                    <Calculator size={56} color={accent} strokeWidth={1.8} fill="rgba(16, 185, 129, 0.25)" />
                </div>
            </>
        )
    },
    academicSummary: {
        accent: '#EC4899',
        subtitle: 'Review your complete academic journey.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(236, 72, 153, 0.35) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent) => (
            <>
                <div style={{ position: 'absolute', transform: 'translate(-30px, -14px)', opacity: 0.75 }}>
                    <BarChart3 size={38} color="#F472B6" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'absolute', transform: 'translate(30px, -16px)', opacity: 0.85 }}>
                    <Award size={38} color="#F472B6" strokeWidth={1.8} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 20px rgba(236, 72, 153, 0.5))' }}>
                    <GraduationCap size={58} color={accent} strokeWidth={1.8} fill="rgba(236, 72, 153, 0.25)" />
                </div>
            </>
        )
    },
    labPrograms: {
        accent: '#A855F7',
        subtitle: 'Practice and master your college lab programs.',
        bgGradient: 'radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.28) 0%, rgba(9, 5, 20, 0.98) 100%)',
        render: (accent, isHovered) => (
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
                    <ellipse cx="0" cy="15" rx="145" ry="24" fill="#0C051D" stroke="rgba(168,85,247,0.4)" strokeWidth="2" filter="url(#lpGlow)" />
                    <ellipse cx="0" cy="15" rx="105" ry="15" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.65" />
                </g>

                {/* 2. Connecting Flow Paths from Languages to Main IDE */}
                <g stroke="#C084FC" strokeWidth="2" opacity="0.75">
                    {/* C connector */}
                    <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 115 85 C 135 85, 140 100, 155 105" />
                    {/* C++ connector */}
                    <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 125 170 C 145 170, 145 155, 155 145" />
                    {/* Java connector */}
                    <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 425 85 C 405 85, 400 100, 385 105" />
                    {/* Python connector */}
                    <path className={`lp-flow-line ${isHovered ? 'lp-flow-animated' : ''}`} d="M 415 170 C 395 170, 395 155, 385 145" />
                </g>

                {/* 3. Left Language Badges: C & C++ */}
                {/* C Badge */}
                <g transform="translate(35, 55)">
                    <rect width="80" height="60" rx="14" fill="url(#cGrad)" stroke="#38BDF8" strokeWidth="1.8" filter="url(#lpSoftGlow)" />
                    <text x="40" y="32" textAnchor="middle" fill="#38BDF8" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">C</text>
                    <text x="40" y="48" textAnchor="middle" fill="#93C5FD" fontSize="10" fontWeight="700" letterSpacing="0.8">PROGRAM</text>
                    <circle cx="68" cy="14" r="3" fill="#38BDF8" />
                </g>

                {/* C++ Badge */}
                <g transform="translate(38, 140)">
                    <rect width="88" height="60" rx="14" fill="url(#cppGrad)" stroke="#818CF8" strokeWidth="1.8" filter="url(#lpSoftGlow)" />
                    <text x="44" y="32" textAnchor="middle" fill="#A5B4FC" fontSize="20" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">C++</text>
                    <text x="44" y="48" textAnchor="middle" fill="#C7D2FE" fontSize="10" fontWeight="700" letterSpacing="0.8">OOP LAB</text>
                    <circle cx="76" cy="14" r="3" fill="#818CF8" />
                </g>

                {/* 4. Right Language Badges: Java & Python */}
                {/* Java Badge */}
                <g transform="translate(425, 55)">
                    <rect width="80" height="60" rx="14" fill="url(#javaGrad)" stroke="#F59E0B" strokeWidth="1.8" filter="url(#lpSoftGlow)" />
                    <text x="40" y="32" textAnchor="middle" fill="#FBBF24" fontSize="19" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">Java</text>
                    <text x="40" y="48" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="700" letterSpacing="0.8">LAB CODE</text>
                    <circle cx="68" cy="14" r="3" fill="#F59E0B" />
                </g>

                {/* Python Badge */}
                <g transform="translate(414, 140)">
                    <rect width="88" height="60" rx="14" fill="url(#pyGrad)" stroke="#10B981" strokeWidth="1.8" filter="url(#lpSoftGlow)" />
                    <text x="44" y="32" textAnchor="middle" fill="#34D399" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="0.5">Python</text>
                    <text x="44" y="48" textAnchor="middle" fill="#A7F3D0" fontSize="10" fontWeight="700" letterSpacing="0.8">DATA LAB</text>
                    <circle cx="76" cy="14" r="3" fill="#10B981" />
                </g>

                {/* 5. Center Code Terminal / IDE Window */}
                <g transform="translate(155, 30)">
                    {/* Main Window Box */}
                    <rect width="230" height="175" rx="18" fill="url(#lpWindowGrad)" stroke="#A855F7" strokeWidth="2.5" filter="url(#lpGlow)" />
                    
                    {/* Title Bar Header */}
                    <path d="M 0 18 C 0 8, 8 0, 18 0 H 212 C 222 0, 230 8, 230 18 V 32 H 0 Z" fill="url(#lpHeaderGrad)" />
                    <line x1="0" y1="32" x2="230" y2="32" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />

                    {/* Window Controls (Red, Amber, Green) */}
                    <circle cx="16" cy="16" r="4" fill="#F43F5E" />
                    <circle cx="28" cy="16" r="4" fill="#F59E0B" />
                    <circle cx="40" cy="16" r="4" fill="#10B981" />

                    {/* Active Tab */}
                    <g transform="translate(58, 6)">
                        <rect width="105" height="20" rx="6" fill="url(#lpTabGrad)" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
                        {/* Terminal Icon */}
                        <path d="M 10 7 L 14 10 L 10 13 M 16 13 H 20" stroke="#C084FC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="58" y="14" textAnchor="middle" fill="#E9D5FF" fontSize="10" fontWeight="700" fontFamily="monospace">lab_suite.c</text>
                    </g>

                    {/* Line Numbers Gutter */}
                    <g fill="#7C3AED" fontSize="10.5" fontFamily="monospace" fontWeight="600" opacity="0.75">
                        <text x="16" y="56">1</text>
                        <text x="16" y="76">2</text>
                        <text x="16" y="96">3</text>
                        <text x="16" y="116">4</text>
                        <text x="16" y="136">5</text>
                        <text x="16" y="156">6</text>
                    </g>
                    <line x1="28" y1="40" x2="28" y2="165" stroke="rgba(168,85,247,0.2)" strokeWidth="1" />

                    {/* Code Syntax Highlighting Lines */}
                    {/* Line 1: #include <stdio.h> */}
                    <g transform="translate(36, 56)" fontFamily="monospace" fontSize="11" fontWeight="600">
                        <text x="0" y="0" fill="#F472B6">#include</text>
                        <text x="56" y="0" fill="#38BDF8">&lt;stdio.h&gt;</text>
                    </g>

                    {/* Line 2: void runCollegeLab() { */}
                    <g transform="translate(36, 76)" fontFamily="monospace" fontSize="11" fontWeight="600">
                        <text x="0" y="0" fill="#818CF8">void</text>
                        <text x="32" y="0" fill="#FCD34D">runCollegeLab</text>
                        <text x="114" y="0" fill="#E2E8F0">{"() {"}</text>
                    </g>

                    {/* Line 3: // compile & test code */}
                    <g transform="translate(48, 96)" fontFamily="monospace" fontSize="10" fontWeight="500">
                        <text x="0" y="0" fill="#6EE7B7">// compile &amp; test code</text>
                    </g>

                    {/* Line 4: execute_lab(cases); */}
                    <g transform="translate(48, 116)" fontFamily="monospace" fontSize="11" fontWeight="600">
                        <text x="0" y="0" fill="#C084FC">execute_lab</text>
                        <text x="74" y="0" fill="#E2E8F0">(cases);</text>
                    </g>

                    {/* Line 5: return SUCCESS; */}
                    <g transform="translate(48, 136)" fontFamily="monospace" fontSize="11" fontWeight="600">
                        <text x="0" y="0" fill="#F472B6">return</text>
                        <text x="46" y="0" fill="#34D399">SUCCESS;</text>
                    </g>

                    {/* Line 6: } + Pulsing Cursor */}
                    <g transform="translate(36, 156)" fontFamily="monospace" fontSize="11" fontWeight="700">
                        <text x="0" y="0" fill="#E2E8F0">{"}"}</text>
                        <rect className="lp-cursor" x="14" y="-10" width="7" height="12" rx="1.5" fill="#34D399" />
                    </g>
                </g>

                {/* 6. Floating Status Pill / Badge on Terminal */}
                <g transform="translate(290, 178)">
                    <rect width="112" height="28" rx="9" fill="#0C2419" stroke="#10B981" strokeWidth="1.5" filter="url(#lpSoftGlow)" />
                    {/* Checkmark */}
                    <circle cx="15" cy="14" r="7" fill="rgba(16,185,129,0.25)" stroke="#34D399" strokeWidth="1.2" />
                    <path d="M 12 14 L 14 16 L 18 12" stroke="#6EE7B7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="63" y="18" textAnchor="middle" fill="#6EE7B7" fontSize="10.5" fontWeight="800" fontFamily="Outfit, sans-serif" letterSpacing="0.4">LAB READY</text>
                </g>

                {/* 7. Ambient Sparkles / Tech Accents */}
                <g fill="#E9D5FF" opacity="0.85">
                    <circle cx="75" cy="35" r="2" />
                    <circle cx="465" cy="38" r="2.5" />
                    <circle cx="475" cy="215" r="2" />
                    <circle cx="70" cy="220" r="2.5" />
                    <circle cx="270" cy="20" r="2" />
                </g>
                
                {/* Subtle Brackets / Operators Floating */}
                <text x="135" y="45" fill="#A855F7" fontSize="14" fontWeight="800" opacity="0.4" fontFamily="monospace">&lt;/&gt;</text>
                <text x="395" y="45" fill="#A855F7" fontSize="14" fontWeight="800" opacity="0.4" fontFamily="monospace">{"{ }"}</text>
            </svg>
        )
    }
};

/**
 * IllustrationCard component strictly following prompt guidelines:
 * - 65-70% SVG Illustration Scene
 * - Module Name underneath
 * - Entire card clickable with hover lift, glow, and illustration zoom
 * - Supports subdued state with dependency tooltips
 */
const IllustrationCard = ({ 
    presetKey, 
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

    const preset = SCENE_PRESETS[presetKey] || SCENE_PRESETS.materials;
    const accent = customAccent || preset.accent;
    const bgGradient = customBgGradient || preset.bgGradient;
    const cardSubtitle = subtitle || preset.subtitle;

    const isFullHeight = ['cieAnalyzer', 'eligibilityChecker', 'yearbackPredictor', 'branchChange', 'roadmaps', 'sessions', 'subjectRegistration', 'attendance', 'sgpaGpa', 'academicSummary', 'labPrograms'].includes(presetKey) || !!subtitle;

    const handleCardClick = (e) => {
        if (isSubdued) {
            e.stopPropagation();
            setShowPopover(prev => !prev);
        } else if (onClick) {
            onClick(e);
        }
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
            aria-label={`${title}. ${isSubdued ? dependencyText || 'Complete Subject Registration first' : cardSubtitle || ''}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(e);
                }
            }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 20,
                border: isSubdued 
                    ? `1.5px solid ${hovered ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'}`
                    : `1.5px solid ${hovered || isActiveGlow ? accent : 'rgba(255, 255, 255, 0.14)'}`,
                backgroundColor: '#080415',
                opacity: isSubdued ? 0.9 : 1,
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: !isSubdued && (hovered || isActiveGlow)
                    ? `0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px ${accent}35`
                    : hovered ? '0 10px 24px rgba(0, 0, 0, 0.5)' : '0 6px 16px rgba(0, 0, 0, 0.4)',
                overflow: 'visible',
                position: 'relative',
                height: '100%',
                userSelect: 'none',
                outline: 'none',
            }}
        >
            {/* INNER CARD WRAPPER TO KEEP CORNER RADIUS OVERFLOW HIDDEN */}
            <div style={{ borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* ILLUSTRATION AREA */}
                <div style={{
                    height: isFullHeight ? 150 : 130,
                    background: bgGradient,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    filter: isSubdued ? 'brightness(0.95)' : 'none',
                    transition: 'filter 0.25s ease',
                }}>
                    {/* Background Ambient Glow */}
                    <div style={{
                        position: 'absolute',
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        backgroundColor: `${accent}${isSubdued ? '18' : '25'}`,
                        filter: 'blur(32px)',
                        pointerEvents: 'none',
                    }} />

                    {/* Composed SVG Scene Container */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: hovered ? 'scale(1.03)' : 'scale(1)',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}>
                        {preset.render(accent, hovered)}
                    </div>
                </div>

                {/* MODULE CONTENT AREA */}
                <div style={{
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#0B061A',
                    flex: 1,
                    gap: 12,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <h3 style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: hovered ? '#FFFFFF' : isSubdued ? '#E2E8F0' : '#F1F5F9',
                            margin: 0,
                            fontFamily: 'Outfit, sans-serif',
                            letterSpacing: '-0.01em',
                            transition: 'color 0.15s ease'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: isSubdued ? '#8B949E' : '#94A3B8',
                            margin: 0,
                            lineHeight: 1.4,
                            fontFamily: 'Outfit, sans-serif',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {cardSubtitle}
                        </p>
                    </div>

                    {/* FOOTER CTA / DEPENDENCY BADGE */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        marginTop: 'auto',
                        minHeight: 36
                    }}>
                        {isSubdued ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#8B949E', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Complete setup first
                            </span>
                        ) : (
                            <>
                                <span style={{ 
                                    fontSize: metadataText ? 11 : 12, 
                                    fontWeight: metadataText ? 500 : 700, 
                                    color: metadataText ? '#94A3B8' : accent, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 4,
                                    fontFamily: 'Outfit, sans-serif',
                                    letterSpacing: metadataText ? '0.01em' : 'normal'
                                }}>
                                    {metadataText || ctaText || 'Continue →'}
                                </span>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {metadataText && (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: hovered ? '#FFFFFF' : accent, fontFamily: 'Outfit, sans-serif', transition: 'color 0.15s ease' }}>
                                            {ctaText || 'Explore →'}
                                        </span>
                                    )}
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        border: `1px solid ${hovered ? accent : 'rgba(255, 255, 255, 0.12)'}`,
                                        backgroundColor: hovered ? `${accent}25` : 'rgba(255, 255, 255, 0.03)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0
                                    }}>
                                        <ArrowRight size={15} color={hovered ? accent : '#94A3B8'} style={{ transition: 'transform 0.2s ease', transform: hovered ? 'translateX(2px)' : 'none' }} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* DEPENDENCY POPOVER TOOLTIP FOR SUBDUED CARDS */}
            {isSubdued && (showPopover || hovered) && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 16px)',
                    maxWidth: 320,
                    zIndex: 50,
                    backgroundColor: '#0F0926',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.85), 0 0 20px rgba(139,92,246,0.25)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    pointerEvents: 'auto',
                }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#E2E8F0', lineHeight: 1.4, fontFamily: 'Outfit, sans-serif' }}>
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
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '6px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                width: 'fit-content',
                                alignSelf: 'flex-start',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                            }}
                        >
                            Go to Registration →
                        </button>
                    )}
                    {/* Tooltip Arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '7px solid transparent',
                        borderRight: '7px solid transparent',
                        borderTop: '7px solid #0F0926',
                    }} />
                </div>
            )}
        </div>
    );
};

export default IllustrationCard;
