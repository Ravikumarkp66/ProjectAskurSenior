/* ═══════════════════════════════════════════════════════════════════
   SGPAHeader Component
   Title, Subtitle, and Guidelines button
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Calculator, Info } from 'lucide-react';
import CalculatorNavigation from '../../shared/CalculatorNavigation';

const SGPAHeader = ({ onOpenGuidelines }) => {
    return (
        <div className="space-y-4 pb-4 border-b border-[#21262D]">
            {/* Navigation Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CalculatorNavigation />

                <button
                    type="button"
                    onClick={onOpenGuidelines}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all self-start sm:self-auto"
                >
                    <Info size={14} />
                    <span>Calculation Guidelines</span>
                </button>
            </div>

            {/* Title & Subtitle */}
            <div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Calculator size={20} className="stroke-[2.5]" />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
                        SGPA Calculator
                    </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1">
                    Calculate your semester GPA using your subject grades and credits.
                </p>
            </div>
        </div>
    );
};

export default SGPAHeader;
