import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../services/authService';
import CieHeader from './components/cie/CieHeader';
import CieSubjectSelector from './components/cie/CieSubjectSelector';
import CieRawInputWorkspace from './components/cie/CieRawInputWorkspace';
import CieResultPanel from './components/cie/CieResultPanel';
import CieSummaryView from './components/cie/CieSummaryView';

const CieSettings = () => {
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [availableSemesters, setAvailableSemesters] = useState([1]);
    const [subjects, setSubjects] = useState([]);
    const [summaryStats, setSummaryStats] = useState({});
    const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'summary'
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const debounceTimerRef = useRef(null);

    const fetchCieData = async (sem, isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const res = await apiV2.getCieDashboard(sem);
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
            console.error('[CieSettings] Error fetching CIE data:', err);
            toast.error('Failed to load CIE data.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCieData(selectedSemester);
    }, [selectedSemester]);

    const handleSemesterChange = (sem) => {
        setSelectedSemester(sem);
        setSelectedSubjectIndex(0);
    };

    const handleRawMarksChange = (updatedRawMarks) => {
        if (subjects.length === 0) return;

        const currentSubject = subjects[selectedSubjectIndex];
        if (!currentSubject) return;

        // 1. Optimistic local state update
        const updatedSubjects = [...subjects];
        const targetObj = { ...updatedSubjects[selectedSubjectIndex], rawMarks: updatedRawMarks };
        updatedSubjects[selectedSubjectIndex] = targetObj;
        setSubjects(updatedSubjects);

        // 2. Debounced API Save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        setIsSaving(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await apiV2.saveCieRecord({
                    registeredSubjectId: currentSubject.registeredSubjectId,
                    semester: selectedSemester,
                    rawMarks: updatedRawMarks
                });

                if (res.data?.success && res.data.data) {
                    const updatedSub = res.data.data;
                    setSubjects(prev => {
                        const copy = [...prev];
                        const idx = copy.findIndex(s => s.registeredSubjectId === updatedSub.registeredSubjectId);
                        if (idx !== -1) {
                            copy[idx] = updatedSub;
                        }
                        return copy;
                    });
                }
            } catch (err) {
                console.error('[CieSettings] Error saving CIE marks:', err);
                toast.error('Failed to save CIE marks.');
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    const currentSubject = subjects[selectedSubjectIndex] || null;

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                gap: '12px',
                color: 'rgba(148, 163, 184, 0.6)'
            }}>
                <div className="animate-spin" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '3px solid rgba(124, 58, 237, 0.2)',
                    borderTopColor: '#a78bfa'
                }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading CIE Analyzer...</span>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 8px',
            color: '#fff'
        }}>
            {/* Header with Semester Switcher & View Mode Tabs */}
            <CieHeader
                selectedSemester={selectedSemester}
                availableSemesters={availableSemesters}
                onSelectSemester={handleSemesterChange}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isRefreshing={isRefreshing}
                onRefresh={() => fetchCieData(selectedSemester, true)}
            />

            {subjects.length === 0 ? (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#94a3b8'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>
                        No Registered Subjects Found
                    </h3>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                        No registered subjects exist for Semester {selectedSemester}. Complete Subject Registration first.
                    </p>
                </div>
            ) : activeTab === 'entry' ? (
                /* CIE ENTRY & ANALYSIS VIEW (Continuous Desktop/Mobile Layout) */
                <div className="flex flex-col md:flex-row gap-5 items-start">
                    {/* Subject Selector (Desktop Sidebar / Mobile Header Navigator) */}
                    <CieSubjectSelector
                        subjects={subjects}
                        selectedIndex={selectedSubjectIndex}
                        onSelectSubject={setSelectedSubjectIndex}
                    />

                    {/* Active Subject Workspace */}
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Raw Input Component Groups */}
                        <CieRawInputWorkspace
                            subject={currentSubject}
                            onMarksChange={handleRawMarksChange}
                            isSaving={isSaving}
                        />

                        {/* Live CIE Result Panel */}
                        <CieResultPanel subject={currentSubject} />
                    </div>
                </div>
            ) : (
                /* CIE SUMMARY VIEW */
                <CieSummaryView
                    subjects={subjects}
                    summaryStats={summaryStats}
                    selectedSemester={selectedSemester}
                />
            )}
        </div>
    );
};

export default CieSettings;
