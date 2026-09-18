import React, { useState, useEffect, useMemo, useContext } from 'react';
import { GitCompare, Table, ArrowRight, Pencil, Check, RotateCcw, AlertCircle } from 'lucide-react';
import AcademicToolModal from '../AcademicToolModal';
import BranchChangeInput from './BranchChangeInput';
import BranchChangeResult from './BranchChangeResult';
import BranchChangeMatrix from './BranchChangeMatrix';
import {
    canonicalizeBranch,
    compareStudentProfile,
    getBranchList
} from '../../../utils/branchChangeEngine';
import { AuthContext } from '../../../context/AuthContext';

export default function BranchChangeTool({
    isOpen,
    onClose,
    initialCgpa,
    initialBranch
}) {
    const { user } = useContext(AuthContext) || {};
    const branches = useMemo(() => getBranchList(), []);

    // Derive starting branch & CGPA from profile if available
    const defaultBranch = useMemo(() => {
        if (initialBranch) return canonicalizeBranch(initialBranch);
        const userBr = user?.branch || user?.department || user?.branchCode;
        if (userBr) return canonicalizeBranch(userBr);
        return 'ME'; // sensible default
    }, [initialBranch, user]);

    const defaultTarget = useMemo(() => {
        return defaultBranch === 'CS' ? 'IS' : 'CS';
    }, [defaultBranch]);

    const defaultCgpa = useMemo(() => {
        if (initialCgpa !== undefined && initialCgpa !== null && !isNaN(Number(initialCgpa))) {
            return String(Number(initialCgpa).toFixed(2));
        }
        const userCgpa = user?.cgpa || user?.academicProfile?.cgpa;
        if (userCgpa !== undefined && userCgpa !== null && !isNaN(Number(userCgpa))) {
            return String(Number(userCgpa).toFixed(2));
        }
        return '9.00';
    }, [initialCgpa, user]);

    // Flow Step: 'entry' | 'result' | 'matrix'
    const [step, setStep] = useState('entry');

    // Form states
    const [cgpa, setCgpa] = useState(defaultCgpa);
    const [currentBranch, setCurrentBranch] = useState(defaultBranch);
    const [targetBranch, setTargetBranch] = useState(defaultTarget);
    const [hasBacklog, setHasBacklog] = useState(false);
    const [targetPreference, setTargetPreference] = useState(1);
    const [inputError, setInputError] = useState('');

    // Synchronize when modal opens or profile changes
    useEffect(() => {
        if (isOpen) {
            setStep('entry');
            setCgpa(defaultCgpa);
            setCurrentBranch(defaultBranch);
            setTargetBranch(defaultBranch === 'CS' ? 'IS' : 'CS');
            setHasBacklog(false);
            setTargetPreference(1);
            setInputError('');
        }
    }, [isOpen, defaultCgpa, defaultBranch]);

    // Handle branch change with collision prevention
    const handleCurrentBranchChange = (newBranch) => {
        setCurrentBranch(newBranch);
        if (newBranch === targetBranch) {
            const alternative = branches.find(b => b.code !== newBranch)?.code || 'CS';
            setTargetBranch(alternative);
        }
        setInputError('');
    };

    const handleTargetBranchChange = (newBranch) => {
        if (newBranch === currentBranch) {
            setInputError('Target branch cannot be identical to current branch.');
            return;
        }
        setTargetBranch(newBranch);
        setInputError('');
    };

    // Reset parameters to baseline
    const handleReset = () => {
        setCgpa(defaultCgpa);
        setCurrentBranch(defaultBranch);
        setTargetBranch(defaultBranch === 'CS' ? 'IS' : 'CS');
        setHasBacklog(false);
        setTargetPreference(1);
        setInputError('');
    };

    // Validation gate
    const isCgpaValid = cgpa !== '' && !isNaN(Number(cgpa)) && Number(cgpa) >= 0 && Number(cgpa) <= 10;
    const isBranchesValid = Boolean(currentBranch) && Boolean(targetBranch) && currentBranch !== targetBranch;
    const canAnalyze = isCgpaValid && isBranchesValid;

    // Reactive computation via Historical Branch Change Engine
    const analysisResult = useMemo(() => {
        if (!canAnalyze) return null;
        try {
            return compareStudentProfile({
                cgpa: Number(cgpa),
                currentBranch,
                targetBranch,
                hasBacklog,
                targetPreference
            });
        } catch (err) {
            return null;
        }
    }, [canAnalyze, cgpa, currentBranch, targetBranch, hasBacklog, targetPreference]);

    const handleAnalyze = () => {
        if (!canAnalyze) {
            if (!isCgpaValid) setInputError('Please enter a valid CGPA between 0.00 and 10.00');
            else if (!isBranchesValid) setInputError('Please select valid, distinct current and target branches.');
            return;
        }
        setInputError('');
        setStep('result');
    };

    // Footer rendering matching CIEEligibilityTool
    const renderFooter = () => {
        if (step === 'entry') {
            return (
                <div className="flex items-center justify-between w-full font-mono text-xs">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="px-4 py-1.5 rounded text-xs font-mono font-bold text-slate-950 bg-slate-100 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <span>Analyze Historical Chances</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            );
        }

        if (step === 'result') {
            return (
                <div className="flex items-center justify-between w-full font-mono text-xs">
                    <button
                        type="button"
                        onClick={() => setStep('entry')}
                        className="px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <Pencil size={12} />
                        <span>Edit Parameters</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded text-xs font-mono font-bold text-slate-950 bg-slate-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <Check size={13} />
                        <span>Done</span>
                    </button>
                </div>
            );
        }

        // step === 'matrix'
        return (
            <div className="flex items-center justify-between w-full font-mono text-xs">
                <button
                    type="button"
                    onClick={() => setStep('result')}
                    className="px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                    <span>← Back to Analysis</span>
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded text-xs font-mono font-bold text-slate-950 bg-slate-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                    <Check size={13} />
                    <span>Done</span>
                </button>
            </div>
        );
    };

    return (
        <AcademicToolModal
            isOpen={isOpen}
            onClose={onClose}
            title="Branch Change Predictor"
            subtitle="Data-driven historical analysis and counseling evaluation"
            subjectBadge={targetBranch ? `Target: ${targetBranch}` : 'AY 2025–26'}
            icon={GitCompare}
            footer={renderFooter()}
        >
            <div className="flex flex-col gap-4 font-mono">
                {/* Minimalist Sub-Header Tab Switcher */}
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setStep('entry')}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                step === 'entry'
                                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            1. Parameters
                        </button>
                        <span className="text-slate-600">/</span>
                        <button
                            type="button"
                            onClick={() => {
                                if (canAnalyze) setStep('result');
                            }}
                            disabled={!canAnalyze}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                step === 'result'
                                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                                    : canAnalyze
                                        ? 'text-slate-400 hover:text-slate-200'
                                        : 'text-slate-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                            2. Historical Analysis
                        </button>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setStep(step === 'matrix' ? 'result' : 'matrix')}
                            className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                                step === 'matrix'
                                    ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-semibold'
                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {step === 'matrix' ? 'Close Matrix' : 'Allocations Sheet (58)'}
                        </button>
                    </div>
                </div>

                {/* Step 1: Entry Parameters Sheet */}
                {step === 'entry' && (
                    <div className="animate-in fade-in duration-100">
                        <BranchChangeInput
                            cgpa={cgpa}
                            onCgpaChange={setCgpa}
                            currentBranch={currentBranch}
                            onCurrentBranchChange={handleCurrentBranchChange}
                            targetBranch={targetBranch}
                            onTargetBranchChange={handleTargetBranchChange}
                            hasBacklog={hasBacklog}
                            onHasBacklogChange={setHasBacklog}
                            targetPreference={targetPreference}
                            onTargetPreferenceChange={setTargetPreference}
                            error={inputError}
                        />
                    </div>
                )}

                {/* Step 2: Result & Verification Audit Sheet */}
                {step === 'result' && analysisResult && (
                    <div className="animate-in fade-in duration-100">
                        <BranchChangeResult
                            analysisResult={analysisResult}
                            onOpenMatrix={() => setStep('matrix')}
                        />
                    </div>
                )}

                {/* Step 3: Complete 58 Records Matrix Sheet */}
                {step === 'matrix' && (
                    <div className="animate-in fade-in duration-100">
                        <BranchChangeMatrix />
                    </div>
                )}
            </div>
        </AcademicToolModal>
    );
}
