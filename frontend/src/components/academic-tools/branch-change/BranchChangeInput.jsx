import React from 'react';
import { Sliders, AlertCircle } from 'lucide-react';
import { getBranchList } from '../../../utils/branchChangeEngine';

export default function BranchChangeInput({
    cgpa,
    onCgpaChange,
    currentBranch,
    onCurrentBranchChange,
    targetBranch,
    onTargetBranchChange,
    hasBacklog,
    onHasBacklogChange,
    targetPreference,
    onTargetPreferenceChange,
    error
}) {
    const branches = getBranchList();

    const isCgpaEntered = cgpa !== '' && !isNaN(Number(cgpa)) && Number(cgpa) >= 0 && Number(cgpa) <= 10;
    const isCurrentEntered = Boolean(currentBranch);
    const isTargetEntered = Boolean(targetBranch) && targetBranch !== currentBranch;

    return (
        <div className="flex flex-col gap-4 font-mono text-xs">
            {/* CSES Subheader Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wide">
                        BRANCH CHANGE PARAMETERS
                    </span>
                    <span className="text-slate-500 text-[11px]">
                        [AY 2025–26 OFFICIAL BASELINE]
                    </span>
                </div>

                <div className="text-[11px]">
                    {(!isCgpaEntered || !isCurrentEntered || !isTargetEntered) ? (
                        <span className="text-amber-400 font-semibold">
                            Parameters Required
                        </span>
                    ) : (
                        <span className="text-emerald-400 font-semibold">
                            Parameters Complete
                        </span>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <span>{error}</span>
                </div>
            )}

            {/* CSES Academic Parameters Table */}
            <div className="border border-slate-800 rounded bg-[#0b0c10] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-800 bg-white/[0.03] text-slate-400 text-[11px] uppercase">
                            <th className="py-2.5 px-4 font-semibold tracking-wider">Parameter</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-center w-52">Student Input</th>
                            <th className="py-2.5 px-3 font-semibold tracking-wider text-slate-500 hidden sm:table-cell">Regulation / Standard</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-right w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                        {/* Row 1: 1st Year CGPA */}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-200 font-semibold">
                                <div>1st-Year Aggregate CGPA</div>
                                <div className="text-[10px] text-slate-500 font-normal">Semesters 1 & 2 combined</div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <input
                                        type="number"
                                        min="0.00"
                                        max="10.00"
                                        step="0.01"
                                        value={cgpa}
                                        onChange={(e) => onCgpaChange(e.target.value)}
                                        placeholder="0.00"
                                        className="w-24 bg-[#131720] border border-slate-700 text-slate-100 font-mono text-xs rounded text-center px-2 py-1 focus:outline-none focus:border-slate-400"
                                    />
                                    <span className="text-slate-500 text-[11px]">/ 10.00</span>
                                </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden sm:table-cell">
                                Merit list aggregate ranking criteria
                            </td>
                            <td className="py-2.5 px-4 text-right">
                                {isCgpaEntered ? (
                                    <span className="text-emerald-400 font-bold">[OK]</span>
                                ) : (
                                    <span className="text-amber-400 font-bold">[REQ]</span>
                                )}
                            </td>
                        </tr>

                        {/* Row 2: Current Branch */}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-200 font-semibold">
                                <div>Current Enrolled Branch</div>
                                <div className="text-[10px] text-slate-500 font-normal">Your original admitting branch</div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                                <select
                                    value={currentBranch}
                                    onChange={(e) => onCurrentBranchChange(e.target.value)}
                                    className="w-full max-w-[200px] bg-[#131720] border border-slate-700 text-slate-100 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-slate-400 cursor-pointer"
                                >
                                    <option value="" disabled>-- Select Branch --</option>
                                    {branches.map(b => (
                                        <option key={b.code} value={b.code}>
                                            [{b.code}] {b.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden sm:table-cell">
                                Source feeder branch
                            </td>
                            <td className="py-2.5 px-4 text-right">
                                {isCurrentEntered ? (
                                    <span className="text-emerald-400 font-bold">[OK]</span>
                                ) : (
                                    <span className="text-amber-400 font-bold">[REQ]</span>
                                )}
                            </td>
                        </tr>

                        {/* Row 3: Target Branch */}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-200 font-semibold">
                                <div>Target Desired Branch</div>
                                <div className="text-[10px] text-slate-500 font-normal">Branch you wish to switch into</div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                                <select
                                    value={targetBranch}
                                    onChange={(e) => onTargetBranchChange(e.target.value)}
                                    className="w-full max-w-[200px] bg-[#131720] border border-slate-700 text-slate-100 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-slate-400 cursor-pointer"
                                >
                                    <option value="" disabled>-- Select Branch --</option>
                                    {branches
                                        .filter(b => b.code !== currentBranch)
                                        .map(b => (
                                            <option key={b.code} value={b.code}>
                                                [{b.code}] {b.name}
                                            </option>
                                        ))}
                                </select>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden sm:table-cell">
                                Destination branch vacancy pool
                            </td>
                            <td className="py-2.5 px-4 text-right">
                                {isTargetEntered ? (
                                    <span className="text-emerald-400 font-bold">[OK]</span>
                                ) : (
                                    <span className="text-amber-400 font-bold">[REQ]</span>
                                )}
                            </td>
                        </tr>

                        {/* Row 4: Preference Rank */}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-200 font-semibold">
                                <div>Counseling Preference Tier</div>
                                <div className="text-[10px] text-slate-500 font-normal">Order in option entry (1 to 4)</div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                                <select
                                    value={targetPreference}
                                    onChange={(e) => onTargetPreferenceChange(Number(e.target.value))}
                                    className="w-full max-w-[200px] bg-[#131720] border border-slate-700 text-slate-100 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-slate-400 cursor-pointer"
                                >
                                    <option value={1}>[Pref #1] 1st Choice</option>
                                    <option value={2}>[Pref #2] 2nd Choice</option>
                                    <option value={3}>[Pref #3] 3rd Choice</option>
                                    <option value={4}>[Pref #4] 4th Choice</option>
                                </select>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden sm:table-cell">
                                Evaluates historical allotment priority
                            </td>
                            <td className="py-2.5 px-4 text-right">
                                <span className="text-emerald-400 font-bold">[OK]</span>
                            </td>
                        </tr>

                        {/* Row 5: Backlogs Check */}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-slate-200 font-semibold">
                                <div>Academic Backlogs Audit</div>
                                <div className="text-[10px] text-slate-500 font-normal">Active F/I grades in 1st/2nd Sem</div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => onHasBacklogChange(!hasBacklog)}
                                    className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                                        hasBacklog
                                            ? 'bg-rose-950/40 border-rose-600 text-rose-300'
                                            : 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                                    }`}
                                >
                                    {hasBacklog ? '[1+ ACTIVE BACKLOGS]' : '[0 ACTIVE BACKLOGS]'}
                                </button>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden sm:table-cell">
                                SIT autonomy mandates 0 backlogs
                            </td>
                            <td className="py-2.5 px-4 text-right">
                                {hasBacklog ? (
                                    <span className="text-rose-400 font-bold">[INELIGIBLE]</span>
                                ) : (
                                    <span className="text-emerald-400 font-bold">[ELIGIBLE]</span>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Regulatory Footer Note */}
            <div className="p-3 rounded border border-slate-800 bg-[#161b22] text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300">SIT Regulations Reminder: </span>
                Branch change applications are evaluated strictly on 1st-year aggregate CGPA. Candidates with any active backlog in semesters 1 or 2 are automatically excluded from the merit list.
            </div>
        </div>
    );
}
