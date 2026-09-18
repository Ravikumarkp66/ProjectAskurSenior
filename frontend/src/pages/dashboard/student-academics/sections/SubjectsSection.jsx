import React, { useState, useMemo } from 'react';
import { 
    BookOpen, Search, CheckCircle2, Lock, 
    ShieldCheck, Sparkles, AlertTriangle, Layers
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import toast from 'react-hot-toast';

const SubjectsSection = () => {
    const { 
        selectedSemester, 
        currentSemester, 
        isHistorical, 
        curriculumSubjects, 
        registeredSubjects, 
        totalRegisteredCredits, 
        saveRegisteredSubjects, 
        saving,
        academicOverview 
    } = useStudentAcademics();

    const [searchQuery, setSearchQuery] = useState('');

    // Set of registered subject IDs
    const registeredSubjectIds = useMemo(() => {
        return new Set(
            registeredSubjects.map(r => {
                if (r.subject && typeof r.subject === 'object') return r.subject._id;
                return r.subject || r._id;
            }).filter(Boolean)
        );
    }, [registeredSubjects]);

    // Filter curriculum subjects
    const filteredCurriculum = useMemo(() => {
        if (!curriculumSubjects || !Array.isArray(curriculumSubjects)) return [];
        return curriculumSubjects.filter(sub => {
            const matchesSearch = 
                sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.code?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [curriculumSubjects, searchQuery]);

    // Handle toggle registration of an official subject
    const handleToggleSubject = async (subjectId) => {
        if (isHistorical) {
            toast.error('Historical semesters are read-only.');
            return;
        }

        const newRegisteredIds = new Set(registeredSubjectIds);
        if (newRegisteredIds.has(subjectId)) {
            newRegisteredIds.delete(subjectId);
        } else {
            newRegisteredIds.add(subjectId);
        }

        await saveRegisteredSubjects(Array.from(newRegisteredIds));
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header info banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            Academic Curriculum
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                Semester {selectedSemester}
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Authoritative syllabus managed by Department Admin ({academicOverview?.branch?.code || 'CSE'}).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Registered Credits</span>
                        <span className="text-sm font-extrabold text-emerald-400">
                            {totalRegisteredCredits} Credits
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search subjects by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0b061c] border border-purple-500/20 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                    />
                </div>

                {isHistorical && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs text-purple-300">
                        <Lock size={12} />
                        <span>Historical Term (Read-Only)</span>
                    </div>
                )}
            </div>

            {/* Curriculum Subjects Table / Grid */}
            <div className="flex flex-col gap-2.5">
                {filteredCurriculum.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-purple-950/20 border border-purple-500/20 text-slate-400">
                        <p className="text-sm">No curriculum subjects found for Semester {selectedSemester}.</p>
                        <p className="text-xs text-slate-500 mt-1">Curriculum is maintained by the Department Admin.</p>
                    </div>
                ) : (
                    filteredCurriculum.map((sub) => {
                        const isRegistered = registeredSubjectIds.has(sub._id);
                        const category = sub.category || 'Theory';

                        return (
                            <div
                                key={sub._id}
                                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                                    isRegistered
                                        ? 'bg-purple-950/30 border-purple-500/40 ring-1 ring-purple-500/20'
                                        : 'bg-[#0b061c]/80 border-purple-500/15 hover:border-purple-500/30'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                                        isRegistered
                                            ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40'
                                            : 'bg-white/[0.04] text-slate-400 border border-white/10'
                                    }`}>
                                        {sub.code ? sub.code.substring(0, 4) : 'SUB'}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-purple-300">
                                                {sub.code}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                                category === 'Lab' 
                                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                                    : category === 'Elective'
                                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                            }`}>
                                                {category}
                                            </span>
                                            {isRegistered && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Enrolled
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mt-0.5">
                                            {sub.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 uppercase block font-medium">Credits</span>
                                        <span className="text-xs font-bold text-slate-200">
                                            {sub.credits || 3} Credits
                                        </span>
                                    </div>

                                    {!isHistorical && (
                                        <button
                                            disabled={saving}
                                            onClick={() => handleToggleSubject(sub._id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                isRegistered
                                                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                                                    : 'bg-purple-600 text-white hover:bg-purple-500 shadow-sm'
                                            }`}
                                        >
                                            {isRegistered ? 'Enrolled (Click to drop)' : '+ Enroll'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Authoritative Notice */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-purple-400 shrink-0" />
                <span>
                    Official subjects and course codes are loaded directly from the Academic Curriculum configured by department administrators.
                </span>
            </div>
        </div>
    );
};

export default SubjectsSection;
