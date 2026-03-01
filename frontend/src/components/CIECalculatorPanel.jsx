import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    CIE_RULES,
    detectSubjectType,
    calculateCIEFromMarks,
    saveCIEResult,
    clearCIEResult,
    saveCIEDraft,
    getCIEDraft,
    clearCIEDraft,
    getCIEResult,
} from '../utils/cieEngine';

// ─── Clamp helper ─────────────────────────────────────────────────────────
const clampInt = (raw, max) => {
    if (raw === '') return '';
    const cleaned = String(raw).replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    let n = parseInt(cleaned, 10);
    if (!Number.isFinite(n)) return '';
    if (n < 0) n = 0;
    const maxN = Number(max);
    if (Number.isFinite(maxN) && n > maxN) n = maxN;
    return String(n);
};

const emptyMarks = () => ({
    test1: '', test2: '',
    quiz1: '', quiz2: '',
    abl1: '', abl2: '',
    labs: [''], _labCountSet: false,
    labTests: [''], _labTestCountSet: false,
});

// ─── Fireworks Celebration ─────────────────────────────────────────────────
const fireConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const PALETTES = [
        ['#ff6b6b', '#ffd93d', '#ff6bff', '#ff9d3d'],
        ['#00d2ff', '#7b2ff7', '#ff6bff', '#00ffcc'],
        ['#ffd93d', '#ff6b6b', '#ffffff', '#ffaa44'],
        ['#6bffb8', '#00d2ff', '#a78bfa', '#fbbf24'],
    ];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    const particles = [];
    const sparkles = [];

    // Radial burst of glowing particles
    const burst = (cx, cy) => {
        const palette = pick(PALETTES);
        const count = 90 + Math.floor(rnd(0, 50));
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + rnd(-0.15, 0.15);
            const spd = rnd(2.5, 10);
            const color = pick(palette);
            const life = rnd(0.75, 1.0);
            particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - rnd(0.5, 2),
                color, r: rnd(1.5, 4.5), life, startLife: life,
                decay: rnd(0.013, 0.025),
                glow: rnd(8, 22),
                shape: Math.random() > 0.45 ? 'circle' : 'rect',
                rot: rnd(0, Math.PI * 2), rotV: rnd(-0.15, 0.15),
                w: rnd(3, 9), h: rnd(2, 5),
            });
        }
        // Shockwave ring
        for (let i = 0; i < 18; i++) {
            const a = (Math.PI * 2 * i) / 18;
            const spd = rnd(11, 18);
            particles.push({
                x: cx, y: cy,
                vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                color: '#ffffff', r: 2.5, life: 0.55, startLife: 0.55,
                decay: 0.055, glow: 32,
                shape: 'circle', rot: 0, rotV: 0, w: 2, h: 2,
            });
        }
    };

    // Twinkling 4-point stars scattered at burst site
    const addSparkles = (cx, cy) => {
        for (let i = 0; i < 25; i++) {
            sparkles.push({
                x: cx + rnd(-120, 120), y: cy + rnd(-80, 80),
                r: rnd(2, 5),
                life: 1, decay: rnd(0.025, 0.06),
                color: pick(['#ffffff', '#ffd93d', '#a78bfa', '#00ffcc', '#ff6bff']),
                t: rnd(0, Math.PI * 2), spd: rnd(0.15, 0.35),
            });
        }
    };

    // Staggered burst positions
    const sites = [
        { x: W * 0.25, y: H * 0.20, t: 0 },
        { x: W * 0.75, y: H * 0.18, t: 350 },
        { x: W * 0.50, y: H * 0.12, t: 640 },
        { x: W * 0.18, y: H * 0.32, t: 950 },
        { x: W * 0.82, y: H * 0.28, t: 1200 },
        { x: W * 0.50, y: H * 0.22, t: 1550 },
    ];
    sites.forEach(s => setTimeout(() => { burst(s.x, s.y); addSparkles(s.x, s.y); }, s.t));

    let frame = 0;
    const draw = () => {
        // Full clear — no page darkening
        ctx.clearRect(0, 0, W, H);

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.13; p.vx *= 0.98;
            p.life -= p.decay; p.rot += p.rotV;
            if (p.life <= 0) { particles.splice(i, 1); continue; }

            const alpha = Math.max(0, p.life / p.startLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = p.glow;
            ctx.shadowColor = p.color;

            if (p.shape === 'rect') {
                ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.1, p.r * alpha), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // Sparkles (twinkling 4-point stars)
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const s = sparkles[i];
            s.life -= s.decay; s.t += s.spd;
            if (s.life <= 0) { sparkles.splice(i, 1); continue; }

            const a = Math.abs(Math.sin(s.t)) * s.life;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.shadowBlur = 14; ctx.shadowColor = s.color;
            ctx.translate(s.x, s.y); ctx.rotate(s.t * 0.5);
            ctx.beginPath();
            for (let k = 0; k < 4; k++) {
                const ang = (Math.PI / 2) * k;
                const bng = ang + Math.PI / 4;
                k === 0
                    ? ctx.moveTo(Math.cos(ang) * s.r * 2.2, Math.sin(ang) * s.r * 2.2)
                    : ctx.lineTo(Math.cos(ang) * s.r * 2.2, Math.sin(ang) * s.r * 2.2);
                ctx.lineTo(Math.cos(bng) * s.r * 0.5, Math.sin(bng) * s.r * 0.5);
            }
            ctx.closePath();
            ctx.fillStyle = s.color; ctx.fill();
            ctx.restore();
        }

        frame++;
        if (frame < 350 || particles.length > 0 || sparkles.length > 0) {
            requestAnimationFrame(draw);
        } else {
            document.body.removeChild(canvas);
        }
    };
    requestAnimationFrame(draw);
};

// ─── 3-Color Progress Bar ─────────────────────────────────────────────────
// red = below min | yellow = at/above min but still marks to fill | green = complete
const ProgressBar = ({ label, current, max, rawLabel = '', allFilled = true, minThreshold = 0, animated = false }) => {
    const pct = Math.min(100, max > 0 ? (current / max) * 100 : 0);
    const color = !allFilled
        ? (current >= minThreshold ? 'bg-yellow-400' : 'bg-red-500')
        : (current >= minThreshold ? 'bg-emerald-500' : 'bg-red-500');
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-tight">{label}</span>
                <span className="text-[10px] font-mono text-white/60">
                    {rawLabel && <span className="mr-2 text-white/20 italic">{rawLabel}</span>}
                    <span className="text-white font-bold">{typeof current === 'number' ? current.toFixed(1) : current}</span>
                    <span className="text-white/40"> / {max}</span>
                </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full ${color} ${animated ? 'animate-pulse' : ''} transition-all duration-700 shadow-[0_0_8px_rgba(0,0,0,0.4)]`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

// ─── Analyzing Overlay — shows per-section eligibility + CIE breakdown ────
const AnalyzingOverlay = ({ components, analysis }) => (
    <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl">
        <div className="w-full max-w-sm mx-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
                <div className="text-3xl">⚡</div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Analyzing CIE</h3>
                <p className="text-[10px] text-white/30">Checking each component…</p>
            </div>
            <div className="space-y-3">
                {components.map(({ key, label, maxPts }) => {
                    const status = analysis[key];
                    const scored = analysis[`${key}_pts`];
                    return (
                        <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</span>
                                {status === 'loading' && (
                                    <span className="text-[10px] text-yellow-400 font-black animate-pulse">Checking…</span>
                                )}
                                {status === 'pass' && (
                                    <span className="text-[10px] text-emerald-400 font-black">
                                        ✓ Eligible ·{' '}
                                        <span className="text-emerald-300">{typeof scored === 'number' ? scored.toFixed(1) : '—'}</span>
                                        <span className="text-white/30"> / {maxPts}</span>
                                    </span>
                                )}
                                {status === 'fail' && (
                                    <span className="text-[10px] text-red-400 font-black">✗ Not Eligible</span>
                                )}
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                {status === 'loading' && (
                                    <div className="h-full bg-yellow-400/70 rounded-full animate-pulse" style={{ width: '55%' }} />
                                )}
                                {status === 'pass' && (
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        style={{ width: maxPts > 0 && typeof scored === 'number' ? `${Math.min(100, (scored / maxPts) * 100)}%` : '100%' }}
                                    />
                                )}
                                {status === 'fail' && (
                                    <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: '35%' }} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

// ─── Count-first input row (used for both labs and lab tests) ─────────────
const CountInput = ({ label, placeholder, onSet, color = 'orange' }) => {
    const inputRef = useRef(null);
    const colorMap = {
        orange: { border: 'border-orange-400/40 focus:border-orange-400', btn: 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border-orange-500/30' },
        rose: { border: 'border-rose-400/40 focus:border-rose-400', btn: 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border-rose-500/30' },
    };
    const c = colorMap[color] || colorMap.orange;
    const handle = () => {
        const n = Math.min(30, Math.max(1, parseInt(inputRef.current?.value) || 0));
        if (n > 0) onSet(n);
    };
    return (
        <div className="flex items-center gap-2">
            <input
                ref={inputRef} type="number" min="1" max="30"
                placeholder={placeholder}
                inputMode="numeric" pattern="[0-9]*"
                className={`flex-1 h-8 bg-white/5 border ${c.border} rounded-lg px-3 text-xs font-bold text-white outline-none placeholder:text-white/20 transition`}
                onKeyDown={e => { if (e.key === 'Enter') handle(); }}
            />
            <button
                type="button" onClick={handle}
                className={`h-8 px-3 ${c.btn} border rounded-lg text-[10px] font-black transition whitespace-nowrap`}
            >
                Set {label}
            </button>
        </div>
    );
};

// ─── CIE Calculator Modal ────────────────────────────────────────────────
const CIECalculatorModal = ({ subject, onCIESaved, onClose }) => {
    const subjectCode = subject?.code || subject?.name || 'unknown';
    const credits = subject?.credits ?? 0;
    const hasLab = (subject?.name || '').toLowerCase().includes('lab');
    const subjectType = detectSubjectType(credits, hasLab);
    const rule = CIE_RULES[subjectType];
    const cieMax = (rule.scaleTheoryTo || rule.theoryMax || 0) + (rule.practicalMax || 0);

    const hasTheory = !!rule.theory;
    const hasPractical = !!rule.practical;

    const getInitialMarks = () => getCIEDraft(subjectCode) || emptyMarks();

    const [marks, setMarks] = useState(getInitialMarks);
    const [analysis, setAnalysis] = useState({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(() => {
        const saved = getCIEResult(subjectCode);
        if (!saved) return null;
        return { cie: saved.cie, cieMax, isEligible: saved.isEligible, components: null, rule };
    });
    const [missingFields, setMissingFields] = useState([]);
    const autoTimer = useRef(null);
    const labRefs = useRef([]);
    const labTestRefs = useRef([]);

    const autoAdvance = useCallback((e, val, maxVal) => {
        if (val.length >= 2 || Number(val) >= maxVal) {
            const container = e.target.closest('.cie-form-container');
            if (!container) return;
            const inputs = Array.from(container.querySelectorAll('input[type="number"]:not([disabled])'));
            const idx = inputs.indexOf(e.target);
            if (idx !== -1) {
                const nextIdx = inputs.findIndex((inp, i) => i > idx && inp.value === '');
                if (nextIdx !== -1) {
                    inputs[nextIdx].focus();
                } else if (idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                    inputs[idx + 1].select();
                }
            }
        }
    }, []);

    // Auto-save draft on every change
    const updateMark = useCallback((field, value, idx = null) => {
        setMarks(prev => {
            let next;
            if (idx !== null) {
                const arr = [...(prev[field] || [''])];
                arr[idx] = value;
                next = { ...prev, [field]: arr };
            } else {
                next = { ...prev, [field]: value };
            }
            clearTimeout(autoTimer.current);
            autoTimer.current = setTimeout(() => saveCIEDraft(subjectCode, next), 300);
            return next;
        });
    }, [subjectCode]);

    // ── Live computed progress values ──────────────────────────────────────
    const m = marks;
    const testSum = (parseFloat(m.test1) || 0) + (parseFloat(m.test2) || 0);
    const quizSum = (parseFloat(m.quiz1) || 0) + (parseFloat(m.quiz2) || 0);
    const ablSum = (parseFloat(m.abl1) || 0) + (parseFloat(m.abl2) || 0);
    const intSum = (parseFloat(m.quiz1) || 0) + (parseFloat(m.abl1) || 0);
    const labSum = (m.labs || ['']).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const labTestSum = (m.labTests || ['']).reduce((s, v) => s + (parseFloat(v) || 0), 0);

    const testReduced = rule.theory?.tests ? (testSum / rule.theory.tests.max) * rule.theory.tests.reducedTo : 0;
    const quizReduced = rule.theory?.quiz ? (quizSum / rule.theory.quiz.max) * rule.theory.quiz.reducedTo : 0;
    const ablReduced = rule.theory?.abl ? (ablSum / rule.theory.abl.max) * rule.theory.abl.reducedTo : 0;
    const intReduced = rule.theory?.internal ? (intSum / rule.theory.internal.max) * rule.theory.internal.reducedTo : 0;
    const theoryRaw = testReduced + quizReduced + ablReduced + intReduced;
    const theoryScaled = rule.scaleTheoryTo ? (theoryRaw / (rule.theoryMax || 1)) * rule.scaleTheoryTo : theoryRaw;
    const labReduced = rule.practical?.record ? (labSum / rule.practical.record.max) * rule.practical.record.reducedTo : 0;
    const labTestRed = rule.practical?.test
        ? (labTestSum / (rule.practical.test.max * Math.max(1, (m.labTests || ['']).length)))
        * rule.practical.test.reducedTo
        : 0;
    const totalCIE = theoryScaled + labReduced + labTestRed;

    // ── Helpers for color logic ────────────────────────────────────────────
    const allTestFilled = rule.theory?.tests ? (m.test1 !== '' && m.test2 !== '') : true;
    const allQuizFilled = rule.theory?.quiz ? (m.quiz1 !== '' && m.quiz2 !== '') : true;
    const allAblFilled = rule.theory?.abl ? (m.abl1 !== '' && m.abl2 !== '') : true;
    const allIntFilled = rule.theory?.internal ? (m.quiz1 !== '' && m.abl1 !== '') : true;
    const allLabsFilled = rule.practical?.record ? !(m.labs || []).some(v => v === '') : true;
    const allLabTestFilled = rule.practical?.test ? !(m.labTests || []).some(v => v === '') : true;

    // ── Validation ─────────────────────────────────────────────────────────
    const validateMissing = () => {
        const missing = [];
        if (rule.theory?.tests) { if (m.test1 === '') missing.push('Test 1'); if (m.test2 === '') missing.push('Test 2'); }
        if (rule.theory?.quiz) { if (m.quiz1 === '') missing.push('Quiz 1'); if (m.quiz2 === '') missing.push('Quiz 2'); }
        if (rule.theory?.abl) { if (m.abl1 === '') missing.push('ABL 1'); if (m.abl2 === '') missing.push('ABL 2'); }
        if (rule.theory?.internal) { if (m.quiz1 === '') missing.push('Internal 1'); if (m.abl1 === '') missing.push('Internal 2'); }
        // Only validate labs if user has set the count AND filled in the grid
        if (rule.practical?.record) {
            if (!m._labCountSet) {
                missing.push('Lab Records (set count first)');
            } else if ((m.labs || []).some(v => v === '')) {
                missing.push('Lab Records');
            }
        }
        if (rule.practical?.test) {
            if (!m._labTestCountSet) {
                missing.push('Lab Test (set count first)');
            } else if ((m.labTests || []).some(v => v === '')) {
                missing.push('Lab Test');
            }
        }
        return missing;
    };

    // ── Components list for overlay (with maxPts for breakdown display) ──────
    const overlayComponents = [
        rule.theory?.tests && { key: 'test', label: 'Tests', maxPts: rule.theory.tests.reducedTo },
        rule.theory?.quiz && { key: 'quiz', label: 'Quiz', maxPts: rule.theory.quiz.reducedTo },
        rule.theory?.abl && { key: 'abl', label: 'ABL', maxPts: rule.theory.abl.reducedTo },
        rule.theory?.internal && { key: 'internal', label: 'Internal', maxPts: rule.theory.internal.reducedTo },
        rule.practical?.record && { key: 'labs', label: 'Lab Records', maxPts: rule.practical.record.reducedTo },
        rule.practical?.test && { key: 'labTests', label: 'Lab Test', maxPts: rule.practical.test.reducedTo },
    ].filter(Boolean);

    // ── Analyze ────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        const missing = validateMissing();
        setMissingFields(missing);
        if (missing.length > 0) return;

        setIsAnalyzing(true);
        setResult(null);
        setAnalysis({});

        const delay = ms => new Promise(r => setTimeout(r, ms));

        // run: sets loading state, waits, sets pass/fail + scored pts
        const run = async (key, passFn, reducedPts) => {
            setAnalysis(prev => ({ ...prev, [key]: 'loading' }));
            await delay(700);
            const pass = passFn();
            setAnalysis(prev => ({
                ...prev,
                [key]: pass ? 'pass' : 'fail',
                [`${key}_pts`]: pass ? reducedPts : 0,
            }));
            await delay(300);
        };

        if (rule.theory?.tests) await run('test', () => testSum >= rule.theory.tests.minTotal, testReduced);
        if (rule.theory?.quiz) await run('quiz', () => quizSum >= rule.theory.quiz.minTotal, quizReduced);
        if (rule.theory?.abl) await run('abl', () => ablSum >= rule.theory.abl.minTotal, ablReduced);
        if (rule.theory?.internal) await run('internal', () => intSum >= rule.theory.internal.minTotal, intReduced);
        if (rule.practical?.record) await run('labs', () => labSum >= rule.practical.record.minTotal, labReduced);
        if (rule.practical?.test) await run('labTests', () => labTestSum >= rule.practical.test.minTotal, labTestRed);

        await delay(400);
        const calc = calculateCIEFromMarks(marks, credits, hasLab);
        saveCIEResult(subjectCode, calc.cie, calc.isEligible, marks);
        saveCIEDraft(subjectCode, marks);
        if (onCIESaved) onCIESaved(calc);

        setIsAnalyzing(false);
        setResult(calc);
        if (calc.isEligible) setTimeout(fireConfetti, 200);
    };

    const handleClear = () => {
        setMarks(emptyMarks());
        setResult(null);
        setAnalysis({});
        setMissingFields([]);
        clearCIEResult(subjectCode);
        clearCIEDraft(subjectCode);
        if (onCIESaved) onCIESaved(null);
    };

    const isMissing = f => missingFields.includes(f);



    const modalContent = (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-300 sm:ml-20 lg:ml-32"
                onClick={e => e.stopPropagation()}
            >
                {/* Analyzing Overlay (absolute to this container) */}
                {isAnalyzing && <AnalyzingOverlay components={overlayComponents} analysis={analysis} />}

                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-violet-600/10 to-transparent flex-shrink-0">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <span className="p-1.5 bg-violet-600 rounded-lg text-sm">⚡</span>
                            CIE Analyzer
                        </h3>
                        <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest font-black">
                            {rule.name} · {subject?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {result && (
                            <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-400/40 transition font-black">
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable content area */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {!result ? (
                        <>
                            <div className={`grid gap-6 ${hasTheory && hasPractical ? 'md:grid-cols-2' : 'grid-cols-1'} cie-form-container`}>
                                {/* ── Theory Column ── */}
                                {hasTheory && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-white/60 uppercase tracking-widest border-b border-white/10 pb-2">Theory CIE</h4>

                                        {/* ── Tests ── */}
                                        {rule.theory?.tests && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Tests (max 50 each)</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Test 1</label>
                                                        <input type="number" min="0" max="50" value={m.test1} placeholder="0–50"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 50);
                                                                updateMark('test1', v);
                                                                autoAdvance(e, v, 50);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-purple-500 ${isMissing('Test 1') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Test 2</label>
                                                        <input type="number" min="0" max="50" value={m.test2} placeholder="0–50"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 50);
                                                                updateMark('test2', v);
                                                                autoAdvance(e, v, 50);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-purple-500 ${isMissing('Test 2') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                </div>
                                                {testSum > 0 && (
                                                    <ProgressBar label="Test Section"
                                                        current={testReduced} max={rule.theory.tests.reducedTo}
                                                        rawLabel={`Raw: ${testSum}/100`}
                                                        allFilled={allTestFilled}
                                                        minThreshold={rule.theory.tests.reducedTo * (rule.theory.tests.minTotal / rule.theory.tests.max)}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* ── Quiz ── */}
                                        {rule.theory?.quiz && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Quiz (max 20 each)</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Quiz 1</label>
                                                        <input type="number" min="0" max="20" value={m.quiz1} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('quiz1', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-cyan-500 ${isMissing('Quiz 1') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Quiz 2</label>
                                                        <input type="number" min="0" max="20" value={m.quiz2} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('quiz2', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-cyan-500 ${isMissing('Quiz 2') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                </div>
                                                {quizSum > 0 && (
                                                    <ProgressBar label="Quiz Section"
                                                        current={quizReduced} max={rule.theory.quiz.reducedTo}
                                                        allFilled={allQuizFilled}
                                                        minThreshold={rule.theory.quiz.reducedTo * (rule.theory.quiz.minTotal / rule.theory.quiz.max)}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* ── ABL ── */}
                                        {rule.theory?.abl && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">ABL (max 20 each)</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">ABL 1</label>
                                                        <input type="number" min="0" max="20" value={m.abl1} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('abl1', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-blue-500 ${isMissing('ABL 1') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">ABL 2</label>
                                                        <input type="number" min="0" max="20" value={m.abl2} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('abl2', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-blue-500 ${isMissing('ABL 2') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                </div>
                                                {ablSum > 0 && (
                                                    <ProgressBar label="ABL Section"
                                                        current={ablReduced} max={rule.theory.abl.reducedTo}
                                                        allFilled={allAblFilled}
                                                        minThreshold={rule.theory.abl.reducedTo * (rule.theory.abl.minTotal / rule.theory.abl.max)}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* ── Internal (Low Theory) ── */}
                                        {rule.theory?.internal && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Internal (max 20 each)</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Quiz (20)</label>
                                                        <input type="number" min="0" max="20" value={m.quiz1} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('quiz1', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-emerald-500 ${isMissing('Internal 1') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block">ABL (20)</label>
                                                        <input type="number" min="0" max="20" value={m.abl1} placeholder="0–20"
                                                            inputMode="numeric"
                                                            onChange={e => {
                                                                const v = clampInt(e.target.value, 20);
                                                                updateMark('abl1', v);
                                                                autoAdvance(e, v, 20);
                                                            }}
                                                            className={`w-full h-8 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/15 focus:border-emerald-500 ${isMissing('Internal 2') ? 'border-red-500/60' : 'border-white/10'}`}
                                                        />
                                                    </div>
                                                </div>
                                                {intSum > 0 && (
                                                    <ProgressBar label="Internal Section"
                                                        current={intReduced} max={rule.theory.internal.reducedTo}
                                                        allFilled={allIntFilled}
                                                        minThreshold={rule.theory.internal.reducedTo * (rule.theory.internal.minTotal / rule.theory.internal.max)}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* ── Theory CIE Summary ── */}
                                        <div className="pt-3 mt-4 border-t border-white/5">
                                            <ProgressBar label="Total Theory CIE"
                                                current={theoryScaled}
                                                max={rule.scaleTheoryTo || rule.theoryMax || 50}
                                                allFilled={allTestFilled && allQuizFilled && allAblFilled && allIntFilled}
                                                minThreshold={(rule.scaleTheoryTo || rule.theoryMax || 50) * 0.4}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── Practical Column ── */}
                                {hasPractical && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-white/60 uppercase tracking-widest border-b border-white/10 pb-2">Lab CIE</h4>

                                        {/* ── Lab Records — count-first + 4-col grid ── */}
                                        {rule.practical?.record && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Lab Records (max 35 each)</p>
                                                {!m._labCountSet ? (
                                                    <CountInput label="Labs" placeholder="How many labs? e.g. 10" color="orange"
                                                        onSet={n => setMarks(prev => ({ ...prev, labs: Array(n).fill(''), _labCountSet: true }))}
                                                    />
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-orange-300/60 font-bold">{m.labs.length} labs · enter &amp; press ⏎ to advance</span>
                                                            <button type="button"
                                                                onClick={() => setMarks(prev => ({ ...prev, labs: [''], _labCountSet: false }))}
                                                                className="text-[9px] text-white/30 hover:text-white/60 transition font-bold"
                                                            >reset</button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-1.5">
                                                            {m.labs.map((val, idx) => {
                                                                const hasErr = isMissing('Lab Records') && val === '';
                                                                return (
                                                                    <div key={idx} className="space-y-0.5">
                                                                        <label className="text-[7px] font-black text-white/30 uppercase block text-center">L{idx + 1}</label>
                                                                        <input
                                                                            type="number" min="0" max={35}
                                                                            value={val} placeholder="—"
                                                                            inputMode="numeric" pattern="[0-9]*"
                                                                            ref={el => { labRefs.current[idx] = el; }}
                                                                            onChange={e => {
                                                                                const v = clampInt(e.target.value, 35);
                                                                                updateMark('labs', v, idx);
                                                                                autoAdvance(e, v, 35);
                                                                            }}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    const nxt = labRefs.current[idx + 1];
                                                                                    if (nxt) { nxt.focus(); nxt.select(); }
                                                                                }
                                                                            }}
                                                                            className={`w-full h-8 bg-white/5 border rounded-md text-center text-xs font-bold outline-none transition-all placeholder:text-white/10 focus:border-orange-400 focus:bg-orange-400/5 ${hasErr ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'}`}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {labSum > 0 && (
                                                            <ProgressBar label="Lab Records"
                                                                current={labReduced} max={rule.practical.record.reducedTo}
                                                                rawLabel={`Raw: ${labSum}/${rule.practical.record.max}`}
                                                                allFilled={allLabsFilled}
                                                                minThreshold={rule.practical.record.reducedTo * (rule.practical.record.minTotal / rule.practical.record.max)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Lab Tests — count-first + 4-col grid ── */}
                                        {rule.practical?.test && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Lab Tests (max 15 each)</p>
                                                {!m._labTestCountSet ? (
                                                    <CountInput label="Lab Tests" placeholder="How many lab tests? e.g. 2" color="rose"
                                                        onSet={n => setMarks(prev => ({ ...prev, labTests: Array(n).fill(''), _labTestCountSet: true }))}
                                                    />
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-rose-300/60 font-bold">{m.labTests.length} tests · enter &amp; press ⏎ to advance</span>
                                                            <button type="button"
                                                                onClick={() => setMarks(prev => ({ ...prev, labTests: [''], _labTestCountSet: false }))}
                                                                className="text-[9px] text-white/30 hover:text-white/60 transition font-bold"
                                                            >reset</button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-1.5">
                                                            {m.labTests.map((val, idx) => {
                                                                const hasErr = isMissing('Lab Test') && val === '';
                                                                return (
                                                                    <div key={idx} className="space-y-0.5">
                                                                        <label className="text-[7px] font-black text-white/30 uppercase block text-center">T{idx + 1}</label>
                                                                        <input
                                                                            type="number" min="0" max={15}
                                                                            value={val} placeholder="—"
                                                                            inputMode="numeric" pattern="[0-9]*"
                                                                            ref={el => { labTestRefs.current[idx] = el; }}
                                                                            onChange={e => {
                                                                                const v = clampInt(e.target.value, 15);
                                                                                updateMark('labTests', v, idx);
                                                                                autoAdvance(e, v, 15);
                                                                            }}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    const nxt = labTestRefs.current[idx + 1];
                                                                                    if (nxt) { nxt.focus(); nxt.select(); }
                                                                                }
                                                                            }}
                                                                            className={`w-full h-8 bg-white/5 border rounded-md text-center text-xs font-bold outline-none transition-all placeholder:text-white/10 focus:border-rose-400 focus:bg-rose-400/5 ${hasErr ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'}`}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {labTestSum > 0 && (
                                                            <ProgressBar label="Lab Test"
                                                                current={labTestRed} max={rule.practical.test.reducedTo}
                                                                allFilled={allLabTestFilled}
                                                                minThreshold={rule.practical.test.reducedTo * (rule.practical.test.minTotal / (rule.practical.test.max * Math.max(1, m.labTests.length)))}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Lab CIE Summary ── */}
                                        <div className="pt-3 mt-4 border-t border-white/5">
                                            <ProgressBar label="Total Lab CIE"
                                                current={labReduced + labTestRed}
                                                max={rule.practicalMax || 50}
                                                allFilled={allLabsFilled && allLabTestFilled}
                                                minThreshold={(rule.practicalMax || 50) * 0.4}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Total live preview ── */}
                            {totalCIE > 0 && (
                                <div className="pt-1 border-t border-white/5">
                                    <ProgressBar label="Total CIE (live)"
                                        current={totalCIE}
                                        max={cieMax}
                                        allFilled={allTestFilled && allQuizFilled && allAblFilled && allIntFilled && allLabsFilled && allLabTestFilled}
                                        minThreshold={rule.minTotal || 20}
                                    />
                                </div>
                            )}

                            {/* Missing warning */}
                            {missingFields.length > 0 && (
                                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-[10px] text-red-400 font-black">⚠️ Fill: {missingFields.join(', ')}</p>
                                </div>
                            )}

                            <p className="text-[9px] text-white/20 text-center">✦ Marks auto-saved as you type</p>

                            {/* Analyze button */}
                            <button
                                onClick={handleAnalyze} disabled={isAnalyzing}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/30 disabled:opacity-60"
                            >
                                ⚡ Analyze &amp; Calculate CIE
                            </button>
                        </>
                    ) : (
                        /* ─── Result View (Aligned) ─── */
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* CIE banner */}
                            <div className={`p-4 rounded-xl flex items-center justify-between ${result.isEligible ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30'}`}>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/50">CIE Score</p>
                                    <p className={`text-3xl font-black ${result.isEligible ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {result.cie} <span className="text-sm font-bold text-white/30">/ {result.cieMax ?? cieMax}</span>
                                    </p>
                                </div>
                                <div className={`px-3 py-2 rounded-full text-xs font-black uppercase ${result.isEligible ? 'bg-emerald-500 text-white' : 'bg-red-500/80 text-white'}`}>
                                    {result.isEligible ? '🎉 Eligible' : '✗ Not Eligible'}
                                </div>
                            </div>

                            <ProgressBar label="Total CIE"
                                current={result.cie} max={result.cieMax ?? cieMax}
                                allFilled={true}
                                minThreshold={rule.minTotal || 20}
                            />

                            {!result.isEligible && (
                                <p className="text-[10px] text-red-400/70 text-center">Min CIE required: {rule.minTotal} / {result.cieMax ?? cieMax}</p>
                            )}
                            {result.isEligible && (
                                <p className="text-[10px] text-emerald-400/70 text-center font-black">🎊 Congratulations! You are eligible for the SEE.</p>
                            )}

                            <p className="text-[10px] text-white/30 text-center">✅ Saved · Auto-fills SGPA Calculator</p>

                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition"
                            >
                                ✏️ Edit Marks
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CIECalculatorModal;
