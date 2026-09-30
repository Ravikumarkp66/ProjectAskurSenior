import React, { useRef } from 'react';
import { AlertCircle, Lock } from 'lucide-react';

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
    attendanceThreshold = 75,
    readOnly = false,
    onLockedClick
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
            {/* Subheader Bar */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                        {readOnly && <Lock size={12} className="text-slate-400" />}
                        CIE MARKS SHEET
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                        [{evalConfig.userFacingName}]
                    </span>
                    {readOnly && (
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
                            Demo Mode
                        </span>
                    )}
                </div>

                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {readOnly ? (
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                            Sample Marks Pre-filled
                        </span>
                    ) : remainingCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {remainingCount} of {totalCount} remaining
                        </span>
                    ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            All {totalCount} entered
                        </span>
                    )}
                </div>
            </div>

            {/* Academic Spreadsheet Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0b0c10] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                            <th className="py-2.5 px-4 font-semibold tracking-wider">Component</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-center w-36">Obtained</th>
                            <th className="py-2.5 px-3 font-semibold tracking-wider w-20 text-slate-400 dark:text-slate-500">Max</th>
                            <th className="py-2.5 px-4 font-semibold tracking-wider text-right w-24 hidden sm:table-cell">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {flatRows.map((row, idx) => {
                            const val = rawMarks[row.subId];
                            const isEntered = val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
                            const err = errors[row.subId];

                            return (
                                <tr
                                    key={row.subId}
                                    className={`transition-colors ${
                                        err ? 'bg-rose-50/70 dark:bg-rose-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {/* Component Label */}
                                    <td className="py-2.5 px-4">
                                        <span className="text-slate-900 dark:text-slate-200 font-medium font-sans block">
                                            {row.subName}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
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
                                                readOnly={readOnly}
                                                disabled={readOnly}
                                                value={isEntered ? val : ''}
                                                placeholder="—"
                                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                                onChange={(e) => !readOnly && onChangeMark(row.subId, e.target.value, row.maxRaw)}
                                                onClick={() => readOnly && onLockedClick?.()}
                                                className={`w-24 text-center py-1 px-2 rounded-sm text-xs font-mono font-bold transition-colors outline-none ${
                                                    readOnly
                                                        ? 'bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-not-allowed select-none'
                                                        : err
                                                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-400 dark:border-rose-500 text-rose-700 dark:text-rose-200'
                                                            : isEntered
                                                                ? 'bg-white dark:bg-slate-900 border border-purple-400 dark:border-slate-600 text-slate-900 dark:text-white focus:border-purple-600 dark:focus:border-slate-400 focus:bg-purple-50/20 dark:focus:bg-slate-800 shadow-xs'
                                                                : 'bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-white'
                                                }`}
                                            />
                                            {err && (
                                                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-0.5 font-sans">
                                                    <AlertCircle size={10} />
                                                    {err}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Max Mark */}
                                    <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono">
                                        / {row.maxRaw}
                                    </td>

                                    {/* Status Column */}
                                    <td className="py-2.5 px-4 text-right hidden sm:table-cell font-mono text-[11px]">
                                        {readOnly ? (
                                            <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center justify-end gap-1">
                                                <Lock size={10} />
                                                <span>DEMO</span>
                                            </span>
                                        ) : err ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                                                {err === 'Required' ? 'REQ' : 'FAIL'}
                                            </span>
                                        ) : isEntered ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ OK</span>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Attendance Threshold Toggle Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50 dark:bg-[#0e1017] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={includeAttendance}
                        disabled={readOnly}
                        onChange={(e) => !readOnly && onToggleAttendance(e.target.checked)}
                        className={`w-4 h-4 rounded-sm accent-purple-600 dark:accent-slate-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    />
                    <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block font-sans">
                            Include Attendance Verification
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            Verifies required autonomous minimum (≥ {attendanceThreshold}%) for SEE clearance
                        </span>
                    </div>
                </label>

                {includeAttendance && (
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Attendance:</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                readOnly={readOnly}
                                disabled={readOnly}
                                value={attendanceValue}
                                onChange={(e) => !readOnly && onChangeAttendance(e.target.value)}
                                onClick={() => readOnly && onLockedClick?.()}
                                placeholder="85.0"
                                className={`w-18 py-1 px-2 rounded-sm text-xs font-mono font-bold text-center outline-none ${
                                    readOnly
                                        ? 'bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                                        : includeAttendance && (attendanceValue === '' || isNaN(Number(attendanceValue)) || Number(attendanceValue) < 0 || Number(attendanceValue) > 100)
                                            ? 'border-amber-500 text-amber-700 dark:text-amber-200 bg-white dark:bg-slate-900'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-slate-400'
                                }`}
                            />
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
