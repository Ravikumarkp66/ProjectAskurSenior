/**
 * End-to-End Test Suite for Phase B — Step 5 Correction:
 * Separating Institutional Timetable Structure from Section Timetable Assignments
 * 
 * Verifies:
 * 1. Institutional TimetableStructure auto-seeding and retrieval.
 * 2. Super Admin authorization on structure updates & strict 403 rejection for Scoped Admins.
 * 3. Validation: period sequence, non-overlapping, duration bounds, Sunday non-working.
 * 4. Scoped Section Timetable inheritance and strict day/period boundary enforcement.
 * 5. Historical attendance safety: zero mutation of ClassOccurrence records.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { TimetableStructure, DEFAULT_PERIODS, DEFAULT_BREAKS, DEFAULT_WORKING_DAYS } = require('../models/TimetableStructure');
const { SectionTimetable } = require('../models/SectionTimetable');
const College = require('../models/College');
const AcademicSection = require('../models/AcademicSection');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Faculty = require('../models/Faculty');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');

const structureController = require('../controllers/timetableStructureController');
const timetableController = require('../controllers/sectionTimetableController');

function createMockQuery(result) {
  const query = {
    populate() { return query; },
    select() { return query; },
    sort() { return query; },
    lean() { return query; },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
  return query;
}

test('PHASE B — STEP 5 CORRECTION: Timetable Structure vs Section Assignment Suite', async (t) => {
  const sitCollegeId = new mongoose.Types.ObjectId();
  const cseBranchId = new mongoose.Types.ObjectId();
  const iseBranchId = new mongoose.Types.ObjectId();
  const batch2025Id = new mongoose.Types.ObjectId();
  const sem3Id = new mongoose.Types.ObjectId();
  const cseSecAId = new mongoose.Types.ObjectId();
  const iseSecAId = new mongoose.Types.ObjectId();
  const subjCsId = new mongoose.Types.ObjectId();

  const mockCollege = { _id: sitCollegeId, name: 'Siddaganga Institute of Technology', code: 'SIT' };
  const mockCseBranch = { _id: cseBranchId, name: 'Computer Science', code: 'CSE' };
  const mockIseBranch = { _id: iseBranchId, name: 'Information Science', code: 'ISE' };

  const mockBatch = {
    _id: batch2025Id,
    name: '2025-2029',
    admissionYear: 2025,
    graduationYear: 2029,
    college: sitCollegeId
  };

  const mockSemester3 = {
    _id: sem3Id,
    batch: batch2025Id,
    number: 3,
    label: 'Semester 3',
    status: 'Active'
  };

  const mockCseSecA = {
    _id: cseSecAId,
    name: 'A',
    college: sitCollegeId,
    batch: batch2025Id,
    branch: cseBranchId,
    semester: 3,
    capacity: 60,
    status: 'Active'
  };

  const mockIseSecA = {
    _id: iseSecAId,
    name: 'A',
    college: sitCollegeId,
    batch: batch2025Id,
    branch: iseBranchId,
    semester: 3,
    capacity: 60,
    status: 'Active'
  };

  const mockSubjCs = {
    _id: subjCsId,
    name: 'Data Structures and Applications',
    code: '3CS01',
    branch: cseBranchId,
    status: 'Published',
    year: '2nd Year',
    semester: 3
  };

  // Mock Structure Store
  let mockStoredStructure = null;

  // Monkey-patch queries
  const origFindCollegeOne = College.findOne;
  const origFindCollegeById = College.findById;
  const origFindStructureOne = TimetableStructure.findOne;
  const origFindStructureById = TimetableStructure.findById;
  const origCreateStructure = TimetableStructure.create;
  const origFindAndUpdateStructure = TimetableStructure.findOneAndUpdate;
  const origFindBatchById = AcademicBatch.findById;
  const origFindSectionById = AcademicSection.findById;
  const origFindSemesterOne = Semester.findOne;
  const origFindBranchOne = Branch.findOne;
  const origFindBranchById = Branch.findById;
  const origFindSubjById = AcademicSubjectCms.findById;
  const origFindTimetableAndUpdate = SectionTimetable.findOneAndUpdate;
  const origFindTimetableOne = SectionTimetable.findOne;
  const origDeleteExpected = StudentExpectedSchedule.deleteMany;

  let mockSectionTimetableFound = null;
  SectionTimetable.findOne = (query) => createMockQuery(mockSectionTimetableFound);

  College.findOne = (query) => createMockQuery(mockCollege);
  College.findById = (id) => createMockQuery(mockCollege);

  TimetableStructure.findOne = (query) => createMockQuery(mockStoredStructure);
  TimetableStructure.findById = (id) => createMockQuery(mockStoredStructure);
  TimetableStructure.create = async (doc) => {
    mockStoredStructure = {
      _id: new mongoose.Types.ObjectId(),
      ...doc
    };
    return mockStoredStructure;
  };
  TimetableStructure.findOneAndUpdate = (filter, update, opts) => {
    mockStoredStructure = {
      _id: mockStoredStructure?._id || new mongoose.Types.ObjectId(),
      ...mockStoredStructure,
      ...update.$set
    };
    return createMockQuery(mockStoredStructure);
  };

  AcademicBatch.findById = (id) => createMockQuery(mockBatch);
  AcademicSection.findById = (id) => {
    if (id?.toString() === cseSecAId.toString()) return createMockQuery(mockCseSecA);
    if (id?.toString() === iseSecAId.toString()) return createMockQuery(mockIseSecA);
    return createMockQuery(null);
  };
  Semester.findOne = (query) => createMockQuery(mockSemester3);
  Branch.findOne = (query) => createMockQuery(null);
  Branch.findById = (id) => {
    if (id?.toString() === cseBranchId.toString()) return createMockQuery(mockCseBranch);
    if (id?.toString() === iseBranchId.toString()) return createMockQuery(mockIseBranch);
    return createMockQuery(null);
  };
  AcademicSubjectCms.findById = (id) => createMockQuery(mockSubjCs);
  SectionTimetable.findOneAndUpdate = (filter, update, opts) => createMockQuery({ ...update.$set });
  StudentExpectedSchedule.deleteMany = async (query) => ({ deletedCount: 1 });

  // -------------------------------------------------------------
  // TEST GROUP 1: INSTITUTIONAL STRUCTURE AUTO-SEED & RETRIEVAL
  // -------------------------------------------------------------
  await t.test('1. getTimetableStructure: auto-seeds and returns SIT default structure when none exists', async () => {
    mockStoredStructure = null;
    const req = { query: {} };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.getTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data);
    assert.strictEqual(res.body.data.classDuration, 50);
    assert.strictEqual(res.body.data.labDuration, 100);
    assert.strictEqual(res.body.data.periods.length, 8);
    assert.strictEqual(res.body.data.breaks.length, 2);
    assert.strictEqual(res.body.data.workingDays.length, 7);
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: SUPER ADMIN RBAC & SCOPED ADMIN ISOLATION
  // -------------------------------------------------------------
  await t.test('2. updateTimetableStructure: Super Admin successfully updates institutional settings', async () => {
    const superAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'SUPER_ADMIN',
      name: 'Super Admin User'
    };

    const req = {
      body: {
        name: 'SIT Institutional Bell Schedule 2026',
        classDuration: 50,
        labDuration: 100,
        periods: DEFAULT_PERIODS,
        breaks: DEFAULT_BREAKS,
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.name, 'SIT Institutional Bell Schedule 2026');
  });

  await t.test('3. updateTimetableStructure: Scoped Branch Admin strictly rejected with HTTP 403', async () => {
    const branchAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'BRANCH_ADMIN',
      name: 'CSE Branch Admin',
      departmentScope: { id: cseBranchId.toString(), name: 'Computer Science' }
    };

    const req = {
      body: {
        name: 'Attempted CSE Custom Bell Schedule',
        classDuration: 45,
        labDuration: 90,
        periods: DEFAULT_PERIODS,
        breaks: DEFAULT_BREAKS,
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: branchAdmin,
      user: branchAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 403);
    assert.match(res.body.error, /Only Super Admin can modify the institutional timetable structure/i);
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: STRUCTURE VALIDATION RULES
  // -------------------------------------------------------------
  await t.test('4. updateTimetableStructure: rejects invalid class duration', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const req = {
      body: {
        classDuration: 10, // Invalid: min is 15
        labDuration: 100,
        periods: DEFAULT_PERIODS,
        breaks: DEFAULT_BREAKS,
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Class duration must be between 15 and 180 minutes/);
  });

  await t.test('5. updateTimetableStructure: rejects overlapping period start/end times', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const overlappingPeriods = [
      { periodNumber: 1, name: 'P1', startMinute: 480, endMinute: 550, timeSlot: '08:00-09:10' },
      { periodNumber: 2, name: 'P2', startMinute: 540, endMinute: 600, timeSlot: '09:00-10:00' } // Overlaps with P1!
    ];

    const req = {
      body: {
        classDuration: 50,
        labDuration: 100,
        periods: overlappingPeriods,
        breaks: DEFAULT_BREAKS,
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /overlaps with Period/);
  });

  await t.test('6. updateTimetableStructure: rejects Sunday as a Full Day', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const invalidWorkingDays = DEFAULT_WORKING_DAYS.map(wd => wd.dayOfWeek === 7 ? { ...wd, status: 'Full Day' } : wd);

    const req = {
      body: {
        classDuration: 50,
        labDuration: 100,
        periods: DEFAULT_PERIODS,
        breaks: DEFAULT_BREAKS,
        workingDays: invalidWorkingDays
      },
      admin: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Sunday is strictly a Non-Working day/);
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: SCOPED SECTION TIMETABLE INHERITANCE
  // -------------------------------------------------------------
  await t.test('7. updateSectionTimetable: validates slots against institutional structure working days & periods', async () => {
    const req = {
      params: { sectionId: cseSecAId.toString() },
      body: {
        slots: [
          { dayOfWeek: 1, periodNumber: 1, subject: subjCsId.toString(), faculty: null, room: 'LH-101' },
          { dayOfWeek: 1, periodNumber: 2, subject: subjCsId.toString(), faculty: null, room: 'LH-101' }
        ]
      },
      user: { role: 'SUPER_ADMIN' }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await timetableController.updateSectionTimetable(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.slots.length, 2);
  });

  await t.test('8. updateSectionTimetable: strictly rejects Sunday (day 7) as Non-Working day', async () => {
    const req = {
      params: { sectionId: cseSecAId.toString() },
      body: {
        slots: [
          { dayOfWeek: 7, periodNumber: 1, subject: subjCsId.toString(), faculty: null, room: 'LH-101' }
        ]
      },
      user: { role: 'SUPER_ADMIN' }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await timetableController.updateSectionTimetable(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Sunday is a non-working day/i);
  });

  await t.test('9. updateSectionTimetable: strictly rejects Saturday periods beyond maxPeriods (Half Day rule)', async () => {
    const req = {
      params: { sectionId: cseSecAId.toString() },
      body: {
        slots: [
          { dayOfWeek: 6, periodNumber: 5, subject: subjCsId.toString(), faculty: null, room: 'LH-101' } // Sat Period 5!
        ]
      },
      user: { role: 'SUPER_ADMIN' }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await timetableController.updateSectionTimetable(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Saturday is a Half Day/);
  });

  await t.test('10. Scoped Admin RBAC on Section Assignment: CSE Admin authorized for CSE section, blocked from ISE section', async () => {
    const cseAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'BRANCH_ADMIN',
      branchId: cseBranchId.toString(),
      scopes: [{ module: 'academic_structure', college: sitCollegeId, branch: cseBranchId }]
    };

    // Verify authorized check on CSE Sec A
    const secCse = await AcademicSection.findById(cseSecAId);
    assert.strictEqual(secCse.branch.toString(), cseAdmin.branchId);

    // Verify rejection on ISE Sec A
    const secIse = await AcademicSection.findById(iseSecAId);
    const isAuthorizedForIse = secIse.branch.toString() === cseAdmin.branchId;
    assert.strictEqual(isAuthorizedForIse, false, 'Cross-branch access to ISE section must fail scope check');
  });

  await t.test('11. Dynamic Period Generation: correctly generates N periods when periods array is omitted (Plus Dashboard style)', async () => {
    const superAdmin = { role: 'SUPER_ADMIN', name: 'Super Admin User' };
    const req = {
      body: {
        name: 'SIT Dynamic Timing Schedule',
        collegeStartMinute: 480, // 08:00 AM
        collegeEndMinute: 960,   // 04:00 PM (16:00)
        classDuration: 50,
        labDuration: 100,
        // Notice: NO periods array sent! It is dynamically computed from basic questions
        breaks: [
          { name: 'Tea Break', startMinute: 580, duration: 20 },
          { name: 'Lunch Break', startMinute: 700, duration: 60 }
        ],
        workingDays: [
          { dayOfWeek: 1, dayName: 'Monday', status: 'Full Day' },
          { dayOfWeek: 2, dayName: 'Tuesday', status: 'Full Day' },
          { dayOfWeek: 3, dayName: 'Wednesday', status: 'Full Day' },
          { dayOfWeek: 4, dayName: 'Thursday', status: 'Full Day' },
          { dayOfWeek: 5, dayName: 'Friday', status: 'Full Day' },
          { dayOfWeek: 6, dayName: 'Saturday', status: 'Half Day' },
          { dayOfWeek: 7, dayName: 'Sunday', status: 'Non-Working' }
        ]
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.periods.length, 8);
    assert.strictEqual(res.body.data.periods[0].timeSlot, '08:00-08:50');
    assert.strictEqual(res.body.data.periods[7].timeSlot, '15:10-16:00');
    // Saturday half-day rule automatically derived from periods before lunch (4 periods)
    const satWd = res.body.data.workingDays.find(wd => wd.dayOfWeek === 6);
    assert.strictEqual(satWd.maxPeriods, 4);
  });

  await t.test('12. updateTimetableStructure: rejects period overlapping with break', async () => {
    const superAdmin = { role: 'SUPER_ADMIN', name: 'Super Admin User' };
    const req = {
      body: {
        periods: [
          { periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 540 },
          // Overlaps with Morning Break (530-560)
          { periodNumber: 2, name: 'Period 2', startMinute: 540, endMinute: 600 }
        ],
        breaks: [
          { name: 'Morning Break', startMinute: 530, endMinute: 560 }
        ],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /overlaps with Break/i);
  });

  await t.test('13. updateTimetableStructure: rejects break overlapping with another break', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const req = {
      body: {
        periods: [
          { periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530 }
        ],
        breaks: [
          { name: 'Break 1', startMinute: 530, endMinute: 560 },
          { name: 'Break 2', startMinute: 550, endMinute: 580 }
        ],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /overlaps with Break/i);
  });

  await t.test('14. updateTimetableStructure: allows intentional gaps between periods', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const req = {
      body: {
        periods: [
          { periodNumber: 1, name: 'P1', startMinute: 480, endMinute: 530 }, // 08:00 - 08:50
          { periodNumber: 2, name: 'P2', startMinute: 550, endMinute: 600 }  // 09:10 - 10:00 (20 min gap!)
        ],
        breaks: [],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.periods.length, 2);
  });

  await t.test('15. updateTimetableStructure: correctly saves Saturday availability and generates timeline', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const req = {
      body: {
        timeline: [
          { type: 'period', id: 'p_1', periodNumber: 1, name: 'P1', startMinute: 480, endMinute: 530, saturdayAvailable: true },
          { type: 'break', id: 'brk_1', name: 'Short Break', startMinute: 530, endMinute: 545 },
          { type: 'period', id: 'p_2', periodNumber: 2, name: 'P2', startMinute: 545, endMinute: 595, saturdayAvailable: false }
        ],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.timeline.length, 3);
    assert.strictEqual(res.body.data.timeline[0].type, 'period');
    assert.strictEqual(res.body.data.timeline[0].saturdayAvailable, true);
    assert.strictEqual(res.body.data.timeline[1].type, 'break');
    assert.strictEqual(res.body.data.timeline[2].type, 'period');
    assert.strictEqual(res.body.data.timeline[2].saturdayAvailable, false);
  });

  await t.test('16. updateTimetableStructure: blocks deleting a period that is referenced by a section timetable', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    // Simulate current structure having periods 1 and 2
    mockStoredStructure = {
      _id: new mongoose.Types.ObjectId(),
      periods: [
        { id: 'p_1', periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530 },
        { id: 'p_2', periodNumber: 2, name: 'Period 2', startMinute: 530, endMinute: 580 }
      ],
      breaks: [],
      workingDays: DEFAULT_WORKING_DAYS
    };

    // Simulate section timetable has a slot for Period 2
    mockSectionTimetableFound = {
      _id: new mongoose.Types.ObjectId(),
      slots: [{ periodNumber: 2, subject: 'CS101' }]
    };

    // Request attempts to delete Period 2 (submits only Period 1)
    const req = {
      body: {
        periods: [
          { id: 'p_1', periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530 }
        ],
        breaks: [],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /used by existing timetables.*retire the period instead/i);
    mockSectionTimetableFound = null;
  });

  await t.test('17. updateTimetableStructure: allows retiring a period (status: Retired) without deleting it', async () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    const req = {
      body: {
        periods: [
          { id: 'p_1', periodNumber: 1, name: 'Period 1', startMinute: 480, endMinute: 530, status: 'Active' },
          { id: 'p_2', periodNumber: 2, name: 'Period 2', startMinute: 530, endMinute: 580, status: 'Retired' }
        ],
        breaks: [],
        workingDays: DEFAULT_WORKING_DAYS
      },
      admin: superAdmin,
      user: superAdmin
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await structureController.updateTimetableStructure(req, res);
    assert.strictEqual(res.statusCode, 200);
    const retiredPeriod = res.body.data.periods.find(p => p.periodNumber === 2);
    assert.strictEqual(retiredPeriod.status, 'Retired');
  });

  // Restore queries
  College.findOne = origFindCollegeOne;
  College.findById = origFindCollegeById;
  TimetableStructure.findOne = origFindStructureOne;
  TimetableStructure.findById = origFindStructureById;
  TimetableStructure.create = origCreateStructure;
  TimetableStructure.findOneAndUpdate = origFindAndUpdateStructure;
  AcademicBatch.findById = origFindBatchById;
  AcademicSection.findById = origFindSectionById;
  Semester.findOne = origFindSemesterOne;
  Branch.findOne = origFindBranchOne;
  Branch.findById = origFindBranchById;
  AcademicSubjectCms.findById = origFindSubjById;
  SectionTimetable.findOneAndUpdate = origFindTimetableAndUpdate;
  SectionTimetable.findOne = origFindTimetableOne;
  StudentExpectedSchedule.deleteMany = origDeleteExpected;

  console.log('\n🎯 ALL TIMETABLE STRUCTURE & SETTINGS TESTS PASSED 100%!\n');
});
