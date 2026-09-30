import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import { calculateSeeTarget } from '../../../utils/cieEligibilityEngine';
import { useAuth } from '../../../context/AuthContext';

export default function SEETargetCard({
    currentCie,
    maxCie = 50,
    hasSee = true,
    isLocked = false,
    onLockedClick
}) {
    const { isAuthenticated } = useAuth();
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
        <div 
            onClick={isLocked ? onLockedClick : undefined}
            className={`rounded border dark:border-slate-800 border-slate-200 dark:bg-[#161b22] bg-white p-4 flex flex-col gap-3 font-mono shadow-sm transition-all ${
                isLocked ? 'cursor-pointer hover:border-purple-500/50 hover:shadow-md' : ''
            }`}
        >
            <div className="flex items-center justify-between text-xs pb-1 border-b dark:border-slate-800 border-slate-100">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold dark:text-slate-200 text-slate-800 uppercase tracking-wide">
                        SEE TARGET FORECAST
                    </span>
                    {isLocked && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
                            <Lock size={10} />
                            <span>PLUS</span>
                        </span>
                    )}
                </div>
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
                            disabled={isLocked}
                            onClick={() => !isLocked && setTargetGrade(grade)}
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                                isLocked
                                    ? isSelected
                                        ? 'opacity-60 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                                        : 'opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : isSelected
                                        ? 'dark:bg-slate-100 dark:text-slate-900 bg-violet-600 text-white border border-transparent shadow-sm cursor-pointer'
                                        : 'dark:bg-slate-800 dark:text-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 border dark:border-slate-700 border-slate-200 cursor-pointer'
                            }`}
                        >
                            {grade}
                        </button>
                    );
                })}
            </div>

            {/* Target Result Box */}
            {isLocked ? (
                <div className="p-3 rounded border text-xs dark:bg-purple-950/20 bg-purple-50/70 border-purple-200 dark:border-purple-900/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                                Unlock SEE Target Forecast
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 m-0 mt-0.5 font-sans">
                                Calculate the exact SEE marks needed to secure each target grade.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onLockedClick?.();
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-mono font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                    >
                        {isAuthenticated ? <Sparkles size={11} className="text-amber-300" /> : <Lock size={11} />}
                        <span>{isAuthenticated ? 'Upgrade' : 'Unlock'}</span>
                    </button>
                </div>
            ) : targetResult.isValid ? (
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
            ) : null}
        </div>
    );
}
