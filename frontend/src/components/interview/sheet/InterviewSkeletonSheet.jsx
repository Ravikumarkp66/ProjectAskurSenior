import React from 'react';

const InterviewSkeletonSheet = () => {
    return (
        <div className="w-full">
            {/* Desktop Skeleton Table */}
            <div className="hidden lg:block rounded-2xl bg-[#0e1015]/90 border border-white/[0.08] overflow-hidden shadow-2xl">
                <div className="h-11 bg-[#13161f] border-b border-white/[0.08] flex items-center px-6 gap-6">
                    <div className="h-3.5 w-24 bg-white/10 rounded" />
                    <div className="h-3.5 w-20 bg-white/10 rounded" />
                    <div className="h-3.5 w-16 bg-white/10 rounded" />
                    <div className="h-3.5 w-20 bg-white/10 rounded" />
                    <div className="h-3.5 w-16 bg-white/10 rounded" />
                    <div className="h-3.5 w-16 bg-white/10 rounded ml-auto" />
                </div>
                <div className="divide-y divide-white/[0.04]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-16 flex items-center px-6 gap-6 animate-pulse">
                            <div className="flex items-center gap-3 w-[28%]">
                                <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3.5 w-3/4 bg-white/10 rounded" />
                                    <div className="h-2.5 w-1/2 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="h-3.5 w-[20%] bg-white/10 rounded" />
                            <div className="h-5 w-16 bg-white/5 rounded-lg" />
                            <div className="h-3.5 w-24 bg-white/10 rounded" />
                            <div className="h-3.5 w-16 bg-white/5 rounded" />
                            <div className="h-6 w-20 bg-white/10 rounded-full" />
                            <div className="h-7 w-24 bg-white/10 rounded-xl ml-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Skeleton Cards */}
            <div className="lg:hidden flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#0e1015] border border-white/[0.08] animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-4 w-32 bg-white/10 rounded" />
                                <div className="h-3 w-20 bg-white/5 rounded" />
                            </div>
                        </div>
                        <div className="h-3.5 w-48 bg-white/10 rounded mb-3" />
                        <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                            <div className="h-5 w-24 bg-white/10 rounded-full" />
                            <div className="h-3.5 w-16 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InterviewSkeletonSheet;
