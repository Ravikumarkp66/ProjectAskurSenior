import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { calculateSeeTarget } from '../../../utils/cieEligibilityEngine';

export default function SEETargetCard({
    currentCie,
    maxCie = 50,
    hasSee = true
}) {
    const [targetGrade, setTargetGrade] = useState('A+');
    const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C'];

    // If course has no SEE (e.g. NCMC), completely hide this section
    if (!hasSee) return null;

    const targetResult = calculateSeeTarget({
        currentCie,
        targetGrade,
        maxCie,
        seeMax: 100
    });

    return (
        <div className="rounded border dark:border-slate-800 border-slate-200 dark:bg-[#161b22] bg-white p-4 flex flex-col gap-3 font-mono shadow-sm">
            <div className="flex items-center justify-between text-xs pb-1 border-b dark:border-slate-800 border-slate-100">
                <span className="font-bold dark:text-slate-200 text-slate-800 uppercase tracking-wide">
                    SEE TARGET FORECAST
                </span>
                <span className="text-[11px] dark:text-slate-500 text-slate-400">
                    SEE Max: 100 (Scaled /50)
                </span>
            </div>

            {/* Target Grade Selector Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="dark:text-slate-400 text-slate-500 mr-1">Target Grade:</span>
                {GRADES.map((grade) => {
                    const isSelected = grade === targetGrade;
                    return (
                        <button
                            key={grade}
                            type="button"
                            onClick={() => setTargetGrade(grade)}
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                                isSelected
                                    ? 'dark:bg-slate-100 dark:text-slate-900 bg-violet-600 text-white border border-transparent shadow-sm'
                                    : 'dark:bg-slate-800 dark:text-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 border dark:border-slate-700 border-slate-200'
                            }`}
                        >
                            {grade}
                        </button>
                    );
                })}
            </div>

            {/* Target Result Box */}
            {targetResult.isValid && (
                <div className={`p-3 rounded border text-xs ${
                    targetResult.status === 'IMPOSSIBLE'
                        ? 'dark:bg-rose-950/20 bg-rose-50 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300'
                        : targetResult.status === 'ALREADY_ACHIEVED'
                            ? 'dark:bg-emerald-950/20 bg-emerald-50 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'dark:bg-[#0d1117] bg-slate-50 dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800'
                }`}>
                    <div className="font-bold">
                        {targetResult.status === 'IMPOSSIBLE' ? (
                            <span>[UNACHIEVABLE] Grade {targetGrade} exceeds 100 SEE ceiling</span>
                        ) : targetResult.status === 'ALREADY_ACHIEVED' ? (
                            <span>[SECURED] Grade {targetGrade} secured with minimum pass (40 / 100)</span>
                        ) : (
                            <span>[REQUIREMENT] Required SEE Score: {targetResult.requiredSeeRaw} / {targetResult.seeMax} (Scaled: {targetResult.requiredSeeScaled} / 50)</span>
                        )}
                    </div>
                    <p className="text-[11px] opacity-80 m-0 mt-1 leading-relaxed font-sans">
                        {targetResult.message}
                    </p>
                </div>
            )}
        </div>
    );
}
