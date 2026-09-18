const mongoose = require('mongoose');
const { SectionTimetable, PERIOD_DEFINITIONS, BREAK_DEFINITIONS } = require('../models/SectionTimetable');
const { getOrSeedStructure } = require('./timetableStructureController');
const AcademicSection = require('../models/AcademicSection');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const StudentAccount = require('../models/StudentAccount');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');

/**
 * Helper: Map period number to standard definition
 */
const PERIOD_MAP = new Map(PERIOD_DEFINITIONS.map(p => [p.periodNumber, p]));

/**
 * Helper: Derive expected academic year string from semester number
 */
const yearFromSemester = (sem) => {
  if (sem <= 2) return '1st Year';
  if (sem <= 4) return '2nd Year';
  if (sem <= 6) return '3rd Year';
  return '4th Year';
};

/**
 * 1. GET /api/academic/structure/section-timetables/:sectionId
 * Retrieves the section timetable, or returns context & empty period grid if none exists.
 */
async function getSectionTimetable(req, res) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await AcademicSection.findById(sectionId)
      .populate('college', 'name code')
      .populate('program', 'name code maxSemesters')
      .populate('branch', 'name shortName code')
      .populate('batch', 'name admissionYear graduationYear');

    if (!section) {
      return res.status(404).json({ success: false, error: 'Academic section not found' });
    }

    // Context validation if query parameters provided
    const { batch, semester, branch } = req.query || {};
    if (batch && String(section.batch?._id || section.batch) !== String(batch)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to a different batch than requested.`
      });
    }
    if (semester !== undefined && semester !== '' && Number(section.semester) !== Number(semester)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to Semester ${section.semester}, not Semester ${semester}.`
      });
    }
    if (branch && String(section.branch?._id || section.branch) !== String(branch)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to a different branch than requested.`
      });
    }

    const admin = req.admin || req.user;
    if (admin && admin.role !== 'SUPER_ADMIN') {
      const allowedBranchIds = (admin.scopes || []).filter(s => s.branch).map(s => String(s.branch._id || s.branch));
      if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(String(section.branch?._id || section.branch))) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only view timetables for your assigned branch'
        });
      }
    }

    // Find official semester instance for this batch and semester number
    const semesterDoc = await Semester.findOne({
      batch: section.batch?._id || section.batch,
      number: section.semester
    });

    let timetable = await SectionTimetable.findOne({ section: sectionId })
      .populate({
        path: 'slots.subject',
        select: 'name code credits branch status year semester evaluationType category'
      })
      .populate({
        path: 'slots.faculty',
        select: 'name designation facultyId email departmentId'
      })
      .populate('publishedBy', 'name email username')
      .populate('createdBy', 'name email username');

    // Fetch batch document to obtain scheme if assigned
    const batchDoc = await AcademicBatch.findById(section.batch?._id || section.batch);
    const commonBranch = await Branch.findOne({ $or: [{ shortName: { $in: ['COMMON', 'Common'] } }, { name: 'Common to All' }] });
    const allowedBranchIds = [section.branch?._id || section.branch];
    if (commonBranch) allowedBranchIds.push(commonBranch._id);

    const expectedYear = yearFromSemester(section.semester);

    const subjectQuery = {
      status: 'Published'
    };

    if (section.semester <= 2) {
      // 1st Year: Scoped to 1st Year curriculum for this branch and cycle
      subjectQuery.year = '1st Year';
      subjectQuery.branch = { $in: allowedBranchIds };

      const branchCode = section.branch?.shortName || section.branch?.code || '';
      const uiBranchMap = {
        CIVIL: 'CV', CSE: 'CS', ISE: 'IS', AIML: 'CI',
        ECE: 'EC', EEE: 'EE', MECH: 'ME', BT: 'BT',
        IM: 'IM', CH: 'CH', ETC: 'ET', EIE: 'EI'
      };
      const uiBranch = uiBranchMap[String(branchCode).toUpperCase()] || branchCode;

      let cycle = req.query?.cycle;
      if (!cycle || !['P', 'C'].includes(String(cycle).toUpperCase())) {
        const secLetter = (section.name || '').toUpperCase();
        if (['J','K','L','M','N','O','P','Q','R'].includes(secLetter)) {
          cycle = Number(section.semester) === 2 ? 'P' : 'C';
        } else {
          cycle = Number(section.semester) === 2 ? 'C' : 'P';
        }
      }

      const curriculumSubjects = await Subject.find({ branch: uiBranch, cycle: String(cycle).toUpperCase() }).lean();
      if (curriculumSubjects && curriculumSubjects.length > 0) {
        const codeMap = {
          AMC1: 'MATH', AMS1: 'MATH', AMM1: 'MATH', AME1: 'MATH', AME2: 'MATH', AMC2: 'MATH', AMS2: 'MATH', AMM2: 'MATH',
          APC: 'PHYS', APS: 'PHYS', APM: 'PHYS', APEC: 'PHYS',
          ACC: 'CHEM', ACS: 'CHEM', ACM: 'CHEM', ACE: 'CHEM',
          CAEDC: 'CAED', CAEDS: 'CAED', CAEDM: 'CAED', CAEDEE: 'CAED', CAEDEC: 'CAED',
          SDCCV1: 'SDC1', SDCCS1: 'SDC1', SDCIS1: 'SDC1', SDCBT1: 'SDC1', SDCME1: 'SDC1', SDCIM1: 'SDC1', SDCCH1: 'SDC1', SDCEE1: 'SDC1', SDCEC1: 'SDC1', SDCEI1: 'SDC1'
        };
        const eligibleCodes = new Set();
        curriculumSubjects.forEach(cs => {
          const mapped = codeMap[cs.code] || cs.code;
          eligibleCodes.add(mapped);
        });

        const scheduledSubjectIds = (timetable?.slots || [])
          .map(s => s.subject?._id || s.subject)
          .filter(Boolean);

        subjectQuery.$or = [
          { code: { $in: Array.from(eligibleCodes) } },
          ...(scheduledSubjectIds.length > 0 ? [{ _id: { $in: scheduledSubjectIds } }] : [])
        ];
      }
    } else {
      subjectQuery.branch = { $in: allowedBranchIds };
      subjectQuery.$or = [
        { semester: section.semester },
        { semester: null, year: expectedYear }
      ];
    }

    if (batchDoc?.scheme) {
      subjectQuery.$and = subjectQuery.$and || [];
      subjectQuery.$and.push({
        $or: [
          { scheme: batchDoc.scheme },
          { scheme: null },
          { scheme: { $exists: false } }
        ]
      });
    }

    // Fetch subjects applicable to this section's branch, semester, and scheme
    const branchSubjects = await AcademicSubjectCms.find(subjectQuery)
      .select('name code branch credits year semester scheme evaluationType category defaultTheoryClasses defaultLabSessions')
      .sort({ name: 1 });

    // Fetch faculty: for 1st years, all institutional faculties (sciences, engineering, humanities) teach 1st years
    let facultyQuery = {};
    if (section.semester <= 2) {
      facultyQuery = {}; // All faculties are eligible to teach 1st year common curriculum
    } else {
      const branchCode = section.branch?.shortName || section.branch?.code || '';
      facultyQuery = {
        $or: [
          { departmentId: section.branch?._id || section.branch },
          ...(branchCode ? [{ department: new RegExp(`^${branchCode}$`, 'i') }] : [])
        ]
      };
    }

    const branchFaculties = await Faculty.find(facultyQuery)
      .select('name designation facultyId email department departmentId')
      .populate('departmentId', 'name shortName')
      .sort({ name: 1 });

    // Fetch institutional timetable structure (or auto-seed SIT default)
    let structure = null;
    try {
      structure = await getOrSeedStructure(section.college?._id || section.college);
    } catch (sErr) {
      console.warn('Could not load timetable structure, using defaults:', sErr.message);
    }

    const periodDefinitions = structure?.periods?.length ? structure.periods : PERIOD_DEFINITIONS;
    const breakDefinitions = structure?.breaks?.length ? structure.breaks : BREAK_DEFINITIONS;

    return res.status(200).json({
      success: true,
      data: {
        section,
        semesterDoc,
        timetable,
        structure,
        periodDefinitions,
        breakDefinitions,
        branchSubjects,
        branchFaculties
      }
    });
  } catch (error) {
    console.error('getSectionTimetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 2. PUT /api/academic/structure/section-timetables/:sectionId
 * Creates or updates weekly period slots for an academic section.
 */
async function updateSectionTimetable(req, res) {
  try {
    const { sectionId } = req.params;
    const { slots, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    if (!Array.isArray(slots)) {
      return res.status(400).json({ success: false, error: 'Slots must be an array' });
    }

    const section = await AcademicSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Academic section not found' });
    }

    // Context validation if query parameters or body context provided
    const queryObj = req.query || {};
    const bodyObj = req.body || {};
    const batchParam = queryObj.batch || bodyObj.batch;
    const semParam = queryObj.semester !== undefined ? queryObj.semester : bodyObj.semester;
    const branchParam = queryObj.branch || bodyObj.branch;

    if (batchParam && String(section.batch?._id || section.batch) !== String(batchParam)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to a different batch than requested.`
      });
    }
    if (semParam !== undefined && semParam !== '' && Number(section.semester) !== Number(semParam)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to Semester ${section.semester}, not Semester ${semParam}.`
      });
    }
    if (branchParam && String(section.branch?._id || section.branch) !== String(branchParam)) {
      return res.status(400).json({
        success: false,
        error: `Section '${section.name}' belongs to a different branch than requested.`
      });
    }

    const admin = req.admin || req.user;
    if (admin && admin.role !== 'SUPER_ADMIN') {
      const allowedBranchIds = (admin.scopes || []).filter(s => s.branch).map(s => String(s.branch._id || s.branch));
      if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(String(section.branch?._id || section.branch))) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only modify timetables for your assigned branch'
        });
      }
    }

    // Locate the official semester for this batch and semester number
    const secBatchId = section.batch?._id || section.batch;
    const semesterDoc = await Semester.findOne({
      batch: secBatchId,
      number: section.semester
    });

    if (!semesterDoc) {
      return res.status(400).json({
        success: false,
        error: `Cannot configure timetable: Official Semester ${section.semester} is not scheduled for batch ${secBatchId}.`
      });
    }

    // Published timetable protection: Prevent accidental edits unless explicitly reopening or status transitioning
    const existingTimetable = await SectionTimetable.findOne({ section: sectionId });
    if (existingTimetable && existingTimetable.status === 'Published' && status !== 'Draft' && !req.body.allowPublishedEdit) {
      return res.status(400).json({
        success: false,
        error: 'This timetable is Published and protected from accidental modifications. Reopen as Draft before editing.'
      });
    }

    // Fetch batch and common branch for authoritative subject validation
    const batchDoc = await AcademicBatch.findById(section.batch?._id || section.batch);
    const commonBranch = await Branch.findOne({ $or: [{ shortName: { $in: ['COMMON', 'Common'] } }, { name: 'Common to All' }] });
    const commonBranchIdStr = commonBranch ? commonBranch._id.toString() : null;
    const secBranchIdStr = (section.branch?._id || section.branch).toString();
    const batchSchemeIdStr = batchDoc?.scheme ? (batchDoc.scheme?._id || batchDoc.scheme).toString() : null;
    const expectedYear = yearFromSemester(section.semester);

    // Fetch active institutional timetable structure
    let structure = null;
    try {
      structure = await getOrSeedStructure(section.college?._id || section.college);
    } catch (sErr) {
      console.warn('Could not load timetable structure, using defaults:', sErr.message);
    }

    const periodDefinitions = structure?.periods?.length ? structure.periods : PERIOD_DEFINITIONS;
    const workingDaysDefinitions = structure?.workingDays?.length ? structure.workingDays : [
      { dayOfWeek: 1, dayName: 'Monday', status: 'Full Day', maxPeriods: 8 },
      { dayOfWeek: 2, dayName: 'Tuesday', status: 'Full Day', maxPeriods: 8 },
      { dayOfWeek: 3, dayName: 'Wednesday', status: 'Full Day', maxPeriods: 8 },
      { dayOfWeek: 4, dayName: 'Thursday', status: 'Full Day', maxPeriods: 8 },
      { dayOfWeek: 5, dayName: 'Friday', status: 'Full Day', maxPeriods: 8 },
      { dayOfWeek: 6, dayName: 'Saturday', status: 'Half Day', maxPeriods: 4 },
      { dayOfWeek: 7, dayName: 'Sunday', status: 'Non-Working', maxPeriods: 0 }
    ];

    const periodMap = new Map(periodDefinitions.map(p => [p.periodNumber, p]));
    const workingDaysMap = new Map(workingDaysDefinitions.map(wd => [wd.dayOfWeek, wd]));

    // Validate slots payload
    const processedSlots = [];
    const periodOccupancy = new Set();

    for (let idx = 0; idx < slots.length; idx++) {
      const slot = slots[idx];
      const day = Number(slot.dayOfWeek);
      const periodNum = Number(slot.periodNumber);

      // Day validation: 1 (Mon) to 6 (Sat). Sunday (7) is strictly non-working.
      const dayConfig = workingDaysMap.get(day);
      if (!Number.isInteger(day) || day < 1 || day > 6 || !dayConfig || dayConfig.status === 'Non-Working' || dayConfig.maxPeriods === 0) {
        return res.status(400).json({
          success: false,
          error: `Slot #${idx + 1}: dayOfWeek must be an integer between 1 (Monday) and 6 (Saturday). Sunday is a non-working day.`
        });
      }

      // Period validation
      const periodDef = periodMap.get(periodNum);
      if (!periodDef) {
        return res.status(400).json({
          success: false,
          error: `Slot #${idx + 1}: periodNumber must be between 1 and ${periodDefinitions.length}.`
        });
      }

      // Saturday Half Day rule: Periods 1 to 4 only (or per day's maxPeriods)
      if (periodNum > dayConfig.maxPeriods) {
        return res.status(400).json({
          success: false,
          error: `Slot #${idx + 1}: Saturday is a Half Day (Periods 1–${dayConfig.maxPeriods} only, 08:00–11:40). Period ${periodNum} is not permitted.`
        });
      }

      // Uniqueness per day, period, and batchGroup
      const batchGroup = slot.batchGroup ? String(slot.batchGroup).trim().toUpperCase() : 'ALL';
      const key = `${day}_${periodNum}_${batchGroup}`;
      const allKey = `${day}_${periodNum}_ALL`;

      if (periodOccupancy.has(key)) {
        return res.status(400).json({
          success: false,
          error: `Duplicate slot assignment for day ${day}, period ${periodNum} (${batchGroup}).`
        });
      }
      if (batchGroup === 'ALL') {
        for (const existingKey of periodOccupancy) {
          if (existingKey.startsWith(`${day}_${periodNum}_`)) {
            return res.status(400).json({
              success: false,
              error: `Period ${periodNum} on day ${day} already has a batch group assigned and cannot be assigned to ALL.`
            });
          }
        }
      } else {
        if (periodOccupancy.has(allKey)) {
          return res.status(400).json({
            success: false,
            error: `Period ${periodNum} on day ${day} is already fully occupied by a whole-section class.`
          });
        }
      }
      periodOccupancy.add(key);

      // Subject validation: Authoritative checks
      let subjectId = null;
      let subjDoc = null;
      if (slot.subject) {
        if (!mongoose.Types.ObjectId.isValid(slot.subject)) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Invalid subject ID.`
          });
        }
        subjDoc = await AcademicSubjectCms.findById(slot.subject);
        if (!subjDoc) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Referenced subject not found.`
          });
        }

        // 1. Status check: Only Published subjects allowed
        if (subjDoc.status && subjDoc.status !== 'Published') {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Subject '${subjDoc.code}' is ${subjDoc.status}. Only Published subjects can be scheduled.`
          });
        }

        // 2. Branch scope check: section's branch or Common curriculum
        const isFirstYearSection = section.semester <= 2;
        const subjBranchIdStr = (subjDoc.branch?._id || subjDoc.branch)?.toString();
        const isCommon = (commonBranchIdStr && subjBranchIdStr === commonBranchIdStr) ||
                         (isFirstYearSection && (subjDoc.year === '1st Year' || (subjDoc.semester !== null && subjDoc.semester <= 2)));
        if (subjBranchIdStr && subjBranchIdStr !== secBranchIdStr && !isCommon) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Subject '${subjDoc.code}' does not belong to section's branch or Common curriculum.`
          });
        }

        // 3. Scheme check: must match batch scheme if batch specifies one
        if (batchSchemeIdStr && subjDoc.scheme) {
          const subjSchemeIdStr = (subjDoc.scheme?._id || subjDoc.scheme).toString();
          if (batchSchemeIdStr !== subjSchemeIdStr) {
            return res.status(400).json({
              success: false,
              error: `Slot #${idx + 1}: Subject '${subjDoc.code}' belongs to a different academic scheme.`
            });
          }
        }

        // 4. Semester check: exact semester if populated, or matching year if null
        const isFirstYearSubject = subjDoc.year === '1st Year' || (subjDoc.semester !== null && subjDoc.semester <= 2);
        if (isFirstYearSection && isFirstYearSubject) {
          // 1st Year: All subjects are common across Semester 1 and Semester 2 (Physics & Chemistry cycles)
        } else if (subjDoc.semester !== null && subjDoc.semester !== undefined) {
          if (subjDoc.semester !== section.semester) {
            return res.status(400).json({
              success: false,
              error: `Slot #${idx + 1}: Subject '${subjDoc.code}' (Semester ${subjDoc.semester}) cannot be scheduled for a Semester ${section.semester} section.`
            });
          }
        } else if (subjDoc.year && subjDoc.year !== expectedYear) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Subject '${subjDoc.code}' (${subjDoc.year}) cannot be scheduled for a Semester ${section.semester} (${expectedYear}) section.`
          });
        }

        subjectId = subjDoc._id;
      }

      // Faculty validation: ObjectId only, null = TBA
      let facultyId = null;
      if (slot.faculty) {
        if (!mongoose.Types.ObjectId.isValid(slot.faculty)) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Invalid faculty ID.`
          });
        }
        const facDoc = await Faculty.findById(slot.faculty);
        if (!facDoc) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Referenced faculty member not found.`
          });
        }
        facultyId = facDoc._id;
      }

      // Cross-section conflict checks:
      // 1. Faculty conflict: Same faculty cannot be assigned to two sections at same day + period
      if (facultyId) {
        const conflictQuery = {
          section: { $ne: section._id },
          status: { $ne: 'Archived' },
          slots: {
            $elemMatch: {
              dayOfWeek: day,
              periodNumber: periodNum,
              faculty: facultyId
            }
          }
        };
        const facultyConflict = await SectionTimetable.findOne(conflictQuery);
        if (facultyConflict) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Faculty is already assigned to another section at this time.`
          });
        }
      }

      // 2. Room conflict: Same room cannot be assigned to two sections at same day + period
      const normalizedRoom = slot.room ? String(slot.room).trim().toUpperCase() : '';
      if (normalizedRoom) {
        const conflictQuery = {
          section: { $ne: section._id },
          status: { $ne: 'Archived' },
          slots: {
            $elemMatch: {
              dayOfWeek: day,
              periodNumber: periodNum,
              room: normalizedRoom
            }
          }
        };
        const roomConflict = await SectionTimetable.findOne(conflictQuery);
        if (roomConflict) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Room is already occupied at this time.`
          });
        }
      }

      // Class Type: simplified to 'Theory' | 'Lab' (backward compatible with 'Lecture' mapped to 'Theory')
      let lectureType = slot.lectureType || slot.classType || 'Theory';
      if (lectureType === 'Lecture') lectureType = 'Theory';
      const validTypes = ['Theory', 'Lab', 'Lecture', 'Tutorial', 'Seminar', 'Other', 'Free Period'];
      if (!validTypes.includes(lectureType)) {
        return res.status(400).json({
          success: false,
          error: `Slot #${idx + 1}: Invalid classType '${lectureType}'. Must be one of: Theory, Lab.`
        });
      }

      // Authoritative Theory vs Lab subject delivery validation
      if (subjDoc) {
        const isIpcc = subjDoc.evaluationType === 'IPCC' || subjDoc.category === 'Theory + Lab';
        const isLabOnly = subjDoc.evaluationType === 'LAB_ONLY' || subjDoc.category === 'Lab Only';
        const isTheoryOnly = subjDoc.evaluationType === 'THEORY_ONLY' || subjDoc.category === 'Theory';

        if (lectureType === 'Theory' && isLabOnly) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Subject '${subjDoc.name}' (${subjDoc.code}) is a Lab-only course and cannot be scheduled as a Theory session.`
          });
        }

        if (lectureType === 'Lab' && isTheoryOnly) {
          return res.status(400).json({
            success: false,
            error: `Slot #${idx + 1}: Subject '${subjDoc.name}' (${subjDoc.code}) is a Theory-only course and cannot be scheduled as a Lab session.`
          });
        }
      }

      processedSlots.push({
        dayOfWeek: day,
        periodNumber: periodNum,
        startMinute: periodDef.startMinute,
        endMinute: periodDef.endMinute,
        timeSlot: periodDef.timeSlot,
        subject: subjectId,
        faculty: facultyId,
        room: normalizedRoom,
        lectureType,
        batchGroup,
        sessionGroupId: slot.sessionGroupId ? String(slot.sessionGroupId).trim() : null
      });
    }

    // Sort slots chronologically
    processedSlots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.periodNumber - b.periodNumber;
    });

    // Multi-period / Lab validation: Group by sessionGroupId
    const sessionGroups = new Map();
    for (let i = 0; i < processedSlots.length; i++) {
      const s = processedSlots[i];
      if (s.sessionGroupId) {
        if (!sessionGroups.has(s.sessionGroupId)) {
          sessionGroups.set(s.sessionGroupId, []);
        }
        sessionGroups.get(s.sessionGroupId).push(s);
      }
    }

    const breakList = structure?.breaks || BREAK_DEFINITIONS;

    for (const [groupId, groupSlots] of sessionGroups.entries()) {
      // Rule 1: All slots in a group must be on the same day
      const days = new Set(groupSlots.map(s => s.dayOfWeek));
      if (days.size > 1) {
        return res.status(400).json({
          success: false,
          error: `Lab session '${groupId}' cannot span across multiple days.`
        });
      }

      // Sort group slots by periodNumber
      groupSlots.sort((a, b) => a.periodNumber - b.periodNumber);

      // Rule 2: Consecutive periods only
      for (let i = 0; i < groupSlots.length - 1; i++) {
        const curr = groupSlots[i];
        const next = groupSlots[i + 1];
        if (next.periodNumber !== curr.periodNumber + 1) {
          return res.status(400).json({
            success: false,
            error: `Lab session periods must be consecutive (${curr.periodNumber} and ${next.periodNumber} are not consecutive).`
          });
        }

        // Rule 3: Cannot cross a break or lunch
        const currDef = periodMap.get(curr.periodNumber);
        const nextDef = periodMap.get(next.periodNumber);
        if (currDef && nextDef) {
          // If end minute of curr < start minute of next, there is a gap (break/lunch)
          if (currDef.endMinute < nextDef.startMinute) {
            return res.status(400).json({
              success: false,
              error: `Lab session cannot cross a break or lunch break between Period ${curr.periodNumber} and Period ${next.periodNumber}.`
            });
          }

          // Also check explicit break definitions
          const hasBreak = breakList.some(b => {
            const bStart = Number(b.startMinute);
            const bEnd = Number(b.endMinute || (bStart + (b.duration || 15)));
            return bStart >= currDef.endMinute && bStart < nextDef.startMinute;
          });
          if (hasBreak) {
            return res.status(400).json({
              success: false,
              error: `Lab session cannot cross a break or lunch break between Period ${curr.periodNumber} and Period ${next.periodNumber}.`
            });
          }
        }
      }
    }

    const updateDoc = {
      section: section._id,
      college: section.college,
      program: section.program,
      batch: section.batch,
      branch: section.branch,
      semester: semesterDoc._id,
      semesterNumber: section.semester,
      slots: processedSlots
    };

    if (status && ['Draft', 'Published', 'Archived'].includes(status)) {
      updateDoc.status = status;
      if (status === 'Published') {
        updateDoc.publishedAt = new Date();
        updateDoc.publishedBy = req.admin?._id || req.user?._id || null;
      }
    }

    if (!updateDoc.createdBy && (req.admin?._id || req.user?._id)) {
      updateDoc.createdBy = req.admin?._id || req.user?._id;
    }

    const updatedTimetable = await SectionTimetable.findOneAndUpdate(
      { section: sectionId },
      { $set: updateDoc },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('slots.subject', 'name code credits branch')
      .populate('slots.faculty', 'name designation facultyId email');

    // If published or updating an already published timetable, safely evict future expected class cache
    if (updatedTimetable.status === 'Published') {
      await invalidateSectionExpectedSchedule(section);
    }

    return res.status(200).json({
      success: true,
      message: `Section timetable ${updatedTimetable.status === 'Published' ? 'published' : 'saved'} successfully.`,
      data: updatedTimetable
    });
  } catch (error) {
    console.error('updateSectionTimetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 3. POST /api/academic/structure/section-timetables/:sectionId/publish
 * Sets status to Published and activates future schedule projection for section members.
 */
async function publishSectionTimetable(req, res) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await AcademicSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Academic section not found' });
    }

    const admin = req.admin || req.user;
    if (admin && admin.role !== 'SUPER_ADMIN') {
      const allowedBranchIds = (admin.scopes || []).filter(s => s.branch).map(s => String(s.branch._id || s.branch));
      if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(String(section.branch?._id || section.branch))) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only modify timetables for your assigned branch'
        });
      }
    }

    const timetable = await SectionTimetable.findOne({ section: sectionId });
    if (!timetable) {
      return res.status(404).json({ success: false, error: 'No timetable found for this section' });
    }

    if (!timetable.slots || timetable.slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot publish an empty timetable. Please configure periods before publishing.'
      });
    }

    timetable.status = 'Published';
    timetable.publishedAt = new Date();
    timetable.publishedBy = req.admin?._id || req.user?._id || null;
    await timetable.save();

    await invalidateSectionExpectedSchedule(section);

    return res.status(200).json({
      success: true,
      message: 'Section timetable successfully published.',
      data: timetable
    });
  } catch (error) {
    console.error('publishSectionTimetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 4. POST /api/academic/structure/section-timetables/:sectionId/archive
 * Sets status to Archived (read-only).
 */
async function archiveSectionTimetable(req, res) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await AcademicSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Academic section not found' });
    }

    const admin = req.admin || req.user;
    if (admin && admin.role !== 'SUPER_ADMIN') {
      const allowedBranchIds = (admin.scopes || []).filter(s => s.branch).map(s => String(s.branch._id || s.branch));
      if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(String(section.branch?._id || section.branch))) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only modify timetables for your assigned branch'
        });
      }
    }

    const timetable = await SectionTimetable.findOne({ section: sectionId });
    if (!timetable) {
      return res.status(404).json({ success: false, error: 'No timetable found for this section' });
    }

    timetable.status = 'Archived';
    await timetable.save();

    return res.status(200).json({
      success: true,
      message: 'Section timetable archived.',
      data: timetable
    });
  } catch (error) {
    console.error('archiveSectionTimetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Helper: Safely evict expected class cache for section members (future classes recalculation).
 * NEVER mutates or touches historical marked ClassOccurrence records!
 */
async function invalidateSectionExpectedSchedule(section) {
  try {
    if (!section) return;

    // Find student accounts belonging to this section
    const students = await StudentAccount.find({
      branch: section.branch,
      semester: section.semester,
      section: section.name
    }).select('_id');

    if (students.length === 0) return;

    const studentIds = students.map(s => s._id);

    // Evict cached expected schedule so next read recomputes future expected classes
    await StudentExpectedSchedule.deleteMany({
      student: { $in: studentIds },
      semester: section.semester
    });
  } catch (err) {
    console.error('invalidateSectionExpectedSchedule error:', err);
  }
}

/**
 * 5. GET /api/academic/structure/period-definitions
 * Returns standard SIT B.E. period and break definitions.
 */
async function getPeriodDefinitions(req, res) {
  try {
    const structure = await getOrSeedStructure();
    return res.status(200).json({
      success: true,
      data: {
        structure,
        periods: structure?.periods?.length ? structure.periods : PERIOD_DEFINITIONS,
        breaks: structure?.breaks?.length ? structure.breaks : BREAK_DEFINITIONS,
        workingDays: structure?.workingDays?.length ? structure.workingDays : []
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      data: {
        periods: PERIOD_DEFINITIONS,
        breaks: BREAK_DEFINITIONS
      }
    });
  }
}

/**
 * 4.5. POST /api/academic/structure/section-timetables/:sectionId/reopen
 * Reopens a Published or Archived timetable back to Draft status for editing.
 */
async function reopenSectionTimetable(req, res) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await AcademicSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Academic section not found' });
    }

    const admin = req.admin || req.user;
    if (admin && admin.role !== 'SUPER_ADMIN') {
      const allowedBranchIds = (admin.scopes || []).filter(s => s.branch).map(s => String(s.branch._id || s.branch));
      if (allowedBranchIds.length > 0 && !allowedBranchIds.includes(String(section.branch?._id || section.branch))) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: You can only modify timetables for your assigned branch'
        });
      }
    }

    const timetable = await SectionTimetable.findOne({ section: sectionId });
    if (!timetable) {
      return res.status(404).json({ success: false, error: 'No timetable found for this section' });
    }

    timetable.status = 'Draft';
    await timetable.save();

    return res.status(200).json({
      success: true,
      message: 'Section timetable reopened as Draft for editing.',
      data: timetable
    });
  } catch (error) {
    console.error('reopenSectionTimetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getSectionTimetable,
  updateSectionTimetable,
  publishSectionTimetable,
  archiveSectionTimetable,
  reopenSectionTimetable,
  getPeriodDefinitions,
  invalidateSectionExpectedSchedule
};
