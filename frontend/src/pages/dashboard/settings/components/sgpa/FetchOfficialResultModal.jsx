import React, { useState, useEffect } from 'react';
import { GraduationCap, X, Lock, Loader2, Shield } from 'lucide-react';

const FetchOfficialResultModal = ({ isOpen, onClose, onSubmit, isFetching, fetchError, defaultUsn = '' }) => {
    const [usn, setUsn] = useState(defaultUsn);
    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsn(defaultUsn);
        }
    }, [isOpen, defaultUsn]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(usn, dobDay, dobMonth, dobYear);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isFetching) {
            onClose();
        }
    };

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = Array.from({ length: 21 }, (_, i) => 2010 - i); // 2010 to 1990

    return (
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            <div
                style={{
                    background: '#161B22',
                    border: '1px solid #21262D',
                    borderRadius: 20,
                    width: '100%',
                    maxWidth: '450px',
                    padding: '24px',
                    position: 'relative'
                }}
            >
                <button
                    onClick={onClose}
                    disabled={isFetching}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#8B949E',
                        cursor: isFetching ? 'not-allowed' : 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#a78bfa'
                    }}>
                        <GraduationCap size={24} />
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
                        Fetch Official Result
                    </h2>
                    <p style={{ margin: 0, color: '#8B949E', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        We will securely access your official SIT/Contineo account to retrieve your latest academic result.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', color: '#C9D1D9', fontSize: '0.875rem', marginBottom: '6px', fontWeight: 500 }}>
                            USN
                        </label>
                        <input
                            type="text"
                            value={usn}
                            onChange={(e) => setUsn(e.target.value.toUpperCase())}
                            required
                            disabled={isFetching}
                            placeholder="e.g. 1SI20CS001"
                            style={{
                                width: '100%',
                                background: '#0D1117',
                                border: '1px solid #21262D',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                color: 'white',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#C9D1D9', fontSize: '0.875rem', marginBottom: '6px', fontWeight: 500 }}>
                            Date of Birth
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                                value={dobDay}
                                onChange={(e) => setDobDay(e.target.value)}
                                required
                                disabled={isFetching}
                                style={{
                                    flex: 1,
                                    background: '#0D1117',
                                    border: '1px solid #21262D',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    color: 'white',
                                    outline: 'none',
                                    cursor: isFetching ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="" disabled>Day</option>
                                {days.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select
                                value={dobMonth}
                                onChange={(e) => setDobMonth(e.target.value)}
                                required
                                disabled={isFetching}
                                style={{
                                    flex: 2,
                                    background: '#0D1117',
                                    border: '1px solid #21262D',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    color: 'white',
                                    outline: 'none',
                                    cursor: isFetching ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="" disabled>Month</option>
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>

                            <select
                                value={dobYear}
                                onChange={(e) => setDobYear(e.target.value)}
                                required
                                disabled={isFetching}
                                style={{
                                    flex: 1.5,
                                    background: '#0D1117',
                                    border: '1px solid #21262D',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    color: 'white',
                                    outline: 'none',
                                    cursor: isFetching ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="" disabled>Year</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {fetchError && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                        }}>
                            <Shield size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{fetchError}</span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '24px',
                        color: '#8B949E',
                        fontSize: '0.75rem'
                    }}>
                        <Lock size={12} />
                        <span>Your credentials are used only for this fetch request and are not stored.</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isFetching}
                            style={{
                                background: 'transparent',
                                border: '1px solid #30363D',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                color: '#C9D1D9',
                                fontWeight: 500,
                                cursor: isFetching ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isFetching}
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 24px',
                                color: 'white',
                                fontWeight: 500,
                                cursor: isFetching ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                opacity: isFetching ? 0.7 : 1
                            }}
                        >
                            {isFetching ? <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {isFetching ? 'Fetching...' : 'Fetch Result'}
                        </button>
                    </div>
                </form>
            </div>
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

export default FetchOfficialResultModal;
