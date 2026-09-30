import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import {
    Monitor, Smartphone, Tablet, Loader2,
    MapPin, Globe, Clock, CheckCircle2, RefreshCw
} from 'lucide-react';
import { accountAPI } from '../../../services/api';

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────────────────── */
const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const timeStr = format(date, 'h:mm a');
        if (isToday(date)) return `Today, ${timeStr}`;
        if (isYesterday(date)) return `Yesterday, ${timeStr}`;
        return `${format(date, 'dd MMM yyyy')}, ${timeStr}`;
    } catch {
        return String(dateStr);
    }
};

const getDeviceIcon = (deviceType) => {
    const type = String(deviceType || '').toLowerCase();
    if (type === 'mobile') return Smartphone;
    if (type === 'tablet') return Tablet;
    return Monitor;
};

const getDuration = (loginTime, logoutTime) => {
    if (!loginTime) return null;
    const end = logoutTime ? new Date(logoutTime) : new Date();
    const mins = differenceInMinutes(end, new Date(loginTime));
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

/* ──────────────────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────────────────── */
const AccountLoginHistorySection = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLoginHistory = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            const res = await accountAPI.getSessions();
            setSessions(res.data?.sessions || []);
        } catch (err) {
            console.error('Failed to load login history:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLoginHistory();
    }, []);

    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2
                        style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 600, margin: 0 }}
                        className="text-[#111827] dark:text-[#F3F4F6]"
                    >
                        Login History
                    </h2>
                    <span
                        style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 400 }}
                        className="text-[#4B5563] dark:text-[#A1A1AA]"
                    >
                        Chronological record of all sign-in events across devices
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => fetchLoginHistory(true)}
                    disabled={refreshing || loading}
                    className="h-8 px-3 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#1B1F26] text-[#374151] dark:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#292E37] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            {!loading && sessions.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: 'Total Sessions',
                            value: sessions.length,
                            icon: Clock,
                        },
                        {
                            label: 'Current Session',
                            value: sessions.filter(s => s.isCurrent).length ? 'Active' : '—',
                            icon: CheckCircle2,
                            accent: true,
                        },
                        {
                            label: 'Devices Used',
                            value: [...new Set(sessions.map(s => s.deviceType || 'Desktop'))].length,
                            icon: Monitor,
                        },
                    ].map(({ label, value, icon: Icon, accent }) => (
                        <div
                            key={label}
                            className="rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] p-4 flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-1.5">
                                <Icon
                                    size={14}
                                    className={accent
                                        ? 'text-[#16A34A]'
                                        : 'text-[#6B7280] dark:text-[#71717A]'}
                                />
                                <span
                                    style={{ fontSize: '12px', fontWeight: 500 }}
                                    className="text-[#6B7280] dark:text-[#71717A]"
                                >
                                    {label}
                                </span>
                            </div>
                            <span
                                style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 700 }}
                                className={accent
                                    ? 'text-[#16A34A]'
                                    : 'text-[#111827] dark:text-[#F3F4F6]'}
                            >
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Session Log Table Card */}
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] overflow-hidden">
                {/* Card Header */}
                <div
                    className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]"
                >
                    <span
                        style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 600 }}
                        className="text-[#111827] dark:text-[#F3F4F6]"
                    >
                        Session Log
                    </span>
                    {!loading && sessions.length > 0 && (
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#292E37] border border-[#E5E7EB] dark:border-[#292E37]"
                            style={{ fontSize: '12px', fontWeight: 500 }}
                        >
                            <span className="text-[#6B7280] dark:text-[#71717A]">{sessions.length} entries</span>
                        </span>
                    )}
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex items-center justify-center gap-2.5 py-16 text-[#6B7280] dark:text-[#71717A]">
                        <Loader2 size={18} className="animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
                        <span style={{ fontSize: '14px', fontWeight: 400 }}>Loading session history...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-16 text-center">
                        <Clock size={32} className="mx-auto mb-3 text-[#D1D5DB] dark:text-[#292E37]" />
                        <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }} className="text-[#6B7280] dark:text-[#71717A]">
                            No session records found
                        </p>
                        <p style={{ fontSize: '13px', fontWeight: 400, margin: '4px 0 0' }} className="text-[#9CA3AF] dark:text-[#71717A]">
                            Your login history will appear here once sessions are recorded.
                        </p>
                    </div>
                ) : (
                    /* Table */
                    <div className="overflow-x-auto">
                        {/* Table header */}
                        <div
                            className="grid gap-0 border-b border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] px-5"
                            style={{
                                gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 80px',
                                minWidth: '600px'
                            }}
                        >
                            {['Device / Browser', 'IP Address', 'Location', 'Signed In', 'Duration'].map((col) => (
                                <div
                                    key={col}
                                    className="py-2.5"
                                    style={{ fontSize: '12px', fontWeight: 500 }}
                                >
                                    <span className="text-[#6B7280] dark:text-[#71717A] uppercase tracking-wider">
                                        {col}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Table rows */}
                        {sessions.map((session, idx) => {
                            const isCurrent = Boolean(session.isCurrent);
                            const DeviceIcon = getDeviceIcon(session.deviceType);
                            const duration = getDuration(
                                session.loginTime || session.createdAt,
                                session.logoutTime
                            );
                            const isLast = idx === sessions.length - 1;

                            return (
                                <div
                                    key={session.id || idx}
                                    className={`grid gap-0 px-5 transition-colors
                                        ${isCurrent
                                            ? 'bg-[#EFF6FF] dark:bg-[#2563EB]/8'
                                            : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26]'}
                                        ${!isLast ? 'border-b border-[#E5E7EB] dark:border-[#292E37]' : ''}
                                    `}
                                    style={{
                                        gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 80px',
                                        minWidth: '600px',
                                    }}
                                >
                                    {/* Device + Browser */}
                                    <div className="py-3.5 flex items-center gap-3 min-w-0">
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                                ${isCurrent
                                                    ? 'bg-[#DBEAFE] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#3B82F6]'
                                                    : 'bg-[#F8FAFC] dark:bg-[#1B1F26] text-[#6B7280] dark:text-[#71717A]'}
                                            `}
                                        >
                                            <DeviceIcon size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    style={{ fontSize: '13px', fontWeight: 600 }}
                                                    className="text-[#111827] dark:text-[#F3F4F6] truncate"
                                                >
                                                    {session.browser || 'Unknown Browser'}
                                                </span>
                                                {isCurrent && (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#16A34A]/15 border border-[#BBF7D0] dark:border-[#16A34A]/30 text-[#16A34A] shrink-0"
                                                        style={{ fontSize: '11px', fontWeight: 500 }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                style={{ fontSize: '12px', fontWeight: 400 }}
                                                className="text-[#6B7280] dark:text-[#71717A] block"
                                            >
                                                {session.operatingSystem || session.os || 'Unknown OS'}
                                                {session.deviceType ? ` · ${session.deviceType}` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* IP Address */}
                                    <div className="py-3.5 flex items-center">
                                        <div className="flex items-center gap-1.5">
                                            <Globe size={12} className="text-[#9CA3AF] dark:text-[#71717A] shrink-0" />
                                            <span
                                                style={{ fontSize: '13px', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}
                                                className="text-[#4B5563] dark:text-[#A1A1AA] font-mono"
                                            >
                                                {session.ipAddress || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="py-3.5 flex items-center">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={12} className="text-[#9CA3AF] dark:text-[#71717A] shrink-0" />
                                            <span
                                                style={{ fontSize: '13px', fontWeight: 400 }}
                                                className="text-[#4B5563] dark:text-[#A1A1AA] truncate"
                                            >
                                                {session.location || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Signed In Time */}
                                    <div className="py-3.5 flex items-center">
                                        <span
                                            style={{ fontSize: '12px', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}
                                            className="text-[#6B7280] dark:text-[#71717A]"
                                        >
                                            {formatTimestamp(session.loginTime || session.createdAt)}
                                        </span>
                                    </div>

                                    {/* Duration */}
                                    <div className="py-3.5 flex items-center">
                                        {isCurrent ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#2563EB]/15 border border-[#BFDBFE] dark:border-[#2563EB]/30 text-[#2563EB] dark:text-[#3B82F6]"
                                                style={{ fontSize: '11px', fontWeight: 500 }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] animate-pulse inline-block" />
                                                Live
                                            </span>
                                        ) : (
                                            <span
                                                style={{ fontSize: '12px', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}
                                                className="text-[#6B7280] dark:text-[#71717A]"
                                            >
                                                {duration || '—'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer note */}
                {!loading && sessions.length > 0 && (
                    <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]">
                        <span
                            style={{ fontSize: '12px', fontWeight: 400 }}
                            className="text-[#9CA3AF] dark:text-[#71717A]"
                        >
                            Showing all recorded sessions for your account. Sessions are logged automatically on each sign-in.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountLoginHistorySection;
