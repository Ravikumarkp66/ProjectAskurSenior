import React from 'react';
import { useOutletContext } from 'react-router-dom';


const DashboardPage = () => {
    const { theme, isLightMode } = useOutletContext() || {};

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Hero Section: Semester Journey Widget */}


            <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div
                        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                        style={{
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.2)',
                        }}
                    >
                        <svg className="w-8 h-8" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>
                        Select a subject from the sidebar to get started.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
