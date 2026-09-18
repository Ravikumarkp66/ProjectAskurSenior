import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, LogOut, KeyRound, AlertTriangle, Loader2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { accountAPI, authAPI } from '../../../services/api';

const AccountSecuritySection = () => {
    const { user, logout } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [activeCount, setActiveCount] = useState(1);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [revoking, setRevoking] = useState(false);

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    const isGoogleAuth = Boolean(user?.googleId);

    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const res = await accountAPI.getSessions();
            setSessions(res.data?.sessions || []);
            setActiveCount(res.data?.activeCount || 1);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeOthers = async () => {
        try {
            setRevoking(true);
            const res = await accountAPI.revokeOtherSessions();
            toast.success(res.data?.message || 'Other sessions revoked');
            await fetchSessions();
        } catch (err) {
            console.error('Failed to revoke sessions:', err);
            toast.error('Failed to sign out other sessions');
        } finally {
            setRevoking(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error('Current password is required');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setChangingPassword(true);
            await authAPI.changePassword({ currentPassword, newPassword });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordChange(false);
        } catch (err) {
            console.error('Failed to update password:', err);
            const msg = err.response?.data?.error || 'Failed to update password';
            toast.error(msg);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        const expected = user?.email || 'DELETE';
        if (
            deleteConfirmationText.trim().toUpperCase() !== 'DELETE' &&
            deleteConfirmationText.trim().toLowerCase() !== expected.toLowerCase()
        ) {
            toast.error(`Please type DELETE or ${expected} to confirm`);
            return;
        }

        try {
            setDeleting(true);
            await accountAPI.deleteAccount(deleteConfirmationText.trim(), deletePassword);
            toast.success('Account permanently deleted');
            setShowDeleteModal(false);
            logout?.();
            window.location.href = '/';
        } catch (err) {
            console.error('Failed to delete account:', err);
            const msg = err.response?.data?.error || 'Failed to delete account';
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section Header */}
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Security & Authentication
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                    Manage your connected credentials, active devices, and account integrity
                </span>
            </div>

            {/* ── Card 1: Authentication Credentials ───────────────── */}
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
                            Authentication Method
                        </h3>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)' }}>
                            Configure your password and login credentials
                        </span>
                    </div>

                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <CheckCircle2 size={12} />
                        Verified & Protected
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Login Provider
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {isGoogleAuth ? 'Google Single Sign-On (OAuth)' : 'Email & Password'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                            Primary Email
                        </label>
                        <div style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px'
                        }}>
                            {user?.email}
                        </div>
                    </div>
                </div>

                {!isGoogleAuth && (
                    <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    Password Management
                                </span>
                                <p style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', margin: '2px 0 0' }}>
                                    Change your password regularly to keep your student account secure.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPasswordChange(prev => !prev)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    background: 'rgba(124, 58, 237, 0.12)',
                                    color: '#c4b5fd',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {showPasswordChange ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showPasswordChange && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleChangePassword}
                                    style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.01)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '14px'
                                    }}
                                >
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)' }}>
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)' }}>
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)' }}>
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            style={{
                                                padding: '8px 18px',
                                                borderRadius: '6px',
                                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {changingPassword && <Loader2 size={13} className="animate-spin" />}
                                            <span>Save Password</span>
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Card 2: Active Sessions ───────────────────────────── */}
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
                            Active Sessions ({activeCount})
                        </h3>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)' }}>
                            Devices and browsers currently logged into your account
                        </span>
                    </div>

                    {activeCount > 1 && (
                        <button
                            type="button"
                            onClick={handleRevokeOthers}
                            disabled={revoking}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#fca5a5',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {revoking ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                            <span>Sign out other sessions</span>
                        </button>
                    )}
                </div>

                {loadingSessions ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px', color: 'rgba(148, 163, 184, 0.5)' }}>
                        <Loader2 size={16} className="animate-spin" color="#a78bfa" />
                        <span style={{ fontSize: '12px' }}>Loading sessions...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                        No session logs available.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sessions.slice(0, 3).map((s) => (
                            <div
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(124, 58, 237, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.25)',
                                        color: '#c4b5fd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {s.deviceType === 'Mobile' ? <Smartphone size={15} /> : <Monitor size={15} />}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                                {s.browser} · {s.operatingSystem}
                                            </span>
                                            {s.isCurrent && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                    color: '#34d399',
                                                    border: '1px solid rgba(16, 185, 129, 0.25)'
                                                }}>
                                                    Current session
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', display: 'block', marginTop: '2px' }}>
                                            {s.location} · {new Date(s.loginTime).toLocaleDateString()} at {new Date(s.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Card 3: Danger Zone ───────────────────────────────── */}
            <div style={{
                background: 'rgba(239, 68, 68, 0.02)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="#ef4444" />
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', margin: 0 }}>
                            Delete Account
                        </h3>
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.65)' }}>
                        Permanently remove your student account, course registrations, and academic records. This action is irreversible.
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Delete Account
                </button>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(8px)'
                            }}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 6 }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '440px',
                                borderRadius: '16px',
                                background: '#0D101A',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '24px',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={18} color="#ef4444" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                        Permanently Delete Account?
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(148, 163, 184, 0.6)', cursor: 'pointer' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', margin: 0, lineHeight: 1.5 }}>
                                This action is permanent and cannot be undone. To confirm, type <strong style={{ color: '#ef4444' }}>DELETE</strong> below.
                            </p>

                            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Type DELETE"
                                    value={deleteConfirmationText}
                                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                    required
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                        fontSize: '13px',
                                        outline: 'none'
                                    }}
                                />

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={deleting}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            background: '#ef4444',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {deleting ? 'Deleting...' : 'Confirm Deletion'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountSecuritySection;
