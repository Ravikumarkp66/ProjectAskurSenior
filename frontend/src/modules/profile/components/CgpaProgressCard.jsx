import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, Award, Building2, ClipboardEdit } from 'lucide-react';
import { companiesConfig } from '../config/companies';
import { apiV2 } from '../../../services/authService';
import { useAuth } from '../../../utils/hooks';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15, 10, 30, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.65)',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
            }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>
                    {payload[0].payload.semester}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#fff', fontWeight: 700 }}>
                    CGPA: {payload[0].value.toFixed(2)}
                </p>
                {payload[0].payload.sgpa != null && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(148,163,184,0.55)', fontWeight: 500 }}>
                        SGPA: {payload[0].payload.sgpa.toFixed(2)}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            border: active ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
            outline: 'none',
            background: active ? 'rgba(139,92,246,0.16)' : 'transparent',
            color: active ? '#c4b5fd' : 'rgba(148,163,184,0.4)',
            padding: '4px 10px',
            borderRadius: '18px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
        }}
    >
        {label}
    </button>
);

// ─── Empty Chart State ────────────────────────────────────────────────────────
const ChartEmptyState = () => (
    <div style={{
        height: '175px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: '1px dashed rgba(139, 92, 246, 0.15)',
        borderRadius: '8px',
        background: 'rgba(139, 92, 246, 0.02)'
    }}>
        <ClipboardEdit size={22} color="rgba(139, 92, 246, 0.35)" />
        <p style={{
            margin: 0,
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'rgba(148, 163, 184, 0.5)',
            textAlign: 'center'
        }}>
            No semester records yet
        </p>
        <p style={{
            margin: 0,
            fontSize: '11px',
            color: 'rgba(148, 163, 184, 0.3)',
            textAlign: 'center',
            maxWidth: '220px',
            lineHeight: 1.4
        }}>
            Add your semester SGPA to plot your CGPA progress over time
        </p>
    </div>
);

const CgpaProgressCard = () => {
    const [activeTab, setActiveTab] = useState('CGPA');
    const { user } = useAuth();

    // Instant session cache for semesters and companies
    const cacheKeySem = `aus_semesters_${user?.usn || 'user'}`;
    const cacheKeyComp = 'aus_companies_list';

    const [semestersList, setSemestersList] = useState(() => {
        try {
            const raw = sessionStorage.getItem(cacheKeySem);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [companies, setCompanies] = useState(() => {
        try {
            const raw = sessionStorage.getItem(cacheKeyComp);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [companiesLoading, setCompaniesLoading] = useState(false);

    // Fetch actual semesters list on mount
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await apiV2.getSemesters();
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setSemestersList(res.data.data);
                    try {
                        sessionStorage.setItem(cacheKeySem, JSON.stringify(res.data.data));
                    } catch (e) {}
                }
            } catch (err) {
                console.error('[CgpaProgressCard] Failed to fetch semesters:', err);
            }
        };
        fetchSemesters();
    }, [cacheKeySem]);

    // Format for Recharts line chart: { semester: 'Sem 1', sgpa: 8.0, cgpa: 8.0 }
    const semesterData = useMemo(() => {
        if (!semestersList || semestersList.length === 0) return null;
        
        const sorted = [...semestersList].sort((a, b) => a.semester - b.semester);
        let cumulativeWeightedSum = 0;
        let cumulativeCredits = 0;
        
        return sorted.map((sem) => {
            const semCredits = sem.credits || 0;
            cumulativeWeightedSum += (sem.sgpa * semCredits);
            cumulativeCredits += semCredits;
            const cgpaEstimate = cumulativeCredits > 0
                ? Math.round((cumulativeWeightedSum / cumulativeCredits) * 100) / 100
                : 0;
            return {
                semester: `Sem ${sem.semester}`,
                sgpa: sem.sgpa,
                cgpa: cgpaEstimate
            };
        });
    }, [semestersList]);

    const hasChartData = semesterData && semesterData.length > 0;

    // Current CGPA: check user.cgpa first
    const currentCgpa = user?.cgpa ?? user?.academicProfile?.cgpa ?? null;

    // Highest CGPA: derived from semester records if available, else same as current
    const highestCgpa = hasChartData
        ? Math.max(...semesterData.map(d => d.cgpa))
        : currentCgpa;

    // Fetch companies from DB, merge cutoff from config as fallback
    useEffect(() => {
        const fetchCompanies = async () => {
            if (companies.length === 0) setCompaniesLoading(true);
            try {
                const res = await apiV2.getCompanies();
                const dbCompanies = res.data || [];

                const merged = dbCompanies.map(dbC => {
                    const configMatch = companiesConfig.find(
                        c => c.name.toLowerCase() === dbC.name.toLowerCase()
                    );
                    return {
                        _id: dbC._id,
                        name: dbC.name,
                        type: dbC.type,
                        cutoff: dbC.cutoff ?? configMatch?.cutoff ?? null
                    };
                });

                const withCutoff = merged
                    .filter(c => c.cutoff !== null)
                    .sort((a, b) => b.cutoff - a.cutoff);

                setCompanies(withCutoff);
                try {
                    sessionStorage.setItem(cacheKeyComp, JSON.stringify(withCutoff));
                } catch (e) {}
            } catch (err) {
                const fallback = companiesConfig
                    .filter(c => c.cutoff !== null)
                    .sort((a, b) => b.cutoff - a.cutoff);
                setCompanies(fallback);
                console.error('[CgpaProgressCard] Failed to fetch companies:', err);
            } finally {
                setCompaniesLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    return (
        <div style={{
            background: 'rgba(19,18,26,0.45)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '300px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                height: '28px',
                flexShrink: 0
            }}>
                <h2 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    margin: 0,
                    letterSpacing: '-0.01em'
                }}>
                    CGPA Progress
                </h2>

                <div style={{
                    display: 'flex',
                    background: 'rgba(15,10,30,0.6)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '20px',
                    padding: '2px'
                }}>
                    <TabButton label="CGPA" active={activeTab === 'CGPA'} onClick={() => setActiveTab('CGPA')} />
                    <TabButton label="Companies" active={activeTab === 'Companies'} onClick={() => setActiveTab('Companies')} />
                </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {activeTab === 'CGPA' ? (
                    hasChartData ? (
                        /* Live CGPA Line Chart from DB records */
                        <div style={{ width: '100%', height: '175px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={semesterData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cgpaGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="semester" stroke="rgba(148,163,184,0.3)" fontSize={10} tickLine={false} axisLine={false} dy={4} />
                                    <YAxis stroke="rgba(148,163,184,0.3)" fontSize={10} tickLine={false} axisLine={false} domain={[6.0, 10.0]} dx={-4} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.15)', strokeWidth: 1 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="cgpa"
                                        stroke="#a78bfa"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#cgpaGlow)"
                                        activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 1.5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        /* No semester data in DB — show empty state */
                        <ChartEmptyState />
                    )
                ) : (
                    /* Companies Tab */
                    <div style={{
                        height: '175px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        paddingRight: '4px'
                    }}>
                        {companiesLoading ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: 'rgba(148,163,184,0.4)', fontSize: '12px'
                            }}>
                                Loading companies…
                            </div>
                        ) : companies.length === 0 ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: 'rgba(148,163,184,0.3)', fontSize: '12px'
                            }}>
                                No company data available
                            </div>
                        ) : (
                            companies.map((company, idx) => (
                                <div
                                    key={company._id || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 10px',
                                        borderRadius: '7px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        flexShrink: 0
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{
                                            width: '26px', height: '26px', borderRadius: '6px',
                                            background: 'rgba(139,92,246,0.08)',
                                            border: '1px solid rgba(139,92,246,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Building2 size={12} color="#a78bfa" />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0',
                                                whiteSpace: 'nowrap', overflow: 'hidden',
                                                textOverflow: 'ellipsis', maxWidth: '160px'
                                            }}>
                                                {company.name}
                                            </div>
                                            <div style={{
                                                fontSize: '10.5px', color: 'rgba(148,163,184,0.45)',
                                                fontWeight: 400, marginTop: '1px'
                                            }}>
                                                {company.type}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: '10px', color: 'rgba(148,163,184,0.4)',
                                            fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}>
                                            CGPA Cutoff
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                                            {company.cutoff.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                height: '38px',
                flexShrink: 0
            }}>
                {/* Current CGPA — from academic_profiles collection in DB */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#c4b5fd', flexShrink: 0
                    }}>
                        <TrendingUp size={13} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase' }}>
                            Current CGPA
                        </span>
                        <span style={{
                            fontSize: '13px', fontWeight: 700, lineHeight: 1.1,
                            color: currentCgpa !== null ? '#f8fafc' : 'rgba(148,163,184,0.35)'
                        }}>
                            {currentCgpa !== null ? currentCgpa.toFixed(2) : '—'}
                        </span>
                    </div>
                </div>

                {/* Highest CGPA — from semester records or same as current */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#a7f3d0', flexShrink: 0
                    }}>
                        <Award size={13} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase' }}>
                            Highest CGPA
                        </span>
                        <span style={{
                            fontSize: '13px', fontWeight: 700, lineHeight: 1.1,
                            color: highestCgpa !== null ? '#f8fafc' : 'rgba(148,163,184,0.35)'
                        }}>
                            {highestCgpa !== null ? highestCgpa.toFixed(2) : '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CgpaProgressCard;
