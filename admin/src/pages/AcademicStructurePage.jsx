import React, { useState, useEffect, useMemo } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { isSuperAdmin, hasPermission } from '../utils/permissions';
import {
  GraduationCap,
  Calendar,
  Layers,
  Users,
  Shield,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  CalendarCheck2,
  Clock,
  Edit2,
  X,
  BookOpen,
  Save,
  FileCheck,
  Archive,
  MapPin,
  UserCheck,
  Sliders,
  Check,
  Coffee,
  Sparkles,
  Lock,
  Eye
} from 'lucide-react';


export default function AcademicStructurePage() {
  const { admin } = useAdminAuth();
  const isSuper = isSuperAdmin(admin);
  const canCreate = isSuper || hasPermission(admin, 'academic_structure', 'create');
  const canUpdate = isSuper || hasPermission(admin, 'academic_structure', 'update');
  const canDelete = isSuper || hasPermission(admin, 'academic_structure', 'delete');
  const canCreateSemester = isSuper || hasPermission(admin, 'semesters', 'create') || canCreate;
  const canUpdateSemester = isSuper || hasPermission(admin, 'semesters', 'update') || canUpdate;
  const canDeleteSemester = isSuper || hasPermission(admin, 'semesters', 'finalize') || canDelete;
  const canViewEvents = isSuper || hasPermission(admin, 'events', 'view') || canCreate;
  const canCreateEvents = isSuper || hasPermission(admin, 'events', 'create') || canCreate;
  const canUpdateEvents = isSuper || hasPermission(admin, 'events', 'update') || canUpdate;
  const canDeleteEvents = isSuper || hasPermission(admin, 'events', 'delete') || canDelete;

  const [activeTab, setActiveTab] = useState(isSuper ? 'batches' : 'timetable_structure');

  useEffect(() => {
    if (!isSuper && (activeTab === 'batches' || activeTab === 'sections' || activeTab === 'semesters')) {
      setActiveTab('timetable_structure');
    }
  }, [isSuper, activeTab]);

  const [sitCollege, setSitCollege] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states (Pre-linked to SIT)
  const currentYear = new Date().getFullYear();
  const [newBatch, setNewBatch] = useState({ admissionYear: currentYear, graduationYear: currentYear + 4 });
  const [newSection, setNewSection] = useState({ batchId: '', semester: 1, branchId: '', name: 'A', room: '', capacity: 60 });
  const [sectionBatchFilter, setSectionBatchFilter] = useState('ALL');
  const [sectionSemesterFilter, setSectionSemesterFilter] = useState('ALL');
  const [sectionBranchFilter, setSectionBranchFilter] = useState('ALL');
  const [sectionStatusFilter, setSectionStatusFilter] = useState('ALL');
  const [newSemester, setNewSemester] = useState({ batchId: '', number: 1, startDate: '', endDate: '', status: 'Upcoming' });
  const [semesterBatchFilter, setSemesterBatchFilter] = useState('ALL');

  // Edit modal states
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);


  // Step 5: Events state (Canonical Architecture)
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsScopeFilter, setEventsScopeFilter] = useState('ALL'); // 'ALL' | 'GLOBAL' | 'SEMESTER'
  const [eventsTypeFilter, setEventsTypeFilter] = useState('ALL');
  const [eventsStatusFilter, setEventsStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CANCELLED' | 'ARCHIVED'
  const [eventsSemesterFilter, setEventsSemesterFilter] = useState('ALL');
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventFormError, setEventFormError] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    eventType: 'College Event',
    scope: 'GLOBAL',
    academicSemesterId: '',
    allDay: true,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    description: '',
    status: 'ACTIVE'
  });

  // Step 5: Section Timetable state

  // Step 5: Section Timetable state
  const [ttBatchId, setTtBatchId] = useState('');
  const [ttSemesterNum, setTtSemesterNum] = useState('');
  const [ttBranchId, setTtBranchId] = useState('');
  const [ttSectionId, setTtSectionId] = useState('');
  const [ttLoading, setTtLoading] = useState(false);
  const [ttData, setTtData] = useState(null);
  const [ttSlots, setTtSlots] = useState({});
  const [editingSlotKey, setEditingSlotKey] = useState(null);
  const [slotForm, setSlotForm] = useState({
    subject: '',
    faculty: '',
    room: '',
    classType: 'Theory',
    lectureType: 'Theory',
    batchGroup: 'ALL',
    spanConsecutive: false
  });
  const [ttSaving, setTtSaving] = useState(false);

  // Institutional Timetable Structure & Settings state
  const [timetableStructure, setTimetableStructure] = useState(null);
  const [ttSubView, setTtSubView] = useState('structure'); // 'structure' | 'sections'
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureSaving, setStructureSaving] = useState(false);
  const [draftWorkingDays, setDraftWorkingDays] = useState([]);
  const [draftCollegeStartMinute, setDraftCollegeStartMinute] = useState(480);
  const [draftCollegeEndMinute, setDraftCollegeEndMinute] = useState(960);
  const [draftClassDuration, setDraftClassDuration] = useState(50);
  const [draftLabDuration, setDraftLabDuration] = useState(100);
  const [draftBreaks, setDraftBreaks] = useState([
    { id: 'brk_morning', name: 'Morning Break', startMinute: 580, duration: 20, endMinute: 600, status: 'Active' },
    { id: 'brk_lunch', name: 'Lunch Break', startMinute: 700, duration: 60, endMinute: 760, status: 'Active' }
  ]);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Resolve "Common to All" branch (used for 1st-year curriculum)
  const commonBranch = useMemo(() => {
    return branches.find(b => 
      (b.shortName && b.shortName.toUpperCase() === 'COMMON') || 
      (b.code && b.code.toUpperCase() === 'COMMON') ||
      (b.name && b.name.toLowerCase().includes('common'))
    ) || null;
  }, [branches]);

  const commonBranchId = commonBranch?._id?.toString() || '';

  // Resolve normal admin's assigned department / branch
  const adminAllocatedBranch = useMemo(() => {
    if (!admin || !branches.length) return null;
    
    // 1. If admin.department is an object or string
    let deptId = '';
    if (admin.department) {
      deptId = typeof admin.department === 'object' ? (admin.department._id?.toString() || '') : admin.department.toString();
    }
    
    // 2. Check admin.scopes
    if (!deptId && admin.scopes?.length) {
      const scopeBranch = admin.scopes.find(s => s.branch)?.branch;
      if (scopeBranch) {
        deptId = typeof scopeBranch === 'object' ? (scopeBranch._id?.toString() || '') : scopeBranch.toString();
      }
    }

    // 3. Check admin.branchId
    if (!deptId && admin.branchId) {
      deptId = admin.branchId.toString();
    }

    if (deptId) {
      const found = branches.find(b => b._id?.toString() === deptId);
      if (found) return found;
    }

    // 4. Match by code/shortName
    const code = admin.department?.shortName || admin.department?.code || admin.departmentCode;
    if (code && code.toUpperCase() !== 'ALL') {
      const found = branches.find(b => 
        (b.shortName && b.shortName.toUpperCase() === code.toUpperCase()) ||
        (b.code && b.code.toUpperCase() === code.toUpperCase())
      );
      if (found) return found;
    }

    // 5. Match by department name
    const deptName = admin.department?.name;
    if (deptName) {
      const found = branches.find(b => b.name && b.name.toLowerCase() === deptName.toLowerCase());
      if (found) return found;
    }

    return null;
  }, [admin, branches]);

  const adminAllocatedBranchId = adminAllocatedBranch?._id?.toString() || '';

  // For branch admins, keep their allocated branch selected
  useEffect(() => {
    if (!isSuper && adminAllocatedBranchId && ttBranchId !== adminAllocatedBranchId) {
      setTtBranchId(adminAllocatedBranchId);
    }
  }, [isSuper, adminAllocatedBranchId, ttBranchId]);

  const displayedSemesters = useMemo(() => {
    if (!semesterBatchFilter || semesterBatchFilter === 'ALL') return semesters;
    return semesters.filter((s) => String(s.batch?._id || s.batch) === String(semesterBatchFilter));
  }, [semesters, semesterBatchFilter]);

  const availableSemestersForSectionFilter = useMemo(() => {
    if (!sectionBatchFilter || sectionBatchFilter === 'ALL') return semesters;
    return semesters.filter((s) => String(s.batch?._id || s.batch) === String(sectionBatchFilter));
  }, [semesters, sectionBatchFilter]);

  const displayedSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchBatch = sectionBatchFilter === 'ALL' || String(sec.batch?._id || sec.batch) === String(sectionBatchFilter);
      const matchSem = sectionSemesterFilter === 'ALL' || Number(sec.semester) === Number(sectionSemesterFilter);
      const matchBranch = sectionBranchFilter === 'ALL' || String(sec.branch?._id || sec.branch) === String(sectionBranchFilter);
      const matchStatus = sectionStatusFilter === 'ALL' || sec.status === sectionStatusFilter;
      return matchBatch && matchSem && matchBranch && matchStatus;
    });
  }, [sections, sectionBatchFilter, sectionSemesterFilter, sectionBranchFilter, sectionStatusFilter]);

  const fetchTimetableStructure = async () => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/timetable-structure', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTimetableStructure(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch timetable structure:', err);
    }
  };

  const handleSaveStructure = async (updatedPayload) => {
    setStructureSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const payloadToSend = {
        name: updatedPayload.name,
        collegeStartMinute: Number(updatedPayload.collegeStartMinute ?? 480),
        collegeEndMinute: Number(updatedPayload.collegeEndMinute ?? 960),
        classDuration: Number(updatedPayload.classDuration ?? 50),
        labDuration: Number(updatedPayload.labDuration ?? 100),
        workingDays: (updatedPayload.workingDays || []).map(wd => ({
          dayOfWeek: Number(wd.dayOfWeek),
          dayName: wd.dayName,
          status: wd.status === 'Holiday' ? 'Non-Working' : wd.status
        })),
        breaks: (updatedPayload.breaks || []).map(b => ({
          name: b.name,
          startMinute: Number(b.startMinute),
          duration: Number(b.duration || (b.endMinute ? b.endMinute - b.startMinute : 15)),
          endMinute: Number(b.endMinute || (Number(b.startMinute) + Number(b.duration || 15)))
        }))
      };

      const res = await fetch('/api/academic/structure/timetable-structure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payloadToSend)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Institutional timetable structure updated successfully!' });
        setTimetableStructure(data.data);
        setEditingStructure(null);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update timetable structure' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setStructureSaving(false);
    }
  };

  // Time conversion helpers (matches student-academics settings at /student-academics/settings)
  const minutesToTime = (mins) => {
    if (mins === undefined || mins === null) return '08:00';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 480;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  };

  const formatTime12 = (mins) => {
    if (mins === undefined || mins === null) return '';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Compute periods dynamically from start, end, duration, and breaks
  const computePeriodsPreview = (startMin, endMin, duration, breaksList = []) => {
    const periods = [];
    const start = Number(startMin ?? 480);
    const end = Number(endMin ?? 960);
    const dur = Number(duration ?? 50);

    const normalizedBreaks = (breaksList || []).map(b => {
      const s = Number(b.startMinute);
      const d = Number(b.duration || (b.endMinute ? b.endMinute - s : 15));
      const e = Number(b.endMinute || (s + d));
      return { name: b.name || 'Break', startMinute: s, endMinute: e, duration: d };
    }).sort((a, b) => a.startMinute - b.startMinute);

    let current = start;
    let pNum = 1;

    while (current + dur <= end) {
      const activeBreak = normalizedBreaks.find(b => current >= b.startMinute && current < b.endMinute);
      if (activeBreak) {
        current = activeBreak.endMinute;
        continue;
      }
      const upcomingBreak = normalizedBreaks.find(b => b.startMinute > current && b.startMinute < current + dur);
      if (upcomingBreak) {
        current = upcomingBreak.endMinute;
        continue;
      }
      const periodEnd = current + dur;
      periods.push({
        periodNumber: pNum,
        name: `Period ${pNum}`,
        startMinute: current,
        endMinute: periodEnd,
        timeSlot: `${minutesToTime(current)}–${minutesToTime(periodEnd)}`
      });
      current = periodEnd;
      pNum++;
    }
    return periods;
  };

  // Synchronize draft settings from institutional timetable structure
  const syncSettingsDraft = (struct) => {
    if (!struct) return;
    const workingDays = (struct.workingDays || [
      { dayOfWeek: 1, dayName: 'Monday', status: 'Full Day' },
      { dayOfWeek: 2, dayName: 'Tuesday', status: 'Full Day' },
      { dayOfWeek: 3, dayName: 'Wednesday', status: 'Full Day' },
      { dayOfWeek: 4, dayName: 'Thursday', status: 'Full Day' },
      { dayOfWeek: 5, dayName: 'Friday', status: 'Full Day' },
      { dayOfWeek: 6, dayName: 'Saturday', status: 'Half Day' },
      { dayOfWeek: 7, dayName: 'Sunday', status: 'Non-Working' },
    ]).map(wd => ({
      dayOfWeek: Number(wd.dayOfWeek),
      dayName: wd.dayName,
      status: wd.dayOfWeek === 7 ? 'Non-Working' : (wd.status === 'Holiday' ? 'Non-Working' : wd.status),
      maxPeriods: wd.maxPeriods || 4
    }));
    setDraftWorkingDays(workingDays);

    const startMin = struct.collegeStartMinute ?? (struct.periods?.[0]?.startMinute ?? 480);
    setDraftCollegeStartMinute(Number(startMin));

    const endMin = struct.collegeEndMinute ?? (struct.periods?.[struct.periods.length - 1]?.endMinute ?? 960);
    setDraftCollegeEndMinute(Number(endMin));

    const cDur = struct.classDuration ?? (struct.periods?.[0] ? (struct.periods[0].endMinute - struct.periods[0].startMinute) : 50);
    setDraftClassDuration(Number(cDur));

    setDraftLabDuration(Number(struct.labDuration ?? 100));

    let breaksList = [];
    if (Array.isArray(struct.breaks) && struct.breaks.length > 0) {
      breaksList = struct.breaks.map((b, idx) => ({
        id: b.id || `break_${idx + 1}`,
        name: b.name || `Break ${idx + 1}`,
        startMinute: Number(b.startMinute),
        duration: Number(b.duration || (b.endMinute ? b.endMinute - b.startMinute : 15)),
        endMinute: Number(b.endMinute || (Number(b.startMinute) + Number(b.duration || 15))),
        status: b.status || 'Active'
      }));
    } else if (Array.isArray(struct.timeline) && struct.timeline.some(t => t.type === 'break')) {
      breaksList = struct.timeline.filter(t => t.type === 'break').map((b, idx) => ({
        id: b.id || `break_${idx + 1}`,
        name: b.name || `Break ${idx + 1}`,
        startMinute: Number(b.startMinute),
        duration: Number(b.duration || (b.endMinute ? b.endMinute - b.startMinute : 15)),
        endMinute: Number(b.endMinute || (Number(b.startMinute) + Number(b.duration || 15))),
        status: b.status || 'Active'
      }));
    } else {
      breaksList = [
        { id: 'brk_morning', name: 'Morning Break', startMinute: 580, duration: 20, endMinute: 600, status: 'Active' },
        { id: 'brk_lunch', name: 'Lunch Break', startMinute: 700, duration: 60, endMinute: 760, status: 'Active' }
      ];
    }
    breaksList.sort((a, b) => a.startMinute - b.startMinute);
    setDraftBreaks(breaksList);
  };

  useEffect(() => {
    if (timetableStructure) {
      syncSettingsDraft(timetableStructure);
    }
  }, [timetableStructure]);

  // Derived: auto-calculated periods
  const calculatedPeriods = useMemo(() => {
    return computePeriodsPreview(
      draftCollegeStartMinute,
      draftCollegeEndMinute,
      draftClassDuration,
      draftBreaks
    );
  }, [draftCollegeStartMinute, draftCollegeEndMinute, draftClassDuration, draftBreaks]);

  // Derived: combined timeline items for preview
  const activeTimelineItems = useMemo(() => {
    const periods = calculatedPeriods.map(p => ({
      type: 'period',
      id: `p${p.periodNumber}`,
      periodNumber: p.periodNumber,
      name: p.name,
      startMinute: p.startMinute,
      endMinute: p.endMinute,
      duration: p.endMinute - p.startMinute,
      timeSlot: p.timeSlot,
      status: 'Active'
    }));

    const breaks = (draftBreaks || []).filter(b => b.status !== 'Retired').map((b, idx) => ({
      type: 'break',
      id: b.id || `break_${idx + 1}`,
      name: b.name || 'Break',
      startMinute: Number(b.startMinute),
      endMinute: Number(b.endMinute || (Number(b.startMinute) + Number(b.duration || 15))),
      duration: Number(b.duration || (b.endMinute ? b.endMinute - b.startMinute : 15)),
      status: 'Active'
    }));

    return [...periods, ...breaks].sort((a, b) => a.startMinute - b.startMinute);
  }, [calculatedPeriods, draftBreaks]);

  // Derived: Saturday policy & periods
  const saturdayWorkingDay = useMemo(() => {
    return draftWorkingDays.find(w => w.dayOfWeek === 6);
  }, [draftWorkingDays]);

  const saturdayPeriods = useMemo(() => {
    if (!saturdayWorkingDay || saturdayWorkingDay.status === 'Non-Working') return [];
    if (saturdayWorkingDay.status === 'Full Day') return calculatedPeriods;

    // Half Day: periods before lunch or maxPeriods (default 4)
    const lunch = (draftBreaks || []).find(b => b.name && b.name.toLowerCase().includes('lunch'));
    if (lunch) {
      const preLunch = calculatedPeriods.filter(p => p.endMinute <= lunch.startMinute);
      if (preLunch.length > 0) return preLunch;
    }
    const maxP = saturdayWorkingDay.maxPeriods || 4;
    return calculatedPeriods.slice(0, maxP);
  }, [saturdayWorkingDay, calculatedPeriods, draftBreaks]);

  const isSettingsDirty = useMemo(() => {
    if (!timetableStructure) return false;

    // Working days comparison
    const origWd = (timetableStructure.workingDays || []).map(w => ({
      dayOfWeek: w.dayOfWeek,
      status: w.dayOfWeek === 7 ? 'Non-Working' : (w.status === 'Holiday' ? 'Non-Working' : w.status)
    }));
    const curWd = draftWorkingDays.map(w => ({
      dayOfWeek: w.dayOfWeek,
      status: w.status
    }));
    if (JSON.stringify(origWd) !== JSON.stringify(curWd)) return true;

    // Timing and durations
    const origStart = timetableStructure.collegeStartMinute ?? 480;
    const origEnd = timetableStructure.collegeEndMinute ?? 960;
    const origClassDur = timetableStructure.classDuration ?? 50;
    const origLabDur = timetableStructure.labDuration ?? 100;

    if (Number(draftCollegeStartMinute) !== Number(origStart)) return true;
    if (Number(draftCollegeEndMinute) !== Number(origEnd)) return true;
    if (Number(draftClassDuration) !== Number(origClassDur)) return true;
    if (Number(draftLabDuration) !== Number(origLabDur)) return true;

    // Breaks comparison
    const origBreaks = (timetableStructure.breaks || []).map(b => ({
      name: b.name,
      startMinute: Number(b.startMinute),
      duration: Number(b.duration || (b.endMinute - b.startMinute))
    })).sort((a, b) => a.startMinute - b.startMinute);

    const curBreaks = (draftBreaks || []).map(b => ({
      name: b.name,
      startMinute: Number(b.startMinute),
      duration: Number(b.duration)
    })).sort((a, b) => a.startMinute - b.startMinute);

    if (JSON.stringify(origBreaks) !== JSON.stringify(curBreaks)) return true;

    return false;
  }, [timetableStructure, draftWorkingDays, draftCollegeStartMinute, draftCollegeEndMinute, draftClassDuration, draftLabDuration, draftBreaks]);

  const settingsValidationError = useMemo(() => {
    // 1. Working days
    const hasWorkingDay = draftWorkingDays.some(w => w.status === 'Full Day' || w.status === 'Half Day');
    if (!hasWorkingDay) {
      return 'At least one working day (Full Day or Half Day) must be configured.';
    }
    const sunday = draftWorkingDays.find(w => w.dayOfWeek === 7);
    if (sunday && sunday.status !== 'Non-Working') {
      return 'Sunday is strictly Non-Working by institutional policy.';
    }

    // 2. Timings
    if (draftCollegeStartMinute >= draftCollegeEndMinute) {
      return `College Start Time (${minutesToTime(draftCollegeStartMinute)}) must be strictly before College End Time (${minutesToTime(draftCollegeEndMinute)}).`;
    }
    if (draftCollegeEndMinute - draftCollegeStartMinute < draftClassDuration) {
      return `Daily college duration must be at least one class period (${draftClassDuration} mins).`;
    }

    // 3. Class duration
    if (draftClassDuration < 15 || draftClassDuration > 180) {
      return 'Class duration must be between 15 and 180 minutes.';
    }

    // 4. Breaks
    for (let i = 0; i < (draftBreaks || []).length; i++) {
      const b = draftBreaks[i];
      if (!b.name || !b.name.trim()) {
        return `Break #${i + 1} must have a name.`;
      }
      if (b.startMinute < draftCollegeStartMinute || b.startMinute >= draftCollegeEndMinute) {
        return `Break "${b.name}" (${minutesToTime(b.startMinute)}) must start within college operating hours (${minutesToTime(draftCollegeStartMinute)}–${minutesToTime(draftCollegeEndMinute)}).`;
      }
      const endMin = b.startMinute + Number(b.duration || 0);
      if (endMin > draftCollegeEndMinute) {
        return `Break "${b.name}" ends at ${minutesToTime(endMin)}, which exceeds College End Time (${minutesToTime(draftCollegeEndMinute)}).`;
      }
    }

    // 5. Break overlaps
    const sortedBreaks = [...(draftBreaks || [])].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 0; i < sortedBreaks.length - 1; i++) {
      const b1 = sortedBreaks[i];
      const b2 = sortedBreaks[i + 1];
      const b1End = b1.startMinute + Number(b1.duration);
      if (b1End > b2.startMinute) {
        return `Break "${b1.name}" (${minutesToTime(b1.startMinute)}–${minutesToTime(b1End)}) overlaps with "${b2.name}" (${minutesToTime(b2.startMinute)}).`;
      }
    }

    // 6. Periods count
    if (calculatedPeriods.length === 0) {
      return 'The current configuration does not fit any teaching periods. Please adjust timings, class duration, or breaks.';
    }

    return null;
  }, [draftWorkingDays, draftCollegeStartMinute, draftCollegeEndMinute, draftClassDuration, draftBreaks, calculatedPeriods]);

  const handleWorkingDayChange = (dayOfWeek, status) => {
    if (dayOfWeek === 7) return; // Sunday is locked to Non-Working
    setDraftWorkingDays(prev => prev.map(w => w.dayOfWeek === dayOfWeek ? { ...w, status } : w));
  };

  const handleAddBreakItem = () => {
    const lastBreak = draftBreaks[draftBreaks.length - 1];
    const suggestedStart = lastBreak ? Math.min(lastBreak.startMinute + Number(lastBreak.duration) + 100, draftCollegeEndMinute - 30) : 600;
    const newBreak = {
      id: `brk_${Date.now().toString(36)}`,
      name: `Break ${draftBreaks.length + 1}`,
      startMinute: suggestedStart,
      duration: 15,
      endMinute: suggestedStart + 15,
      status: 'Active'
    };
    setDraftBreaks(prev => [...prev, newBreak].sort((a, b) => a.startMinute - b.startMinute));
  };

  const handleUpdateBreakItem = (index, field, value) => {
    setDraftBreaks(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'startMinute' || field === 'duration') {
        const s = field === 'startMinute' ? Number(value) : Number(item.startMinute);
        const d = field === 'duration' ? Number(value) : Number(item.duration);
        item.endMinute = s + d;
      }
      updated[index] = item;
      return updated.sort((a, b) => a.startMinute - b.startMinute);
    });
  };

  const handleDeleteBreakItem = (index) => {
    setDraftBreaks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDiscardSettings = () => {
    syncSettingsDraft(timetableStructure);
    setIsEditingSettings(false);
  };

  const handleSaveSettings = async () => {
    if (settingsValidationError) return;
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      const satMax = (saturdayWorkingDay?.status === 'Half Day') ? (saturdayWorkingDay?.maxPeriods || 4) : 0;
      const lunch = (draftBreaks || []).find(b => b.name && b.name.toLowerCase().includes('lunch'));
      
      const formattedPeriods = calculatedPeriods.map(p => {
        let isSat = false;
        if (saturdayWorkingDay?.status === 'Full Day') {
          isSat = true;
        } else if (saturdayWorkingDay?.status === 'Half Day') {
          if (lunch) {
            isSat = p.endMinute <= lunch.startMinute;
          } else {
            isSat = p.periodNumber <= satMax;
          }
        }
        return {
          id: `p_${p.periodNumber}`,
          periodNumber: p.periodNumber,
          name: p.name || `Period ${p.periodNumber}`,
          startMinute: p.startMinute,
          endMinute: p.endMinute,
          timeSlot: `${minutesToTime(p.startMinute)}-${minutesToTime(p.endMinute)}`,
          saturdayAvailable: isSat,
          status: 'Active',
          order: p.periodNumber
        };
      });

      const formattedBreaks = (draftBreaks || []).map((b, idx) => {
        const endM = Number(b.startMinute) + Number(b.duration);
        return {
          id: b.id || `brk_${idx + 1}`,
          name: b.name.trim(),
          startMinute: Number(b.startMinute),
          endMinute: endM,
          duration: Number(b.duration),
          timeSlot: `${minutesToTime(b.startMinute)}-${minutesToTime(endM)}`,
          status: 'Active',
          order: idx + 1
        };
      });

      const payload = {
        name: timetableStructure?.name || 'SIT Institutional Bell Schedule',
        collegeStartMinute: draftCollegeStartMinute,
        collegeEndMinute: draftCollegeEndMinute,
        classDuration: draftClassDuration,
        labDuration: Number(draftLabDuration || 100),
        workingDays: draftWorkingDays,
        breaks: formattedBreaks,
        periods: formattedPeriods
      };

      const res = await fetch('/api/academic/structure/timetable-structure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Institutional Timetable Settings saved successfully!' });
        setTimetableStructure(data.data);
        setIsEditingSettings(false);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save timetable settings' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSettingsSaving(false);
    }
  };

  const sectionGridColumns = useMemo(() => {
    const periods = (ttData?.periodDefinitions || []).map(p => ({
      type: 'period',
      periodNumber: p.periodNumber,
      name: p.name || `P${p.periodNumber}`,
      timeSlot: p.timeSlot,
      startMinute: p.startMinute,
      endMinute: p.endMinute
    }));
    const breaks = (ttData?.breakDefinitions || []).map((b, idx) => ({
      type: 'break',
      index: idx,
      name: b.name,
      timeSlot: b.timeSlot || `${minutesToTime(b.startMinute)}–${minutesToTime(b.endMinute)}`,
      startMinute: b.startMinute,
      endMinute: b.endMinute,
      duration: b.duration,
      afterPeriod: b.afterPeriod
    }));
    return [...periods, ...breaks].sort((a, b) => a.startMinute - b.startMinute);
  }, [ttData?.periodDefinitions, ttData?.breakDefinitions]);

  const sectionWorkingDays = useMemo(() => {
    const defaultDays = [
      { dayNum: 1, name: 'Monday', status: 'Full Day' },
      { dayNum: 2, name: 'Tuesday', status: 'Full Day' },
      { dayNum: 3, name: 'Wednesday', status: 'Full Day' },
      { dayNum: 4, name: 'Thursday', status: 'Full Day' },
      { dayNum: 5, name: 'Friday', status: 'Full Day' },
      { dayNum: 6, name: 'Saturday', status: 'Half Day' }
    ];
    if (!ttData?.structure?.workingDays?.length) return defaultDays;
    return ttData.structure.workingDays
      .filter(wd => wd.status !== 'Non-Working' && wd.dayOfWeek !== 7)
      .map(wd => ({
        dayNum: wd.dayOfWeek,
        name: wd.dayName,
        status: wd.status,
        maxPeriods: wd.maxPeriods
      }));
  }, [ttData?.structure?.workingDays]);

  // Step 6 Hierarchy: Batch -> Official Semester -> Department/Branch -> Class Section
  const availableSemestersForBatch = useMemo(() => {
    if (!ttBatchId) return [];
    return semesters.filter((s) => String(s.batch?._id || s.batch) === String(ttBatchId));
  }, [semesters, ttBatchId]);

  const availableBranchesForTimetable = useMemo(() => {
    // Show actual departments/branches - strictly exclude 'COMMON' / 'Common to All'
    return branches.filter((br) => {
      const code = (br.shortName || br.code || '').toUpperCase();
      const name = (br.name || '').toLowerCase();
      return code !== 'COMMON' && !name.includes('common');
    });
  }, [branches]);

  const availableSectionsForTimetable = useMemo(() => {
    if (!ttBatchId || !ttSemesterNum || !ttBranchId) return [];
    return sections.filter((sec) => {
      const bId = String(sec.batch?._id || sec.batch);
      const semNum = Number(sec.semester);
      const brId = String(sec.branch?._id || sec.branch);
      return bId === String(ttBatchId) && semNum === Number(ttSemesterNum) && brId === String(ttBranchId);
    });
  }, [sections, ttBatchId, ttSemesterNum, ttBranchId]);

  const fetchSectionTimetable = async (secId) => {
    if (!secId) {
      setTtData(null);
      setTtSlots({});
      return;
    }
    setTtLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (ttBatchId) params.append('batch', ttBatchId);
      if (ttSemesterNum) params.append('semester', ttSemesterNum);
      if (ttBranchId) params.append('branch', ttBranchId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/academic/structure/section-timetables/${secId}${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTtData(data.data);
        const map = {};
        if (data.data.timetable?.slots) {
          data.data.timetable.slots.forEach((s) => {
            if (s.subject) {
              const classType = s.lectureType === 'Lab' || s.classType === 'Lab' ? 'Lab' : 'Theory';
              const batchGroup = s.batchGroup ? String(s.batchGroup).trim().toUpperCase() : (classType === 'Lab' ? 'B1' : 'ALL');
              const slotKey = `${s.dayOfWeek}_${s.periodNumber}_${batchGroup}`;
              map[slotKey] = {
                dayOfWeek: s.dayOfWeek,
                periodNumber: s.periodNumber,
                subject: s.subject?._id || s.subject || '',
                subjectDoc: s.subject,
                faculty: s.faculty?._id || s.faculty || '',
                facultyDoc: s.faculty,
                room: s.room || '',
                classType,
                lectureType: classType,
                batchGroup,
                sessionGroupId: s.sessionGroupId || null
              };
            }
          });
        }
        setTtSlots(map);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to fetch timetable' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTtLoading(false);
    }
  };

  const handleSaveTimetable = async (targetStatus = 'Draft') => {
    if (!ttSectionId) return;
    setTtSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (ttBatchId) params.append('batch', ttBatchId);
      if (ttSemesterNum) params.append('semester', ttSemesterNum);
      if (ttBranchId) params.append('branch', ttBranchId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      // Only include assigned slots (must have a subject)
      const slotsPayload = Object.values(ttSlots)
        .filter(s => s.subject)
        .map(s => {
          const classType = s.classType === 'Lab' || s.lectureType === 'Lab' ? 'Lab' : 'Theory';
          const batchGroup = classType === 'Lab' ? (s.batchGroup || 'B1') : 'ALL';
          return {
            dayOfWeek: s.dayOfWeek,
            periodNumber: s.periodNumber,
            subject: s.subject,
            classType,
            lectureType: classType,
            batchGroup,
            faculty: s.faculty || null,
            room: s.room ? s.room.trim().toUpperCase() : '',
            sessionGroupId: s.sessionGroupId || null
          };
        });

      const res = await fetch(`/api/academic/structure/section-timetables/${ttSectionId}${queryString}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slots: slotsPayload,
          status: targetStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Section timetable ${targetStatus === 'Published' ? 'published' : 'saved as draft'} successfully!`
        });
        fetchSectionTimetable(ttSectionId);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save timetable' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTtSaving(false);
    }
  };

  const handlePublishTimetable = async () => {
    if (!ttSectionId) return;
    const confirmed = window.confirm(
      'Publishing this timetable activates it for this section. Students will see their scheduled classes starting from today onwards. Historical attendance remains completely safe and unchanged. Proceed?'
    );
    if (!confirmed) return;
    handleSaveTimetable('Published');
  };

  const handleArchiveTimetable = async () => {
    if (!ttSectionId) return;
    const confirmed = window.confirm('Archive this timetable? It will become read-only.');
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/section-timetables/${ttSectionId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Section timetable archived.' });
        fetchSectionTimetable(ttSectionId);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to archive' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleReopenTimetable = async () => {
    if (!ttSectionId) return;
    const confirmed = window.confirm(
      'Reopen this published timetable for editing? Its status will revert to Draft so you can adjust slot assignments before publishing again.'
    );
    if (!confirmed) return;
    setTtSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/section-timetables/${ttSectionId}/reopen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Timetable reopened as Draft. You can now modify slot assignments.' });
        fetchSectionTimetable(ttSectionId);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reopen timetable' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTtSaving(false);
    }
  };

  const handleOpenSlotModal = (dayOfWeek, periodNumber, targetBatch = 'ALL') => {
    const key = `${dayOfWeek}_${periodNumber}_${targetBatch}`;
    const existing = ttSlots[key];
    setEditingSlotKey(key);
    const classType = existing?.classType || (existing?.lectureType === 'Lab' ? 'Lab' : targetBatch !== 'ALL' ? 'Lab' : 'Theory');
    const batchGroup = targetBatch !== 'ALL' ? targetBatch : (existing?.batchGroup || 'ALL');
    setSlotForm({
      dayOfWeek,
      periodNumber,
      subject: existing?.subject || '',
      classType,
      lectureType: classType,
      batchGroup,
      faculty: existing?.faculty || '',
      room: existing?.room || '',
      spanConsecutive: Boolean(existing?.sessionGroupId) || (classType === 'Lab' && !existing)
    });
  };

  const handleClearSlot = () => {
    if (!editingSlotKey) return;
    const existing = ttSlots[editingSlotKey];
    const newSlots = { ...ttSlots };

    if (existing?.sessionGroupId) {
      // Clear all slots sharing this sessionGroupId (e.g. 2-period lab block)
      Object.keys(newSlots).forEach((k) => {
        if (newSlots[k]?.sessionGroupId === existing.sessionGroupId) {
          delete newSlots[k];
        }
      });
    } else {
      delete newSlots[editingSlotKey];
    }

    setTtSlots(newSlots);
    setEditingSlotKey(null);
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!editingSlotKey) return;
    if (!slotForm.subject) {
      setStatusMessage({ type: 'error', text: 'Please select a Subject for this period slot.' });
      return;
    }
    const parts = editingSlotKey.split('_');
    const day = Number(parts[0]);
    const period = Number(parts[1]);
    const subjDoc = ttData?.branchSubjects?.find(s => s._id === slotForm.subject);
    const facDoc = ttData?.branchFaculties?.find(f => f._id === slotForm.faculty);
    const classType = slotForm.classType === 'Lab' ? 'Lab' : 'Theory';
    const batchGroup = classType === 'Lab' ? (slotForm.batchGroup || 'B1') : 'ALL';

    const newSlots = { ...ttSlots };
    const dayDef = sectionWorkingDays.find(d => d.dayNum === day);
    const maxAllowed = dayDef?.maxPeriods || (day === 6 ? 4 : (ttData?.periodDefinitions?.length || 7));

    // Generate unique session group ID for 2-period lab block
    const groupId = (classType === 'Lab' && slotForm.spanConsecutive)
      ? `LAB_${day}_P${period}_P${period + 1}_${batchGroup}_${subjDoc?.code || 'LAB'}`
      : null;

    const currentKey = `${day}_${period}_${batchGroup}`;

    // If setting a whole-section Theory ('ALL'), clear any existing batch slots for this period
    if (batchGroup === 'ALL') {
      delete newSlots[`${day}_${period}_B1`];
      delete newSlots[`${day}_${period}_B2`];
      delete newSlots[`${day}_${period}_ALL`];
    } else {
      // If setting a Lab batch (B1 or B2), clear any existing whole-section 'ALL' slot in this period
      delete newSlots[`${day}_${period}_ALL`];
      delete newSlots[currentKey];
    }

    newSlots[currentKey] = {
      dayOfWeek: day,
      periodNumber: period,
      subject: slotForm.subject,
      subjectDoc: subjDoc || null,
      classType,
      lectureType: classType,
      batchGroup,
      faculty: slotForm.faculty || null,
      facultyDoc: facDoc || null,
      room: slotForm.room ? slotForm.room.trim().toUpperCase() : '',
      sessionGroupId: groupId
    };

    if (classType === 'Lab' && slotForm.spanConsecutive && period < maxAllowed) {
      const nextKey = `${day}_${period + 1}_${batchGroup}`;
      delete newSlots[`${day}_${period + 1}_ALL`];
      delete newSlots[nextKey];
      newSlots[nextKey] = {
        dayOfWeek: day,
        periodNumber: period + 1,
        subject: slotForm.subject,
        subjectDoc: subjDoc || null,
        classType,
        lectureType: classType,
        batchGroup,
        faculty: slotForm.faculty || null,
        facultyDoc: facDoc || null,
        room: slotForm.room ? slotForm.room.trim().toUpperCase() : '',
        sessionGroupId: groupId
      };
    }

    setTtSlots(newSlots);
    setEditingSlotKey(null);
  };

  const handleClearGrid = () => {
    if (ttData?.timetable?.status === 'Published') {
      setStatusMessage({
        type: 'error',
        text: 'Cannot clear a Published timetable. Click "Reopen for Editing" first.'
      });
      return;
    }
    if (window.confirm('Clear all period assignments in this grid?')) {
      setTtSlots({});
    }
  };

  const renderSlotCell = (dayOfWeek, periodNumber) => {
    const isPublished = ttData?.timetable?.status === 'Published';
    const isArchived = ttData?.timetable?.status === 'Archived';
    const isLocked = isPublished || isArchived;

    const allSlot = ttSlots[`${dayOfWeek}_${periodNumber}_ALL`];
    const b1Slot = ttSlots[`${dayOfWeek}_${periodNumber}_B1`];
    const b2Slot = ttSlots[`${dayOfWeek}_${periodNumber}_B2`];

    const hasAnySlot = Boolean(allSlot || b1Slot || b2Slot);

    if (!hasAnySlot) {
      return (
        <td
          key={periodNumber}
          onClick={() => {
            if (isPublished) {
              setStatusMessage({
                type: 'info',
                text: 'This timetable is Published and protected from accidental edits. Click "Reopen for Editing" in the toolbar above to modify slots.'
              });
              return;
            }
            if (isArchived) {
              setStatusMessage({ type: 'error', text: 'This timetable is Archived and read-only.' });
              return;
            }
            handleOpenSlotModal(dayOfWeek, periodNumber, 'ALL');
          }}
          title={isPublished ? 'Published & Protected. Reopen to edit.' : isArchived ? 'Archived read-only.' : 'Click to assign period'}
          className={`p-1.5 border-r border-gray-100 dark:border-zinc-800 text-center transition-colors ${
            isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
          }`}
        >
          <div className="h-16 rounded border border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:border-blue-400 hover:text-blue-500 transition-colors">
            {isPublished ? <Lock className="w-3 h-3 text-gray-400" /> : <Plus className="w-3.5 h-3.5" />}
          </div>
        </td>
      );
    }

    // Case 1: Whole section class (Theory)
    if (allSlot) {
      const subjectCode = allSlot.subjectDoc?.code || (ttData?.branchSubjects?.find(s => s._id === allSlot.subject)?.code) || 'SUBJ';
      const subjectName = allSlot.subjectDoc?.name || (ttData?.branchSubjects?.find(s => s._id === allSlot.subject)?.name) || '';
      const facultyName = allSlot.facultyDoc?.name || (ttData?.branchFaculties?.find(f => f._id === allSlot.faculty)?.name) || 'TBA';

      return (
        <td
          key={periodNumber}
          onClick={() => {
            if (isLocked) {
              setStatusMessage({ type: 'info', text: isPublished ? 'Timetable is Published. Reopen to edit.' : 'Timetable is Archived.' });
              return;
            }
            handleOpenSlotModal(dayOfWeek, periodNumber, 'ALL');
          }}
          title={isPublished ? 'Published & Protected.' : 'Click to edit slot'}
          className={`p-1 border-r border-gray-100 dark:border-zinc-800 transition-colors ${
            isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:opacity-90'
          }`}
        >
          <div className="h-16 p-1.5 rounded border bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 flex flex-col justify-between text-[11px] overflow-hidden relative shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold truncate text-xs" title={subjectName || subjectCode}>
                {subjectCode}
              </span>
              <div className="flex items-center gap-1">
                {allSlot.room && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 uppercase">
                    {allSlot.room}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 text-[10px] text-gray-600 dark:text-gray-400">
              <span className="truncate max-w-[65px]" title={facultyName}>
                {facultyName}
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded font-semibold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                Theory
              </span>
            </div>
          </div>
        </td>
      );
    }

    // Case 2: Parallel Lab Batches (B1 and/or B2)
    return (
      <td
        key={periodNumber}
        className="p-1 border-r border-gray-100 dark:border-zinc-800 align-top min-w-[120px]"
      >
        <div className="h-16 flex flex-col gap-1">
          {/* Batch B1 Card / Slot */}
          {b1Slot ? (
            <div
              onClick={() => {
                if (isLocked) {
                  setStatusMessage({ type: 'info', text: isPublished ? 'Timetable is Published. Reopen to edit.' : 'Timetable is Archived.' });
                  return;
                }
                handleOpenSlotModal(dayOfWeek, periodNumber, 'B1');
              }}
              className={`flex-1 px-1.5 py-0.5 rounded border bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-1 text-[10px] transition-all shadow-2xs ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-purple-100/70 dark:hover:bg-purple-900/40'
              }`}
              title={`Batch B1: ${b1Slot.subjectDoc?.name || b1Slot.subjectDoc?.code || 'Lab'} (Click to edit)`}
            >
              <div className="flex items-center gap-1 truncate">
                <span className="text-[8px] font-black px-1 py-0.2 rounded bg-purple-600 text-white tracking-wider shrink-0">
                  B1
                </span>
                <span className="font-bold truncate text-purple-950 dark:text-purple-200">
                  {b1Slot.subjectDoc?.code || (ttData?.branchSubjects?.find(s => s._id === b1Slot.subject)?.code) || 'LAB'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {b1Slot.sessionGroupId && (
                  <span className="text-[7.5px] font-bold px-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                    2P
                  </span>
                )}
                {b1Slot.room && (
                  <span className="text-[7.5px] font-mono px-0.5 rounded bg-black/5 dark:bg-white/10 uppercase">
                    {b1Slot.room}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleOpenSlotModal(dayOfWeek, periodNumber, 'B1')}
              className="flex-1 rounded border border-dashed border-purple-200 dark:border-purple-900/40 text-[9px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
              title="Assign B1 Lab"
            >
              <Plus className="w-2.5 h-2.5" /> <span>B1 Lab</span>
            </button>
          )}

          {/* Batch B2 Card / Slot */}
          {b2Slot ? (
            <div
              onClick={() => {
                if (isLocked) {
                  setStatusMessage({ type: 'info', text: isPublished ? 'Timetable is Published. Reopen to edit.' : 'Timetable is Archived.' });
                  return;
                }
                handleOpenSlotModal(dayOfWeek, periodNumber, 'B2');
              }}
              className={`flex-1 px-1.5 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-1 text-[10px] transition-all shadow-2xs ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40'
              }`}
              title={`Batch B2: ${b2Slot.subjectDoc?.name || b2Slot.subjectDoc?.code || 'Lab'} (Click to edit)`}
            >
              <div className="flex items-center gap-1 truncate">
                <span className="text-[8px] font-black px-1 py-0.2 rounded bg-indigo-600 text-white tracking-wider shrink-0">
                  B2
                </span>
                <span className="font-bold truncate text-indigo-950 dark:text-indigo-200">
                  {b2Slot.subjectDoc?.code || (ttData?.branchSubjects?.find(s => s._id === b2Slot.subject)?.code) || 'LAB'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {b2Slot.sessionGroupId && (
                  <span className="text-[7.5px] font-bold px-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                    2P
                  </span>
                )}
                {b2Slot.room && (
                  <span className="text-[7.5px] font-mono px-0.5 rounded bg-black/5 dark:bg-white/10 uppercase">
                    {b2Slot.room}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleOpenSlotModal(dayOfWeek, periodNumber, 'B2')}
              className="flex-1 rounded border border-dashed border-indigo-200 dark:border-indigo-900/40 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
              title="Assign B2 Lab"
            >
              <Plus className="w-2.5 h-2.5" /> <span>B2 Lab</span>
            </button>
          )}
        </div>
      </td>
    );
  };

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const [resColleges, resPrograms, resBranches, resBatches, resSemesters, resSections, resEvents] = await Promise.all([
        fetch('/api/academic/structure/colleges', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/programs', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/branches', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/batches', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/semesters', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/sections', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/academic/structure/events', { headers }).then(r => r.json()).catch(() => ({}))
      ]);

      if (resColleges?.success) {
        setColleges(resColleges.data);
        const primary = resColleges.primary || resColleges.data?.[0];
        setSitCollege(primary);
      }
      if (resPrograms?.success) setPrograms(resPrograms.data);
      if (resBranches?.success) setBranches(resBranches.data);
      if (resBatches?.success) setBatches(resBatches.data);
      if (resSemesters?.success) setSemesters(resSemesters.data);
      if (resSections?.success) setSections(resSections.data);
      
      if (resEvents?.success) setEvents(resEvents.data);
    } catch (err) {
      console.error('Failed to fetch academic structure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const adm = Number(newBatch.admissionYear);
    const grad = Number(newBatch.graduationYear);

    if (!adm || !grad) {
      setStatusMessage({ type: 'error', text: 'Both admission year and graduation year are required.' });
      return;
    }
    if (!Number.isInteger(adm) || adm < 1950 || adm > 2100) {
      setStatusMessage({ type: 'error', text: 'Admission year must be a valid 4-digit year between 1950 and 2100.' });
      return;
    }
    if (!Number.isInteger(grad) || grad < 1950 || grad > 2100) {
      setStatusMessage({ type: 'error', text: 'Graduation year must be a valid 4-digit year between 1950 and 2100.' });
      return;
    }
    if (grad <= adm) {
      setStatusMessage({ type: 'error', text: 'Graduation year must be after admission year.' });
      return;
    }
    if (grad - adm !== 4) {
      setStatusMessage({
        type: 'error',
        text: `For the 4-year B.E. program, graduation year must be exactly 4 years after admission year (${adm} → ${adm + 4}).`
      });
      return;
    }
    const duplicate = batches.some((b) => Number(b.admissionYear) === adm);
    if (duplicate) {
      setStatusMessage({
        type: 'error',
        text: `A B.E. cohort batch for ${adm}–${grad} already exists.`
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          admissionYear: adm,
          graduationYear: grad,
          ...(sitCollege?._id ? { collegeId: sitCollege._id } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Cohort Batch "${data.data.name}" created successfully!` });
        const cur = new Date().getFullYear();
        setNewBatch({ admissionYear: cur, graduationYear: cur + 4 });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create batch' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateBatchStatus = async (batchId, currentStatus, nextStatus) => {
    if (currentStatus === nextStatus) return;
    let forceTransition = false;
    if (currentStatus === 'Graduated' && nextStatus === 'Active') {
      const confirmed = window.confirm(
        'Graduated is a terminal academic state. Are you sure you want to reactivate this cohort batch?'
      );
      if (!confirmed) return;
      forceTransition = true;
    }

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, forceTransition })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Batch status updated to ${nextStatus}` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update batch status' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (batch.hasDependencies || (batch.totalDependencies && batch.totalDependencies > 0)) {
      const depItems = [];
      if (batch.semestersCount > 0) depItems.push(`${batch.semestersCount} semester(s)`);
      if (batch.sectionsCount > 0) depItems.push(`${batch.sectionsCount} section(s)`);
      if (batch.studentsCount > 0) depItems.push(`${batch.studentsCount} student(s)`);
      if (batch.timetablesCount > 0) depItems.push(`${batch.timetablesCount} timetable(s)`);
      if (batch.eventsCount > 0) depItems.push(`${batch.eventsCount} event(s)`);
      const details = depItems.length > 0 ? ` (${depItems.join(', ')})` : '';
      setStatusMessage({
        type: 'error',
        text: `This batch cannot be deleted because academic records${details} are linked to it. Archive the batch instead.`
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete Cohort Batch "${batch.name}"?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/batches/${batch._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Cohort Batch "${batch.name}" deleted successfully!` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to delete batch' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenEditBatch = (b) => {
    setEditingBatch({
      _id: b._id,
      name: b.name || `${b.admissionYear}–${b.graduationYear}`,
      admissionYear: b.admissionYear,
      graduationYear: b.graduationYear,
      status: b.status || 'Active',
      hasDependencies: Boolean(b.hasDependencies || (b.totalDependencies && b.totalDependencies > 0)),
      semestersCount: b.semestersCount || 0,
      sectionsCount: b.sectionsCount || 0,
      studentsCount: b.studentsCount || 0,
      timetablesCount: b.timetablesCount || 0,
      eventsCount: b.eventsCount || 0
    });
  };

  const handleSaveEditBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;

    const adm = Number(editingBatch.admissionYear);
    const grad = Number(editingBatch.graduationYear);

    if (!editingBatch.hasDependencies) {
      if (!adm || !grad) {
        setStatusMessage({ type: 'error', text: 'Both admission year and graduation year are required.' });
        return;
      }
      if (!Number.isInteger(adm) || adm < 1950 || adm > 2100) {
        setStatusMessage({ type: 'error', text: 'Admission year must be a valid 4-digit year between 1950 and 2100.' });
        return;
      }
      if (!Number.isInteger(grad) || grad < 1950 || grad > 2100) {
        setStatusMessage({ type: 'error', text: 'Graduation year must be a valid 4-digit year between 1950 and 2100.' });
        return;
      }
      if (grad <= adm) {
        setStatusMessage({ type: 'error', text: 'Graduation year must be after admission year.' });
        return;
      }
      if (grad - adm !== 4) {
        setStatusMessage({
          type: 'error',
          text: `For the 4-year B.E. program, graduation year must be exactly 4 years after admission year (${adm} → ${adm + 4}).`
        });
        return;
      }
      const duplicate = batches.some((b) => b._id !== editingBatch._id && Number(b.admissionYear) === adm);
      if (duplicate) {
        setStatusMessage({
          type: 'error',
          text: `A B.E. cohort batch for ${adm}–${grad} already exists.`
        });
        return;
      }
    }

    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const payload = {
        status: editingBatch.status,
        forceTransition: true
      };
      if (!editingBatch.hasDependencies) {
        payload.admissionYear = adm;
        payload.graduationYear = grad;
      }

      const res = await fetch(`/api/academic/structure/batches/${editingBatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Cohort Batch "${data.data.name}" updated successfully!` });
        setEditingBatch(null);
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update batch' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSection.batchId) {
      setStatusMessage({ type: 'error', text: 'Please select a batch cohort.' });
      return;
    }
    const semNum = Number(newSection.semester);
    if (!semNum || semNum < 1 || semNum > 8) {
      setStatusMessage({ type: 'error', text: 'Semester must be between 1 and 8.' });
      return;
    }
    if (!newSection.branchId) {
      setStatusMessage({ type: 'error', text: 'Please select a branch.' });
      return;
    }
    if (!newSection.name || !newSection.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Section name is required.' });
      return;
    }

    const cleanName = newSection.name.trim().toUpperCase();
    const isDuplicate = sections.some(
      (s) =>
        String(s.batch?._id || s.batch) === String(newSection.batchId) &&
        Number(s.semester) === semNum &&
        String(s.branch?._id || s.branch) === String(newSection.branchId) &&
        s.name.toUpperCase() === cleanName
    );
    if (isDuplicate) {
      setStatusMessage({
        type: 'error',
        text: `Section "${cleanName}" already exists for this batch, branch, and semester.`
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId: newSection.batchId,
          semester: semNum,
          branchId: newSection.branchId,
          name: cleanName,
          room: newSection.room ? newSection.room.trim() : '',
          capacity: Number(newSection.capacity) || 60,
          ...(sitCollege?._id ? { collegeId: sitCollege._id } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Section "${data.data.name}" created successfully!` });
        setNewSection((prev) => ({
          ...prev,
          name: 'A',
          room: '',
          capacity: 60
        }));
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create section' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateSectionStatus = async (sectionId, nextStatus) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Section status updated to "${nextStatus}"` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update section' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSection = async (sec) => {
    if (sec.hasDependencies || (sec.totalDependencies && sec.totalDependencies > 0)) {
      const depItems = [];
      if (sec.timetablesCount > 0) depItems.push(`${sec.timetablesCount} timetable(s)`);
      if (sec.studentsCount > 0) depItems.push(`${sec.studentsCount} student(s)`);
      const details = depItems.length > 0 ? ` (${depItems.join(', ')})` : '';
      setStatusMessage({
        type: 'error',
        text: `Section "${sec.name}" cannot be deleted because academic records${details} are linked to it. Archive the section instead.`
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete Section "${sec.name}"?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/sections/${sec._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Section "${sec.name}" deleted.` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to delete section' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenEditSection = (sec) => {
    setEditingSection({
      _id: sec._id,
      name: sec.name,
      room: sec.room || '',
      capacity: sec.capacity || 60,
      semester: sec.semester,
      branchId: sec.branch?._id || sec.branch || '',
      batchId: sec.batch?._id || sec.batch || '',
      status: sec.status || 'Active',
      batchName: sec.batch?.name || 'Cohort Batch',
      branchName: sec.branch?.shortName || sec.branch?.name || 'Branch',
      hasDependencies: Boolean(sec.hasDependencies || (sec.totalDependencies && sec.totalDependencies > 0)),
      timetablesCount: sec.timetablesCount || 0,
      studentsCount: sec.studentsCount || 0
    });
  };

  const handleSaveEditSection = async (e) => {
    e.preventDefault();
    if (!editingSection) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const payload = {
        room: editingSection.room ? editingSection.room.trim() : '',
        capacity: Number(editingSection.capacity) || 60,
        status: editingSection.status
      };
      if (!editingSection.hasDependencies) {
        payload.name = editingSection.name.trim().toUpperCase();
        payload.semester = Number(editingSection.semester);
        payload.branchId = editingSection.branchId || null;
      }
      const res = await fetch(`/api/academic/structure/sections/${editingSection._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Section "${data.data.name}" updated successfully!` });
        setEditingSection(null);
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update section' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!newSemester.batchId) {
      setStatusMessage({ type: 'error', text: 'Please select a batch cohort.' });
      return;
    }
    const semNum = Number(newSemester.number);
    if (!semNum || semNum < 1 || semNum > 8) {
      setStatusMessage({ type: 'error', text: 'Semester must be between 1 and 8.' });
      return;
    }
    if (!newSemester.startDate || !newSemester.endDate) {
      setStatusMessage({ type: 'error', text: 'Official start date and end date are required.' });
      return;
    }
    const start = new Date(newSemester.startDate);
    const end = new Date(newSemester.endDate);
    if (start >= end) {
      setStatusMessage({ type: 'error', text: 'Official start date must be before end date.' });
      return;
    }

    // Client-side duplicate check for this batch
    const isDuplicate = semesters.some(
      (s) => String(s.batch?._id || s.batch) === String(newSemester.batchId) && Number(s.number) === semNum
    );
    if (isDuplicate) {
      setStatusMessage({
        type: 'error',
        text: `Official Semester ${semNum} already exists for this batch cohort.`
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId: newSemester.batchId,
          number: semNum,
          startDate: newSemester.startDate,
          endDate: newSemester.endDate,
          status: newSemester.status || 'Upcoming',
          ...(sitCollege?._id ? { collegeId: sitCollege._id } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Official Semester ${data.data.number} scheduled successfully!` });
        setNewSemester((prev) => ({
          ...prev,
          number: (Number(prev.number) % 8) + 1,
          startDate: '',
          endDate: '',
          status: 'Upcoming'
        }));
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create official semester' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateSemesterStatus = async (semesterId, nextStatus) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/semesters/${semesterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Semester status updated to "${nextStatus}"` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update semester' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSemester = async (s) => {
    if (s.hasDependencies || (s.totalDependencies && s.totalDependencies > 0)) {
      const depItems = [];
      if (s.sectionsCount > 0) depItems.push(`${s.sectionsCount} section(s)`);
      if (s.timetablesCount > 0) depItems.push(`${s.timetablesCount} timetable(s)`);
      if (s.eventsCount > 0) depItems.push(`${s.eventsCount} calendar event(s)`);
      const details = depItems.length > 0 ? ` (${depItems.join(', ')})` : '';
      setStatusMessage({
        type: 'error',
        text: `This semester cannot be deleted because academic records${details} are linked to it. Archive or cancel the semester instead.`
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete Official Semester ${s.number}?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/semesters/${s._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Official Semester ${s.number} deleted successfully.` });
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to delete semester' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenEditSemester = (s) => {
    const startStr = s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : '';
    const endStr = s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : '';
    setEditingSemester({
      _id: s._id,
      number: s.number,
      startDate: startStr,
      endDate: endStr,
      status: s.status || 'Upcoming',
      batchId: s.batch?._id || s.batch,
      batchName: s.batch?.name || 'Cohort Batch',
      hasDependencies: Boolean(s.hasDependencies || (s.totalDependencies && s.totalDependencies > 0)),
      sectionsCount: s.sectionsCount || 0,
      timetablesCount: s.timetablesCount || 0,
      eventsCount: s.eventsCount || 0
    });
  };

  const handleSaveEditSemester = async (e) => {
    e.preventDefault();
    if (!editingSemester) return;
    if (!editingSemester.startDate || !editingSemester.endDate) {
      setStatusMessage({ type: 'error', text: 'Official start date and end date are required.' });
      return;
    }
    if (new Date(editingSemester.startDate) >= new Date(editingSemester.endDate)) {
      setStatusMessage({ type: 'error', text: 'Official start date must be before end date.' });
      return;
    }
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const payload = {
        startDate: editingSemester.startDate,
        endDate: editingSemester.endDate,
        status: editingSemester.status
      };
      if (!editingSemester.hasDependencies) {
        payload.number = Number(editingSemester.number);
      }
      const res = await fetch(`/api/academic/structure/semesters/${editingSemester._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Official Semester ${data.data.number} updated successfully!` });
        setEditingSemester(null);
        fetchHierarchy();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update semester' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return '—';
    const s = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!endDate) return s;
    const e = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return s === e ? s : `${s} → ${e}`;
  };
  const formatCalendarDate = formatDateRange;


  // Step 5: Events Fetch and Management Handlers
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error('fetchEvents error:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'timetable_structure' || activeTab === 'weekly_timetable') {
      fetchTimetableStructure();
    }
  }, [activeTab]);

  const handleOpenCreateEvent = () => {
    const today = new Date().toISOString().split('T')[0];
    setEventForm({
      title: '',
      shortDescription: '',
      eventType: 'College Event',
      priority: 'Normal',
      order: 0,
      scope: 'GLOBAL',
      academicSemesterId: semesters.length > 0 ? semesters[0]._id : '',
      allDay: true,
      startDate: today,
      endDate: today,
      startTime: '09:00',
      endTime: '17:00',
      classesSuspended: false,
      suspensionType: 'none',
      suspensionStartTime: '08:00',
      suspensionEndTime: '13:00',
      description: '',
      content: {
        overview: '',
        whatHappens: '',
        whatToDo: '',
        preparationTips: '',
        importantNotes: ''
      },
      resources: [],
      status: 'ACTIVE'
    });
    setEditingEvent(null);
    setEventFormError('');
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt) => {
    const startStr = evt.startDate ? new Date(evt.startDate).toISOString().split('T')[0] : '';
    const endStr = evt.endDate ? new Date(evt.endDate).toISOString().split('T')[0] : '';
    const isHoliday = evt.eventType === 'Holiday / Closure' || evt.eventType === 'HOLIDAY';
    const suspType = evt.suspensionType || (isHoliday ? 'full_day' : (evt.classesSuspended ? 'full_day' : 'none'));

    setEventForm({
      title: evt.title,
      shortDescription: evt.shortDescription || evt.description || '',
      eventType: evt.eventType || 'College Event',
      priority: evt.priority || 'Normal',
      order: evt.order || 0,
      scope: evt.scope || 'GLOBAL',
      academicSemesterId: evt.academicSemesterId?._id || evt.academicSemesterId || (semesters.length > 0 ? semesters[0]._id : ''),
      allDay: evt.allDay !== false,
      startDate: startStr,
      endDate: endStr || startStr,
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '17:00',
      classesSuspended: suspType !== 'none',
      suspensionType: suspType,
      suspensionStartTime: evt.suspensionStartTime || '08:00',
      suspensionEndTime: evt.suspensionEndTime || '13:00',
      description: evt.description || '',
      content: {
        overview: evt.content?.overview || '',
        whatHappens: evt.content?.whatHappens || '',
        whatToDo: evt.content?.whatToDo || '',
        preparationTips: evt.content?.preparationTips || '',
        importantNotes: evt.content?.importantNotes || ''
      },
      resources: Array.isArray(evt.resources) ? evt.resources : [],
      status: evt.status || 'ACTIVE'
    });
    setEditingEvent(evt);
    setEventFormError('');
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventFormError('');

    if (!eventForm.title.trim()) {
      setEventFormError('Event title is required');
      return;
    }

    if (eventForm.scope === 'SEMESTER' && !eventForm.academicSemesterId) {
      setEventFormError('Academic Semester is required for semester-scoped events');
      return;
    }

    if (eventForm.startDate && eventForm.endDate && eventForm.endDate < eventForm.startDate) {
      setEventFormError('End date cannot be earlier than start date');
      return;
    }

    if (!eventForm.allDay && eventForm.startDate === eventForm.endDate) {
      if (eventForm.startTime && eventForm.endTime && eventForm.endTime <= eventForm.startTime) {
        setEventFormError('End time must be strictly after start time for same-day timed events');
        return;
      }
    }

    if (eventForm.suspensionType === 'time_range') {
      if (!eventForm.suspensionStartTime || !eventForm.suspensionEndTime) {
        setEventFormError('Both start and end times are required for time-range class suspension');
        return;
      }
      if (eventForm.suspensionEndTime <= eventForm.suspensionStartTime) {
        setEventFormError('Suspension end time must be strictly after suspension start time');
        return;
      }
    }

    setEventSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const url = editingEvent
        ? `/api/academic/structure/events/${editingEvent._id}`
        : '/api/academic/structure/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        shortDescription: (eventForm.shortDescription || eventForm.description || '').trim(),
        eventType: eventForm.eventType,
        priority: eventForm.priority || 'Normal',
        order: Number(eventForm.order) || 0,
        scope: eventForm.scope,
        academicSemesterId: eventForm.scope === 'SEMESTER' ? eventForm.academicSemesterId : null,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        allDay: Boolean(eventForm.allDay),
        startTime: !eventForm.allDay ? eventForm.startTime : null,
        endTime: !eventForm.allDay ? eventForm.endTime : null,
        classesSuspended: eventForm.suspensionType !== 'none',
        suspensionType: eventForm.suspensionType || 'none',
        suspensionStartTime: eventForm.suspensionType === 'time_range' ? eventForm.suspensionStartTime : null,
        suspensionEndTime: eventForm.suspensionType === 'time_range' ? eventForm.suspensionEndTime : null,
        content: eventForm.content || {},
        resources: Array.isArray(eventForm.resources) ? eventForm.resources : [],
        status: eventForm.status
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: editingEvent ? `Event "${payload.title}" updated successfully.` : `Event "${payload.title}" created successfully.`
        });
        setEventModalOpen(false);
        await fetchEvents();
      } else {
        setEventFormError(data.error || 'Failed to save event');
      }
    } catch (err) {
      setEventFormError(err.message);
    } finally {
      setEventSaving(false);
    }
  };

  const handleToggleEventStatus = async (evt, nextStatus) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/events/${evt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Event "${evt.title}" status updated to ${nextStatus}.`
        });
        await fetchEvents();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update event status' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteEvent = async (evt) => {
    if (!window.confirm(`Are you sure you want to delete event "${evt.title}"? It will be safely archived to protect historical records.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/events/${evt._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Event "${evt.title}" archived successfully.`
        });
        await fetchEvents();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to archive event' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'batches', label: 'Batches / Cohorts', icon: Calendar, count: batches.length },
      { id: 'semesters', label: 'Official Semesters', icon: Layers, count: semesters.length },
      { id: 'sections', label: 'Class Sections', icon: Users, count: sections.length },
      { id: 'timetable_structure', label: 'Timetable Settings', icon: Clock, count: null },
      { id: 'weekly_timetable', label: 'Weekly Timetable', icon: BookOpen, count: null },
      { id: 'events', label: 'Events', icon: CalendarCheck2, count: events.length || null },
    ];
    if (isSuper) return allTabs;
    return allTabs.filter(tab => tab.id === 'timetable_structure' || tab.id === 'weekly_timetable' || tab.id === 'events');
  }, [isSuper, batches.length, sections.length, semesters.length, events.length]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#18181b] p-5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Academic Structure
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              SIT B.E. Focused
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Manage the official academic structure for SIT B.E.
          </p>
        </div>

        {/* Scope Indicator Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {isSuper 
                ? 'Platform Super Administrator' 
                : `SIT Department Admin${adminAllocatedBranch ? ` (${adminAllocatedBranch.shortName || adminAllocatedBranch.code})` : ''}`
              }
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              Siddaganga Institute of Technology (SIT)
            </div>
          </div>
          <button
            onClick={fetchHierarchy}
            disabled={loading}
            className="p-2 border border-gray-200 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300"
            title="Refresh Structure"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div className={`p-3 rounded-md text-xs flex items-center justify-between border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-zinc-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Batches / Cohorts */}
      {isSuper && activeTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>SIT B.E. Cohort Batches</span>
              </h2>
              <span className="text-[11px] text-gray-500">
                Whole B.E. cohorts ({batches.length} registered)
              </span>
            </div>

            {batches.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs space-y-2">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                <div className="font-semibold text-gray-800 dark:text-gray-200">No B.E. Cohort Batches Registered</div>
                <p className="text-[11px] text-gray-500">
                  Create a 4-year B.E. cohort batch (e.g. {currentYear}–{currentYear + 4}) using the form on the right.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 font-semibold text-gray-600 dark:text-gray-400">
                      <th className="p-3">Cohort Batch</th>
                      <th className="p-3">Academic Scope</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {batches.map((b) => {
                      const durationYears = b.graduationYear - b.admissionYear;
                      const hasDeps = Boolean(b.hasDependencies || (b.totalDependencies && b.totalDependencies > 0));
                      const statusColor =
                        b.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                          : b.status === 'Graduated'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

                      return (
                        <tr key={b._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
                              <span>{b.name || `${b.admissionYear}–${b.graduationYear}`}</span>
                              {hasDeps && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-mono font-normal"
                                  title={`${b.semestersCount || 0} semester(s), ${b.sectionsCount || 0} section(s), ${b.studentsCount || 0} student(s) linked`}
                                >
                                  {b.semestersCount || 0} Sems • {b.sectionsCount || 0} Secs
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-gray-400">
                              {b.admissionYear} → {b.graduationYear}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {sitCollege?.name || 'SIT Tumkur'}
                            </span>
                            <div className="text-[10px] text-gray-500">
                              {b.program?.name || 'Bachelor of Engineering'} ({b.program?.code || 'B.E'})
                            </div>
                          </td>
                          <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                            {durationYears} Years ({durationYears * 2} Semesters)
                          </td>
                          <td className="p-3">
                            {canUpdate ? (
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateBatchStatus(b._id, b.status, e.target.value)}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer bg-white dark:bg-zinc-900 ${statusColor}`}
                              >
                                <option value="Active">Active</option>
                                <option value="Graduated">Graduated</option>
                                <option value="Archived">Archived</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {b.status}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBatch(b)}
                                  title={hasDeps ? "Edit status (years locked by dependencies)" : "Edit Cohort Batch"}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBatch(b)}
                                  title={hasDeps ? "Locked: Cannot delete because academic records are linked. Archive instead." : "Delete Batch"}
                                  className={`p-1 rounded transition-colors ${
                                    hasDeps
                                      ? 'text-gray-300 dark:text-zinc-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Batch Form */}
          {canCreate && (
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span>Create B.E. Cohort Batch</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Batches represent entire B.E. cohorts (e.g. 2026–2030). Automatically bound to SIT Tumkur.
                </p>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
                <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Auto-bound Institution & Program</span>
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    {sitCollege?.name || 'Siddaganga Institute of Technology, Tumkur'} • Bachelor of Engineering (B.E.)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Admission Year
                    </label>
                    <input
                      type="number"
                      required
                      min="1950"
                      max="2100"
                      value={newBatch.admissionYear}
                      onChange={(e) => {
                        const adm = Number(e.target.value);
                        setNewBatch((prev) => ({
                          ...prev,
                          admissionYear: adm,
                          graduationYear: adm ? adm + 4 : prev.graduationYear
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      required
                      min="1950"
                      max="2100"
                      value={newBatch.graduationYear}
                      onChange={(e) =>
                        setNewBatch((prev) => ({
                          ...prev,
                          graduationYear: Number(e.target.value)
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2 rounded bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-mono">Cohort Name:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold font-mono">
                    {newBatch.admissionYear}–{newBatch.graduationYear || Number(newBatch.admissionYear) + 4}
                  </span>
                </div>

                {newBatch.admissionYear && newBatch.graduationYear && (newBatch.graduationYear - newBatch.admissionYear !== 4) && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Graduation year must be exactly 4 years after admission ({newBatch.admissionYear} → {Number(newBatch.admissionYear) + 4})</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors text-xs shadow-sm"
                >
                  Create Cohort Batch
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Official Semesters */}
      {isSuper && activeTab === 'semesters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  SIT Official Baseline Semesters
                </h2>
                <span className="text-[11px] text-gray-500">
                  ({displayedSemesters.length} of {semesters.length} scheduled)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Cohort Filter:</span>
                <select
                  value={semesterBatchFilter}
                  onChange={(e) => setSemesterBatchFilter(e.target.value)}
                  className="px-2 py-1 rounded text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Cohorts ({batches.length})</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name || `${b.admissionYear}–${b.graduationYear}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {displayedSemesters.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs space-y-2">
                <Layers className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  No Official Semesters Found
                </div>
                <p className="text-[11px] text-gray-500">
                  {semesterBatchFilter !== 'ALL'
                    ? 'No official semesters scheduled yet for this cohort. Schedule one using the form on the right.'
                    : 'No official semesters scheduled yet for SIT. Schedule an official semester baseline for a batch cohort.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 font-semibold text-gray-600 dark:text-gray-400">
                      <th className="p-3">Batch</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Linked Records</th>
                      <th className="p-3">Status</th>
                      {(canUpdateSemester || canDeleteSemester) && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {displayedSemesters.map((s) => {
                      const start = s.startDate ? new Date(s.startDate) : null;
                      const end = s.endDate ? new Date(s.endDate) : null;
                      const durationDays = start && end ? Math.round((end - start) / (1000 * 60 * 60 * 24)) : null;
                      const hasDeps = Boolean(s.hasDependencies || (s.totalDependencies && s.totalDependencies > 0));

                      const statusColor =
                        s.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                          : s.status === 'Upcoming'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                          : s.status === 'Completed'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60'
                          : s.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

                      return (
                        <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {s.batch?.name || 'N/A'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {s.batch?.admissionYear}–{s.batch?.graduationYear}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                            Semester {s.number}
                          </td>
                          <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                            {start ? start.toLocaleDateString() : 'TBD'}
                          </td>
                          <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                            {end ? end.toLocaleDateString() : 'TBD'}
                          </td>
                          <td className="p-3 font-mono text-gray-500 dark:text-gray-400">
                            {durationDays ? `${durationDays} days (${Math.round(durationDays / 7)} wks)` : '—'}
                          </td>
                          <td className="p-3">
                            {hasDeps ? (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-mono"
                                title={`${s.sectionsCount || 0} section(s), ${s.timetablesCount || 0} timetable(s), ${s.eventsCount || 0} event(s) linked`}
                              >
                                {s.sectionsCount || 0} Secs • {s.eventsCount || 0} Evts
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-mono">0 Linked</span>
                            )}
                          </td>
                          <td className="p-3">
                            {canUpdateSemester ? (
                              <select
                                value={s.status}
                                onChange={(e) => handleUpdateSemesterStatus(s._id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer bg-white dark:bg-zinc-900 ${statusColor}`}
                              >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Archived">Archived</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {s.status}
                              </span>
                            )}
                          </td>
                          {(canUpdateSemester || canDeleteSemester) && (
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canUpdateSemester && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSemester(s)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                                    title={hasDeps ? "Edit dates & status (semester number locked by dependencies)" : "Edit Semester"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDeleteSemester && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSemester(s)}
                                    className={`p-1.5 rounded transition-colors ${
                                      hasDeps
                                        ? 'text-gray-300 dark:text-zinc-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                        : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                                    }`}
                                    title={hasDeps ? "Cannot delete: academic records are linked. Archive or cancel instead." : "Delete Semester"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Schedule Semester Form */}
          {canCreateSemester && (
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span>Schedule Official Semester</span>
                </h3>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Configure official semester calendar baseline for a B.E. cohort.
                </p>
              </div>

              {/* Context Banner */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                <div className="font-semibold">SIT Tumkur • Bachelor of Engineering (B.E.)</div>
                <div className="text-[11px] opacity-80 mt-0.5">Official dates define the baseline period for weekly timetables, classes, and academic events.</div>
              </div>

              <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Batch Cohort</label>
                  <select
                    required
                    value={newSemester.batchId}
                    onChange={(e) => setNewSemester({ ...newSemester, batchId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select B.E. Cohort...</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name} ({b.admissionYear}–{b.graduationYear})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Semester</label>
                    <select
                      required
                      value={newSemester.number}
                      onChange={(e) => setNewSemester({ ...newSemester, number: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Initial Status</label>
                    <select
                      value={newSemester.status}
                      onChange={(e) => setNewSemester({ ...newSemester, status: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Official Start Date</label>
                    <input
                      type="date"
                      required
                      value={newSemester.startDate}
                      onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Official End Date</label>
                    <input
                      type="date"
                      required
                      value={newSemester.endDate}
                      onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {newSemester.startDate && newSemester.endDate && new Date(newSemester.startDate) >= new Date(newSemester.endDate) && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Official start date must be before end date</span>
                  </div>
                )}

                {/* Compact Live Timeline Summary */}
                {newSemester.batchId && (
                  <div className="p-2.5 rounded bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 text-[11px] space-y-1">
                    <div className="text-gray-500 font-mono text-[10px] uppercase">Authoritative Timeline Preview</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                      <span>{batches.find(b => String(b._id) === String(newSemester.batchId))?.name || 'Cohort'}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">Semester {newSemester.number}</span>
                    </div>
                    <div className="font-mono text-gray-600 dark:text-gray-400 text-[10.5px]">
                      {newSemester.startDate ? new Date(newSemester.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Start Date'} → {newSemester.endDate ? new Date(newSemester.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'End Date'}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors text-xs shadow-sm"
                >
                  Schedule Official Semester
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Class Sections */}
      {isSuper && activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  SIT Class Sections
                </h2>
                <span className="text-[11px] text-gray-500">
                  ({displayedSections.length} of {sections.length} sections)
                </span>
              </div>
            </div>

            {/* Compact Filter Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-gray-50 dark:bg-zinc-900/60 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Cohort
                </label>
                <select
                  value={sectionBatchFilter}
                  onChange={(e) => {
                    setSectionBatchFilter(e.target.value);
                    setSectionSemesterFilter('ALL');
                  }}
                  className="w-full px-2 py-1 rounded text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Cohorts ({batches.length})</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name || `${b.admissionYear}–${b.graduationYear}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Semester
                </label>
                <select
                  value={sectionSemesterFilter}
                  onChange={(e) => setSectionSemesterFilter(e.target.value)}
                  className="w-full px-2 py-1 rounded text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Semesters</option>
                  {Array.from(new Set(availableSemestersForSectionFilter.map((s) => s.number)))
                    .sort((a, b) => a - b)
                    .map((num) => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Branch
                </label>
                <select
                  value={sectionBranchFilter}
                  onChange={(e) => setSectionBranchFilter(e.target.value)}
                  className="w-full px-2 py-1 rounded text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Branches ({branches.length})</option>
                  {branches.map((br) => (
                    <option key={br._id} value={br._id}>{br.shortName || br.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={sectionStatusFilter}
                  onChange={(e) => setSectionStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 rounded text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {displayedSections.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs">
                {sections.length === 0
                  ? 'No class sections created yet for SIT. Create a section linked to a batch cohort, semester, and branch.'
                  : 'No class sections match the active filter criteria.'}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 font-semibold text-gray-600 dark:text-gray-400">
                      <th className="p-3">Section</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Room</th>
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Linked Records</th>
                      <th className="p-3">Status</th>
                      {(canUpdate || canDelete) && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {displayedSections.map((sec) => (
                      <tr key={sec._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>Section {sec.name}</span>
                            {sec.hasDependencies && (
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" title="Core identity locked (has linked academic records)" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                            {sec.branch?.shortName || sec.branch?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Semester {sec.semester}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {sec.batch?.name || 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                          {sec.room ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[11px]">
                              {sec.room}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                          {sec.capacity || 60}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <span className="text-gray-600 dark:text-gray-400" title={`${sec.timetablesCount || 0} timetable entries`}>
                              {sec.timetablesCount || 0} TT
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-gray-600 dark:text-gray-400" title={`${sec.studentsCount || 0} enrolled students`}>
                              {sec.studentsCount || 0} Std
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {canUpdate ? (
                            <select
                              value={sec.status}
                              onChange={(e) => handleUpdateSectionStatus(sec._id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border border-transparent outline-none cursor-pointer ${
                                sec.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Archived">Archived</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sec.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {sec.status}
                            </span>
                          )}
                        </td>
                        {(canUpdate || canDelete) && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSection(sec)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                                  title="Edit Section"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSection(sec)}
                                  className={`p-1.5 rounded transition-colors ${
                                    sec.hasDependencies
                                      ? 'text-gray-300 dark:text-zinc-600 hover:text-amber-600 dark:hover:text-amber-400 cursor-not-allowed'
                                      : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                  }`}
                                  title={sec.hasDependencies ? "Cannot delete: section has linked academic records" : "Delete Section"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Section Form */}
          {canCreate && (
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span>Create Class Section</span>
                </h3>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Add an official section for SIT B.E.
                </p>
              </div>

              {/* Context Banner */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                <div className="font-semibold">SIT Tumkur • Bachelor of Engineering (B.E.)</div>
                <div className="text-[11px] opacity-80 mt-0.5">Sections are scoped to a specific Batch cohort, Semester, and Branch.</div>
              </div>

              <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Batch Cohort</label>
                  <select
                    required
                    value={newSection.batchId}
                    onChange={(e) => setNewSection({ ...newSection, batchId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select B.E. Cohort...</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name} ({b.admissionYear}–{b.graduationYear})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Semester</label>
                    {(() => {
                      const scheduledForBatch = semesters
                        .filter((s) => String(s.batch?._id || s.batch) === String(newSection.batchId))
                        .sort((a, b) => a.number - b.number);
                      return (
                        <>
                          <select
                            required
                            value={newSection.semester}
                            onChange={(e) => setNewSection({ ...newSection, semester: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            {scheduledForBatch.length > 0 ? (
                              scheduledForBatch.map((s) => (
                                <option key={s.number} value={s.number}>
                                  Semester {s.number} ({s.status})
                                </option>
                              ))
                            ) : (
                              [1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                              ))
                            )}
                          </select>
                          {newSection.batchId && scheduledForBatch.length === 0 && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                              Note: No official semesters scheduled yet for this batch.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Branch</label>
                    <select
                      required
                      value={newSection.branchId}
                      onChange={(e) => setNewSection({ ...newSection, branchId: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Branch...</option>
                      {branches.map((br) => (
                        <option key={br._id} value={br._id}>{br.shortName} - {br.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Section Name</label>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      value={newSection.name}
                      onChange={(e) => setNewSection({ ...newSection, name: e.target.value.toUpperCase() })}
                      placeholder="e.g. A, B, A1"
                      pattern="^[A-Za-z]{1,2}[0-9]?$"
                      title="1-2 letters optionally followed by a number (e.g. A, B, A1)"
                      className="w-full px-3 py-1.5 font-mono uppercase rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Default Room (Optional)</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={newSection.room || ''}
                      onChange={(e) => setNewSection({ ...newSection, room: e.target.value })}
                      placeholder="e.g. LH-201, Room 104"
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newSection.capacity}
                    onChange={(e) => setNewSection({ ...newSection, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors text-xs shadow-sm"
                >
                  Create Section
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Timetable Settings */}
      {activeTab === 'timetable_structure' && (
        <div className="space-y-6">
          {/* SUB-VIEW 1: CSES Institutional Timetable Settings Configuration Sheet */}
          {(() => {
            const earliestStart = draftCollegeStartMinute;
            const latestEnd = draftCollegeEndMinute;
            const activePeriodsCount = calculatedPeriods.length;
            const activeBreaksCount = (draftBreaks || []).filter(b => b.status !== 'Retired').length;
            const activeWorkingDaysCount = draftWorkingDays.filter(w => w.status === 'Full Day' || w.status === 'Half Day').length;

            const standardClassDuration = draftClassDuration;
            const morningBreak = (draftBreaks || []).find(b => b.startMinute < 720);
            const lunchBreak = (draftBreaks || []).find(b => (b.name && b.name.toLowerCase().includes('lunch')) || b.startMinute >= 720);

            const saturdayPeriodsCount = saturdayPeriods.length;
            const saturdayStart = saturdayPeriods.length > 0 ? saturdayPeriods[0].startMinute : null;
            const saturdayEnd = saturdayPeriods.length > 0 ? saturdayPeriods[saturdayPeriods.length - 1].endMinute : null;

            return (
              <div className="space-y-4">
                {/* Header Strip */}
                <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {timetableStructure?.name || 'SIT Institutional Timetable Settings'}
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Authoritative Grid
                      </span>
                      {!isSuper && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Read Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      College-wide timetable baseline for Siddaganga Institute of Technology. All class sections inherit these standardized period windows, breaks, and working days.
                    </p>
                  </div>

                  {isSuper && (
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {isSettingsDirty ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/60">
                          ● Unsaved Changes
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">
                          All changes saved
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleDiscardSettings}
                        disabled={!isSettingsDirty || settingsSaving}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Discard
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={!isSettingsDirty || Boolean(settingsValidationError) || settingsSaving}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Validation Error Banner */}
                {settingsValidationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="font-semibold">{settingsValidationError}</span>
                  </div>
                )}

                {/* AREA 1: Working Days Policy */}
                <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        1. Weekly Working Days Policy
                      </h3>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Sunday locked as Non-Working • Saturday operates as Half Day
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {draftWorkingDays.map((wd) => {
                        const isSunday = wd.dayOfWeek === 7;
                        return (
                          <div
                            key={wd.dayOfWeek}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-2 ${
                              isSunday
                                ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                                : wd.status === 'Full Day'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                : wd.status === 'Half Day'
                                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                                : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                                {wd.dayName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                D{wd.dayOfWeek}
                              </span>
                            </div>

                            {isSunday ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
                                <Lock className="w-3 h-3 text-zinc-400" />
                                <span>Non-Working</span>
                              </div>
                            ) : isSuper ? (
                              <select
                                value={wd.status}
                                onChange={(e) => handleWorkingDayChange(wd.dayOfWeek, e.target.value)}
                                className={`w-full px-2 py-1 rounded text-xs font-semibold border cursor-pointer bg-white dark:bg-zinc-900 ${
                                  wd.status === 'Full Day'
                                    ? 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                    : wd.status === 'Half Day'
                                    ? 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : 'text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                <option value="Full Day">Full Day</option>
                                <option value="Half Day">Half Day</option>
                                <option value="Non-Working">Non-Working</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-center text-[11px] font-bold border ${
                                wd.status === 'Full Day'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : wd.status === 'Half Day'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              }`}>
                                {wd.status}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* AREA 2: Period & Break Structure (In-Place CSES Configuration Sheet) */}
                <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>2. Period & Break Structure</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Institutional schedule pattern and daily operational grid. Modify timings, duration, and breaks below to dynamically recalculate teaching periods.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSuper && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSettings(prev => !prev)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                            isEditingSettings
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-2xs'
                          }`}
                        >
                          {isEditingSettings ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Done Editing</span>
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Schedule</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CSES In-Place Editable Sheet Table */}
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-2/5 sm:w-1/3">Setting</th>
                            <th className="py-2.5 px-4">Configured Value</th>
                            <th className="py-2.5 px-4 text-right text-[10px] text-gray-400 hidden sm:table-cell">Policy / Calculation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {/* 1. Normal Day Start Time & End Time */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">1. Normal Day Operating Timings</div>
                              <div className="text-[11px] text-gray-500">School/College opening and closing bell</div>
                            </td>
                            <td className="py-3 px-4">
                              {isEditingSettings ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded px-2 py-1">
                                    <span className="text-[11px] text-gray-500 font-medium">Start:</span>
                                    <input
                                      type="time"
                                      value={minutesToTime(draftCollegeStartMinute)}
                                      onChange={(e) => setDraftCollegeStartMinute(timeToMinutes(e.target.value))}
                                      className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-gray-400 font-mono">→</span>
                                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded px-2 py-1">
                                    <span className="text-[11px] text-gray-500 font-medium">End:</span>
                                    <input
                                      type="time"
                                      value={minutesToTime(draftCollegeEndMinute)}
                                      onChange={(e) => setDraftCollegeEndMinute(timeToMinutes(e.target.value))}
                                      className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                                    ({Math.floor((draftCollegeEndMinute - draftCollegeStartMinute) / 60)}h {(draftCollegeEndMinute - draftCollegeStartMinute) % 60}m span)
                                  </span>
                                </div>
                              ) : (
                                <div className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                  {minutesToTime(draftCollegeStartMinute)} – {minutesToTime(draftCollegeEndMinute)}
                                  <span className="ml-2 font-normal text-xs text-gray-500">
                                    ({formatTime12(draftCollegeStartMinute)} – {formatTime12(draftCollegeEndMinute)})
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell">
                              Standard daily operating envelope
                            </td>
                          </tr>

                          {/* 2. Class Duration */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">2. Class Duration</div>
                              <div className="text-[11px] text-gray-500">Single instructional period length</div>
                            </td>
                            <td className="py-3 px-4">
                              {isEditingSettings ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={draftClassDuration}
                                    onChange={(e) => setDraftClassDuration(Number(e.target.value))}
                                    className="px-2.5 py-1 text-xs font-mono font-bold rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 cursor-pointer"
                                  >
                                    <option value={40}>40 mins</option>
                                    <option value={45}>45 mins</option>
                                    <option value={50}>50 mins (Standard SIT)</option>
                                    <option value={55}>55 mins</option>
                                    <option value={60}>60 mins (1 hour)</option>
                                  </select>
                                  <span className="text-[11px] text-gray-400">per lecture period</span>
                                </div>
                              ) : (
                                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                  {draftClassDuration} mins
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell">
                              Basis for automatic period calculations
                            </td>
                          </tr>

                          {/* Lab Duration (Companion Setting) */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">Lab Duration</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold">
                                  Allocator Rule
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500">Consecutive duration for practical laboratory sessions</div>
                            </td>
                            <td className="py-3 px-4">
                              {isEditingSettings ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={draftLabDuration}
                                    onChange={(e) => setDraftLabDuration(Number(e.target.value))}
                                    className="px-2.5 py-1 text-xs font-mono font-bold rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 cursor-pointer"
                                  >
                                    <option value={draftClassDuration}>{draftClassDuration} mins (1 period)</option>
                                    <option value={draftClassDuration * 2}>{draftClassDuration * 2} mins (2 periods)</option>
                                    <option value={draftClassDuration * 3}>{draftClassDuration * 3} mins (3 periods)</option>
                                    <option value={100}>100 mins</option>
                                    <option value={150}>150 mins</option>
                                    <option value={180}>180 mins</option>
                                  </select>
                                  <span className="text-[11px] text-gray-400">
                                    ({Math.round(draftLabDuration / draftClassDuration)} consecutive periods)
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                  {draftLabDuration} mins ({Math.round(draftLabDuration / draftClassDuration)} periods)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell">
                              Timetable allocator automatically reserves consecutive slots
                            </td>
                          </tr>

                          {/* 3. Breaks with each duration */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4 align-top">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">3. Scheduled Breaks</div>
                              <div className="text-[11px] text-gray-500">Tea break, lunch interval, and recesses</div>
                              {isEditingSettings && (
                                <button
                                  type="button"
                                  onClick={handleAddBreakItem}
                                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Break</span>
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isEditingSettings ? (
                                <div className="space-y-2">
                                  {draftBreaks.map((b, idx) => {
                                    const bEnd = Number(b.startMinute) + Number(b.duration || 15);
                                    const isLunch = b.name.toLowerCase().includes('lunch');
                                    return (
                                      <div
                                        key={b.id || idx}
                                        className="flex flex-wrap items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-[130px] flex-1 sm:flex-initial">
                                          <span className="text-xs">
                                            {isLunch ? '🍱' : '☕'}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder="Break Name"
                                            value={b.name}
                                            onChange={(e) => handleUpdateBreakItem(idx, 'name', e.target.value)}
                                            className="w-full px-2 py-1 text-xs font-semibold rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded px-1.5 py-1">
                                          <span className="text-[10px] text-gray-400 font-medium">Start:</span>
                                          <input
                                            type="time"
                                            value={minutesToTime(b.startMinute)}
                                            onChange={(e) => handleUpdateBreakItem(idx, 'startMinute', timeToMinutes(e.target.value))}
                                            className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none cursor-pointer"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded px-1.5 py-1">
                                          <span className="text-[10px] text-gray-400 font-medium">Dur:</span>
                                          <input
                                            type="number"
                                            min="5"
                                            max="180"
                                            step="5"
                                            value={b.duration}
                                            onChange={(e) => handleUpdateBreakItem(idx, 'duration', Number(e.target.value))}
                                            className="w-12 text-xs font-mono font-bold text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none"
                                          />
                                          <span className="text-[10px] text-gray-400">m</span>
                                        </div>

                                        <span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                                          → {minutesToTime(bEnd)}
                                        </span>

                                        {draftBreaks.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteBreakItem(idx)}
                                            className="p-1 text-red-400 hover:text-red-600 rounded transition-colors ml-auto cursor-pointer"
                                            title="Remove break"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {draftBreaks.map((b, idx) => {
                                    const bEnd = Number(b.startMinute) + Number(b.duration || (b.endMinute - b.startMinute) || 15);
                                    const isLunch = b.name.toLowerCase().includes('lunch');
                                    return (
                                      <div key={b.id || idx} className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                          {isLunch ? '🍱' : '☕'} {b.name}:
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                          {b.duration} mins
                                        </span>
                                        <span className="font-mono text-gray-500 dark:text-gray-400 text-[11px]">
                                          ({minutesToTime(b.startMinute)} – {minutesToTime(bEnd)})
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell align-top">
                              Pauses inserted into teaching schedule
                            </td>
                          </tr>

                          {/* 4. Calculate Automatically the Classes or Periods */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 bg-blue-50/20 dark:bg-blue-950/10">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">4. Number of Periods</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold uppercase tracking-wider">
                                  Auto-Calculated
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500">Dynamically fitted teaching capacity</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-mono font-bold text-sm">
                                  {calculatedPeriods.length} periods / day
                                </span>
                                {calculatedPeriods.length > 0 && (
                                  <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                                    (P1: {minutesToTime(calculatedPeriods[0].startMinute)} → P{calculatedPeriods.length}: {minutesToTime(calculatedPeriods[calculatedPeriods.length - 1].endMinute)})
                                  </span>
                                )}
                              </div>
                              {calculatedPeriods.length > 0 && (() => {
                                const lastP = calculatedPeriods[calculatedPeriods.length - 1];
                                const remainder = draftCollegeEndMinute - lastP.endMinute;
                                if (remainder > 0) {
                                  return (
                                    <div className="text-[10px] text-gray-400 mt-1">
                                      ⚡ {remainder} mins unallocated buffer before college closing ({minutesToTime(draftCollegeEndMinute)})
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell">
                              Automatically updates on timing, duration, or break changes
                            </td>
                          </tr>

                          {/* Saturday Periods & Duration (Auto-Calculated) */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">Saturday Periods & Duration</div>
                              <div className="text-[11px] text-gray-500">Weekend operating capacity</div>
                            </td>
                            <td className="py-3 px-4">
                              {saturdayWorkingDay?.status === 'Non-Working' ? (
                                <span className="font-mono font-bold text-zinc-500">
                                  0 periods (College Off)
                                </span>
                              ) : saturdayPeriods.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                    {saturdayPeriods.length} periods ({saturdayWorkingDay?.status || 'Half Day'})
                                  </span>
                                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                    ({minutesToTime(saturdayPeriods[0].startMinute)} – {minutesToTime(saturdayPeriods[saturdayPeriods.length - 1].endMinute)})
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-gray-500">No morning periods available</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-[11px] hidden sm:table-cell">
                              Derived from Saturday working day policy
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Timeline Preview Ribbon */}
                  <div className="p-3.5 bg-gray-50/50 dark:bg-zinc-900/40 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Timeline Preview</span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded ml-1">
                          Live
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {minutesToTime(draftCollegeStartMinute)} → {minutesToTime(draftCollegeEndMinute)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto py-1 px-0.5 scrollbar-thin text-xs">
                      {/* College Start */}
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold shrink-0">
                        {minutesToTime(draftCollegeStartMinute)}
                      </span>
                      <span className="text-gray-300 dark:text-zinc-600 font-mono shrink-0 px-0.5">─</span>

                      {activeTimelineItems.map((item, idx) => {
                        const isPeriod = item.type === 'period';
                        const isLunch = !isPeriod && item.name.toLowerCase().includes('lunch');
                        const itemDuration = item.endMinute - item.startMinute;

                        return (
                          <React.Fragment key={item.id || idx}>
                            {isPeriod ? (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0 shadow-2xs cursor-default"
                                title={`${item.name}: ${minutesToTime(item.startMinute)} – ${minutesToTime(item.endMinute)} (${itemDuration}m)`}
                              >
                                P{item.periodNumber || (idx + 1)}
                              </span>
                            ) : isLunch ? (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0 shadow-2xs cursor-default"
                                title={`${item.name}: ${minutesToTime(item.startMinute)} – ${minutesToTime(item.endMinute)} (${itemDuration}m)`}
                              >
                                🍱 Lunch ({itemDuration}m)
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 shadow-2xs cursor-default"
                                title={`${item.name}: ${minutesToTime(item.startMinute)} – ${minutesToTime(item.endMinute)} (${itemDuration}m)`}
                              >
                                ☕ Break ({itemDuration}m)
                              </span>
                            )}

                            {idx < activeTimelineItems.length - 1 && (
                              <span className="text-gray-300 dark:text-zinc-600 font-mono shrink-0 px-0.5">─</span>
                            )}
                          </React.Fragment>
                        );
                      })}

                      <span className="text-gray-300 dark:text-zinc-600 font-mono shrink-0 px-0.5">─</span>
                      {/* College End */}
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold shrink-0">
                        {minutesToTime(draftCollegeEndMinute)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AREA 3: Summary & Actions Bar */}
                <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>
                        Operating Hours: <strong>{earliestStart != null ? `${minutesToTime(earliestStart)} – ${minutesToTime(latestEnd)}` : '08:00 – 17:00'}</strong>
                      </span>
                      {earliestStart != null && latestEnd != null && (
                        <span className="text-[11px] font-mono text-gray-400">
                          ({((latestEnd - earliestStart) / 60).toFixed(1)} hrs)
                        </span>
                      )}
                    </div>

                    <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block" />

                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>Periods: <strong className="text-gray-800 dark:text-gray-200">{activePeriodsCount}</strong></span>
                      <span>•</span>
                      <span>Breaks: <strong className="text-gray-800 dark:text-gray-200">{activeBreaksCount}</strong></span>
                      <span>•</span>
                      <span>Working Days: <strong className="text-gray-800 dark:text-gray-200">{activeWorkingDaysCount}/7</strong></span>
                    </div>
                  </div>

                  {isSuper && (
                    <div className="flex items-center gap-3">
                      {isSettingsDirty ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                          ● Unsaved Changes
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          All settings saved
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleDiscardSettings}
                        disabled={!isSettingsDirty || settingsSaving}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Discard
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={!isSettingsDirty || Boolean(settingsValidationError) || settingsSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Invariant Protection Notice */}
                <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-600 dark:text-gray-400 text-[11px] flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Attendance Safety Invariant:</strong> Institutional timetable settings define the time grid and slot boundaries for projected classes. Historical student attendance records and completed classes remain 100% immutable and unaffected.
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 5: Weekly Timetable */}
      {activeTab === 'weekly_timetable' && (
        <div className="space-y-6">
          {/* Section Selector Toolbar */}
          <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Class Section Timetable Assignments</span>
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Select an authorized section to manage its class slots adhering to the SIT Bell Schedule.
                    </p>
                  </div>

              {ttData?.timetable?.status && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    ttData.timetable.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                      : ttData.timetable.status === 'Archived'
                      ? 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                  }`}>
                    ● {ttData.timetable.status.toUpperCase()}
                  </span>
                  {ttData.timetable.publishedAt && (
                    <span className="text-[10px] text-gray-400">
                      Published: {new Date(ttData.timetable.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Cascading Selectors: Batch -> Official Semester -> Department/Branch -> Class Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Batch */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  1. Cohort Batch
                </label>
                <select
                  value={ttBatchId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setTtBatchId(bId);
                    setTtSemesterNum('');
                    if (isSuper) setTtBranchId('');
                    setTtSectionId('');
                    setTtData(null);
                    setTtSlots({});
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name || `${b.admissionYear}–${b.graduationYear}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Official Semester */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  2. Official Semester
                </label>
                <select
                  value={ttSemesterNum}
                  disabled={!ttBatchId}
                  onChange={(e) => {
                    setTtSemesterNum(e.target.value);
                    if (isSuper) setTtBranchId('');
                    setTtSectionId('');
                    setTtData(null);
                    setTtSlots({});
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!ttBatchId
                      ? '-- Select Batch First --'
                      : availableSemestersForBatch.length === 0
                      ? '-- No Semesters for Batch --'
                      : '-- Select Official Semester --'}
                  </option>
                  {availableSemestersForBatch.map((s) => (
                    <option key={s._id} value={s.number}>
                      {s.label || `Semester ${s.number}`} {s.status ? `(${s.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Department / Branch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    3. Department / Branch
                  </label>
                  {!isSuper && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300">
                      Your Department
                    </span>
                  )}
                </div>
                <select
                  value={ttBranchId}
                  disabled={!ttBatchId || !ttSemesterNum || !isSuper}
                  onChange={(e) => {
                    setTtBranchId(e.target.value);
                    setTtSectionId('');
                    setTtData(null);
                    setTtSlots({});
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 ${
                    !ttBatchId || !ttSemesterNum
                      ? 'opacity-50 cursor-not-allowed'
                      : !isSuper
                      ? 'opacity-85 cursor-not-allowed bg-gray-50 dark:bg-zinc-800/60'
                      : ''
                  }`}
                >
                  <option value="">
                    {!ttBatchId || !ttSemesterNum ? '-- Select Semester First --' : '-- Select Department --'}
                  </option>
                  {availableBranchesForTimetable.map((br) => (
                    <option key={br._id} value={br._id}>
                      {br.name} ({br.shortName || br.code || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Class Section */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  4. Class Section
                </label>
                <select
                  value={ttSectionId}
                  disabled={!ttBatchId || !ttSemesterNum || !ttBranchId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTtSectionId(id);
                    if (id) {
                      fetchSectionTimetable(id);
                    } else {
                      setTtData(null);
                      setTtSlots({});
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs border border-blue-500 font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-200 dark:disabled:border-zinc-700 disabled:text-gray-400"
                >
                  <option value="">
                    {!ttBatchId || !ttSemesterNum || !ttBranchId
                      ? '-- Select Hierarchy First --'
                      : availableSectionsForTimetable.length === 0
                      ? '-- No Sections in Department --'
                      : '-- Select Class Section --'}
                  </option>
                  {availableSectionsForTimetable.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name} ({sec.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Timetable Workspace */}
          {!ttSectionId ? (
            <div className="bg-white dark:bg-[#18181b] p-12 text-center rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Select an Academic Section
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Choose a cohort batch, semester, branch, and section from the toolbar above to load or configure its weekly period schedule.
              </p>
            </div>
          ) : ttLoading ? (
            <div className="bg-white dark:bg-[#18181b] p-12 text-center rounded-lg border border-gray-200 dark:border-zinc-800">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              <p className="mt-2 text-xs text-gray-500">Loading section timetable...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Actions & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18181b] p-3 rounded-lg border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                    {ttData?.section?.name || 'A'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {ttData?.section?.branch?.name} ({ttData?.section?.branch?.shortName || ttData?.section?.branch?.code || ''}) — Semester {ttData?.section?.semester} [Section {ttData?.section?.name}]
                    </h3>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span>Batch: {ttData?.section?.batch?.name}</span>
                      <span>•</span>
                      <span>
                        Semester Dates: {ttData?.semesterDoc?.startDate ? new Date(ttData.semesterDoc.startDate).toLocaleDateString() : 'TBD'} → {ttData?.semesterDoc?.endDate ? new Date(ttData.semesterDoc.endDate).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearGrid}
                    disabled={ttSaving || ttData?.timetable?.status === 'Published' || ttData?.timetable?.status === 'Archived'}
                    title={ttData?.timetable?.status === 'Published' ? 'Timetable is published and protected. Reopen to edit.' : 'Clear all slots'}
                    className="px-2.5 py-1 text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Clear Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTimetable('Draft')}
                    disabled={ttSaving || ttData?.timetable?.status === 'Published' || ttData?.timetable?.status === 'Archived'}
                    title={ttData?.timetable?.status === 'Published' ? 'Timetable is published. Reopen for editing to modify.' : 'Save changes as Draft'}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                  {ttData?.timetable?.status !== 'Published' ? (
                    <button
                      type="button"
                      onClick={handlePublishTimetable}
                      disabled={ttSaving || ttData?.timetable?.status === 'Archived'}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50 shadow-sm transition-all"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Publish Timetable</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleReopenTimetable}
                        disabled={ttSaving}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 rounded shadow-xs transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Reopen for Editing</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleArchiveTimetable}
                        disabled={ttSaving}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Context Summary Strip */}
              <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Section:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                      {ttData?.section?.branch?.shortName || ttData?.section?.branch?.code || ttData?.section?.branch?.name || 'Unknown Department'} - Section {ttData?.section?.name || '?'}
                    </span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Semester:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {ttData?.section?.batch?.name || 'Cohort'} • Semester {ttData?.section?.semester}
                    </span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] uppercase tracking-wider border ${
                      ttData?.timetable?.status === 'Published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : ttData?.timetable?.status === 'Archived'
                        ? 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      ● {ttData?.timetable?.status ? ttData.timetable.status.toUpperCase() : 'DRAFT'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                  <span>
                    Allocated: <strong className="text-zinc-800 dark:text-zinc-200">{Object.values(ttSlots).filter(s => s.subject).length}</strong> slots
                  </span>
                  {ttData?.timetable?.status === 'Published' && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                      <Lock className="w-3 h-3" /> Published & Protected
                    </span>
                  )}
                </div>
              </div>

              {/* Standard Timing Guide Strip */}
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-2.5 rounded text-[11px] text-blue-800 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>SIT Standard Bell Schedule:</strong> {ttData?.periodDefinitions?.length || 7} Teaching Periods ({ttData?.periodDefinitions?.[0]?.timeSlot?.split('–')?.[0] || '08:00'} – {ttData?.periodDefinitions?.[ttData?.periodDefinitions?.length - 1]?.timeSlot?.split('–')?.[1] || '16:00'}) • Standard Durations
                </span>
                <span className="font-semibold">
                  Working Days Policy Inherited from Institutional Timetable Structure
                </span>
              </div>

              {/* Weekly Period Grid Table */}
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80 text-gray-700 dark:text-gray-300 font-bold">
                      <th className="p-2.5 w-24 border-r border-gray-200 dark:border-zinc-800 text-center">Day</th>
                      {sectionGridColumns.map((col, cIdx) => {
                        if (col.type === 'break') {
                          return (
                            <th
                              key={`brk-head-${cIdx}`}
                              className="p-1.5 text-center border-r border-gray-100 dark:border-zinc-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium w-16"
                            >
                              <div className="truncate max-w-[70px]">{col.name}</div>
                              <div className="text-[9px] font-normal font-mono opacity-80">{col.timeSlot}</div>
                            </th>
                          );
                        }
                        return (
                          <th
                            key={`period-head-${col.periodNumber}`}
                            className="p-2 text-center border-r border-gray-100 dark:border-zinc-800 min-w-[90px]"
                          >
                            <div>{col.name}</div>
                            <div className="text-[10px] font-normal text-gray-400 font-mono">{col.timeSlot}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {sectionWorkingDays.map(({ dayNum, name, status, maxPeriods }) => {
                      const isHalfDay = status === 'Half Day';
                      const effectiveMaxPeriods = maxPeriods || (isHalfDay ? 4 : 999);

                      return (
                        <tr key={dayNum} className="hover:bg-gray-50/40 dark:hover:bg-zinc-800/30">
                          <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-zinc-800 text-center bg-gray-50/50 dark:bg-zinc-900/40">
                            <div>{name}</div>
                            {isHalfDay && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                                Half Day
                              </span>
                            )}
                          </td>

                          {sectionGridColumns.map((col, cIdx) => {
                            if (col.type === 'break') {
                              return (
                                <td
                                  key={`brk-cell-${cIdx}`}
                                  className="p-1 border-r border-gray-100 dark:border-zinc-800 bg-amber-50/20 dark:bg-amber-950/10 text-center text-[10px] text-amber-600/70 dark:text-amber-400/50 font-mono"
                                  title={`${col.name} (${col.timeSlot})`}
                                >
                                  ☕
                                </td>
                              );
                            }

                            const isPeriodAllowed = !isHalfDay || col.periodNumber <= effectiveMaxPeriods;
                            if (!isPeriodAllowed) {
                              return (
                                <td
                                  key={`off-${col.periodNumber}`}
                                  className="p-1.5 border-r border-gray-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-center text-[10px] text-gray-400 italic"
                                >
                                  Off
                                </td>
                              );
                            }

                            return renderSlotCell(dayNum, col.periodNumber);
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subject Allocation & Workload Summary Table */}
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Subject Allocation & Class Count Summary</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      120-minute laboratory sessions occupy 2 periods but count as 1 class session per batch (B1 / B2).
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Total Teaching Sessions: <strong className="text-zinc-800 dark:text-zinc-200">{
                      (() => {
                        const slotsArr = Object.values(ttSlots).filter(s => s.subject);
                        const theoryCount = slotsArr.filter(s => (s.classType || s.lectureType) !== 'Lab').length;
                        const labGroupIds = new Set();
                        let labStandalone = 0;
                        slotsArr.filter(s => (s.classType || s.lectureType) === 'Lab').forEach(s => {
                          if (s.sessionGroupId) {
                            labGroupIds.add(`${s.sessionGroupId}_${s.batchGroup || 'B1'}`);
                          } else {
                            labStandalone += 1;
                          }
                        });
                        return theoryCount + labGroupIds.size + labStandalone;
                      })()
                    }</strong> classes / week
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/60 text-gray-700 dark:text-gray-300 font-bold">
                        <th className="p-2 w-28">Course Code</th>
                        <th className="p-2">Subject Name</th>
                        <th className="p-2 text-center w-24">Delivery Type</th>
                        <th className="p-2 text-center w-16">Credits</th>
                        <th className="p-2 text-center w-28">Theory Classes</th>
                        <th className="p-2 text-center w-36">Lab Sessions</th>
                        <th className="p-2 text-center w-24">Total Classes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {(() => {
                        const allottedSubjects = (ttData?.branchSubjects || []).filter((subj) => {
                          const slotsArr = Object.values(ttSlots).filter(s => String(s.subject) === String(subj._id));
                          return slotsArr.length > 0;
                        });

                        if (allottedSubjects.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-gray-500 dark:text-zinc-400 text-xs">
                                No subjects allotted to this section timetable yet.
                              </td>
                            </tr>
                          );
                        }

                        return allottedSubjects.map((subj) => {
                          const slotsArr = Object.values(ttSlots).filter(s => String(s.subject) === String(subj._id));
                          const theorySlots = slotsArr.filter(s => (s.classType || s.lectureType) !== 'Lab');
                          const theoryCount = theorySlots.length;

                          // Whole section labs (batchGroup === 'ALL' or empty)
                          const allLabSlots = slotsArr.filter(s => (s.classType || s.lectureType) === 'Lab' && (s.batchGroup === 'ALL' || !s.batchGroup));
                          const allLabGroupIds = new Set();
                          let allLabStandalone = 0;
                          allLabSlots.forEach(s => {
                            if (s.sessionGroupId) allLabGroupIds.add(s.sessionGroupId);
                            else allLabStandalone += 1;
                          });
                          const allLabCount = allLabGroupIds.size + allLabStandalone;

                          // Batch B1 labs
                          const b1Slots = slotsArr.filter(s => (s.classType || s.lectureType) === 'Lab' && s.batchGroup === 'B1');
                          const b1GroupIds = new Set();
                          let b1Standalone = 0;
                          b1Slots.forEach(s => {
                            if (s.sessionGroupId) b1GroupIds.add(s.sessionGroupId);
                            else b1Standalone += 1;
                          });
                          const b1Count = b1GroupIds.size + b1Standalone;

                          // Batch B2 labs
                          const b2Slots = slotsArr.filter(s => (s.classType || s.lectureType) === 'Lab' && s.batchGroup === 'B2');
                          const b2GroupIds = new Set();
                          let b2Standalone = 0;
                          b2Slots.forEach(s => {
                            if (s.sessionGroupId) b2GroupIds.add(s.sessionGroupId);
                            else b2Standalone += 1;
                          });
                          const b2Count = b2GroupIds.size + b2Standalone;

                          const isIpcc = subj.evaluationType === 'IPCC' || subj.category === 'Theory + Lab';
                          const isLabOnly = subj.evaluationType === 'LAB_ONLY' || subj.category === 'Lab Only';
                          const isTheoryOnly = subj.evaluationType === 'THEORY_ONLY' || subj.category === 'Theory';

                          const hasBatchLabs = b1Count > 0 || b2Count > 0;
                          const totalSubjClasses = theoryCount + allLabCount + (hasBatchLabs ? Math.max(b1Count, b2Count) : 0);

                          return (
                            <tr key={subj._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20">
                              <td className="p-2 font-mono font-bold text-gray-900 dark:text-gray-100">
                                {subj.code}
                              </td>
                              <td className="p-2 font-medium text-gray-800 dark:text-gray-200">
                                {subj.name}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  isIpcc
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                    : isLabOnly
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                }`}>
                                  {isIpcc ? 'Theory + Lab' : isLabOnly ? 'Lab Only' : 'Theory'}
                                </span>
                              </td>
                              <td className="p-2 text-center font-mono text-gray-600 dark:text-gray-400">
                                {subj.credits || 0}
                              </td>
                              <td className="p-2 text-center">
                                {isLabOnly ? (
                                  <span className="text-gray-400 font-mono">—</span>
                                ) : (
                                  <span className={`font-mono font-bold ${theoryCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                    {theoryCount} {theoryCount === 1 ? 'class' : 'classes'}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {isTheoryOnly ? (
                                  <span className="text-gray-400 font-mono">—</span>
                                ) : hasBatchLabs ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                      b1Count > 0
                                        ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500'
                                    }`}>
                                      B1: {b1Count}
                                    </span>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                      b2Count > 0
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500'
                                    }`}>
                                      B2: {b2Count}
                                    </span>
                                  </div>
                                ) : allLabCount > 0 ? (
                                  <div className="flex items-center justify-center">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-bold">
                                      {allLabCount} {allLabCount === 1 ? 'lab' : 'labs'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 font-mono">0</span>
                                )}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-gray-900 dark:text-gray-100">
                                {totalSubjClasses}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Slot Assignment Modal */}
          {editingSlotKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Assign Period Slot</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {(() => {
                        const parts = editingSlotKey.split('_');
                        const day = Number(parts[0]);
                        const period = Number(parts[1]);
                        const batch = parts[2];
                        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const pDef = (ttData?.periodDefinitions || []).find((p) => p.periodNumber === period);
                        const isLab = (slotForm.classType || slotForm.lectureType) === 'Lab';
                        const batchLabel = isLab
                          ? ` • Lab Batch ${slotForm.batchGroup || (batch && batch !== 'ALL' ? batch : 'B1')}`
                          : '';
                        return `${days[day]} — Period ${period} (${pDef?.timeSlot || ''})${batchLabel}`;
                      })()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingSlotKey(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
                  {/* Subject Selection (Required) - Filtered by selected Class Type */}
                  {(() => {
                    const isLabSlot = (slotForm.classType || slotForm.lectureType) === 'Lab';
                    const availableSubjects = (ttData?.branchSubjects || []).filter(s => {
                      const isIpcc = s.evaluationType === 'IPCC' || s.category === 'Theory + Lab';
                      const isLabOnly = s.evaluationType === 'LAB_ONLY' || s.category === 'Lab Only';
                      const isTheoryOnly = s.evaluationType === 'THEORY_ONLY' || s.category === 'Theory';

                      return isLabSlot ? (isIpcc || isLabOnly) : (isIpcc || isTheoryOnly);
                    });

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-gray-700 dark:text-gray-300">
                            Subject <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-zinc-500">
                            Filtered for {isLabSlot ? '🧪 Lab' : '📘 Theory'} ({availableSubjects.length} available)
                          </span>
                        </div>
                        <select
                          value={slotForm.subject}
                          required
                          onChange={(e) => {
                            setSlotForm({
                              ...slotForm,
                              subject: e.target.value
                            });
                          }}
                          className="w-full px-2.5 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">-- Select Subject (Required) * --</option>
                          {availableSubjects.map((s) => {
                            const isIpcc = s.evaluationType === 'IPCC' || s.category === 'Theory + Lab';
                            const isLabOnly = s.evaluationType === 'LAB_ONLY' || s.category === 'Lab Only';
                            const isTheoryOnly = s.evaluationType === 'THEORY_ONLY' || s.category === 'Theory';
                            const badge = isIpcc
                              ? ' • Theory + Lab'
                              : isLabOnly
                              ? ' • Lab Only'
                              : isTheoryOnly
                              ? ' • Theory Only'
                              : '';
                            return (
                              <option key={s._id} value={s._id}>
                                [{s.code}] {s.name} ({s.credits || 0} Credits){badge}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })()}

                  {/* Class Type Selection (Required: Theory | Lab ONLY) */}
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Class Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currSubj = (ttData?.branchSubjects || []).find(s => s._id === slotForm.subject);
                          const isLabOnly = currSubj && (currSubj.evaluationType === 'LAB_ONLY' || currSubj.category === 'Lab Only');
                          setSlotForm({
                            ...slotForm,
                            classType: 'Theory',
                            lectureType: 'Theory',
                            batchGroup: 'ALL',
                            spanConsecutive: false,
                            subject: isLabOnly ? '' : slotForm.subject
                          });
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          (slotForm.classType || slotForm.lectureType) !== 'Lab'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span>📘 Theory</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currSubj = (ttData?.branchSubjects || []).find(s => s._id === slotForm.subject);
                          const isIpcc = currSubj && (currSubj.evaluationType === 'IPCC' || currSubj.category === 'Theory + Lab');
                          const isLabOnly = currSubj && (currSubj.evaluationType === 'LAB_ONLY' || currSubj.category === 'Lab Only');
                          const keepSubj = isIpcc || isLabOnly;
                          setSlotForm({
                            ...slotForm,
                            classType: 'Lab',
                            lectureType: 'Lab',
                            batchGroup: slotForm.batchGroup === 'ALL' ? 'B1' : slotForm.batchGroup,
                            spanConsecutive: true,
                            subject: keepSubj ? slotForm.subject : ''
                          });
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          (slotForm.classType || slotForm.lectureType) === 'Lab'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-500/30'
                            : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span>🧪 Lab</span>
                      </button>
                    </div>
                  </div>

                  {/* Lab Batch Selection (Required for Labs: B1 | B2) */}
                  {((slotForm.classType || slotForm.lectureType) === 'Lab') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          Lab Batch <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-zinc-500">
                          Parallel lab batches in same period
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSlotForm({ ...slotForm, batchGroup: 'B1' })}
                          className={`py-2 px-3 text-xs font-bold rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            slotForm.batchGroup === 'B1'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-500/30'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span>🧪 Batch B1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotForm({ ...slotForm, batchGroup: 'B2' })}
                          className={`py-2 px-3 text-xs font-bold rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            slotForm.batchGroup === 'B2'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/30'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span>🔬 Batch B2</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Faculty Selection (Optional) */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Faculty Member <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={slotForm.faculty}
                      onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="">-- To Be Announced (TBA) --</option>
                      {(ttData?.branchFaculties || []).map((f) => {
                        const deptLabel = f.department || f.departmentId?.shortName || f.departmentId?.name;
                        return (
                          <option key={f._id} value={f._id}>
                            {f.name} {f.designation ? `(${f.designation})` : ''} {deptLabel ? `— [${deptLabel}]` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Classroom / Room (Optional) */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Classroom / Room <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={slotForm.room}
                      onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value.toUpperCase() })}
                      placeholder="e.g. LH-201, LAB-3"
                      className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 uppercase font-mono text-xs"
                    />
                  </div>

                  {/* Consecutive block option for Lab */}
                  {(() => {
                    const isLab = (slotForm.classType || slotForm.lectureType) === 'Lab';
                    if (!isLab) return null;
                    const [day, period] = (editingSlotKey || '').split('_').map(Number);
                    const breaks = ttData?.breakDefinitions || ttData?.structure?.breaks || [];
                    const periodDefs = ttData?.periodDefinitions || [];
                    const currDef = periodDefs.find(p => p.periodNumber === period);
                    const nextDef = periodDefs.find(p => p.periodNumber === period + 1);
                    const isFollowedByBreak = breaks.some(b => b.afterPeriod === period) || (currDef && nextDef && currDef.endMinute < nextDef.startMinute);
                    const dayDef = sectionWorkingDays.find(d => d.dayNum === day);
                    const maxAllowed = dayDef?.maxPeriods || (day === 6 ? 4 : (periodDefs.length || 7));
                    const isLastPeriod = period >= maxAllowed;

                    if (isFollowedByBreak || isLastPeriod) {
                      return (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-2.5 rounded text-[11px] text-amber-800 dark:text-amber-300">
                          ⚠️ <strong>Notice:</strong> {isLastPeriod ? `Period ${period} is the last period of the day.` : `Period ${period} is followed by a break/lunch.`} Consecutive 2-period lab blocks cannot cross breaks or extend past the end of the day.
                        </div>
                      );
                    }

                    return (
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-2.5 rounded">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slotForm.spanConsecutive}
                            onChange={(e) => setSlotForm({ ...slotForm, spanConsecutive: e.target.checked })}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-[11px] font-medium text-purple-800 dark:text-purple-300">
                            Block 2 consecutive periods (spans Period {period} & Period {period + 1})
                          </span>
                        </label>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleClearSlot}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    >
                      Clear {((slotForm.classType || slotForm.lectureType) === 'Lab' && slotForm.batchGroup && slotForm.batchGroup !== 'ALL') ? `Batch ${slotForm.batchGroup}` : 'Slot'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSlotKey(null)}
                        className="px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
                      >
                        Save Assignment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Events (Unified Step 5 Architecture) */}
      {activeTab === 'events' && (() => {
        const filteredEvents = events.filter(e => {
          if (eventsScopeFilter !== 'ALL' && e.scope !== eventsScopeFilter) return false;
          if (eventsTypeFilter !== 'ALL' && e.eventType !== eventsTypeFilter) return false;
          if (eventsStatusFilter !== 'ALL' && e.status !== eventsStatusFilter) return false;
          if (eventsSemesterFilter !== 'ALL') {
            const semId = e.academicSemesterId?._id || e.academicSemesterId;
            if (String(semId) !== String(eventsSemesterFilter)) return false;
          }
          if (eventsSearch.trim()) {
            const q = eventsSearch.trim().toLowerCase();
            const matchTitle = e.title && e.title.toLowerCase().includes(q);
            const matchDesc = e.description && e.description.toLowerCase().includes(q);
            if (!matchTitle && !matchDesc) return false;
          }
          return true;
        });

        const totalCount = events.length;
        const globalCount = events.filter(e => e.scope === 'GLOBAL').length;
        const semesterCount = events.filter(e => e.scope === 'SEMESTER').length;
        const activeCount = events.filter(e => e.status === 'ACTIVE').length;

        const getEventTypeBadge = (type) => {
          switch (type) {
            case 'Holiday / Closure':
              return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
            case 'Exam':
              return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
            case 'Academic Event':
              return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
            case 'College Event':
              return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
            default:
              return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
          }
        };

        const getStatusBadge = (status) => {
          switch (status) {
            case 'ACTIVE':
              return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
            case 'CANCELLED':
              return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
            case 'ARCHIVED':
              return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
            default:
              return 'bg-zinc-50 text-zinc-600 border-zinc-200';
          }
        };

        return (
          <div className="space-y-4">
            {/* Top Header Card with Quick Stats */}
            <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    College Events & Academic Calendar
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    Step 5
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Institutional timetable baseline for public holidays, exams, academic recesses, and semester-scoped events.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-semibold">
                    Total: {totalCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold">
                    Global Holidays: {globalCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold">
                    Semester-Scoped: {semesterCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                    Active: {activeCount}
                  </span>
                </div>
              </div>

              {canCreateEvents && (
                <button
                  type="button"
                  onClick={handleOpenCreateEvent}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all self-start md:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>
              )}
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-[#18181b] p-3 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventsSearch}
                  onChange={(e) => setEventsSearch(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none w-48 focus:border-blue-500"
                />

                {/* Scope Filter */}
                <select
                  value={eventsScopeFilter}
                  onChange={(e) => setEventsScopeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Scopes</option>
                  <option value="GLOBAL">Global (Holidays & General)</option>
                  <option value="SEMESTER">Semester Scoped</option>
                </select>

                {/* Event Type Filter */}
                <select
                  value={eventsTypeFilter}
                  onChange={(e) => setEventsTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="Holiday / Closure">Holiday / Closure</option>
                  <option value="Academic Event">Academic Event</option>
                  <option value="Exam">Exam</option>
                  <option value="College Event">College Event</option>
                  <option value="Other">Other</option>
                </select>

                {/* Status Filter */}
                <select
                  value={eventsStatusFilter}
                  onChange={(e) => setEventsStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                {/* Semester Filter (Dynamic) */}
                {eventsScopeFilter !== 'GLOBAL' && semesters.length > 0 && (
                  <select
                    value={eventsSemesterFilter}
                    onChange={(e) => setEventsSemesterFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Semesters</option>
                    {semesters.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.batch?.name ? `${s.batch.name} • ` : ''}{s.label || `Sem ${s.number}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-[11px] text-gray-500 font-mono">
                Showing {filteredEvents.length} of {totalCount} events
              </div>
            </div>

            {/* CSES Compact Events Table */}
            <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/80 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3 w-36">Type</th>
                      <th className="py-2.5 px-3 w-28">Scope</th>
                      <th className="py-2.5 px-3 w-40">Semester</th>
                      <th className="py-2.5 px-3 w-44">Date</th>
                      <th className="py-2.5 px-3 w-32">Time</th>
                      <th className="py-2.5 px-3 w-36">Suspension</th>
                      <th className="py-2.5 px-3 w-24 text-center">Status</th>
                      <th className="py-2.5 px-3 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-400 text-xs">
                          {eventsLoading ? 'Loading events...' : 'No events found matching current criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt, idx) => {
                        const startStr = formatDateRange(evt.startDate, evt.endDate);
                        const sem = evt.academicSemesterId;
                        const semLabel = sem ? (sem.label || `Sem ${sem.number}`) : '—';
                        const batchLabel = sem?.batch?.name || '';

                        return (
                          <tr
                            key={evt._id}
                            className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            {/* # */}
                            <td className="py-2.5 px-3 text-center font-mono text-gray-400 text-[11px]">
                              {idx + 1}
                            </td>

                            {/* Event Title */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
                                <span>{evt.title}</span>
                                {evt.priority === 'Important' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    ● Important
                                  </span>
                                )}
                                {evt.priority === 'Critical' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    ! Critical
                                  </span>
                                )}
                              </div>
                              {evt.description && (
                                <div className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5">
                                  {evt.description}
                                </div>
                              )}
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getEventTypeBadge(evt.eventType)}`}>
                                {evt.eventType}
                              </span>
                            </td>

                            {/* Scope */}
                            <td className="py-2.5 px-3">
                              {evt.scope === 'GLOBAL' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                  GLOBAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                  SEMESTER
                                </span>
                              )}
                            </td>

                            {/* Semester */}
                            <td className="py-2.5 px-3">
                              {evt.scope === 'GLOBAL' ? (
                                <span className="text-gray-400 font-mono text-[11px]">—</span>
                              ) : (
                                <div>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {semLabel}
                                  </span>
                                  {batchLabel && (
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {batchLabel}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-2.5 px-3 font-mono text-gray-800 dark:text-gray-200 font-medium">
                              {startStr}
                            </td>

                            {/* Time */}
                            <td className="py-2.5 px-3">
                              {evt.allDay ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                                  All Day
                                </span>
                              ) : (
                                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {evt.startTime || '—'} → {evt.endTime || '—'}
                                </span>
                              )}
                            </td>

                            {/* Classes Suspension */}
                            <td className="py-2.5 px-3">
                              {evt.suspensionType === 'full_day' || evt.eventType === 'Holiday / Closure' || (evt.classesSuspended && evt.suspensionType !== 'time_range') ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                  Full Day Suspended
                                </span>
                              ) : evt.suspensionType === 'time_range' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
                                  {evt.suspensionStartTime || '—'}–{evt.suspensionEndTime || '—'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
                                  Not Suspended
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(evt.status)}`}>
                                {evt.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {canUpdateEvents && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditEvent(evt)}
                                    className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                    title="Edit event"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {canUpdateEvents && evt.status === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEventStatus(evt, 'CANCELLED')}
                                    className="p-1 text-amber-500 hover:text-amber-700 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                                    title="Cancel event"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {canUpdateEvents && evt.status !== 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEventStatus(evt, 'ACTIVE')}
                                    className="p-1 text-emerald-500 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                    title="Reactivate event"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {canDeleteEvents && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(evt)}
                                    className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                    title="Archive event"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Cohort Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Edit Cohort Batch ({editingBatch.name || `${editingBatch.admissionYear}–${editingBatch.graduationYear}`})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-0.5">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                {sitCollege?.name || 'SIT Tumkur'} • Bachelor of Engineering (B.E.)
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Cohort batch spans 4 academic years (8 semesters).
              </div>
            </div>

            {editingBatch.hasDependencies && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <div className="font-semibold">Admission and graduation years are locked</div>
                  <div className="text-[10.5px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Academic records ({[
                      editingBatch.semestersCount > 0 && `${editingBatch.semestersCount} semester(s)`,
                      editingBatch.sectionsCount > 0 && `${editingBatch.sectionsCount} section(s)`,
                      editingBatch.studentsCount > 0 && `${editingBatch.studentsCount} student(s)`,
                      editingBatch.timetablesCount > 0 && `${editingBatch.timetablesCount} timetable(s)`,
                      editingBatch.eventsCount > 0 && `${editingBatch.eventsCount} event(s)`
                    ].filter(Boolean).join(', ') || 'linked records'}) are linked to this cohort. To preserve historical integrity, years cannot be modified. You can update the cohort status below.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEditBatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium flex items-center justify-between">
                    <span>Admission Year</span>
                    {editingBatch.hasDependencies && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Locked</span>}
                  </label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max="2100"
                    disabled={editingBatch.hasDependencies}
                    value={editingBatch.admissionYear}
                    onChange={(e) => {
                      const adm = Number(e.target.value);
                      setEditingBatch((prev) => ({
                        ...prev,
                        admissionYear: adm,
                        graduationYear: adm ? adm + 4 : prev.graduationYear
                      }));
                    }}
                    className={`w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none ${
                      editingBatch.hasDependencies ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-zinc-800' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium flex items-center justify-between">
                    <span>Graduation Year</span>
                    {editingBatch.hasDependencies && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Locked</span>}
                  </label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max="2100"
                    disabled={editingBatch.hasDependencies}
                    value={editingBatch.graduationYear}
                    onChange={(e) => setEditingBatch({ ...editingBatch, graduationYear: Number(e.target.value) })}
                    className={`w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none ${
                      editingBatch.hasDependencies ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-zinc-800' : ''
                    }`}
                  />
                </div>
              </div>

              {!editingBatch.hasDependencies && editingBatch.admissionYear && editingBatch.graduationYear && (editingBatch.graduationYear - editingBatch.admissionYear !== 4) && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Graduation year must be exactly 4 years after admission ({editingBatch.admissionYear} → {Number(editingBatch.admissionYear) + 4})</span>
                </div>
              )}

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Status</label>
                <select
                  value={editingBatch.status}
                  onChange={(e) => setEditingBatch({ ...editingBatch, status: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Edit Class Section</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-0.5">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                SIT Tumkur • {editingSection.batchName}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                {editingSection.hasDependencies ? 'Managing capacity, room assignment, and status.' : 'Updating section details and capacity bounds.'}
              </div>
            </div>

            {editingSection.hasDependencies && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-semibold">Core Identity Locked:</span> This section has linked academic records ({editingSection.timetablesCount || 0} timetable entries, {editingSection.studentsCount || 0} enrolled students). Section name, branch, and semester cannot be modified. Only room, capacity, and status can be updated.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEditSection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Semester {editingSection.hasDependencies && <Lock className="w-3 h-3 inline text-amber-500 ml-1" />}
                  </label>
                  {(() => {
                    const scheduledForBatch = semesters
                      .filter((s) => String(s.batch?._id || s.batch) === String(editingSection.batchId))
                      .sort((a, b) => a.number - b.number);
                    return (
                      <>
                        <select
                          required
                          disabled={editingSection.hasDependencies}
                          value={editingSection.semester}
                          onChange={(e) => setEditingSection({ ...editingSection, semester: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                        >
                          {scheduledForBatch.length > 0 ? (
                            scheduledForBatch.map((s) => (
                              <option key={s.number} value={s.number}>
                                Semester {s.number} ({s.status})
                              </option>
                            ))
                          ) : (
                            [1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))
                          )}
                        </select>
                        {editingSection.batchId && scheduledForBatch.length === 0 && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            Note: No official semesters scheduled yet for this batch.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Branch {editingSection.hasDependencies && <Lock className="w-3 h-3 inline text-amber-500 ml-1" />}
                  </label>
                  <select
                    required
                    disabled={editingSection.hasDependencies}
                    value={editingSection.branchId}
                    onChange={(e) => setEditingSection({ ...editingSection, branchId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((br) => (
                      <option key={br._id} value={br._id}>{br.shortName} - {br.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Section Name {editingSection.hasDependencies && <Lock className="w-3 h-3 inline text-amber-500 ml-1" />}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    disabled={editingSection.hasDependencies}
                    value={editingSection.name}
                    onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value.toUpperCase() })}
                    placeholder="e.g. A, B, A1"
                    pattern="^[A-Za-z]{1,2}[0-9]?$"
                    title="1-2 letters optionally followed by a number (e.g. A, B, A1)"
                    className="w-full px-3 py-1.5 font-mono uppercase rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Default Room (Optional)</label>
                  <input
                    type="text"
                    maxLength={30}
                    value={editingSection.room || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, room: e.target.value })}
                    placeholder="e.g. LH-201, Room 104"
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={editingSection.capacity}
                    onChange={(e) => setEditingSection({ ...editingSection, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Status</label>
                  <select
                    value={editingSection.status}
                    onChange={(e) => setEditingSection({ ...editingSection, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Official Semester Modal */}
      {editingSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Edit Official Semester</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSemester(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-0.5">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                SIT Tumkur • {editingSemester.batchName}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Official calendar baseline dates for this cohort semester.
              </div>
            </div>

            {editingSemester.hasDependencies && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold">Semester number is locked:</span> Academic records ({editingSemester.sectionsCount} sections, {editingSemester.timetablesCount} timetables, {editingSemester.eventsCount} events) are linked to Semester {editingSemester.number}. Only timeline dates and status can be updated.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEditSemester} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Semester Number
                    {editingSemester.hasDependencies && (
                      <span className="ml-1 text-[10px] text-amber-500 font-normal">(Locked)</span>
                    )}
                  </label>
                  <select
                    required
                    disabled={editingSemester.hasDependencies}
                    value={editingSemester.number}
                    onChange={(e) => setEditingSemester({ ...editingSemester, number: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Status</label>
                  <select
                    value={editingSemester.status}
                    onChange={(e) => setEditingSemester({ ...editingSemester, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editingSemester.startDate}
                    onChange={(e) => setEditingSemester({ ...editingSemester, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    required
                    value={editingSemester.endDate}
                    onChange={(e) => setEditingSemester({ ...editingSemester, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingSemester(null)}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compact CSES Create / Edit Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEvent} className="p-4 space-y-3.5 text-xs">
              {/* Form Error Banner */}
              {eventFormError && (
                <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{eventFormError}</span>
                </div>
              )}

              {/* Event Title */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, CIE 1 Examinations, Branch Change Application"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Short Description (Roadmap Row summary) */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Short Description (Timeline Subtitle)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Second internal assessment for the semester."
                  value={eventForm.shortDescription || ''}
                  onChange={(e) => setEventForm({ ...eventForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Event Type, Priority & Order (3 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Event Type *
                  </label>
                  <select
                    value={eventForm.eventType}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isHoliday = val === 'Holiday / Closure' || val === 'HOLIDAY';
                      setEventForm(prev => ({
                        ...prev,
                        eventType: val,
                        suspensionType: isHoliday ? 'full_day' : prev.suspensionType,
                        classesSuspended: isHoliday ? true : prev.classesSuspended
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-semibold outline-none cursor-pointer text-xs"
                  >
                    <optgroup label="Standard Types">
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="EXAM">EXAM</option>
                      <option value="REGISTRATION">REGISTRATION</option>
                      <option value="DEADLINE">DEADLINE</option>
                      <option value="CAREER">CAREER</option>
                      <option value="CAMPUS">CAMPUS</option>
                      <option value="HOLIDAY">HOLIDAY</option>
                      <option value="RESULT">RESULT</option>
                      <option value="GENERAL">GENERAL</option>
                    </optgroup>
                    <optgroup label="Legacy Formats">
                      <option value="College Event">College Event</option>
                      <option value="Academic Event">Academic Event</option>
                      <option value="Exam">Exam</option>
                      <option value="Holiday / Closure">Holiday / Closure</option>
                      <option value="Other">Other</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Priority
                  </label>
                  <select
                    value={eventForm.priority || 'Normal'}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-semibold outline-none cursor-pointer text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">● Important</option>
                    <option value="Critical">! Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Timeline Order
                  </label>
                  <input
                    type="number"
                    value={eventForm.order || 0}
                    onChange={(e) => setEventForm({ ...eventForm, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-semibold outline-none text-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Scope & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Scope *
                  </label>
                  <select
                    value={eventForm.scope}
                    onChange={(e) => setEventForm({ ...eventForm, scope: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-semibold outline-none cursor-pointer"
                  >
                    <option value="GLOBAL">GLOBAL (College-wide / Holiday)</option>
                    <option value="SEMESTER">SEMESTER (Official Semester Scoped)</option>
                  </select>
                </div>
              </div>

              {/* Semester Picker (Conditional on SEMESTER scope) */}
              {eventForm.scope === 'SEMESTER' && (
                <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <label className="block text-indigo-900 dark:text-indigo-200 font-semibold mb-1">
                    Academic Semester *
                  </label>
                  {semesters.length === 0 ? (
                    <div className="text-xs text-red-500">
                      No official semesters available. Please create a semester first.
                    </div>
                  ) : (
                    <select
                      value={eventForm.academicSemesterId}
                      onChange={(e) => setEventForm({ ...eventForm, academicSemesterId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-medium outline-none cursor-pointer"
                    >
                      <option value="">Select official semester...</option>
                      {semesters.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.batch?.name ? `${s.batch.name} • ` : ''}{s.label || `Semester ${s.number}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                    Semester-scoped events automatically inherit cohort batch timeline and curriculum rules.
                  </p>
                </div>
              )}

              {/* Classes Suspension Section */}
              <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-800 dark:text-gray-200 font-semibold text-xs">
                    Are classes suspended for this event? *
                  </label>
                  {eventForm.eventType === 'Holiday / Closure' && (
                    <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium">
                      (Holidays default to full day)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      eventForm.suspensionType === 'none'
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-100/50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="suspensionType"
                      value="none"
                      checked={eventForm.suspensionType === 'none'}
                      onChange={() => setEventForm(prev => ({ ...prev, suspensionType: 'none', classesSuspended: false }))}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Not Suspended</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      eventForm.suspensionType === 'full_day'
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-100/50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="suspensionType"
                      value="full_day"
                      checked={eventForm.suspensionType === 'full_day'}
                      onChange={() => setEventForm(prev => ({ ...prev, suspensionType: 'full_day', classesSuspended: true }))}
                      className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span>Full Day</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      eventForm.suspensionType === 'time_range'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-100/50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="suspensionType"
                      value="time_range"
                      checked={eventForm.suspensionType === 'time_range'}
                      onChange={() => setEventForm(prev => ({ ...prev, suspensionType: 'time_range', classesSuspended: true }))}
                      className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Time Range</span>
                  </label>
                </div>

                {/* Conditional Time Range Inputs */}
                {eventForm.suspensionType === 'time_range' && (
                  <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 space-y-1.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1 text-[11px]">
                          Suspension Start Time (24h) *
                        </label>
                        <input
                          type="time"
                          required={eventForm.suspensionType === 'time_range'}
                          value={eventForm.suspensionStartTime || '08:00'}
                          onChange={(e) => setEventForm(prev => ({ ...prev, suspensionStartTime: e.target.value }))}
                          className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono font-bold outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1 text-[11px]">
                          Suspension End Time (24h) *
                        </label>
                        <input
                          type="time"
                          required={eventForm.suspensionType === 'time_range'}
                          value={eventForm.suspensionEndTime || '13:00'}
                          onChange={(e) => setEventForm(prev => ({ ...prev, suspensionEndTime: e.target.value }))}
                          className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono font-bold outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400">
                      Classes falling within this time window will be suspended; classes outside this window will run normally.
                    </p>
                  </div>
                )}
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="eventAllDayCheck"
                  checked={eventForm.allDay}
                  onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="eventAllDayCheck" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  All Day Event (No specific bell time slots required)
                </label>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEventForm(prev => ({
                        ...prev,
                        startDate: newStart,
                        endDate: prev.endDate && prev.endDate < newStart ? newStart : prev.endDate
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-mono font-semibold outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-mono font-semibold outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Start Time & End Time (When not All Day) */}
              {!eventForm.allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
                      Start Time (24h)
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono font-bold outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
                      End Time (24h)
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono font-bold outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Description & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Description / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide additional details or institutional remarks..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-semibold outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Roadmap Explainer & Action Content (F-012) */}
              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      Roadmap Explainer & Student Guide
                    </h4>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-300/70">
                      Content displayed when students click this event in their Roadmap timeline.
                    </p>
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5 text-[11px]">
                    Overview (What is this event?)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain the purpose of this milestone (e.g., The second Continuous Internal Evaluation conducted during the semester...)"
                    value={eventForm.content?.overview || ''}
                    onChange={(e) => setEventForm(prev => ({
                      ...prev,
                      content: { ...prev.content, overview: e.target.value }
                    }))}
                    className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* What Happens */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5 text-[11px]">
                      What Usually Happens?
                    </label>
                    <textarea
                      rows={2}
                      placeholder="• Internal examination&#10;• Subject-wise marks are recorded"
                      value={eventForm.content?.whatHappens || ''}
                      onChange={(e) => setEventForm(prev => ({
                        ...prev,
                        content: { ...prev.content, whatHappens: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* What To Do */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5 text-[11px]">
                      What Should You Do? (Action items)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="• Check syllabus&#10;• Review question papers&#10;• Check seating timetable"
                      value={eventForm.content?.whatToDo || ''}
                      onChange={(e) => setEventForm(prev => ({
                        ...prev,
                        content: { ...prev.content, whatToDo: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Preparation Tips */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5 text-[11px]">
                      Preparation Tips (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="• Prioritize module 2 derivations&#10;• Focus on numerical problems"
                      value={eventForm.content?.preparationTips || ''}
                      onChange={(e) => setEventForm(prev => ({
                        ...prev,
                        content: { ...prev.content, preparationTips: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Important Notes */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-0.5 text-[11px]">
                      Important Notes / Rules (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="• 85% attendance required to write CIE&#10;• Calculators permitted for math courses"
                      value={eventForm.content?.importantNotes || ''}
                      onChange={(e) => setEventForm(prev => ({
                        ...prev,
                        content: { ...prev.content, importantNotes: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Resources Manager */}
                <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      Useful Resources & Action Links
                    </span>
                    <button
                      type="button"
                      onClick={() => setEventForm(prev => ({
                        ...prev,
                        resources: [...(prev.resources || []), { title: '', url: '', type: 'link' }]
                      }))}
                      className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      + Add Link / Resource
                    </button>
                  </div>

                  {(!eventForm.resources || eventForm.resources.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">No resources added yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {eventForm.resources.map((resItem, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Resource Label (e.g. Previous CIE Papers)"
                            value={resItem.title || ''}
                            onChange={(e) => {
                              const newRes = [...eventForm.resources];
                              newRes[rIdx].title = e.target.value;
                              setEventForm(prev => ({ ...prev, resources: newRes }));
                            }}
                            className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="URL or Path (e.g. /materials or https://...)"
                            value={resItem.url || ''}
                            onChange={(e) => {
                              const newRes = [...eventForm.resources];
                              newRes[rIdx].url = e.target.value;
                              setEventForm(prev => ({ ...prev, resources: newRes }));
                            }}
                            className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newRes = eventForm.resources.filter((_, idx) => idx !== rIdx);
                              setEventForm(prev => ({ ...prev, resources: newRes }));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-3.5 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {eventSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingEvent ? 'Save Changes' : 'Create Event'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
