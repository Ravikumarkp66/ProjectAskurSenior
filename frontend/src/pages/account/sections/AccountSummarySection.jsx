import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Sparkles, Loader2, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { accountAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AccountSummarySection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const res = await accountAPI.getSummary();
                if (isMounted) {
                    setData(res.data);
                    setError(null);
                }
            } catch (err) {
                console.error('Failed to load account summary:', err);
                if (isMounted) setError('Unable to load account summary.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSummary();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-400 dark:text-slate-500">
                <Loader2 className="animate-spin text-[#2563EB] dark:text-[#3B82F6]" size={22} />
                <span className="text-sm font-medium">Loading plan details...</span>
            </div>
        );
    }

    const account = data?.account || {
        createdAt: user?.createdAt || new Date(),
    };

    const plan = data?.plan || {
        name: user?.access?.plan === 'PLUS' ? 'AskUrSenior Plus' : 'Free Plan',
        status: 'Active',
        validUntil: null,
        purchaseDate: null
    };

    const isPlus = plan.name === 'AskUrSenior Plus';

    const formattedDate = (d) => {
        if (!d) return '—';
        try {
            return format(new Date(d), 'dd MMM yyyy');
        } catch {
            return String(d);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex flex-col gap-1">
                <h2 style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 600, margin: 0 }}
                    className="text-[#111827] dark:text-[#F3F4F6]">
                    Plan &amp; Membership
                </h2>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 400 }}
                    className="text-[#4B5563] dark:text-[#A1A1AA]">
                    Your current AskUrSenior access tier and membership details
                </span>
                {error && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">{error}</span>
                )}
            </div>

            {/* Plan Card */}
            <div
                className="rounded-lg border bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37]"
                style={{ padding: '24px' }}
            >
                {/* Plan header row */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {isPlus && (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 border border-[#DBEAFE] dark:border-[#3B82F6]/30">
                                    <Sparkles size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                </span>
                            )}
                            <span style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 600 }}
                                className="text-[#111827] dark:text-[#F3F4F6]">
                                {plan.name}
                            </span>
                        </div>
                        <span style={{ fontSize: '13px', lineHeight: '20px', fontWeight: 400 }}
                            className="text-[#4B5563] dark:text-[#A1A1AA]">
                            {isPlus
                                ? 'You have full access to all AskUrSenior Plus features.'
                                : 'You are on the free tier. Upgrade to unlock premium features.'}
                        </span>
                    </div>

                    {isPlus ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] dark:bg-[#16A34A]/15 text-[#16A34A] border border-[#BBF7D0] dark:border-[#16A34A]/30"
                            style={{ fontSize: '12px', fontWeight: 500 }}>
                            <CheckCircle2 size={12} />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8FAFC] dark:bg-[#1B1F26] text-[#6B7280] border border-[#E5E7EB] dark:border-[#292E37]"
                            style={{ fontSize: '12px', fontWeight: 500 }}>
                            Free Tier
                        </span>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-[#E5E7EB] dark:border-[#292E37] mb-5" />

                {/* Plan meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                        <span style={{ fontSize: '12px', fontWeight: 500 }}
                            className="text-[#6B7280] dark:text-[#71717A] uppercase tracking-wider">
                            Membership
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}
                            className="text-[#111827] dark:text-[#F3F4F6]">
                            {plan.name}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span style={{ fontSize: '12px', fontWeight: 500 }}
                            className="text-[#6B7280] dark:text-[#71717A] uppercase tracking-wider">
                            Validity
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}
                            className="text-[#111827] dark:text-[#F3F4F6] flex items-center gap-1.5">
                            <Clock size={13} className="text-[#4B5563] dark:text-[#A1A1AA]" />
                            {isPlus
                                ? (plan.validUntil ? formattedDate(plan.validUntil) : 'Lifetime')
                                : 'Ongoing'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span style={{ fontSize: '12px', fontWeight: 500 }}
                            className="text-[#6B7280] dark:text-[#71717A] uppercase tracking-wider">
                            Member Since
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}
                            className="text-[#111827] dark:text-[#F3F4F6] flex items-center gap-1.5">
                            <CalendarDays size={13} className="text-[#4B5563] dark:text-[#A1A1AA]" />
                            {formattedDate(plan.purchaseDate || account.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Upgrade CTA */}
                {!isPlus && (
                    <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-[#292E37]">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span style={{ fontSize: '14px', fontWeight: 600 }}
                                    className="text-[#111827] dark:text-[#F3F4F6]">
                                    Unlock AskUrSenior Plus
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 400 }}
                                    className="text-[#4B5563] dark:text-[#A1A1AA]">
                                    Get access to AI tutoring, interview prep, and more.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/pricing')}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer shrink-0"
                                style={{ fontSize: '14px', fontWeight: 500 }}
                            >
                                <Sparkles size={15} />
                                <span>Upgrade to Plus</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSummarySection;
