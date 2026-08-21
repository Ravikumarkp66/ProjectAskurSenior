/* ═══════════════════════════════════════════════════════════════════
   CalculatorNavigation Component
   Navigation Pills to switch between isolated SGPA and CGPA tools
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Award } from 'lucide-react';

const CalculatorNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSGPA = location.pathname.includes('/sgpa-calculator');
    const isCGPA = location.pathname.includes('/cgpa-calculator');

    return (
        <div className="flex items-center gap-2 p-1.5 bg-[#161B22]/80 backdrop-blur-md border border-[#21262D] rounded-2xl w-fit">
            <button
                type="button"
                onClick={() => navigate('/home/sgpa-calculator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                    isSGPA
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D]/60'
                }`}
            >
                <Calculator size={15} className={isSGPA ? 'text-purple-400' : 'text-[#8B949E]'} />
                <span>SGPA Calculator</span>
            </button>

            <button
                type="button"
                onClick={() => navigate('/home/cgpa-calculator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                    isCGPA
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D]/60'
                }`}
            >
                <Award size={15} className={isCGPA ? 'text-purple-400' : 'text-[#8B949E]'} />
                <span>CGPA Calculator</span>
            </button>
        </div>
    );
};

export default CalculatorNavigation;
