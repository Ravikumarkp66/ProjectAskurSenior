import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, X, Settings, Info } from 'lucide-react';

import TimetableSetupView from './components/TimetableSetupView';
import ConfigurationSummary from './components/ConfigurationSummary';
import WeeklyTimetableGrid from './components/WeeklyTimetableGrid';
import TimetableSettingsDrawer from './components/TimetableSettingsDrawer';
import TimetableEditorModal from './components/TimetableEditorModal';

const TimetableSettings = ({ isEmbedded = false, semester = null }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const targetSemester = semester || user?.semester || 1;

    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingSlots, setSavingSlots] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Database states
    const [initialConfig, setInitialConfig] = useState(null);
    const [initialSlots, setInitialSlots] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [registeredSubjects, setRegisteredSubjects] = useState([]);

    // Helper to get smart default dates based on the current season
    const getSmartDefaultDates = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed
        if (currentMonth >= 4 && currentMonth <= 9) {
            return {
                start: `${currentYear}-08-01`,
                end: `${currentYear}-11-30`
            };
        } else {
            const yearForEvenSem = (currentMonth === 10 || currentMonth === 11) ? currentYear + 1 : currentYear;
            return {
                start: `${yearForEvenSem}-02-01`,
                end: `${yearForEvenSem}-05-31`
            };
        }
    };

    // Helper to format date string to YYYY-MM-DD
    const formatDateString = (str) => {
        if (!str) return null;
        if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
            return str.trim();
        }
        if (typeof str === 'string' && str.includes('T')) {
            return str.split('T')[0];
        }
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return null;
    };

    // Helper to validate date string format (YYYY-MM-DD)
    const isValidDateString = (str) => {
        if (!str || typeof str !== 'string') return false;
        return /^\d{4}-\d{2}-\d{2}$/.test(str.trim());
    };

    // Editable form states — pre-seed dates from localStorage for instant restore
    const [config, setConfig] = useState(() => {
        const defaults = getSmartDefaultDates();
        const localStart = localStorage.getItem('aus_semStartDate');
        const localEnd = localStorage.getItem('aus_semEndDate');
        return {
            semesterStartDate: formatDateString(localStart) || defaults.start,
            lastWorkingDate: formatDateString(localEnd) || defaults.end,
            collegeStartMinute: 480, // 08:00 AM default
            collegeEndMinute: 1020,  // 05:00 PM default
            classDuration: 50,       // 50 minutes standard
            labDuration: 100,        // 100 minutes standard
            workingDays: {
                '1': 'Full Day',
                '2': 'Full Day',
                '3': 'Full Day',
                '4': 'Full Day',
                '5': 'Full Day',
                '6': 'Half Day',
                '7': 'Holiday'
            },
            breaks: [
                { name: 'Tea Break', startMinute: 660, duration: 15 },
                { name: 'Lunch Break', startMinute: 780, duration: 45 }
            ],
            version: 1,
            hasBackup: false
        };
    });
    const [slots, setSlots] = useState([]);

    // Cell editor popup states
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Slide-over settings drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Modals & previews for configuration regeneration
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [migrateCheckbox, setMigrateCheckbox] = useState(true);
    const [previewSlots, setPreviewSlots] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Timetable Validation Warnings Modal states
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [discrepancies, setDiscrepancies] = useState([]);
    
    // Undo reset states
    const [undoingReset, setUndoingReset] = useState(false);

    // Initial parallel load for instant scheme rendering
    const loadTimetableData = async () => {
        try {
            setIsSyncing(true);
            
            // Execute all endpoints concurrently in parallel for 10x faster load!
            const [configRes, subjRes, regRes, slotsRes] = await Promise.allSettled([
                apiV2.getTimetableConfig(targetSemester),
                apiV2.getAcademicSubjects(targetSemester),
                apiV2.getRegisteredSubjects(targetSemester),
                apiV2.getTimetableSlots(targetSemester)
            ]);

            // 1. Process Config
            if (configRes.status === 'fulfilled' && configRes.value.data?.success && configRes.value.data?.data) {
                const dbConfig = configRes.value.data.data?.config || configRes.value.data.data;
                setInitialConfig(dbConfig);

                const defaults = getSmartDefaultDates();
                const resolvedStart = formatDateString(dbConfig.semesterStartDate) || 
                                      formatDateString(localStorage.getItem('aus_semStartDate')) || 
                                      defaults.start;
                const resolvedEnd   = formatDateString(dbConfig.lastWorkingDate) || 
                                      formatDateString(localStorage.getItem('aus_semEndDate')) || 
                                      defaults.end;

                localStorage.setItem('aus_semStartDate', resolvedStart);
                localStorage.setItem('aus_semEndDate', resolvedEnd);

                setConfig({
                    semesterStartDate: resolvedStart,
                    lastWorkingDate: resolvedEnd,
                    collegeStartMinute: dbConfig.collegeStartMinute ?? 480,
                    collegeEndMinute: dbConfig.collegeEndMinute ?? 1020,
                    classDuration: dbConfig.classDuration ?? 50,
                    labDuration: dbConfig.labDuration ?? 100,
                    workingDays: dbConfig.workingDays || {},
                    breaks: dbConfig.breaks || [],
                    version: dbConfig.version ?? 1,
                    hasBackup: dbConfig.hasBackup ?? false
                });
            }

            // 2. Process Available Subjects
            if (subjRes.status === 'fulfilled' && subjRes.value.data?.success && Array.isArray(subjRes.value.data?.data)) {
                setSubjects(subjRes.value.data.data);
            }

            // 3. Process Registered Subjects
            if (regRes.status === 'fulfilled' && regRes.value.data?.success && Array.isArray(regRes.value.data?.data)) {
                setRegisteredSubjects(regRes.value.data.data);
            }

            // 4. Process Slots
            if (slotsRes.status === 'fulfilled' && slotsRes.value.data?.success && Array.isArray(slotsRes.value.data?.data)) {
                setInitialSlots(slotsRes.value.data.data);
                setSlots(slotsRes.value.data.data);
            }

        } catch (err) {
            console.error('[TimetableSettings] Parallel load error:', err);
        } finally {
            setIsSyncing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadTimetableData();
        }
    }, [user, semester]);

    const handleUndoReset = async () => {
        setUndoingReset(true);
        try {
            const res = await apiV2.undoResetTimetable();
            if (res.data?.success) {
                toast.success('Timetable and attendance logs restored successfully!');
                await loadTimetableData();
            } else {
                toast.error(res.data?.message || 'Failed to undo reset.');
            }
        } catch (err) {
            console.error('Undo Reset error:', err);
            toast.error('An error occurred while undoing the reset.');
        } finally {
            setUndoingReset(false);
        }
    };

    // Derived state determining if user has configuration completed
    const hasConfiguration = useMemo(() => {
        return Boolean(initialConfig?.semesterStartDate);
    }, [initialConfig]);

    // Fallback slots ensuring an empty timetable grid is always displayed even before initial config
    const effectiveSlots = useMemo(() => {
        if (slots && slots.length > 0) return slots;

        const startMin = config?.collegeStartMinute ?? 480; // 08:00 AM
        const endMin = config?.collegeEndMinute ?? 1020;    // 05:00 PM
        const duration = config?.classDuration ?? 50;
        const workingDays = config?.workingDays && Object.keys(config.workingDays).length > 0
            ? config.workingDays 
            : { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

        const defaultSlots = [];
        for (let day = 1; day <= 7; day++) {
            if (!workingDays[day]) continue;
            let current = startMin;
            while (current + duration <= endMin) {
                defaultSlots.push({
                    dayOfWeek: day,
                    startMinute: current,
                    endMinute: current + duration,
                    lectureType: 'Lecture',
                    subject: null,
                    room: '',
                    faculty: '',
                    status: 'Scheduled'
                });
                current += duration;
            }
        }
        return defaultSlots;
    }, [slots, config]);

    // Handle config fields change — persist date fields to localStorage immediately
    const handleConfigChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        if (field === 'semesterStartDate') localStorage.setItem('aus_semStartDate', value);
        if (field === 'lastWorkingDate') localStorage.setItem('aus_semEndDate', value);
    };

    // Handle cell click from the grid layout
    const handleCellClick = (slotObj) => {
        setSelectedSlot(slotObj);
        setIsEditorOpen(true);
    };

    // Calculate if Lab option should be disabled/locked for the active selectedSlot
    const isLabDisabled = useMemo(() => {
        if (!selectedSlot) return true;

        const daySlots = slots.filter(s => s.dayOfWeek === selectedSlot.dayOfWeek);
        daySlots.sort((a, b) => a.startMinute - b.startMinute);

        const currentIdx = daySlots.findIndex(s => s.startMinute === selectedSlot.startMinute);
        if (currentIdx === -1) return true;

        const nextSlot = daySlots[currentIdx + 1];
        
        return !nextSlot || nextSlot.lectureType === 'Break';
    }, [selectedSlot, slots]);

    // Apply cell editor modal changes
    const handleSaveCellChanges = (fields) => {
        if (!selectedSlot) return;

        setSlots(prev => {
            const idx = prev.findIndex(s => s.dayOfWeek === selectedSlot.dayOfWeek && s.startMinute === selectedSlot.startMinute);
            if (idx === -1) return prev;

            const updated = [...prev];

            // If changing FROM lab to theory, break the linked group mapping
            if (selectedSlot.lectureType === 'Lab' && fields.lectureType !== 'Lab' && selectedSlot.sessionGroupId) {
                const pairedIdx = updated.findIndex(s => s.dayOfWeek === selectedSlot.dayOfWeek && s.sessionGroupId === selectedSlot.sessionGroupId && s.startMinute !== selectedSlot.startMinute);
                if (pairedIdx !== -1) {
                    updated[pairedIdx] = {
                        ...updated[pairedIdx],
                        lectureType: 'Lecture',
                        sessionGroupId: null
                    };
                }
            }

            if (fields.lectureType === 'Lab') {
                // Generate a unique session group identifier to lock slots together
                const grpId = Math.random().toString(36).substring(2, 9);

                const daySlots = updated.filter(s => s.dayOfWeek === selectedSlot.dayOfWeek);
                daySlots.sort((a, b) => a.startMinute - b.startMinute);
                const dayIdx = daySlots.findIndex(s => s.startMinute === selectedSlot.startMinute);
                const nextSlot = daySlots[dayIdx + 1];

                if (nextSlot && nextSlot.lectureType !== 'Break') {
                    const globalNextIdx = updated.findIndex(s => s.dayOfWeek === nextSlot.dayOfWeek && s.startMinute === nextSlot.startMinute);
                    if (globalNextIdx !== -1) {
                        updated[globalNextIdx] = {
                            ...updated[globalNextIdx],
                            subject: fields.subject || null,
                            room: fields.room || '',
                            faculty: fields.faculty || '',
                            lectureType: 'Lab',
                            status: 'Scheduled',
                            sessionGroupId: grpId
                        };
                    }
                }

                updated[idx] = {
                    ...updated[idx],
                    subject: fields.subject || null,
                    room: fields.room || '',
                    faculty: fields.faculty || '',
                    lectureType: 'Lab',
                    status: 'Scheduled',
                    sessionGroupId: grpId
                };
            } else {
                updated[idx] = {
                    ...updated[idx],
                    subject: fields.subject || null,
                    room: fields.room || '',
                    faculty: fields.faculty || '',
                    lectureType: fields.lectureType || 'Lecture',
                    status: 'Scheduled',
                    sessionGroupId: null
                };
            }

            return updated;
        });

        setIsEditorOpen(false);
    };

    // Reset/Clear selected class slot values
    const handleClearCell = () => {
        if (!selectedSlot) return;

        setSlots(prev => {
            const idx = prev.findIndex(s => s.dayOfWeek === selectedSlot.dayOfWeek && s.startMinute === selectedSlot.startMinute);
            if (idx === -1) return prev;

            const updated = [...prev];

            // If slot is paired within a session group, clear the partner slot as well
            if (selectedSlot.sessionGroupId) {
                const pairedIdx = updated.findIndex(s => s.dayOfWeek === selectedSlot.dayOfWeek && s.sessionGroupId === selectedSlot.sessionGroupId && s.startMinute !== selectedSlot.startMinute);
                if (pairedIdx !== -1) {
                    updated[pairedIdx] = {
                        ...updated[pairedIdx],
                        subject: null,
                        room: '',
                        faculty: '',
                        lectureType: 'Lecture',
                        status: 'Scheduled',
                        sessionGroupId: null
                    };
                }
            }

            updated[idx] = {
                ...updated[idx],
                subject: null,
                room: '',
                faculty: '',
                lectureType: 'Lecture',
                status: 'Scheduled',
                sessionGroupId: null
            };

            return updated;
        });
    };

    // Check if configuration parameters differ from database values
    const isConfigChanged = useMemo(() => {
        if (!initialConfig) return true;

        const d1 = config.semesterStartDate ? new Date(config.semesterStartDate).getTime() : 0;
        const d1Db = initialConfig.semesterStartDate ? new Date(initialConfig.semesterStartDate).getTime() : 0;

        const d2 = config.lastWorkingDate ? new Date(config.lastWorkingDate).getTime() : 0;
        const d2Db = initialConfig.lastWorkingDate ? new Date(initialConfig.lastWorkingDate).getTime() : 0;

        if (d1 !== d1Db || d2 !== d2Db) return true;
        if (config.collegeStartMinute !== initialConfig.collegeStartMinute) return true;
        if (config.collegeEndMinute !== initialConfig.collegeEndMinute) return true;
        if (config.classDuration !== initialConfig.classDuration) return true;
        if (config.labDuration !== initialConfig.labDuration) return true;

        const daysKeys = ['1', '2', '3', '4', '5', '6', '7'];
        const daysChanged = daysKeys.some(k => {
            const localVal = config.workingDays[k] || 'Holiday';
            const dbVal = initialConfig.workingDays[k] || 'Holiday';
            return localVal !== dbVal;
        });
        if (daysChanged) return true;

        if (config.breaks.length !== (initialConfig.breaks?.length || 0)) return true;
        const breaksChanged = config.breaks.some((b, idx) => {
            const dbB = initialConfig.breaks[idx];
            return !dbB || b.name !== dbB.name || b.startMinute !== dbB.startMinute || b.duration !== dbB.duration;
        });
        
        return breaksChanged;
    }, [config, initialConfig]);

    // Check if slot subject/room/faculty assignments differ from database
    const isSlotsChanged = useMemo(() => {
        if (isConfigChanged) return false;
        
        return slots.some(s => {
            const initial = initialSlots.find(db => db._id === s._id);
            if (!initial) return true;
            
            const localSubj = s.subject?._id || s.subject || null;
            const dbSubj = initial.subject?._id || initial.subject || null;
            
            return localSubj !== dbSubj ||
                   (s.room || '') !== (initial.room || '') ||
                   (s.faculty || '') !== (initial.faculty || '') ||
                   (s.lectureType || 'Lecture') !== (initial.lectureType || 'Lecture') ||
                   (s.sessionGroupId || null) !== (initial.sessionGroupId || null);
        });
    }, [slots, initialSlots, isConfigChanged]);

    const daysNameMap = {
        1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'
    };

    const formatTime = (mins) => {
        if (mins === undefined || mins === null) return '';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Triggers generation preview modal
    const handleGeneratePreviewTrigger = async () => {
        setLoadingPreview(true);
        setShowPreviewModal(true);
        try {
            const res = await apiV2.generateTimetablePreview(config);
            if (res.data?.success && Array.isArray(res.data?.data)) {
                setPreviewSlots(res.data.data);
            }
        } catch (err) {
            console.error('[TimetableSettings] Preview error:', err);
            toast.error('Failed to generate slots preview.');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Unified settings drawer save changes button click
    const handleDrawerSave = async (draftRegistered) => {
        setSavingConfig(true);
        try {
            // 1. Save Registered Subjects First
            const payload = {
                subjects: draftRegistered.map(d => ({
                    _id: d._id?.startsWith('custom-') ? null : d._id, // clear temp custom prefix
                    subjectId: d.subjectId,
                    customName: d.customName,
                    customCode: d.customCode,
                    credits: d.credits,
                    category: d.category,
                    weeklyPlan: d.weeklyPlan
                }))
            };
            const regRes = await apiV2.saveRegisteredSubjects(payload);
            if (regRes.data?.success && Array.isArray(regRes.data?.data)) {
                setRegisteredSubjects(regRes.data.data);
                
                // Refresh local slots since backend updates may have cleared deselected subjects
                const slotsRes = await apiV2.getTimetableSlots();
                if (slotsRes.data?.success && Array.isArray(slotsRes.data?.data)) {
                    setInitialSlots(slotsRes.data.data);
                    setSlots(slotsRes.data.data);
                }
            }

            // 2. Check if schedule configuration also changed
            if (isConfigChanged) {
                // Keep drawer open, open preview regeneration modal
                handleGeneratePreviewTrigger();
            } else {
                // Close settings drawer, only subjects changed
                setIsDrawerOpen(false);
                toast.success('Registered subjects updated successfully!');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save registered subjects.';
            toast.error(msg);
        } finally {
            setSavingConfig(false);
        }
    };

    // Save configuration and regenerate slots structure
    const handleRegenerateSave = async () => {
        setSavingConfig(true);
        try {
            const payload = {
                ...config,
                migrateSubjects: migrateCheckbox
            };
            const res = await apiV2.saveTimetableConfig(payload);
            if (res.data?.success && res.data?.data) {
                const { config: savedConf, slots: generatedSlots } = res.data.data;
                setInitialConfig(savedConf);
                setInitialSlots(generatedSlots);
                setSlots(generatedSlots);
                
                setConfig({
                    semesterStartDate: savedConf.semesterStartDate || '',
                    lastWorkingDate: savedConf.lastWorkingDate || '',
                    collegeStartMinute: savedConf.collegeStartMinute ?? 480,
                    collegeEndMinute: savedConf.collegeEndMinute ?? 1020,
                    classDuration: savedConf.classDuration ?? 50,
                    workingDays: savedConf.workingDays || {},
                    breaks: savedConf.breaks || [],
                    version: savedConf.version ?? 1
                });

                setShowPreviewModal(false);
                setIsDrawerOpen(false);
                toast.success('Timetable configuration and regenerated slots saved!');
                setSuccessMsg('Timetable created');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save configuration parameters.';
            toast.error(msg);
        } finally {
            setSavingConfig(false);
        }
    };

    // Onboarding setup config save
    const handleInitialSetupSave = async () => {
        if (!config.semesterStartDate || !config.lastWorkingDate) {
            toast.error('Please specify the semester start date and last working day.');
            return;
        }
        if (config.lastWorkingDate <= config.semesterStartDate) {
            toast.error('Last Working Day must be after Semester Start Date.');
            return;
        }
        setSavingConfig(true);
        try {
            const payload = {
                ...config,
                migrateSubjects: false
            };
            const res = await apiV2.saveTimetableConfig(payload);
            if (res.data?.success && res.data?.data) {
                const { config: savedConf, slots: generatedSlots } = res.data.data;
                setInitialConfig(savedConf);
                setInitialSlots(generatedSlots);
                setSlots(generatedSlots);
                
                setConfig({
                    semesterStartDate: savedConf.semesterStartDate || '',
                    lastWorkingDate: savedConf.lastWorkingDate || '',
                    collegeStartMinute: savedConf.collegeStartMinute ?? 480,
                    collegeEndMinute: savedConf.collegeEndMinute ?? 1020,
                    classDuration: savedConf.classDuration ?? 50,
                    workingDays: savedConf.workingDays || {},
                    breaks: savedConf.breaks || [],
                    version: savedConf.version ?? 1
                });
                
                toast.success('Timetable created successfully!');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save timetable configuration.';
            toast.error(msg);
        } finally {
            setSavingConfig(false);
        }
    };

    // Save slot assignments bulk update with progress checklist validation
    const handleSaveAssignments = async (e, forceSave = false) => {
        if (e) e.preventDefault();
        
        // 1. Run assignment progress validation
        if (!forceSave) {
            const validationDiscrepancies = [];
            registeredSubjects.forEach(reg => {
                const subjId = (reg.subject?._id || reg.subject || '').toString();
                const name = reg.customName || reg.subject?.name || 'Unknown';
                
                const theoryAssigned = slots.filter(s => {
                    const slotSubjId = (s.subject?._id || s.subject || '').toString();
                    return slotSubjId === subjId && s.lectureType !== 'Lab' && s.lectureType !== 'Break';
                }).length;

                const labAssigned = Math.floor(slots.filter(s => {
                    const slotSubjId = (s.subject?._id || s.subject || '').toString();
                    return slotSubjId === subjId && s.lectureType === 'Lab';
                }).length / 2);

                const theoryRequired = reg.weeklyPlan?.theory?.required ?? 0;
                const labRequired = reg.weeklyPlan?.lab?.required ?? 0;

                if (theoryAssigned < theoryRequired) {
                    validationDiscrepancies.push({
                        name,
                        type: 'Theory',
                        required: theoryRequired,
                        assigned: theoryAssigned,
                        missing: theoryRequired - theoryAssigned
                    });
                }
                if (labAssigned < labRequired) {
                    validationDiscrepancies.push({
                        name,
                        type: 'Lab',
                        required: labRequired,
                        assigned: labAssigned,
                        missing: labRequired - labAssigned
                    });
                }
            });

            if (validationDiscrepancies.length > 0) {
                setDiscrepancies(validationDiscrepancies);
                setShowValidationModal(true);
                return;
            }
        }

        setSavingSlots(true);
        try {
            const res = await apiV2.updateTimetableSlots({ slots });
            if (res.data?.success && Array.isArray(res.data?.data)) {
                const updated = res.data.data;
                setInitialSlots(updated);
                setSlots(updated);
                toast.success('Slots assignments saved successfully!');
                setSuccessMsg('Assignments saved');
                setTimeout(() => setSuccessMsg(''), 3000);
                setShowValidationModal(false);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save slots assignments.';
            toast.error(msg);
        } finally {
            setSavingSlots(false);
        }
    };

    // Last updated computed string
    const lastUpdatedStr = useMemo(() => {
        if (!initialConfig) return null;
        
        const dates = [
            initialConfig.updatedAt ? new Date(initialConfig.updatedAt) : null,
            ...initialSlots.map(s => s.updatedAt ? new Date(s.updatedAt) : null)
        ].filter(d => d !== null);

        if (dates.length === 0) return null;
        const maxDate = new Date(Math.max(...dates));

        return maxDate.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }, [initialConfig, initialSlots]);

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: '#a78bfa' }} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                            Academic Timetable
                        </h2>
                        {isSyncing && (
                            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(167, 139, 250, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                                <Loader2 size={11} className="animate-spin" />
                                Syncing...
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                        {hasConfiguration 
                            ? 'Manage your weekly schedule grid and class assignments' 
                            : 'Configure your college working hours to generate your weekly schedule'
                        }
                    </span>
                </div>
            </div>

            {/* Undo Reset Banner */}
            {config?.hasBackup && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    width: '100%',
                    marginTop: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ color: '#fff', fontSize: '13px' }}>Timetable Setup Reset</strong>
                            <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                Your setup was reset. You can undo this action within 24 hours to restore all slots and attendance logs.
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleUndoReset}
                        disabled={undoingReset}
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: undoingReset ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                        }}
                    >
                        {undoingReset && <Loader2 size={12} className="animate-spin" />}
                        Undo Reset
                    </button>
                </div>
            )}

            {/* Timetable Workspace (Always shows clean timetable grid) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Configuration Summary Strip */}
                {hasConfiguration ? (
                    <ConfigurationSummary 
                        config={config} 
                        onEditClick={() => setIsDrawerOpen(true)} 
                    />
                ) : (
                    <div style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Info size={16} style={{ color: '#a78bfa' }} />
                            <span style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                                Showing default schedule (Mon–Sat, 08:00 AM – 05:00 PM). Click any cell to assign subjects.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Configure Hours
                        </button>
                    </div>
                )}

                    {/* Weekly Grid Form */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveAssignments(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                        
                        {/* Floating Save Changes Bar */}
                        {isSlotsChanged && (
                            <div style={{
                                position: 'sticky',
                                top: '0',
                                zIndex: 10,
                                background: 'rgba(245, 158, 11, 0.1)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                animation: 'fadeIn 0.2s',
                                boxSizing: 'border-box',
                                width: '100%'
                            }}>
                                <span style={{ color: '#fbbf24', fontSize: '12.5px', fontWeight: 600 }}>
                                    You have unsaved timetable changes.
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSlots(initialSlots)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: 'rgba(255,255,255,0.7)',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingSlots}
                                        style={{
                                            background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 16px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {savingSlots && <Loader2 size={12} className="animate-spin" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {successMsg && !isSlotsChanged && (
                            <div style={{ 
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                color: '#10b981', 
                                fontSize: '12.5px', 
                                fontWeight: 600,
                                boxSizing: 'border-box',
                                width: '100%'
                            }}>
                                <CheckCircle2 size={14} />
                                {successMsg}
                            </div>
                        )}

                        <WeeklyTimetableGrid 
                            slots={effectiveSlots} 
                            config={config}
                            subjects={registeredSubjects.map(r => r.subject).filter(Boolean)}
                            registeredSubjects={registeredSubjects}
                            onCellClick={handleCellClick} 
                            user={user}
                        />

                        {/* Last updated summary info at bottom */}
                        {lastUpdatedStr && (
                            <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.35)', fontWeight: 500, textAlign: 'right', marginTop: '4px' }}>
                                Last updated: {lastUpdatedStr}
                            </div>
                        )}
                    </form>

                    {/* Sliding settings drawer for returning users */}
                    <TimetableSettingsDrawer 
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        config={config}
                        onChange={handleConfigChange}
                        onSave={handleDrawerSave}
                        saving={savingConfig}
                        isConfigChanged={isConfigChanged}
                        user={user}
                        subjects={subjects}
                        registeredSubjects={registeredSubjects}
                        onReset={loadTimetableData}
                    />

                </div>

            {/* Popup Cell Editor Modal */}
            <TimetableEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveCellChanges}
                onClear={handleClearCell}
                slot={selectedSlot}
                registeredSubjects={registeredSubjects}
                slots={slots}
                isLabDisabled={isLabDisabled}
            />

            {/* Incomplete Plan Warnings validation modal */}
            {showValidationModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    boxSizing: 'border-box'
                }} onClick={() => setShowValidationModal(false)}>
                    <div style={{
                        background: '#13111A',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '440px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        animation: 'modalFadeIn 0.25s ease-out',
                        boxSizing: 'border-box'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                                Incomplete Timetable Plan
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowValidationModal(false)}
                                style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{
                            padding: '20px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            fontSize: '13px',
                            color: 'rgba(148, 163, 184, 0.85)',
                            lineHeight: '1.4'
                        }}>
                            <span>
                                Some of your registered subjects do not meet the weekly planned schedule requirements:
                            </span>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxHeight: '180px',
                                overflowY: 'auto',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '8px',
                                padding: '10px'
                            }}>
                                {discrepancies.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{d.name} ({d.type})</span>
                                        <span style={{ color: '#fbbf24' }}>
                                            Assigned: {d.assigned} / {d.required} (Missing {d.missing})
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <span>
                                Are you sure you want to save the timetable with these incomplete assignments?
                            </span>
                        </div>
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowValidationModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    padding: '6px 14px'
                                }}
                            >
                                Cancel & Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveAssignments(null, true)}
                                disabled={savingSlots}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    color: '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    padding: '6px 18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {savingSlots && <Loader2 size={12} className="animate-spin" />}
                                Save Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Preview & Migration Modal */}
            {showPreviewModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    boxSizing: 'border-box'
                }} onClick={() => setShowPreviewModal(false)}>
                    
                    <div style={{
                        background: '#13111A',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '540px',
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
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                Regenerate Timetable Structure
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
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
                            gap: '16px',
                            fontSize: '13px',
                            color: 'rgba(148, 163, 184, 0.85)',
                            lineHeight: '1.4'
                        }}>
                            <span>
                                You have changed configuration parameters. Regeneration will delete current timetable slots and create a new weekly structure based on your new parameters.
                            </span>

                            {/* Migrate checkbox */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(139, 92, 246, 0.05)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                cursor: 'pointer',
                                color: '#c4b5fd'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={migrateCheckbox}
                                    onChange={(e) => setMigrateCheckbox(e.target.checked)}
                                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 600 }}>
                                    Keep current subject assignments where times match? (Recommended)
                                </span>
                            </label>

                            {/* Preview Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>
                                    Preview of new weekly slots structure:
                                </span>
                                
                                {loadingPreview ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                        <Loader2 className="animate-spin" size={20} style={{ color: '#a78bfa' }} />
                                    </div>
                                ) : (
                                    <div style={{
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '8px',
                                        maxHeight: '180px',
                                        overflowY: 'auto',
                                        background: 'rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        fontSize: '12px'
                                    }}>
                                        {previewSlots.map((s, i) => (
                                            <div 
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderBottom: i < previewSlots.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                                                }}
                                            >
                                                <span style={{ fontWeight: 600, color: '#a78bfa' }}>
                                                    {daysNameMap[s.dayOfWeek]}
                                                </span>
                                                <span style={{ color: '#fff' }}>
                                                    {formatTime(s.startMinute)} – {formatTime(s.endMinute)}
                                                </span>
                                                <span style={{ color: s.lectureType === 'Break' ? '#fbbf24' : '#10b981', fontWeight: 500 }}>
                                                    {s.lectureType}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    padding: '6px 14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRegenerateSave}
                                disabled={savingConfig || loadingPreview}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    color: '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    padding: '6px 18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {savingConfig && <Loader2 size={12} className="animate-spin" />}
                                Save & Regenerate
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
            `}} />
        </div>
    );
};

export default TimetableSettings;
