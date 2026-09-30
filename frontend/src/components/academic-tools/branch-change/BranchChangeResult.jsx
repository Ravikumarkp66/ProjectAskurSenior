import React from 'react';
import {
    CheckCircle2,
    AlertCircle,
    ShieldAlert,
    Info,
    ArrowRight,
    Table,
    Lock
} from 'lucide-react';

export default function BranchChangeResult({ analysisResult, onOpenMatrix, isLocked = false, onLockedClick }) {
    if (!analysisResult) return null;

    const {
        studentInput,
        targetStats,
        transitionStats,
        analysis,
        meta
    } = analysisResult;

    const hasAllocations = targetStats && targetStats.hasAllocations;
    const lowest = hasAllocations ? targetStats.cgpaStats.lowest : null;
    const highest = hasAllocations ? targetStats.cgpaStats.highest : null;
    const median = hasAllocations ? targetStats.cgpaStats.median : null;
    const studentCgpa = studentInput.cgpa;

    // Pin position percentage for horizontal range track
    let pinPosition = 50;
    if (hasAllocations && highest > lowest) {
        const minBound = Math.max(0, lowest - 0.2);
        const maxBound = Math.min(10, highest + 0.2);
        const clamped = Math.max(minBound, Math.min(maxBound, studentCgpa));
        pinPosition = Math.round(((clamped - minBound) / (maxBound - minBound)) * 100);
    }

    const renderStatusBadge = () => {
        if (analysis.isBacklogRestricted) {
            return (
                <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded">
                    [✕ REGULATION DISQUALIFIED]
                </span>
            );
        }
        if (analysis.cgpaPosition === 'ABOVE_OR_EQUAL_MAX') {
            return (
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded">
                    [★ ABOVE OBSERVED PEAK]
                </span>
            );
        }
        if (analysis.cgpaPosition === 'WITHIN_RANGE') {
            return (
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded">
                    [✓ WITHIN OBSERVED RANGE]
                </span>
            );
        }
        if (analysis.cgpaPosition === 'BELOW_RANGE') {
            return (
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded">
                    [⚠ BELOW OBSERVED RANGE]
                </span>
            );
        }
        return (
            <span className="font-mono text-xs text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                [NO ALLOCATIONS]
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-4 font-mono text-xs text-slate-900 dark:text-slate-200">
            {/* Header / Score Display Bar (Matching CIEResultSection) */}
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 flex flex-col gap-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                            Target Department Analysis · AY {meta.academicYear}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                [{targetStats.targetBranch}] {targetStats.branchInfo?.name || targetStats.targetBranch}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {hasAllocations ? (
                                <span>{targetStats.confirmedCount} confirmed allotments · Observed range {lowest.toFixed(2)} to {highest.toFixed(2)} (Median: {median.toFixed(2)})</span>
                            ) : (
                                <span>0 confirmed allotments recorded in AY 2025–26</span>
                            )}
                        </div>
                    </div>

                    <div className="self-start sm:self-auto">
                        {renderStatusBadge()}
                    </div>
                </div>

                {/* Backlog Alert if applicable */}
                {analysis.isBacklogRestricted && (
                    <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                        <ShieldAlert size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="m-0 leading-relaxed font-bold text-rose-800 dark:text-rose-200">REGULATION RESTRICTION ACTIVE</p>
                            <p className="m-0 leading-relaxed text-[11px] text-rose-700/90 dark:text-rose-300/90">
                                SIT Autonomous regulations require 0 active backlogs across Semesters 1 and 2. Candidates with active backlogs cannot be considered for branch change allocation regardless of CGPA.
                            </p>
                        </div>
                    </div>
                )}

                {/* Compact Metrics Row */}
                {hasAllocations && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded p-2.5">
                            <div className="text-[10px] text-slate-500 uppercase">Confirmed Seats</div>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{targetStats.confirmedCount} seats</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded p-2.5">
                            <div className="text-[10px] text-slate-500 uppercase">Lowest Observed</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-200 mt-0.5">{lowest.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded p-2.5">
                            <div className="text-[10px] text-slate-500 uppercase">Median Observed</div>
                            <div className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-0.5">{median.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded p-2.5">
                            <div className="text-[10px] text-slate-500 uppercase">Allotment Rank Band</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-200 mt-0.5">#{targetStats.rankRange?.min} – #{targetStats.rankRange?.max}</div>
                        </div>
                    </div>
                )}

                {/* Range Visual Bar */}
                {hasAllocations && (
                    <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>MIN: {lowest.toFixed(2)}</span>
                            <span className="text-purple-700 dark:text-purple-300 font-semibold">MEDIAN: {median.toFixed(2)}</span>
                            <span>MAX: {highest.toFixed(2)}</span>
                        </div>

                        <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded overflow-visible my-1">
                            {/* Target Observed Band */}
                            <div className="absolute inset-y-0 left-[15%] right-[15%] bg-purple-100 dark:bg-purple-950/60 border-x border-purple-300 dark:border-purple-600/50" />

                            {/* Median Tick */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-purple-600 dark:bg-purple-400 z-10"
                                style={{ left: '50%' }}
                                title={`Median: ${median.toFixed(2)}`}
                            />

                            {/* Student Pin */}
                            <div
                                className="absolute -top-2.5 -translate-x-1/2 flex flex-col items-center z-20"
                                style={{ left: `${pinPosition}%` }}
                            >
                                <div className="w-4 h-4 rounded bg-purple-600 dark:bg-cyan-400 border border-white dark:border-slate-950 text-white dark:text-slate-950 font-bold text-[9px] flex items-center justify-center shadow">
                                    ▲
                                </div>
                                <span className="text-[9px] font-bold text-purple-700 dark:text-cyan-300 bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-purple-300 dark:border-cyan-800 mt-0.5 whitespace-nowrap shadow-xs">
                                    You: {studentCgpa.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Academic Verification Audit Table (Matching EligibilityAuditSection) */}
            <div className="flex flex-col gap-2 font-mono">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        HISTORICAL DATA-DRIVEN AUDIT
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        AY {meta.academicYear} Empirical Verification
                    </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0d1117] overflow-hidden text-xs shadow-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                                <th className="py-2.5 px-4 font-semibold">Verification Check</th>
                                <th className="py-2.5 px-4 font-semibold text-center w-48">Observed / Recorded Value</th>
                                <th className="py-2.5 px-3 font-semibold text-slate-400 dark:text-slate-500 hidden sm:table-cell">Standard / Context</th>
                                <th className="py-2.5 px-4 font-semibold text-right w-32">Audit Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {/* Check 1: Backlog Regulation */}
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-4 text-slate-900 dark:text-slate-300 font-semibold">
                                    <div>1st-Year Backlog Regulation</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-normal">SIT Autonomous rule</div>
                                </td>
                                <td className="py-2.5 px-4 text-center font-semibold">
                                    {analysis.isBacklogRestricted ? (
                                        <span className="text-rose-600 dark:text-rose-400">1+ Active Backlogs</span>
                                    ) : (
                                        <span className="text-emerald-600 dark:text-emerald-400">0 Active Backlogs</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] hidden sm:table-cell">
                                    Must be 0 across Sem 1 & 2
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                    {analysis.isBacklogRestricted ? (
                                        <span className="font-bold text-rose-600 dark:text-rose-400">[DISQUALIFIED]</span>
                                    ) : (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">[PASS]</span>
                                    )}
                                </td>
                            </tr>

                            {/* Check 2: CGPA Benchmark */}
                            {hasAllocations && (
                                <tr className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-300 font-semibold">
                                        <div>CGPA Benchmark Position</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-normal">Relative to confirmed allotments</div>
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-semibold">
                                        <span className="text-slate-900 dark:text-slate-100">{studentCgpa.toFixed(2)}</span>
                                        <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Range: {lowest.toFixed(2)} – {highest.toFixed(2)}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] hidden sm:table-cell">
                                        Lowest observed: {lowest.toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        {studentCgpa >= lowest ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">[WITHIN RANGE]</span>
                                        ) : (
                                            <span className="font-bold text-amber-600 dark:text-amber-400">[BELOW MIN]</span>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {/* Check 3: Feeder Transition Precedent */}
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-4 text-slate-900 dark:text-slate-300 font-semibold">
                                    <div>Transition Precedent ({studentInput.currentBranch} → {studentInput.targetBranch})</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-normal">Historical path existence</div>
                                </td>
                                <td className="py-2.5 px-4 text-center font-semibold">
                                    {transitionStats.hasPrecedent ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">{transitionStats.count} Student(s) Confirmed</span>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500">0 Switches in AY 25-26</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] hidden sm:table-cell">
                                    {transitionStats.hasPrecedent
                                        ? `Observed: ${transitionStats.cgpaRange?.min.toFixed(2)} – ${transitionStats.cgpaRange?.max.toFixed(2)}`
                                        : 'Admitted from other branches'}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                    {transitionStats.hasPrecedent ? (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">[CONFIRMED]</span>
                                    ) : (
                                        <span className="font-bold text-slate-500 dark:text-slate-400">[UNRECORDED]</span>
                                    )}
                                </td>
                            </tr>

                            {/* Check 4: Preference Choice Alignment */}
                            {hasAllocations && (
                                <tr className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-300 font-semibold">
                                        <div>Counseling Preference Tier</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-normal">Candidate option priority</div>
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-semibold">
                                        <span className="text-purple-700 dark:text-purple-300">Preference #{studentInput.targetPreference}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] hidden sm:table-cell">
                                        {targetStats.preferenceDistribution[`p${studentInput.targetPreference}`] || 0} of {targetStats.confirmedCount} allocated at this rank
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">[ALIGNED]</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Factual Academic Observations */}
            <div className="flex flex-col gap-2 font-mono">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Itemized Observations (Empirical Data Only)
                </span>

                <div className="space-y-2">
                    {analysis.observations.map((obs, idx) => (
                        <div
                            key={idx}
                            className={`p-2.5 rounded text-xs border flex items-start gap-2.5 shadow-xs ${
                                obs.tone === 'positive'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                    : obs.tone === 'caution'
                                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
                                        : obs.tone === 'negative'
                                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                                            : 'bg-slate-50 dark:bg-[#161b22] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            {obs.tone === 'positive' ? (
                                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : obs.tone === 'caution' ? (
                                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            ) : obs.tone === 'negative' ? (
                                <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            ) : (
                                <Info size={14} className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-relaxed">{obs.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feeder Department Breakdown Sheet */}
            {hasAllocations && Object.keys(targetStats.feederBranches).length > 0 && (
                <div className="flex flex-col gap-2 font-mono">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
                            FEEDER DEPARTMENT ALLOTMENTS ({targetStats.targetBranch})
                        </span>
                        {onOpenMatrix && (
                            <button
                                type="button"
                                onClick={isLocked ? onLockedClick : onOpenMatrix}
                                className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                            >
                                {isLocked ? <Lock size={11} className="text-purple-600 dark:text-purple-400" /> : <Table size={12} />}
                                <span>View all 58 records sheet →</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {Object.entries(targetStats.feederBranches).map(([feeder, count]) => (
                            <div key={feeder} className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded p-2 flex justify-between items-center shadow-xs">
                                <span className="text-slate-600 dark:text-slate-300">From [{feeder}]:</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{count} {count === 1 ? 'seat' : 'seats'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Institutional Disclaimer */}
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.02] text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono shadow-xs">
                <span className="font-bold text-slate-800 dark:text-slate-300">Official Disclaimer: </span>
                {meta.disclaimer} Merit seat distribution changes annually based on student retention and department capacities.
            </div>
        </div>
    );
}
