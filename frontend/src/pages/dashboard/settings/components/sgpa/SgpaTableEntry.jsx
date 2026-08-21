import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2, AlertTriangle, AlertCircle, Clock, XCircle } from 'lucide-react';

const SgpaTableEntry = ({
    subjects = [],
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
        <div className="hidden md:block overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-4 w-12 text-center">#</th>
                        <th className="py-4 px-4">Subject</th>
                        <th className="py-4 px-3 text-center">Credits</th>
                        <th className="py-4 px-4 text-center">CIE Marks</th>
                        <th className="py-4 px-4 text-center">SEE Input ({`/${globalSeeMax}`})</th>
                        <th className="py-4 px-4 text-center">SEE Scaled</th>
                        <th className="py-4 px-4 text-center">Total</th>
                        <th className="py-4 px-3 text-center">Grade</th>
                        <th className="py-4 px-3 text-center">GP</th>
                        <th className="py-4 px-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                    {subjects.map((sub, idx) => {
                        const statusBadge = getStatusBadge(sub.status, sub.grade);

                        return (
                            <tr key={sub.registeredSubjectId || idx} className="hover:bg-slate-800/30 transition-colors">
                                {/* # */}
                                <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-500">
                                    {String(idx + 1).padStart(2, '0')}
                                </td>

                                {/* Subject Name & Code */}
                                <td className="py-4 px-4">
                                    <div className="font-bold text-slate-100">{sub.subjectName}</div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {sub.subjectCode} • {sub.category || 'Theory'}
                                    </div>
                                </td>

                                {/* Credits */}
                                <td className="py-4 px-3 text-center font-bold text-slate-300">
                                    {sub.credits}
                                </td>

                                {/* CIE Read-Only Import */}
                                <td className="py-4 px-4 text-center">
                                    {(sub.hasCie || (sub.cieMarks !== null && sub.cieMarks !== undefined)) ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`font-extrabold ${sub.cieStatus === 'NOT_ELIGIBLE' ? 'text-red-400' : 'text-cyan-400'}`}>
                                                {sub.cieMarks} / 50
                                            </span>
                                            <button
                                                onClick={() => navigate('/home/cie')}
                                                className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1 opacity-80 hover:opacity-100"
                                            >
                                                <span>View CIE</span>
                                                <ExternalLink size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs font-semibold text-amber-400">CIE Pending</span>
                                            <button
                                                onClick={() => navigate('/home/cie')}
                                                className="text-[11px] font-bold text-indigo-400 hover:underline"
                                            >
                                                Complete CIE →
                                            </button>
                                        </div>
                                    )}
                                </td>

                                {/* SEE Raw Input */}
                                <td className="py-4 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
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
                                            className="w-24 text-center py-1.5 px-2 rounded-lg bg-slate-950 border border-purple-500/30 text-slate-100 font-bold text-sm outline-none focus:border-purple-400 shadow-inner"
                                        />
                                    </div>
                                </td>

                                {/* SEE Scaled */}
                                <td className="py-4 px-4 text-center font-bold text-indigo-400">
                                    {sub.seeScaledMarks !== null ? `${sub.seeScaledMarks} / 50` : '—'}
                                </td>

                                {/* Total Marks */}
                                <td className="py-4 px-4 text-center font-black text-slate-100">
                                    {sub.totalMarks !== null ? `${sub.totalMarks}` : '—'}
                                </td>

                                {/* Grade */}
                                <td className="py-4 px-3 text-center">
                                    <span
                                        className="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold"
                                        style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                                    >
                                        {sub.grade}
                                    </span>
                                </td>

                                {/* Grade Point */}
                                <td className="py-4 px-3 text-center font-extrabold text-slate-200">
                                    {sub.gradePoint}
                                </td>

                                {/* Status Badge */}
                                <td className="py-4 px-4 text-center">
                                    <span
                                        className="inline-block px-2.5 py-1 rounded-md text-xs font-bold"
                                        style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                                    >
                                        {statusBadge.label}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SgpaTableEntry;
