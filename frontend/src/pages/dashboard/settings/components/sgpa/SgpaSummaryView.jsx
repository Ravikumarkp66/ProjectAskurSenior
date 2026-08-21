import React from 'react';
import SgpaHeroResult from './SgpaHeroResult';
import { Save, CheckCircle2, Clock } from 'lucide-react';

const SgpaSummaryView = ({
    subjects = [],
    summaryStats = {},
    selectedSemester,
    onSaveSemester,
    isSaving
}) => {
    const isComplete = !summaryStats.hasPending && summaryStats.sgpa !== null;

    const getGradeBadge = (grade) => {
        if (grade === 'NE' || grade === 'F') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        if (grade === 'PENDING') return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top SGPA Hero Card */}
            <SgpaHeroResult summaryStats={summaryStats} selectedSemester={selectedSemester} />

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-4">#</th>
                            <th className="py-4 px-4">Subject</th>
                            <th className="py-4 px-4 text-center">Credits</th>
                            <th className="py-4 px-4 text-center">CIE Marks</th>
                            <th className="py-4 px-4 text-center">SEE Raw</th>
                            <th className="py-4 px-4 text-center">SEE Scaled</th>
                            <th className="py-4 px-4 text-center">Total</th>
                            <th className="py-4 px-4 text-center">Grade</th>
                            <th className="py-4 px-4 text-center">GP</th>
                            <th className="py-4 px-4 text-right">Credit Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                        {subjects.map((sub, idx) => {
                            const badge = getGradeBadge(sub.grade);

                            return (
                                <tr key={sub.registeredSubjectId || idx} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4 text-xs font-bold text-slate-500">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-slate-200">{sub.subjectName}</div>
                                        <div className="text-xs text-slate-400 font-medium">{sub.subjectCode}</div>
                                    </td>
                                    <td className="py-4 px-4 text-center font-semibold text-slate-300">
                                        {sub.credits}
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-cyan-400">
                                        {sub.cieMarks !== null ? `${sub.cieMarks} / 50` : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-semibold text-slate-300">
                                        {sub.seeRawMarks !== null ? `${sub.seeRawMarks} / ${sub.seeRawMaximum}` : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-indigo-400">
                                        {sub.seeScaledMarks !== null ? `${sub.seeScaledMarks} / 50` : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-black text-slate-100">
                                        {sub.totalMarks !== null ? `${sub.totalMarks}` : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span
                                            className="inline-block px-2.5 py-1 rounded-md text-xs font-bold"
                                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                                        >
                                            {sub.grade}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-slate-200">
                                        {sub.gradePoint}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-purple-400">
                                        {sub.creditPoints}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-950/80 font-bold text-slate-200 border-t-2 border-purple-500/30">
                            <td colSpan={2} className="py-4 px-4 text-left font-black text-slate-100">Semester {selectedSemester} Summary</td>
                            <td className="py-4 px-4 text-center text-purple-400 font-black">{summaryStats.totalCredits || 0}</td>
                            <td colSpan={6} className="py-4 px-4 text-right font-semibold text-slate-400">Total Credit Points:</td>
                            <td className="py-4 px-4 text-right text-cyan-400 font-black text-base">{summaryStats.totalCreditPoints || 0}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="flex md:hidden flex-col gap-4">
                {subjects.map((sub, idx) => {
                    const badge = getGradeBadge(sub.grade);

                    return (
                        <div
                            key={sub.registeredSubjectId || idx}
                            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                                        {sub.subjectCode} • {sub.credits} Credits
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-100 mt-1">{sub.subjectName}</h4>
                                </div>
                                <span
                                    className="px-2.5 py-1 rounded-md text-xs font-bold"
                                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                                >
                                    {sub.grade}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950/60 text-xs">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium">CIE</div>
                                    <div className="font-bold text-cyan-400 mt-0.5">{sub.cieMarks !== null ? `${sub.cieMarks}/50` : '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium">SEE Scaled</div>
                                    <div className="font-bold text-indigo-400 mt-0.5">{sub.seeScaledMarks !== null ? `${sub.seeScaledMarks}/50` : '—'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-medium">Total</div>
                                    <div className="font-black text-slate-100 mt-0.5">{sub.totalMarks !== null ? `${sub.totalMarks}/100` : '—'}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800">
                                <span className="text-slate-400">GP {sub.gradePoint}</span>
                                <span className="text-purple-400 font-extrabold">{sub.creditPoints} Credit Points</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button Banner */}
            <div style={{
                padding: '20px 24px',
                borderRadius: 16,
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        {isComplete ? 'Semester Result Ready for My Academics' : 'Semester Result In Progress'}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {isComplete ? 'Save this semester result to feed into your CGPA and academic performance history.' : 'Complete all subject SEE marks to finalize your SGPA.'}
                    </div>
                </div>

                <button
                    onClick={onSaveSemester}
                    disabled={isSaving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)'
                    }}
                >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Semester Result'}</span>
                </button>
            </div>
        </div>
    );
};

export default SgpaSummaryView;
