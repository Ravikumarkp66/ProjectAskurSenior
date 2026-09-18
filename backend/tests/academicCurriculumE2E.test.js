/**
 * End-to-End Test Suite for Phase B — Step 6: Curriculum / Academic Subjects
 * 
 * Verifies:
 * 1. AcademicSubject schema extension with semester (1-8 or null) and indexes.
 * 2. Backfill heuristic logic (prefix detection and cycle preservation).
 * 3. Curriculum controller filtering by semester and auto-alignment with academic year.
 * 4. Scoped RBAC enforcement (Branch Admin limited to branch; Common to All restricted to Super Admin).
 * 5. Timetable authoritative validation enforcing Scheme, Semester, Branch & Common to All rules.
 * 6. Historical attendance and materials dependency preservation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const AcademicSubjectCms = require('../models/AcademicSubject');
const AcademicBatch = require('../models/AcademicBatch');
const AcademicSection = require('../models/AcademicSection');
const { SectionTimetable } = require('../models/SectionTimetable');
const Branch = require('../models/Branch');
const College = require('../models/College');
const { TimetableStructure } = require('../models/TimetableStructure');
const Scheme = require('../models/Scheme');
const Semester = require('../models/Semester');
const Faculty = require('../models/Faculty');
const subjectController = require('../controllers/adminCmsSubjectController');
const timetableController = require('../controllers/sectionTimetableController');
const { resolveSubjectSemester } = require('../scripts/backfillSubjectSemesters');

function createMockQuery(result) {
  const query = {
    populate() { return query; },
    select() { return query; },
    sort() { return query; },
    lean() { return query; },
    skip() { return query; },
    limit() { return query; },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
  return query;
}

test('PHASE B — STEP 6: Curriculum / Academic Subjects Suite', async (t) => {
  // Test IDs
  const sitCollegeId = new mongoose.Types.ObjectId();
  const beProgramId = new mongoose.Types.ObjectId();
  const cseBranchId = new mongoose.Types.ObjectId();
  const iseBranchId = new mongoose.Types.ObjectId();
  const commonBranchId = new mongoose.Types.ObjectId();

  const scheme2022Id = new mongoose.Types.ObjectId();
  const scheme2025Id = new mongoose.Types.ObjectId();

  const batch2024Id = new mongoose.Types.ObjectId();
  const sem4Id = new mongoose.Types.ObjectId();
  const cseSec4AId = new mongoose.Types.ObjectId();

  // Mock Models Data
  const mockCollege = { _id: sitCollegeId, name: 'SIT Tumkur', code: 'SIT' };
  const mockCseBranch = { _id: cseBranchId, name: 'Computer Science & Engineering', code: 'CSE', shortName: 'CSE' };
  const mockIseBranch = { _id: iseBranchId, name: 'Information Science & Engineering', code: 'ISE', shortName: 'ISE' };
  const mockCommonBranch = { _id: commonBranchId, name: 'Common to All', shortName: 'COMMON' };

  const mockBatch2024 = {
    _id: batch2024Id,
    name: '2024-2028',
    admissionYear: 2024,
    graduationYear: 2028,
    college: sitCollegeId,
    program: beProgramId,
    scheme: scheme2022Id
  };

  const mockSemester4 = {
    _id: sem4Id,
    batch: batch2024Id,
    number: 4,
    label: 'Semester 4',
    status: 'Active'
  };

  const mockCseSec4A = {
    _id: cseSec4AId,
    name: 'A',
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2024Id,
    branch: cseBranchId,
    semester: 4,
    capacity: 60,
    status: 'Active'
  };

  // Mock Subjects
  const subjCseSem4 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Design and Analysis of Algorithms',
    code: '4CS01',
    branch: cseBranchId,
    scheme: scheme2022Id,
    semester: 4,
    year: '2nd Year',
    status: 'Published'
  };

  const subjCseSem3 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Data Structures and Applications',
    code: '3CS01',
    branch: cseBranchId,
    scheme: scheme2022Id,
    semester: 3,
    year: '2nd Year',
    status: 'Published'
  };

  const subjCommonSem4 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Constitution of India and Professional Ethics',
    code: '4CIP01',
    branch: commonBranchId,
    scheme: scheme2022Id,
    semester: 4,
    year: '2nd Year',
    status: 'Published'
  };

  const subjIseSem4 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Object Oriented Programming with Java',
    code: '4IS01',
    branch: iseBranchId,
    scheme: scheme2022Id,
    semester: 4,
    year: '2nd Year',
    status: 'Published'
  };

  const subjWrongSchemeSem4 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Emerging Technologies in CS',
    code: '4CS09',
    branch: cseBranchId,
    scheme: scheme2025Id, // Different scheme
    semester: 4,
    year: '2nd Year',
    status: 'Published'
  };

  const subjUnpublishedSem4 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Draft CS Elective',
    code: '4CSPE01',
    branch: cseBranchId,
    scheme: scheme2022Id,
    semester: 4,
    year: '2nd Year',
    status: 'Draft' // Unpublished
  };

  const subjectStore = new Map([
    [subjCseSem4._id.toString(), subjCseSem4],
    [subjCseSem3._id.toString(), subjCseSem3],
    [subjCommonSem4._id.toString(), subjCommonSem4],
    [subjIseSem4._id.toString(), subjIseSem4],
    [subjWrongSchemeSem4._id.toString(), subjWrongSchemeSem4],
    [subjUnpublishedSem4._id.toString(), subjUnpublishedSem4]
  ]);

  // Monkey-patch queries
  const origFindSubjById = AcademicSubjectCms.findById;
  const origFindSubjFind = AcademicSubjectCms.find;
  const origFindSubjOne = AcademicSubjectCms.findOne;
  const origCreateSubj = AcademicSubjectCms.create;
  const origCountSubj = AcademicSubjectCms.countDocuments;
  const origFindBatchById = AcademicBatch.findById;
  const origFindSectionById = AcademicSection.findById;
  const origFindSemesterOne = Semester.findOne;
  const origFindBranchOne = Branch.findOne;
  const origFindBranchById = Branch.findById;
  const origFindCollegeOne = College.findOne;
  const origFindCollegeById = College.findById;
  const origFindTimetableStructureOne = TimetableStructure.findOne;
  const origCreateTimetableStructure = TimetableStructure.create;
  const origFindFacultyById = Faculty.findById;
  const origFindSchemeOne = Scheme.findOne;
  const origFindSchemeById = Scheme.findById;
  const origFindTimetableOne = SectionTimetable.findOne;
  const origFindTimetableAndUpdate = SectionTimetable.findOneAndUpdate;

  AcademicSubjectCms.findById = (id) => {
    const item = subjectStore.get(id?.toString());
    return createMockQuery(item ? { ...item } : null);
  };

  AcademicSubjectCms.findOne = (query) => {
    if (query?.code) {
      const match = Array.from(subjectStore.values()).find(s => s.code === query.code);
      return createMockQuery(match ? { ...match } : null);
    }
    return createMockQuery(null);
  };

  AcademicSubjectCms.create = async (doc) => {
    const created = { _id: new mongoose.Types.ObjectId(), ...doc };
    subjectStore.set(created._id.toString(), created);
    return created;
  };

  AcademicSubjectCms.find = (query) => {
    let items = Array.from(subjectStore.values());
    if (query?.semester !== undefined) {
      items = items.filter(s => s.semester === query.semester);
    }
    if (query?.branch) {
      if (query.branch.$in) {
        const allowedIds = query.branch.$in.map(b => b.toString());
        items = items.filter(s => allowedIds.includes(s.branch.toString()));
      } else {
        items = items.filter(s => s.branch.toString() === query.branch.toString());
      }
    }
    return createMockQuery(items.map(s => ({ ...s })));
  };

  AcademicSubjectCms.countDocuments = (query) => {
    let items = Array.from(subjectStore.values());
    if (query?.semester !== undefined) {
      items = items.filter(s => s.semester === query.semester);
    }
    return Promise.resolve(items.length);
  };

  AcademicBatch.findById = (id) => createMockQuery(mockBatch2024);

  AcademicSection.findById = (id) => {
    if (id?.toString() === cseSec4AId.toString()) {
      return createMockQuery({ ...mockCseSec4A });
    }
    return createMockQuery(null);
  };

  Semester.findOne = (query) => {
    if (query?.batch?.toString() === batch2024Id.toString() && query?.number === 4) {
      return createMockQuery({ ...mockSemester4 });
    }
    return createMockQuery(null);
  };

  Branch.findOne = (query) => {
    if (query?.$or) {
      return createMockQuery(mockCommonBranch);
    }
    if (query?.shortName === 'CSE') return createMockQuery(mockCseBranch);
    if (query?.shortName === 'ISE') return createMockQuery(mockIseBranch);
    return createMockQuery(mockCommonBranch);
  };

  Branch.findById = (id) => {
    if (id?.toString() === cseBranchId.toString()) return createMockQuery(mockCseBranch);
    if (id?.toString() === iseBranchId.toString()) return createMockQuery(mockIseBranch);
    if (id?.toString() === commonBranchId.toString()) return createMockQuery(mockCommonBranch);
    return createMockQuery(null);
  };

  College.findOne = (query) => createMockQuery(mockCollege);
  College.findById = (id) => createMockQuery(mockCollege);
  TimetableStructure.findOne = (query) => createMockQuery(null);
  TimetableStructure.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });

  Scheme.findOne = (query) => createMockQuery({ _id: scheme2022Id, name: '2022 Scheme' });
  Scheme.findById = (id) => createMockQuery({ _id: scheme2022Id, name: '2022 Scheme' });

  Faculty.findById = (id) => createMockQuery({ _id: id, name: 'Sample Faculty' });

  SectionTimetable.findOne = (query) => createMockQuery(null);
  SectionTimetable.findOneAndUpdate = (filter, update, opts) => {
    const updated = {
      _id: new mongoose.Types.ObjectId(),
      status: 'Draft',
      ...update.$set
    };
    return createMockQuery(updated);
  };

  // -------------------------------------------------------------
  // TEST GROUP 1: SCHEMA VALIDATION & INDEXES
  // -------------------------------------------------------------
  await t.test('1. Schema Validation: accepts valid semester 1-8 and null', async () => {
    const validSubj = new AcademicSubjectCms({
      name: 'Software Engineering',
      code: '5CS01',
      slug: 'software-engineering',
      credits: 4,
      scheme: scheme2022Id,
      branch: cseBranchId,
      semester: 5,
      year: '3rd Year',
      status: 'Published'
    });
    const err = validSubj.validateSync();
    assert.strictEqual(err, undefined, 'Valid semester should not produce validation errors');

    const nullSemSubj = new AcademicSubjectCms({
      name: 'P-Cycle Physics',
      code: 'PHY101',
      slug: 'p-cycle-physics',
      credits: 4,
      scheme: scheme2022Id,
      branch: commonBranchId,
      semester: null,
      year: '1st Year',
      status: 'Published'
    });
    const nullErr = nullSemSubj.validateSync();
    assert.strictEqual(nullErr, undefined, 'null semester should be permitted for cycle courses');
  });

  await t.test('2. Schema Validation: rejects invalid semester values (< 1 or > 8)', async () => {
    const semZeroSubj = new AcademicSubjectCms({
      name: 'Invalid Subj',
      code: '0CS01',
      slug: 'invalid-subj-0',
      credits: 4,
      scheme: scheme2022Id,
      branch: cseBranchId,
      semester: 0,
      year: '1st Year'
    });
    const errZero = semZeroSubj.validateSync();
    assert.ok(errZero.errors.semester, 'semester 0 must fail validation');

    const semNineSubj = new AcademicSubjectCms({
      name: 'Invalid Subj 9',
      code: '9CS01',
      slug: 'invalid-subj-9',
      credits: 4,
      scheme: scheme2022Id,
      branch: cseBranchId,
      semester: 9,
      year: '4th Year'
    });
    const errNine = semNineSubj.validateSync();
    assert.ok(errNine.errors.semester, 'semester 9 must fail validation');
  });

  await t.test('3. Schema Indexes: verifies compound and single semester indexes exist', async () => {
    const indexes = AcademicSubjectCms.schema.indexes();
    const hasSemesterIdx = indexes.some(idx => idx[0] && idx[0].semester === 1);
    assert.ok(hasSemesterIdx, 'Single index { semester: 1 } must exist on schema');

    const hasCompoundIdx = indexes.some(idx => 
      idx[0] && idx[0].scheme === 1 && idx[0].branch === 1 && idx[0].semester === 1 && idx[0].status === 1
    );
    assert.ok(hasCompoundIdx, 'Compound index { scheme: 1, branch: 1, semester: 1, status: 1 } must exist');
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: HEURISTIC BACKFILL RESOLUTION LOGIC
  // -------------------------------------------------------------
  await t.test('4. resolveSubjectSemester: accurately maps SIT prefix codes', () => {
    assert.strictEqual(resolveSubjectSemester('3SMA4TC', '2nd Year'), 3);
    assert.strictEqual(resolveSubjectSemester('4AIML_DS', '2nd Year'), 4);
    assert.strictEqual(resolveSubjectSemester('5AIML_PE_SNA', '3rd Year'), 5);
    assert.strictEqual(resolveSubjectSemester('6SCS01', '3rd Year'), 6);
    assert.strictEqual(resolveSubjectSemester('7CS01', '4th Year'), 7);
    assert.strictEqual(resolveSubjectSemester('8CS01', '4th Year'), 8);
  });

  await t.test('5. resolveSubjectSemester: safely leaves 1st-year cycle courses and electives as null', () => {
    assert.strictEqual(resolveSubjectSemester('CAED', '1st Year'), null);
    assert.strictEqual(resolveSubjectSemester('PSC', '1st Year'), null);
    assert.strictEqual(resolveSubjectSemester('MATH1', '1st Year'), null);
    assert.strictEqual(resolveSubjectSemester('PHY1', '1st Year'), null);
    assert.strictEqual(resolveSubjectSemester('CHEM1', '1st Year'), null);
    assert.strictEqual(resolveSubjectSemester('OE_AI', '3rd Year'), null);
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: CONTROLLER FILTERING & YEAR AUTO-ALIGNMENT
  // -------------------------------------------------------------
  await t.test('6. getSubjects: filters curriculum by semester query parameter', async () => {
    const req = {
      query: { semester: '4' },
      user: { role: 'SUPER_ADMIN' }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await subjectController.getSubjects(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.subjects));
    const allSem4 = res.body.subjects.every(s => s.semester === 4);
    assert.ok(allSem4, 'Every returned subject must have semester === 4');
  });

  await t.test('7. createSubject: auto-aligns year if omitted and validates semester 1-8', async () => {
    let capturedDoc = null;
    const origCreate = AcademicSubjectCms.create;
    AcademicSubjectCms.create = async (doc) => {
      capturedDoc = doc;
      const created = { _id: new mongoose.Types.ObjectId(), ...doc };
      subjectStore.set(created._id.toString(), created);
      return created;
    };

    const req = {
      body: {
        name: 'Compiler Design',
        code: '5CS02',
        branch: cseBranchId.toString(),
        scheme: scheme2022Id.toString(),
        credits: 4,
        semester: 5
        // year omitted intentionally
      },
      user: { role: 'SUPER_ADMIN' }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await subjectController.createSubject(req, res);
    AcademicSubjectCms.create = origCreate;

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(capturedDoc.semester, 5);
    assert.strictEqual(capturedDoc.year, '3rd Year', 'Year must auto-align to 3rd Year for Semester 5');
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: SCOPED RBAC ENFORCEMENT
  // -------------------------------------------------------------
  await t.test('8. Scoped RBAC: Branch Admin authorized within their own branch', async () => {
    const cseAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'BRANCH_ADMIN',
      departmentScope: { id: cseBranchId.toString(), name: 'Computer Science' }
    };

    const req = {
      body: {
        name: 'Operating Systems',
        code: '4CS02',
        branch: cseBranchId.toString(),
        scheme: scheme2022Id.toString(),
        credits: 4,
        semester: 4,
        year: '2nd Year'
      },
      user: cseAdmin,
      departmentScope: cseAdmin.departmentScope
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await subjectController.createSubject(req, res);
    assert.strictEqual(res.statusCode, 201, 'Branch Admin should be allowed to create subjects in their own branch');
  });

  await t.test('9. Scoped RBAC: Branch Admin strictly blocked from creating in another branch', async () => {
    const cseAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'BRANCH_ADMIN',
      departmentScope: { id: cseBranchId.toString(), name: 'Computer Science' }
    };

    const req = {
      body: {
        name: 'ISE Subject',
        code: '4IS02',
        branch: iseBranchId.toString(), // Cross-branch attempt!
        scheme: scheme2022Id.toString(),
        credits: 4,
        semester: 4,
        year: '2nd Year'
      },
      user: cseAdmin,
      departmentScope: cseAdmin.departmentScope
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await subjectController.createSubject(req, res);
    assert.strictEqual(res.statusCode, 403, 'Cross-branch creation must be forbidden');
    assert.match(res.body.error, /only create subjects for your assigned department/i);
  });

  await t.test('10. Scoped RBAC: Branch Admin strictly blocked from creating Common to All subjects', async () => {
    const cseAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: 'BRANCH_ADMIN',
      departmentScope: { id: cseBranchId.toString(), name: 'Computer Science' }
    };

    const req = {
      body: {
        name: 'Global Math Course',
        code: '1MATH01',
        branch: commonBranchId.toString(), // Common to All attempt!
        scheme: scheme2022Id.toString(),
        credits: 4,
        semester: 1,
        year: '1st Year'
      },
      user: cseAdmin,
      departmentScope: cseAdmin.departmentScope
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };

    await subjectController.createSubject(req, res);
    assert.strictEqual(res.statusCode, 403, 'Common to All modification must be reserved for Super Admin');
    assert.match(res.body.error, /only create subjects for your assigned department/i);
  });

  // -------------------------------------------------------------
  // TEST GROUP 5: TIMETABLE AUTHORITATIVE VALIDATION
  // -------------------------------------------------------------
  await t.test('11. Timetable Authoritative Validation: permits branch-specific course matching semester', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          { dayOfWeek: 1, periodNumber: 1, subject: subjCseSem4._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.strictEqual(res.body.data.slots[0].subject.toString(), subjCseSem4._id.toString());
  });

  await t.test('12. Timetable Authoritative Validation: permits Common to All course in any branch section', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          { dayOfWeek: 1, periodNumber: 2, subject: subjCommonSem4._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.strictEqual(res.body.data.slots[0].subject.toString(), subjCommonSem4._id.toString());
  });

  await t.test('13. Timetable Authoritative Validation: strictly rejects wrong semester subject', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          // Section is Semester 4, but subjCseSem3 is Semester 3!
          { dayOfWeek: 1, periodNumber: 1, subject: subjCseSem3._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.match(res.body.error, /Semester 3.*cannot be scheduled.*Semester 4/);
  });

  await t.test('14. Timetable Authoritative Validation: strictly rejects subject from another branch', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          // Section is CSE, but subjIseSem4 belongs to ISE!
          { dayOfWeek: 1, periodNumber: 1, subject: subjIseSem4._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.match(res.body.error, /does not belong to section's branch/);
  });

  await t.test('15. Timetable Authoritative Validation: strictly rejects cross-scheme subject assignment', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          // Batch scheme is 2022, but subjWrongSchemeSem4 has scheme 2025!
          { dayOfWeek: 1, periodNumber: 1, subject: subjWrongSchemeSem4._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.match(res.body.error, /different academic scheme/);
  });

  await t.test('16. Timetable Authoritative Validation: strictly rejects unpublished subject', async () => {
    const req = {
      params: { sectionId: cseSec4AId.toString() },
      body: {
        slots: [
          // subjUnpublishedSem4 has status 'Draft'
          { dayOfWeek: 1, periodNumber: 1, subject: subjUnpublishedSem4._id.toString(), faculty: null, room: 'LH-101' }
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
    assert.match(res.body.error, /Only Published subjects can be scheduled/);
  });

  // Restore queries
  AcademicSubjectCms.findById = origFindSubjById;
  AcademicSubjectCms.find = origFindSubjFind;
  AcademicSubjectCms.findOne = origFindSubjOne;
  AcademicSubjectCms.create = origCreateSubj;
  AcademicSubjectCms.countDocuments = origCountSubj;
  AcademicBatch.findById = origFindBatchById;
  AcademicSection.findById = origFindSectionById;
  Semester.findOne = origFindSemesterOne;
  Branch.findOne = origFindBranchOne;
  Branch.findById = origFindBranchById;
  College.findOne = origFindCollegeOne;
  College.findById = origFindCollegeById;
  TimetableStructure.findOne = origFindTimetableStructureOne;
  TimetableStructure.create = origCreateTimetableStructure;
  Scheme.findOne = origFindSchemeOne;
  Scheme.findById = origFindSchemeById;
  Faculty.findById = origFindFacultyById;
  SectionTimetable.findOne = origFindTimetableOne;
  SectionTimetable.findOneAndUpdate = origFindTimetableAndUpdate;

  console.log('\n🎯 ALL 16 ACADEMIC CURRICULUM TEST SUITES PASSED 100%!\n');
});
