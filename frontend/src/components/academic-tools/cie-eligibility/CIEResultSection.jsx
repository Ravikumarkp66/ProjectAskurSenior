import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

export default function CIEResultSection({
    cieResult,
    evalConfig
}) {
    if (!cieResult || !cieResult.isValid) return null;

    const {
        totalCie = 0,
        maxCie = 50,
        percentage = 0,
        status = 'NOT_STARTED',
        contributions = {},
        failedRequirements = [],
        evaluationType = 'THEORY_ONLY'
    } = cieResult;

    const renderStatusBadge = () => {
        if (status === 'ELIGIBLE') {
            return (
                <span className="font-mono text-xs font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1 rounded">
                    [✓ CIE SATISFIED]
                </span>
            );
        }
        if (status === 'NOT_ELIGIBLE') {
            return (
                <span className="font-mono text-xs font-bold text-rose-400 border border-rose-500/40 bg-rose-950/30 px-2.5 py-1 rounded">
                    [✕ CIE NOT SATISFIED]
                </span>
            );
        }
        if (status === 'PARTIAL') {
            return (
                <span className="font-mono text-xs font-bold text-amber-400 border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 rounded">
                    [⋯ IN PROGRESS]
                </span>
            );
        }
        return (
            <span className="font-mono text-xs text-slate-400 border border-slate-700 bg-slate-800 px-2.5 py-1 rounded">
                [NOT STARTED]
            </span>
        );
    };

    return (
        <div className="rounded border border-slate-800 bg-[#161b22] p-4 flex flex-col gap-4 font-mono">
            {/* Header / Score Display */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                        CIE Score Summary
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-white tracking-tight">
                            {totalCie.toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-400">
                            / {maxCie}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 ml-1">
                            ({percentage}%)
                        </span>
                    </div>
                </div>

                <div className="self-start sm:self-auto">
                    {renderStatusBadge()}
                </div>
            </div>

            {/* Failed Requirement Alert (if any) */}
            {failedRequirements.length > 0 && (
                <div className="p-3 rounded bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        {failedRequirements.map((req, idx) => (
                            <p key={idx} className="m-0 leading-relaxed font-mono">{req}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Component Breakdown Table */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Component Breakdown
                </span>

                <div className="border border-slate-800 rounded bg-[#0d1117] overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-white/[0.02] text-slate-400 text-[11px] uppercase">
                                <th className="py-2 px-3 font-semibold">Component</th>
                                <th className="py-2 px-3 text-right font-semibold">Scaled Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {evaluationType === 'IPCC' ? (
                                <>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Theory (Scaled /25)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.theoryTotal?.toFixed(2) || '0.00'} / 25
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Practical (Scaled /25)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.practicalTotal?.toFixed(2) || '0.00'} / 25
                                        </td>
                                    </tr>
                                </>
                            ) : evaluationType === 'THEORY_ONLY' ? (
                                <>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Tests (Sum /100 scaled to 34)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.tests?.toFixed(2) || '0.00'} / 34
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Quizzes (Sum /40 scaled to 8)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.quizzes?.toFixed(2) || '0.00'} / 8
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Assignments / ABL (Sum /40 scaled to 8)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.assignments?.toFixed(2) || '0.00'} / 8
                                        </td>
                                    </tr>
                                </>
                            ) : evaluationType === 'LAB_ONLY' ? (
                                <>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Lab Record (/350 scaled to 35)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.labRecord?.toFixed(2) || '0.00'} / 35
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Lab Test (/15 scaled to 15)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.labTest?.toFixed(2) || '0.00'} / 15
                                        </td>
                                    </tr>
                                </>
                            ) : evaluationType === 'LOW_THEORY' ? (
                                <>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Tests (/100 scaled to 34)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.tests?.toFixed(2) || '0.00'} / 34
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-300 font-sans">Internal Assessment (/40 scaled to 16)</td>
                                        <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                            {contributions.internalAssessment?.toFixed(2) || '0.00'} / 16
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td className="py-2 px-3 text-slate-300 font-sans">Continuous Internal Evaluation (100%)</td>
                                    <td className="py-2 px-3 text-right text-slate-100 font-mono">
                                        {totalCie.toFixed(2)} / {maxCie}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-white/[0.04] font-bold border-t border-slate-700">
                                <td className="py-2 px-3 text-slate-100 font-sans">Total CIE</td>
                                <td className="py-2 px-3 text-right text-emerald-400 font-mono">
                                    {totalCie.toFixed(2)} / {maxCie}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
