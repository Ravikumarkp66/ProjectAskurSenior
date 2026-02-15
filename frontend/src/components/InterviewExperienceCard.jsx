import React from 'react';

const InterviewExperienceCard = ({ experience, isLightMode }) => {
    const { company, role, questions, focus, package: pkg, createdAt } = experience;

    const cardClasses = isLightMode
        ? 'bg-white border-slate-200 shadow-sm text-slate-900'
        : 'bg-primary-900 border-primary-700 shadow-xl text-secondary-100';

    const labelClasses = isLightMode ? 'text-slate-500' : 'text-secondary-400';
    const tagClasses = isLightMode
        ? 'bg-purple-50 text-purple-700 border-purple-100'
        : 'bg-primary-800 text-primary-300 border-primary-700';

    return (
        <div className={`rounded-2xl border p-6 transition-all hover:scale-[1.01] ${cardClasses}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold tracking-tight">{company}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${tagClasses}`}>
                            {role}
                        </span>
                    </div>
                    <p className={`text-xs ${labelClasses}`}>
                        Shared on {new Date(createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-lg border text-sm font-semibold ${pkg === 'Not disclosed'
                            ? (isLightMode ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-primary-800 text-secondary-500 border-primary-700')
                            : (isLightMode ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20')
                        }`}>
                        💰 {pkg}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${labelClasses}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.771-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Interview Questions
                    </h4>
                    <ul className="space-y-2">
                        {questions.map((q, idx) => (
                            <li key={idx} className="flex items-start gap-3 group">
                                <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 transition-colors ${isLightMode ? 'bg-purple-300 group-hover:bg-purple-500' : 'bg-primary-600 group-hover:bg-primary-400'
                                    }`} />
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                    {q}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`pt-4 border-t ${isLightMode ? 'border-slate-100' : 'border-primary-800'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${labelClasses}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        What Mattered / Focus
                    </h4>
                    <p className={`text-sm italic font-medium ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>
                        {focus}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InterviewExperienceCard;
