import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../utils/hooks';
import { apiV2 } from '../../../../services/authService';
import { apiClient } from '../../../../services/api';
import SectionChangeModal from '../../../../modules/profile/components/SectionChangeModal';
import { Lock, AlertCircle, CheckCircle2, Send, RefreshCw, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
};

const selectStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: '#18191C',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
};

const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(148, 163, 184, 0.8)',
    margin: 0
};

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
        <div id="academic-identity" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box'
        }}>
            {/* Bold Heading only */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 -4px 0' }}>
                Academic Identity
            </h3>

            {/* USN Card */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
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
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#c084fc',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <Edit2 size={11} /> Edit
                        </button>
                    )}
                </div>

                {!isEditingUsn ? (
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', color: '#f8fafc' }}>
                            {user?.usn || <span style={{ color: 'rgba(148, 163, 184, 0.6)', fontStyle: 'italic', fontWeight: 400, fontSize: '13px' }}>Not Set</span>}
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'rgba(148, 163, 184, 0.65)', margin: '4px 0 0 0' }}>
                            {isUsnLocked 
                                ? 'Institutional verification complete. Permanent USN is locked.'
                                : 'Verify with your institutional email to lock your permanent USN and unlock automated academic records.'}
                        </p>
                    </div>
                ) : (
                    /* Inline USN Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                                University Seat Number
                            </label>
                            <input
                                type="text"
                                value={usnInput}
                                onChange={(e) => setUsnInput(e.target.value.toUpperCase())}
                                placeholder="e.g. 1SI23IS080"
                                maxLength={10}
                                style={{
                                    ...inputStyle,
                                    color: '#fff',
                                    fontWeight: 600
                                }}
                            />
                        </div>

                        {!otpStep && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        background: usnMode === 'TEMPORARY' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                        border: usnMode === 'TEMPORARY' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer'
                                    }}>
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
                                            <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.8)', marginTop: '2px' }}>
                                                Update immediately without email verification.
                                            </div>
                                        </div>
                                    </label>

                                    <label style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        background: usnMode === 'PERMANENT' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                        border: usnMode === 'PERMANENT' ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer'
                                    }}>
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
                                            <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.8)', marginTop: '2px' }}>
                                                Verify via institutional email ({collegeDomain}).
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCancelEditUsn}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'transparent',
                                            color: 'rgba(255, 255, 255, 0.65)',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
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
                                <div style={{
                                    fontSize: '12px',
                                    color: 'rgba(226, 232, 240, 0.9)',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    An OTP has been sent to: <strong style={{ color: '#34d399' }}>{targetEmail || derivedEmailPreview}</strong>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                                        Enter 6-digit Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        style={{
                                            ...inputStyle,
                                            border: '1px solid rgba(139, 92, 246, 0.4)',
                                            color: '#fff',
                                            fontSize: '15px',
                                            letterSpacing: '0.25em',
                                            textAlign: 'center',
                                            fontWeight: 700
                                        }}
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
                                            style={{
                                                padding: '5px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                background: 'transparent',
                                                color: 'rgba(255, 255, 255, 0.65)',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }} className="academic-identity-grid">
                {/* Branch */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={labelStyle}>
                            Branch
                        </label>
                        <span title="Branch record is locked" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                            <Lock size={12} />
                        </span>
                    </div>
                    <input
                        type="text"
                        value={branchName}
                        readOnly
                        style={{ ...inputStyle, cursor: 'not-allowed' }}
                    />
                </div>

                {/* Semester */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={labelStyle}>
                            Semester
                        </label>
                        <span title="Semester is auto-resolved from official academic schedule" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                            <Lock size={12} />
                        </span>
                    </div>
                    <input
                        type="text"
                        value={semesterDisplay}
                        readOnly
                        style={{
                            ...inputStyle,
                            color: isSemesterUnconfigured ? 'rgba(251, 191, 36, 0.75)' : inputStyle.color,
                            cursor: 'not-allowed'
                        }}
                    />
                </div>

                {/* ── Section Field ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={labelStyle}>
                            Section
                        </label>
                        {isSectionLocked ? (
                            <button
                                type="button"
                                onClick={() => setShowSectionModal(true)}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#c084fc',
                                    background: 'rgba(192, 132, 252, 0.08)',
                                    border: '1px solid rgba(192, 132, 252, 0.25)',
                                    borderRadius: '5px',
                                    padding: '2px 8px',
                                    cursor: 'pointer'
                                }}
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
                            style={{ ...inputStyle, color: 'rgba(148, 163, 184, 0.6)', cursor: 'wait' }}
                        />
                    ) : isSectionLocked ? (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={sectionName ? `Section ${sectionName}` : 'Section Not Assigned'}
                                readOnly
                                style={{ ...inputStyle, cursor: 'not-allowed' }}
                            />
                            <Lock size={12} style={{ position: 'absolute', right: '12px', color: 'rgba(148, 163, 184, 0.4)' }} />
                        </div>
                    ) : (
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="" disabled>Select Section</option>
                            {availableSections.map(sec => (
                                <option key={sec.id} value={sec.id} style={{ background: '#18191C', color: '#fff' }}>
                                    Section {sec.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ── Lab Batch Field ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={labelStyle}>
                            {isSectionLocked ? 'Lab Batch' : 'Belong to any batch here? Select here!'}
                        </label>
                        {isSectionLocked && (
                            <span title="Lab batch locked with your section" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                                <Lock size={12} />
                            </span>
                        )}
                    </div>

                    {loadingAcademic ? (
                        <input
                            type="text"
                            value="Loading batch..."
                            readOnly
                            style={{ ...inputStyle, color: 'rgba(148, 163, 184, 0.6)', cursor: 'wait' }}
                        />
                    ) : isSectionLocked ? (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={labBatch ? `Batch ${labBatch}` : 'Batch B1'}
                                readOnly
                                style={{ ...inputStyle, cursor: 'not-allowed' }}
                            />
                            <Lock size={12} style={{ position: 'absolute', right: '12px', color: 'rgba(148, 163, 184, 0.4)' }} />
                        </div>
                    ) : (
                        <select
                            value={selectedLabBatch}
                            onChange={(e) => setSelectedLabBatch(e.target.value)}
                            disabled={!selectedSectionId}
                            style={{
                                ...selectStyle,
                                opacity: !selectedSectionId ? 0.5 : 1,
                                cursor: !selectedSectionId ? 'not-allowed' : 'pointer'
                            }}
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                    <button
                        type="button"
                        onClick={handleConfirmPlacement}
                        disabled={savingPlacement || !selectedSectionId}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#8b5cf6',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: savingPlacement || !selectedSectionId ? 'not-allowed' : 'pointer',
                            opacity: savingPlacement || !selectedSectionId ? 0.6 : 1,
                            transition: 'all 0.15s'
                        }}
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
