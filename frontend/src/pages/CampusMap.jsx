import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Minus, RotateCcw, Landmark, Sun, Moon, Search
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   SIT TUMKUR BASE REFRACTOR TEMPLATE
   Only contains the Administration Block and the Main Gate Road
   ═══════════════════════════════════════════════════════════════════ */
const BUILDINGS = [
    {
        id: 'bvb',
        name: 'Administration Block',
        category: 'academic',
        x: 600, y: 450, w: 120, h: 120, rx: 12,
        color: '#e6e4de',
        icon: Landmark
    }
];

const LEFT_TREES = [
    { x: 545, y: 60 }, { x: 545, y: 100 }, { x: 545, y: 140 },
    { x: 545, y: 180 }, { x: 545, y: 220 }, { x: 545, y: 260 }
];

const RIGHT_TREES = [
    { x: 640, y: 60 }, { x: 640, y: 100 }, { x: 640, y: 140 },
    { x: 640, y: 180 }, { x: 640, y: 220 }, { x: 640, y: 260 }
];

const PADDY_FIELD_TREES = [
    // Left column
    { x: 367, y: 460 }, { x: 365, y: 474 }, { x: 369, y: 488 }, { x: 366, y: 502 }, { x: 368, y: 516 }, { x: 364, y: 530 }, { x: 367, y: 544 },
    // Right column
    { x: 410, y: 462 }, { x: 412, y: 476 }, { x: 408, y: 490 }, { x: 411, y: 504 }, { x: 409, y: 518 }, { x: 413, y: 532 }, { x: 410, y: 546 }
];

const ROUNDABOUT_TREES = [
    { x: 530, y: 332 }, { x: 525, y: 360 }, { x: 520, y: 385 },
    { x: 670, y: 332 }, { x: 675, y: 360 }, { x: 680, y: 388 }
];

const SQUARE_LOOP_TREES = [
    { x: 835, y: 630 }, { x: 860, y: 675 }, { x: 825, y: 710 }, { x: 750, y: 628 }, { x: 855, y: 615 }, { x: 810, y: 665 }
];

const DOUBLE_LAWN_TREES = [
    { x: 930, y: 525 }, { x: 950, y: 585 }, { x: 935, y: 612 }, { x: 965, y: 515 }, { x: 1015, y: 520 }, { x: 1025, y: 565 }, { x: 1030, y: 610 }, { x: 975, y: 612 },
    { x: 1085, y: 520 }, { x: 1090, y: 575 }, { x: 1100, y: 612 }, { x: 1135, y: 525 }, { x: 1140, y: 585 }, { x: 1145, y: 615 }, { x: 1175, y: 520 }, { x: 1185, y: 570 }, { x: 1180, y: 610 }
];

const STREET_LAMPS = [
    { x: 600, y: 70 }, { x: 600, y: 130 }, { x: 600, y: 190 }, { x: 600, y: 250 }
];

const SEARCHABLE_LOCATIONS = [
    { id: 'kc-library', name: 'KC Library', searchNames: ['library', 'kc library', 'books'], x: 324, y: 397 },
    { id: 'mba-block', name: 'MBA Block', searchNames: ['mba', 'mba block', 'management'], x: 700, y: 105 },
    { id: 'canteen', name: 'SIT College Canteen', searchNames: ['canteen', 'food', 'snacks', 'cafeteria', 'sit college canteen'], x: 980, y: 750 },
    { id: 'birla-auditorium', name: 'Birla Auditorium', searchNames: ['birla auditorium', 'auditorium', 'hall'], x: 807, y: 447 },
    { id: 'golden-jubilee', name: 'Golden Jubilee Building', searchNames: ['golden jubilee', 'jubilee', 'golden jubilee building'], x: 365, y: 650 },
    { id: 'amenities', name: 'Amenities', searchNames: ['amenities', 'shops', 'services'], x: 360, y: 717 },
    { id: 'civil-block', name: 'Civil Block', searchNames: ['civil', 'civil block', 'civil engineering'], x: 535, y: 606 },
    { id: 'parking-civil', name: 'Parking (Civil Block)', searchNames: ['parking', 'parking lot', 'parking civil', 'car parking'], x: 527, y: 686 },
    { id: 'science-lab', name: 'Physics and Chemistry Lab', searchNames: ['lab', 'science lab', 'physics lab', 'chemistry lab', 'physics and chemistry lab'], x: 750, y: 582 },
    { id: 'chemistry-block', name: 'Chemistry Block', searchNames: ['chemistry block', 'chemistry'], x: 680, y: 622 },
    { id: 'cse-block', name: 'CSE Block (Computer Science)', searchNames: ['cse', 'cse block', 'computer science', 'computer science building'], x: 718, y: 686 },
    { id: 'media-centre', name: 'Media Centre', searchNames: ['media', 'media centre', 'news'], x: 718, y: 764 },
    { id: 'mg-hostel', name: 'MG Block Hostel', searchNames: ['mg block hostel', 'hostel mg', 'mg hostel'], x: 717, y: 821 },
    { id: 'bio-centre', name: 'Bio Centre', searchNames: ['bio centre', 'biology'], x: 360, y: 756 },
    { id: 'bio-plant', name: 'Bio Plant', searchNames: ['bio plant'], x: 528, y: 769 },
    { id: 'indoor-stadium', name: 'Sit Indoor Stadium', searchNames: ['indoor stadium', 'stadium', 'sports', 'gym'], x: 92, y: 425 },
    { id: 'bio-tech', name: 'Bio Technology Block', searchNames: ['bio technology', 'bio tech', 'bio technology block'], x: 195, y: 364 },
    { id: 'electrical-block', name: 'Electrical Block', searchNames: ['electrical', 'electrical block', 'eee'], x: 185, y: 522 },
    { id: 'workshop', name: 'Workshop', searchNames: ['workshop', 'mech workshop'], x: 195, y: 707 },
    { id: 'ece-block', name: 'Dept. of Electronics & Communication', searchNames: ['ece', 'ece block', 'electronics', 'communication', 'dept of electronics'], x: 195, y: 753 },
    { id: 'health-centre', name: 'Sit Health Centre', searchNames: ['health centre', 'hospital', 'clinic', 'medical', 'sit health centre'], x: 1042, y: 666 },
    { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Block Hostel', searchNames: ['allamaprabhu', 'allamaprabhu block hostel', 'hostel allama'], x: 1175, y: 669 },
    { id: 'basaveshwara-hostel', name: 'Basaveshwara Block Hostel', searchNames: ['basaveshwara', 'basaveshwara block hostel', 'hostel basava'], x: 1337, y: 564 },
    { id: 'lbs-hostel', name: 'LBS Hostel', searchNames: ['lbs', 'lbs hostel', 'lbs hostel block'], x: 1475, y: 565 },
    { id: 'admin-block', name: 'Administration Block', searchNames: ['admin', 'admin block', 'office', 'administration block'], x: 600, y: 475 },
    { id: 'arch-mca-block', name: 'Architecture & MCA Block', searchNames: ['architecture', 'mca', 'mca block', 'architecture block', 'architecture and mca block'], x: 1025, y: 255 }
];

// Simple deterministic pseudo-random helper based on index and coordinates
const getTreeStyle = (t, idx) => {
    const val = Math.abs(Math.sin((t.x * 12.9898) + (t.y * 78.233) + (idx * 37)) * 43758.5453) % 1;
    const size = 0.9 + (val * 0.2); // ±10%
    const rotate = Math.floor(val * 360);
    const offsetX = -4 + ((val * 99) % 8);
    const offsetY = -4 + ((val * 999) % 8);
    const type = Math.floor(val * 4); // 4 distinct tree types
    return { size, rotate, offsetX, offsetY, type };
};

const renderTreeCanopy = (type) => {
    if (type === 0) {
        return (
            <>
                <circle cx="0" cy="0" r="12" fill="#1b4d3e" />
                <circle cx="-3" cy="-3" r="8" fill="#2d6a4f" opacity="0.9" />
                <circle cx="4" cy="-2" r="7" fill="#40916c" opacity="0.85" />
                <circle cx="-1" cy="4" r="8" fill="#52b788" opacity="0.8" />
                <circle cx="2" cy="3" r="5" fill="#74c69d" opacity="0.9" />
                <circle cx="0" cy="-4" r="4" fill="#95d5b2" opacity="0.95" />
            </>
        );
    } else if (type === 1) {
        return (
            <>
                <ellipse cx="0" cy="0" rx="9" ry="13" fill="#143d31" />
                <ellipse cx="-2" cy="-2" rx="6" ry="10" fill="#2d6a4f" opacity="0.95" />
                <ellipse cx="2" cy="1" rx="5" ry="8" fill="#40916c" opacity="0.9" />
                <ellipse cx="0" cy="3" rx="3" ry="5" fill="#52b788" opacity="0.85" />
            </>
        );
    } else if (type === 2) {
        return (
            <>
                <circle cx="0" cy="0" r="10" fill="#1e4620" />
                <circle cx="-5" cy="-3" r="7" fill="#2d6a4f" opacity="0.9" />
                <circle cx="5" cy="-3" r="7" fill="#2d6a4f" opacity="0.9" />
                <circle cx="-4" cy="4" r="6" fill="#40916c" opacity="0.85" />
                <circle cx="5" cy="4" r="6" fill="#40916c" opacity="0.85" />
                <circle cx="0" cy="-5" r="5" fill="#74c69d" opacity="0.95" />
            </>
        );
    } else {
        return (
            <>
                <circle cx="0" cy="0" r="11" fill="#1b4d3e" />
                <path d="M 0,0 L -4,-3 M 0,0 L 4,-2 M 0,0 L -2,4" stroke="#5d4037" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="-4" cy="-2" r="7.5" fill="#38b000" opacity="0.8" />
                <circle cx="4" cy="-3" r="7" fill="#70e000" opacity="0.85" />
                <circle cx="0" cy="4" r="7.5" fill="#52b788" opacity="0.7" />
                <circle cx="1" cy="2" r="5" fill="#ccff33" opacity="0.9" />
            </>
        );
    }
};

export default function CampusMap() {
    const [selectedBuildingId, setSelectedBuildingId] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark');

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
            setTheme(currentTheme);
        };
        window.addEventListener('uiThemeChange', handleThemeChange);
        return () => window.removeEventListener('uiThemeChange', handleThemeChange);
    }, []);

    const isDark = theme === 'dark';
    
    // Theme Colors
    const colors = {
        bg: isDark ? '#05070C' : '#F0F0ED',
        campusBg: isDark ? '#0C101A' : '#FBFAF7',
        boundaryLine: isDark ? '#273549' : '#B9B6AE',
        text: isDark ? '#F1F5F9' : '#3d3a33',
        textMuted: isDark ? '#94A3B8' : '#64748b',
        buildingFill: isDark ? 'url(#building-grad-dark)' : 'url(#building-grad-light)',
        buildingStroke: isDark ? '#475569' : '#b5b2a9',
        roadCasing: isDark ? '#334155' : '#BFC3CA',
        roadSurface: isDark ? '#1E293B' : '#E2E8F0',
        roadDashes: isDark ? '#94A3B8' : '#ffffff',
        greenFieldBg: isDark ? '#064e3b' : '#cbebd3',
        greenFieldStroke: isDark ? '#047857' : '#9ed8ab',
        stadiumOuter: isDark ? '#78350f' : '#fef08a', 
        stadiumInner: isDark ? '#14532d' : '#dcfce7',
        lawnBg: isDark ? '#022c22' : '#c3e8cd', 
        paddyOuter: isDark ? '#78350f' : '#fef08a',
        paddyInner: isDark ? '#1e3a1e' : '#bcf0ce',
        gatePillar: isDark ? '#94A3B8' : '#64748b',
        gateIron: isDark ? '#E2E8F0' : '#1e293b',
        lampGlow: isDark ? 0.6 : 0.35,
        badgeCoffeeBg: isDark ? '#bcaaa4' : '#8d6e63',
        badgeCoffeeBorder: isDark ? '#a1887f' : '#5d4037',
        badgeSnacksBg: isDark ? '#ffb74d' : '#f97316',
        badgeSnacksBorder: isDark ? '#ffa726' : '#c2410c',
        badgeIconStroke: isDark ? '#0b0f19' : '#ffffff',
    };

    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const mapWrapperRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedLocationId, setHighlightedLocationId] = useState(null);
    const highlightTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, []);

    const handleSelectLocation = (loc) => {
        setSearchQuery('');
        setSuggestions([]);

        const targetZoom = 2.2;
        const wrapper = mapWrapperRef.current;
        const viewW = wrapper ? wrapper.clientWidth : 1600;
        const viewH = wrapper ? wrapper.clientHeight : 860;
        
        const targetPan = {
            x: viewW / 2 - loc.x * targetZoom,
            y: viewH / 2 - loc.y * targetZoom
        };

        setZoom(targetZoom);
        setPanOffset(targetPan);

        setHighlightedLocationId(loc.id);
        
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedLocationId(null);
        }, 3000);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const filtered = SEARCHABLE_LOCATIONS.filter(loc => 
            loc.name.toLowerCase().includes(normalizedQuery) ||
            loc.searchNames.some(name => name.includes(normalizedQuery))
        );
        setSuggestions(filtered);
    };

    const getBuildingClass = (id, baseClasses = 'building-card') => {
        return `${baseClasses} ${highlightedLocationId === id ? 'highlight-glow' : ''}`;
    };

    const resetView = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setSelectedBuildingId(null);
        setHighlightedLocationId(null);
    };

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.7));

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPanOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };

    // Realistic architectural plan tree symbol with randomized size, rotation, offset, and type
    const renderRealisticTree = (t, idx) => {
        const style = getTreeStyle(t, idx);
        return (
            <g 
                key={idx} 
                transform={`translate(${t.x + style.offsetX}, ${t.y + style.offsetY}) scale(${style.size}) rotate(${style.rotate})`}
            >
                {/* Soft ground shadow */}
                <circle cx="2" cy="2" r="13" fill="#0f2a1d" opacity="0.15" />
                {/* Tree canopy based on type */}
                {renderTreeCanopy(style.type)}
            </g>
        );
    };

    const activeLoc = highlightedLocationId ? SEARCHABLE_LOCATIONS.find(l => l.id === highlightedLocationId) : null;

    return (
        <div className="w-full h-[calc(100vh-64px)] overflow-hidden font-sans select-none relative" style={{ backgroundColor: colors.bg }}>
            
            {/* ── CENTRAL INTERACTIVE SVG MAP VIEWPORT ────────────────── */}
            <div 
                ref={mapWrapperRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className={`w-full h-full relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ backgroundColor: colors.bg }}
            >
                {/* ── SMART SEARCH BAR (collapsed pill → hover to expand) ────────────────── */}
                <div
                    className="absolute top-4 left-4 z-20 group"
                    style={{ maxWidth: 'calc(100vw - 32px)' }}
                >
                    <div
                        className="relative rounded-2xl backdrop-blur-md border shadow-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{
                            width: '44px',
                            background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.width = '300px';
                        }}
                        onMouseLeave={e => {
                            if (!searchQuery) {
                                e.currentTarget.style.width = '44px';
                            }
                        }}
                    >
                        {/* Brand header — only visible when expanded */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px 8px',
                            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                        }}>
                            {/* AS monogram badge */}
                            <div style={{
                                width: '22px', height: '22px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '9px',
                                fontWeight: 800,
                                color: '#fff',
                                letterSpacing: '-0.3px',
                                fontFamily: 'system-ui, sans-serif',
                            }}>
                                AS
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: isDark ? '#f1f5f9' : '#111827',
                                    fontFamily: 'system-ui, sans-serif',
                                    letterSpacing: '-0.2px',
                                    lineHeight: 1.1,
                                }}>
                                    AskUrSenior
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.75)',
                                    fontFamily: 'system-ui, sans-serif',
                                    letterSpacing: '0.1px',
                                }}>
                                    Campus Explorer
                                </div>
                            </div>
                        </div>

                        {/* Search input row */}
                        <div className="flex items-center gap-3" style={{ padding: '9px 12px', height: '42px' }}>
                            <Search
                                className="shrink-0"
                                style={{
                                    width: '18px', height: '18px',
                                    color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(100,116,139,0.85)',
                                }}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search buildings…"
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: isDark ? '#f1f5f9' : '#111827',
                                    opacity: 1,
                                    fontFamily: 'system-ui, sans-serif',
                                }}
                                className="placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                                    style={{
                                        flexShrink: 0,
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                        color: isDark ? '#94a3b8' : '#64748b',
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Suggestions Autocomplete List */}
                        {suggestions.length > 0 && (
                            <div
                                style={{
                                    borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                                    maxHeight: '240px',
                                    overflowY: 'auto',
                                }}
                            >
                                {suggestions.map((loc) => (
                                    <button
                                        key={loc.id}
                                        onClick={() => handleSelectLocation(loc)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '9px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '14px', flexShrink: 0 }}>📍</span>
                                        <div>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: isDark ? '#f1f5f9' : '#1e293b',
                                                fontFamily: 'system-ui, sans-serif',
                                            }}>
                                                {loc.name}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: isDark ? '#64748b' : '#94a3b8',
                                                fontFamily: 'system-ui, sans-serif',
                                                textTransform: 'capitalize',
                                            }}>
                                                {loc.id.split('-').join(' ')}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Floating Map Zoom Tools */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <button 
                        onClick={handleZoomIn}
                        className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"
                        title="Zoom In"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleZoomOut}
                        className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"
                        title="Zoom Out"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={resetView}
                        className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"
                        title="Fit Campus Screen"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => {
                            const nextTheme = theme === 'light' ? 'dark' : 'light';
                            setTheme(nextTheme);
                            localStorage.setItem('uiTheme', nextTheme);
                            window.dispatchEvent(new Event('uiThemeChange'));
                        }}
                        className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"
                        title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
                    >
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    </button>
                </div>

                {/* ── BLUEPRINT ANNOTATION PANEL (CAD Title Block Style) ── */}
                <div
                    className="absolute bottom-3 right-3 z-[9999] pointer-events-none select-none"
                    style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(100,116,139,0.25)',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        background: isDark ? 'rgba(5,7,12,0.55)' : 'rgba(251,250,247,0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        minWidth: '180px',
                    }}
                >
                    {/* Top rule */}
                    <div style={{
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(100,116,139,0.2)',
                        marginBottom: '5px',
                        paddingBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <div style={{
                            width: '14px', height: '14px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '7px', fontWeight: 800, color: '#fff',
                            letterSpacing: '-0.2px', fontFamily: 'system-ui, sans-serif',
                            flexShrink: 0,
                        }}>AS</div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'system-ui, sans-serif',
                            letterSpacing: '0.4px',
                            color: isDark ? 'rgba(241,245,249,0.8)' : 'rgba(30,41,59,0.85)',
                        }}>
                            AskUrSenior Mapping System™
                        </span>
                    </div>
                    {/* Blueprint rows */}
                    {[
                        ['DATASET', 'Campus Map v1.0'],
                        ['INSTITUTION', 'SIT, Tumakuru'],
                        ['REVISION', 'REV-A · 2026'],
                    ].map(([label, value]) => (
                        <div key={label} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '2px',
                        }}>
                            <span style={{
                                fontSize: '8.5px',
                                fontFamily: '"Courier New", monospace',
                                fontWeight: 600,
                                color: isDark ? 'rgba(100,116,139,0.75)' : 'rgba(100,116,139,0.7)',
                                letterSpacing: '0.5px',
                            }}>{label}</span>
                            <span style={{
                                fontSize: '8.5px',
                                fontFamily: '"Courier New", monospace',
                                color: isDark ? 'rgba(148,163,184,0.8)' : 'rgba(30,41,59,0.75)',
                                letterSpacing: '0.2px',
                            }}>{value}</span>
                        </div>
                    ))}
                    {/* Bottom copyright */}
                    <div style={{
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(100,116,139,0.15)',
                        marginTop: '4px',
                        paddingTop: '4px',
                        fontSize: '8px',
                        fontFamily: '"Courier New", monospace',
                        letterSpacing: '0.3px',
                        color: isDark ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.6)',
                    }}>
                        © 2026 AskUrSenior · Do Not Redistribute
                    </div>
                </div>

                {/* The Map canvas containing the SVG components */}
                <svg
                    viewBox="0 0 1600 860"
                    width="1600"
                    height="860"
                    className="w-full h-full select-none"
                    style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                >
                    {/* Glow and Drop Shadow filters */}
                    <defs>
                        <filter id="road-shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.10" />
                        </filter>
                        <filter id="building-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComponentTransfer in="blur" result="glow">
                                <feFuncA type="linear" slope="0.4" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        {/* Symmetrical faint grid pattern */}
                        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "#94a3b8" : "#64748b"} strokeWidth="0.8" opacity={isDark ? "0.035" : "0.025"} />
                        </pattern>
                        {/* Radial gradient for soft vignette */}
                        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0.06" />
                        </radialGradient>
                        {/* Radial gradient for soft blue fountain glow */}
                        <radialGradient id="fountain-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </radialGradient>
                        {/* Soft drop shadow for buildings */}
                        <filter id="building-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.08" />
                        </filter>
                        {/* Stronger drop shadow for hovered buildings */}
                        <filter id="building-shadow-hover" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity="0.14" />
                        </filter>
                        {/* Soft drop shadow for campus compound boundary */}
                        <filter id="boundary-shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#000000" floodOpacity="0.05" />
                        </filter>
                        {/* Radial gradient for soft vignette (Dark theme) */}
                        <radialGradient id="vignette-dark" cx="50%" cy="50%" r="70%">
                            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                        </radialGradient>
                        {/* Premium linear gradient fill with top highlight (Light theme) */}
                        <linearGradient id="building-grad-light" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f5e8dd" />
                            <stop offset="100%" stopColor="#ebdcd0" />
                        </linearGradient>
                        {/* Premium linear gradient fill with top highlight (Dark theme) */}
                        <linearGradient id="building-grad-dark" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1E293B" />
                            <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        {/* CSS Hover styling for buildings */}
                        <style>{`
                            :root {
                                --extrusion-color: ${isDark ? '#090d16' : '#b5b2a9'};
                            }

                            /* 3D Extrusion & Tilt when zoomed in */
                            .buildings-layer.is-3d .building-card {
                                transform: skewX(-12deg) translate(3px, -6px) !important;
                                filter: drop-shadow(-3px 6px 0px var(--extrusion-color)) drop-shadow(-5px 10px 8px rgba(0, 0, 0, 0.15)) !important;
                                transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), filter 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease;
                            }
                            
                            .buildings-layer.is-3d .building-card:hover {
                                transform: skewX(-12deg) scale(1.02) translate(5px, -10px) !important;
                                filter: drop-shadow(-5px 10px 0px var(--extrusion-color)) drop-shadow(-8px 16px 12px rgba(0, 0, 0, 0.2)) !important;
                            }
                            
                            .admin-card.is-3d-admin {
                                transform: skewX(-12deg) translate(3px, -6px) !important;
                                filter: drop-shadow(-3px 6px 0px var(--extrusion-color)) drop-shadow(-5px 10px 8px rgba(0, 0, 0, 0.15)) !important;
                                transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), filter 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease;
                            }
                            
                            .admin-card.is-3d-admin:hover {
                                transform: skewX(-12deg) scale(1.02) translate(5px, -10px) !important;
                                filter: drop-shadow(-5px 10px 0px var(--extrusion-color)) drop-shadow(-8px 16px 12px rgba(0, 0, 0, 0.2)) !important;
                            }

                            /* Hover transitions for building cards */
                            .building-card {
                                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease, opacity 0.3s ease;
                                transform-box: fill-box;
                                transform-origin: center;
                            }
                            
                            /* Scale up hovered building card & apply stronger shadow */
                            .building-card:hover {
                                transform: scale(1.03) !important;
                                filter: url(#building-shadow-hover) !important;
                            }
                            
                            /* Brighten borders of hovered building card */
                            .building-card:hover rect,
                            .building-card:hover polygon,
                            .building-card:hover path {
                                stroke: #3b82f6 !important;
                                stroke-width: 2.5px !important;
                            }
                            
                            /* Focus/dim effect: Dim other buildings by 15% when any building is hovered */
                            .buildings-layer:hover .building-card {
                                opacity: 0.82;
                            }
                            .buildings-layer:hover .building-card:hover {
                                opacity: 1;
                            }
                            
                            /* Also apply hover state to the Administration Block dynamic group */
                            .admin-card {
                                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease, opacity 0.3s ease;
                                transform-box: fill-box;
                                transform-origin: center;
                            }
                            .admin-card:hover {
                                transform: scale(1.03) !important;
                                filter: url(#building-shadow-hover) !important;
                            }
                            .admin-card:hover path {
                                stroke: #3b82f6 !important;
                                stroke-width: 4px !important;
                            }
                            
                            /* Glow highlight rule for searched building card */
                            .highlight-glow rect,
                            .highlight-glow polygon,
                            .highlight-glow path {
                                stroke: #3b82f6 !important;
                                stroke-width: 3.5px !important;
                                filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.9)) !important;
                            }
                            
                            /* Dim the rest of the map (roads, lawns, background) when hovering any building */
                            svg:has(.building-card:hover) .map-dimmer,
                            svg:has(.admin-card:hover) .map-dimmer {
                                opacity: 0.08;
                            }
                        `}</style>

                        {/* Path IDs for branded road microtext */}
                        <path id="brand-road-main" d="M 75 305 L 875 305 Q 895 305 895 325 L 895 840" fill="none" />
                        <path id="brand-road-horizontal" d="M 276 560 L 895 560" fill="none" />
                        <path id="brand-road-hostel" d="M 895 475 L 1222 475" fill="none" />
                        <path id="brand-road-bottom" d="M 276 735 L 895 735" fill="none" />
                        <path id="brand-boundary" d="M 600,32 L -65,32 L -65,700 L 65,700 L 65,790 L 450,790 L 450,845 L 1550,845 L 1550,32 Z" fill="none" />
                    </defs>

                    {/* Surrounding background ground (Very light gray premium color) */}
                    <rect width="1600" height="860" fill={colors.bg} />

                    {/* Irregular Campus Area Fill (Warmer cream color inside) */}
                    <path 
                        d="M 600,32 L -65,32 L -65,700 L 65,700 L 65,790 L 450,790 L 450,845 L 1550,845 L 1550,32 Z" 
                        fill={colors.campusBg} 
                    />

                    {/* Faint grid overlay */}
                    <rect width="1600" height="860" fill="url(#grid-pattern)" pointerEvents="none" />
                    {/* Soft vignette overlay */}
                    <rect width="1600" height="860" fill={isDark ? "url(#vignette-dark)" : "url(#vignette)"} pointerEvents="none" />

                    {/* Campus Compound Boundary — branded textPath border */}
                    {/* Outer glow stroke */}
                    <use href="#brand-boundary" stroke={colors.boundaryLine} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#boundary-shadow)" />
                    {/* Branded repeating text along the boundary */}
                    <text
                        fontSize="6.5"
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                        letterSpacing="3.5"
                        fill={isDark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.22)'}
                        pointerEvents="none"
                    >
                        <textPath href="#brand-boundary" startOffset="0%">
                            {'ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • ASKURSENIOR • CAMPUS MAP • SIT, TUMAKURU • '}
                        </textPath>
                    </text>
                    {/* Map Dimmer Overlay */}
                    <rect className="map-dimmer" width="1600" height="860" fill="#000000" opacity="0" pointerEvents="none" style={{ transition: 'opacity 0.3s ease' }} />

                    {/* Left Lawn Green Grass Area flanking the road - strictly bounded by compound wall at y: 280 */}
                    <rect x="500" y="32" width="76" height="248" fill={colors.lawnBg} />

                    {/* Right Lawn Green Grass Area flanking the road - narrow shoulder strip containing the tree row */}
                    <rect x="624" y="32" width="32" height="248" fill={colors.lawnBg} />

                    {/* Red Dotted Pedestrian Pathways — hidden for now */}

                    {/* Three Parking Lots along the left horizontal road (above it, below wall at y: 280) */}

                    {/* Three Parking Lots along the left horizontal road (above it, below wall at y: 280) */}
                    <g>
                        {/* 1. Left Parking Lot */}
                        <g>
                            <rect x="80" y="283" width="90" height="12" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            {/* Parking Lines */}
                            <line x1="100" y1="284" x2="100" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="115" y1="284" x2="115" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="135" y1="284" x2="135" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="150" y1="284" x2="150" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <text x="125" y="292" fill="#0984e3" fontSize="8" fontWeight="900" textAnchor="middle">P</text>
                        </g>

                        {/* 2. Middle Parking Lot (Extra-Long) */}
                        <g>
                            <rect x="220" y="283" width="210" height="12" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            {/* Parking Lines */}
                            <line x1="240" y1="284" x2="240" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="260" y1="284" x2="260" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="280" y1="284" x2="280" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="300" y1="284" x2="300" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="350" y1="284" x2="350" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="370" y1="284" x2="370" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="390" y1="284" x2="390" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="410" y1="284" x2="410" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <text x="325" y="292" fill="#0984e3" fontSize="8" fontWeight="900" textAnchor="middle">P</text>
                        </g>

                        {/* 3. Right Parking Lot */}
                        <g>
                            <rect x="500" y="283" width="50" height="12" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            {/* Parking Lines */}
                            <line x1="512" y1="284" x2="512" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="524" y1="284" x2="524" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="538" y1="284" x2="538" y2="294" stroke="#ffffff" strokeWidth="0.8" />
                            <text x="531" y="292" fill="#0984e3" fontSize="8" fontWeight="900" textAnchor="middle">P</text>
                        </g>
                    </g>

                    {/* Vector SVG Gates (Bank Gate and Back Gate) */}
                    <g>
                        {/* A. Back Gate (Centered at x: 195) */}
                        <g>
                            {/* Pillars */}
                            <rect x="177" y="274" width="4.5" height="12" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="0.8" rx="1" />
                            <rect x="213.5" y="274" width="4.5" height="12" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="0.8" rx="1" />
                            {/* Swinging Gates open inwards */}
                            <line x1="181.5" y1="280" x2="191.5" y2="288" stroke={colors.gateIron} strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="213.5" y1="280" x2="203.5" y2="288" stroke={colors.gateIron} strokeWidth="1.2" strokeLinecap="round" />
                            {/* Supporting Arch curve */}
                            <path d="M 180,277 Q 195,270 210,277" fill="none" stroke={colors.gateIron} strokeWidth="1" />
                            {/* Gate label text */}
                            <text x="195" y="269" fill={colors.text} fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.2">BACK GATE</text>
                        </g>

                        {/* B. Bank Gate (Centered at x: 465) */}
                        <g>
                            {/* Pillars */}
                            <rect x="447" y="274" width="4.5" height="12" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="0.8" rx="1" />
                            <rect x="483.5" y="274" width="4.5" height="12" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="0.8" rx="1" />
                            {/* Swinging Gates open inwards */}
                            <line x1="451.5" y1="280" x2="461.5" y2="288" stroke={colors.gateIron} strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="483.5" y1="280" x2="473.5" y2="288" stroke={colors.gateIron} strokeWidth="1.2" strokeLinecap="round" />
                            {/* Supporting Arch curve */}
                            <path d="M 450,277 Q 465,270 480,277" fill="none" stroke={colors.gateIron} strokeWidth="1" />
                            {/* Gate label text */}
                            <text x="465" y="269" fill={colors.text} fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.2">BANK GATE</text>
                        </g>
                    </g>

                    {/* Recreation, Sports Courts, Parking & Buildings Layout (Right Lawn Area) */}
                    <g>
                        {/* 1. Parking Lot (P) - Compact & Space-saving */}
                        <g>
                            {/* Angled Parking base */}
                            <polygon points="670,42 740,42 725,72 670,69" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
                            {/* White Parking lane markers */}
                            <line x1="680" y1="45" x2="682" y2="67" stroke="#ffffff" strokeWidth="1" />
                            <line x1="690" y1="45" x2="693" y2="67" stroke="#ffffff" strokeWidth="1" />
                            <line x1="710" y1="45" x2="708" y2="67" stroke="#ffffff" strokeWidth="1" />
                            <line x1="720" y1="45" x2="718" y2="67" stroke="#ffffff" strokeWidth="1" />
                            {/* Parking Blue P symbol */}
                            <text x="700" y="59" fill="#0984e3" fontSize="10" fontWeight="900" textAnchor="middle">P</text>
                        </g>

                        {/* 2. MBA Block - Compact & Space-saving */}
                        <g className={getBuildingClass('mba-block', '')}>
                            {/* Angled Building shape */}
                            <polygon points="665,79 735,90 725,132 675,124" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" />
                            {/* MBA block label */}
                            <text x="700" y="109" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle" className="tracking-wider">
                                <tspan x="700" dy="0">MBA</tspan>
                                <tspan x="700" dy="1.1em">Block</tspan>
                            </text>
                        </g>

                        {/* 3. Temple Building (Moved Up & Compact) */}
                        <g>
                            {/* Temple Base Block */}
                            <rect x="679" y="144" width="32" height="26" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="3" />
                            {/* Om Symbol */}
                            <text x="695" y="156" fill="#d84315" fontSize="10" fontWeight="bold" textAnchor="middle">🕉️</text>
                            {/* Temple Label */}
                            <text x="695" y="164" fill={colors.text} fontSize="5.2" fontWeight="900" textAnchor="middle" letterSpacing="0.1">TEMPLE</text>
                        </g>

                        {/* 4. Volleyball Court (Moved Up & Compact) */}
                        <g>
                            {/* Court Green Bed */}
                            <rect x="673" y="183" width="44" height="26" fill={isDark ? "#064e3b" : "#a9dfbf"} stroke={isDark ? "#047857" : "#27ae60"} strokeWidth="1.5" rx="1.5" />
                            {/* White Outline Boundary */}
                            <rect x="675.5" y="185.5" width="39" height="21" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                            {/* Volleyball Center Net Line */}
                            <line x1="695" y1="185.5" x2="695" y2="206.5" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                            {/* Court Label */}
                            <text x="695" y="178" fill={colors.text} fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.2">VOLLEYBALL COURT</text>
                        </g>

                        {/* 5. Basketball Court (Moved Up & Compact) */}
                        <g>
                            {/* Court Green Bed */}
                            <rect x="669" y="221" width="52" height="34" fill={isDark ? "#064e3b" : "#a9dfbf"} stroke={isDark ? "#047857" : "#27ae60"} strokeWidth="1.5" rx="1.5" />
                            {/* White Outline Boundary */}
                            <rect x="671.5" y="223.5" width="47" height="29" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                            {/* Center division line */}
                            <line x1="695" y1="223.5" x2="695" y2="252.5" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                            {/* Center Jump Circle */}
                            <circle cx="695" cy="238" r="4" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                            {/* Left Key area */}
                            <rect x="671.5" y="233" width="7" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                            <path d="M 671.5,233 L 671.5,233" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                            <path d="M 671.5,228 A 10,10 0 0,1 671.5,248" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.85" />
                            {/* Right Key area */}
                            <rect x="711.5" y="233" width="7" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
                            <path d="M 718.5,228 A 10,10 0 0,0 718.5,248" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.85" />
                            {/* Court Label */}
                            <text x="695" y="216" fill={colors.text} fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.2">BASKETBALL COURT</text>
                        </g>
                    </g>

                    {/* Double Rows of Realistic Architectural Trees flanking the Main Road Avenue */}
                    <g>
                        {LEFT_TREES.map((t, idx) => renderRealisticTree(t, `left-${idx}`))}
                        {RIGHT_TREES.map((t, idx) => renderRealisticTree(t, `right-${idx}`))}
                    </g>

                    {/* Side Campus Buildings & Sport Fields (Left/Right Sections) */}
                    <g className={`buildings-layer ${zoom >= 1.8 ? 'is-3d' : ''}`}>
                        {/* 1. KC Library Building */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('kc-library')}>
                            <rect x="287" y="342" width="75" height="110" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Book icon */}
                            <text x="324" y="392" fill={isDark ? "#cbd5e1" : "#8d6e63"} fontSize="14" textAnchor="middle">📚</text>
                            {/* Label */}
                            <text x="324" y="407" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">KC Library</text>
                            {/* AS-ID badge */}
                            <text x="356" y="352" fill={isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.3)'} fontSize="5" fontFamily='"Courier New", monospace' textAnchor="end">AS-LIB-01</text>
                        </g>

                        {/* Green Paddy Field below KC Library */}
                        <g>
                            {/* Outer Yellow Running Track */}
                            <rect x="287" y="455" width="75" height="92" fill={colors.paddyOuter} stroke={isDark ? "#b45309" : "#fde047"} strokeWidth="1.5" rx="4" opacity="0.9" />
                            {/* Main Greenery Lawn */}
                            <rect x="290" y="458" width="69" height="86" fill={colors.paddyInner} stroke={isDark ? "#047857" : "#76da97"} strokeWidth="1.5" rx="3" />
                            {/* Accent Icons */}
                            <text x="310" y="485" fill="#22c55e" fontSize="9" textAnchor="middle" opacity="0.75">🌱</text>
                            <text x="335" y="520" fill="#22c55e" fontSize="9" textAnchor="middle" opacity="0.75">🌱</text>
                            {renderRealisticTree({ x: 315, y: 515 }, 'paddy-inside')}
                        </g>

                        {/* Symmetrical tree rows flanking the red dotted road at x: 380 (Vector Trees) */}
                        <g>
                            {PADDY_FIELD_TREES.map((t, idx) => renderRealisticTree(t, `paddy-${idx}`))}
                        </g>

                        {/* 2. Kho Kho Court */}
                        <g filter="url(#building-shadow)" className="building-card">
                            <rect x="430" y="480" width="90" height="65" fill={isDark ? "#115e59" : "#80cbc4"} stroke={isDark ? "#0d9488" : "#26a69a"} strokeWidth="2" rx="7" />
                            {/* Label inside */}
                            <text x="475" y="517" fill="#1e3f20" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.2">
                                <tspan x="475" dy="0">KHO KHO</tspan>
                                <tspan x="475" dy="1.2em">COURT</tspan>
                            </text>
                        </g>

                        {/* 3. Birla Auditorium */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('birla-auditorium')}>
                            <rect x="745" y="400" width="125" height="95" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Label */}
                            <text x="807" y="445" fill={colors.text} fontSize="9.5" fontWeight="900" textAnchor="middle" className="tracking-wide">
                                <tspan x="807" dy="0">Birla</tspan>
                                <tspan x="807" dy="1.2em">Auditorium</tspan>
                            </text>
                            {/* AS-ID badge */}
                            <text x="864" y="410" fill={isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.3)'} fontSize="5" fontFamily='"Courier New", monospace' textAnchor="end">AS-AUD-02</text>
                        </g>

                        {/* 4. Golden Jubilee Building */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('golden-jubilee')}>
                            <rect x="305" y="610" width="120" height="80" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Label */}
                            <text x="365" y="650" fill={colors.text} fontSize="8.5" fontWeight="900" textAnchor="middle">
                                <tspan x="365" dy="0">Golden Jubilee</tspan>
                                <tspan x="365" dy="1.3em">Building</tspan>
                            </text>
                        </g>

                        {/* 5. Amenities */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('amenities')}>
                            <rect x="318" y="705" width="85" height="25" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="360" y="721" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">Amenities</text>
                        </g>

                        {/* 6. Civil Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('civil-block')}>
                            <rect x="470" y="572" width="130" height="68" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            <text x="535" y="609" fill={colors.text} fontSize="9" fontWeight="900" textAnchor="middle">
                                <tspan x="535" dy="0">Civil</tspan>
                                <tspan x="535" dy="1.2em">Block</tspan>
                            </text>
                        </g>

                        {/* 7. Parking (Civil Block column) */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('parking-civil')}>
                            <rect x="470" y="645" width="115" height="82" fill={isDark ? "#1E293B" : "#e8edf5"} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <line x1="500" y1="647" x2="500" y2="725" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
                            <line x1="530" y1="647" x2="530" y2="725" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
                            <line x1="560" y1="647" x2="560" y2="725" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
                            <line x1="470" y1="686" x2="585" y2="686" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
                            <text x="527" y="693" fill="#0984e3" fontSize="22" fontWeight="900" textAnchor="middle">P</text>
                        </g>

                        {/* Greenery Field inside the square road loop (rendered under buildings) */}
                        <g>
                            {/* Green field background */}
                            <rect x="630" y="570" width="255" height="155" fill={colors.greenFieldBg} stroke={colors.greenFieldStroke} strokeWidth="1.5" rx="4" />
                            {/* Decorative trees in empty spaces (Vector Trees) */}
                            {SQUARE_LOOP_TREES.map((t, idx) => renderRealisticTree(t, `square-loop-${idx}`))}
                        </g>

                        {/* Physics and Chemistry Lab */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('science-lab')}>
                            <rect x="625" y="565" width="250" height="34" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Label */}
                            <text x="750" y="586" fill={colors.text} fontSize="8.5" fontWeight="900" textAnchor="middle" className="tracking-wide">
                                Physics and Chemistry Lab
                            </text>
                        </g>

                        {/* 8. Chemistry Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('chemistry-block')}>
                            <rect x="641" y="605" width="78" height="34" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            <text x="680" y="620" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">
                                <tspan x="680" dy="0">Chemistry</tspan>
                                <tspan x="680" dy="1.1em">Block</tspan>
                            </text>
                        </g>

                        {/* 9. CSE Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('cse-block')}>
                            <rect x="641" y="645" width="155" height="82" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            <text x="718" y="687" fill={colors.text} fontSize="9" fontWeight="900" textAnchor="middle">
                                <tspan x="718" dy="0">Computer</tspan>
                                <tspan x="718" dy="1.2em">Science</tspan>
                                <tspan x="718" dy="1.2em">Building</tspan>
                            </text>
                            <text x="790" y="654" fill={isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.3)'} fontSize="5" fontFamily='"Courier New", monospace' textAnchor="end">AS-CS-09</text>
                        </g>

                        {/* 10. Media Centre */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('media-centre')}>
                            <polygon points="680,742 750,737 765,767 725,789 675,779" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" strokeLinejoin="round" />
                            <text x="718" y="764" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">
                                <tspan x="718" dy="0">Media</tspan>
                                <tspan x="718" dy="1.2em">Centre</tspan>
                            </text>
                            <text x="762" y="747" fill={isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.3)'} fontSize="5" fontFamily='"Courier New", monospace' textAnchor="end">AS-MED-10</text>
                        </g>

                        {/* 10b. MG Block Hostel */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('mg-hostel')}>
                            <rect x="655" y="805" width="125" height="32" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Purple Hostel Icon Badge */}
                            <g transform="translate(672, 821)">
                                <circle cx="0" cy="0" r="6" fill="#a855f7" stroke="#7e22ce" strokeWidth="1" />
                                <text x="0" y="2.5" fill="#ffffff" fontSize="7" textAnchor="middle">🛏️</text>
                            </g>
                            {/* Label */}
                            <text x="723" y="824" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">MG Block Hostel</text>
                        </g>

                        {/* 12. Bio Centre */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('bio-centre')}>
                            <rect x="310" y="742" width="100" height="28" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="360" y="759" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">Bio Centre</text>
                        </g>

                        {/* 13. Bio Plant */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('bio-plant')}>
                            <rect x="468" y="755" width="120" height="28" fill={isDark ? "#334155" : "#c5bfb5"} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="528" y="772" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">Bio Plant</text>
                        </g>

                        {/* ── SRI SHIVAKUMARA SWAMIJI STADIUM ── */}
                        <g>
                            {/* Outer Running Track */}
                            <rect x="-55" y="285" width="84" height="405" fill={colors.stadiumOuter} stroke={isDark ? "#b45309" : "#fde047"} strokeWidth="2" rx="6" opacity="0.85" />
                            {/* Inner Green Field */}
                            <rect x="-51" y="289" width="76" height="397" fill={colors.stadiumInner} stroke={isDark ? "#16a34a" : "#86efac"} strokeWidth="2" rx="4" />
                            <circle cx="-13" cy="485" r="20" fill="none" stroke={isDark ? "#14532d" : "#bbf7d0"} strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="-51" y1="485" x2="25" y2="485" stroke={isDark ? "#14532d" : "#bbf7d0"} strokeWidth="1.5" strokeDasharray="3 3" />
                            <text x="-13" y="430" fill="#22c55e" fontSize="10" textAnchor="middle" opacity="0.6">🌱</text>
                            <text x="-13" y="535" fill="#22c55e" fontSize="10" textAnchor="middle" opacity="0.6">🌱</text>
                            <text x="-13" y="470" fill={isDark ? "#4ade80" : "#15803d"} fontSize="8.5" fontWeight="900" fontStyle="italic" textAnchor="middle" className="pointer-events-none select-none tracking-wide">
                                <tspan x="-13" dy="0">Sri Shivakumara</tspan>
                                <tspan x="-13" dy="1.3em">Swamiji</tspan>
                                <tspan x="-13" dy="1.3em">Stadium</tspan>
                            </text>
                        </g>

                        {/* Sit Indoor Stadium */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('indoor-stadium')}>
                            <rect x="65" y="385" width="55" height="80" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Label */}
                            <text x="92" y="423" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">
                                <tspan x="92" dy="0">Sit Indoor</tspan>
                                <tspan x="92" dy="1.2em">Stadium</tspan>
                            </text>
                        </g>

                        {/* Coffee Shop */}
                        <g>
                            <g transform="translate(258, 325)">
                                <circle cx="0" cy="0" r="6" fill={colors.badgeCoffeeBg} stroke={colors.badgeCoffeeBorder} strokeWidth="1" />
                                {/* Coffee SVG Icon */}
                                <g transform="scale(0.35) translate(-12, -12)">
                                    <path d="M10 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                    <path d="M14 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" fill="none" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                </g>
                            </g>
                        </g>

                        {/* BG-1. Bio Technology Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('bio-tech')}>
                            <rect x="125" y="342" width="140" height="44" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="195" y="362" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">
                                <tspan x="195" dy="0">Bio Technology</tspan>
                                <tspan x="195" dy="1.2em">Block</tspan>
                            </text>
                        </g>

                        {/* BG-2. Electrical Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('electrical-block')}>
                            {/* Main Outer Outline Path */}
                            <path
                                d="M 140,402 L 265,402 L 265,642 L 125,642 L 125,615 L 235,615 L 235,595 L 135,595 L 135,495 L 235,495 L 235,480 L 140,480 Z"
                                fill={colors.buildingFill}
                                stroke={colors.buildingStroke}
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />
                            {/* Small Left Annex Tab */}
                            <rect x="117" y="425" width="15" height="30" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Wing Divider Lines */}
                            <line x1="215" y1="402" x2="215" y2="480" stroke="#c5bfb5" strokeWidth="1.2" />
                            <line x1="215" y1="495" x2="215" y2="595" stroke="#c5bfb5" strokeWidth="1.2" />
                            <line x1="235" y1="615" x2="265" y2="615" stroke="#c5bfb5" strokeWidth="1.2" />
                            {/* Sub-room markers: Project Lab & Machine Shop */}
                            <circle cx="210" cy="425" r="3.5" fill="#475569" stroke="#1e293b" strokeWidth="1" />
                            <text x="202" y="427" fill="#334155" fontSize="6.5" fontWeight="900" textAnchor="end">Project Lab</text>
                            <circle cx="148" cy="570" r="3.5" fill="#d4a843" stroke="#92400e" strokeWidth="1" />
                            <text x="156" y="572" fill="#334155" fontSize="6.5" fontWeight="900" textAnchor="start">Machine Shop</text>
                            {/* Main Title Label */}
                            <text x="185" y="525" fill={colors.text} fontSize="9" fontWeight="900" textAnchor="middle">
                                <tspan x="185" dy="0">Electrical</tspan>
                                <tspan x="185" dy="1.2em">Block</tspan>
                            </text>
                        </g>

                        {/* BG-3. Workshop */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('workshop')}>
                            <rect x="125" y="692" width="140" height="30" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="195" y="711" fill={colors.text} fontSize="8" fontWeight="900" textAnchor="middle">Workshop</text>
                        </g>

                        {/* BG-4. Dept. of Electronics & Communication */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('ece-block')}>
                            <rect x="125" y="738" width="140" height="30" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            <text x="195" y="753" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">
                                <tspan x="195" dy="0">Dept. of Electronics</tspan>
                                <tspan x="195" dy="1.2em">&amp; Communication</tspan>
                            </text>
                        </g>

                        {/* 11a. Sit Health Centre */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('health-centre')}>
                            <rect x="990" y="645" width="105" height="42" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Red Medical Icon Badge */}
                            <g transform="translate(1006, 666)">
                                <circle cx="0" cy="0" r="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
                                <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" textAnchor="middle">🩺</text>
                            </g>
                            {/* Label */}
                            <text x="1050" y="666" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">
                                <tspan x="1050" dy="0">Sit Health</tspan>
                                <tspan x="1050" dy="1.2em">Centre</tspan>
                            </text>
                        </g>

                        {/* 11b. Allamaprabhu Block Hostel */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('allamaprabhu-hostel')}>
                            <rect x="1110" y="645" width="130" height="48" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Purple Hostel Icon Badge */}
                            <g transform="translate(1127, 669)">
                                <circle cx="0" cy="0" r="6" fill="#a855f7" stroke="#7e22ce" strokeWidth="1" />
                                <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" textAnchor="middle">🛏️</text>
                            </g>
                            {/* Label */}
                            <text x="1180" y="666" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">
                                <tspan x="1180" dy="0">Allamaprabhu</tspan>
                                <tspan x="1180" dy="1.2em">Block Hostel</tspan>
                            </text>
                        </g>

                        {/* 11c. SIT College Canteen */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('canteen')}>
                            <polygon points="963,723 990,718 1011,735 1013,762 996,779 969,781 948,764 946,737" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" strokeLinejoin="round" />
                            {/* Canteen icon */}
                            <rect x="969" y="740" width="26" height="4" fill="#d4a843" rx="1" />
                            <rect x="972" y="744" width="5" height="8" fill="#d4a843" rx="1" />
                            <rect x="979" y="744" width="5" height="8" fill="#d4a843" rx="1" />
                            <rect x="986" y="744" width="5" height="8" fill="#d4a843" rx="1" />
                            {/* Label */}
                            <text x="980" y="765" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="middle">
                                <tspan x="980" dy="0">SIT College</tspan>
                                <tspan x="980" dy="1.2em">Canteen</tspan>
                            </text>
                        </g>

                        {/* 11bb. Architecture & MCA Block */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('arch-mca-block')}>
                            <rect x="950" y="215" width="150" height="80" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Label */}
                            <text x="1025" y="255" fill={colors.text} fontSize="9" fontWeight="900" textAnchor="middle">
                                <tspan x="1025" dy="0">Architecture &amp;</tspan>
                                <tspan x="1025" dy="1.2em">MCA Block</tspan>
                            </text>
                        </g>

                        {/* ── DOUBLE GREEN LAWN FIELD ── */}
                        <g>
                            {/* Outer Yellow Running Track */}
                            <rect x="905" y="485" width="307" height="140" fill={colors.stadiumOuter} stroke={isDark ? "#b45309" : "#fde047"} strokeWidth="2" rx="5" opacity="0.9" />
                            {/* Main Greenery Lawn */}
                            <rect x="909" y="489" width="299" height="132" fill={colors.lawnBg} stroke={isDark ? "#047857" : "#76da97"} strokeWidth="2" rx="4" />
                            <text x="984" y="565" fill={colors.textMuted} fontSize="16" textAnchor="middle">🗼</text>
                            {/* Double Lawn Trees (Vector Trees) */}
                            {DOUBLE_LAWN_TREES.map((t, idx) => renderRealisticTree(t, `double-lawn-${idx}`))}
                        </g>

                        {/* 11d. LBS HOSTEL ROAD label */}
                        <text x="1265" y="472" fill={colors.textMuted} fontSize="7.5" fontWeight="900" letterSpacing="0.5">LBS HOSTEL ROAD</text>

                        {/* 11e. Basaveshwara Block Hostel */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('basaveshwara-hostel')}>
                            <rect x="1265" y="487" width="145" height="155" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2.5" rx="7" />
                            {/* Courtyards */}
                            <rect x="1283" y="505" width="38" height="118" fill={isDark ? "#1E293B" : "#f2efeb"} stroke={isDark ? "#334155" : "#c5bfb5"} strokeWidth="1.2" rx="2" />
                            <path d="M 1337,505 L 1393,505 L 1393,565 L 1375,565 L 1375,623 L 1337,623 Z" fill={isDark ? "#1E293B" : "#f2efeb"} stroke={isDark ? "#334155" : "#c5bfb5"} strokeWidth="1.2" />
                            {/* Purple Hostel Icon Badge */}
                            <g transform="translate(1337, 545)">
                                <circle cx="0" cy="0" r="6" fill="#a855f7" stroke="#7e22ce" strokeWidth="1" />
                                <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" textAnchor="middle">🛏️</text>
                            </g>
                            {/* Label */}
                            <text x="1347" y="542" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="start">
                                <tspan x="1347" dy="0">Basaveshwara</tspan>
                                <tspan x="1347" dy="1.2em">Block Hostel</tspan>
                            </text>
                        </g>

                        {/* 11f. LBS Hostel */}
                        <g filter="url(#building-shadow)" className={getBuildingClass('lbs-hostel')}>
                            {/* Main Top Horizontal Bar */}
                            <rect x="1420" y="487" width="115" height="28" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Central Vertical Wing */}
                            <rect x="1460" y="515" width="30" height="127" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Right Vertical Wing */}
                            <rect x="1505" y="515" width="30" height="117" fill={colors.buildingFill} stroke={colors.buildingStroke} strokeWidth="2" rx="7" />
                            {/* Purple Hostel Icon Badge */}
                            <g transform="translate(1455, 565)">
                                <circle cx="0" cy="0" r="6" fill="#a855f7" stroke="#7e22ce" strokeWidth="1" />
                                <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" textAnchor="middle">🛏️</text>
                            </g>
                            {/* Label */}
                            <text x="1465" y="568" fill={colors.text} fontSize="7.5" fontWeight="900" textAnchor="start">LBS Hostel</text>
                        </g>

                        {/* 11g. Snacks Shop (Placed in the LBS Hostel Road column at x: 1222, y: 445) */}
                        <g>
                            <g transform="translate(1222, 445)">
                                <circle cx="0" cy="0" r="6" fill={colors.badgeSnacksBg} stroke={colors.badgeSnacksBorder} strokeWidth="1" />
                                {/* Coffee SVG Icon */}
                                <g transform="scale(0.35) translate(-12, -12)">
                                    <path d="M10 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                    <path d="M14 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" fill="none" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 2v2" stroke={colors.badgeIconStroke} strokeWidth="2.2" strokeLinecap="round" />
                                </g>
                            </g>
                        </g>
                    </g>

                    {/* Pathways & Road Networks */}
                    <g filter="url(#road-shadow)">
                        {/* BH Road (Perfect horizontal highway extending full width of canvas) - Faded (Outside world) */}
                        <line x1="0" y1="20" x2="1600" y2="20" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
                        <line x1="0" y1="20" x2="1600" y2="20" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />

                        {/* --- Layer 1: Road Beds --- */}
                        {/* Main Road Bed */}
                        <path d="M 75 305 L 875 305 Q 895 305 895 325 L 895 840" fill="none" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Left-Central Vertical Road Bed */}
                        <line x1="276" y1="305" x2="276" y2="780" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Horizontal Connecting Road Bed */}
                        <line x1="276" y1="560" x2="895" y2="560" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Central Vertical Connecting Road Bed */}
                        <line x1="620" y1="560" x2="620" y2="735" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Bottom-Central Horizontal Connecting Road Bed */}
                        <line x1="276" y1="735" x2="895" y2="735" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Top Horizontal Road Bed */}
                        <line x1="895" y1="475" x2="1222" y2="475" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Bottom Horizontal Road Bed */}
                        <line x1="895" y1="635" x2="1222" y2="635" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                        {/* LBS Hostel Road (Vertical) Bed */}
                        <line x1="1222" y1="475" x2="1222" y2="635" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />

                        {/* --- Layer 2: Premium Road Surface --- */}
                        {/* Main Road Surface */}
                        <path d="M 75 305 L 875 305 Q 895 305 895 325 L 895 840" fill="none" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Left-Central Vertical Road Surface */}
                        <line x1="276" y1="305" x2="276" y2="780" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Horizontal Connecting Road Surface */}
                        <line x1="276" y1="560" x2="895" y2="560" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Central Vertical Connecting Road Surface */}
                        <line x1="620" y1="560" x2="620" y2="735" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Bottom-Central Horizontal Connecting Road Surface */}
                        <line x1="276" y1="735" x2="895" y2="735" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Top Horizontal Road Surface */}
                        <line x1="895" y1="475" x2="1222" y2="475" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Bottom Horizontal Road Surface */}
                        <line x1="895" y1="635" x2="1222" y2="635" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        {/* LBS Hostel Road Surface */}
                        <line x1="1222" y1="475" x2="1222" y2="635" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />

                        {/* --- Layer 3: Central Dashed Lines --- */}
                        {/* Main Road Dashed Line */}
                        <path d="M 75 305 L 875 305 Q 895 305 895 325 L 895 840" fill="none" stroke={colors.roadDashes} strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Left-Central Vertical Road Dashed Line */}
                        <line x1="276" y1="320" x2="276" y2="780" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Horizontal Connecting Road Dashed Line */}
                        <line x1="296" y1="560" x2="875" y2="560" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Central Vertical Connecting Road Dashed Line */}
                        <line x1="620" y1="575" x2="620" y2="735" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Bottom-Central Horizontal Connecting Road Dashed Line */}
                        <line x1="296" y1="735" x2="875" y2="735" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Top Horizontal Road Dashed Line */}
                        <line x1="915" y1="475" x2="1202" y2="475" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Hostel Area Bottom Horizontal Road Dashed Line */}
                        <line x1="915" y1="635" x2="1202" y2="635" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* LBS Hostel Road Dashed Line */}
                        <line x1="1222" y1="495" x2="1222" y2="615" stroke={colors.roadDashes} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* --- Layer 4: Special Paths & Dotted Trails --- */}
                        {/* Curved Greenery Dividers flanking the Roundabout / Administration Block */}
                        <g>
                            {/* Left Divider: Road Bed */}
                            <path d="M 535,305 Q 525,360 515,410" fill="none" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Left Divider: Curb / Premium Road Surface */}
                            <path d="M 535,305 Q 525,360 515,410" fill="none" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Left Divider: Grass */}
                            <path d="M 535,305 Q 525,360 515,410" fill="none" stroke={colors.lawnBg} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Right Divider: Road Bed */}
                            <path d="M 665,305 Q 675,360 685,418" fill="none" stroke={colors.roadCasing} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Right Divider: Curb / Premium Road Surface */}
                            <path d="M 665,305 Q 675,360 685,418" fill="none" stroke={colors.roadSurface} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Right Divider: Grass */}
                            <path d="M 665,305 Q 675,360 685,418" fill="none" stroke={colors.lawnBg} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Vector Trees on Medians */}
                            {ROUNDABOUT_TREES.map((t, idx) => renderRealisticTree(t, `roundabout-${idx}`))}
                        </g>

                        {/* Red Dotted Vertical Connecting Path */}
                        <line x1="440" y1="560" x2="440" y2="735" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Red Dotted Horizontal Connecting Path */}
                        <line x1="276" y1="698" x2="620" y2="698" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Red Dotted Stepped Path bypassing Kho Kho Court with Circular Loop at Corner */}
                        <line x1="455" y1="305" x2="455" y2="370" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Red Dotted path connecting top main road to Birla Auditorium */}
                        <line x1="807" y1="305" x2="807" y2="400" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Horizontal path connecting Birla Auditorium to main road */}
                        <line x1="870" y1="448" x2="895" y2="448" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Vertical red dotted road dividing the Double Green Lawn Field */}
                        <line x1="1058.5" y1="475" x2="1058.5" y2="635" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Horizontal path connecting Y-shaped block right wing to Birla Auditorium */}
                        <line x1="685" y1="418" x2="745" y2="418" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Vertical path connecting Y-shape horizontal path to bottom horizontal road */}
                        <line x1="715" y1="418" x2="715" y2="560" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Curved path connecting the vertical path at x: 715 to the vertical path at x: 807 closer to Birla */}
                        <path d="M 715,418 Q 715,370 807,370" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        
                        {/* Perfect Circular Dotted Loop centered at (455, 390) with R=20 */}
                        <circle cx="455" cy="390" r="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        
                        {/* Outer diagonal path bypassing Y-shaped block */}
                        <line x1="500" y1="410" x2="600" y2="535" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        {/* Vertical connection from bypass path to bottom horizontal road */}
                        <line x1="560" y1="485" x2="560" y2="560" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        
                        {/* Exit segment extended all the way to top main road (y: 305) and down to y: 560 */}
                        <line x1="380" y1="305" x2="380" y2="560" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        
                        {/* Dotted paths connecting circle to vertical road x: 380 and outer bypass */}
                        <line x1="455" y1="410" x2="500" y2="410" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                        <line x1="455" y1="410" x2="380" y2="430" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />

                        {/* Red Dotted path connecting main road to Temple */}
                        <path d="M 807,305 L 807,156 L 711,156" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Section 1: SIT Campus Main Road (Terminates where the greenery ends at y: 280) */}
                        {/* Main Road Bed */}
                        <line x1="600" y1="32" x2="600" y2="280" stroke={colors.roadCasing} strokeWidth="48" strokeLinecap="round" />
                        
                        {/* Wide Left White Lane */}
                        <line x1="588" y1="32" x2="588" y2="280" stroke={colors.roadSurface} strokeWidth="18" />
                        
                        {/* Wide Right White Lane */}
                        <line x1="612" y1="32" x2="612" y2="280" stroke={colors.roadSurface} strokeWidth="18" />
                        
                        {/* Solid Concrete Divider Median Strip */}
                        <line x1="600" y1="35" x2="600" y2="275" stroke={colors.roadCasing} strokeWidth="6" strokeLinecap="round" />

                        {/* Roundabout — kept at initial position (cy: 385) */}
                        <circle cx="600" cy="385" r="22" fill="none" stroke={colors.roadCasing} strokeWidth="16" />
                        <circle cx="600" cy="385" r="22" fill="none" stroke={colors.roadSurface} strokeWidth="10" />

                        {/* Roundabout Center Fountain */}
                        {/* Green lawn inside roundabout */}
                        <circle cx="600" cy="385" r="17" fill={colors.lawnBg} />
                        {/* Soft blue water glow */}
                        <circle cx="600" cy="385" r="35" fill="url(#fountain-glow)" pointerEvents="none" />
                        {/* Fountain Basin */}
                        <circle cx="600" cy="385" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" filter="url(#building-shadow)" />
                        {/* Water Pool */}
                        <circle cx="600" cy="385" r="8.5" fill="#3b82f6" opacity="0.85" />
                        {/* Ripple 1 */}
                        <circle cx="600" cy="385" r="2" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0">
                            <animate attributeName="r" from="2" to="8.5" dur="4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.8" to="0" dur="4s" repeatCount="indefinite" />
                        </circle>
                        {/* Ripple 2 */}
                        <circle cx="600" cy="385" r="2" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0">
                            <animate attributeName="r" from="2" to="8.5" dur="4s" begin="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.8" to="0" dur="4s" begin="2s" repeatCount="indefinite" />
                        </circle>
                        {/* Center spout and spray */}
                        <circle cx="600" cy="385" r="2.2" fill="#1d4ed8" />
                        <circle cx="600" cy="385" r="1.2" fill="#ffffff" />
                    </g>

                    {/* ── BRANDED ROAD MICROTEXT ────────────────────────────── */}
                    {/* Invisible during normal use. Embedded inside roads for screenshot identity. */}
                    <g pointerEvents="none" aria-hidden="true">
                        <text
                            fontSize="5"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                            letterSpacing="5"
                            fill={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}
                        >
                            {/* Main horizontal+vertical road */}
                            <textPath href="#brand-road-main" startOffset="2%">
                                {'AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • '}
                            </textPath>
                        </text>
                        <text
                            fontSize="5"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                            letterSpacing="5"
                            fill={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}
                        >
                            {/* Horizontal connecting road */}
                            <textPath href="#brand-road-horizontal" startOffset="5%">
                                {'AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • '}
                            </textPath>
                        </text>
                        <text
                            fontSize="5"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                            letterSpacing="5"
                            fill={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}
                        >
                            {/* Hostel road */}
                            <textPath href="#brand-road-hostel" startOffset="5%">
                                {'AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • '}
                            </textPath>
                        </text>
                        <text
                            fontSize="5"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                            letterSpacing="5"
                            fill={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}
                        >
                            {/* Bottom road */}
                            <textPath href="#brand-road-bottom" startOffset="5%">
                                {'AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • AskUrSenior Campus Explorer • '}
                            </textPath>
                        </text>
                    </g>

                    {/* Lane Traffic Arrows along the vertical Main Road */}
                    <g opacity="0.65">
                        {/* Left Lane: Vehicles going UP/North towards Main Gate */}
                        <g transform="translate(588, 110)">
                            <path d="M -2,1 L 0,-2 L 2,1 M 0,-2 L 0,3.5" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <g transform="translate(588, 230)">
                            <path d="M -2,1 L 0,-2 L 2,1 M 0,-2 L 0,3.5" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Right Lane: Vehicles coming DOWN/South towards roundabout */}
                        <g transform="translate(612, 110)">
                            <path d="M -2,-1 L 0,2 L 2,-1 M 0,2 L 0,-3.5" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <g transform="translate(612, 230)">
                            <path d="M -2,-1 L 0,2 L 2,-1 M 0,2 L 0,-3.5" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>

                    {/* Pedestrian Pathways & Roundabout Traffic Flow Arrows */}
                    <g>
                        {/* Left clockwise traffic arrow on the roundabout lane */}
                        <g transform="translate(580, 370) rotate(-35)" opacity="0.75">
                            <line x1="0" y1="4" x2="0" y2="-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M -2.5,-1 L 0,-4 L 2.5,-1" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        
                        {/* Right clockwise traffic arrow on the roundabout lane */}
                        <g transform="translate(620, 400) rotate(145)" opacity="0.75">
                            <line x1="0" y1="4" x2="0" y2="-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M -2.5,-1 L 0,-4 L 2.5,-1" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                        </g>

                        {/* Walkway from road end to roundabout — hidden for now */}
                        {/* Walkway from bottom of roundabout to Administration Block center — hidden for now */}
                    </g>

                    {/* Street Lamps inside the physical center divider median */}
                    <g>
                        {STREET_LAMPS.map((lamp, idx) => (
                            <g key={idx} transform={`translate(${lamp.x}, ${lamp.y})`}>
                                {/* Light Radial Glow */}
                                <circle cx="0" cy="0" r="10" fill="#fef08a" opacity={colors.lampGlow} />
                                {/* Lamp Base Fitting */}
                                <circle cx="0" cy="0" r="3.5" fill="#eab308" stroke="#334155" strokeWidth="1" />
                                <circle cx="0" cy="0" r="1" fill="#ffffff" />
                            </g>
                        ))}
                    </g>

                    {/* Realistic Architectual Entrance Gate Archway */}
                    <g>
                        {/* Left Concrete Pillar */}
                        <rect x="571.5" y="24" width="7" height="16" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="1" rx="1.5" />
                        <rect x="570" y="22" width="10" height="2.5" fill="#475569" />
                        
                        {/* Right Concrete Pillar */}
                        <rect x="621.5" y="24" width="7" height="16" fill={colors.gatePillar} stroke={isDark ? "#1e293b" : "#334155"} strokeWidth="1" rx="1.5" />
                        <rect x="620" y="22" width="10" height="2.5" fill="#475569" />

                        {/* Swinging Wrought Iron Decorative Gate Wings (Open Inwards) */}
                        <path d="M 578.5,32 Q 588,38 593,45" fill="none" stroke={colors.gateIron} strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M 578.5,32 Q 588,38 593,45" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
                        
                        <path d="M 621.5,32 Q 612,38 607,45" fill="none" stroke={colors.gateIron} strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M 621.5,32 Q 612,38 607,45" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />

                        {/* Grand Overhead Metal Archway spanning between the two pillars */}
                        <path d="M 575,24 Q 600,18 625,24" fill="none" stroke={colors.gateIron} strokeWidth="3" strokeLinecap="round" />
                        <path d="M 575,24 Q 600,18 625,24" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" />
                        
                        {/* Inner metal girder web lace detailing */}
                        <path d="M 575,24 L 587,21 L 600,20 L 613,21 L 625,24" fill="none" stroke="#475569" strokeWidth="1" />

                        {/* Gate Arch Label */}
                        <text x="600" y="12" fill={colors.text} fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
                            MAIN GATE
                        </text>
                    </g>

                    {/* Buildings */}
                    <g>
                        {BUILDINGS.map((b) => {
                            const isSelected = selectedBuildingId === b.id;
                            const blockFill = isSelected ? (isDark ? '#1E293B' : '#ffffff') : (isDark ? '#1E293B' : b.color);
                            const strokeColor = isSelected ? '#6c5ce7' : colors.buildingStroke;
                            const textFillColor = isSelected ? '#6c5ce7' : colors.text;

                            // Administration Block (Tilted to the right)
                            return (
                                <g 
                                    key={b.id} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBuildingId(isSelected ? null : b.id);
                                    }} 
                                    className={`cursor-pointer transition-all duration-300 admin-card ${highlightedLocationId === 'admin-block' ? 'highlight-glow' : ''}`}
                                    filter={isSelected ? 'url(#building-glow)' : 'url(#building-shadow)'}
                                >
                                    {/* Left Wing (reduced size) */}
                                    <path
                                        d="M 600,475 L 515,410"
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={isSelected ? 32 : 26}
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 600,475 L 515,410"
                                        fill="none"
                                        stroke={blockFill}
                                        strokeWidth={isSelected ? 26 : 20}
                                        strokeLinecap="round"
                                    />
                                    
                                    {/* Right Wing (reduced size) */}
                                    <path
                                        d="M 600,475 L 685,418"
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={isSelected ? 32 : 26}
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 600,475 L 685,418"
                                        fill="none"
                                        stroke={blockFill}
                                        strokeWidth={isSelected ? 26 : 20}
                                        strokeLinecap="round"
                                    />

                                    {/* Bottom vertical Wing (reduced size) */}
                                    <path
                                        d="M 600,475 L 600,535"
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={isSelected ? 32 : 26}
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 600,475 L 600,535"
                                        fill="none"
                                        stroke={blockFill}
                                        strokeWidth={isSelected ? 26 : 20}
                                        strokeLinecap="round"
                                    />

                                    {/* Red dotted paths inside Administration Block */}
                                    <path
                                        d="M 600,475 L 515,410 M 600,475 L 685,418 M 600,475 L 600,535"
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        strokeDasharray="5 4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {/* Connection to roundabout */}
                                    <line x1="600" y1="475" x2="600" y2="430" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" />
                                    <circle cx="588" cy="482" r="3" fill="#2980b9" />
                                    <circle cx="612" cy="482" r="3" fill="#2980b9" />
                                    
                                    <text
                                        x="600"
                                        y="498"
                                        fill={textFillColor}
                                        fontSize="8"
                                        fontWeight="900"
                                        textAnchor="middle"
                                        className="pointer-events-none select-none tracking-wide"
                                    >
                                        <tspan x="600" dy="0">Administration</tspan>
                                        <tspan x="600" dy="1.2em">Block</tspan>
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                    {/* Glowing pulse ring locator beacon for search highlight */}
                    {activeLoc && (
                        <g>
                            {/* Radial locator ripple */}
                            <circle cx={activeLoc.x} cy={activeLoc.y} r="25" fill="none" stroke="#2563eb" strokeWidth="3" opacity="0.8">
                                <animate attributeName="r" from="10" to="45" dur="1.2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.9" to="0" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                            {/* Solid center locator dot */}
                            <circle cx={activeLoc.x} cy={activeLoc.y} r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2.2" filter="url(#building-shadow)" />
                        </g>
                    )}
                </svg>


            </div>
        </div>
    );
}
