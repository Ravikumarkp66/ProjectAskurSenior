import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../utils/hooks';
import { apiV2 } from '../../../../services/authService';
import { apiClient } from '../../../../services/api';
import SectionChangeModal from '../../../../modules/profile/components/SectionChangeModal';
import { Lock, AlertCircle, CheckCircle2, Send, RefreshCw, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const lockedInputClass = "w-full px-3 py-2 rounded-lg text-sm bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none box-border";
const editableInputClass = "w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border";
const selectClass = "w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-[#18191C] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none cursor-pointer box-border";
const labelClass = "text-xs font-semibold text-slate-700 dark:text-slate-300 m-0";

const inputStyle = {};
const selectStyle = {};
const labelStyle = {};

const AcademicIdentityCard = () => {
    const { user, updateUser } = useAuth();

    // Authoritative Academic Context
    const [academicData, setAcademicData] = useState(null);
    const [loadingAcademic, setLoadingAcademic] = useState(true);

    // Section & Lab Batch State
    const [availableSections, setAvailableSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedLabBatch, setSelectedLabBatch] = useState('B1');
    const [savingPlacement, setSavingPlacement] = useState(false);

    // Section Change Modal
    const [showSectionModal, setShowSectionModal] = useState(false);

    // USN Edit inline state
    const isUsnLocked = !!user?.usnLocked || (user?.usnVerified && user?.usnType === 'PERMANENT');
    const [isEditingUsn, setIsEditingUsn] = useState(false);
    const [usnInput, setUsnInput] = useState('');
    const [usnMode, setUsnMode] = useState('PERMANENT'); // 'TEMPORARY' | 'PERMANENT'
    const [otpStep, setOtpStep] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [savingTemp, setSavingTemp] = useState(false);
    const [targetEmail, setTargetEmail] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Daily OTP limit tracking
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyRequests = user?.usnOtpDailyRequests?.date === todayStr
        ? (user.usnOtpDailyRequests.count || 0)
        : 0;
    const [dailyLimitReached, setDailyLimitReached] = useState(dailyRequests >= 3);
    const [remainingDailyRequests, setRemainingDailyRequests] = useState(Math.max(0, 3 - dailyRequests));

    useEffect(() => {
        if (user?.usn) {
            setUsnInput(user.usn);
        }
    }, [user?.usn]);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        const count = user?.usnOtpDailyRequests?.date === today ? (user.usnOtpDailyRequests.count || 0) : 0;
        setDailyLimitReached(count >= 3);
        setRemainingDailyRequests(Math.max(0, 3 - count));
    }, [user?.usnOtpDailyRequests]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const fetchAcademicData = async () => {
        try {
            setLoadingAcademic(true);
            const [overviewRes, sectionsRes] = await Promise.allSettled([
                apiV2.getStudentAcademicsOverview(),
                apiClient.get('/student/academics/sections')
            ]);

            let overview = null;
            if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
                overview = overviewRes.value.data.data;
                setAcademicData(overview);
            }

            if (sectionsRes.status === 'fulfilled' && sectionsRes.value.data?.success) {
                const secs = sectionsRes.value.data.data?.sections || [];
                setAvailableSections(secs);
                if (secs.length > 0) {
                    const currentId = overview?.section?.id || user?.academicSection?._id || user?.academicSection;
                    const matched = secs.find(s => String(s.id) === String(currentId));
                    if (matched) {
                        setSelectedSectionId(matched.id);
                    }
                }
            }

            if (overview?.student?.labBatch || user?.labBatch) {
                setSelectedLabBatch(overview?.student?.labBatch || user?.labBatch || 'B1');
            }
        } catch (err) {
            console.error('[AcademicIdentityCard] Error fetching academic data:', err);
        } finally {
            setLoadingAcademic(false);
        }
    };

    useEffect(() => {
        fetchAcademicData();
    }, []);

    // Derived fields
    const branchName = (typeof user?.branch === 'object' ? (user.branch?.shortName || user.branch?.name) : user?.branch) || academicData?.branch?.shortName || academicData?.branch?.name || 'ISE';
    const isSemesterUnconfigured = academicData?.student?.semesterUnconfigured || (!academicData?.student?.currentSemester && !user?.semester);
    const semesterDisplay = isSemesterUnconfigured
        ? 'Current semester has not been configured yet.'
        : `Semester ${academicData?.student?.currentSemester || user?.semester || 1}`;
    
    const isSectionLocked = Boolean(
        academicData?.student?.sectionLocked || 
        academicData?.academicOnboarding?.sectionLocked || 
        user?.sectionLocked
    );

    const sectionName = academicData?.student?.section || academicData?.section?.name || (typeof user?.academicSection === 'object' ? user.academicSection?.name : user?.section) || '';
    const labBatch = academicData?.student?.labBatch || user?.labBatch || null;

    // Derived college email domain for permanent USN
    const collegeDomain = user?.college?.emailDomain || 'sit.ac.in';
    const cleanUsnInput = (usnInput || '').trim().toUpperCase();
    const derivedEmailPreview = cleanUsnInput ? `${cleanUsnInput.toLowerCase()}@${collegeDomain}` : `usn@${collegeDomain}`;

    const handleStartEditUsn = () => {
        setUsnInput(user?.usn || '');
        setUsnMode(user?.usnType === 'PERMANENT' ? 'PERMANENT' : 'TEMPORARY');
        setOtpStep(false);
        setOtpInput('');
        setIsEditingUsn(true);
    };

    const handleCancelEditUsn = () => {
        setIsEditingUsn(false);
        setOtpStep(false);
        setOtpInput('');
        setUsnInput(user?.usn || '');
    };

    const handleSaveTemporaryUsn = async () => {
        if (!cleanUsnInput) {
            toast.error('Please enter a valid USN.');
            return;
        }
        setSavingTemp(true);
        try {
            const res = await apiV2.setTemporaryUsn(cleanUsnInput);
            if (res.data?.success && res.data?.data?.student) {
                updateUser(res.data.data.student);
                toast.success('Temporary USN updated successfully.');
                setIsEditingUsn(false);
                fetchAcademicData();
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to set temporary USN';
            toast.error(msg);
        } finally {
            setSavingTemp(false);
        }
    };

    const handleSendOtp = async () => {
        if (!cleanUsnInput) {
            toast.error('Please enter a valid USN first.');
            return;
        }
        if (dailyLimitReached) {
            toast.error('Daily limit reached. You can request up to 3 OTPs per day. Try again tomorrow.');
            return;
        }
        setSendingOtp(true);
        try {
            const res = await apiV2.sendUsnOtp(cleanUsnInput);
            if (res.data?.success) {
                toast.success(res.data.message || 'Verification OTP sent to your institutional email.');
                setTargetEmail(res.data.targetEmail || derivedEmailPreview);
                setOtpStep(true);
                setResendCooldown(60);
                if (typeof res.data.remainingRequests === 'number') {
                    setRemainingDailyRequests(res.data.remainingRequests);
                    setDailyLimitReached(res.data.remainingRequests <= 0);
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
            toast.error(msg);
            if (err.response?.data?.dailyLimitReached) {
                setDailyLimitReached(true);
                setRemainingDailyRequests(0);
            }
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        const cleanOtp = (otpInput || '').trim();
        if (cleanOtp.length !== 6) {
            toast.error('Please enter the 6-digit OTP code.');
            return;
        }
        setVerifyingOtp(true);
        try {
            const res = await apiV2.verifyUsnOtp(cleanUsnInput, cleanOtp);
            if (res.data?.success && res.data?.data?.student) {
                updateUser(res.data.data.student);
                toast.success('USN verified and permanently locked!');
                setIsEditingUsn(false);
                setOtpStep(false);
                fetchAcademicData();
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP';
            toast.error(msg);
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Save Class Section & Lab Batch Placement
    const handleConfirmPlacement = async () => {
        if (!selectedSectionId) {
            toast.error('Please select your assigned Class Section');
            return;
        }
        if (!selectedLabBatch) {
            toast.error('Please select your assigned Lab Batch');
            return;
        }

        setSavingPlacement(true);
        try {
            const res = await apiClient.post('/student/academics/placement/confirm', {
                sectionId: selectedSectionId,
                labBatch: selectedLabBatch
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Academic placement confirmed and locked!');
                if (res.data.data?.student) {
                    updateUser(res.data.data.student);
                }
                await fetchAcademicData();
            } else {
                toast.error(res.data?.error || 'Failed to confirm placement');
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to confirm placement';
            toast.error(msg);
        } finally {
            setSavingPlacement(false);
        }
    };

    return (
        <div id="academic-identity" className="rounded-xl border p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-4 box-border">
            {/* Bold Heading only */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Academic Identity
            </h3>

            {/* USN Card */}
            <div className="rounded-xl border p-4 bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] flex flex-col gap-2.5">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            University Seat Number (USN)
                        </span>
                        {user?.usnVerified && user?.usnType === 'PERMANENT' ? (
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <CheckCircle2 size={11} /> Permanent · Verified
                            </span>
                        ) : (
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <AlertCircle size={11} /> Temporary · Not Verified
                            </span>
                        )}
                    </div>

                    {!isUsnLocked && !isEditingUsn && (
                        <button
                            type="button"
                            onClick={handleStartEditUsn}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-semibold cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        >
                            <Edit2 size={11} /> Edit
                        </button>
                    )}
                </div>

                {!isEditingUsn ? (
                    <div>
                        <div className="text-base font-bold tracking-wider text-slate-900 dark:text-white">
                            {user?.usn || <span className="text-slate-400 dark:text-slate-500 italic font-normal text-xs">Not Set</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                            {isUsnLocked 
                                ? 'Institutional verification complete. Permanent USN is locked.'
                                : 'Verify with your institutional email to lock your permanent USN and unlock automated academic records.'}
                        </p>
                    </div>
                ) : (
                    /* Inline USN Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                University Seat Number
                            </label>
                            <input
                                type="text"
                                value={usnInput}
                                onChange={(e) => setUsnInput(e.target.value.toUpperCase())}
                                placeholder="e.g. 1SI23IS080"
                                maxLength={10}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all font-semibold uppercase tracking-wider box-border"
                            />
                        </div>

                        {!otpStep && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label className={`flex-1 flex items-start gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                                        usnMode === 'TEMPORARY'
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="usnMode"
                                            value="TEMPORARY"
                                            checked={usnMode === 'TEMPORARY'}
                                            onChange={() => setUsnMode('TEMPORARY')}
                                            style={{ marginTop: '2px' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24' }}>
                                                Temporary USN
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Update immediately without email verification.
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`flex-1 flex items-start gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                                        usnMode === 'PERMANENT'
                                            ? 'bg-purple-500/15 border-purple-500/30'
                                            : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="usnMode"
                                            value="PERMANENT"
                                            checked={usnMode === 'PERMANENT'}
                                            onChange={() => setUsnMode('PERMANENT')}
                                            style={{ marginTop: '2px' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc' }}>
                                                Permanent (Verified)
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Verify via institutional email ({collegeDomain}).
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCancelEditUsn}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    {usnMode === 'TEMPORARY' ? (
                                        <button
                                            type="button"
                                            onClick={handleSaveTemporaryUsn}
                                            disabled={savingTemp || !cleanUsnInput}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#f59e0b',
                                                color: '#000',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                cursor: savingTemp || !cleanUsnInput ? 'not-allowed' : 'pointer',
                                                opacity: savingTemp || !cleanUsnInput ? 0.6 : 1
                                            }}
                                        >
                                            {savingTemp ? 'Saving...' : 'Save Temporary USN'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={sendingOtp || dailyLimitReached || !cleanUsnInput}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#8b5cf6',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                cursor: sendingOtp || dailyLimitReached || !cleanUsnInput ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Send size={12} />
                                            {sendingOtp ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {usnMode === 'PERMANENT' && otpStep && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="text-xs text-slate-800 dark:text-slate-200 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                    An OTP has been sent to: <strong className="text-emerald-600 dark:text-emerald-400">{targetEmail || derivedEmailPreview}</strong>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Enter 6-digit Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="w-full px-3 py-2 rounded-lg text-base tracking-widest text-center font-bold bg-white dark:bg-white/[0.03] border border-purple-400/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 box-border"
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || dailyLimitReached || resendCooldown > 0}
                                        style={{
                                            fontSize: '11px',
                                            color: dailyLimitReached || resendCooldown > 0 ? 'rgba(148, 163, 184, 0.4)' : '#a78bfa',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: dailyLimitReached || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <RefreshCw size={11} className={sendingOtp ? 'animate-spin' : ''} />
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                    </button>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setOtpStep(false)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyingOtp || otpInput.trim().length !== 6}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#10b981',
                                                color: '#000',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                cursor: verifyingOtp || otpInput.trim().length !== 6 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {verifyingOtp ? 'Verifying...' : 'Verify & Lock USN'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Form Grid matching AcademicInformationCard ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>
                            Branch
                        </label>
                        <span title="Branch record is locked" className="text-slate-400 dark:text-slate-500 flex items-center">
                            <Lock size={12} />
                        </span>
                    </div>
                    <input
                        type="text"
                        value={branchName}
                        readOnly
                        className={lockedInputClass}
                    />
                </div>

                {/* Semester */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>
                            Semester
                        </label>
                        <span title="Semester is auto-resolved from official academic schedule" className="text-slate-400 dark:text-slate-500 flex items-center">
                            <Lock size={12} />
                        </span>
                    </div>
                    <input
                        type="text"
                        value={semesterDisplay}
                        readOnly
                        className={lockedInputClass}
                    />
                </div>

                {/* ── Section Field ── */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>
                            Section
                        </label>
                        {isSectionLocked ? (
                            <button
                                type="button"
                                onClick={() => setShowSectionModal(true)}
                                className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 rounded-md px-2 py-0.5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                            >
                                Request Section Change
                            </button>
                        ) : null}
                    </div>

                    {loadingAcademic ? (
                        <input
                            type="text"
                            value="Loading sections..."
                            readOnly
                            className={lockedInputClass}
                        />
                    ) : isSectionLocked ? (
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={sectionName ? `Section ${sectionName}` : 'Section Not Assigned'}
                                readOnly
                                className={lockedInputClass}
                            />
                            <Lock size={12} className="absolute right-3 text-slate-400 dark:text-slate-500" />
                        </div>
                    ) : (
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            className={selectClass}
                        >
                            <option value="" disabled>Select Section</option>
                            {availableSections.map(sec => (
                                <option key={sec.id} value={sec.id} className="bg-white dark:bg-[#18191C] text-slate-900 dark:text-white">
                                    Section {sec.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ── Lab Batch Field ── */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>
                            {isSectionLocked ? 'Lab Batch' : 'Belong to any batch here? Select here!'}
                        </label>
                        {isSectionLocked && (
                            <span title="Lab batch locked with your section" className="text-slate-400 dark:text-slate-500 flex items-center">
                                <Lock size={12} />
                            </span>
                        )}
                    </div>

                    {loadingAcademic ? (
                        <input
                            type="text"
                            value="Loading batch..."
                            readOnly
                            className={lockedInputClass}
                        />
                    ) : isSectionLocked ? (
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={labBatch ? `Batch ${labBatch}` : 'Batch B1'}
                                readOnly
                                className={lockedInputClass}
                            />
                            <Lock size={12} className="absolute right-3 text-slate-400 dark:text-slate-500" />
                        </div>
                    ) : (
                        <select
                            value={selectedLabBatch}
                            onChange={(e) => setSelectedLabBatch(e.target.value)}
                            disabled={!selectedSectionId}
                            className={selectClass}
                        >
                            {!selectedSectionId ? (
                                <option value="">Select Section first</option>
                            ) : (
                                <>
                                    <option value="B1">Batch B1</option>
                                    <option value="B2">Batch B2</option>
                                </>
                            )}
                        </select>
                    )}
                </div>
            </div>

            {/* Unlocked Placement Save Button */}
            {!isSectionLocked && !loadingAcademic && (
                <div className="flex justify-end pt-1">
                    <button
                        type="button"
                        onClick={handleConfirmPlacement}
                        disabled={savingPlacement || !selectedSectionId}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 cursor-pointer disabled:opacity-50 transition-all"
                    >
                        {savingPlacement ? 'Saving Placement...' : 'Save Placement'}
                    </button>
                </div>
            )}

            <SectionChangeModal
                isOpen={showSectionModal}
                onClose={() => setShowSectionModal(false)}
                student={user}
                onSubmitted={() => {
                    setShowSectionModal(false);
                    fetchAcademicData();
                }}
            />

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .academic-identity-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicIdentityCard;
