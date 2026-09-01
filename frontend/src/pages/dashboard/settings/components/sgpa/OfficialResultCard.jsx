import React from 'react';
import { BarChart3, RefreshCw, Loader2, CheckCircle2, Clock } from 'lucide-react';

const OfficialResultCard = ({ calculatedSgpa, officialResult, isFetching, fetchError, onFetchClick }) => {
    
    const formatDiff = (calc, official) => {
        if (calc === null || calc === undefined || official === null || official === undefined) return '—';
        const diff = (parseFloat(calc) - parseFloat(official)).toFixed(2);
        if (diff > 0) return `+${diff}`;
        return diff;
    };

    const getDiffColor = (diffStr) => {
        if (diffStr === '—' || diffStr === '0.00' || diffStr === '-0.00') return '#8B949E';
        if (diffStr.startsWith('+')) return '#4ade80';
        return '#ef4444';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.7))',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 20,
            padding: '22px 26px',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a78bfa'
                    }}>
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.125rem', fontWeight: 600 }}>Academic Result</h3>
                        {officialResult && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <CheckCircle2 size={12} color="#4ade80" />
                                <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 500 }}>Officially Verified</span>
                                <span style={{ color: '#8B949E', fontSize: '0.75rem' }}>• {officialResult.semesterLabel || 'Current Semester'}</span>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onFetchClick}
                    disabled={isFetching}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: isFetching ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: isFetching ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isFetching ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    <span>{isFetching ? 'Fetching...' : 'Fetch Official Result'}</span>
                </button>
            </div>

            {!officialResult ? (
                <div style={{ 
                    background: 'rgba(13, 17, 23, 0.5)',
                    border: '1px solid rgba(48, 54, 61, 0.5)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#8B949E', fontSize: '0.875rem', marginBottom: '8px' }}>Calculated SGPA</div>
                    <div style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>
                        {calculatedSgpa !== null && calculatedSgpa !== undefined ? Number(calculatedSgpa).toFixed(2) : '—'}
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        marginTop: '16px',
                        color: '#8B949E',
                        fontSize: '0.75rem'
                    }}>
                        <Clock size={12} />
                        <span>Last official sync: Not fetched yet</span>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{
                        background: 'rgba(13, 17, 23, 0.5)',
                        border: '1px solid rgba(48, 54, 61, 0.5)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', background: 'rgba(33, 38, 45, 0.5)', borderBottom: '1px solid rgba(48, 54, 61, 0.5)' }}>
                            <div style={{ flex: 1, padding: '12px 16px', color: '#8B949E', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Metric</div>
                            <div style={{ flex: 1, padding: '12px 16px', color: '#8B949E', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>Calculated</div>
                            <div style={{ flex: 1, padding: '12px 16px', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>Official</div>
                            <div style={{ flex: 1, padding: '12px 16px', color: '#8B949E', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Difference</div>
                        </div>
                        
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(48, 54, 61, 0.5)', alignItems: 'center' }}>
                            <div style={{ flex: 1, padding: '16px', color: '#C9D1D9', fontSize: '0.875rem', fontWeight: 500 }}>SGPA</div>
                            <div style={{ flex: 1, padding: '16px', color: 'white', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>
                                {calculatedSgpa !== null && calculatedSgpa !== undefined ? Number(calculatedSgpa).toFixed(2) : '—'}
                            </div>
                            <div style={{ flex: 1, padding: '16px', color: 'white', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>
                                {(officialResult.sgpa ?? officialResult.latestSGPA) !== undefined ? Number(officialResult.sgpa ?? officialResult.latestSGPA).toFixed(2) : '—'}
                            </div>
                            <div style={{ flex: 1, padding: '16px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right', color: getDiffColor(formatDiff(calculatedSgpa, officialResult.sgpa ?? officialResult.latestSGPA)) }}>
                                {formatDiff(calculatedSgpa, officialResult.sgpa ?? officialResult.latestSGPA)}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ flex: 1, padding: '16px', color: '#C9D1D9', fontSize: '0.875rem', fontWeight: 500 }}>CGPA</div>
                            <div style={{ flex: 1, padding: '16px', color: '#8B949E', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>
                                —
                            </div>
                            <div style={{ flex: 1, padding: '16px', color: 'white', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>
                                {(officialResult.cgpa ?? officialResult.currentCGPA) !== undefined ? Number(officialResult.cgpa ?? officialResult.currentCGPA).toFixed(2) : '—'}
                            </div>
                            <div style={{ flex: 1, padding: '16px', color: '#8B949E', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>
                                —
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        marginTop: '16px',
                        color: '#8B949E',
                        fontSize: '0.75rem'
                    }}>
                        <Clock size={12} />
                        <span>Last updated: {officialResult.fetchedAt ? new Date(officialResult.fetchedAt).toLocaleString() : new Date().toLocaleString()}</span>
                    </div>
                </>
            )}

            <style>
                {`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default OfficialResultCard;
