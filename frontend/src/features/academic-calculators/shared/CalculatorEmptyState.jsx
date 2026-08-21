/* ═══════════════════════════════════════════════════════════════════
   CalculatorEmptyState Component
   Initial placeholder before calculation
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Calculator, ArrowRight } from 'lucide-react';

const CalculatorEmptyState = ({ title, message }) => {
    return (
        <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-6 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/5">
                <Calculator size={24} className="stroke-[2]" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-[#E6EDF3]">{title || 'Ready to Calculate'}</h4>
                <p className="text-xs text-[#8B949E] max-w-xs mx-auto mt-1 leading-relaxed">
                    {message || 'Fill in the fields on the left and click calculate to view your results.'}
                </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400/80 pt-1">
                <span>Enter details & click Calculate</span>
                <ArrowRight size={12} />
            </div>
        </div>
    );
};

export default CalculatorEmptyState;
