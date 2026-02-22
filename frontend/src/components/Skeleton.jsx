import React from 'react';

const Skeleton = ({ className, variant = 'rect' }) => {
    const baseClass = "bg-slate-700 animate-pulse rounded";
    const variantClass = variant === 'circle' ? 'rounded-full' : 'rounded-md';

    return (
        <div className={`${baseClass} ${variantClass} ${className}`} />
    );
};

export const DashboardSkeleton = () => (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            <div className="lg:col-span-2">
                <Skeleton className="h-[400px] w-full" />
            </div>
            <div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
    </div>
);

export default Skeleton;
