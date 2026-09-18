import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, Camera, Loader2, ExternalLink } from 'lucide-react';
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
                if (isMounted) {
                    setError('Unable to load account summary.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSummary();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                gap: '12px',
                color: 'rgba(148, 163, 184, 0.5)'
            }}>
                <Loader2 className="animate-spin" size={24} color="#a78bfa" />
                <span style={{ fontSize: '12.5px', fontWeight: 500 }}>Loading account summary...</span>
            </div>
        );
    }

    const account = data?.account || {
        name: user?.name || 'Student',
        username: user?.username || user?.usn || 'student',
        email: user?.email || '',
        phone: user?.phone || '',
        studentId: user?.usn || 'Not Provided',
        college: user?.college || user?.collegeName || 'Siddaganga Institute of Technology',
        scheme: user?.scheme?.name || user?.scheme || '2025 Scheme',
        branch: user?.branch?.name || user?.currentBranch || user?.branch || 'Computer Science and Engineering',
        graduationYear: user?.graduationYear || '2030',
        createdAt: user?.createdAt || new Date(),
        status: 'Active',
        authProvider: user?.googleId ? 'Google' : 'Email & Password'
    };

    const plan = data?.plan || {
        name: user?.access?.plan === 'PLUS' ? 'AskUrSenior Plus' : 'Free Plan',
        status: 'Active',
        validUntil: null,
        purchaseDate: null
    };

    const purchaseHistory = data?.purchaseHistory || [];

    const formattedDate = (d) => {
        if (!d) return '—';
        try {
            return format(new Date(d), 'dd MMM yyyy');
        } catch (e) {
            return String(d);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || '?';

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section Header */}
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Basic Information
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                    Manage your personal and academic profile identity
                </span>
            </div>

            {/* ── Card 1: Profile Photo ─────────────────────────────── */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Profile Photo
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Circular Avatar Container */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        border: '2px solid rgba(139,92,246,0.35)',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.12))',
                        color: '#c4b5fd',
                        fontSize: '22px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        {user?.profilePicture ? (
                            <img 
                                src={getProfilePicUrl(user.profilePicture)} 
                                alt={user.name || 'User'} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/profile/edit/basic')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 14px',
                                    borderRadius: '6px',
                                    background: 'rgba(124, 58, 237, 0.15)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#c4b5fd',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <Camera size={13} />
                                <span>Upload Photo</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/profile/edit/basic')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 14px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#fca5a5',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <span>Remove</span>
                            </button>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>
                            JPG, PNG or WEBP. Max size 2MB.
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Card 2: Personal Information ──────────────────────── */}
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
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 -4px 0' }}>
                    Personal Information
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                }}>
                    {/* Full Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Full Name *
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.name || 'Student'}
                        </div>
                    </div>

                    {/* Username */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Username *
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.username || 'Not set'}
                        </div>
                    </div>

                    {/* Email Address */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Email Address
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.email || '—'}
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Phone Number
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.phone || '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Card 3: Academic Information ──────────────────────── */}
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
                        Academic Information
                    </h3>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)' }}>
                        Authoritative institutional records managed by college administration (read-only).
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    {/* College */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                                College
                            </label>
                            <Lock size={12} style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                        </div>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {account.college}
                        </div>
                    </div>

                    {/* Scheme */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                                Scheme
                            </label>
                            <Lock size={12} style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                        </div>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.scheme}
                        </div>
                    </div>

                    {/* Graduation Year */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                                Graduation Year
                            </label>
                            <Lock size={12} style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                        </div>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {account.graduationYear}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Card 4: AskUrSenior Plan ───────────────────────────── */}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                            AskUrSenior Plan
                        </h3>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)' }}>
                            Current platform access and membership tier
                        </span>
                    </div>

                    {plan.name === 'AskUrSenior Plus' ? (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(124, 58, 237, 0.15)',
                            color: '#c4b5fd',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                            <Sparkles size={11} />
                            Plus Active
                        </span>
                    ) : (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'rgba(148, 163, 184, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Free Tier
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.6)', display: 'block' }}>
                            Membership
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px', display: 'block' }}>
                            {plan.name}
                        </span>
                    </div>

                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.6)', display: 'block' }}>
                            Validity
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px', display: 'block' }}>
                            {plan.name === 'AskUrSenior Plus' ? (plan.validUntil ? formattedDate(plan.validUntil) : 'Lifetime') : 'Ongoing'}
                        </span>
                    </div>

                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.6)', display: 'block' }}>
                            Purchased
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px', display: 'block' }}>
                            {plan.purchaseDate ? formattedDate(plan.purchaseDate) : formattedDate(account.createdAt)}
                        </span>
                    </div>
                </div>

                {plan.name !== 'AskUrSenior Plus' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/pricing')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 18px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
                            }}
                        >
                            <Sparkles size={14} />
                            <span>Upgrade to AskUrSenior Plus</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Card 5: Purchase History ──────────────────────────── */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Purchase History
                </h3>

                {purchaseHistory.length === 0 ? (
                    <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        fontSize: '12.5px',
                        color: 'rgba(148, 163, 184, 0.55)'
                    }}>
                        No payment transactions recorded for this account.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(148, 163, 184, 0.65)' }}>
                                    <th style={{ padding: '8px 12px' }}>Date</th>
                                    <th style={{ padding: '8px 12px' }}>Product</th>
                                    <th style={{ padding: '8px 12px' }}>Amount</th>
                                    <th style={{ padding: '8px 12px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseHistory.map((item, idx) => (
                                    <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ padding: '10px 12px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                            {formattedDate(item.date)}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 500 }}>
                                            {item.product}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>
                                            {item.currency === 'INR' ? '₹' : ''}{item.amount}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                color: '#34d399',
                                                border: '1px solid rgba(16, 185, 129, 0.2)'
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSummarySection;
