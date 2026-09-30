import React, { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { accountAPI, authAPI } from '../../../services/api';

const AccountSecuritySection = () => {
    const { user, logout } = useAuth();

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const isGoogleAuth = Boolean(user?.googleId);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) { toast.error('Current password is required'); return; }
        if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }

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
            toast.error(err.response?.data?.error || 'Failed to update password');
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
            toast.error('Confirmation text does not match');
            return;
        }
        try {
            setDeleting(true);
            await accountAPI.deleteAccount();
            toast.success('Account deleted successfully');
            logout();
        } catch (err) {
            console.error('Failed to delete account:', err);
            toast.error(err.response?.data?.error || 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex flex-col gap-1">
                <h2
                    style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 600, margin: 0 }}
                    className="text-[#111827] dark:text-[#F3F4F6]"
                >
                    Security &amp; Credentials
                </h2>
                <span
                    style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 400 }}
                    className="text-[#4B5563] dark:text-[#A1A1AA]"
                >
                    Manage your authentication method and account security settings
                </span>
            </div>

            {/* ── Card 1: Authentication Credentials ─────────────────────── */}
            <div
                className="rounded-lg border bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37]"
                style={{ padding: '20px 24px' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                    <div className="flex flex-col gap-0.5">
                        <span
                            style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 600 }}
                            className="text-[#111827] dark:text-[#F3F4F6]"
                        >
                            Authentication Method
                        </span>
                        <span
                            style={{ fontSize: '13px', lineHeight: '20px', fontWeight: 400 }}
                            className="text-[#4B5563] dark:text-[#A1A1AA]"
                        >
                            Your current sign-in provider and login credentials
                        </span>
                    </div>
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-[#DCFCE7] dark:bg-[#16A34A]/15 text-[#16A34A] border-[#BBF7D0] dark:border-[#16A34A]/30"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                    >
                        <CheckCircle2 size={12} />
                        Verified &amp; Protected
                    </span>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="flex flex-col gap-1.5">
                        <label
                            style={{ fontSize: '12px', fontWeight: 500 }}
                            className="text-[#4B5563] dark:text-[#A1A1AA]"
                        >
                            Login Provider
                        </label>
                        <div
                            className="h-10 px-3 flex items-center rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]"
                            style={{ fontSize: '14px', fontWeight: 400 }}
                        >
                            <span className="text-[#111827] dark:text-[#F3F4F6]">
                                {isGoogleAuth ? 'Google Single Sign-On (OAuth)' : 'Email & Password'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            style={{ fontSize: '12px', fontWeight: 500 }}
                            className="text-[#4B5563] dark:text-[#A1A1AA]"
                        >
                            Primary Email
                        </label>
                        <div
                            className="h-10 px-3 flex items-center rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]"
                            style={{ fontSize: '14px', fontWeight: 400 }}
                        >
                            <span className="text-[#111827] dark:text-[#F3F4F6]">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Password Management */}
                {!isGoogleAuth && (
                    <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#292E37]">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span
                                    style={{ fontSize: '14px', fontWeight: 600 }}
                                    className="text-[#111827] dark:text-[#F3F4F6]"
                                >
                                    Password Management
                                </span>
                                <span
                                    style={{ fontSize: '13px', fontWeight: 400 }}
                                    className="text-[#4B5563] dark:text-[#A1A1AA]"
                                >
                                    Change your password regularly to keep your account secure.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPasswordChange(prev => !prev)}
                                className="h-8 px-3 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#1B1F26] text-[#374151] dark:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#292E37] transition-colors cursor-pointer"
                                style={{ fontSize: '13px', fontWeight: 500 }}
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
                                    transition={{ duration: 0.18 }}
                                    onSubmit={handleChangePassword}
                                    className="mt-4 overflow-hidden"
                                >
                                    <div className="rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] p-4 flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* Current Password */}
                                            <div className="flex flex-col gap-1.5">
                                                <label
                                                    style={{ fontSize: '12px', fontWeight: 500 }}
                                                    className="text-[#4B5563] dark:text-[#A1A1AA]"
                                                >
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPw ? 'text' : 'password'}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        required
                                                        className="w-full h-10 pl-3 pr-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#15181D] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] transition-colors"
                                                        style={{ fontSize: '14px', fontWeight: 400 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPw(v => !v)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#A1A1AA] transition-colors cursor-pointer"
                                                    >
                                                        {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div className="flex flex-col gap-1.5">
                                                <label
                                                    style={{ fontSize: '12px', fontWeight: 500 }}
                                                    className="text-[#4B5563] dark:text-[#A1A1AA]"
                                                >
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPw ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        required
                                                        className="w-full h-10 pl-3 pr-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#15181D] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] transition-colors"
                                                        style={{ fontSize: '14px', fontWeight: 400 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPw(v => !v)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#A1A1AA] transition-colors cursor-pointer"
                                                    >
                                                        {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div className="flex flex-col gap-1.5">
                                                <label
                                                    style={{ fontSize: '12px', fontWeight: 500 }}
                                                    className="text-[#4B5563] dark:text-[#A1A1AA]"
                                                >
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPw ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        className="w-full h-10 pl-3 pr-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#15181D] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] transition-colors"
                                                        style={{ fontSize: '14px', fontWeight: 400 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPw(v => !v)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-[#A1A1AA] transition-colors cursor-pointer"
                                                    >
                                                        {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={changingPassword}
                                                className="h-10 px-4 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                                                style={{ fontSize: '14px', fontWeight: 500 }}
                                            >
                                                {changingPassword && <Loader2 size={14} className="animate-spin" />}
                                                Save Password
                                            </button>
                                        </div>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Card 2: Danger Zone ──────────────────────────────────────── */}
            <div
                className="rounded-lg border border-[#DC2626]/30 dark:border-[#DC2626]/25 bg-[#FFF5F5] dark:bg-[#DC2626]/5"
                style={{ padding: '20px 24px' }}
            >
                <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-[#DC2626]" />
                            <span
                                style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 600 }}
                                className="text-[#DC2626]"
                            >
                                Delete Account
                            </span>
                        </div>
                        <span
                            style={{ fontSize: '13px', lineHeight: '20px', fontWeight: 400 }}
                            className="text-[#DC2626]/80 dark:text-[#DC2626]/70"
                        >
                            Permanently remove your student account, registrations, and academic records. This action is irreversible.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="h-10 px-4 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors cursor-pointer shrink-0"
                        style={{ fontSize: '14px', fontWeight: 500 }}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="fixed inset-0 bg-black/50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 6 }}
                            transition={{ duration: 0.15 }}
                            className="relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] p-6 z-10 flex flex-col gap-4"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-[#DC2626]" />
                                    <span
                                        style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 600 }}
                                        className="text-[#111827] dark:text-[#F3F4F6]"
                                    >
                                        Delete Account?
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p
                                style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 400 }}
                                className="text-[#4B5563] dark:text-[#A1A1AA] m-0"
                            >
                                This action is permanent and cannot be undone. To confirm, type{' '}
                                <strong className="text-[#DC2626] font-semibold">DELETE</strong> below.
                            </p>

                            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Type DELETE to confirm"
                                    value={deleteConfirmationText}
                                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                    required
                                    className="w-full h-10 px-3 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#DC2626] transition-colors"
                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="h-10 px-4 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#1B1F26] text-[#374151] dark:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#292E37] transition-colors cursor-pointer"
                                        style={{ fontSize: '14px', fontWeight: 500 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={deleting}
                                        className="h-10 px-4 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors cursor-pointer disabled:opacity-50"
                                        style={{ fontSize: '14px', fontWeight: 500 }}
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
