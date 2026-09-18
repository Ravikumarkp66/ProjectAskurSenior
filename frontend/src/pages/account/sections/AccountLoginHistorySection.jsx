import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Monitor, Smartphone, Tablet, Loader2, Globe, Clock, Shield } from 'lucide-react';
import { accountAPI } from '../../../services/api';

const AccountLoginHistorySection = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoginHistory = async () => {
            try {
                setLoading(true);
                const res = await accountAPI.getSessions();
                setSessions(res.data?.sessions || []);
            } catch (err) {
                console.error('Failed to load login history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginHistory();
    }, []);

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const timeStr = format(date, 'h:mm a');
            if (isToday(date)) return `Today · ${timeStr}`;
            if (isYesterday(date)) return `Yesterday · ${timeStr}`;
            return `${format(date, 'dd MMM yyyy')} · ${timeStr}`;
        } catch (e) {
            return String(dateStr);
        }
    };

    const getDeviceIcon = (deviceType) => {
        const type = String(deviceType).toLowerCase();
        if (type === 'mobile') return <Smartphone size={15} />;
        if (type === 'tablet') return <Tablet size={15} />;
        return <Monitor size={15} />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section Header */}
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Login History
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                    Review recent device sign-ins, IP addresses, and security activity
                </span>
            </div>

            {/* ── Card 1: Activity Timeline ─────────────────────────── */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                        Recent Sign-in Activity
                    </h3>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)' }}>
                        Chronological activity timeline of authentication events on your AskUrSenior account.
                    </span>
                </div>

                {loading ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '32px',
                        gap: '8px',
                        color: 'rgba(148, 163, 184, 0.5)'
                    }}>
                        <Loader2 size={16} className="animate-spin" color="#a78bfa" />
                        <span style={{ fontSize: '12px' }}>Loading activity timeline...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'rgba(148, 163, 184, 0.55)'
                    }}>
                        No recent login events recorded.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sessions.map((session, idx) => {
                            const isCurrent = Boolean(session.isCurrent);
                            return (
                                <div
                                    key={session.id || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        background: isCurrent ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                        border: isCurrent ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: isCurrent ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                            border: isCurrent ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: isCurrent ? '#a78bfa' : 'rgba(148, 163, 184, 0.7)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {getDeviceIcon(session.deviceType)}
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                                    {session.browser} · {session.operatingSystem}
                                                </span>
                                                {isCurrent && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        background: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#34d399',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)'
                                                    }}>
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', display: 'block', marginTop: '2px' }}>
                                                {session.ipAddress || '103.246.xx.xx'} · {session.location || 'Bangalore, India'}
                                            </span>
                                        </div>
                                    </div>

                                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)', whiteSpace: 'nowrap' }}>
                                        {formatTimestamp(session.loginTime || session.createdAt)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountLoginHistorySection;
