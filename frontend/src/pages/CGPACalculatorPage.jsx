import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { subjectAPI } from '../services/api';
import { BRANCHES, deriveBranchFromUSN } from '../utils/constants';

// Grade Point System based on total marks (CIE + SEE converted)
// SEE must be >= 36 (out of 100) to pass, otherwise F grade
const getGradeFromTotal = (total, seeMarks) => {
    // If SEE < 36 (out of 100), automatically fail regardless of CIE
    if (seeMarks < 36) return { grade: 'F', points: 0, color: 'text-red-500', seeFail: true };
    
    if (total >= 90) return { grade: 'O', points: 10, color: 'text-emerald-400' };
    if (total >= 80) return { grade: 'A+', points: 9, color: 'text-green-400' };
    if (total >= 70) return { grade: 'A', points: 8, color: 'text-blue-400' };
    if (total >= 60) return { grade: 'B+', points: 7, color: 'text-cyan-400' };
    if (total >= 50) return { grade: 'B', points: 6, color: 'text-yellow-400' };
    if (total >= 40) return { grade: 'C', points: 5, color: 'text-orange-400' };
    return { grade: 'F', points: 0, color: 'text-red-500' };
};

const defaultSubjects = [
    { id: 1, name: 'Subject 1', credits: 4, cie: '', see: '' },
];

const CGPACalculatorPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('sgpa');
    const [subjects, setSubjects] = useState(defaultSubjects);
    const [semesters, setSemesters] = useState([
        { id: 1, sem: 1, sgpa: '', credits: '' }
    ]);
    
    // Branch and Cycle selection
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCycle, setSelectedCycle] = useState('P');
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Set default branch from user's USN
    useEffect(() => {
        if (user?.usn) {
            const branch = deriveBranchFromUSN(user.usn);
            if (branch) {
                setSelectedBranch(branch);
            }
        }
    }, [user?.usn]);

    // Load subjects when branch or cycle changes
    useEffect(() => {
        const loadSubjects = async () => {
            if (!selectedBranch) return;
            
            setLoadingSubjects(true);
            setSubjectsError('');
            
            try {
                const response = await subjectAPI.getSubjectsByBranch(selectedBranch, selectedCycle);
                const fetchedSubjects = response.data || [];
                
                if (fetchedSubjects.length > 0) {
                    setSubjects(fetchedSubjects.map((s, index) => ({
                        id: index + 1,
                        name: s.name,
                        code: s.code,
                        credits: s.credits,
                        cie: '',
                        see: ''
                    })));
                } else {
                    setSubjects(defaultSubjects);
                    setSubjectsError('No subjects found for this selection');
                }
            } catch (error) {
                console.error('Error loading subjects:', error);
                setSubjectsError('Failed to load subjects');
                setSubjects(defaultSubjects);
            } finally {
                setLoadingSubjects(false);
            }
        };

        loadSubjects();
    }, [selectedBranch, selectedCycle]);

    const updateSubject = (id, field, value) => {
        setSubjects(prev => prev.map(s => 
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const addSubject = () => {
        const newId = Math.max(...subjects.map(s => s.id), 0) + 1;
        setSubjects(prev => [...prev, { id: newId, name: `Subject ${newId}`, credits: 3, cie: '', see: '' }]);
    };

    const removeSubject = (id) => {
        if (subjects.length > 1) {
            setSubjects(prev => prev.filter(s => s.id !== id));
        }
    };

    const resetSubjects = () => {
        setSubjects(prev => prev.map(s => ({ ...s, cie: '', see: '' })));
    };

    const addSemester = () => {
        const newId = Math.max(...semesters.map(s => s.id), 0) + 1;
        setSemesters(prev => [...prev, { id: newId, sem: prev.length + 1, sgpa: '', credits: '' }]);
    };

    const removeSemester = (id) => {
        if (semesters.length > 1) {
            setSemesters(prev => prev.filter(s => s.id !== id));
        }
    };

    const updateSemester = (id, field, value) => {
        setSemesters(prev => prev.map(s => 
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const resetSemesters = () => {
        setSemesters([{ id: 1, sem: 1, sgpa: '', credits: '' }]);
    };

    // Calculate SGPA
    const sgpaResult = useMemo(() => {
        let totalCredits = 0;
        let weightedSum = 0;
        let validSubjects = 0;
        let hasFail = false;
        let hasSeeFail = false;

        const subjectResults = subjects.map(subject => {
            const credits = parseFloat(subject.credits) || 0;
            const cie = parseFloat(subject.cie) || 0;
            const see = parseFloat(subject.see) || 0;
            
            // CIE is out of 50, SEE is entered out of 100 and converted to 50
            const seeConverted = see / 2;
            const total = cie + seeConverted;
            
            // Validate inputs
            const cieValid = subject.cie !== '' && cie >= 0 && cie <= 50;
            const seeValid = subject.see !== '' && see >= 0 && see <= 100;
            
            if (!cieValid || !seeValid || credits <= 0) {
                return { ...subject, total: null, grade: null, points: null, seeConverted: null, isValid: false, seeFail: false };
            }

            // Pass SEE marks (out of 100) to check minimum requirement
            const gradeInfo = getGradeFromTotal(total, see);
            
            if (gradeInfo.points === 0) hasFail = true;
            if (gradeInfo.seeFail) hasSeeFail = true;
            
            totalCredits += credits;
            weightedSum += credits * gradeInfo.points;
            validSubjects++;

            return {
                ...subject,
                seeConverted: seeConverted.toFixed(1),
                total: total.toFixed(1),
                grade: gradeInfo.grade,
                points: gradeInfo.points,
                color: gradeInfo.color,
                seeFail: gradeInfo.seeFail || false,
                isValid: true
            };
        });

        const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;

        return {
            subjects: subjectResults,
            sgpa: parseFloat(sgpa),
            totalCredits,
            weightedSum,
            validSubjects,
            hasFail,
            hasSeeFail
        };
    }, [subjects]);

    // Calculate CGPA
    const cgpaResult = useMemo(() => {
        let totalCredits = 0;
        let weightedSum = 0;
        let validSemesters = 0;

        for (const sem of semesters) {
            const sgpa = parseFloat(sem.sgpa);
            const credits = parseFloat(sem.credits) || 0;
            
            if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) continue;
            
            validSemesters++;
            
            if (credits > 0) {
                totalCredits += credits;
                weightedSum += sgpa * credits;
            } else {
                totalCredits += 1;
                weightedSum += sgpa;
            }
        }
        
        const cgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;
        return { cgpa: parseFloat(cgpa), semestersCount: validSemesters, totalCredits, weightedSum };
    }, [semesters]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">🎓 CGPA / SGPA Calculator</h1>
                            <p className="text-xs text-white/60">Enter CIE & SEE marks to calculate your grade 📊</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* LEFT SIDE - Calculator */}
                    <div className="flex-1">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
                            <button
                                onClick={() => setActiveTab('sgpa')}
                                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${
                                    activeTab === 'sgpa'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                SGPA Calculator
                            </button>
                            <button
                                onClick={() => setActiveTab('cgpa')}
                                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${
                                    activeTab === 'cgpa'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                CGPA Calculator
                            </button>
                        </div>

                        {/* SGPA Calculator */}
                        {activeTab === 'sgpa' && (
                            <div className="space-y-4">
                                {/* Branch & Cycle Selector */}
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Select Branch & Cycle</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-white/60 mb-1 block">Branch</label>
                                            <select
                                                value={selectedBranch}
                                                onChange={(e) => setSelectedBranch(e.target.value)}
                                                className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-purple-500 transition appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-slate-800">Select Branch</option>
                                                {BRANCHES.map(b => (
                                                    <option key={b.code} value={b.code} className="bg-slate-800">
                                                        {b.code} - {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-white/60 mb-1 block">Cycle</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedCycle('P')}
                                                    className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${
                                                        selectedCycle === 'P'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                                >
                                                    P Cycle
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCycle('C')}
                                                    className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${
                                                        selectedCycle === 'C'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                                >
                                                    C Cycle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {loadingSubjects && (
                                        <div className="mt-3 text-xs text-white/50 flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                            Loading subjects...
                                        </div>
                                    )}
                                    {subjectsError && !loadingSubjects && (
                                        <div className="mt-3 text-xs text-amber-400">{subjectsError}</div>
                                    )}
                                </div>

                                {/* Marks Info */}
                                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-2">📝 How it works</h3>
                                    <div className="text-xs text-blue-200/80 space-y-1">
                                        <p>• <strong>CIE</strong>: Enter marks out of <strong>50</strong> (Internal Assessment)</p>
                                        <p>• <strong>SEE</strong>: Enter marks out of <strong>100</strong> (will be converted to 50)</p>
                                        <p>• <strong>Total</strong> = CIE + (SEE ÷ 2) → Grade is auto-calculated</p>
                                        <p className="text-red-300">• <strong>⚠️ SEE must be ≥ 36</strong> to pass (otherwise auto F grade)</p>
                                    </div>
                                </div>

                                {/* Subject Inputs */}
                                <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white">Enter Subject Marks</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={resetSubjects}
                                                className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={addSubject}
                                                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition"
                                            >
                                                + Add Subject
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {/* Header */}
                                        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-white/60 px-2">
                                            <div className="col-span-3">Subject</div>
                                            <div className="col-span-1 text-center">Credits</div>
                                            <div className="col-span-2 text-center">CIE (50)</div>
                                            <div className="col-span-2 text-center">SEE (100)</div>
                                            <div className="col-span-1 text-center">Total</div>
                                            <div className="col-span-1 text-center">Grade</div>
                                            <div className="col-span-1 text-center">Pts</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {sgpaResult.subjects.map((subject) => (
                                            <div 
                                                key={subject.id} 
                                                className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                                            >
                                                {/* Subject Name */}
                                                <div className="col-span-12 sm:col-span-3">
                                                    {subject.code ? (
                                                        <div className="px-1">
                                                            <div className="text-sm text-white font-medium truncate" title={subject.name}>
                                                                {subject.name}
                                                            </div>
                                                            <div className="text-xs text-purple-400">{subject.code}</div>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={subject.name}
                                                            onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                            className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                                                            placeholder="Subject name"
                                                        />
                                                    )}
                                                </div>
                                                
                                                {/* Credits */}
                                                <div className="col-span-3 sm:col-span-1">
                                                    {subject.code ? (
                                                        <div className="text-center text-white font-semibold text-sm">{subject.credits}</div>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="6"
                                                            value={subject.credits}
                                                            onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                                                            className="w-full h-9 px-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm text-center outline-none focus:border-purple-500"
                                                            placeholder="Cr"
                                                        />
                                                    )}
                                                </div>
                                                
                                                {/* CIE (out of 50) */}
                                                <div className="col-span-3 sm:col-span-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        value={subject.cie}
                                                        onChange={(e) => updateSubject(subject.id, 'cie', e.target.value)}
                                                        className="w-full h-9 px-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm text-center outline-none focus:border-purple-500"
                                                        placeholder="0-50"
                                                    />
                                                </div>
                                                
                                                {/* SEE (out of 100) */}
                                                <div className="col-span-3 sm:col-span-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={subject.see}
                                                        onChange={(e) => updateSubject(subject.id, 'see', e.target.value)}
                                                        className="w-full h-9 px-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm text-center outline-none focus:border-purple-500"
                                                        placeholder="0-100"
                                                    />
                                                </div>
                                                
                                                {/* Total */}
                                                <div className="col-span-2 sm:col-span-1 text-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {subject.total !== null ? subject.total : '-'}
                                                    </span>
                                                </div>
                                                
                                                {/* Grade */}
                                                <div className="col-span-2 sm:col-span-1 text-center">
                                                    <span className={`font-bold text-sm ${subject.color || 'text-white/50'}`}>
                                                        {subject.grade || '-'}
                                                    </span>
                                                </div>
                                                
                                                {/* Points */}
                                                <div className="col-span-2 sm:col-span-1 text-center">
                                                    <span className="text-purple-400 font-semibold text-sm">
                                                        {subject.points !== null ? subject.points : '-'}
                                                    </span>
                                                </div>
                                                
                                                {/* Remove Button */}
                                                <div className="col-span-2 sm:col-span-1 text-center">
                                                    <button
                                                        onClick={() => removeSubject(subject.id)}
                                                        className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition inline-flex items-center justify-center"
                                                        disabled={subjects.length === 1}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SGPA Result */}
                                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm text-white/60">Semester Grade Point Average</p>
                                            <p className="text-xs text-white/40 mt-1">
                                                {sgpaResult.validSubjects} subjects • {sgpaResult.totalCredits} credits
                                            </p>
                                            {sgpaResult.hasSeeFail && (
                                                <p className="text-xs text-red-400 mt-1">❌ SEE marks below 36 - Auto FAIL</p>
                                            )}
                                            {sgpaResult.hasFail && !sgpaResult.hasSeeFail && (
                                                <p className="text-xs text-amber-400 mt-1">⚠️ Failed in one or more subjects</p>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                                {sgpaResult.sgpa || '0.00'}
                                            </div>
                                            <p className="text-sm text-white/60 mt-1">SGPA</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CGPA Calculator */}
                        {activeTab === 'cgpa' && (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Enter SGPA for Each Semester</h3>
                                            <p className="text-xs text-white/50 mt-1">Credits are optional (for weighted average)</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={resetSemesters}
                                                className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={addSemester}
                                                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition"
                                            >
                                                + Add Semester
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {/* Header */}
                                        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-white/60 px-2">
                                            <div className="col-span-3 text-center">Semester</div>
                                            <div className="col-span-4 text-center">SGPA</div>
                                            <div className="col-span-4 text-center">Credits (optional)</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {semesters.map((sem) => (
                                            <div key={sem.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                                                <div className="col-span-4 sm:col-span-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="8"
                                                        value={sem.sem}
                                                        onChange={(e) => updateSemester(sem.id, 'sem', e.target.value)}
                                                        className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-center font-semibold outline-none focus:border-purple-500 transition"
                                                        placeholder="Sem#"
                                                    />
                                                </div>
                                                <div className="col-span-4 sm:col-span-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.01"
                                                        value={sem.sgpa}
                                                        onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                                                        className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-center font-semibold outline-none focus:border-purple-500 transition"
                                                        placeholder="SGPA (0-10)"
                                                    />
                                                </div>
                                                <div className="col-span-3 sm:col-span-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sem.credits}
                                                        onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                                                        className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-center outline-none focus:border-purple-500 transition"
                                                        placeholder="Credits"
                                                    />
                                                </div>
                                                <div className="col-span-1 text-center">
                                                    <button
                                                        onClick={() => removeSemester(sem.id)}
                                                        className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition inline-flex items-center justify-center"
                                                        disabled={semesters.length === 1}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CGPA Result */}
                                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm text-white/60">Cumulative Grade Point Average</p>
                                            <p className="text-xs text-white/40 mt-1">
                                                Based on {cgpaResult.semestersCount} semester{cgpaResult.semestersCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                                {cgpaResult.cgpa || '0.00'}
                                            </div>
                                            <p className="text-sm text-white/60 mt-1">CGPA</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Percentage Conversion */}
                                {cgpaResult.cgpa > 0 && (
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                        <h3 className="text-sm font-semibold text-white mb-3">Percentage Equivalent</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, ((cgpaResult.cgpa - 4) / 6) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-lg font-bold text-white">
                                                {((cgpaResult.cgpa - 0.75) * 10).toFixed(1)}%
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/50 mt-2">
                                            Formula: Percentage = (CGPA - 0.75) × 10
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - Calculation Breakdown */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 p-6 lg:sticky lg:top-24">
                            {/* Header */}
                            <div className="mb-6">
                                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    🧮 Calculation Breakdown
                                </h4>
                                <p className="text-xs text-white/50">Step-by-step calculation process</p>
                            </div>

                            {activeTab === 'sgpa' ? (
                                <>
                                    {/* Grade Scale */}
                                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-5">
                                        <div className="text-sm text-blue-300 mb-3 font-semibold">📋 Grade Scale (Total Marks)</div>
                                        <div className="space-y-1.5">
                                            {[
                                                { grade: 'O', points: '10', range: '90-100' },
                                                { grade: 'A+', points: '9', range: '80-89' },
                                                { grade: 'A', points: '8', range: '70-79' },
                                                { grade: 'B+', points: '7', range: '60-69' },
                                                { grade: 'B', points: '6', range: '50-59' },
                                                { grade: 'C', points: '5', range: '40-49' },
                                                { grade: 'F', points: '0', range: '<40' }
                                            ].map((item) => (
                                                <div key={item.grade} className="flex justify-between text-xs">
                                                    <span className="text-blue-200 font-semibold">{item.grade}</span>
                                                    <span className="text-blue-300">{item.points} points</span>
                                                    <span className="text-white/40">({item.range})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Formula */}
                                    <div className="rounded-xl bg-white/5 p-4 mb-5">
                                        <div className="text-sm text-white/70 mb-3 font-semibold">📐 Formulas</div>
                                        <div className="space-y-2">
                                            <div className="bg-black/30 rounded-lg p-2 text-center font-mono text-xs text-white/90">
                                                Total = CIE + (SEE ÷ 2)
                                            </div>
                                            <div className="bg-black/30 rounded-lg p-2 text-center font-mono text-xs text-white/90">
                                                SGPA = Σ(Credit × Points) / Σ(Credits)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculation Steps */}
                                    {subjects.length > 0 && (
                                        <div className="rounded-xl bg-white/5 p-4 mb-5">
                                            <div className="text-sm text-white/70 mb-3 font-semibold">📊 Your Calculation</div>
                                            
                                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                                {sgpaResult.subjects.map((sub, idx) => {
                                                    const cie = parseFloat(sub.cie) || 0;
                                                    const see = parseFloat(sub.see) || 0;
                                                    const seeConverted = see / 2;
                                                    const total = cie + seeConverted;
                                                    const credits = parseFloat(sub.credits) || 0;
                                                    
                                                    return (
                                                        <div key={idx} className="text-xs p-2 bg-black/20 rounded-lg">
                                                            <div className="font-semibold text-white/90 truncate">
                                                                {sub.name || `Subject ${idx + 1}`}
                                                            </div>
                                                            <div className="text-white/50 mt-1 space-y-0.5">
                                                                <div>CIE: {cie} + SEE: {see}/2 = <span className="text-cyan-400">{total.toFixed(1)}</span></div>
                                                                <div>
                                                                    {sub.grade ? (
                                                                        <>
                                                                            Grade: <span className={sub.color}>{sub.grade}</span> ({sub.points} pts) × {credits} cr = <span className="text-blue-400 font-semibold">{(sub.points * credits).toFixed(1)}</span>
                                                                            {sub.seeFail && <span className="text-red-400 ml-1">(SEE &lt; 36)</span>}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-white/30">Enter marks...</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Totals */}
                                            <div className="border-t border-white/10 pt-3 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/50">Total Credit Points:</span>
                                                    <span className="text-blue-400 font-semibold">{sgpaResult.weightedSum.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/50">Total Credits:</span>
                                                    <span className="text-blue-400 font-semibold">{sgpaResult.totalCredits.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-purple-600/20 rounded-lg mt-3">
                                                    <span className="text-purple-200 font-semibold text-sm">SGPA:</span>
                                                    <span className="text-white font-bold text-xl">{sgpaResult.sgpa || '0.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* CGPA Formula */}
                                    <div className="rounded-xl bg-white/5 p-4 mb-5">
                                        <div className="text-sm text-white/70 mb-3 font-semibold">📐 CGPA Formula</div>
                                        <div className="bg-black/30 rounded-lg p-3 text-center font-mono text-xs text-white/90 mb-3">
                                            CGPA = Σ(SGPA × Credits) / Σ(Credits)
                                        </div>
                                        <div className="text-xs text-white/50 mb-2">If credits not provided:</div>
                                        <div className="bg-black/30 rounded-lg p-3 text-center font-mono text-xs text-white/90">
                                            CGPA = Σ(SGPA) / Number of Semesters
                                        </div>
                                    </div>

                                    {/* Calculation Steps */}
                                    {semesters.length > 0 && (
                                        <div className="rounded-xl bg-white/5 p-4 mb-5">
                                            <div className="text-sm text-white/70 mb-3 font-semibold">📊 Your Calculation</div>
                                            
                                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                                {semesters.map((sem, idx) => {
                                                    const sgpa = parseFloat(sem.sgpa) || 0;
                                                    const credits = parseFloat(sem.credits) || 0;
                                                    
                                                    return (
                                                        <div key={idx} className="text-xs p-2 bg-black/20 rounded-lg">
                                                            <div className="font-semibold text-white/90">
                                                                Semester {sem.sem || idx + 1}
                                                            </div>
                                                            <div className="text-white/50 mt-1">
                                                                {credits > 0 
                                                                    ? `${sgpa} × ${credits} = ${(sgpa * credits).toFixed(2)}`
                                                                    : `SGPA: ${sgpa}`
                                                                }
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Totals */}
                                            <div className="border-t border-white/10 pt-3 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/50">Total SGPA Points:</span>
                                                    <span className="text-blue-400 font-semibold">{cgpaResult.weightedSum.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/50">Total Credits/Semesters:</span>
                                                    <span className="text-blue-400 font-semibold">{cgpaResult.totalCredits.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-purple-600/20 rounded-lg mt-3">
                                                    <span className="text-purple-200 font-semibold text-sm">CGPA:</span>
                                                    <span className="text-white font-bold text-xl">{cgpaResult.cgpa || '0.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Pro Tip */}
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                                <div className="text-sm text-emerald-300 mb-2 font-semibold flex items-center gap-2">
                                    💡 Pro Tip
                                </div>
                                <div className="text-xs text-emerald-200/80 leading-relaxed">
                                    {activeTab === 'sgpa' 
                                        ? 'SEE marks are entered out of 100 and automatically converted to 50. Focus on both CIE and SEE for better grades!'
                                        : 'Your CGPA is the weighted average of all your semester SGPAs. Consistent performance across semesters is key!'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CGPACalculatorPage;
