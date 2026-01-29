import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PieProgress = ({ progress = 0, size = 'md' }) => {
    const clamped = Math.min(100, Math.max(0, progress));

    const data = [
        { name: 'Completed', value: clamped },
        { name: 'Remaining', value: 100 - clamped }
    ];

    const sizeConfig = {
        sm: { width: 60, height: 60, innerRadius: 18, outerRadius: 30 },
        md: { width: 80, height: 80, innerRadius: 25, outerRadius: 40 },
        lg: { width: 120, height: 120, innerRadius: 45, outerRadius: 65 }
    };

    const config = sizeConfig[size] || sizeConfig.md;

    if (size === 'lg') {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="relative" style={{ width: config.width, height: config.height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={config.innerRadius}
                                outerRadius={config.outerRadius}
                                fill="#111827"
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                            >
                                <Cell fill="#f97316" />
                                <Cell fill="#1f2933" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-50">{clamped}%</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: config.width, height: config.height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={config.innerRadius}
                        outerRadius={config.outerRadius}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                    >
                        <Cell fill="#ff8c00" />
                        <Cell fill="#1a1a1a" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieProgress;
