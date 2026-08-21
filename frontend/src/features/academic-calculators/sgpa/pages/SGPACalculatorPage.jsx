/* ═══════════════════════════════════════════════════════════════════
   SGPACalculatorPage Component
   Main Isolated Page for /home/sgpa-calculator
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import SGPAHeader from '../components/SGPAHeader';
import SGPAForm from '../components/SGPAForm';
import SGPAResult from '../components/SGPAResult';
import SGPAInfoModal from '../components/SGPAInfoModal';
import CalculatorEmptyState from '../../shared/CalculatorEmptyState';
import { useSGPACalculator } from '../hooks/useSGPACalculator';
import { Info, HelpCircle } from 'lucide-react';

const SGPACalculatorPage = () => {
    const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

    const {
        branch,
        semester,
        subjects,
        result,
        validationError,
        showResetConfirm,
        handlePrefillCurriculum,
        addSubject,
        removeSubject,
        updateSubject,
        handleCalculate,
        requestReset,
        confirmReset,
        cancelReset
    } = useSGPACalculator();

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <SGPAHeader onOpenGuidelines={() => setIsGuidelinesOpen(true)} />

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Form & Inputs */}
                <div className="lg:col-span-2">
                    <SGPAForm
                        branch={branch}
                        semester={semester}
                        subjects={subjects}
                        validationError={validationError}
                        showResetConfirm={showResetConfirm}
                        onPrefillCurriculum={handlePrefillCurriculum}
                        onAddSubject={addSubject}
                        onRemoveSubject={removeSubject}
                        onUpdateSubject={updateSubject}
                        onCalculate={handleCalculate}
                        onRequestReset={requestReset}
                        onConfirmReset={confirmReset}
                        onCancelReset={cancelReset}
                    />
                </div>

                {/* Right Column: Result Card & Academic Rules Card */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Result or Empty State */}
                    {result ? (
                        <SGPAResult result={result} />
                    ) : (
                        <CalculatorEmptyState
                            title="Calculate Semester SGPA"
                            message="Enter your subject grades and credits on the left, then click Calculate SGPA."
                        />
                    )}

                    {/* Secondary Guidelines Card */}
                    <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                <HelpCircle size={15} />
                            </div>
                            <h4 className="text-xs font-bold text-[#E6EDF3]">SGPA Calculation Rules</h4>
                        </div>
                        <p className="text-xs text-[#8B949E] leading-relaxed">
                            Understand how subject credits and letter grades contribute to your semester GPA.
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
            <SGPAInfoModal
                isOpen={isGuidelinesOpen}
                onClose={() => setIsGuidelinesOpen(false)}
            />
        </div>
    );
};

export default SGPACalculatorPage;
