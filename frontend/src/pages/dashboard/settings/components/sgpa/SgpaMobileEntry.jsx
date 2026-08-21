import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

const SgpaMobileEntry = ({
    subjects = [],
    availableSemesters = [],
    selectedSemester,
    onSemesterChange,
    globalSeeMax = 100,
    onRawSeeChange
}) => {
    const navigate = useNavigate();

    const getStatusBadge = (status, grade) => {
        if (status === 'NE' || grade === 'NE') {
            return { label: '⚠ NE', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        }
        if (status === 'FAILED' || grade === 'F') {
            return { label: '✕ Fail', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        }
        if (status === 'PENDING' || grade === 'PENDING') {
            return { label: '◐ Pending', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
        }
        return { label: '✓ Pass', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    };

    return (
        <div className="flex md:hidden flex-col gap-4">
            {/* Horizontal Scroll Semester Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
                {availableSemesters.map((semObj) => {
                    const isSelected = semObj.semester === selectedSemester;
                    return (
                        <button
                            key={semObj.semester}
                            onClick={() => onSemesterChange(semObj.semester)}
                            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                    ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                                    : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                            }`}
                        >
                            Sem {semObj.semester} {semObj.isCurrent ? '• Current' : ''}
                        </button>
                    );
                })}
            </div>

            {/* Stacked Subject Cards */}
            {subjects.map((sub, idx) => {
                const statusBadge = getStatusBadge(sub.status, sub.grade);

                return (
                    <div
                        key={sub.registeredSubjectId || idx}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-lg"
                    >
                        {/* Top Info */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                                    {sub.subjectCode} • {sub.credits} Credits
                                </span>
                                <h4 className="text-sm font-bold text-slate-100 mt-1">{sub.subjectName}</h4>
                            </div>
                            <span
                                className="px-2.5 py-1 rounded-md text-xs font-bold"
                                style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                            >
                                {statusBadge.label}
                            </span>
                        </div>

                        {/* CIE & SEE Input Grid */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
                            {/* CIE Read-Only */}
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium">CIE Marks</div>
                                {(sub.hasCie || (sub.cieMarks !== null && sub.cieMarks !== undefined)) ? (
                                    <div className="mt-1">
                                        <span className={`font-extrabold text-sm ${sub.cieStatus === 'NOT_ELIGIBLE' ? 'text-red-400' : 'text-cyan-400'}`}>
                                            {sub.cieMarks} / 50
                                        </span>
                                        <button
                                            onClick={() => navigate('/home/cie')}
                                            className="text-[10px] font-semibold text-purple-300 flex items-center gap-1 mt-0.5"
                                        >
                                            <span>View CIE</span>
                                            <ExternalLink size={9} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate('/home/cie')}
                                        className="text-[10px] font-bold text-amber-400 mt-1"
                                    >
                                        Complete CIE →
                                    </button>
                                )}
                            </div>

                            {/* SEE Touch Input */}
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium">SEE Input ({`/${globalSeeMax}`})</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <input
                                        type="number"
                                        value={sub.seeRawMarks !== null && sub.seeRawMarks !== undefined ? sub.seeRawMarks : ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? null : Number(e.target.value);
                                            onRawSeeChange(idx, val, globalSeeMax);
                                        }}
                                        placeholder={`0 - ${globalSeeMax}`}
                                        min={0}
                                        max={globalSeeMax}
                                        step="any"
                                        className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-purple-500/40 text-slate-100 font-bold text-sm outline-none shadow-inner text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Calculated Score Bar */}
                        <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800">
                            <span className="text-slate-400">
                                SEE Scaled: <strong className="text-indigo-400">{sub.seeScaledMarks !== null ? `${sub.seeScaledMarks}/50` : '—'}</strong>
                            </span>
                            <span className="text-slate-100 font-extrabold">
                                Total: {sub.totalMarks !== null ? `${sub.totalMarks}/100` : '—'} (Grade {sub.grade} • GP {sub.gradePoint})
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SgpaMobileEntry;
