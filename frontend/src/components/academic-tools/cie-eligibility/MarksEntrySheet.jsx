import React, { useRef } from 'react';
import { AlertCircle } from 'lucide-react';

export default function MarksEntrySheet({
    evalConfig,
    rawMarks = {},
    errors = {},
    onChangeMark,
    hasSavedData = false,
    includeAttendance = true,
    onToggleAttendance,
    attendanceValue = '',
    onChangeAttendance,
    attendanceThreshold = 75
}) {
    const inputRefs = useRef({});

    if (!evalConfig || !evalConfig.components) {
        return (
            <div className="p-6 border border-slate-700 text-center text-xs font-mono text-slate-400">
                Evaluation structure unavailable for this subject.
            </div>
        );
    }

    // Flatten all subcomponents in logical order for keyboard navigation
    const flatRows = [];
    Object.entries(evalConfig.components).forEach(([compKey, compConfig]) => {
        (compConfig.subComponents || []).forEach((sub) => {
            flatRows.push({
                compKey,
                compName: compConfig.name,
                subId: sub.id,
                subName: sub.name,
                maxRaw: sub.maxRaw,
                minRawRequired: compConfig.minRawRequired,
                compMaxRaw: compConfig.maxRaw
            });
        });
    });

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextRow = flatRows[index + 1];
            if (nextRow && inputRefs.current[nextRow.subId]) {
                inputRefs.current[nextRow.subId].focus();
                inputRefs.current[nextRow.subId].select();
            }
        }
    };

    const totalCount = flatRows.length;
    const enteredCount = flatRows.filter((r) => {
        const val = rawMarks[r.subId];
        return val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
    }).length;
    const remainingCount = totalCount - enteredCount;

    return (
        <div className="flex flex-col gap-4 font-sans">
            {/* CSES Subheader Bar */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                        CIE MARKS SHEET
                    </span>
                    <span className="text-slate-500 font-mono">
                        [{evalConfig.userFacingName}]
                    </span>
                </div>

                <div className="font-mono text-[11px] text-slate-400">
                    {remainingCount > 0 ? (
                        <span className="text-amber-400 font-semibold">
                            {remainingCount} of {totalCount} remaining
                        </span>
                    ) : (
                        <span className="text-emerald-400 font-semibold">
                            All {totalCount} entered
                        </span>
                    )}
                </div>
            </div>

            {/* CSES Academic Spreadsheet Table */}
            <div className="border border-slate-800 rounded bg-[#0b0c10] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="border-b border-slate-800 bg-white/[0.03] text-slate-400 text-[11px] uppercase">
                            <th className="py-2.5 px-4 font-semibold tracking-wider">Component</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-center w-36">Obtained</th>
                            <th className="py-2.5 px-3 font-semibold tracking-wider w-20 text-slate-500">Max</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-right w-24 hidden sm:table-cell">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                        {flatRows.map((row, idx) => {
                            const val = rawMarks[row.subId];
                            const isEntered = val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
                            const err = errors[row.subId];

                            return (
                                <tr
                                    key={row.subId}
                                    className={`transition-colors ${
                                        err ? 'bg-rose-950/20' : 'hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {/* Component Label */}
                                    <td className="py-2.5 px-4">
                                        <span className="text-slate-200 font-medium font-sans block">
                                            {row.subName}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {row.compName}
                                        </span>
                                    </td>

                                    {/* Spreadsheet Cell Input */}
                                    <td className="py-2 px-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <input
                                                ref={(el) => (inputRefs.current[row.subId] = el)}
                                                type="number"
                                                min="0"
                                                max={row.maxRaw}
                                                step="any"
                                                value={isEntered ? val : ''}
                                                placeholder="—"
                                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                                onChange={(e) => onChangeMark(row.subId, e.target.value, row.maxRaw)}
                                                className={`w-24 text-center py-1 px-2 rounded-sm text-xs font-mono font-bold transition-colors outline-none ${
                                                    err
                                                        ? 'bg-rose-950/40 border border-rose-500 text-rose-200'
                                                        : isEntered
                                                            ? 'bg-slate-900 border border-slate-600 text-white focus:border-slate-400 focus:bg-slate-800'
                                                            : 'bg-black/40 border border-slate-800 text-slate-400 placeholder-slate-600 focus:border-slate-500 focus:text-white'
                                                }`}
                                            />
                                            {err && (
                                                <span className="text-[10px] text-rose-400 mt-0.5 flex items-center gap-0.5 font-sans">
                                                    <AlertCircle size={10} />
                                                    {err}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Max Mark */}
                                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                                        / {row.maxRaw}
                                    </td>

                                    {/* Status Column */}
                                    <td className="py-2.5 px-4 text-right hidden sm:table-cell font-mono text-[11px]">
                                        {err ? (
                                            <span className="text-rose-400 font-bold">
                                                {err === 'Required' ? 'REQ' : 'FAIL'}
                                            </span>
                                        ) : isEntered ? (
                                            <span className="text-emerald-400 font-medium">✓ OK</span>
                                        ) : (
                                            <span className="text-slate-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Attendance Threshold Toggle Section */}
            <div className="border border-slate-800 rounded p-3 bg-[#0e1017] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={includeAttendance}
                        onChange={(e) => onToggleAttendance(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-slate-300 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                        <span className="text-xs font-semibold text-slate-200 block font-sans">
                            Include Attendance Verification
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                            Verifies required autonomous minimum (≥ {attendanceThreshold}%) for SEE clearance
                        </span>
                    </div>
                </label>

                {includeAttendance && (
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0">
                        <span className="text-xs text-slate-400 font-mono">Attendance:</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={attendanceValue}
                                onChange={(e) => onChangeAttendance(e.target.value)}
                                placeholder="85.0"
                                className={`w-18 py-1 px-2 rounded-sm bg-slate-900 border text-xs font-mono font-bold text-white text-center focus:border-slate-400 focus:bg-slate-800 outline-none ${
                                    includeAttendance && (attendanceValue === '' || isNaN(Number(attendanceValue)) || Number(attendanceValue) < 0 || Number(attendanceValue) > 100)
                                        ? 'border-amber-500/70 text-amber-200'
                                        : 'border-slate-700'
                                }`}
                            />
                            <span className="text-xs font-mono text-slate-400">%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
