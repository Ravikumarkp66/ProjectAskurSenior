import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, Info, X } from 'lucide-react';

import AcademicSummaryCard from './components/AcademicSummaryCard';
import SemesterProgressCard from './components/SemesterProgressCard';
import CgpaPreviewCard from './components/CgpaPreviewCard';

const CgpaSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Initial database records
    const [initialSemesters, setInitialSemesters] = useState([]);
    // Local editable form state
    const [semesters, setSemesters] = useState([]);

    const currentSemester = user?.semester || 1;

    // Load semesters on mount
    useEffect(() => {
        const loadSemesters = async () => {
            try {
                setLoading(true);
                const res = await apiV2.getSemesters();
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setInitialSemesters(res.data.data);
                    
                    // Initialize local state for all 8 semesters
                    const initialList = Array.from({ length: 8 }, (_, i) => {
                        const semNum = i + 1;
                        const dbMatch = res.data.data.find(s => s.semester === semNum);
                        return {
                            semester: semNum,
                            sgpa: dbMatch && dbMatch.sgpa !== null && dbMatch.sgpa !== undefined ? dbMatch.sgpa.toString() : '',
                            credits: dbMatch ? dbMatch.credits : 20,
                            academicYear: dbMatch ? dbMatch.academicYear : '',
                            status: dbMatch ? dbMatch.status : (semNum === currentSemester ? 'current' : 'completed')
                        };
                    });
                    setSemesters(initialList);
                }
            } catch (err) {
                console.error('[CgpaSettings] Failed to fetch semesters:', err);
                toast.error('Failed to load semester SGPA records.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadSemesters();
        }
    }, [user, currentSemester]);

    // Handle change of input fields
    const handleSemesterChange = (semesterNum, field, value) => {
        setSemesters(prev => prev.map(s => {
            if (s.semester === semesterNum) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    // Calculate live previews
    const activeSemesters = useMemo(() => {
        return semesters.filter(s => s.sgpa !== null && s.sgpa !== undefined && s.sgpa.toString().trim() !== '');
    }, [semesters]);

    const liveCgpa = useMemo(() => {
        if (activeSemesters.length === 0) return 0;
        const totalWeightedSgpa = activeSemesters.reduce((acc, curr) => {
            const sgpa = parseFloat(curr.sgpa);
            const credits = parseInt(curr.credits, 10) || 0;
            return acc + (sgpa * credits);
        }, 0);
        const totalCredits = activeSemesters.reduce((acc, curr) => acc + (parseInt(curr.credits, 10) || 0), 0);
        return totalCredits > 0 ? Math.round((totalWeightedSgpa / totalCredits) * 100) / 100 : 0;
    }, [activeSemesters]);

    const liveHighestSgpa = useMemo(() => {
        if (activeSemesters.length === 0) return 0;
        const sgpas = activeSemesters.map(s => parseFloat(s.sgpa));
        return Math.max(...sgpas);
    }, [activeSemesters]);

    const lastUpdatedStr = useMemo(() => {
        const dates = initialSemesters
            .map(s => s.updatedAt ? new Date(s.updatedAt) : null)
            .filter(d => d !== null);
        if (dates.length === 0) {
            if (user?.updatedAt) {
                return new Date(user.updatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
            return null;
        }
        const maxDate = new Date(Math.max(...dates));
        return maxDate.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }, [initialSemesters, user]);

    // Check if changes have been made compared to initial database values
    const isChanged = useMemo(() => {
        if (loading) return false;

        // Check if any of the 8 local semesters differ from initial list
        return semesters.some(s => {
            const initial = initialSemesters.find(db => db.semester === s.semester);
            const localSgpa = s.sgpa.trim() === '' ? null : parseFloat(s.sgpa);
            const dbSgpa = initial && initial.sgpa !== null && initial.sgpa !== undefined ? initial.sgpa : null;
            
            const localCredits = parseInt(s.credits, 10);
            const dbCredits = initial ? initial.credits : 20;

            return localSgpa !== dbSgpa || localCredits !== dbCredits;
        });
    }, [semesters, initialSemesters, loading]);

    // Validate and submit changes
    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // 1. Validations
        const toSave = [];
        const activeSemNums = [];

        for (const s of semesters) {
            const hasSgpa = s.sgpa.toString().trim() !== '';
            
            if (hasSgpa) {
                const val = parseFloat(s.sgpa);
                if (isNaN(val) || val < 0 || val > 10) {
                    setError(`Semester ${s.semester} SGPA must be between 0.00 and 10.00.`);
                    return;
                }
                
                const creds = parseInt(s.credits, 10);
                if (isNaN(creds) || creds < 0) {
                    setError(`Semester ${s.semester} credits must be a positive number.`);
                    return;
                }

                toSave.push({
                    semester: s.semester,
                    sgpa: val,
                    credits: creds,
                    academicYear: s.academicYear,
                    status: s.status
                });
                activeSemNums.push(s.semester);
            } else {
                // If it was in database initially, send a null payload to delete it
                const wasInDb = initialSemesters.some(db => db.semester === s.semester);
                if (wasInDb) {
                    toSave.push({
                        semester: s.semester,
                        sgpa: null,
                        credits: parseInt(s.credits, 10) || 20,
                        academicYear: s.academicYear,
                        status: s.status
                    });
                }
            }
        }

        // 2. Validate continuity (no skipping semesters)
        if (activeSemNums.length > 0) {
            activeSemNums.sort((a, b) => a - b);
            const maxSem = activeSemNums[activeSemNums.length - 1];
            for (let i = 1; i <= maxSem; i++) {
                if (!activeSemNums.includes(i)) {
                    setError(`Semesters must be continuous starting from Semester 1. Please fill Semester ${i} before adding higher semesters.`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const res = await apiV2.updateSemesters({ semesters: toSave });
            if (res.data?.success && res.data?.data) {
                const { student, semesters: updatedSems } = res.data.data;
                updateUser(student);
                setInitialSemesters(updatedSems);
                
                // Refresh local state list
                const refreshedList = Array.from({ length: 8 }, (_, i) => {
                    const semNum = i + 1;
                    const dbMatch = updatedSems.find(s => s.semester === semNum);
                    return {
                        semester: semNum,
                        sgpa: dbMatch && dbMatch.sgpa !== null && dbMatch.sgpa !== undefined ? dbMatch.sgpa.toString() : '',
                        credits: dbMatch ? dbMatch.credits : 20,
                        academicYear: dbMatch ? dbMatch.academicYear : '',
                        status: dbMatch ? dbMatch.status : (semNum === currentSemester ? 'current' : 'completed')
                    };
                });
                setSemesters(refreshedList);
                setSuccess(true);
                toast.success('CGPA progress saved successfully!');
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save CGPA progress.';
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: '#a78bfa' }} />
            </div>
        );
    }

    const recordedCount = activeSemesters.length;
    const currentCgpa = user?.cgpa ?? null;

    return (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }} className="cgpa-settings-header-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                        CGPA Progress
                    </h2>
                    <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                        Record your semester SGPAs and track your cumulative CGPA status
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#a78bfa',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.35)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                >
                    <Info size={14} />
                    How it works
                </button>
            </div>

            {/* Academic Summary Card */}
            <AcademicSummaryCard 
                currentSemester={currentSemester} 
                recordedCount={recordedCount} 
                currentCgpa={currentCgpa} 
            />

            {/* Semester Progress Card */}
            <SemesterProgressCard 
                currentSemester={currentSemester} 
                semestersList={semesters} 
                onChange={handleSemesterChange} 
            />

            {/* CGPA Preview Card */}
            <CgpaPreviewCard 
                calculatedCgpa={liveCgpa} 
                highestSgpa={liveHighestSgpa} 
                semestersRecordedCount={recordedCount} 
                currentSemester={currentSemester} 
            />

            {/* Error Message */}
            {error && (
                <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 500, padding: '0 4px' }}>
                    {error}
                </div>
            )}

            {/* Save Changes bar at bottom */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '16px',
                gap: '16px'
            }} className="cgpa-settings-footer-bar">
                {/* Last updated text */}
                <div style={{ fontSize: '11.5px', color: 'rgba(148, 163, 184, 0.4)', fontWeight: 500 }}>
                    {lastUpdatedStr ? `Last updated: ${lastUpdatedStr}` : ''}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    {isChanged && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '12.5px', fontWeight: 600 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span>
                            Unsaved changes
                        </div>
                    )}

                    {success && !isChanged && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12.5px', fontWeight: 600 }}>
                            <CheckCircle2 size={14} />
                            Changes saved
                        </div>
                    )}
                    
                    <button
                    type="submit"
                    disabled={!isChanged || saving}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        outline: 'none',
                        background: !isChanged 
                            ? 'rgba(255, 255, 255, 0.04)' 
                            : 'linear-gradient(135deg, #7C3AED, #6366F1)',
                        color: !isChanged ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: !isChanged || saving ? 'not-allowed' : 'pointer',
                        boxShadow: isChanged && !saving 
                            ? '0 4px 14px rgba(124, 58, 237, 0.3)' 
                            : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        if (isChanged && !saving) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.4)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (isChanged && !saving) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.3)';
                        }
                    }}
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Save Changes
                </button>
                </div>
            </div>

            {/* Help Modal Overlay */}
            {showInfoModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    boxSizing: 'border-box'
                }} onClick={() => setShowInfoModal(false)}>
                    <div style={{
                        background: '#13111A',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '560px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        animation: 'modalFadeIn 0.25s ease-out',
                        boxSizing: 'border-box'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={16} style={{ color: '#a78bfa' }} />
                                How to Use CGPA Progress
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{
                            padding: '20px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px',
                            boxSizing: 'border-box',
                            fontSize: '12.5px',
                            lineHeight: '1.5',
                            color: 'rgba(148, 163, 184, 0.85)'
                        }}>
                            
                            {/* Section 1 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    1. Semester SGPA
                                </h4>
                                <span>
                                    Enter the official SGPA you received for that semester exactly as shown on your university marks card (e.g. 8.45). Do not enter your cumulative CGPA here.
                                </span>
                            </div>

                            {/* Section 2 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    2. If You Have Failed a Subject
                                </h4>
                                <span>
                                    Even if you have one or more backlogs, enter the SGPA exactly as it appears on your marks card. Do not estimate or modify your SGPA. The system will calculate your CGPA based on the values you provide.
                                </span>
                            </div>

                            {/* Section 3 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    3. Semester Credits
                                </h4>
                                <span>
                                    Enter the total credits you registered for that semester. These credits are available in your college registration form, scheme syllabus, or marks card (e.g. 23).
                                </span>
                            </div>

                            {/* Section 4 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    4. Failed Subjects and Credits
                                </h4>
                                <span>
                                    If you failed a subject, do not reduce or remove the credits. Enter the total registered semester credits exactly as they were originally allotted. The credits represent your semester registration, not just subjects passed.
                                </span>
                            </div>

                            {/* Section 5 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    5. CGPA Calculation
                                </h4>
                                <span>
                                    Your CGPA is calculated using the academically correct credit-weighted formula:
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        margin: '6px 0',
                                        color: '#a78bfa',
                                        fontFamily: 'monospace',
                                        fontSize: '11px',
                                        textAlign: 'center'
                                    }}>
                                        CGPA = Σ(SGPA × Semester Credits) / Σ(Credits)
                                    </div>
                                    This calculation updates automatically whenever you save your semester records.
                                </span>
                            </div>

                            {/* Section 6 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                    6. Why Are Credits Required?
                                </h4>
                                <span>
                                    Storing credits ensures that AskUrSenior supports advanced academic features accurately, including:
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <li>Credit-weighted CGPA calculations</li>
                                        <li>Branch Change Eligibility checks</li>
                                        <li>Placement Eligibility Cutoff analysis</li>
                                        <li>Academic performance reports and insights</li>
                                    </ul>
                                </span>
                            </div>

                            {/* Important Notes */}
                            <div style={{
                                background: 'rgba(167, 139, 250, 0.04)',
                                border: '1px solid rgba(167, 139, 250, 0.15)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                marginTop: '4px'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c4b5fd' }}>
                                    Important Notes
                                </span>
                                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px', color: 'rgba(196, 181, 253, 0.85)' }}>
                                    <li>Enter only official university values.</li>
                                    <li>Keep semesters in chronological order.</li>
                                    <li>Update your Current Semester in Basic Information before adding SGPA for a new semester.</li>
                                    <li>CGPA is calculated automatically—you never need to enter it manually.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: 'rgba(255, 255, 255, 0.01)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    padding: '6px 16px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Got it
                            </button>
                        </div>

                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @media (max-width: 576px) {
                    .cgpa-settings-header-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 8px !important;
                    }
                }
            `}} />
        </form>
    );
};

export default CgpaSettings;
