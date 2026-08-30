import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import SgpaHeader from './components/sgpa/SgpaHeader';
import SgpaTableEntry from './components/sgpa/SgpaTableEntry';
import SgpaMobileEntry from './components/sgpa/SgpaMobileEntry';
import SgpaHeroResult from './components/sgpa/SgpaHeroResult';
import SgpaSummaryView from './components/sgpa/SgpaSummaryView';
import { BookOpenCheck, Loader2 } from 'lucide-react';

const SgpaSettings = () => {
    const navigate = useNavigate();

    const [selectedSemester, setSelectedSemester] = useState(1);
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [summaryStats, setSummaryStats] = useState({});
    const [globalSeeMax, setGlobalSeeMax] = useState(100);

    const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'summary'
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const debounceTimerRef = useRef(null);

    const fetchSgpaData = async (sem) => {
        setIsLoading(true);
        try {
            const res = await apiV2.getSgpaDashboard(sem);
            if (res.data?.success && res.data.data) {
                const data = res.data.data;
                setSelectedSemester(data.semester || sem);
                if (data.availableSemesters && data.availableSemesters.length > 0) {
                    setAvailableSemesters(data.availableSemesters);
                }
                setSubjects(data.subjects || []);
                setSummaryStats(data.summaryStats || {});
            }
        } catch (err) {
            console.error('[SgpaSettings] Error fetching SGPA data:', err);
            toast.error('Failed to load SGPA calculator data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSgpaData(selectedSemester);
    }, [selectedSemester]);

    const handleSemesterChange = (sem) => {
        setSelectedSemester(sem);
    };

    const handleRawSeeChange = (subjectIndex, rawVal, rawMax) => {
        if (subjects.length === 0) return;
        const currentSub = subjects[subjectIndex];
        if (!currentSub) return;

        // 1. Optimistic local state update
        const updatedSubs = [...subjects];
        const targetSub = { ...updatedSubs[subjectIndex], seeRawMarks: rawVal, seeRawMaximum: rawMax };
        updatedSubs[subjectIndex] = targetSub;
        setSubjects(updatedSubs);

        // 2. Debounced API save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        setIsSaving(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await apiV2.saveSgpaRecord({
                    registeredSubjectId: currentSub.registeredSubjectId,
                    semester: selectedSemester,
                    seeRawMarks: rawVal,
                    seeRawMaximum: rawMax
                });

                if (res.data?.success && res.data.data) {
                    const data = res.data.data;
                    setSummaryStats(data.summaryStats || {});
                    if (data.subjects && data.subjects.length > 0) {
                        setSubjects(data.subjects);
                    }
                }
            } catch (err) {
                console.error('[SgpaSettings] Error saving SEE marks:', err);
                toast.error('Failed to save SEE marks.');
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    const handleGlobalSeeMaxToggle = (newMax) => {
        setGlobalSeeMax(newMax);
        if (subjects.length === 0) return;

        // Batch update all subjects with new max
        const updatedSubs = subjects.map(s => ({
            ...s,
            seeRawMaximum: newMax
        }));
        setSubjects(updatedSubs);
    };

    const handleSaveSemester = async () => {
        setIsSaving(true);
        try {
            const firstSub = subjects.length > 0 ? subjects[0] : null;
            const res = await apiV2.saveSgpaRecord({
                registeredSubjectId: firstSub?.registeredSubjectId || undefined,
                semester: selectedSemester,
                seeRawMarks: firstSub?.seeRawMarks !== undefined ? firstSub.seeRawMarks : undefined,
                seeRawMaximum: firstSub?.seeRawMaximum || globalSeeMax
            });

            if (res.data?.success) {
                toast.success(`Semester ${selectedSemester} result saved successfully!`);
            }
        } catch (err) {
            console.error('[SgpaSettings] Error saving semester result:', err);
            toast.error('Failed to save semester result.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 360,
                color: '#94a3b8',
                gap: 12
            }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Loading SGPA Calculator...</span>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
            {/* Header */}
            <SgpaHeader
                selectedSemester={selectedSemester}
                availableSemesters={availableSemesters}
                onSemesterChange={handleSemesterChange}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                globalSeeMax={globalSeeMax}
                onGlobalSeeMaxToggle={handleGlobalSeeMaxToggle}
            />

            {/* Empty State: No Registered Subjects */}
            {subjects.length === 0 ? (
                <div style={{
                    padding: '48px 24px',
                    borderRadius: 20,
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16
                }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c4b5fd'
                    }}>
                        <BookOpenCheck size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                            No Registered Subjects for Semester {selectedSemester}
                        </h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0', maxWidth: 460 }}>
                            Register your subjects for Semester {selectedSemester} before calculating SGPA.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/student-academics/subjects')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
                            marginTop: 8
                        }}
                    >
                        Go to Subject Registration →
                    </button>
                </div>
            ) : activeTab === 'entry' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Top Hero Summary Card */}
                    <SgpaHeroResult summaryStats={summaryStats} selectedSemester={selectedSemester} />

                    {/* Desktop Table View */}
                    <SgpaTableEntry
                        subjects={subjects}
                        globalSeeMax={globalSeeMax}
                        onRawSeeChange={handleRawSeeChange}
                    />

                    {/* Mobile Card Entry View */}
                    <SgpaMobileEntry
                        subjects={subjects}
                        availableSemesters={availableSemesters}
                        selectedSemester={selectedSemester}
                        onSemesterChange={handleSemesterChange}
                        globalSeeMax={globalSeeMax}
                        onRawSeeChange={handleRawSeeChange}
                    />
                </div>
            ) : (
                /* Summary Tab */
                <SgpaSummaryView
                    subjects={subjects}
                    summaryStats={summaryStats}
                    selectedSemester={selectedSemester}
                    onSaveSemester={handleSaveSemester}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default SgpaSettings;
