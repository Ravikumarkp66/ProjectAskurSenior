import React from 'react';
import { motion } from 'framer-motion';
import { 
    GraduationCap, Calendar, BookOpen, Clock, ShieldCheck, CheckCircle2, 
    AlertCircle, ArrowRight, Building, Award, Compass, Layers 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';

const AcademicOverviewSection = ({ onNavigateTab }) => {
    const { 
        profile, 
        currentSemester, 
        selectedSemester,
        semestersData, 
        registeredSubjects, 
        totalRegisteredCredits, 
        timetableConfig, 
        timetableSlots,
        isFinalized 
    } = useStudentAcademics();

    const currentSemObj = semestersData.find(s => s.semester === currentSemester) || {
        semester: currentSemester,
        status: 'current',
        credits: totalRegisteredCredits || 20
    };

    const hasTimetable = timetableSlots && timetableSlots.length > 0;
    const startDate = timetableConfig?.semesterStartDate 
        ? new Date(timetableConfig.semesterStartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Aug 1, 2026';
    const endDate = timetableConfig?.lastWorkingDate 
        ? new Date(timetableConfig.lastWorkingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Nov 30, 2026';

    const branchName = profile?.branch?.name || profile?.branchName || 'Information Science and Engineering';
    const schemeName = profile?.scheme?.name || (profile?.scheme ? `Scheme ${profile.scheme}` : 'Scheme 2022');
    const collegeName = profile?.collegeName || profile?.college?.name || 'Siddaganga Institute of Technology';
    const degreeName = profile?.degree || 'Bachelor of Engineering (B.E.)';

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/20 shadow-lg backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            Academic Workspace
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Semester {currentSemester} · Active
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-outfit">
                        Academic Overview
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Read-only summary of institutional structure, enrolled curriculum, and weekly schedule.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigateTab('subjects')}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        Manage Subjects
                        <ArrowRight size={12} />
                    </button>
                    <button
                        onClick={() => onNavigateTab('timetable')}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        Timetable
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            {/* Grid of Structural Cards (3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Current Semester Card */}
                <div className="p-4 rounded-xl bg-[#090518]/70 border border-purple-500/15 flex flex-col justify-between gap-3 shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <GraduationCap size={18} />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Active ●
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Semester</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">Semester {currentSemester}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {currentSemObj.academicYear || 'Academic Year 2026–2027'}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Timeline</span>
                        <span className="font-semibold text-purple-300 font-mono text-[11px]">{startDate} → {endDate}</span>
                    </div>
                </div>

                {/* 2. Academic Identity Card */}
                <div className="p-4 rounded-xl bg-[#090518]/70 border border-purple-500/15 flex flex-col justify-between gap-3 shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Layers size={18} />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-white/10">
                            {schemeName}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program & Branch</p>
                        <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{branchName}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{collegeName}</p>
                    </div>
                    <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Degree</span>
                        <span className="font-medium text-slate-300 text-xs">{degreeName}</span>
                    </div>
                </div>

                {/* 3. Enrolled Curriculum */}
                <div className="p-4 rounded-xl bg-[#090518]/70 border border-purple-500/15 flex flex-col justify-between gap-3 shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <BookOpen size={18} />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {totalRegisteredCredits} Credits
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Curriculum</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                            {registeredSubjects.length} Registered Subjects
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Standard VTU Semester Credit Allocation
                        </p>
                    </div>
                    <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Weekly Classes</span>
                        <span className="font-bold text-purple-300">{hasTimetable ? `${timetableSlots.length} Classes / Wk` : 'Not configured'}</span>
                    </div>
                </div>
            </div>

            {/* 4. Policies Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck className="text-purple-400" size={18} />
                        <div>
                            <span className="text-xs font-bold text-white block">Institutional Eligibility</span>
                            <span className="text-[11px] text-slate-400">Mandatory SEE Exam Threshold</span>
                        </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-purple-300 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        {timetableConfig?.attendanceThreshold || 85}% Policy 🔒
                    </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="text-emerald-400" size={18} />
                        <div>
                            <span className="text-xs font-bold text-white block">Student Target Goal</span>
                            <span className="text-[11px] text-slate-400">Personal target for calculation engine</span>
                        </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        {timetableConfig?.personalAttendanceTarget || 90}% Target ✏️
                    </span>
                </div>
            </div>

            {/* Registered Subjects Table */}
            <div className="p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/15 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-purple-400" size={16} />
                        Registered Subjects for Semester {selectedSemester} ({registeredSubjects.length})
                    </h2>
                    <button
                        onClick={() => onNavigateTab('subjects')}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                        Edit Registration <ArrowRight size={12} />
                    </button>
                </div>

                {registeredSubjects.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                        <p>No subjects registered for Semester {selectedSemester}.</p>
                        <button
                            onClick={() => onNavigateTab('subjects')}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                            Enrol in Subjects
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                                <tr className="border-b border-purple-500/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                    <th className="pb-2 px-2">#</th>
                                    <th className="pb-2 px-2">Code</th>
                                    <th className="pb-2 px-2">Subject Name</th>
                                    <th className="pb-2 px-2 text-center">Type</th>
                                    <th className="pb-2 px-2 text-center">Credits</th>
                                    <th className="pb-2 px-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {registeredSubjects.map((reg, idx) => {
                                    const code = reg.customCode || reg.subject?.code || `SUB${idx + 1}`;
                                    const name = reg.customName || reg.subject?.name || 'Subject';
                                    const credits = reg.registeredCredits ?? reg.subject?.credits ?? 0;
                                    const type = reg.category || 'Theory';

                                    return (
                                        <tr key={reg._id || idx} className="hover:bg-white/[0.02]">
                                            <td className="py-2.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                                            <td className="py-2.5 px-2 font-mono font-bold text-purple-300">{code}</td>
                                            <td className="py-2.5 px-2 font-medium text-white">{name}</td>
                                            <td className="py-2.5 px-2 text-center">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                    {type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-bold text-slate-200">{credits}</td>
                                            <td className="py-2.5 px-2 text-right">
                                                <span className="text-emerald-400 font-semibold flex items-center justify-end gap-1 text-[11px]">
                                                    <CheckCircle2 size={11} /> Enrolled
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademicOverviewSection;
