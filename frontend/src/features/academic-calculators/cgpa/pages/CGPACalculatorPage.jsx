/* ═══════════════════════════════════════════════════════════════════
   CGPACalculatorPage Component
   Main Isolated Page for /home/cgpa-calculator
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import CGPAHeader from '../components/CGPAHeader';
import CGPAForm from '../components/CGPAForm';
import CGPAResult from '../components/CGPAResult';
import CGPAInfoModal from '../components/CGPAInfoModal';
import CalculatorEmptyState from '../../shared/CalculatorEmptyState';
import { useCGPACalculator } from '../hooks/useCGPACalculator';
import { HelpCircle } from 'lucide-react';

const CGPACalculatorPage = () => {
    const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

    const {
        semesters,
        result,
        validationError,
        showResetConfirm,
        addSemester,
        removeSemester,
        updateSemester,
        handleCalculate,
        requestReset,
        confirmReset,
        cancelReset
    } = useCGPACalculator();

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <CGPAHeader onOpenGuidelines={() => setIsGuidelinesOpen(true)} />

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Form & Semester Inputs */}
                <div className="lg:col-span-2">
                    <CGPAForm
                        semesters={semesters}
                        validationError={validationError}
                        showResetConfirm={showResetConfirm}
                        onAddSemester={addSemester}
                        onRemoveSemester={removeSemester}
                        onUpdateSemester={updateSemester}
                        onCalculate={handleCalculate}
                        onRequestReset={requestReset}
                        onConfirmReset={confirmReset}
                        onCancelReset={cancelReset}
                    />
                </div>

                {/* Right Column: Result Card & Academic Guidelines Card */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Result or Empty State */}
                    {result ? (
                        <CGPAResult result={result} />
                    ) : (
                        <CalculatorEmptyState
                            title="Calculate Overall CGPA"
                            message="Add your semester SGPAs and credits on the left, then click Calculate CGPA."
                        />
                    )}

                    {/* Secondary Guidelines Card */}
                    <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                <HelpCircle size={15} />
                            </div>
                            <h4 className="text-xs font-bold text-[#E6EDF3]">CGPA Calculation Rules</h4>
                        </div>
                        <p className="text-xs text-[#8B949E] leading-relaxed">
                            Learn how semester SGPA and credit weightage contribute to overall CGPA.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsGuidelinesOpen(true)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 pt-1"
                        >
                            <span>View Guidelines →</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Guidelines Modal */}
            <CGPAInfoModal
                isOpen={isGuidelinesOpen}
                onClose={() => setIsGuidelinesOpen(false)}
            />
        </div>
    );
};

export default CGPACalculatorPage;
