import React, { useState, useMemo } from 'react';
import { Search, Filter, Database, ArrowRight } from 'lucide-react';
import { getJoinedDataset, getBranchList } from '../../../utils/branchChangeEngine';

export default function BranchChangeMatrix() {
    const [filterTarget, setFilterTarget] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const branches = getBranchList();

    const dataset = useMemo(() => getJoinedDataset(), []);

    const filteredAllocations = useMemo(() => {
        return dataset.allocations.filter(a => {
            if (filterTarget !== 'ALL' && a.toBranch !== filterTarget) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchFrom = a.fromBranch.toLowerCase().includes(q);
                const matchTo = a.toBranch.toLowerCase().includes(q);
                const matchRank = a.meritRank ? String(a.meritRank).includes(q) : false;
                const matchCgpa = a.cgpa ? String(a.cgpa).includes(q) : false;
                return matchFrom || matchTo || matchRank || matchCgpa;
            }
            return true;
        });
    }, [dataset, filterTarget, searchQuery]);

    return (
        <div className="flex flex-col gap-3 font-mono text-xs text-slate-200">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#161b22] border border-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search size={14} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by branch, rank, or CGPA..."
                        className="bg-[#0d1117] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 w-full"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={13} className="text-slate-400 shrink-0" />
                    <select
                        value={filterTarget}
                        onChange={(e) => setFilterTarget(e.target.value)}
                        className="bg-[#0d1117] border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                        <option value="ALL">All Allotted Branches</option>
                        {branches.map(b => (
                            <option key={b.code} value={b.code}>
                                To: {b.code} ({b.name.split(' ')[0]})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dataset Stats Bar */}
            <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                    <Database size={12} className="text-purple-400" />
                    Showing {filteredAllocations.length} of {dataset.totalAllocations} records (AY 2025–26)
                </span>
                <span className="text-[10px] text-slate-500">
                    Names & USNs anonymized for student privacy
                </span>
            </div>

            {/* CSES High-Density Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0d1117]">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-[#161b22] sticky top-0 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                            <tr>
                                <th className="py-2 px-3">Sl</th>
                                <th className="py-2 px-3">Merit Rank</th>
                                <th className="py-2 px-3">Transition</th>
                                <th className="py-2 px-3">1st Year CGPA</th>
                                <th className="py-2 px-3">Allocated Pref</th>
                                <th className="py-2 px-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filteredAllocations.length > 0 ? (
                                filteredAllocations.map((a, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-2 px-3 text-slate-500">#{a.slNo}</td>
                                        <td className="py-2 px-3">
                                            {a.meritRank ? (
                                                <span className="text-purple-300 font-bold">Rank #{a.meritRank}</span>
                                            ) : (
                                                <span className="text-slate-500">-- (CoC)</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                    {a.fromBranch}
                                                </span>
                                                <ArrowRight size={11} className="text-slate-500" />
                                                <span className={`px-1.5 py-0.5 rounded font-bold border ${
                                                    a.branchChanged 
                                                        ? 'bg-purple-950/60 border-purple-600 text-purple-200' 
                                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                                }`}>
                                                    {a.toBranch}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-200">
                                            {a.cgpa ? a.cgpa.toFixed(2) : '--'}
                                        </td>
                                        <td className="py-2 px-3">
                                            {a.preferenceAllocated ? (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 text-[10px]">
                                                    Pref #{a.preferenceAllocated}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">--</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3">
                                            {a.remark === 'CoC' ? (
                                                <span className="text-amber-400 text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                                                    College Transfer
                                                </span>
                                            ) : (
                                                <span className="text-emerald-400 text-[10px]">
                                                    Branch Changed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-500">
                                        No allocations found matching the selected filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
