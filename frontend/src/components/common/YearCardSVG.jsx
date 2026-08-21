import React, { useState } from 'react';

/**
 * Reusable YearCardSVG Component
 * Exact 1:1 match to design reference:
 * - Huge 3D Glowing Center Number standing on a 3-step illuminated pedestal
 * - Left column: Glass "SUBJECTS" card with subject pills + 3D Bookshelf & Plant illustration at bottom left
 * - Right column: 5 Vertically Stacked Glass Tiles (Notes, PYQs, Q Banks, Others, AI Assist 24/7)
 * - Animated neon circuit connector lines
 * - Dynamic DB numbers rendered inside the right tiles and bottom card text bar
 */

const YEAR_METADATA = {
    1: {
        number: "1",
        badgeText: "FIRST YEAR",
        title: "First Year",
        subjectCount: 16,
        resourceCount: 0,
        topSubjects: ["Mathematics-I", "Physics", "Eng. Graphics"],
    },
    2: {
        number: "2",
        badgeText: "SECOND YEAR",
        title: "Second Year",
        subjectCount: 18,
        resourceCount: 0,
        topSubjects: ["Data Structures", "DBMS", "Operating Sys."],
    },
    3: {
        number: "3",
        badgeText: "THIRD YEAR",
        title: "Third Year",
        subjectCount: 20,
        resourceCount: 0,
        topSubjects: ["Software Eng.", "AI & ML", "Compiler Des."],
    },
    4: {
        number: "4",
        badgeText: "FOURTH YEAR",
        title: "Fourth Year",
        subjectCount: 14,
        resourceCount: 0,
        topSubjects: ["Cloud Comput.", "Cyber Security", "Capstones"],
    }
};

const YearCardSVG = ({
    year = 1,
    title,
    badgeText,
    stats, // Dynamic DB stats object: { subjects, materials, topSubjects, breakdown }
    onClick
}) => {
    const [hovered, setHovered] = useState(false);

    const data = YEAR_METADATA[year] || YEAR_METADATA[1];
    const yearNumber = data.number;
    const badgeLabel = badgeText || data.badgeText;
    const cardTitle = title || data.title;
    const accentColor = '#8B5CF6';

    // DYNAMIC DB STATS CALCULATIONS
    const subjectCountDisplay = (stats && stats.subjects !== undefined) ? stats.subjects : data.subjectCount;
    const resourceCountDisplay = (stats && stats.materials !== undefined) ? stats.materials : data.resourceCount;

    // TOP SUBJECTS FROM DB
    const topSubjectsList = (stats && stats.topSubjects && stats.topSubjects.length > 0) 
        ? stats.topSubjects.slice(0, 3)
        : data.topSubjects;

    const remainingSubjectsCount = Math.max(0, subjectCountDisplay - topSubjectsList.length);

    // BREAKDOWN COUNTS FROM DB
    const totalMat = resourceCountDisplay || 0;
    const notesCount = (stats?.breakdown?.notes !== undefined) ? stats.breakdown.notes : Math.round(totalMat * 0.55);
    const pyqsCount = (stats?.breakdown?.pyqs !== undefined) ? stats.breakdown.pyqs : Math.round(totalMat * 0.25);
    const qbanksCount = (stats?.breakdown?.qbanks !== undefined) ? stats.breakdown.qbanks : Math.round(totalMat * 0.12);
    const othersCount = (stats?.breakdown?.others !== undefined) ? stats.breakdown.others : Math.max(0, totalMat - notesCount - pyqsCount - qbanksCount);

    // SUBTITLE FORMAT
    const subtitleText = totalMat > 0 
        ? `${subjectCountDisplay} Subjects • ${totalMat} Resources`
        : `${subjectCountDisplay} Subjects • Resources Coming Soon`;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
            style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 20,
                border: `1.5px solid ${hovered ? 'rgba(167, 139, 250, 0.6)' : 'rgba(255, 255, 255, 0.09)'}`,
                backgroundColor: '#090518',
                cursor: 'pointer',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hovered 
                    ? `0 22px 45px -10px rgba(0, 0, 0, 0.8), 0 0 35px ${accentColor}40`
                    : '0 8px 24px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                height: '100%',
                userSelect: 'none',
                outline: 'none',
            }}
        >
            {/* CSS KEYFRAME ANIMATIONS FOR CIRCUITS & SPARKLES */}
            <style>{`
                @keyframes circuitFlow_${year} {
                    0% { stroke-dashoffset: 40; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes pulseGlow_${year} {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }
            `}</style>

            {/* TOP ILLUSTRATION BANNER (185px Height - Slightly Larger than Tools Cards) */}
            <div style={{
                height: 185,
                background: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.28) 0%, rgba(6, 4, 16, 0.98) 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            }}>
                {/* Background Rays & Grid Lines */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.4,
                    pointerEvents: 'none',
                }} />

                {/* SVG Canvas */}
                <svg
                    viewBox="0 0 720 540"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                    }}
                >
                    <defs>
                        {/* Glow & Gradient Defs */}
                        <filter id={`intenseGlow_${year}`} x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation={hovered ? "22" : "14"} result="blur1" />
                            <feGaussianBlur stdDeviation={hovered ? "10" : "6"} result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur1" />
                                <feMergeNode in="blur2" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <filter id={`tileShadow_${year}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.6" />
                        </filter>

                        <linearGradient id={`numGrad_${year}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="35%" stopColor="#EDE9FE" />
                            <stop offset="100%" stopColor="#C4B5FD" />
                        </linearGradient>

                        <linearGradient id={`pedestalTopGrad_${year}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4C1D95" />
                            <stop offset="100%" stopColor="#1E0B40" />
                        </linearGradient>
                    </defs>

                    {/* ══════════════════════════════════════════════════════════════════
                       1. CENTER: HUGE 3D GLOWING NUMBER & ILLUMINATED PEDESTAL
                    ══════════════════════════════════════════════════════════════════ */}
                    <g transform="translate(360, 0)">

                        {/* Pedestal Ambient Underglow */}
                        <ellipse cx="0" cy="560" rx={hovered ? "190" : "165"} ry={hovered ? "55" : "48"} fill="#8B5CF6" opacity={hovered ? "0.85" : "0.55"} filter={`url(#intenseGlow_${year})`} />
                        <ellipse cx="0" cy="560" rx="145" ry="38" fill="#C4B5FD" opacity="0.9" filter={`url(#intenseGlow_${year})`} />

                        {/* 3-Step 3D Circular Pedestal */}
                        {/* Base Step 1 */}
                        <ellipse cx="0" cy="555" rx="175" ry="46" fill="#12092D" stroke="#6D28D9" strokeWidth="2.8" />
                        <path d="M -175 555 A 175 46 0 0 0 175 555 L 175 570 A 175 46 0 0 1 -175 570 Z" fill="#0C0520" />
                        
                        {/* Middle Step 2 */}
                        <ellipse cx="0" cy="535" rx="148" ry="38" fill="url(#pedestalTopGrad_1)" stroke="#8B5CF6" strokeWidth="3" />
                        <path d="M -148 535 A 148 38 0 0 0 148 535 L 148 548 A 148 38 0 0 1 -148 548 Z" fill="#190B38" />

                        {/* Top Step 3 */}
                        <ellipse cx="0" cy="515" rx="118" ry="30" fill="#3B1C7E" stroke="#A78BFA" strokeWidth="3.2" />
                        <ellipse cx="0" cy="515" rx="95" ry="22" fill="#7C3AED" opacity="0.6" />

                        {/* GIGANTIC 3D GLOWING HERO NUMBER */}
                        <g transform={`translate(0, ${hovered ? '460' : '470'})`} style={{ transition: 'transform 0.3s ease' }}>
                            <text
                                x="0"
                                y="0"
                                textAnchor="middle"
                                fill={`url(#numGrad_${year})`}
                                stroke="#A78BFA"
                                strokeWidth="5"
                                fontSize="340"
                                fontWeight="900"
                                fontFamily="Outfit, sans-serif"
                                filter={`url(#intenseGlow_${year})`}
                                style={{ letterSpacing: '-0.04em' }}
                            >
                                {yearNumber}
                            </text>
                        </g>
                    </g>

                    {/* ══════════════════════════════════════════════════════════════════
                       2. LEFT COLUMN: GLASS SUBJECTS CARD + 3D BOOKSHELF ART
                    ══════════════════════════════════════════════════════════════════ */}
                    <g transform="translate(32, 0)">
                        {/* GLASS SUBJECTS CARD */}
                        <g transform={`translate(0, 110) ${hovered ? 'translate(0, -4)' : 'translate(0, 0)'}`} style={{ transition: 'transform 0.3s ease' }}>
                            <rect width="215" height="280" rx="22" fill="#11092D" fillOpacity="0.94" stroke={hovered ? '#A78BFA' : 'rgba(139, 92, 246, 0.5)'} strokeWidth="1.8" filter={`url(#tileShadow_${year})`} />
                            
                            {/* 📖 SUBJECTS HEADER */}
                            <g transform="translate(20, 24)">
                                <rect x="0" y="0" width="34" height="34" rx="10" fill="rgba(139, 92, 246, 0.22)" stroke="#A78BFA" strokeWidth="1.2" />
                                <path d="M 9 13 C 9 13, 14 11, 17 13 L 17 25 C 14 23, 9 25, 9 25 Z" fill="rgba(167, 139, 250, 0.4)" stroke="#A78BFA" strokeWidth="1.8" />
                                <path d="M 17 13 C 17 13, 20 11, 25 13 L 25 25 C 20 23, 17 25, 17 25 Z" fill="rgba(167, 139, 250, 0.4)" stroke="#A78BFA" strokeWidth="1.8" />
                                
                                <text x="46" y="23" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="Outfit, sans-serif" letterSpacing="1.2">SUBJECTS</text>
                            </g>

                            {/* Inner Divider */}
                            <line x1="20" y1="74" x2="195" y2="74" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" />

                            {/* Subject Item Pills */}
                            {topSubjectsList.map((subName, idx) => (
                                <g key={idx} transform={`translate(18, ${90 + idx * 44})`}>
                                    <rect width="179" height="34" rx="10" fill="rgba(139, 92, 246, 0.14)" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="1" />
                                    <circle cx="14" cy="17" r="4" fill="#A78BFA" />
                                    <text x="28" y="22" fill="#EDE9FE" fontSize="13" fontWeight="700">
                                        {subName.length > 17 ? subName.substring(0, 15) + '…' : subName}
                                    </text>
                                </g>
                            ))}

                            {/* Remaining Count Pill */}
                            {remainingSubjectsCount > 0 && (
                                <g transform={`translate(18, ${90 + topSubjectsList.length * 44})`}>
                                    <rect width="179" height="34" rx="10" fill="rgba(167, 139, 250, 0.1)" stroke="rgba(167, 139, 250, 0.2)" strokeWidth="1" />
                                    <text x="16" y="22" fill="#C4B5FD" fontSize="13" fontWeight="700">
                                        + {remainingSubjectsCount} more
                                    </text>
                                </g>
                            )}
                        </g>

                        {/* 3D BOOKSHELF & POTTED PLANT ART (BOTTOM LEFT) */}
                        <g transform="translate(10, 480)">
                            {/* Shelf Base Line */}
                            <rect x="0" y="115" width="200" height="8" rx="3" fill="#231346" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1" />
                            
                            {/* Standing Books */}
                            <g transform="translate(15, 25)">
                                <rect x="0" y="0" width="22" height="90" rx="4" fill="#1C0E40" stroke="#7C3AED" strokeWidth="1.8" />
                                <rect x="5" y="12" width="12" height="6" fill="#A78BFA" />
                                
                                <rect x="26" y="10" width="24" height="80" rx="4" fill="#0E1940" stroke="#2563EB" strokeWidth="1.8" />
                                <circle cx="38" cy="30" r="5" fill="#60A5FA" />
                                
                                <rect x="54" y="25" width="20" height="65" rx="4" transform="rotate(12 54 90)" fill="#09242B" stroke="#0891B2" strokeWidth="1.8" />
                            </g>

                            {/* Small Potted Plant */}
                            <g transform="translate(145, 60)">
                                <polygon points="0,55 30,55 25,28 5,28" fill="#3B1C10" stroke="#D97706" strokeWidth="1.5" />
                                <path d="M 15 28 Q 10 10 0 5" stroke="#10B981" strokeWidth="2.2" fill="none" />
                                <path d="M 15 28 Q 20 8 32 2" stroke="#10B981" strokeWidth="2.2" fill="none" />
                                <path d="M 15 28 Q 15 5 15 -5" stroke="#10B981" strokeWidth="2.5" fill="none" />
                                <ellipse cx="0" cy="5" rx="7" ry="4" transform="rotate(-30 0 5)" fill="#34D399" />
                                <ellipse cx="32" cy="2" rx="7" ry="4" transform="rotate(30 32 2)" fill="#34D399" />
                                <ellipse cx="15" cy="-5" rx="8" ry="5" fill="#34D399" />
                            </g>
                        </g>
                    </g>

                    {/* ══════════════════════════════════════════════════════════════════
                       3. RIGHT COLUMN: 4 VERTICALLY STACKED MODULE TILES (NOTES, PYQS, Q BANKS, OTHERS)
                    ══════════════════════════════════════════════════════════════════ */}
                    <g transform="translate(485, 115)">

                        {/* 1. NOTES TILE (PURPLE) */}
                        <g transform={`translate(0, 0) ${hovered ? 'translate(4, 0)' : 'translate(0, 0)'}`} style={{ transition: 'transform 0.25s ease 0.05s' }}>
                            <rect width="200" height="84" rx="18" fill="#140B30" fillOpacity="0.95" stroke="#9333EA" strokeWidth="1.8" filter={`url(#tileShadow_${year})`} />
                            <g transform="translate(16, 16)">
                                <rect width="52" height="52" rx="14" fill="rgba(147, 51, 234, 0.22)" stroke="#C084FC" strokeWidth="1.5" />
                                <path d="M 17 17 H 35 M 17 25 H 35 M 17 33 H 27" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <text x="82" y="36" fill="#C4B5FD" fontSize="14" fontWeight="700">Notes</text>
                            <text x="82" y="62" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif">{notesCount}</text>
                        </g>

                        {/* 2. PYQS TILE (BLUE) */}
                        <g transform={`translate(0, 98) ${hovered ? 'translate(4, 0)' : 'translate(0, 0)'}`} style={{ transition: 'transform 0.25s ease 0.1s' }}>
                            <rect width="200" height="84" rx="18" fill="#0A1435" fillOpacity="0.95" stroke="#2563EB" strokeWidth="1.8" filter={`url(#tileShadow_${year})`} />
                            <g transform="translate(16, 16)">
                                <rect width="52" height="52" rx="14" fill="rgba(37, 99, 235, 0.22)" stroke="#60A5FA" strokeWidth="1.5" />
                                <rect x="20" y="14" width="12" height="5" rx="1.5" fill="#60A5FA" />
                                <path d="M 17 25 H 35 M 17 33 H 35" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <text x="82" y="36" fill="#93C5FD" fontSize="14" fontWeight="700">PYQs</text>
                            <text x="82" y="62" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif">{pyqsCount}</text>
                        </g>

                        {/* 3. Q BANKS TILE (CYAN) */}
                        <g transform={`translate(0, 196) ${hovered ? 'translate(4, 0)' : 'translate(0, 0)'}`} style={{ transition: 'transform 0.25s ease 0.15s' }}>
                            <rect width="200" height="84" rx="18" fill="#061D24" fillOpacity="0.95" stroke="#0891B2" strokeWidth="1.8" filter={`url(#tileShadow_${year})`} />
                            <g transform="translate(16, 16)">
                                <rect width="52" height="52" rx="14" fill="rgba(8, 145, 178, 0.22)" stroke="#22D3EE" strokeWidth="1.5" />
                                <path d="M 18 20 C 18 20, 34 20, 34 27 C 34 33, 26 33, 26 38" stroke="#A5F3FC" strokeWidth="3.2" strokeLinecap="round" />
                                <circle cx="26" cy="43" r="2.5" fill="#A5F3FC" />
                            </g>
                            <text x="82" y="36" fill="#A5F3FC" fontSize="14" fontWeight="700">Q Banks</text>
                            <text x="82" y="62" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif">{qbanksCount}</text>
                        </g>

                        {/* 4. OTHERS TILE (AMBER/ORANGE) */}
                        <g transform={`translate(0, 294) ${hovered ? 'translate(4, 0)' : 'translate(0, 0)'}`} style={{ transition: 'transform 0.25s ease 0.2s' }}>
                            <rect width="200" height="84" rx="18" fill="#241607" fillOpacity="0.95" stroke="#D97706" strokeWidth="1.8" filter={`url(#tileShadow_${year})`} />
                            <g transform="translate(16, 16)">
                                <rect width="52" height="52" rx="14" fill="rgba(217, 119, 6, 0.22)" stroke="#FBBF24" strokeWidth="1.5" />
                                <circle cx="26" cy="23" r="7" stroke="#FDE68A" strokeWidth="2.8" fill="none" />
                                <path d="M 15 41 C 15 34, 37 34, 37 41" stroke="#FDE68A" strokeWidth="2.8" strokeLinecap="round" />
                            </g>
                            <text x="82" y="36" fill="#FDE68A" fontSize="14" fontWeight="700">Others</text>
                            <text x="82" y="62" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Outfit, sans-serif">{othersCount}</text>
                        </g>
                    </g>

                    {/* ══════════════════════════════════════════════════════════════════
                       4. CIRCUIT CONNECTOR LINES FROM CENTER TO RIGHT TILES
                    ══════════════════════════════════════════════════════════════════ */}
                    <g opacity={hovered ? "0.95" : "0.6"}>
                        <path d="M 415 360 C 445 360, 445 157, 485 157" stroke="#A855F7" strokeWidth="2" strokeDasharray="5 5" style={{ animation: hovered ? `circuitFlow_${year} 0.5s linear infinite` : 'none' }} />
                        <path d="M 415 380 C 445 380, 445 255, 485 255" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5 5" style={{ animation: hovered ? `circuitFlow_${year} 0.5s linear infinite` : 'none' }} />
                        <path d="M 415 400 C 445 400, 445 353, 485 353" stroke="#06B6D4" strokeWidth="2" strokeDasharray="5 5" style={{ animation: hovered ? `circuitFlow_${year} 0.5s linear infinite` : 'none' }} />
                        <path d="M 415 420 C 445 420, 445 451, 485 451" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 5" style={{ animation: hovered ? `circuitFlow_${year} 0.5s linear infinite` : 'none' }} />
                    </g>

                </svg>
            </div>

            {/* VALUE-DRIVEN BOTTOM TITLE BAR */}
            <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#090518',
                flex: 1,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: hovered ? '#FFFFFF' : '#CBD5E1',
                        fontFamily: 'Outfit, sans-serif',
                        transition: 'color 0.15s ease',
                    }}>
                        {subtitleText}
                    </span>
                </div>

                {/* Animated Action Arrow */}
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    backgroundColor: hovered ? 'rgba(167, 139, 250, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${hovered ? '#A78BFA' : 'rgba(255, 255, 255, 0.08)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: hovered ? '#FFFFFF' : '#94A3B8',
                    transition: 'all 0.2s ease',
                    transform: hovered ? 'translateX(4px)' : 'none'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default YearCardSVG;
