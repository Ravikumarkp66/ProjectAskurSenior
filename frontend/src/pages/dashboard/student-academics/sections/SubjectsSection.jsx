import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Plus, Trash2, Edit3, AlertTriangle, 
    Lock, CheckCircle2, Search, X, Sparkles, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import toast from 'react-hot-toast';

const SubjectsSection = () => {
    const { 
        selectedSemester, 
        currentSemester, 
        isFinalized, 
        registeredSubjects, 
        totalRegisteredCredits, 
        curriculumSubjects, 
        saveSubjects, 
        saving 
    } = useStudentAcademics();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [pendingDeletionSubject, setPendingDeletionSubject] = useState(null);

    // Custom subject form in Add modal
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customCode, setCustomCode] = useState('');
    const [customName, setCustomName] = useState('');
    const [customCredits, setCustomCredits] = useState(4);
    const [customCategory, setCustomCategory] = useState('Theory');

    // Filter curriculum subjects not already registered
    const registeredSubjectIds = useMemo(() => {
        return new Set(registeredSubjects.map(r => r.subject?._id || r.subject).filter(Boolean));
    }, [registeredSubjects]);

    const availableCurriculum = useMemo(() => {
        return curriculumSubjects.filter(sub => {
            const matchesSearch = 
                sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.code?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && !registeredSubjectIds.has(sub._id);
        });
    }, [curriculumSubjects, searchQuery, registeredSubjectIds]);

    // Handle add curriculum subject
    const handleAddCurriculumSubject = async (subjectObj) => {
        const updatedIds = [...Array.from(registeredSubjectIds), subjectObj._id];
        const existingCustom = registeredSubjects
            .filter(r => !r.subject)
            .map(r => ({
                customCode: r.customCode,
                customName: r.customName,
                registeredCredits: r.registeredCredits,
                category: r.category
            }));
        await saveSubjects(updatedIds, existingCustom);
    };

    // Handle add custom subject
    const handleAddCustomSubject = async (e) => {
        e.preventDefault();
        if (!customCode.trim() || !customName.trim()) {
            toast.error('Subject code and name are required.');
            return;
        }

        const newCustom = {
            customCode: customCode.trim().toUpperCase(),
            customName: customName.trim(),
            registeredCredits: Number(customCredits) || 3,
            category: customCategory
        };

        const existingCustom = registeredSubjects
            .filter(r => !r.subject)
            .map(r => ({
                customCode: r.customCode,
                customName: r.customName,
                registeredCredits: r.registeredCredits,
                category: r.category
            }));

        const currentIds = Array.from(registeredSubjectIds);
        const success = await saveSubjects(currentIds, [...existingCustom, newCustom]);
        if (success) {
            setCustomCode('');
            setCustomName('');
            setShowCustomForm(false);
            setIsAddModalOpen(false);
        }
    };

    // Confirm remove subject
    const handleConfirmDelete = async () => {
        if (!pendingDeletionSubject) return;

        const subToDelete = pendingDeletionSubject;
        let updatedIds = Array.from(registeredSubjectIds);
        let updatedCustom = registeredSubjects
            .filter(r => !r.subject)
            .map(r => ({
                customCode: r.customCode,
                customName: r.customName,
                registeredCredits: r.registeredCredits,
                category: r.category
            }));

        if (subToDelete.subject) {
            const subId = subToDelete.subject._id || subToDelete.subject;
            updatedIds = updatedIds.filter(id => id !== subId);
        } else {
            updatedCustom = updatedCustom.filter(c => c.customCode !== subToDelete.customCode);
        }

        await saveSubjects(updatedIds, updatedCustom);
        setPendingDeletionSubject(null);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/20 shadow-lg backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            Upstream Academic Data
                        </span>
                        {isFinalized ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-1">
                                <Lock size={9} /> Semester {selectedSemester} · Frozen
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Semester {selectedSemester} · Active
                            </span>
                        )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-outfit">
                        Subject Registration
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Authoritative course enrolment for Semester {selectedSemester}. Controls timetable and downstream attendance tracking.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Enrolled Total</span>
                        <span className="text-sm font-bold text-purple-300 font-mono">
                            {totalRegisteredCredits} Credits
                        </span>
                    </div>

                    {!isFinalized && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                        >
                            <Plus size={14} />
                            Add Subject
                        </button>
                    )}
                </div>
            </div>

            {/* Registered Subjects Table Card */}
            <div className="p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/15 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-purple-400" size={16} />
                        Enrolled Courses ({registeredSubjects.length})
                    </h2>
                    {isFinalized && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Lock size={11} /> Read-only historical semester
                        </span>
                    )}
                </div>

                {registeredSubjects.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-white/[0.01] rounded-xl border border-dashed border-white/10 space-y-2.5">
                        <BookOpen className="mx-auto text-purple-400/60" size={32} />
                        <h3 className="text-xs font-bold text-white">No subjects registered for Semester {selectedSemester}</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Add subjects from the curriculum catalogue or create elective courses.
                        </p>
                        {!isFinalized && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-1 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer shadow-md shadow-purple-600/20"
                            >
                                <Plus size={13} /> Register Subjects
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                                <tr className="border-b border-purple-500/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                    <th className="pb-2 px-2">#</th>
                                    <th className="pb-2 px-2">Subject Code</th>
                                    <th className="pb-2 px-2">Subject Name</th>
                                    <th className="pb-2 px-2 text-center">Course Type</th>
                                    <th className="pb-2 px-2 text-center">Credits</th>
                                    <th className="pb-2 px-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {registeredSubjects.map((reg, idx) => {
                                    const code = reg.customCode || reg.subject?.code || `SUB${idx + 1}`;
                                    const name = reg.customName || reg.subject?.name || 'Untitled Subject';
                                    const credits = reg.registeredCredits ?? reg.subject?.credits ?? 0;
                                    const type = reg.category || 'Theory';

                                    return (
                                        <tr key={reg._id || idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2.5 px-2 font-mono text-slate-500 text-[11px]">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-2.5 px-2 font-mono font-bold text-purple-300">
                                                {code}
                                            </td>
                                            <td className="py-2.5 px-2 font-medium text-white">
                                                {name}
                                            </td>
                                            <td className="py-2.5 px-2 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                    type === 'Theory + Lab' 
                                                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                                                        : type === 'Lab Only'
                                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                                }`}>
                                                    {type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-bold text-slate-200">
                                                {credits}
                                            </td>
                                            <td className="py-2.5 px-2 text-right">
                                                {!isFinalized ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingDeletionSubject(reg)}
                                                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                        title="Remove subject"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-500 text-[10px]">
                                                        <Lock size={10} className="inline mr-0.5" /> Locked
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Subject Full Screen Workspace Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isAddModalOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[99999] flex flex-col bg-[#070314] text-slate-100 overflow-hidden"
                        >
                            {/* Top Bar */}
                            <div className="px-6 py-4 border-b border-purple-500/20 bg-[#0d0724]/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setShowCustomForm(false);
                                        }}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-semibold"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back</span>
                                    </button>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                            <BookOpen className="text-purple-400" size={20} />
                                            Add Subject & Electives · Semester {selectedSemester}
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Enrol subjects from the official SIT syllabus catalogue or create custom electives.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/20 text-xs">
                                        <span className="text-slate-400">Currently Enrolled:</span>
                                        <span className="font-bold text-purple-300">{registeredSubjects.length} Courses ({totalCredits} Credits)</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setShowCustomForm(false);
                                        }}
                                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Full Screen Content Body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                                
                                {/* Navigation Tab Pills between Catalogue and Custom */}
                                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-purple-500/15 pb-4">
                                    <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomForm(false)}
                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                                                !showCustomForm 
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <BookOpen size={14} />
                                            Official Curriculum Catalogue ({availableCurriculum.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomForm(true)}
                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                                                showCustomForm 
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Plus size={14} />
                                            Create Custom Course
                                        </button>
                                    </div>

                                    {!showCustomForm && (
                                        <div className="relative w-full sm:w-80">
                                            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by code, title, or category..."
                                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-purple-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                                            />
                                        </div>
                                    )}
                                </div>

                                {!showCustomForm ? (
                                    <>
                                        {/* Available Catalogue Grid */}
                                        {availableCurriculum.length === 0 ? (
                                            <div className="text-center py-16 bg-white/[0.01] rounded-2xl border border-dashed border-white/10 space-y-3">
                                                <BookOpen className="mx-auto text-purple-400/50" size={40} />
                                                <h3 className="text-sm font-bold text-white">No Unenrolled Curriculum Subjects Found</h3>
                                                <p className="text-xs text-slate-400 max-w-md mx-auto">
                                                    All courses from this semester's curriculum catalogue are already in your enrolled list.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCustomForm(true)}
                                                    className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} />
                                                    Add a Custom Elective / Course
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {availableCurriculum.map((sub) => {
                                                    const cat = sub.category || 'Theory';
                                                    const isLab = cat === 'Lab Only';
                                                    const isTheoryLab = cat === 'Theory + Lab';

                                                    return (
                                                        <div
                                                            key={sub._id}
                                                            className="p-5 rounded-2xl bg-[#0e0826]/80 border border-purple-500/20 hover:border-purple-500/50 hover:bg-[#150c38] transition-all flex flex-col justify-between gap-4 shadow-lg group"
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                                                        {sub.code}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                                        isTheoryLab 
                                                                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                                                                            : isLab 
                                                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                                                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                                                    }`}>
                                                                        {cat}
                                                                    </span>
                                                                </div>

                                                                <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                                                                    {sub.name}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                                <div className="text-xs">
                                                                    <span className="text-slate-400">Credits: </span>
                                                                    <span className="font-bold text-white">{sub.credits || 4} C</span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddCurriculumSubject(sub)}
                                                                    disabled={saving}
                                                                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 flex items-center gap-1"
                                                                >
                                                                    <Plus size={13} />
                                                                    Enrol Course
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Custom Subject Creation Full Screen View */
                                    <div className="max-w-2xl mx-auto bg-[#0e0826]/90 border border-purple-500/25 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
                                        <div className="border-b border-purple-500/15 pb-3">
                                            <h3 className="text-base font-bold text-white">Create & Register Custom Course</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                For department electives, open electives, honors, or special projects.
                                            </p>
                                        </div>

                                        <form onSubmit={handleAddCustomSubject} className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                                    Course Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customCode}
                                                    onChange={(e) => setCustomCode(e.target.value)}
                                                    placeholder="e.g. 21CS54 / ELEC-01"
                                                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                                    Course Title / Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customName}
                                                    onChange={(e) => setCustomName(e.target.value)}
                                                    placeholder="e.g. Advanced Database Management Systems"
                                                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                                                        Credits *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={customCredits}
                                                        onChange={(e) => setCustomCredits(e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                                                        Category / Evaluation Type *
                                                    </label>
                                                    <select
                                                        value={customCategory}
                                                        onChange={(e) => setCustomCategory(e.target.value)}
                                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                                        className="w-full px-3.5 py-2 rounded-xl bg-[#0f0927] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                                                    >
                                                        <option value="Theory">Theory (Internal Tests + Quizzes)</option>
                                                        <option value="Theory + Lab">Theory + Lab (Integrated Course)</option>
                                                        <option value="Lab Only">Lab Only (Practical Session)</option>
                                                        <option value="Elective">Department / Open Elective</option>
                                                        <option value="Project">Project / Internship</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/15">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCustomForm(false)}
                                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                                                >
                                                    Cancel & Return
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={saving}
                                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {saving ? 'Registering...' : 'Save & Enrol Course'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Safety Deletion Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {pendingDeletionSubject && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md p-5 rounded-xl bg-[#0e0826] border border-rose-500/30 shadow-2xl space-y-3.5"
                            >
                                <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                                    <ShieldAlert size={20} />
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Remove {pendingDeletionSubject.customCode || pendingDeletionSubject.subject?.code}?
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-1">
                                        Changing registered subjects is an upstream academic action.
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300/90 space-y-1">
                                    <p className="font-semibold text-rose-200 text-[11px]">Downstream Impact Notice:</p>
                                    <ul className="list-disc list-inside text-[11px] text-slate-300">
                                        <li>Future timetable slots for this subject will be removed.</li>
                                        <li><strong>Historical attendance records are NOT destroyed</strong> and remain preserved.</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setPendingDeletionSubject(null)}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                                    >
                                        Keep Subject
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        disabled={saving}
                                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? 'Removing...' : 'Confirm Removal'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default SubjectsSection;
