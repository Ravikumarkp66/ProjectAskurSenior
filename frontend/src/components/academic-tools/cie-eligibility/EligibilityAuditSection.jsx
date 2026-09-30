import React from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,
    CalendarCheck,
    Award,
    ShieldCheck,
    FileCheck
} from 'lucide-react';

export default function EligibilityAuditSection({
    eligibilityResult
}) {
    if (!eligibilityResult) return null;

    const {
        overallState = 'INCOMPLETE',
        bannerTitle = 'INCOMPLETE DATA',
        bannerSubtitle = 'Complete your evaluation to determine final eligibility',
        items = []
    } = eligibilityResult;

    const getStatusTag = (state, valText) => {
        switch (state) {
            case 'PASSED':
                return (
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        [PASS]
                    </span>
                );
            case 'CONDONATION':
                return (
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        [CONDONATION]
                    </span>
                );
            case 'WARNING':
            case 'IN_PROGRESS':
                return (
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        [PENDING]
                    </span>
                );
            case 'FAILED':
            case 'RISK':
                return (
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        [FAIL]
                    </span>
                );
            case 'NOT_APPLICABLE':
            case 'NOT_CHECKED':
                return (
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        [EXCLUDED]
                    </span>
                );
            case 'UNKNOWN':
            default:
                return (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        [UNKNOWN]
                    </span>
                );
        }
    };

    const getBannerBorderBg = () => {
        switch (overallState) {
            case 'ELIGIBLE':
                return 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
            case 'ATTENTION_REQUIRED':
                return 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300';
            case 'NOT_ELIGIBLE':
                return 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
            case 'INCOMPLETE':
            default:
                return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    ACADEMIC ELIGIBILITY AUDIT
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Autonomous Regulations
                </span>
            </div>

            {/* Verification Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0d1117] overflow-hidden text-xs shadow-xs">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                            <th className="py-2 px-3 font-semibold">Rule / Criteria</th>
                            <th className="py-2 px-3 font-semibold hidden sm:table-cell text-slate-400 dark:text-slate-500">Threshold</th>
                            <th className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Recorded</th>
                            <th className="py-2 px-3 font-semibold text-right w-24">Verdict</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.01]">
                                <td className="py-2.5 px-3">
                                    <span className="text-slate-900 dark:text-slate-200 font-semibold block font-sans">
                                        {item.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                                        {item.description}
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                                    {item.requiredText || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-bold">
                                    {item.valueText}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                    {getStatusTag(item.state, item.valueText)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Verdict Box */}
            <div className={`p-3 rounded border flex items-center justify-between gap-3 ${getBannerBorderBg()}`}>
                <div className="space-y-0.5">
                    <div className="text-xs font-bold tracking-wide">
                        STATUS: {bannerTitle}
                    </div>
                    <div className="text-[11px] opacity-90 font-sans">
                        {bannerSubtitle}
                    </div>
                </div>
            </div>
        </div>
    );
}
