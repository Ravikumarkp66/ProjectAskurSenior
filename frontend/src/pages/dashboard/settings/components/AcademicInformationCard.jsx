import React, { useEffect, useState } from 'react';
import { lookupAPI } from '../../../../services/api';
import { Lock, Building, Calendar, Award } from 'lucide-react';

const AcademicInformationCard = ({ formData = {} }) => {
    const [schemes, setSchemes] = useState([]);

    useEffect(() => {
        const loadSchemes = async () => {
            try {
                const res = await lookupAPI.getSchemes();
                setSchemes(res.data || []);
            } catch (err) {
                console.error('[AcademicInformationCard] Error loading schemes:', err);
            }
        };
        loadSchemes();
    }, []);

    // Resolve scheme name
    const schemeObj = schemes.find(s => s._id === formData.scheme || s.id === formData.scheme || s.name === formData.scheme);
    const schemeName = schemeObj ? `${schemeObj.name} Scheme` : (formData.scheme ? `${formData.scheme} Scheme` : '2022 Scheme');

    const collegeName = formData.college || 'Siddaganga Institute of Technology';
    const graduationYear = formData.graduationYear || '2027';

    return (
        <div className="rounded-xl border p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-4 box-border">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    Academic Information
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Authoritative institutional records managed by college administration (read-only).
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* College (Read-only / Locked) */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 m-0">
                            College
                        </label>
                        <span title="College record is locked" className="text-slate-400 dark:text-slate-500 flex items-center">
                            <Lock size={12} />
                        </span>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={collegeName}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none box-border"
                        />
                    </div>
                </div>

                {/* Scheme (Read-only / Locked) */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 m-0">
                            Scheme
                        </label>
                        <span title="Academic scheme is locked" className="text-slate-400 dark:text-slate-500 flex items-center">
                            <Lock size={12} />
                        </span>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={schemeName}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none box-border"
                        />
                    </div>
                </div>

                {/* Graduation Year (Read-only / Locked) */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 m-0">
                            Graduation Year
                        </label>
                        <span title="Graduation year is locked" className="text-slate-400 dark:text-slate-500 flex items-center">
                            <Lock size={12} />
                        </span>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={graduationYear}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none box-border"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicInformationCard;
