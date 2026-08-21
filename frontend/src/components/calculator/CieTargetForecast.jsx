import React, { memo } from 'react';
import { Trophy, TrendingUp, Info } from 'lucide-react';

const CieTargetForecast = memo(({
    targetSgpa,
    setTargetSgpa,
    requiredCie,
    currentAverageCie,
    isLightMode
}) => {
    return (
        <div className={`p-5 rounded-2xl border transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121316] border-slate-800 text-white'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-sm sm:text-base">Target Forecast</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                    CIE Analytics
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Target SGPA Goals (1.0 - 10.0)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={targetSgpa}
                        onChange={(e) => setTargetSgpa(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-bold transition-colors ${
                            isLightMode
                                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                                : 'bg-[#18191c] border-slate-800 text-white focus:border-amber-500'
                        }`}
                        placeholder="e.g. 8.5"
                    />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center">
                    <div className="text-[11px] font-semibold text-amber-400/90 mb-0.5">
                        Avg Required CIE / Subject
                    </div>
                    <div className="text-xl font-black text-amber-400">
                        {requiredCie ? `${requiredCie} / 50` : 'Set Target'}
                    </div>
                    {currentAverageCie && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            Current Avg: <span className="font-bold text-slate-200">{currentAverageCie} / 50</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

CieTargetForecast.displayName = 'CieTargetForecast';

export default CieTargetForecast;
