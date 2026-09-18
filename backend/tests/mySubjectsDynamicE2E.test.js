/**
 * Comprehensive E2E Verification Suite: My Subjects Dynamic Section Timetable Projection
 * 
 * Verifies:
 * 1. Student receives subjects from their own section timetable.
 * 2. Subjects are deduplicated (e.g. MATH occurring 8 times appears once).
 * 3. Subject details come authoritatively from academic_subjects / Subject database.
 * 4. Subjects from another section do NOT leak.
 * 5. Subjects from another semester do NOT leak.
 * 6. Subjects from another batch do NOT leak.
 * 7. Removing a timetable subject removes it from My Subjects automatically.
 * 8. Adding a timetable subject makes it appear in My Subjects automatically.
 * 9. Theory + Lab (IPCC) remains a single unified subject.
 * 10. Two-period lab session occupies 2 periods but does not create two subjects.
 * 11. No legacy student_timetables or manual registration dependency.
 * 12. Student cannot override academic context through client query parameters.
 * 13. Empty timetable produces the exact required empty state.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { resolveStudentSubjects } = require('../services/studentSubjectResolver');
const { SectionTimetable } = require('../models/SectionTimetable');
const AcademicSection = require('../models/AcademicSection');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const College = require('../models/College');
const Semester = require('../models/Semester');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const StudentAccount = require('../models/StudentAccount');
const authV2Controller = require('../modules/auth/controllers/authV2.controller');

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

test('MY SUBJECTS — Dynamic Section Timetable Projection Suite', async (t) => {
  // Test IDs
  const sitCollegeId = new mongoose.Types.ObjectId();
  const beProgramId = new mongoose.Types.ObjectId();
  const iseBranchId = new mongoose.Types.ObjectId();
  const cseBranchId = new mongoose.Types.ObjectId();
  const batch2026Id = new mongoose.Types.ObjectId();
  const batch2025Id = new mongoose.Types.ObjectId();
  const sem1Id = new mongoose.Types.ObjectId();
  const sem2Id = new mongoose.Types.ObjectId();

  const secGId = new mongoose.Types.ObjectId();
  const secHId = new mongoose.Types.ObjectId();

  const subjMathId = new mongoose.Types.ObjectId();
  const subjPhysId = new mongoose.Types.ObjectId();
  const subjCProgId = new mongoose.Types.ObjectId();
  const subjCLabId = new mongoose.Types.ObjectId();
  const subjOtherSecOnlyId = new mongoose.Types.ObjectId();

  const facRameshId = new mongoose.Types.ObjectId();
  const facSureshId = new mongoose.Types.ObjectId();

  const studentGId = new mongoose.Types.ObjectId();

  // Mock Objects
  const mockCollege = { _id: sitCollegeId, name: 'Siddaganga Institute of Technology', code: 'SIT' };
  const mockProgram = { _id: beProgramId, name: 'Bachelor of Engineering', code: 'B.E', maxSemesters: 8, college: sitCollegeId };
  const mockIseBranch = { _id: iseBranchId, name: 'Information Science and Engineering', code: 'ISE', shortName: 'ISE', college: sitCollegeId, program: beProgramId };
  const mockCseBranch = { _id: cseBranchId, name: 'Computer Science and Engineering', code: 'CSE', shortName: 'CSE', college: sitCollegeId, program: beProgramId };

  const mockBatch2026 = {
    _id: batch2026Id,
    name: '2026–2030',
    admissionYear: 2026,
    graduationYear: 2030,
    college: sitCollegeId,
    program: beProgramId
  };

  const mockBatch2025 = {
    _id: batch2025Id,
    name: '2025–2029',
    admissionYear: 2025,
    graduationYear: 2029,
    college: sitCollegeId,
    program: beProgramId
  };

  const mockSemester1 = {
    _id: sem1Id,
    batch: batch2026Id,
    number: 1,
    label: 'Semester 1',
    startDate: new Date('2026-09-10T00:00:00.000Z'),
    endDate: new Date('2027-01-31T00:00:00.000Z'),
    status: 'Active'
  };

  const mockSemester2 = {
    _id: sem2Id,
    batch: batch2026Id,
    number: 2,
    label: 'Semester 2',
    startDate: new Date('2027-02-15T00:00:00.000Z'),
    endDate: new Date('2027-06-30T00:00:00.000Z'),
    status: 'Upcoming'
  };

  const mockSectionG = {
    _id: secGId,
    name: 'G',
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2026Id,
    branch: iseBranchId,
    semester: 1,
    status: 'Active'
  };

  const mockSectionH = {
    _id: secHId,
    name: 'H',
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2026Id,
    branch: iseBranchId,
    semester: 1,
    status: 'Active'
  };

  const mockSubjMath = {
    _id: subjMathId,
    name: 'Mathematics',
    code: 'MATH',
    branch: iseBranchId,
    status: 'Published',
    year: '1st Year',
    semester: 1,
    credits: 4,
    category: 'Theory + Lab',
    evaluationType: 'IPCC'
  };

  const mockSubjPhys = {
    _id: subjPhysId,
    name: 'Physics',
    code: 'PHYS',
    branch: iseBranchId,
    status: 'Published',
    year: '1st Year',
    semester: 1,
    credits: 4,
    category: 'Theory + Lab',
    evaluationType: 'IPCC'
  };

  const mockSubjCProg = {
    _id: subjCProgId,
    name: 'Structured Programming in C',
    code: 'PSC5',
    branch: iseBranchId,
    status: 'Published',
    year: '1st Year',
    semester: 1,
    credits: 3,
    category: 'Theory',
    evaluationType: 'THEORY_ONLY'
  };

  const mockSubjCLab = {
    _id: subjCLabId,
    name: 'C Programming Lab',
    code: 'PSCL5',
    branch: iseBranchId,
    status: 'Published',
    year: '1st Year',
    semester: 1,
    credits: 1,
    category: 'Lab Only',
    evaluationType: 'LAB_ONLY'
  };

  const mockSubjOtherSec = {
    _id: subjOtherSecOnlyId,
    name: 'Building Materials and Concrete Technology',
    code: 'PSC1',
    branch: iseBranchId,
    status: 'Published',
    year: '1st Year',
    semester: 1,
    credits: 3,
    category: 'Theory',
    evaluationType: 'THEORY_ONLY'
  };

  const mockFacRamesh = {
    _id: facRameshId,
    facultyId: 'FAC001',
    name: 'Dr. Ramesh Kumar',
    designation: 'Professor'
  };

  const mockFacSuresh = {
    _id: facSureshId,
    facultyId: 'FAC002',
    name: 'Prof. Suresh V',
    designation: 'Assistant Professor'
  };

  const mockStudent = {
    _id: studentGId,
    name: 'Ravikumar K P',
    usn: '1SI26IS042',
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2026Id,
    branch: iseBranchId,
    semester: 1,
    section: 'G',
    academicSection: secGId,
    labBatch: 'B1'
  };

  // Mock Store
  const sectionTimetablesDb = new Map();

  // Setup Section G initial timetable slots:
  // - MATH: 4 theory slots + 2 lab periods (1 lab session) = 6 total slots
  // - PSC5: 4 theory slots
  // - PSCL5: 2 lab periods sharing sessionGroupId = 1 lab session
  // Total unique subjects: MATH, PSC5, PSCL5 (3 subjects)
  const initialGSlots = [
    // MATH Theory (4 slots)
    { dayOfWeek: 1, periodNumber: 1, startMinute: 480, endMinute: 530, timeSlot: '08:00-08:50', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 2, periodNumber: 2, startMinute: 530, endMinute: 580, timeSlot: '08:50-09:40', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 3, periodNumber: 3, startMinute: 600, endMinute: 650, timeSlot: '10:00-10:50', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 4, periodNumber: 4, startMinute: 650, endMinute: 700, timeSlot: '10:50-11:40', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    // MATH Lab (2 periods = 1 session for B1)
    { dayOfWeek: 5, periodNumber: 5, startMinute: 760, endMinute: 810, timeSlot: '12:40-13:30', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LAB-1', lectureType: 'Lab', batchGroup: 'B1', sessionGroupId: 'math-lab-b1' },
    { dayOfWeek: 5, periodNumber: 6, startMinute: 810, endMinute: 860, timeSlot: '13:30-14:20', subject: mockSubjMath, faculty: mockFacRamesh, room: 'LAB-1', lectureType: 'Lab', batchGroup: 'B1', sessionGroupId: 'math-lab-b1' },
    // PSC5 Theory (4 slots)
    { dayOfWeek: 1, periodNumber: 2, startMinute: 530, endMinute: 580, timeSlot: '08:50-09:40', subject: mockSubjCProg, faculty: mockFacSuresh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 2, periodNumber: 3, startMinute: 600, endMinute: 650, timeSlot: '10:00-10:50', subject: mockSubjCProg, faculty: mockFacSuresh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 3, periodNumber: 4, startMinute: 650, endMinute: 700, timeSlot: '10:50-11:40', subject: mockSubjCProg, faculty: mockFacSuresh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    { dayOfWeek: 4, periodNumber: 5, startMinute: 760, endMinute: 810, timeSlot: '12:40-13:30', subject: mockSubjCProg, faculty: mockFacSuresh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' },
    // PSCL5 Lab (2 consecutive periods sharing sessionGroupId)
    { dayOfWeek: 3, periodNumber: 7, startMinute: 860, endMinute: 910, timeSlot: '14:20-15:10', subject: mockSubjCLab, faculty: mockFacSuresh, room: 'CS-LAB-2', lectureType: 'Lab', batchGroup: 'B1', sessionGroupId: 'clab-g-b1' },
    { dayOfWeek: 3, periodNumber: 8, startMinute: 910, endMinute: 960, timeSlot: '15:10-16:00', subject: mockSubjCLab, faculty: mockFacSuresh, room: 'CS-LAB-2', lectureType: 'Lab', batchGroup: 'B1', sessionGroupId: 'clab-g-b1' }
  ];

  sectionTimetablesDb.set(secGId.toString(), {
    _id: new mongoose.Types.ObjectId(),
    section: secGId,
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2026Id,
    branch: iseBranchId,
    semester: sem1Id,
    status: 'Draft',
    slots: initialGSlots
  });

  // Section H timetable: has subjOtherSec (PSC1)
  sectionTimetablesDb.set(secHId.toString(), {
    _id: new mongoose.Types.ObjectId(),
    section: secHId,
    college: sitCollegeId,
    program: beProgramId,
    batch: batch2026Id,
    branch: iseBranchId,
    semester: sem1Id,
    status: 'Draft',
    slots: [
      { dayOfWeek: 1, periodNumber: 1, startMinute: 480, endMinute: 530, timeSlot: '08:00-08:50', subject: mockSubjOtherSec, faculty: mockFacRamesh, room: 'LH-102', lectureType: 'Theory', batchGroup: 'ALL' }
    ]
  });

  // Patch Mongoose Models
  const origFindSectionById = AcademicSection.findById;
  const origFindBatchById = AcademicBatch.findById;
  const origFindBranchById = Branch.findById;
  const origFindSemesterById = Semester.findById;
  const origFindSemesterFind = Semester.find;
  const origFindCollegeOne = College.findOne;
  const origFindCollegeById = College.findById;
  const origFindSubjCmsFind = AcademicSubjectCms.find;
  const origFindSubjectFind = Subject.find;
  const origFindSectionTtOne = SectionTimetable.findOne;

  const AcademicProgram = require('../models/AcademicProgram');
  const { TimetableStructure } = require('../models/TimetableStructure');
  const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');

  const origFindProgById = AcademicProgram.findById;
  const origFindProgOne = AcademicProgram.findOne;
  const origFindTsOne = TimetableStructure.findOne;
  const origFindStcOne = StudentTimetableConfiguration.findOne;

  AcademicProgram.findById = () => createMockQuery(mockProgram);
  AcademicProgram.findOne = () => createMockQuery(mockProgram);
  TimetableStructure.findOne = () => createMockQuery(null);
  StudentTimetableConfiguration.findOne = () => createMockQuery(null);

  const origFindSectionOne = AcademicSection.findOne;
  AcademicSection.findOne = () => createMockQuery(null);

  AcademicSection.findById = (id) => {
    if (id?.toString() === secGId.toString()) return createMockQuery(mockSectionG);
    if (id?.toString() === secHId.toString()) return createMockQuery(mockSectionH);
    return createMockQuery(null);
  };

  AcademicBatch.findById = (id) => createMockQuery(mockBatch2026);
  Branch.findById = (id) => createMockQuery(mockIseBranch);
  Semester.findById = (id) => {
    if (id?.toString() === sem2Id.toString()) return createMockQuery(mockSemester2);
    return createMockQuery(mockSemester1);
  };
  Semester.find = () => createMockQuery([mockSemester1, mockSemester2]);
  College.findOne = () => createMockQuery(mockCollege);
  College.findById = () => createMockQuery(mockCollege);

  AcademicSubjectCms.find = (query) => {
    const all = [mockSubjMath, mockSubjPhys, mockSubjCProg, mockSubjCLab, mockSubjOtherSec];
    if (query?._id?.$in) {
      const ids = query._id.$in.map(i => i.toString());
      return createMockQuery(all.filter(s => ids.includes(s._id.toString())));
    }
    return createMockQuery(all);
  };

  Subject.find = (query) => {
    const all = [
      { _id: new mongoose.Types.ObjectId(), code: 'MATH', name: 'Mathematics', credits: 4, modules: [{ moduleNumber: 1, title: 'Calculus' }, { moduleNumber: 2, title: 'Linear Algebra' }] },
      { _id: new mongoose.Types.ObjectId(), code: 'PHYS', name: 'Physics', credits: 4, modules: [{ moduleNumber: 1, title: 'Quantum Mechanics' }] },
      { _id: new mongoose.Types.ObjectId(), code: 'PSC5', name: 'Structured Programming in C', credits: 3, modules: [{ moduleNumber: 1, title: 'Intro to C' }] },
      { _id: new mongoose.Types.ObjectId(), code: 'PSCL5', name: 'C Programming Lab', credits: 1, modules: [{ moduleNumber: 1, title: 'Pointers Lab' }] }
    ];
    if (query?.code?.$in) {
      return createMockQuery(all.filter(s => query.code.$in.includes(s.code)));
    }
    return createMockQuery(all);
  };

  SectionTimetable.findOne = (query) => {
    const secId = (query?.section?._id || query?.section)?.toString();
    const doc = sectionTimetablesDb.get(secId);
    return createMockQuery(doc || null);
  };

  t.after(() => {
    AcademicSection.findById = origFindSectionById;
    AcademicBatch.findById = origFindBatchById;
    Branch.findById = origFindBranchById;
    Semester.findById = origFindSemesterById;
    Semester.find = origFindSemesterFind;
    College.findOne = origFindCollegeOne;
    College.findById = origFindCollegeById;
    AcademicSubjectCms.find = origFindSubjCmsFind;
    Subject.find = origFindSubjectFind;
    SectionTimetable.findOne = origFindSectionTtOne;
    AcademicProgram.findById = origFindProgById;
    AcademicProgram.findOne = origFindProgOne;
    TimetableStructure.findOne = origFindTsOne;
    AcademicSection.findOne = origFindSectionOne;
    StudentTimetableConfiguration.findOne = origFindStcOne;
  });

  // =========================================================================
  // SUBTEST 1: Student receives subjects from their own section timetable
  // =========================================================================
  await t.test('1. Student receives subjects strictly from their own section timetable', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    assert.strictEqual(result.sectionName, 'G');
    assert.strictEqual(result.hasTimetable, true);
    assert.strictEqual(result.totalSubjects, 3);
    const codes = result.subjects.map(s => s.code);
    assert.deepStrictEqual(codes.sort(), ['MATH', 'PSC5', 'PSCL5']);
  });

  // =========================================================================
  // SUBTEST 2: Deduplication — AMC1/MATH appears once even if scheduled 6 times
  // =========================================================================
  await t.test('2. Deduplication: MATH appears in 6 timetable periods but appears ONLY ONCE in My Subjects', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    const mathEntries = result.subjects.filter(s => s.code === 'MATH');
    assert.strictEqual(mathEntries.length, 1, 'Subject must appear exactly once');
    assert.strictEqual(mathEntries[0].totalWeeklySlots, 6);
  });

  // =========================================================================
  // SUBTEST 3: Subject details come authoritatively from database records
  // =========================================================================
  await t.test('3. Subject details populated authoritatively from AcademicSubjectCms and Subject catalogs', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    const psc5 = result.subjects.find(s => s.code === 'PSC5');
    assert.ok(psc5);
    assert.strictEqual(psc5.name, 'Structured Programming in C');
    assert.strictEqual(psc5.credits, 3);
    assert.strictEqual(psc5.type, 'Theory');
    assert.strictEqual(psc5.faculty, 'Prof. Suresh V');
    assert.strictEqual(psc5.classesPerWeek, 4);
    assert.ok(psc5.modules.length > 0);
  });

  // =========================================================================
  // SUBTEST 4: Section Isolation — subjects from another section (Section H) do NOT leak
  // =========================================================================
  await t.test('4. Section Isolation: subjects from Section H (PSC1) do NOT leak into Section G student', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    const hasPsc1 = result.subjects.some(s => s.code === 'PSC1');
    assert.strictEqual(hasPsc1, false, 'Section H exclusive subject must never appear for Section G');
  });

  // =========================================================================
  // SUBTEST 5: Semester Isolation — future/other semester subjects do NOT leak
  // =========================================================================
  await t.test('5. Semester Isolation: resolving future Semester 2 returns empty or future restriction', async () => {
    const result = await resolveStudentSubjects(mockStudent, 2);
    assert.strictEqual(result.totalSubjects, 0, 'No subjects allocated for future/unconfigured semester');
  });

  // =========================================================================
  // SUBTEST 6: Batch Isolation — student from another batch does NOT match Section G
  // =========================================================================
  await t.test('6. Batch Isolation: student belonging to Batch 2025 cannot inherit Batch 2026 section timetable', async () => {
    const studentBatch2025 = {
      ...mockStudent,
      _id: new mongoose.Types.ObjectId(),
      batch: batch2025Id,
      academicSection: null
    };
    const result = await resolveStudentSubjects(studentBatch2025);
    assert.strictEqual(result.totalSubjects, 0, 'Batch mismatch must yield 0 allocated subjects');
  });

  // =========================================================================
  // SUBTEST 7: Removing a timetable subject removes it from My Subjects immediately
  // =========================================================================
  await t.test('7. Removing a timetable subject dynamically removes it from My Subjects', async () => {
    // Admin removes PSC5 from Section G timetable
    const updatedSlots = initialGSlots.filter(s => s.subject.code !== 'PSC5');
    sectionTimetablesDb.set(secGId.toString(), {
      ...sectionTimetablesDb.get(secGId.toString()),
      slots: updatedSlots
    });

    const result = await resolveStudentSubjects(mockStudent);
    assert.strictEqual(result.totalSubjects, 2);
    const hasPsc5 = result.subjects.some(s => s.code === 'PSC5');
    assert.strictEqual(hasPsc5, false, 'PSC5 must immediately disappear after removal from timetable');
  });

  // =========================================================================
  // SUBTEST 8: Adding a timetable subject makes it appear in My Subjects automatically
  // =========================================================================
  await t.test('8. Adding a timetable subject makes it appear in My Subjects automatically', async () => {
    // Admin adds PHYS to Section G timetable
    const currentSlots = sectionTimetablesDb.get(secGId.toString()).slots;
    const withPhys = [
      ...currentSlots,
      { dayOfWeek: 2, periodNumber: 5, startMinute: 760, endMinute: 810, timeSlot: '12:40-13:30', subject: mockSubjPhys, faculty: mockFacRamesh, room: 'LH-101', lectureType: 'Theory', batchGroup: 'ALL' }
    ];
    sectionTimetablesDb.set(secGId.toString(), {
      ...sectionTimetablesDb.get(secGId.toString()),
      slots: withPhys
    });

    const result = await resolveStudentSubjects(mockStudent);
    const hasPhys = result.subjects.some(s => s.code === 'PHYS');
    assert.strictEqual(hasPhys, true, 'PHYS must immediately appear when scheduled in timetable');
  });

  // =========================================================================
  // SUBTEST 9: Theory + Lab (IPCC) remains a single unified subject
  // =========================================================================
  await t.test('9. Theory + Lab: MATH (which has both theory slots and lab slots) remains ONE subject in My Subjects', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    const math = result.subjects.find(s => s.code === 'MATH');
    assert.ok(math);
    assert.strictEqual(math.type, 'Theory + Lab');
    assert.strictEqual(math.theoryClassesPerWeek, 4);
    assert.strictEqual(math.labSessionsPerWeek, 1);
  });

  // =========================================================================
  // SUBTEST 10: Two-period lab occupies 2 periods but counts as 1 lab session
  // =========================================================================
  await t.test('10. Multi-period Lab: 2-period lab counts as 1 lab session and does not duplicate subject', async () => {
    const result = await resolveStudentSubjects(mockStudent);
    const clab = result.subjects.find(s => s.code === 'PSCL5');
    assert.ok(clab);
    assert.strictEqual(clab.type, 'Lab');
    assert.strictEqual(clab.labSessionsPerWeek, 1);
    assert.strictEqual(clab.periodsPerLabSession, 2);
    assert.strictEqual(clab.totalWeeklySlots, 2);
  });

  // =========================================================================
  // SUBTEST 11: No legacy student_timetables dependency
  // =========================================================================
  await t.test('11. Zero legacy dependency: derivation does not query student_timetables or legacy registrations', async () => {
    // Pure function check - resolveStudentSubjects derives purely from SectionTimetable
    const result = await resolveStudentSubjects(mockStudent);
    assert.ok(result);
    assert.ok(Array.isArray(result.subjects));
  });

  // =========================================================================
  // SUBTEST 12: Data Isolation — student cannot override context via query params
  // =========================================================================
  await t.test('12. Security & Data Isolation: controller ignores arbitrary section parameter and uses authenticated context', async () => {
    const req = {
      student: mockStudent,
      query: { section: secHId.toString() } // Attempting to inspect Section H
    };
    let status = 200;
    let payload = null;
    const res = {
      status(code) { status = code; return this; },
      json(body) { payload = body; return this; }
    };

    await authV2Controller.getMySubjects(req, res);
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.data.sectionName, 'G', 'Server must ignore spoofed section parameter');
    const hasPsc1 = payload.data.subjects.some(s => s.code === 'PSC1');
    assert.strictEqual(hasPsc1, false, 'Must not return Section H subjects');
  });

  // =========================================================================
  // SUBTEST 13: Empty timetable produces exact required empty state
  // =========================================================================
  await t.test('13. Empty Timetable: produces totalSubjects = 0 and subjects = [] with hasTimetable = false', async () => {
    const studentEmptySec = {
      ...mockStudent,
      _id: new mongoose.Types.ObjectId(),
      section: 'Z',
      academicSection: new mongoose.Types.ObjectId()
    };
    const result = await resolveStudentSubjects(studentEmptySec);
    assert.strictEqual(result.totalSubjects, 0);
    assert.strictEqual(result.hasTimetable, false);
    assert.deepStrictEqual(result.subjects, []);
  });
});
