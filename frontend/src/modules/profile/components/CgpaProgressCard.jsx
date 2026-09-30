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
import { TrendingUp, Award, Building2, ClipboardEdit, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { companiesConfig } from '../config/companies';
import { apiV2 } from '../../../services/authService';
import { useAuth } from '../../../utils/hooks';
import { useTheme } from '../../../context/ThemeContext';
import {
    useProfileEntitlements,
    PROFILE_FEATURES
} from '../../../features/profile/utils/profileEntitlements';
import { DEMO_CGPA_CHART_DATA } from '../../../features/profile/config/profileDemoData';
import { ProfileLockBadge } from '../../../features/profile/components/ProfileLockedPreview';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, isDark }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: isDark ? '#15181D' : '#FFFFFF',
                border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
                fontFamily: 'Inter, sans-serif'
            }}>
                <p style={{ margin: 0, fontSize: '11px', color: isDark ? '#93C5FD' : '#2563EB', fontWeight: 600 }}>
                    {payload[0].payload.semester}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#F3F4F6' : '#111827', fontWeight: 700 }}>
                    CGPA: {Number(payload[0].value).toFixed(2)}
                </p>
                {payload[0].payload.sgpa != null && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280', fontWeight: 500 }}>
                        SGPA: {Number(payload[0].payload.sgpa).toFixed(2)}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabButton = ({ label, active, onClick, isDark }) => (
    <button
        onClick={onClick}
        style={{
            border: active
                ? (isDark ? '1px solid #292E37' : '1px solid #E5E7EB')
                : '1px solid transparent',
            outline: 'none',
            background: active
                ? (isDark ? '#1B1F26' : '#FFFFFF')
                : 'transparent',
            color: active
                ? (isDark ? '#F3F4F6' : '#111827')
                : (isDark ? '#71717A' : '#6B7280'),
            boxShadow: (active && !isDark) ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
        }}
    >
        {label}
    </button>
);

// ─── Empty Chart State ────────────────────────────────────────────────────────
const ChartEmptyState = ({ isDark }) => (
    <div style={{
        height: '165px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        border: isDark ? '1px dashed #292E37' : '1px dashed #E5E7EB',
        borderRadius: '6px',
        background: isDark ? '#15181D' : '#F8FAFC'
    }}>
        <ClipboardEdit size={20} color={isDark ? '#71717A' : '#9CA3AF'} />
        <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#F3F4F6' : '#111827',
            textAlign: 'center'
        }}>
            No semester records yet
        </p>
        <p style={{
            margin: 0,
            fontSize: '11px',
            color: isDark ? '#71717A' : '#6B7280',
            textAlign: 'center',
            maxWidth: '220px',
            lineHeight: 1.4
        }}>
            Add your semester SGPA to plot your CGPA progress over time
        </p>
    </div>
);

const CgpaProgressCard = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('CGPA');
    const { user } = useAuth();
    const { isPlus, isFree, isAnonymous } = useProfileEntitlements();

    // Instant session cache for Plus users only
    const cacheKeySem = `aus_semesters_${user?.usn || 'user'}`;
    const cacheKeyComp = 'aus_companies_list';

    const [semestersList, setSemestersList] = useState(() => {
        if (!isPlus) return [];
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

    // Fetch actual semesters list on mount ONLY for Plus users (Free & Anonymous do not make private API calls)
    useEffect(() => {
        if (!isPlus) return;

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
    }, [isPlus, cacheKeySem]);

    // Format for Recharts line chart
    const semesterData = useMemo(() => {
        if (!isPlus) {
            // Preview data for Free & Anonymous users
            return DEMO_CGPA_CHART_DATA;
        }

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
    }, [isPlus, semestersList]);

    const hasChartData = semesterData && semesterData.length > 0;

    // Current CGPA calculation
    const currentCgpa = isPlus
        ? (user?.cgpa ?? user?.academicProfile?.cgpa ?? null)
        : (isAnonymous ? 8.53 : null);

    const highestCgpa = isPlus
        ? (hasChartData ? Math.max(...semesterData.map(d => d.cgpa)) : currentCgpa)
        : (isAnonymous ? 8.53 : null);

    // Fetch placement companies
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
            } finally {
                setCompaniesLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleUpgradeClick = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile' } });
        } else {
            navigate('/pricing');
        }
    };

    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const dividerColor = isDark ? '#292E37' : '#E5E7EB';
    const titleColor = isDark ? '#F3F4F6' : '#111827';
    const labelColor = isDark ? '#A1A1AA' : '#6B7280';

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '300px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            position: 'relative'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: titleColor,
                        margin: 0,
                        letterSpacing: '-0.01em'
                    }}>
                        CGPA Progress
                    </h2>
                    {!isPlus && <ProfileLockBadge isAnonymous={isAnonymous} />}
                </div>

                <div style={{
                    display: 'flex',
                    background: isDark ? '#15181D' : '#F8FAFC',
                    border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '2px'
                }}>
                    <TabButton label="CGPA" active={activeTab === 'CGPA'} onClick={() => setActiveTab('CGPA')} isDark={isDark} />
                    <TabButton label="Companies" active={activeTab === 'Companies'} onClick={() => setActiveTab('Companies')} isDark={isDark} />
                </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div style={{ height: '1px', background: dividerColor, flexShrink: 0 }} />

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

                {activeTab === 'CGPA' ? (
                    hasChartData ? (
                        /* CGPA Chart (Live for Plus, Preview for Free / Anonymous) */
                        <div style={{ width: '100%', height: '165px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={semesterData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cgpaGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isDark ? '#3B82F6' : '#2563EB'} stopOpacity={isDark ? 0.3 : 0.15} />
                                            <stop offset="95%" stopColor={isDark ? '#3B82F6' : '#2563EB'} stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#292E37' : '#E5E7EB'} vertical={false} />
                                    <XAxis dataKey="semester" stroke={isDark ? '#71717A' : '#9CA3AF'} fontSize={10} tickLine={false} axisLine={false} dy={4} />
                                    <YAxis stroke={isDark ? '#71717A' : '#9CA3AF'} fontSize={10} tickLine={false} axisLine={false} domain={[6.0, 10.0]} dx={-4} />
                                    <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)', strokeWidth: 1 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="cgpa"
                                        stroke={isDark ? '#3B82F6' : '#2563EB'}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#cgpaGlow)"
                                        activeDot={{ r: 4, fill: isDark ? '#3B82F6' : '#2563EB', stroke: isDark ? '#0F1115' : '#FFFFFF', strokeWidth: 1.5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Free User Lock Indicator Pill */}
                            {!isPlus && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: isDark ? 'rgba(15, 17, 21, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                                    border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10.5px',
                                    fontWeight: 600,
                                    color: isDark ? '#93C5FD' : '#2563EB',
                                    cursor: 'pointer'
                                }}
                                onClick={handleUpgradeClick}
                                >
                                    <Lock size={10} />
                                    <span>{isAnonymous ? 'Sign in to plot CGPA' : 'Unlock with Plus'}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <ChartEmptyState isDark={isDark} />
                    )
                ) : (
                    /* Companies Tab */
                    <div style={{
                        height: '165px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '4px'
                    }}>
                        {companiesLoading ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: labelColor, fontSize: '12px'
                            }}>
                                Loading companies…
                            </div>
                        ) : companies.length === 0 ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: labelColor, fontSize: '12px'
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
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        background: isDark ? '#15181D' : '#F8FAFC',
                                        border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
                                        flexShrink: 0
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '4px',
                                            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                                            border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(37, 99, 235, 0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Building2 size={12} color={isDark ? '#93C5FD' : '#2563EB'} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '12px', fontWeight: 600, color: titleColor,
                                                whiteSpace: 'nowrap', overflow: 'hidden',
                                                textOverflow: 'ellipsis', maxWidth: '160px'
                                            }}>
                                                {company.name}
                                            </div>
                                            <div style={{
                                                fontSize: '10px', color: labelColor,
                                                fontWeight: 400
                                            }}>
                                                {company.type}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: '9.5px', color: labelColor,
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}>
                                            CGPA Cutoff
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: titleColor, lineHeight: 1.2 }}>
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
            <div style={{ height: '1px', background: dividerColor, flexShrink: 0 }} />

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                height: '36px',
                flexShrink: 0
            }}>
                {/* Current CGPA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
                    <div style={{
                        width: '26px', height: '26px', borderRadius: '4px',
                        background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                        border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(37, 99, 235, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isDark ? '#93C5FD' : '#2563EB', flexShrink: 0
                    }}>
                        <TrendingUp size={12} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 600, color: labelColor, textTransform: 'uppercase' }}>
                            Current CGPA
                        </span>
                        <span style={{
                            fontSize: '12.5px', fontWeight: 700, lineHeight: 1.1,
                            color: currentCgpa !== null ? titleColor : (isDark ? '#71717A' : '#9CA3AF')
                        }}>
                            {isPlus
                                ? (currentCgpa !== null ? currentCgpa.toFixed(2) : '—')
                                : (isAnonymous ? `${currentCgpa.toFixed(2)} (Demo)` : '🔒 Plus')}
                        </span>
                    </div>
                </div>

                {/* Highest CGPA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
                    <div style={{
                        width: '26px', height: '26px', borderRadius: '4px',
                        background: isDark ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.08)',
                        border: isDark ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid rgba(22, 163, 74, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isDark ? '#86EFAC' : '#16A34A', flexShrink: 0
                    }}>
                        <Award size={12} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 600, color: labelColor, textTransform: 'uppercase' }}>
                            Highest CGPA
                        </span>
                        <span style={{
                            fontSize: '12.5px', fontWeight: 700, lineHeight: 1.1,
                            color: highestCgpa !== null ? titleColor : (isDark ? '#71717A' : '#9CA3AF')
                        }}>
                            {isPlus
                                ? (highestCgpa !== null ? highestCgpa.toFixed(2) : '—')
                                : (isAnonymous ? `${highestCgpa.toFixed(2)} (Demo)` : '🔒 Plus')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CgpaProgressCard;
