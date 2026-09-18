import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiV2 } from '../services/authService';
import { useAuth } from '../utils/hooks';
import toast from 'react-hot-toast';

const StudentAcademicsContext = createContext(null);

export const useStudentAcademics = () => {
    const context = useContext(StudentAcademicsContext);
    if (!context) {
        throw new Error('useStudentAcademics must be used within a StudentAcademicsProvider');
    }
    return context;
};

export const StudentAcademicsProvider = ({ children }) => {
    const { user, updateUser } = useAuth();

    // ── Global Loading & Status ─────────────────────────────
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // ── Authoritative Academic Context ──────────────────────
    const [academicOverview, setAcademicOverview] = useState(null);
    const [currentSemester, setCurrentSemester] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [semestersData, setSemestersData] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);
    const [academicSettings, setAcademicSettings] = useState(null);

    // ── Selected Semester Data ──────────────────────────────
    const [timetableData, setTimetableData] = useState(null);
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [registeredSubjects, setRegisteredSubjects] = useState([]);

    // Derived flags: past semesters are historical and read-only
    const isHistorical = useMemo(() => {
        return selectedSemester < currentSemester;
    }, [selectedSemester, currentSemester]);

    const isFinalized = isHistorical; // backwards compatibility alias

    // ── Initial Fetch: Overview, Semesters, Sections, Settings ─
    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [overviewRes, semRes, sectionsRes, settingsRes] = await Promise.allSettled([
                apiV2.getStudentAcademicsOverview(),
                apiV2.getStudentAcademicsSemesters(),
                apiV2.getStudentAcademicsSections(),
                apiV2.getStudentAcademicsSettings()
            ]);

            let activeSem = 1;

            if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.data) {
                const ov = overviewRes.value.data.data;
                setAcademicOverview(ov);
                activeSem = Number(ov.student?.currentSemester) || 1;
                setCurrentSemester(activeSem);
                setSelectedSemester(activeSem);
            } else if (user) {
                activeSem = Number(user.semester) || 1;
                setCurrentSemester(activeSem);
                setSelectedSemester(activeSem);
            }

            // Visible Semesters (strictly past + current official semesters from Admin)
            if (semRes.status === 'fulfilled' && semRes.value?.data?.data) {
                const sems = semRes.value.data.data;
                setSemestersData(Array.isArray(sems) ? sems : []);
            } else if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.data?.visibleSemesters) {
                setSemestersData(overviewRes.value.data.data.visibleSemesters);
            }

            // Available Sections (within student's branch & batch)
            if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data?.data) {
                setAvailableSections(sectionsRes.value.data.data.sections || []);
            }

            // Academic Settings (Admin Baseline + Student Target)
            if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.data) {
                setAcademicSettings(settingsRes.value.data.data);
            }

        } catch (err) {
            console.error('[StudentAcademicsContext] Initial load error:', err);
            setError('Failed to load authoritative academic profile data.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // ── Load Semester-Specific Data (Timetable & Subjects) ─
    const fetchSemesterData = useCallback(async (semNum) => {
        try {
            const [ttRes, subRes] = await Promise.allSettled([
                apiV2.getStudentAcademicsTimetable(semNum),
                apiV2.getStudentAcademicsSubjects(semNum)
            ]);

            if (ttRes.status === 'fulfilled' && ttRes.value?.data?.data) {
                setTimetableData(ttRes.value.data.data);
            } else {
                setTimetableData(null);
            }

            if (subRes.status === 'fulfilled' && subRes.value?.data?.data) {
                const data = subRes.value.data.data;
                setCurriculumSubjects(data.curriculumSubjects || []);
                setRegisteredSubjects(data.registeredSubjects || []);
            } else {
                setCurriculumSubjects([]);
                setRegisteredSubjects([]);
            }
        } catch (err) {
            console.error(`[StudentAcademicsContext] Error loading sem ${semNum}:`, err);
        }
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchSemesterData(selectedSemester);
        }
    }, [selectedSemester, loading, fetchSemesterData]);

    // ── Actions ─────────────────────────────────────────────

    // Select semester: only permits visible past + current semesters (never future)
    const selectSemester = (semNum) => {
        const target = Number(semNum);
        if (target > currentSemester) {
            toast.error(`Future semester ${target} is not accessible. Current semester is ${currentSemester}.`);
            return;
        }
        setSelectedSemester(target);
    };

    // Update section (within verified batch & branch)
    const updateSection = async (sectionId) => {
        try {
            setSaving(true);
            const res = await apiV2.updateStudentAcademicsSection(sectionId);
            if (res.data?.success) {
                toast.success('Academic section updated successfully.');
                await fetchInitialData();
                await fetchSemesterData(selectedSemester);
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to update section.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] updateSection error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating section.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Update personal attendance target (does NOT alter college minimum 85%)
    const updatePersonalTarget = async (target) => {
        try {
            setSaving(true);
            const targetNum = Number(target);
            if (isNaN(targetNum) || targetNum < 1 || targetNum > 100) {
                toast.error('Target attendance must be between 1% and 100%.');
                return false;
            }

            const res = await apiV2.updateStudentAcademicsSettings({
                personalAttendanceTarget: targetNum
            });

            if (res.data?.success) {
                toast.success(`Personal attendance target updated to ${targetNum}%.`);
                setAcademicSettings(prev => prev ? {
                    ...prev,
                    personalSettings: {
                        ...prev.personalSettings,
                        personalAttendanceTarget: targetNum
                    }
                } : null);
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to update target attendance.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] updatePersonalTarget error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating target.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Save registered subjects from authoritative curriculum
    const saveRegisteredSubjects = async (subjectIds) => {
        if (isHistorical) {
            toast.error('Historical semesters cannot be modified.');
            return false;
        }

        try {
            setSaving(true);
            const res = await apiV2.saveStudentAcademicsRegisteredSubjects({
                semester: selectedSemester,
                subjectIds
            });

            if (res.data?.success) {
                toast.success('Subject registrations updated successfully.');
                await fetchSemesterData(selectedSemester);
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to update registered subjects.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] saveRegisteredSubjects error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating subjects.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Total registered credits
    const totalRegisteredCredits = useMemo(() => {
        return registeredSubjects.reduce((sum, item) => {
            const credits = item.credits ?? item.subject?.credits ?? 0;
            return sum + credits;
        }, 0);
    }, [registeredSubjects]);

    // Format timetable slots for timetable grid compatibility
    const timetableSlots = useMemo(() => {
        if (!timetableData?.slots) return [];
        return timetableData.slots.map(s => ({
            ...s,
            dayOfWeek: s.dayOfWeek,
            startMinute: s.startMinute,
            endMinute: s.endMinute,
            subject: s.subject,
            room: s.room,
            faculty: s.faculty,
            lectureType: s.lectureType,
            status: s.status,
            periodName: s.periodName
        }));
    }, [timetableData]);

    const value = {
        loading,
        saving,
        error,
        academicOverview,
        currentSemester,
        selectedSemester,
        semestersData,
        availableSections,
        academicSettings,
        curriculumSubjects,
        registeredSubjects,
        totalRegisteredCredits,
        timetableData,
        timetableSlots,
        isHistorical,
        isFinalized,
        selectSemester,
        updateSection,
        updatePersonalTarget,
        saveRegisteredSubjects,
        refreshData: fetchInitialData,
        refreshSemester: () => fetchSemesterData(selectedSemester)
    };

    return (
        <StudentAcademicsContext.Provider value={value}>
            {children}
        </StudentAcademicsContext.Provider>
    );
};

export default StudentAcademicsContext;
