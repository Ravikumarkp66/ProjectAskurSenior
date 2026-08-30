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

    // ── Student Academic Profile ────────────────────────────
    const [profile, setProfile] = useState(null);

    // ── Semesters State ─────────────────────────────────────
    const [currentSemester, setCurrentSemester] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [semestersData, setSemestersData] = useState([]);
    const [semesterCreditsMap, setSemesterCreditsMap] = useState({});

    // ── Active/Selected Semester Data ───────────────────────
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [registeredSubjects, setRegisteredSubjects] = useState([]);
    const [timetableConfig, setTimetableConfig] = useState(null);
    const [timetableSlots, setTimetableSlots] = useState([]);
    const [officialTimetableSlots, setOfficialTimetableSlots] = useState([]);
    const [isCustomizedTimetable, setIsCustomizedTimetable] = useState(false);

    // Helper: Determine if selected semester is historical/finalized (Read-only)
    const isFinalized = useMemo(() => {
        const sem = semestersData.find(s => s.semester === selectedSemester);
        if (sem && sem.status === 'completed') return true;
        return selectedSemester < currentSemester;
    }, [semestersData, selectedSemester, currentSemester]);

    const isActiveSemester = useMemo(() => {
        return selectedSemester === currentSemester && !isFinalized;
    }, [selectedSemester, currentSemester, isFinalized]);

    // ── Initial Fetch: Profile, Semesters, All Semester Credits ─
    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch profile and semester list in parallel
            const [profileRes, semRes] = await Promise.allSettled([
                apiV2.getMe(),
                apiV2.getSemesters()
            ]);

            let activeSem = 1;
            if (profileRes.status === 'fulfilled' && profileRes.value?.data?.data) {
                const p = profileRes.value.data.data.student || profileRes.value.data.data;
                setProfile(p);
                activeSem = Number(p.semester) || 1;
                setCurrentSemester(activeSem);
                setSelectedSemester(activeSem);
            } else if (user) {
                setProfile(user);
                activeSem = Number(user.semester) || 1;
                setCurrentSemester(activeSem);
                setSelectedSemester(activeSem);
            }

            // Handle semesters list from DB
            let sList = [];
            if (semRes.status === 'fulfilled' && semRes.value?.data) {
                const resData = semRes.value.data;
                sList = Array.isArray(resData.data) 
                    ? resData.data 
                    : (resData.data?.semesters || (Array.isArray(resData) ? resData : []));
            }

            // Determine starting semester:
            // If the student started using AskUrSenior from 5th sem (3rd year) or 3rd sem (2nd year),
            // show from their starting semester onwards (e.g., 5 to 8).
            // Any semester already in the database is preserved so finalized semesters NEVER disappear!
            const dbSemNumbers = sList.map(s => Number(s.semester)).filter(n => !isNaN(n) && n >= 1);
            const lowestDbSem = dbSemNumbers.length > 0 ? Math.min(...dbSemNumbers) : activeSem;
            const startSem = Math.max(1, Math.min(activeSem, lowestDbSem));

            // Generate semesters from startSem up to 8
            const fullSemList = [];
            for (let semNum = startSem; semNum <= 8; semNum++) {
                const existing = sList.find(s => s.semester === semNum);
                let status = 'upcoming';
                if (semNum < activeSem) status = 'completed';
                else if (semNum === activeSem) status = existing?.status || 'current';

                fullSemList.push({
                    semester: semNum,
                    status: existing?.status || status,
                    sgpa: existing?.sgpa ?? null,
                    credits: existing?.credits ?? 20,
                    academicYear: existing?.academicYear || '',
                    startDate: existing?.startDate || null,
                    endDate: existing?.endDate || null,
                });
            }
            setSemestersData(fullSemList);

            // Fetch registered credits for all applicable semesters
            const creditPromises = fullSemList.map(s => apiV2.getRegisteredSubjects(s.semester));
            const creditResults = await Promise.allSettled(creditPromises);
            const cMap = {};
            creditResults.forEach((r, idx) => {
                const sNum = fullSemList[idx]?.semester;
                if (r.status === 'fulfilled' && r.value?.data?.data) {
                    const list = r.value.data.data;
                    const totCredits = list.reduce((sum, item) => sum + (item.registeredCredits ?? item.subject?.credits ?? 0), 0);
                    cMap[sNum] = totCredits;
                }
            });
            setSemesterCreditsMap(cMap);

        } catch (err) {
            console.error('[StudentAcademicsContext] Initial load error:', err);
            setError('Failed to load academic profile data.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // ── Load Semester-Specific Data When selectedSemester Changes ─
    const fetchSemesterData = useCallback(async (semNum) => {
        try {
            const [currRes, regRes, configRes, slotsRes] = await Promise.allSettled([
                apiV2.getAcademicSubjects(semNum),
                apiV2.getRegisteredSubjects(semNum),
                apiV2.getTimetableConfig(semNum),
                apiV2.getTimetableSlots(semNum)
            ]);

            // Curriculum catalogue
            if (currRes.status === 'fulfilled' && currRes.value?.data?.data) {
                setCurriculumSubjects(currRes.value.data.data);
            } else {
                setCurriculumSubjects([]);
            }

            // Registered subjects
            let regList = [];
            if (regRes.status === 'fulfilled' && regRes.value?.data?.data) {
                regList = regRes.value.data.data;
                setRegisteredSubjects(regList);
                const semCredits = regList.reduce((sum, item) => sum + (item.registeredCredits ?? item.subject?.credits ?? 0), 0);
                setSemesterCreditsMap(prev => ({ ...prev, [semNum]: semCredits }));
            } else {
                setRegisteredSubjects([]);
            }

            // Timetable config
            if (configRes.status === 'fulfilled' && configRes.value?.data?.data) {
                const cfg = configRes.value.data.data?.config || configRes.value.data.data;
                setTimetableConfig(cfg);
            }

            // Timetable slots
            if (slotsRes.status === 'fulfilled' && slotsRes.value?.data?.data) {
                const allSlots = slotsRes.value.data.data;
                const filteredSlots = Array.isArray(allSlots) ? allSlots.filter(s => !s.semester || s.semester === semNum) : [];
                setTimetableSlots(filteredSlots);
                setOfficialTimetableSlots(filteredSlots);
            } else {
                setTimetableSlots([]);
                setOfficialTimetableSlots([]);
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

    // Select active/historical semester
    const selectSemester = (semNum) => {
        setSelectedSemester(semNum);
    };

    // Save registered subjects
    const saveSubjects = async (subjectIds, customSubjects = []) => {
        if (isFinalized) {
            toast.error('This semester is finalized and read-only.');
            return false;
        }
        try {
            setSaving(true);
            const payload = {
                semester: selectedSemester,
                subjectIds,
                customSubjects
            };
            const res = await apiV2.saveRegisteredSubjects(payload);
            if (res.data?.success) {
                toast.success('Registered subjects updated successfully.');
                await fetchSemesterData(selectedSemester);
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to save subjects.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] saveSubjects error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error saving subjects.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Save timetable config
    const saveConfig = async (newConfig) => {
        if (isFinalized) {
            toast.error('This semester is finalized and read-only.');
            return false;
        }
        try {
            setSaving(true);
            const payload = {
                ...newConfig,
                semester: selectedSemester
            };
            const res = await apiV2.saveTimetableConfig(payload);
            if (res.data?.success) {
                toast.success('Academic configuration saved.');
                const savedConfig = res.data.data?.config || res.data.data;
                const savedSlots = res.data.data?.slots;
                if (savedConfig) {
                    setTimetableConfig(savedConfig);
                }
                if (savedSlots && Array.isArray(savedSlots)) {
                    setTimetableSlots(savedSlots);
                    setOfficialTimetableSlots(savedSlots);
                }
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to save configuration.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] saveConfig error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error saving configuration.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Save timetable slots
    const saveSlots = async (newSlots) => {
        if (isFinalized) {
            toast.error('This semester is finalized and read-only.');
            return false;
        }
        try {
            setSaving(true);
            const payload = {
                semester: selectedSemester,
                slots: newSlots
            };
            const res = await apiV2.updateTimetableSlots(payload);
            if (res.data?.success) {
                toast.success('Timetable slots updated.');
                setTimetableSlots(newSlots);
                setIsCustomizedTimetable(true);
                return true;
            } else {
                throw new Error(res.data?.message || 'Failed to save timetable slots.');
            }
        } catch (err) {
            console.error('[StudentAcademicsContext] saveSlots error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error saving timetable slots.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Reset to official timetable
    const useOfficialTimetable = () => {
        setTimetableSlots(officialTimetableSlots);
        setIsCustomizedTimetable(false);
        toast.success('Reset to official college timetable.');
    };

    // Update profile
    const updateAcademicProfile = async (profileData) => {
        try {
            setSaving(true);
            const res = await apiV2.updateProfile(profileData);
            if (res.data?.success) {
                toast.success('Academic profile updated.');
                if (updateUser) updateUser(res.data.data);
                setProfile(prev => ({ ...prev, ...res.data.data }));
                return true;
            }
            throw new Error(res.data?.message || 'Failed to update profile.');
        } catch (err) {
            console.error('[StudentAcademicsContext] updateAcademicProfile error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating profile.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Finalize semester (freeze historical record)
    const finalizeSemester = async (semNum) => {
        try {
            setSaving(true);
            const updated = semestersData.map(s => s.semester === semNum ? { ...s, status: 'completed' } : s);
            const res = await apiV2.updateSemesters({ semesters: updated });
            if (res.data?.success) {
                toast.success(`Semester ${semNum} finalized as read-only.`);
                setSemestersData(updated);
                return true;
            }
            throw new Error(res.data?.message || 'Failed to finalize semester.');
        } catch (err) {
            console.error('[StudentAcademicsContext] finalizeSemester error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error finalizing semester.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Update individual semester details (dates, SGPA, status)
    const updateSemester = async (semNum, updatedFields) => {
        try {
            setSaving(true);
            const updated = semestersData.map(s => s.semester === semNum ? { ...s, ...updatedFields } : s);
            const res = await apiV2.updateSemesters({ semesters: updated });
            if (res.data?.success) {
                toast.success(`Semester ${semNum} updated successfully.`);
                setSemestersData(updated);

                // If updating current active semester dates, sync with timetableConfig
                if (semNum === currentSemester && (updatedFields.startDate || updatedFields.endDate)) {
                    if (timetableConfig) {
                        const newConfig = {
                            ...timetableConfig,
                            semesterStartDate: updatedFields.startDate || timetableConfig.semesterStartDate,
                            lastWorkingDate: updatedFields.endDate || timetableConfig.lastWorkingDate
                        };
                        setTimetableConfig(newConfig);
                        await apiV2.saveTimetableConfig(newConfig).catch(console.error);
                    }
                }
                return true;
            }
            throw new Error(res.data?.message || 'Failed to update semester.');
        } catch (err) {
            console.error('[StudentAcademicsContext] updateSemester error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating semester.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const totalRegisteredCredits = useMemo(() => {
        return registeredSubjects.reduce((sum, item) => sum + (item.registeredCredits ?? item.subject?.credits ?? 0), 0);
    }, [registeredSubjects]);

    const value = {
        loading,
        saving,
        error,
        profile,
        currentSemester,
        selectedSemester,
        semestersData,
        semesterCreditsMap,
        curriculumSubjects,
        registeredSubjects,
        totalRegisteredCredits,
        timetableConfig,
        timetableSlots,
        officialTimetableSlots,
        isCustomizedTimetable,
        isFinalized,
        isActiveSemester,
        selectSemester,
        saveSubjects,
        saveConfig,
        saveSlots,
        useOfficialTimetable,
        updateAcademicProfile,
        finalizeSemester,
        updateSemester,
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
