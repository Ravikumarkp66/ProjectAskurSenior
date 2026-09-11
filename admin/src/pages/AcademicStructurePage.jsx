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
  Sparkles
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
  const [newSection, setNewSection] = useState({ batchId: '', semester: 1, branchId: '', name: 'A', capacity: 60 });
  const [newSemester, setNewSemester] = useState({ batchId: '', number: 1, startDate: '', endDate: '', status: 'Upcoming' });

  // Edit modal states
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Calendar items state (Step 4)
  const [calendarItems, setCalendarItems] = useState([]);
  const [governmentHolidays, setGovernmentHolidays] = useState([]);
  const [loadingGovHolidays, setLoadingGovHolidays] = useState(false);
  const [govHolidaySearch, setGovHolidaySearch] = useState('');
  const [govHolidayStatusFilter, setGovHolidayStatusFilter] = useState('');
  const [syncingGov, setSyncingGov] = useState(false);
  const [eventsBatchId, setEventsBatchId] = useState('');
  const [eventsSemesterId, setEventsSemesterId] = useState('');
  const [calendarSubTab, setCalendarSubTab] = useState('holidays'); // 'holidays' | 'events'
  const [calendarScopeFilter, setCalendarScopeFilter] = useState('ALL');
  const [calendarBranchFilter, setCalendarBranchFilter] = useState('');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('');
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalKind, setCalendarModalKind] = useState('HOLIDAY'); // 'GOVERNMENT_HOLIDAY' | 'HOLIDAY' | 'EVENT'
  const [editingCalendarItem, setEditingCalendarItem] = useState(null);
  const [calendarForm, setCalendarForm] = useState({
    title: '',
    holidayCategory: 'GOVERNMENT',
    scope: 'GLOBAL',
    branchId: '',
    dateMode: 'single',
    startDate: '',
    endDate: '',
    observedByCollege: true,
    classImpact: 'FULL_DAY',
    startTime: '09:00',
    endTime: '17:00',
    description: '',
    status: 'Published'
  });

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
    lectureType: 'Lecture',
    spanConsecutive: false
  });
  const [ttSaving, setTtSaving] = useState(false);

  // Institutional Timetable Structure state (Super Admin)
  const [timetableStructure, setTimetableStructure] = useState(null);
  const [ttSubView, setTtSubView] = useState('sections'); // 'sections' | 'structure'
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureSaving, setStructureSaving] = useState(false);

  // Ensure normal admins cannot stay on or switch to institutional structure subview
  useEffect(() => {
    if (!isSuper && ttSubView !== 'sections') {
      setTtSubView('sections');
    }
  }, [isSuper, ttSubView]);

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

  // Auto-allocate branch when semester changes:
  // - Sem 1 & 2: automatically set branch to "Common to All"
  // - Sem 3 to 8: automatically set branch to admin's assigned department
  const handleSemesterChange = (selectedSem) => {
    setTtSemesterNum(selectedSem);
    setTtSectionId('');
    const semNum = Number(selectedSem);
    if (semNum === 1 || semNum === 2) {
      if (commonBranchId) {
        setTtBranchId(commonBranchId);
      }
    } else if (semNum >= 3) {
      if (adminAllocatedBranchId) {
        setTtBranchId(adminAllocatedBranchId);
      }
    } else {
      if (!isSuper && adminAllocatedBranchId) {
        setTtBranchId(adminAllocatedBranchId);
      }
    }
  };

  // Keep branch in sync for normal admins
  useEffect(() => {
    if (!isSuper) {
      const semNum = Number(ttSemesterNum);
      if (semNum === 1 || semNum === 2) {
        if (commonBranchId && ttBranchId !== commonBranchId) {
          setTtBranchId(commonBranchId);
        }
      } else if (semNum >= 3) {
        if (adminAllocatedBranchId && ttBranchId !== adminAllocatedBranchId) {
          setTtBranchId(adminAllocatedBranchId);
        }
      } else if (!ttSemesterNum && adminAllocatedBranchId && !ttBranchId) {
        setTtBranchId(adminAllocatedBranchId);
      }
    }
  }, [isSuper, ttSemesterNum, commonBranchId, adminAllocatedBranchId, ttBranchId]);

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

  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const bId = sec.batch?._id || sec.batch;
      const brId = sec.branch?._id || sec.branch;
      const matchBatch = !ttBatchId || bId?.toString() === ttBatchId;
      const matchSem = !ttSemesterNum || sec.semester === Number(ttSemesterNum);
      
      const isFirstYear = Number(ttSemesterNum) === 1 || Number(ttSemesterNum) === 2;
      
      let matchBranch = true;
      if (ttBranchId) {
        if (isFirstYear && ttBranchId === commonBranchId) {
          // In 1st year (common curriculum), section could belong to 'Common to All'
          // OR belong to the department (e.g. ISE Sec A, CSE Sec A)
          const isSecCommon = brId?.toString() === commonBranchId;
          const isSecAdminBranch = adminAllocatedBranchId && brId?.toString() === adminAllocatedBranchId;
          
          if (isSuper) {
            matchBranch = true;
          } else {
            matchBranch = isSecCommon || isSecAdminBranch;
          }
        } else {
          matchBranch = brId?.toString() === ttBranchId;
        }
      } else if (!isSuper && adminAllocatedBranchId) {
        matchBranch = brId?.toString() === adminAllocatedBranchId || (isFirstYear && brId?.toString() === commonBranchId);
      }

      return matchBatch && matchSem && matchBranch;
    });
  }, [sections, ttBatchId, ttSemesterNum, ttBranchId, commonBranchId, adminAllocatedBranchId, isSuper]);

  const fetchSectionTimetable = async (secId) => {
    if (!secId) {
      setTtData(null);
      setTtSlots({});
      return;
    }
    setTtLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/section-timetables/${secId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTtData(data.data);
        const map = {};
        if (data.data.timetable?.slots) {
          data.data.timetable.slots.forEach((s) => {
            map[`${s.dayOfWeek}_${s.periodNumber}`] = {
              dayOfWeek: s.dayOfWeek,
              periodNumber: s.periodNumber,
              subject: s.subject?._id || s.subject || '',
              subjectDoc: s.subject,
              faculty: s.faculty?._id || s.faculty || '',
              facultyDoc: s.faculty,
              room: s.room || '',
              lectureType: s.lectureType || 'Lecture',
              sessionGroupId: s.sessionGroupId || null
            };
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
      const slotsPayload = Object.values(ttSlots).filter(s => s.subject || s.room || s.faculty || s.lectureType === 'Free Period');

      const res = await fetch(`/api/academic/structure/section-timetables/${ttSectionId}`, {
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

  const handleOpenSlotModal = (dayOfWeek, periodNumber) => {
    const key = `${dayOfWeek}_${periodNumber}`;
    const existing = ttSlots[key];
    setEditingSlotKey(key);
    setSlotForm({
      dayOfWeek,
      periodNumber,
      subject: existing?.subject || '',
      faculty: existing?.faculty || '',
      room: existing?.room || '',
      lectureType: existing?.lectureType || 'Lecture',
      spanConsecutive: false
    });
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!editingSlotKey) return;
    const [day, period] = editingSlotKey.split('_').map(Number);

    const subjDoc = ttData?.branchSubjects?.find(s => s._id === slotForm.subject);
    const facDoc = ttData?.branchFaculties?.find(f => f._id === slotForm.faculty);

    const newSlots = { ...ttSlots };

    if (!slotForm.subject && !slotForm.room && slotForm.lectureType !== 'Free Period') {
      delete newSlots[editingSlotKey];
    } else {
      const groupId = slotForm.spanConsecutive ? `LAB_${day}_P${period}_P${period + 1}` : null;
      newSlots[editingSlotKey] = {
        dayOfWeek: day,
        periodNumber: period,
        subject: slotForm.subject || null,
        subjectDoc: subjDoc || null,
        faculty: slotForm.faculty || null,
        facultyDoc: facDoc || null,
        room: slotForm.room.trim().toUpperCase(),
        lectureType: slotForm.lectureType,
        sessionGroupId: groupId
      };

      if (slotForm.spanConsecutive && period < (day === 6 ? 4 : 8)) {
        const nextKey = `${day}_${period + 1}`;
        newSlots[nextKey] = {
          dayOfWeek: day,
          periodNumber: period + 1,
          subject: slotForm.subject || null,
          subjectDoc: subjDoc || null,
          faculty: slotForm.faculty || null,
          facultyDoc: facDoc || null,
          room: slotForm.room.trim().toUpperCase(),
          lectureType: slotForm.lectureType,
          sessionGroupId: groupId
        };
      }
    }

    setTtSlots(newSlots);
    setEditingSlotKey(null);
  };

  const handleClearGrid = () => {
    if (window.confirm('Clear all period assignments in this grid?')) {
      setTtSlots({});
    }
  };

  const renderSlotCell = (dayOfWeek, periodNumber) => {
    const key = `${dayOfWeek}_${periodNumber}`;
    const slot = ttSlots[key];
    const isArchived = ttData?.timetable?.status === 'Archived';

    if (!slot || (!slot.subject && !slot.room && slot.lectureType !== 'Free Period')) {
      return (
        <td
          key={periodNumber}
          onClick={() => !isArchived && handleOpenSlotModal(dayOfWeek, periodNumber)}
          className={`p-1.5 border-r border-gray-100 dark:border-zinc-800 text-center transition-colors ${
            isArchived
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
          }`}
        >
          <div className="h-14 rounded border border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:border-blue-400 hover:text-blue-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
        </td>
      );
    }

    const subjectCode = slot.subjectDoc?.code || (ttData?.branchSubjects?.find(s => s._id === slot.subject)?.code) || 'SUBJ';
    const subjectName = slot.subjectDoc?.name || (ttData?.branchSubjects?.find(s => s._id === slot.subject)?.name) || '';
    const facultyName = slot.facultyDoc?.name || (ttData?.branchFaculties?.find(f => f._id === slot.faculty)?.name) || 'TBA';
    const isLab = slot.lectureType === 'Lab';
    const isTutorial = slot.lectureType === 'Tutorial';
    const isSeminar = slot.lectureType === 'Seminar';
    const isFree = slot.lectureType === 'Free Period';

    let badgeBg = 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200';
    let typeBadgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300';

    if (isLab) {
      badgeBg = 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200';
      typeBadgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300';
    } else if (isTutorial) {
      badgeBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200';
      typeBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300';
    } else if (isSeminar) {
      badgeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200';
      typeBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300';
    } else if (isFree) {
      badgeBg = 'bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
      typeBadgeColor = 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300';
    }

    return (
      <td
        key={periodNumber}
        onClick={() => !isArchived && handleOpenSlotModal(dayOfWeek, periodNumber)}
        className={`p-1 border-r border-gray-100 dark:border-zinc-800 transition-colors ${
          isArchived ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:opacity-90'
        }`}
      >
        <div className={`h-14 p-1 rounded border ${badgeBg} flex flex-col justify-between text-[11px] overflow-hidden`}>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold truncate" title={subjectName || subjectCode}>
              {isFree ? 'Free' : subjectCode}
            </span>
            {slot.room && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 uppercase">
                {slot.room}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-1 text-[10px] text-gray-600 dark:text-gray-400">
            <span className="truncate max-w-[70px]" title={facultyName}>
              {facultyName}
            </span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-semibold uppercase ${typeBadgeColor}`}>
              {slot.lectureType || 'Lecture'}
            </span>
          </div>
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

      const [resColleges, resPrograms, resBranches, resBatches, resSemesters, resSections] = await Promise.all([
        fetch('/api/academic/structure/colleges', { headers }).then(r => r.json()),
        fetch('/api/academic/structure/programs', { headers }).then(r => r.json()),
        fetch('/api/academic/structure/branches', { headers }).then(r => r.json()),
        fetch('/api/academic/structure/batches', { headers }).then(r => r.json()),
        fetch('/api/academic/structure/semesters', { headers }).then(r => r.json()),
        fetch('/api/academic/structure/sections', { headers }).then(r => r.json())
      ]);

      if (resColleges.success) {
        setColleges(resColleges.data);
        const primary = resColleges.primary || resColleges.data?.[0];
        setSitCollege(primary);
      }
      if (resPrograms.success) setPrograms(resPrograms.data);
      if (resBranches.success) setBranches(resBranches.data);
      if (resBatches.success) setBatches(resBatches.data);
      if (resSemesters.success) setSemesters(resSemesters.data);
      if (resSections.success) setSections(resSections.data);
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
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          admissionYear: newBatch.admissionYear,
          graduationYear: newBatch.graduationYear,
          ...(sitCollege?._id ? { collegeId: sitCollege._id } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Cohort Batch "${data.data.name}" created!` });
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
      admissionYear: b.admissionYear,
      graduationYear: b.graduationYear,
      status: b.status
    });
  };

  const handleSaveEditBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;
    const adm = Number(editingBatch.admissionYear);
    const grad = Number(editingBatch.graduationYear);
    if (adm >= grad) {
      setStatusMessage({ type: 'error', text: 'Graduation year must be after admission year.' });
      return;
    }
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/batches/${editingBatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          admissionYear: adm,
          graduationYear: grad,
          status: editingBatch.status,
          forceTransition: true
        })
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
    if (!newSection.branchId) {
      setStatusMessage({ type: 'error', text: 'Please select a branch.' });
      return;
    }
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId: newSection.batchId,
          semester: Number(newSection.semester),
          branchId: newSection.branchId,
          name: newSection.name.trim().toUpperCase(),
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

  const handleDeleteSection = async (sectionId, sectionName) => {
    const confirmed = window.confirm(`Are you sure you want to delete Section "${sectionName}"?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Section "${sectionName}" deleted.` });
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
      capacity: sec.capacity || 60,
      semester: sec.semester,
      branchId: sec.branch?._id || sec.branch || '',
      batchId: sec.batch?._id || sec.batch || '',
      status: sec.status || 'Active',
      batchName: sec.batch?.name || 'Cohort Batch'
    });
  };

  const handleSaveEditSection = async (e) => {
    e.preventDefault();
    if (!editingSection) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/sections/${editingSection._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editingSection.name.trim().toUpperCase(),
          capacity: Number(editingSection.capacity),
          semester: Number(editingSection.semester),
          branchId: editingSection.branchId || null,
          status: editingSection.status
        })
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
    if (!newSemester.startDate || !newSemester.endDate) {
      setStatusMessage({ type: 'error', text: 'Official start date and end date are required.' });
      return;
    }
    if (new Date(newSemester.startDate) >= new Date(newSemester.endDate)) {
      setStatusMessage({ type: 'error', text: 'Official start date must be before end date.' });
      return;
    }
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId: newSemester.batchId,
          number: Number(newSemester.number),
          startDate: newSemester.startDate,
          endDate: newSemester.endDate,
          status: newSemester.status,
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

  const handleDeleteSemester = async (semesterId, semNumber) => {
    const confirmed = window.confirm(`Are you sure you want to delete Semester ${semNumber}?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/semesters/${semesterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Semester ${semNumber} deleted.` });
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
      batchName: s.batch?.name || 'Cohort Batch'
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
      const res = await fetch(`/api/academic/structure/semesters/${editingSemester._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          number: Number(editingSemester.number),
          startDate: editingSemester.startDate,
          endDate: editingSemester.endDate,
          status: editingSemester.status
        })
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

  const formatCalendarDate = (startDate, endDate) => {
    if (!startDate) return '—';
    const s = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!endDate) return s;
    const e = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return s === e ? s : `${s} → ${e}`;
  };

  const fetchCalendarItems = async (semId) => {
    if (!semId) return;
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/calendar-items?semesterId=${semId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCalendarItems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch calendar items:', err);
    }
  };

  const fetchGovernmentHolidays = async () => {
    setLoadingGovHolidays(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/calendar-items?kind=HOLIDAY&holidayCategory=GOVERNMENT', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGovernmentHolidays(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch government holidays:', err);
    } finally {
      setLoadingGovHolidays(false);
    }
  };

  const handleSyncGovernmentHolidays = async () => {
    setSyncingGov(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/academic/structure/calendar-items/sync-government-holidays', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync government holidays');
      }
      setStatusMessage({
        type: 'success',
        text: data.message || `Successfully synced government holidays. Total: ${data.totalCount || 0}`
      });
      await fetchGovernmentHolidays();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSyncingGov(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'events') {
      fetchGovernmentHolidays();
    } else if (activeTab === 'timetable_structure') {
      fetchTimetableStructure();
    }
  }, [activeTab]);

  useEffect(() => {
    if (batches.length > 0 && !eventsBatchId) {
      setEventsBatchId(batches[0]._id);
    }
  }, [batches]);

  useEffect(() => {
    if (eventsBatchId) {
      const batchSems = semesters.filter(s => String(s.batch?._id || s.batch) === String(eventsBatchId));
      if (batchSems.length > 0 && (!eventsSemesterId || !batchSems.some(s => String(s._id) === String(eventsSemesterId)))) {
        setEventsSemesterId(batchSems[0]._id);
      } else if (batchSems.length === 0) {
        setEventsSemesterId('');
      }
    }
  }, [eventsBatchId, semesters]);

  useEffect(() => {
    if (eventsSemesterId) {
      fetchCalendarItems(eventsSemesterId);
    } else {
      setCalendarItems([]);
    }
  }, [eventsSemesterId]);

  const handleToggleObservance = async (item) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const nextObserved = item.observedByCollege === false ? true : false;
      const res = await fetch(`/api/academic/structure/calendar-items/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ observedByCollege: nextObserved })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Observance updated: "${item.title}" is now ${nextObserved ? 'Observed by SIT' : 'Not Observed'}.`
        });
        fetchGovernmentHolidays();
        if (eventsSemesterId) fetchCalendarItems(eventsSemesterId);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update observance' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleGovStatus = async (item) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const nextStatus = item.status === 'Published' ? 'Archived' : 'Published';
      const res = await fetch(`/api/academic/structure/calendar-items/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Holiday "${item.title}" set to ${nextStatus === 'Published' ? 'Active' : 'Disabled'}.`
        });
        fetchGovernmentHolidays();
        if (eventsSemesterId) fetchCalendarItems(eventsSemesterId);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update status' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenCreateCalendarItem = (kind) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedSem = semesters.find(s => String(s._id) === String(eventsSemesterId));
    let defaultStart = todayStr;
    let defaultEnd = todayStr;
    if (kind !== 'GOVERNMENT_HOLIDAY' && selectedSem && selectedSem.startDate) {
      defaultStart = new Date(selectedSem.startDate).toISOString().split('T')[0];
      defaultEnd = defaultStart;
    }
    setCalendarForm({
      title: '',
      holidayCategory: kind === 'GOVERNMENT_HOLIDAY' ? 'GOVERNMENT' : kind === 'HOLIDAY' ? 'INSTITUTIONAL' : null,
      scope: 'GLOBAL',
      branchId: '',
      dateMode: 'single',
      startDate: defaultStart,
      endDate: defaultEnd,
      observedByCollege: true,
      classImpact: kind === 'EVENT' ? 'NONE' : 'FULL_DAY',
      startTime: '09:00',
      endTime: '17:00',
      description: '',
      status: 'Published'
    });
    setCalendarModalKind(kind);
    setEditingCalendarItem(null);
    setCalendarModalOpen(true);
  };

  const handleOpenEditCalendarItem = (item) => {
    const startStr = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '';
    const endStr = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '';
    const isRange = startStr !== endStr;

    let modalKind = 'EVENT';
    if (item.holidayCategory === 'GOVERNMENT') {
      modalKind = 'GOVERNMENT_HOLIDAY';
    } else if (item.kind === 'HOLIDAY') {
      modalKind = 'HOLIDAY';
    }

    setCalendarForm({
      title: item.title,
      holidayCategory: item.holidayCategory || (modalKind === 'GOVERNMENT_HOLIDAY' ? 'GOVERNMENT' : 'INSTITUTIONAL'),
      scope: item.scope || 'GLOBAL',
      branchId: item.branch?._id || item.branch || '',
      dateMode: isRange ? 'range' : 'single',
      startDate: startStr,
      endDate: endStr || startStr,
      observedByCollege: item.observedByCollege !== false,
      classImpact: item.classImpact || 'NONE',
      startTime: minutesToTime(item.suspensionStartMinute),
      endTime: minutesToTime(item.suspensionEndMinute),
      description: item.description || '',
      status: item.status || 'Published'
    });
    setCalendarModalKind(modalKind);
    setEditingCalendarItem(item);
    setCalendarModalOpen(true);
  };

  const handleSaveCalendarItem = async (e) => {
    e.preventDefault();
    if (calendarModalKind !== 'GOVERNMENT_HOLIDAY' && !eventsSemesterId) {
      setStatusMessage({ type: 'error', text: 'Please select an Official Semester first.' });
      return;
    }
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const finalEndDate = calendarForm.dateMode === 'range' ? calendarForm.endDate : calendarForm.startDate;

      let payload;
      if (calendarModalKind === 'GOVERNMENT_HOLIDAY') {
        payload = {
          kind: 'HOLIDAY',
          holidayCategory: 'GOVERNMENT',
          scope: 'GLOBAL',
          title: calendarForm.title.trim(),
          startDate: calendarForm.startDate,
          endDate: finalEndDate,
          observedByCollege: calendarForm.observedByCollege,
          classImpact: calendarForm.observedByCollege ? 'FULL_DAY' : 'NONE',
          description: calendarForm.description.trim(),
          status: calendarForm.status
        };
      } else {
        payload = {
          semesterId: eventsSemesterId,
          title: calendarForm.title.trim(),
          kind: calendarModalKind,
          holidayCategory: calendarModalKind === 'HOLIDAY' ? calendarForm.holidayCategory : null,
          scope: calendarForm.scope,
          branchId: calendarForm.scope === 'BRANCH' ? calendarForm.branchId : null,
          startDate: calendarForm.startDate,
          endDate: finalEndDate,
          isAllDay: calendarForm.classImpact !== 'TIME_RANGE',
          classImpact: calendarForm.classImpact,
          suspensionStartMinute: calendarForm.classImpact === 'TIME_RANGE' ? timeToMinutes(calendarForm.startTime) : null,
          suspensionEndMinute: calendarForm.classImpact === 'TIME_RANGE' ? timeToMinutes(calendarForm.endTime) : null,
          description: calendarForm.description.trim(),
          status: calendarForm.status
        };
      }

      const url = editingCalendarItem
        ? `/api/academic/structure/calendar-items/${editingCalendarItem._id}`
        : '/api/academic/structure/calendar-items';
      const method = editingCalendarItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save calendar item');
      }

      const itemNoun = calendarModalKind === 'GOVERNMENT_HOLIDAY'
        ? 'Government Holiday'
        : calendarModalKind === 'HOLIDAY' ? 'Holiday' : 'Calendar Event';

      setStatusMessage({
        type: 'success',
        text: editingCalendarItem ? `${itemNoun} updated successfully.` : `${itemNoun} created successfully.`
      });
      setCalendarModalOpen(false);
      setEditingCalendarItem(null);
      fetchGovernmentHolidays();
      if (eventsSemesterId) {
        await fetchCalendarItems(eventsSemesterId);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCalendarItem = async (item) => {
    const isGov = item.holidayCategory === 'GOVERNMENT';
    const label = isGov ? 'government holiday' : item.kind === 'HOLIDAY' ? 'holiday' : 'event';
    if (!window.confirm(`Are you sure you want to delete ${label} "${item.title}"?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/academic/structure/calendar-items/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete calendar item');
      }
      setStatusMessage({ type: 'success', text: `${isGov ? 'Government Holiday' : item.kind === 'HOLIDAY' ? 'Holiday' : 'Event'} deleted successfully.` });
      fetchGovernmentHolidays();
      if (eventsSemesterId) {
        await fetchCalendarItems(eventsSemesterId);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'batches', label: 'Batches / Cohorts', icon: Calendar, count: batches.length },
      { id: 'sections', label: 'Class Sections', icon: Users, count: sections.length },
      { id: 'semesters', label: 'Official Semesters', icon: Layers, count: semesters.length },
      { id: 'events', label: 'Events', icon: CalendarCheck2, count: calendarItems.length || null },
      { id: 'timetable_structure', label: 'Timetable Structure', icon: Clock, count: null },
    ];
    if (isSuper) return allTabs;
    return allTabs.filter(tab => tab.id === 'events' || tab.id === 'timetable_structure');
  }, [isSuper, batches.length, sections.length, semesters.length, calendarItems.length]);

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

      {/* Tab 3: Batches */}
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
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs">
                No batches registered yet. Create a 4-year B.E. cohort batch below to get started.
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
                      const statusColor =
                        b.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                          : b.status === 'Graduated'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

                      return (
                        <tr key={b._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {b.name || `${b.admissionYear}–${b.graduationYear}`}
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
                                  title="Edit Cohort Batch"
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBatch(b)}
                                  title="Delete Batch"
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
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
                  Batches represent entire B.E. cohorts (e.g. 2025–2029). Bound automatically to SIT Tumkur.
                </p>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
                <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Auto-bound Institution & Program</span>
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    SIT Tumkur • Bachelor of Engineering (B.E.)
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

                <div className="text-[11px] text-gray-400 font-mono">
                  Batch Name: <span className="text-gray-700 dark:text-gray-200 font-semibold">{newBatch.admissionYear}–{newBatch.graduationYear}</span>
                </div>

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

      {/* Tab 2: Class Sections */}
      {isSuper && activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>SIT Class Sections</span>
            </h2>
            {sections.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs">
                No class sections created yet for SIT. Create a section linked to a batch cohort, semester, and branch.
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
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Status</th>
                      {(canUpdate || canDelete) && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {sections.map((sec) => (
                      <tr key={sec._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                          Section {sec.name}
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
                          {sec.capacity || 60} Students
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
                                  onClick={() => handleDeleteSection(sec._id, sec.name)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                  title="Delete Section"
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

      {/* Tab 3: Official Semesters */}
      {isSuper && activeTab === 'semesters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>SIT Official Baseline Semesters</span>
            </h2>
            {semesters.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] p-8 text-center rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 text-xs">
                No official semesters scheduled yet for SIT. Schedule an official semester baseline for a batch cohort.
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
                      <th className="p-3">Status</th>
                      {(canUpdateSemester || canDeleteSemester) && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {semesters.map((s) => {
                      const start = s.startDate ? new Date(s.startDate) : null;
                      const end = s.endDate ? new Date(s.endDate) : null;
                      const durationDays = start && end ? Math.round((end - start) / (1000 * 60 * 60 * 24)) : null;

                      return (
                        <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                          <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                            {s.batch?.name || 'N/A'}
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
                            {durationDays ? `${durationDays} days` : '—'}
                          </td>
                          <td className="p-3">
                            {canUpdateSemester ? (
                              <select
                                value={s.status}
                                onChange={(e) => handleUpdateSemesterStatus(s._id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded border border-transparent outline-none cursor-pointer ${
                                  s.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : s.status === 'Upcoming'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                    : s.status === 'Completed'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Archived">Archived</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : s.status === 'Upcoming'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : s.status === 'Completed'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
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
                                    title="Edit Semester"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDeleteSemester && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSemester(s._id, s.number)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                    title="Delete Semester"
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

      {/* Tab 4: Academic Calendar (Holidays & Events) */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Top Subtab Navigation Switcher */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarSubTab('holidays')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  calendarSubTab === 'holidays'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Holidays</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  calendarSubTab === 'holidays' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {governmentHolidays.length + calendarItems.filter(i => i.kind === 'HOLIDAY' && i.holidayCategory !== 'GOVERNMENT').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarSubTab('events')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  calendarSubTab === 'events'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Calendar Events</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  calendarSubTab === 'events' ? 'bg-blue-700 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {calendarItems.filter(i => i.kind === 'EVENT').length}
                </span>
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              SIT Tumkur • Academic Calendar Management
            </div>
          </div>

          {/* Subtab 1: HOLIDAYS */}
          {calendarSubTab === 'holidays' && (
            <div className="space-y-6">
              {/* Layer A: Government Holidays (Global Reference Layer) */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/40 dark:bg-amber-950/10 border-b border-gray-200 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Government Holidays
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Global Layer
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      National & State public holidays — maintained independently of cohort batches and official semesters.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search holiday..."
                      value={govHolidaySearch}
                      onChange={(e) => setGovHolidaySearch(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none w-36"
                    />

                    <select
                      value={govHolidayStatusFilter}
                      onChange={(e) => setGovHolidayStatusFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Published">Active</option>
                      <option value="Archived">Disabled</option>
                    </select>

                    {canCreateEvents && (
                      <>
                        <button
                          type="button"
                          onClick={handleSyncGovernmentHolidays}
                          disabled={syncingGov}
                          title="Sync government holidays from source repository"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-semibold shadow-sm transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingGov ? 'animate-spin' : ''}`} />
                          <span>{syncingGov ? 'Syncing...' : 'Sync Repository'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateCalendarItem('GOVERNMENT_HOLIDAY')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Government Holiday</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Government Holidays Table */}
                {(() => {
                  const filteredGov = governmentHolidays.filter(item => {
                    if (govHolidaySearch && !item.title.toLowerCase().includes(govHolidaySearch.toLowerCase())) {
                      return false;
                    }
                    if (govHolidayStatusFilter && item.status !== govHolidayStatusFilter) {
                      return false;
                    }
                    return true;
                  });

                  if (filteredGov.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        {loadingGovHolidays ? 'Loading government holidays...' : 'No government holidays found.'}
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50/60 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-semibold text-gray-700 dark:text-gray-300">
                          <tr>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Holiday</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Observed by SIT</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {filteredGov.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                {formatCalendarDate(item.startDate, item.endDate)}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                                <div>{item.title}</div>
                                {item.description && (
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal line-clamp-1">
                                    {item.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                  Government
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.observedByCollege !== false
                                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}>
                                    {item.observedByCollege !== false ? 'Yes (Observed)' : 'No (Classes Run)'}
                                  </span>
                                  {canUpdateEvents && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleObservance(item)}
                                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      Toggle
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.status === 'Published'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}>
                                    {item.status === 'Published' ? 'Active' : 'Disabled'}
                                  </span>
                                  {canUpdateEvents && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleGovStatus(item)}
                                      className="text-[10px] text-gray-500 hover:underline"
                                    >
                                      Toggle
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {canUpdateEvents && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditCalendarItem(item)}
                                      title="Edit holiday"
                                      className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDeleteEvents && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCalendarItem(item)}
                                      title="Delete holiday"
                                      className="p-1 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Layer B: Institutional & Branch Holidays (Semester Bound) */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm overflow-hidden space-y-3 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CalendarCheck2 className="w-4 h-4 text-blue-500" />
                      <span>Institutional & Branch Holidays</span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      College/department holidays and vacation breaks bound to an official semester timeline.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={eventsBatchId}
                      onChange={(e) => {
                        setEventsBatchId(e.target.value);
                        const batchSems = semesters.filter(s => String(s.batch?._id || s.batch) === e.target.value);
                        setEventsSemesterId(batchSems.length > 0 ? batchSems[0]._id : '');
                      }}
                      className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                    >
                      <option value="">Select Cohort Batch...</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>

                    <select
                      value={eventsSemesterId}
                      onChange={(e) => setEventsSemesterId(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                    >
                      <option value="">Select Official Semester...</option>
                      {semesters
                        .filter((s) => !eventsBatchId || String(s.batch?._id || s.batch) === String(eventsBatchId))
                        .map((s) => (
                          <option key={s._id} value={s._id}>
                            Semester {s.number} ({s.batch?.name || 'Cohort'}) • {s.status}
                          </option>
                        ))}
                    </select>

                    {canCreateEvents && eventsSemesterId && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreateCalendarItem('HOLIDAY')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Holiday</span>
                      </button>
                    )}
                  </div>
                </div>

                {!eventsSemesterId ? (
                  <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    Select a Cohort Batch and Official Semester above to view institutional holidays.
                  </div>
                ) : (
                  <>
                    {/* Active Semester Timeline Badge */}
                    {(() => {
                      const currentSem = semesters.find(s => String(s._id) === String(eventsSemesterId));
                      if (!currentSem) return null;
                      return (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-900 dark:text-blue-200">
                              Semester {currentSem.number} Timeline:
                            </span>
                            <span className="text-blue-700 dark:text-blue-300">
                              {formatCalendarDate(currentSem.startDate, currentSem.endDate)}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              currentSem.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                            }`}>
                              {currentSem.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Must stay within official bounds.
                          </div>
                        </div>
                      );
                    })()}

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50/70 dark:bg-zinc-900/40 p-2 rounded border border-gray-100 dark:border-zinc-800/60">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Filter by:</span>

                      <select
                        value={calendarScopeFilter}
                        onChange={(e) => setCalendarScopeFilter(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                      >
                        <option value="ALL">All Scopes</option>
                        <option value="GLOBAL">Global Only</option>
                        <option value="BRANCH">Branch Only</option>
                      </select>

                      <select
                        value={calendarBranchFilter}
                        onChange={(e) => setCalendarBranchFilter(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                      >
                        <option value="">All Branches</option>
                        {branches.map(br => (
                          <option key={br._id} value={br._id}>{br.shortName} - {br.name}</option>
                        ))}
                      </select>

                      <select
                        value={calendarStatusFilter}
                        onChange={(e) => setCalendarStatusFilter(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                      >
                        <option value="">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>

                      {(calendarScopeFilter !== 'ALL' || calendarBranchFilter || calendarStatusFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarScopeFilter('ALL');
                            setCalendarBranchFilter('');
                            setCalendarStatusFilter('');
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>

                    {/* Table Render */}
                    {(() => {
                      const filtered = calendarItems.filter(item => {
                        if (item.kind !== 'HOLIDAY' || item.holidayCategory === 'GOVERNMENT') return false;
                        if (calendarScopeFilter !== 'ALL' && item.scope !== calendarScopeFilter) return false;
                        if (calendarBranchFilter && String(item.branch?._id || item.branch) !== String(calendarBranchFilter)) return false;
                        if (calendarStatusFilter && item.status !== calendarStatusFilter) return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                            No institutional or branch holidays found for this semester.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded border border-gray-200 dark:border-zinc-800">
                          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-semibold text-gray-700 dark:text-gray-300">
                              <tr>
                                <th className="px-4 py-2.5">Date</th>
                                <th className="px-4 py-2.5">Holiday</th>
                                <th className="px-4 py-2.5">Category</th>
                                <th className="px-4 py-2.5">Scope</th>
                                <th className="px-4 py-2.5">Branch</th>
                                <th className="px-4 py-2.5">Class Impact</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                              {filtered.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                    {formatCalendarDate(item.startDate, item.endDate)}
                                  </td>
                                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                                    <div>{item.title}</div>
                                    {item.description && (
                                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal line-clamp-1">
                                        {item.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      item.holidayCategory === 'RANGE'
                                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                                    }`}>
                                      {item.holidayCategory}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      item.scope === 'GLOBAL'
                                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                    }`}>
                                      {item.scope}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                    {item.scope === 'BRANCH' && item.branch ? (
                                      <span className="font-semibold">{item.branch.shortName || item.branch.name || 'Branch'}</span>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      item.classImpact === 'FULL_DAY'
                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                                        : item.classImpact === 'TIME_RANGE'
                                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {item.classImpact === 'NONE' && 'No Suspension'}
                                      {item.classImpact === 'FULL_DAY' && 'Full Day'}
                                      {item.classImpact === 'TIME_RANGE' && `Time (${minutesToTime(item.suspensionStartMinute)} – ${minutesToTime(item.suspensionEndMinute)})`}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      item.status === 'Published'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                        : item.status === 'Archived'
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {canUpdateEvents && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditCalendarItem(item)}
                                          title="Edit holiday"
                                          className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {canDeleteEvents && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCalendarItem(item)}
                                          title="Delete holiday"
                                          className="p-1 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: CALENDAR EVENTS */}
          {calendarSubTab === 'events' && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm overflow-hidden space-y-3 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Official Semester Events</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Induction programmes, college fests, seminars, and branch-specific workshops.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={eventsBatchId}
                    onChange={(e) => {
                      setEventsBatchId(e.target.value);
                      const batchSems = semesters.filter(s => String(s.batch?._id || s.batch) === e.target.value);
                      setEventsSemesterId(batchSems.length > 0 ? batchSems[0]._id : '');
                    }}
                    className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                  >
                    <option value="">Select Cohort Batch...</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>

                  <select
                    value={eventsSemesterId}
                    onChange={(e) => setEventsSemesterId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                  >
                    <option value="">Select Official Semester...</option>
                    {semesters
                      .filter((s) => !eventsBatchId || String(s.batch?._id || s.batch) === String(eventsBatchId))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          Semester {s.number} ({s.batch?.name || 'Cohort'}) • {s.status}
                        </option>
                      ))}
                  </select>

                  {canCreateEvents && eventsSemesterId && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateCalendarItem('EVENT')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Event</span>
                    </button>
                  )}
                </div>
              </div>

              {!eventsSemesterId ? (
                <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                  Select a Cohort Batch and Official Semester above to view calendar events.
                </div>
              ) : (
                <>
                  {/* Active Semester Timeline Badge */}
                  {(() => {
                    const currentSem = semesters.find(s => String(s._id) === String(eventsSemesterId));
                    if (!currentSem) return null;
                    return (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900 dark:text-blue-200">
                            Semester {currentSem.number} Timeline:
                          </span>
                          <span className="text-blue-700 dark:text-blue-300">
                            {formatCalendarDate(currentSem.startDate, currentSem.endDate)}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            currentSem.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          }`}>
                            {currentSem.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          Must stay within official bounds.
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50/70 dark:bg-zinc-900/40 p-2 rounded border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Filter by:</span>

                    <select
                      value={calendarScopeFilter}
                      onChange={(e) => setCalendarScopeFilter(e.target.value)}
                      className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                    >
                      <option value="ALL">All Scopes</option>
                      <option value="GLOBAL">Global Only</option>
                      <option value="BRANCH">Branch Only</option>
                    </select>

                    <select
                      value={calendarBranchFilter}
                      onChange={(e) => setCalendarBranchFilter(e.target.value)}
                      className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                    >
                      <option value="">All Branches</option>
                      {branches.map(br => (
                        <option key={br._id} value={br._id}>{br.shortName} - {br.name}</option>
                      ))}
                    </select>

                    <select
                      value={calendarStatusFilter}
                      onChange={(e) => setCalendarStatusFilter(e.target.value)}
                      className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>

                    {(calendarScopeFilter !== 'ALL' || calendarBranchFilter || calendarStatusFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarScopeFilter('ALL');
                          setCalendarBranchFilter('');
                          setCalendarStatusFilter('');
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-1"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Table Render */}
                  {(() => {
                    const filtered = calendarItems.filter(item => {
                      if (item.kind !== 'EVENT') return false;
                      if (calendarScopeFilter !== 'ALL' && item.scope !== calendarScopeFilter) return false;
                      if (calendarBranchFilter && String(item.branch?._id || item.branch) !== String(calendarBranchFilter)) return false;
                      if (calendarStatusFilter && item.status !== calendarStatusFilter) return false;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                          No calendar events found for this official semester.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto rounded border border-gray-200 dark:border-zinc-800">
                        <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                          <thead className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-semibold text-gray-700 dark:text-gray-300">
                            <tr>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Event</th>
                              <th className="px-4 py-2.5">Scope</th>
                              <th className="px-4 py-2.5">Branch</th>
                              <th className="px-4 py-2.5">Class Impact</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filtered.map((item) => (
                              <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {formatCalendarDate(item.startDate, item.endDate)}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                                  <div>{item.title}</div>
                                  {item.description && (
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal line-clamp-1">
                                      {item.description}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.scope === 'GLOBAL'
                                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                  }`}>
                                    {item.scope}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                  {item.scope === 'BRANCH' && item.branch ? (
                                    <span className="font-semibold">{item.branch.shortName || item.branch.name || 'Branch'}</span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.classImpact === 'FULL_DAY'
                                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                                      : item.classImpact === 'TIME_RANGE'
                                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50'
                                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {item.classImpact === 'NONE' && 'No Suspension'}
                                    {item.classImpact === 'FULL_DAY' && 'Full Day'}
                                    {item.classImpact === 'TIME_RANGE' && `Time (${minutesToTime(item.suspensionStartMinute)} – ${minutesToTime(item.suspensionEndMinute)})`}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.status === 'Published'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                      : item.status === 'Archived'
                                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {canUpdateEvents && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditCalendarItem(item)}
                                        title="Edit event"
                                        className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {canDeleteEvents && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCalendarItem(item)}
                                        title="Delete event"
                                        className="p-1 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Timetable Structure */}
      {activeTab === 'timetable_structure' && (
        <div className="space-y-6">
          {/* Responsibility Boundary Switcher (Super Admin Only) */}
          {isSuper && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18181b] p-3 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTtSubView('sections')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    ttSubView === 'sections'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Class Section Timetables</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTtSubView('structure')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    ttSubView === 'structure'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Institutional Bell Schedule & Structure</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    Super Admin
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {ttSubView === 'structure' ? (
                  <span>
                    <strong>Super Admin Authority:</strong> Define college-wide teaching periods, breaks, and working days.
                  </span>
                ) : (
                  <span>
                    <strong>Scoped Admin Authority:</strong> Assign subjects, faculties, and rooms for authorized sections.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 1: Institutional Structure Framework (Super Admin Controlled) */}
          {isSuper && ttSubView === 'structure' && (
            <div className="space-y-6">
              {/* Institutional Header Card */}
              <div className="bg-white dark:bg-[#18181b] p-5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {timetableStructure?.name || 'SIT Institutional Bell Schedule & Framework'}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Authoritative Core
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                    Super Admin establishes the institutional framework for Siddaganga Institute of Technology. All branches and class sections inherit these standardized period lengths, break windows, and working-day rules.
                  </p>
                </div>

                {isSuper ? (
                  <button
                    type="button"
                    onClick={() => setEditingStructure({
                      name: timetableStructure?.name || 'SIT Institutional Bell Schedule',
                      collegeStartMinute: timetableStructure?.collegeStartMinute ?? 480,
                      collegeEndMinute: timetableStructure?.collegeEndMinute ?? 960,
                      classDuration: timetableStructure?.classDuration || 50,
                      labDuration: timetableStructure?.labDuration || 100,
                      workingDays: (timetableStructure?.workingDays || [
                        { dayOfWeek: 1, dayName: 'Monday', status: 'Full Day' },
                        { dayOfWeek: 2, dayName: 'Tuesday', status: 'Full Day' },
                        { dayOfWeek: 3, dayName: 'Wednesday', status: 'Full Day' },
                        { dayOfWeek: 4, dayName: 'Thursday', status: 'Full Day' },
                        { dayOfWeek: 5, dayName: 'Friday', status: 'Full Day' },
                        { dayOfWeek: 6, dayName: 'Saturday', status: 'Half Day' },
                        { dayOfWeek: 7, dayName: 'Sunday', status: 'Non-Working' }
                      ]).map(wd => ({
                        dayOfWeek: wd.dayOfWeek,
                        dayName: wd.dayName,
                        status: wd.status === 'Holiday' ? 'Non-Working' : wd.status
                      })),
                      breaks: (timetableStructure?.breaks || []).map(b => ({
                        name: b.name,
                        startMinute: b.startMinute,
                        duration: b.duration || (b.endMinute ? b.endMinute - b.startMinute : 15),
                        endMinute: b.endMinute || (b.startMinute + (b.duration || 15))
                      }))
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all whitespace-nowrap"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Institutional Structure</span>
                  </button>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-medium">
                    Read Only • Managed by Super Admin
                  </span>
                )}
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Daily Operating Hours</div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {formatTime12(timetableStructure?.collegeStartMinute ?? 480)} – {formatTime12(timetableStructure?.collegeEndMinute ?? 960)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {Math.round(((timetableStructure?.collegeEndMinute ?? 960) - (timetableStructure?.collegeStartMinute ?? 480)) / 60)} hrs / instructional day
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Theory Period Duration</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timetableStructure?.classDuration || 50} <span className="text-xs font-normal text-gray-500">minutes</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Single teaching unit</div>
                </div>

                <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Lab Session Duration</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timetableStructure?.labDuration || 100} <span className="text-xs font-normal text-gray-500">minutes</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Standard practical block</div>
                </div>

                <div className="bg-white dark:bg-[#18181b] p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Teaching Periods / Day</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {timetableStructure?.periods?.length || 8} <span className="text-xs font-normal text-gray-500">periods</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Dynamically generated schedule</div>
                </div>
              </div>

              {/* Working Days & Breaks Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Working Days */}
                <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>Weekly Working Day Policy</span>
                    </h3>
                    <span className="text-[10px] text-gray-400">Institutional Baseline</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                    {(timetableStructure?.workingDays || []).map((wd) => (
                      <div key={wd.dayOfWeek} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px]">
                            {wd.dayOfWeek}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{wd.dayName}</span>
                            <div className="text-[10px] text-gray-400">
                              {wd.status === 'Full Day' ? 'Full Instructional Day' : wd.status === 'Half Day' ? 'Half Day / Morning Sessions' : 'College Off / Non-Teaching'}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          wd.status === 'Full Day'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                            : wd.status === 'Half Day'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        }`}>
                          {wd.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaks Framework */}
                <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>Institutional Breaks & Interval Windows</span>
                    </h3>
                    <span className="text-[10px] text-gray-400">Structural Dividers</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                    {(timetableStructure?.breaks || []).map((brk, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100">{brk.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Occurs after Period {brk.afterPeriod} • Duration: {brk.duration} minutes
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                            {brk.timeSlot}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50/40 dark:bg-zinc-800/20 italic">
                      * Breaks are structural timetable dividers and are automatically rendered between teaching periods. They cannot be scheduled as teaching classes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Bell Schedule Table */}
              <div className="bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>SIT Master Bell Schedule ({timetableStructure?.periods?.length || 8} Teaching Periods)</span>
                  </h3>
                  <span className="text-[10px] text-gray-400">All Sections Adhere to this Grid</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-zinc-700">
                      <tr>
                        <th className="px-4 py-2.5">Period #</th>
                        <th className="px-4 py-2.5">Period Name</th>
                        <th className="px-4 py-2.5">Time Window</th>
                        <th className="px-4 py-2.5">Duration</th>
                        <th className="px-4 py-2.5">Saturday Availability</th>
                        <th className="px-4 py-2.5">Interval / Break Following</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {(timetableStructure?.periods || []).map((p) => {
                        const followingBreak = (timetableStructure?.breaks || []).find(b => b.afterPeriod === p.periodNumber || b.startMinute === p.endMinute);
                        const satPolicy = (timetableStructure?.workingDays || []).find(w => w.dayOfWeek === 6);
                        const isSatAllowed = satPolicy?.status === 'Full Day' || (satPolicy?.status === 'Half Day' && p.periodNumber <= (satPolicy.maxPeriods || 4));
                        return (
                          <tr key={p.periodNumber} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/50">
                            <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                              P{p.periodNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                              {p.name}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-gray-700 dark:text-gray-300">
                              {p.timeSlot}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {p.endMinute - p.startMinute} min
                            </td>
                            <td className="px-4 py-3">
                              {isSatAllowed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3 h-3" /> Working (Half Day)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                  <X className="w-3 h-3" /> Off (Afternoon)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {followingBreak ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  {followingBreak.name} ({followingBreak.timeSlot})
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: Section Timetable Assignments (Scoped Admins + Super Admin) */}
          {ttSubView === 'sections' && (
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

            {/* Cascading Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Batch */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cohort Batch
                </label>
                <select
                  value={ttBatchId}
                  onChange={(e) => {
                    setTtBatchId(e.target.value);
                    setTtSectionId('');
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

              {/* Semester */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Official Semester
                </label>
                <select
                  value={ttSemesterNum}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                  <option value="">-- All Semesters --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      Semester {num} {num <= 2 ? '(1st Year - Common)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    Department / Branch
                  </label>
                  {!isSuper && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300">
                      {Number(ttSemesterNum) === 1 || Number(ttSemesterNum) === 2 ? 'Auto: Common to All' : 'Auto: Your Department'}
                    </span>
                  )}
                </div>
                <select
                  value={ttBranchId}
                  disabled={!isSuper}
                  onChange={(e) => {
                    setTtBranchId(e.target.value);
                    setTtSectionId('');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 ${
                    !isSuper ? 'opacity-85 cursor-not-allowed bg-gray-50 dark:bg-zinc-800/60' : ''
                  }`}
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((br) => (
                    <option key={br._id} value={br._id}>
                      {br.name} {br.shortName || br.code ? `(${br.shortName || br.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Class Section
                </label>
                <select
                  value={ttSectionId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTtSectionId(id);
                    fetchSectionTimetable(id);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs border border-blue-500 font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                >
                  <option value="">-- Select Class Section --</option>
                  {filteredSections.map((sec) => {
                    const brCode = sec.branch?.shortName || sec.branch?.code || 'GEN';
                    return (
                      <option key={sec._id} value={sec._id}>
                        {brCode} - Sem {sec.semester} - Section {sec.name} ({sec.capacity} seats)
                      </option>
                    );
                  })}
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
                    disabled={ttSaving || ttData?.timetable?.status === 'Archived'}
                    className="px-2.5 py-1 text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Clear Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTimetable('Draft')}
                    disabled={ttSaving || ttData?.timetable?.status === 'Archived'}
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
                    <button
                      type="button"
                      onClick={handleArchiveTimetable}
                      disabled={ttSaving}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Standard Timing Guide Strip */}
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-2.5 rounded text-[11px] text-blue-800 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>SIT Standard Bell Schedule:</strong> {ttData?.periodDefinitions?.length || 8} Teaching Periods ({ttData?.periodDefinitions?.[0]?.timeSlot?.split('–')?.[0] || '08:00'} – {ttData?.periodDefinitions?.[ttData?.periodDefinitions?.length - 1]?.timeSlot?.split('–')?.[1] || '16:00'}) • Standard Durations
                </span>
                <span className="font-semibold">
                  Working Days Policy Inherited from Institutional Timetable Structure
                </span>
              </div>

              {/* 1st Year Common Curriculum Indicator */}
              {Number(ttData?.section?.semester) <= 2 && (
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-[10px] uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    1st Year Common Curriculum
                  </span>
                  <span>
                    All subjects for 1st Year (Semesters 1 & 2) are common across all engineering branches. Multi-department faculty (Sciences & Engineering) can be scheduled for this section.
                  </span>
                </div>
              )}

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
                        const [day, period] = editingSlotKey.split('_').map(Number);
                        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const pDef = PERIOD_DEFINITIONS.find((p) => p.periodNumber === period);
                        return `${days[day]} — Period ${period} (${pDef?.timeSlot || ''})`;
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

                <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
                  {/* Subject Selection */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject {Number(ttData?.section?.semester) <= 2 ? '(1st Year Common Curriculum)' : ''}
                    </label>
                    <select
                      value={slotForm.subject}
                      onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium"
                    >
                      <option value="">-- No Subject / Free Period --</option>
                      {(ttData?.branchSubjects || []).map((s) => (
                        <option key={s._id} value={s._id}>
                          [{s.code}] {s.name} ({s.credits || 0} Credits){s.year ? ` • ${s.year}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Faculty Selection */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Faculty Member {Number(ttData?.section?.semester) <= 2 ? '(Sciences & Engineering)' : ''}
                    </label>
                    <select
                      value={slotForm.faculty}
                      onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
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

                  {/* Room Number */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Classroom / Room
                      </label>
                      <input
                        type="text"
                        value={slotForm.room}
                        onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value.toUpperCase() })}
                        placeholder="e.g. LH-201"
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 uppercase font-mono"
                      />
                    </div>

                    {/* Lecture Type */}
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Session Type
                      </label>
                      <select
                        value={slotForm.lectureType}
                        onChange={(e) => setSlotForm({ ...slotForm, lectureType: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      >
                        <option value="Lecture">Theory Lecture</option>
                        <option value="Lab">Laboratory</option>
                        <option value="Tutorial">Tutorial</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Free Period">Free Period</option>
                      </select>
                    </div>
                  </div>

                  {/* Consecutive block option for Lab */}
                  {slotForm.lectureType === 'Lab' && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-2 rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slotForm.spanConsecutive}
                          onChange={(e) => setSlotForm({ ...slotForm, spanConsecutive: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-[11px] font-medium text-purple-800 dark:text-purple-300">
                          Block 2 consecutive periods (spans this period & next period)
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = { ...ttSlots };
                        delete newSlots[editingSlotKey];
                        setTtSlots(newSlots);
                        setEditingSlotKey(null);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    >
                      Clear Slot
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
        </div>
      )}

      {/* Super Admin Timetable Structure Edit Modal */}
      {editingStructure && (() => {
        const previewPeriods = computePeriodsPreview(
          editingStructure.collegeStartMinute,
          editingStructure.collegeEndMinute,
          editingStructure.classDuration,
          editingStructure.breaks
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-500" />
                    <span>Edit Institutional Timetable Structure</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Configure daily college timings, break intervals, and working days. Class periods (P1...Pn) are generated dynamically.
                  </p>
                </div>
                <button
                  onClick={() => setEditingStructure(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Schedule Name */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Institutional Schedule Name
                  </label>
                  <input
                    type="text"
                    value={editingStructure.name}
                    onChange={(e) => setEditingStructure({ ...editingStructure, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs font-medium"
                  />
                </div>

                {/* Section 1: Daily Timings & Durations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                      1. Daily Timings & Durations
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50/70 dark:bg-zinc-900/60 p-3.5 rounded-lg border border-gray-200 dark:border-zinc-800">
                    {/* Day Starts At */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        College Starts At *
                      </label>
                      <input
                        type="time"
                        value={minutesToTime(editingStructure.collegeStartMinute)}
                        onChange={(e) => setEditingStructure({
                          ...editingStructure,
                          collegeStartMinute: timeToMinutes(e.target.value)
                        })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs font-mono font-semibold"
                      />
                    </div>

                    {/* Day Ends At */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        College Ends At *
                      </label>
                      <input
                        type="time"
                        value={minutesToTime(editingStructure.collegeEndMinute)}
                        onChange={(e) => setEditingStructure({
                          ...editingStructure,
                          collegeEndMinute: timeToMinutes(e.target.value)
                        })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs font-mono font-semibold"
                      />
                    </div>

                    {/* Normal Class Duration */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Normal Class Duration *
                      </label>
                      <select
                        value={editingStructure.classDuration}
                        onChange={(e) => setEditingStructure({
                          ...editingStructure,
                          classDuration: Number(e.target.value)
                        })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs font-semibold"
                      >
                        <option value={30}>30 Minutes</option>
                        <option value={35}>35 Minutes</option>
                        <option value={40}>40 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={50}>50 Minutes</option>
                        <option value={55}>55 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                        <option value={75}>75 Minutes</option>
                      </select>
                    </div>

                    {/* Lab Session Duration */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Lab Session Duration *
                      </label>
                      <select
                        value={editingStructure.labDuration}
                        onChange={(e) => setEditingStructure({
                          ...editingStructure,
                          labDuration: Number(e.target.value)
                        })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-xs font-semibold"
                      >
                        <option value={60}>60 Minutes (1 Hour)</option>
                        <option value={80}>80 Minutes</option>
                        <option value={90}>90 Minutes (1.5 Hours)</option>
                        <option value={100}>100 Minutes (2 Periods)</option>
                        <option value={110}>110 Minutes</option>
                        <option value={120}>120 Minutes (2 Hours)</option>
                        <option value={150}>150 Minutes (2.5 Hours)</option>
                        <option value={180}>180 Minutes (3 Hours)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Break Timings & Intervals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                        2. Break Timings & Intervals
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBreaks = [
                          ...(editingStructure.breaks || []),
                          {
                            name: `Break ${(editingStructure.breaks?.length || 0) + 1}`,
                            startMinute: 600,
                            duration: 15,
                            endMinute: 615
                          }
                        ];
                        setEditingStructure({ ...editingStructure, breaks: newBreaks });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Break</span>
                    </button>
                  </div>

                  {(!editingStructure.breaks || editingStructure.breaks.length === 0) ? (
                    <div className="p-4 text-center text-xs text-gray-400 bg-gray-50/50 dark:bg-zinc-900/30 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800">
                      No breaks configured. Click "+ Add Break" above to configure lunch, snacks, or interval pauses.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingStructure.breaks.map((brk, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center p-2.5 bg-gray-50/60 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800"
                        >
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Break Name</label>
                            <input
                              type="text"
                              value={brk.name}
                              onChange={(e) => {
                                const updated = [...editingStructure.breaks];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setEditingStructure({ ...editingStructure, breaks: updated });
                              }}
                              placeholder="e.g. Tea Break / Lunch"
                              className="w-full px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Starts At</label>
                            <input
                              type="time"
                              value={minutesToTime(brk.startMinute)}
                              onChange={(e) => {
                                const updated = [...editingStructure.breaks];
                                const newStart = timeToMinutes(e.target.value);
                                const dur = updated[idx].duration || 15;
                                updated[idx] = {
                                  ...updated[idx],
                                  startMinute: newStart,
                                  endMinute: newStart + dur
                                };
                                setEditingStructure({ ...editingStructure, breaks: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">
                              Duration ({brk.duration || 15} min)
                            </label>
                            <input
                              type="number"
                              min={5}
                              max={120}
                              step={5}
                              value={brk.duration || 15}
                              onChange={(e) => {
                                const updated = [...editingStructure.breaks];
                                const newDur = Math.max(5, parseInt(e.target.value, 10) || 5);
                                updated[idx] = {
                                  ...updated[idx],
                                  duration: newDur,
                                  endMinute: (updated[idx].startMinute || 0) + newDur
                                };
                                setEditingStructure({ ...editingStructure, breaks: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatTime12(brk.startMinute)} – {formatTime12((brk.startMinute || 0) + (brk.duration || 15))}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = editingStructure.breaks.filter((_, i) => i !== idx);
                                setEditingStructure({ ...editingStructure, breaks: filtered });
                              }}
                              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete break"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Weekly Working Days */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                        3. Weekly Working Days
                      </h4>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Institutional Working Day Policy
                    </span>
                  </div>

                  <div className="space-y-2 bg-gray-50/60 dark:bg-zinc-900/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-800">
                    {editingStructure.workingDays.map((wd, idx) => {
                      const currentStatus = wd.status === 'Holiday' ? 'Non-Working' : wd.status;
                      const isSunday = wd.dayOfWeek === 7;

                      return (
                        <div
                          key={wd.dayOfWeek}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-zinc-900 rounded-md border border-gray-100 dark:border-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-[10px]">
                              {wd.dayOfWeek}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs w-28">
                              {wd.dayName}
                            </span>
                            {isSunday && (
                              <span className="text-[10px] text-gray-400 italic">
                                (Institutional Weekly Off)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {[
                              { label: 'Full Day', value: 'Full Day' },
                              { label: 'Half Day', value: 'Half Day' },
                              { label: 'Non-Working', value: 'Non-Working' }
                            ].map((opt) => {
                              const isSelected = currentStatus === opt.value;
                              let activeClasses = '';
                              if (isSelected) {
                                if (opt.value === 'Full Day') {
                                  activeClasses = 'bg-emerald-600 text-white font-bold shadow-xs';
                                } else if (opt.value === 'Half Day') {
                                  activeClasses = 'bg-amber-500 text-white font-bold shadow-xs';
                                } else {
                                  activeClasses = 'bg-zinc-700 text-white font-bold shadow-xs';
                                }
                              } else {
                                activeClasses = 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700';
                              }

                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    const updatedWd = [...editingStructure.workingDays];
                                    updatedWd[idx] = { ...updatedWd[idx], status: opt.value };
                                    setEditingStructure({ ...editingStructure, workingDays: updatedWd });
                                  }}
                                  className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer ${activeClasses}`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Dynamic Periods Preview */}
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Live Dynamic Period Preview ({previewPeriods.length} Teaching Periods)</span>
                    </div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                      Auto-generated from Daily Timings & Breaks
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {previewPeriods.map((p) => (
                      <div
                        key={p.periodNumber}
                        className="px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800/60 text-[10px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 shadow-2xs"
                      >
                        <span className="font-bold text-blue-600 dark:text-blue-400">P{p.periodNumber}</span>
                        <span className="font-mono text-gray-500">{p.timeSlot}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance Safety Banner */}
                <div className="p-3 bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-600 dark:text-gray-300 text-[11px] flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    <strong>Attendance Safety Invariant:</strong> Saving updates the institutional timing framework for future projected classes across all sections. Historical attendance records and completed classes remain 100% immutable and unaffected.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/30 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  disabled={structureSaving}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStructure(editingStructure)}
                  disabled={structureSaving}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {structureSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Institutional Structure</span>
                </button>
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
                <span>Edit Cohort Batch</span>
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
                SIT Tumkur • Bachelor of Engineering (B.E.)
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Cohort batch spans 4 academic years.
              </div>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Admission Year</label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max="2100"
                    value={editingBatch.admissionYear}
                    onChange={(e) => {
                      const adm = Number(e.target.value);
                      setEditingBatch((prev) => ({
                        ...prev,
                        admissionYear: adm,
                        graduationYear: adm ? adm + 4 : prev.graduationYear
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Graduation Year</label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max="2100"
                    value={editingBatch.graduationYear}
                    onChange={(e) => setEditingBatch({ ...editingBatch, graduationYear: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

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
                Updating section details and capacity bounds.
              </div>
            </div>

            <form onSubmit={handleSaveEditSection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Semester</label>
                  {(() => {
                    const scheduledForBatch = semesters
                      .filter((s) => String(s.batch?._id || s.batch) === String(editingSection.batchId))
                      .sort((a, b) => a.number - b.number);
                    return (
                      <>
                        <select
                          required
                          value={editingSection.semester}
                          onChange={(e) => setEditingSection({ ...editingSection, semester: Number(e.target.value) })}
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
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Branch</label>
                  <select
                    required
                    value={editingSection.branchId}
                    onChange={(e) => setEditingSection({ ...editingSection, branchId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Section Name</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={editingSection.name}
                    onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value.toUpperCase() })}
                    placeholder="e.g. A, B, A1"
                    pattern="^[A-Za-z]{1,2}[0-9]?$"
                    title="1-2 letters optionally followed by a number (e.g. A, B, A1)"
                    className="w-full px-3 py-1.5 font-mono uppercase rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
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

            <form onSubmit={handleSaveEditSemester} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Semester Number</label>
                  <select
                    required
                    value={editingSemester.number}
                    onChange={(e) => setEditingSemester({ ...editingSemester, number: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
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

      {/* Create / Edit Calendar Item Modal */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CalendarCheck2 className={`w-4 h-4 ${calendarModalKind === 'GOVERNMENT_HOLIDAY' ? 'text-amber-500' : calendarModalKind === 'HOLIDAY' ? 'text-amber-500' : 'text-blue-500'}`} />
                <span>
                  {editingCalendarItem ? 'Edit ' : 'Add '}
                  {calendarModalKind === 'GOVERNMENT_HOLIDAY'
                    ? 'Government Holiday'
                    : calendarModalKind === 'HOLIDAY'
                    ? 'Institutional Holiday'
                    : 'Calendar Event'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Badge */}
            {calendarModalKind === 'GOVERNMENT_HOLIDAY' ? (
              <div className="p-2.5 rounded bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] space-y-0.5">
                <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Global Reference Layer • Independent of Cohorts & Semesters</span>
                </div>
                <div className="text-amber-700 dark:text-amber-300">
                  Maintained institution-wide for SIT Tumkur. Automatically overlaid across all official semesters.
                </div>
              </div>
            ) : (
              (() => {
                const currentSem = semesters.find(s => String(s._id) === String(eventsSemesterId));
                if (!currentSem) return null;
                return (
                  <div className="p-2.5 rounded bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] space-y-0.5">
                    <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>SIT Tumkur • Semester {currentSem.number} Instance</span>
                    </div>
                    <div className="text-blue-700 dark:text-blue-300">
                      Semester Duration: {formatCalendarDate(currentSem.startDate, currentSem.endDate)} ({currentSem.status})
                    </div>
                  </div>
                );
              })()
            )}

            <form onSubmit={handleSaveCalendarItem} className="space-y-3.5 text-xs">
              {/* Item Title */}
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  {calendarModalKind === 'EVENT' ? 'Event Name *' : 'Holiday Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    calendarModalKind === 'GOVERNMENT_HOLIDAY'
                      ? 'e.g. Republic Day, Gandhi Jayanti, Independence Day'
                      : calendarModalKind === 'HOLIDAY'
                      ? 'e.g. College Foundation Day, Ayudha Pooja, Preparation Break'
                      : 'e.g. Student Induction Programme, HALCYON Fest, Technical Symposium'
                  }
                  value={calendarForm.title}
                  onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Holiday Category (Only for Institutional HOLIDAY) */}
              {calendarModalKind === 'HOLIDAY' && (
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Holiday Type *</label>
                  <select
                    required
                    value={calendarForm.holidayCategory === 'GOVERNMENT' ? 'INSTITUTIONAL' : calendarForm.holidayCategory}
                    onChange={(e) => setCalendarForm({ ...calendarForm, holidayCategory: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="INSTITUTIONAL">Institutional (College / Special Holiday)</option>
                    <option value="RANGE">Range (Vacation / Study Holidays / Break)</option>
                  </select>
                </div>
              )}

              {/* Date Mode & Dates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-600 dark:text-gray-400 font-medium">Date Schedule *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarForm({ ...calendarForm, dateMode: 'single', endDate: calendarForm.startDate })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        calendarForm.dateMode === 'single'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarForm({ ...calendarForm, dateMode: 'range' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        calendarForm.dateMode === 'range'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Date Range
                    </button>
                  </div>
                </div>

                {(() => {
                  const currentSem = calendarModalKind !== 'GOVERNMENT_HOLIDAY'
                    ? semesters.find(s => String(s._id) === String(eventsSemesterId))
                    : null;
                  const minDate = currentSem ? new Date(currentSem.startDate).toISOString().split('T')[0] : undefined;
                  const maxDate = currentSem ? new Date(currentSem.endDate).toISOString().split('T')[0] : undefined;

                  return (
                    <div className={`grid ${calendarForm.dateMode === 'range' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                      <div>
                        <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                          {calendarForm.dateMode === 'range' ? 'Start Date' : 'Date'}
                        </label>
                        <input
                          type="date"
                          required
                          min={minDate}
                          max={maxDate}
                          value={calendarForm.startDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setCalendarForm({
                              ...calendarForm,
                              startDate: newStart,
                              endDate: calendarForm.dateMode === 'single' ? newStart : (calendarForm.endDate || newStart)
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      {calendarForm.dateMode === 'range' && (
                        <div>
                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">End Date</label>
                          <input
                            type="date"
                            required
                            min={calendarForm.startDate || minDate}
                            max={maxDate}
                            value={calendarForm.endDate}
                            onChange={(e) => setCalendarForm({ ...calendarForm, endDate: e.target.value })}
                            className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Observed by SIT (Only for GOVERNMENT_HOLIDAY) */}
              {calendarModalKind === 'GOVERNMENT_HOLIDAY' && (
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Observed by SIT *</label>
                  <select
                    value={calendarForm.observedByCollege ? 'true' : 'false'}
                    onChange={(e) => setCalendarForm({ ...calendarForm, observedByCollege: e.target.value === 'true' })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="true">Yes — Official Holiday for SIT (Classes Suspended)</option>
                    <option value="false">No — College Working Day (Classes Continue Normally)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    When observed, full-day class suspension is automatically enforced on this date.
                  </p>
                </div>
              )}

              {/* Scope & Branch (Only for Layer B: Institutional & Events) */}
              {calendarModalKind !== 'GOVERNMENT_HOLIDAY' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Scope *</label>
                    <select
                      value={calendarForm.scope}
                      onChange={(e) => setCalendarForm({
                        ...calendarForm,
                        scope: e.target.value,
                        branchId: e.target.value === 'GLOBAL' ? '' : (calendarForm.branchId || (branches[0]?._id || ''))
                      })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="GLOBAL">Global (All Branches in Semester)</option>
                      <option value="BRANCH">Branch Specific</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Branch {calendarForm.scope === 'BRANCH' && '*'}
                    </label>
                    <select
                      disabled={calendarForm.scope === 'GLOBAL'}
                      required={calendarForm.scope === 'BRANCH'}
                      value={calendarForm.branchId}
                      onChange={(e) => setCalendarForm({ ...calendarForm, branchId: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{calendarForm.scope === 'GLOBAL' ? '— (Applies to all branches)' : 'Select Branch...'}</option>
                      {branches.map((br) => (
                        <option key={br._id} value={br._id}>{br.shortName} - {br.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Class Impact & Suspension (Only for Layer B: Institutional & Events) */}
              {calendarModalKind !== 'GOVERNMENT_HOLIDAY' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Class Impact *</label>
                    <select
                      value={calendarForm.classImpact}
                      onChange={(e) => setCalendarForm({ ...calendarForm, classImpact: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="NONE">No Suspension (Classes continue normally)</option>
                      <option value="FULL_DAY">Full Day (All classes suspended)</option>
                      <option value="TIME_RANGE">Specific Time Range (Partial suspension)</option>
                    </select>
                  </div>

                  {calendarForm.classImpact === 'TIME_RANGE' && (
                    <div className="grid grid-cols-2 gap-3 p-2.5 rounded bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
                      <div>
                        <label className="block text-[11px] text-orange-900 dark:text-orange-300 font-medium mb-0.5">
                          Suspension Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={calendarForm.startTime}
                          onChange={(e) => setCalendarForm({ ...calendarForm, startTime: e.target.value })}
                          className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-orange-900 dark:text-orange-300 font-medium mb-0.5">
                          Suspension End Time
                        </label>
                        <input
                          type="time"
                          required
                          value={calendarForm.endTime}
                          onChange={(e) => setCalendarForm({ ...calendarForm, endTime: e.target.value })}
                          className="w-full px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Optional notes or instructions..."
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Status</label>
                  <select
                    value={calendarForm.status}
                    onChange={(e) => setCalendarForm({ ...calendarForm, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingEdit
                    ? 'Saving...'
                    : editingCalendarItem
                    ? 'Save Changes'
                    : calendarModalKind === 'GOVERNMENT_HOLIDAY'
                    ? 'Add Government Holiday'
                    : calendarModalKind === 'HOLIDAY'
                    ? 'Add Holiday'
                    : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
