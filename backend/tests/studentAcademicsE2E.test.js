/**
 * End-to-End QA Suite for Student Academics Experience
 * 
 * Foundational Rule:
 * Admin panel is the authoritative source of truth.
 * Student Academics is a consumer and read-only projection of that data,
 * with limited personal settings (e.g. My Target Attendance).
 * 
 * 25-Point Comprehensive Verification Suite:
 * 1.  Identity Resolution: Student -> College -> Program -> Batch -> Branch -> Section
 * 2.  Fallback: Default to SIT College when unassigned
 * 3.  Fallback: Default to B.E. Program when unassigned
 * 4.  Batch Resolution: Matched by admission/graduation year or semester calculation
 * 5.  Semester Visibility: Strict filter (number <= student.semester)
 * 6.  Future Semester Masking: Semester > student.semester strictly omitted from semesters list
 * 7.  Semester Detail (Past): GET /semesters/:number succeeds for completed terms
 * 8.  Semester Detail (Current): GET /semesters/:number succeeds for active term
 * 9.  Future Semester Forbidden: GET /semesters/:number for future semester returns HTTP 403
 * 10. Available Sections Scoped: Returns active sections belonging only to student's batch and branch
 * 11. Cross-Branch Section IDOR Prevention: Selecting section from another branch returns HTTP 403
 * 12. Cross-Batch Section IDOR Prevention: Selecting section from another batch returns HTTP 403
 * 13. Valid Section Update: Successfully updates student section within verified batch and branch
 * 14. Timetable Projection: GET /timetable returns published section timetable and timetable structure
 * 15. Future Semester Timetable Blocked: GET /timetable?semester=X (future) returns HTTP 403
 * 16. Historical Semester Timetable Allowed: GET /timetable?semester=X (past) returns historical timetable
 * 17. Authoritative Curriculum Retrieval: GET /subjects returns official curriculum for semester/branch
 * 18. Future Semester Subjects Blocked: GET /subjects?semester=X (future) returns HTTP 403
 * 19. Subject Registration: Successfully registers student into valid curriculum subjects
 * 20. Subject Registration Validation: Attempting to register non-existent subjects is rejected
 * 21. Academic Settings Endpoint: GET /settings separates Admin Baseline from Personal Settings
 * 22. Admin Baseline Immutability: Institutional minimum attendance (85%) is locked and immutable
 * 23. Personal Target Attendance Modifiable: PUT /settings updates personal target without altering college min
 * 24. Personal Target Boundary Validation: Target < 1 or > 100 returns HTTP 400
 * 25. Academic Calendar / Holidays Retrieval: GET /calendar returns institutional items for student scope
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Service & Controller
const { resolveStudentAcademicContext } = require('../services/studentAcademicResolver');
const studentAcademicsController = require('../controllers/studentAcademicsController');

// Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const AcademicSubjectCms = require('../models/AcademicSubject');
const CollegeEvent = require('../models/CollegeEvent');
const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const { TimetableStructure } = require('../models/TimetableStructure');
const { SectionTimetable } = require('../models/SectionTimetable');
const StudentAccount = require('../models/StudentAccount');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');

function createMockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

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

test('STUDENT ACADEMICS REDESIGN — 25-Point Comprehensive E2E Verification Suite', async (t) => {

    // Common fixtures
    const sitCollegeId = new mongoose.Types.ObjectId();
    const beProgramId = new mongoose.Types.ObjectId();
    const cseBranchId = new mongoose.Types.ObjectId();
    const eceBranchId = new mongoose.Types.ObjectId();
    const batch2026Id = new mongoose.Types.ObjectId();
    const batch2025Id = new mongoose.Types.ObjectId();

    const sem1Id = new mongoose.Types.ObjectId();
    const sem2Id = new mongoose.Types.ObjectId();
    const sem3Id = new mongoose.Types.ObjectId();
    const sem4Id = new mongoose.Types.ObjectId(); // Current for student
    const sem5Id = new mongoose.Types.ObjectId(); // Future
    const sem6Id = new mongoose.Types.ObjectId(); // Future

    const cseSecAId = new mongoose.Types.ObjectId();
    const cseSecBId = new mongoose.Types.ObjectId();
    const eceSecAId = new mongoose.Types.ObjectId(); // Cross branch section
    const otherBatchSecId = new mongoose.Types.ObjectId(); // Cross batch section

    const subDsaId = new mongoose.Types.ObjectId();
    const subOsId = new mongoose.Types.ObjectId();
    const subDbmsId = new mongoose.Types.ObjectId();

    const studentId = new mongoose.Types.ObjectId();

    const mockCollege = {
        _id: sitCollegeId,
        name: 'Siddaganga Institute of Technology',
        code: 'SIT'
    };

    const mockProgram = {
        _id: beProgramId,
        college: sitCollegeId,
        name: 'Bachelor of Engineering',
        code: 'B.E'
    };

    const mockCseBranch = {
        _id: cseBranchId,
        college: sitCollegeId,
        program: beProgramId,
        name: 'Computer Science & Engineering',
        code: 'CSE'
    };

    const mockEceBranch = {
        _id: eceBranchId,
        college: sitCollegeId,
        program: beProgramId,
        name: 'Electronics & Communication',
        code: 'ECE'
    };

    const mockBatch = {
        _id: batch2026Id,
        college: sitCollegeId,
        program: beProgramId,
        name: '2022-2026',
        admissionYear: 2022,
        graduationYear: 2026
    };

    const allOfficialSemesters = [
        { _id: sem1Id, batch: batch2026Id, number: 1, name: 'Semester 1', type: 'ODD', status: 'COMPLETED', startDate: new Date('2022-09-01'), endDate: new Date('2023-01-15') },
        { _id: sem2Id, batch: batch2026Id, number: 2, name: 'Semester 2', type: 'EVEN', status: 'COMPLETED', startDate: new Date('2023-02-01'), endDate: new Date('2023-06-15') },
        { _id: sem3Id, batch: batch2026Id, number: 3, name: 'Semester 3', type: 'ODD', status: 'COMPLETED', startDate: new Date('2023-09-01'), endDate: new Date('2024-01-15') },
        { _id: sem4Id, batch: batch2026Id, number: 4, name: 'Semester 4', type: 'EVEN', status: 'ACTIVE', startDate: new Date('2024-02-01'), endDate: new Date('2024-06-30') },
        { _id: sem5Id, batch: batch2026Id, number: 5, name: 'Semester 5', type: 'ODD', status: 'UPCOMING', startDate: new Date('2024-09-01'), endDate: new Date('2025-01-15') },
        { _id: sem6Id, batch: batch2026Id, number: 6, name: 'Semester 6', type: 'EVEN', status: 'UPCOMING', startDate: new Date('2025-02-01'), endDate: new Date('2025-06-15') },
    ];

    const mockCseSectionA = {
        _id: cseSecAId,
        college: sitCollegeId,
        program: beProgramId,
        batch: batch2026Id,
        branch: cseBranchId,
        semester: 4,
        name: 'A',
        capacity: 60,
        isActive: true
    };

    const mockCseSectionB = {
        _id: cseSecBId,
        college: sitCollegeId,
        program: beProgramId,
        batch: batch2026Id,
        branch: cseBranchId,
        semester: 4,
        name: 'B',
        capacity: 60,
        isActive: true
    };

    const mockEceSectionA = {
        _id: eceSecAId,
        college: sitCollegeId,
        program: beProgramId,
        batch: batch2026Id,
        branch: eceBranchId,
        semester: 4,
        name: 'A',
        capacity: 60,
        isActive: true
    };

    const mockOtherBatchSection = {
        _id: otherBatchSecId,
        college: sitCollegeId,
        program: beProgramId,
        batch: batch2025Id,
        branch: cseBranchId,
        semester: 4,
        name: 'A',
        capacity: 60,
        isActive: true
    };

    const mockStudent = {
        _id: studentId,
        name: 'Test Student',
        usn: '1SI22CS001',
        college: sitCollegeId,
        program: beProgramId,
        branch: cseBranchId,
        batch: batch2026Id,
        semester: 4,
        academicSection: cseSecAId,
        admissionYear: 2022,
        graduationYear: 2026
    };

    const mockTimetableStructure = {
        college: sitCollegeId,
        periodsPerDay: 8,
        classDuration: 50,
        labDuration: 100,
        collegeStartMinute: 480, // 08:00 AM
        collegeEndMinute: 1020, // 05:00 PM
        workingDays: [1, 2, 3, 4, 5, 6],
        breaks: [
            { name: 'Tea Break', startMinute: 660, endMinute: 675 },
            { name: 'Lunch Break', startMinute: 780, endMinute: 825 }
        ],
        isActive: true
    };

    const mockSectionTimetable = {
        section: cseSecAId,
        status: 'Published',
        academicYear: '2023-2024',
        termType: 'EVEN',
        slots: [
            { dayOfWeek: 1, periodSlot: 1, startMinute: 480, endMinute: 530, subject: { _id: subDsaId, name: 'Data Structures', code: '22CS41' }, room: 'LH-101', faculty: { name: 'Prof. Kumar' }, lectureType: 'Lecture' },
            { dayOfWeek: 1, periodSlot: 2, startMinute: 530, endMinute: 580, subject: { _id: subOsId, name: 'Operating Systems', code: '22CS42' }, room: 'LH-101', faculty: { name: 'Dr. Sharma' }, lectureType: 'Lecture' }
        ]
    };

    const mockCurriculum = [
        { _id: subDsaId, name: 'Data Structures', code: '22CS41', credits: 4, category: 'Theory', branch: cseBranchId, semester: 4, status: 'Published' },
        { _id: subOsId, name: 'Operating Systems', code: '22CS42', credits: 4, category: 'Theory', branch: cseBranchId, semester: 4, status: 'Published' },
        { _id: subDbmsId, name: 'Database Management', code: '22CS43', credits: 3, category: 'Theory', branch: cseBranchId, semester: 4, status: 'Published' }
    ];

    // Mock DB layer
    const origCollegeFindById = College.findById;
    const origCollegeFindOne = College.findOne;
    const origProgramFindById = AcademicProgram.findById;
    const origProgramFindOne = AcademicProgram.findOne;
    const origBranchFindById = Branch.findById;
    const origBranchFindOne = Branch.findOne;
    const origBatchFindById = AcademicBatch.findById;
    const origBatchFindOne = AcademicBatch.findOne;
    const origBatchFind = AcademicBatch.find;
    const origSemesterFind = Semester.find;
    const origSemesterFindOne = Semester.findOne;
    const origSectionFindById = AcademicSection.findById;
    const origSectionFindOne = AcademicSection.findOne;
    const origSectionFind = AcademicSection.find;
    const origStructureFindOne = TimetableStructure.findOne;
    const origSectionTimetableFindOne = SectionTimetable.findOne;
    const origSubjectFind = AcademicSubjectCms.find;
    const origCalendarFind = AcademicCalendarItem.find;
    const origStudentUpdate = StudentAccount.findByIdAndUpdate;
    const origConfigFindOne = StudentTimetableConfiguration.findOne;
    const origConfigFindOneAndUpdate = StudentTimetableConfiguration.findOneAndUpdate;
    const origRegSubFind = StudentRegisteredSubject.find;
    const origRegSubDeleteMany = StudentRegisteredSubject.deleteMany;
    const origRegSubInsertMany = StudentRegisteredSubject.insertMany;

    t.before(() => {
        College.findById = (id) => createMockQuery(mockCollege);
        College.findOne = () => createMockQuery(mockCollege);

        AcademicProgram.findById = (id) => createMockQuery(mockProgram);
        AcademicProgram.findOne = () => createMockQuery(mockProgram);

        Branch.findById = (id) => {
            if (String(id) === String(cseBranchId)) return createMockQuery(mockCseBranch);
            if (String(id) === String(eceBranchId)) return createMockQuery(mockEceBranch);
            return createMockQuery(null);
        };
        Branch.findOne = () => createMockQuery(null);

        AcademicBatch.findById = (id) => createMockQuery(mockBatch);
        AcademicBatch.findOne = () => createMockQuery(mockBatch);
        AcademicBatch.find = () => createMockQuery([mockBatch]);

        Semester.find = (filter) => {
            if (filter && filter.batch) {
                // Filter official semesters for batch
                let result = allOfficialSemesters.filter(s => String(s.batch) === String(filter.batch));
                if (filter.number && filter.number.$lte) {
                    result = result.filter(s => s.number <= filter.number.$lte);
                }
                return createMockQuery(result);
            }
            return createMockQuery([]);
        };

        Semester.findOne = (filter) => {
            const match = allOfficialSemesters.find(s => 
                String(s.batch) === String(filter.batch) && Number(s.number) === Number(filter.number)
            );
            return createMockQuery(match || null);
        };

        AcademicSection.findById = (id) => {
            if (String(id) === String(cseSecAId)) return createMockQuery(mockCseSectionA);
            if (String(id) === String(cseSecBId)) return createMockQuery(mockCseSectionB);
            if (String(id) === String(eceSecAId)) return createMockQuery(mockEceSectionA);
            if (String(id) === String(otherBatchSecId)) return createMockQuery(mockOtherBatchSection);
            return createMockQuery(null);
        };

        AcademicSection.findOne = (filter) => {
            if (filter && filter._id) {
                return AcademicSection.findById(filter._id);
            }
            return createMockQuery(mockCseSectionA);
        };

        AcademicSection.find = (filter) => {
            const allSecs = [mockCseSectionA, mockCseSectionB, mockEceSectionA, mockOtherBatchSection];
            let result = allSecs;
            if (filter.batch) {
                result = result.filter(s => String(s.batch) === String(filter.batch));
            }
            if (filter.branch) {
                result = result.filter(s => String(s.branch) === String(filter.branch));
            }
            if (filter.isActive !== undefined) {
                result = result.filter(s => s.isActive === filter.isActive);
            }
            return createMockQuery(result);
        };

        TimetableStructure.findOne = () => createMockQuery(mockTimetableStructure);

        SectionTimetable.findOne = (filter) => {
            if (filter && String(filter.section) === String(cseSecAId)) {
                return createMockQuery(mockSectionTimetable);
            }
            return createMockQuery(null);
        };

        AcademicSubjectCms.find = () => createMockQuery(mockCurriculum);

        CollegeEvent.find = () => createMockQuery([
            { title: 'Mid-term Exams', eventType: 'Exam', startDate: new Date('2024-04-10'), endDate: new Date('2024-04-15') },
            { title: 'Ugadi Holiday', eventType: 'Holiday / Closure', startDate: new Date('2024-04-09'), endDate: new Date('2024-04-09') }
        ]);

        AcademicCalendarItem.find = () => createMockQuery([
            { title: 'Mid-term Exams', type: 'EXAM', startDate: new Date('2024-04-10'), endDate: new Date('2024-04-15') },
            { title: 'Ugadi Holiday', type: 'HOLIDAY', startDate: new Date('2024-04-09'), endDate: new Date('2024-04-09') }
        ]);

        StudentTimetableConfiguration.findOne = () => createMockQuery({
            student: studentId,
            semester: 4,
            personalAttendanceTarget: 90,
            attendanceThreshold: 85,
            save: async () => true
        });

        StudentTimetableConfiguration.findOneAndUpdate = async (filter, update) => {
            return {
                student: studentId,
                semester: filter.semester || 4,
                ...update,
                save: async () => true
            };
        };

        StudentRegisteredSubject.find = () => createMockQuery([
            { student: studentId, subject: mockCurriculum[0], registeredCredits: 4 },
            { student: studentId, subject: mockCurriculum[1], registeredCredits: 4 }
        ]);

        StudentRegisteredSubject.deleteMany = async () => ({ acknowledged: true, deletedCount: 2 });
        StudentRegisteredSubject.insertMany = async (docs) => docs;

        StudentAccount.findByIdAndUpdate = async (id, update) => {
            return { ...mockStudent, ...update };
        };
    });

    t.after(() => {
        College.findById = origCollegeFindById;
        College.findOne = origCollegeFindOne;
        AcademicProgram.findById = origProgramFindById;
        AcademicProgram.findOne = origProgramFindOne;
        Branch.findById = origBranchFindById;
        Branch.findOne = origBranchFindOne;
        AcademicBatch.findById = origBatchFindById;
        AcademicBatch.findOne = origBatchFindOne;
        AcademicBatch.find = origBatchFind;
        Semester.find = origSemesterFind;
        Semester.findOne = origSemesterFindOne;
        AcademicSection.findById = origSectionFindById;
        AcademicSection.findOne = origSectionFindOne;
        AcademicSection.find = origSectionFind;
        TimetableStructure.findOne = origStructureFindOne;
        SectionTimetable.findOne = origSectionTimetableFindOne;
        AcademicSubjectCms.find = origSubjectFind;
        AcademicCalendarItem.find = origCalendarFind;
        StudentAccount.findByIdAndUpdate = origStudentUpdate;
        StudentTimetableConfiguration.findOne = origConfigFindOne;
        StudentTimetableConfiguration.findOneAndUpdate = origConfigFindOneAndUpdate;
        StudentRegisteredSubject.find = origRegSubFind;
        StudentRegisteredSubject.deleteMany = origRegSubDeleteMany;
        StudentRegisteredSubject.insertMany = origRegSubInsertMany;
    });

    // ── 1. Academic Identity Resolution ───────────────────────
    await t.test('1. Resolves full academic identity authoritatively from DB records', async () => {
        const context = await resolveStudentAcademicContext(mockStudent);
        assert.ok(context, 'Context resolved');
        assert.equal(String(context.college._id), String(sitCollegeId));
        assert.equal(String(context.program._id), String(beProgramId));
        assert.equal(String(context.branch._id), String(cseBranchId));
        assert.equal(String(context.batch._id), String(batch2026Id));
        assert.equal(context.currentSemester, 4);
        assert.equal(context.sectionName, 'A');
    });

    // ── 2. Fallback to SIT College ────────────────────────────
    await t.test('2. Authoritatively falls back to SIT College if student record has null college', async () => {
        const studentWithoutCollege = { ...mockStudent, college: null };
        const context = await resolveStudentAcademicContext(studentWithoutCollege);
        assert.equal(context.college.code, 'SIT');
    });

    // ── 3. Fallback to B.E. Program ───────────────────────────
    await t.test('3. Authoritatively falls back to B.E. Program if student record has null program', async () => {
        const studentWithoutProgram = { ...mockStudent, program: null };
        const context = await resolveStudentAcademicContext(studentWithoutProgram);
        assert.equal(context.program.code, 'B.E');
    });

    // ── 4. Batch Resolution ───────────────────────────────────
    await t.test('4. Successfully resolves batch from admission and graduation years', async () => {
        const studentWithoutBatch = { ...mockStudent, batch: null, admissionYear: 2022, graduationYear: 2026 };
        const context = await resolveStudentAcademicContext(studentWithoutBatch);
        assert.ok(context.batch, 'Batch resolved');
        assert.equal(context.batch.name, '2022-2026');
    });

    // ── 5. Strict Semester Visibility ─────────────────────────
    await t.test('5. Visible semesters strictly limited to number <= student.semester (1, 2, 3, 4)', async () => {
        const context = await resolveStudentAcademicContext(mockStudent);
        assert.ok(Array.isArray(context.visibleSemesters));
        assert.equal(context.visibleSemesters.length, 4);
        const semNumbers = context.visibleSemesters.map(s => s.number);
        assert.deepEqual(semNumbers, [1, 2, 3, 4]);
    });

    // ── 6. Future Semester Masking ────────────────────────────
    await t.test('6. Future semesters (5, 6, 7, 8) are strictly masked and never returned', async () => {
        const req = { student: mockStudent };
        const res = createMockRes();
        await studentAcademicsController.getSemesters(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        const semesters = res.body.data;
        assert.equal(semesters.length, 4);
        assert.ok(!semesters.some(s => s.number > 4), 'No future semesters present');
    });

    // ── 7. Semester Detail (Past Semester) ────────────────────
    await t.test('7. GET /semesters/:semesterNumber succeeds for past semester (Semester 2)', async () => {
        const req = { student: mockStudent, params: { semesterNumber: 2 } };
        const res = createMockRes();
        await studentAcademicsController.getSemesterDetail(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.number, 2);
        assert.equal(res.body.data.isHistorical, true);
    });

    // ── 8. Semester Detail (Current Semester) ─────────────────
    await t.test('8. GET /semesters/:semesterNumber succeeds for current active semester (Semester 4)', async () => {
        const req = { student: mockStudent, params: { semesterNumber: 4 } };
        const res = createMockRes();
        await studentAcademicsController.getSemesterDetail(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.number, 4);
        assert.equal(res.body.data.isCurrent, true);
        assert.equal(res.body.data.isHistorical, false);
    });

    // ── 9. Future Semester Access Blocked ─────────────────────
    await t.test('9. GET /semesters/:semesterNumber returns HTTP 403 when requesting future Semester 5', async () => {
        const req = { student: mockStudent, params: { semesterNumber: 5 } };
        const res = createMockRes();
        await studentAcademicsController.getSemesterDetail(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.ok(res.body.error.includes('future'));
    });

    // ── 10. Available Sections Scoped ─────────────────────────
    await t.test('10. GET /sections returns only sections within student verified batch and branch', async () => {
        const req = { student: mockStudent };
        const res = createMockRes();
        await studentAcademicsController.getAvailableSections(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        const sections = res.body.data.sections;
        assert.equal(sections.length, 2); // CSE Sec A and Sec B
        assert.ok(sections.every(s => String(s.id) === String(cseSecAId) || String(s.id) === String(cseSecBId)));
    });

    // ── 11. Cross-Branch Section IDOR Prevention ──────────────
    await t.test('11. PUT /section returns HTTP 403 when selecting section from another branch (ECE Sec A)', async () => {
        const req = { student: mockStudent, body: { sectionId: eceSecAId } };
        const res = createMockRes();
        await studentAcademicsController.updateSection(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.ok(res.body.error.includes('branch'));
    });

    // ── 12. Cross-Batch Section IDOR Prevention ───────────────
    await t.test('12. PUT /section returns HTTP 403 when selecting section from another batch', async () => {
        const req = { student: mockStudent, body: { sectionId: otherBatchSecId } };
        const res = createMockRes();
        await studentAcademicsController.updateSection(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.ok(res.body.error.includes('batch'));
    });

    // ── 13. Valid Section Update ──────────────────────────────
    await t.test('13. PUT /section successfully updates student section within verified batch and branch (CSE Sec B)', async () => {
        const req = { student: mockStudent, body: { sectionId: cseSecBId } };
        const res = createMockRes();
        await studentAcademicsController.updateSection(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.sectionName, 'B');
    });

    // ── 14. Timetable Projection ──────────────────────────────
    await t.test('14. GET /timetable returns published section slots and institutional structure', async () => {
        const req = { student: mockStudent, query: {} };
        const res = createMockRes();
        await studentAcademicsController.getTimetable(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.sectionName, 'A');
        assert.equal(res.body.data.slots.length, 2);
        assert.equal(res.body.data.timetableStructure.classDuration, 50);
        assert.equal(res.body.data.timetableStructure.workingDays.length, 6);
    });

    // ── 15. Future Semester Timetable Blocked ─────────────────
    await t.test('15. GET /timetable?semester=6 returns HTTP 403 for future semester request', async () => {
        const req = { student: mockStudent, query: { semester: 6 } };
        const res = createMockRes();
        await studentAcademicsController.getTimetable(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.ok(res.body.error.includes('future'));
    });

    // ── 16. Historical Semester Timetable Allowed ─────────────
    await t.test('16. GET /timetable?semester=3 succeeds for historical completed semester', async () => {
        const req = { student: mockStudent, query: { semester: 3 } };
        const res = createMockRes();
        await studentAcademicsController.getTimetable(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.semester, 3);
        assert.equal(res.body.data.isHistorical, true);
    });

    // ── 17. Authoritative Curriculum Retrieval ────────────────
    await t.test('17. GET /subjects returns official curriculum and student registered subjects', async () => {
        const req = { student: mockStudent, query: {} };
        const res = createMockRes();
        await studentAcademicsController.getSubjects(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.curriculumSubjects.length, 3);
        assert.equal(res.body.data.registeredSubjects.length, 2);
    });

    // ── 18. Future Semester Subjects Blocked ──────────────────
    await t.test('18. GET /subjects?semester=5 returns HTTP 403 for future semester', async () => {
        const req = { student: mockStudent, query: { semester: 5 } };
        const res = createMockRes();
        await studentAcademicsController.getSubjects(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.ok(res.body.error.includes('future'));
    });

    // ── 19. Subject Registration ──────────────────────────────
    await t.test('19. PUT /registered-subjects successfully registers curriculum subjects', async () => {
        const req = {
            student: mockStudent,
            body: {
                semester: 4,
                subjectIds: [String(subDsaId), String(subOsId), String(subDbmsId)]
            }
        };
        const res = createMockRes();
        await studentAcademicsController.saveRegisteredSubjects(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.registeredCount, 3);
    });

    // ── 20. Subject Registration Validation ───────────────────
    await t.test('20. PUT /registered-subjects rejects registration for future semester with HTTP 403', async () => {
        const req = {
            student: mockStudent,
            body: {
                semester: 6,
                subjectIds: [String(subDsaId)]
            }
        };
        const res = createMockRes();
        await studentAcademicsController.saveRegisteredSubjects(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
    });

    // ── 21. Academic Settings Endpoint ────────────────────────
    await t.test('21. GET /settings exposes Admin Baseline (Read-Only) and Personal Settings (Editable)', async () => {
        const req = { student: mockStudent };
        const res = createMockRes();
        await studentAcademicsController.getSettings(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        const { adminBaseline, personalSettings } = res.body.data;
        assert.ok(adminBaseline, 'Admin baseline present');
        assert.equal(adminBaseline.collegeAttendanceThreshold, 85);
        assert.equal(adminBaseline.classDuration, 50);
        assert.ok(personalSettings, 'Personal settings present');
        assert.equal(personalSettings.personalAttendanceTarget, 90);
    });

    // ── 22. Admin Baseline Immutability ───────────────────────
    await t.test('22. PUT /settings does not allow student to modify college minimum attendance threshold', async () => {
        const req = {
            student: mockStudent,
            body: {
                personalAttendanceTarget: 95,
                collegeAttendanceThreshold: 75 // Malicious attempt to lower college threshold
            }
        };
        const res = createMockRes();
        await studentAcademicsController.updatePersonalSettings(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.personalAttendanceTarget, 95);
        assert.equal(res.body.data.collegeMinimumAttendance, 85, 'College minimum must remain 85%');
    });

    // ── 23. Personal Target Attendance Modifiable ─────────────
    await t.test('23. PUT /settings successfully updates personal target attendance (92%)', async () => {
        const req = {
            student: mockStudent,
            body: {
                personalAttendanceTarget: 92
            }
        };
        const res = createMockRes();
        await studentAcademicsController.updatePersonalSettings(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.personalAttendanceTarget, 92);
    });

    // ── 24. Personal Target Boundary Validation ───────────────
    await t.test('24. PUT /settings rejects invalid personal targets (<1 or >100) with HTTP 400', async () => {
        const reqLow = { student: mockStudent, body: { personalAttendanceTarget: 0 } };
        const resLow = createMockRes();
        await studentAcademicsController.updatePersonalSettings(reqLow, resLow);
        assert.equal(resLow.statusCode, 400);

        const reqHigh = { student: mockStudent, body: { personalAttendanceTarget: 105 } };
        const resHigh = createMockRes();
        await studentAcademicsController.updatePersonalSettings(reqHigh, resHigh);
        assert.equal(resHigh.statusCode, 400);
    });

    // ── 25. Academic Calendar / Holidays Retrieval ────────────
    await t.test('25. GET /calendar returns institutional items for college and student branch', async () => {
        const req = { student: mockStudent, query: {} };
        const res = createMockRes();
        await studentAcademicsController.getCalendar(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.length, 2);
        assert.equal(res.body.data[0].title, 'Mid-term Exams');
        assert.equal(res.body.data[1].title, 'Ugadi Holiday');
    });

    // ── 26. Unpublished Timetable Handling ────────────────────
    await t.test('26. GET /timetable returns hasPublishedTimetable: false when no timetable published for student section', async () => {
        const studentSecB = { ...mockStudent, section: 'B', academicSection: cseSecBId };
        const req = { student: studentSecB, query: {} };
        const res = createMockRes();
        await studentAcademicsController.getTimetable(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.equal(res.body.data.hasPublishedTimetable, false);
        assert.ok(res.body.data.message.includes('No timetable has been published yet'));
        assert.equal(res.body.data.slots.length, 0);
    });

    // ── 27. Strict Section Timetable Isolation ────────────────
    await t.test('27. Student in Section B never sees Section A slots (Strict Isolation)', async () => {
        const studentSecB = { ...mockStudent, section: 'B', academicSection: cseSecBId };
        const context = await resolveStudentAcademicContext(studentSecB, 4);

        assert.equal(context.sectionName, 'B');
        assert.equal(context.hasPublishedTimetable, false);
        assert.equal(context.sectionTimetable, null, 'Must NOT fallback to Section A timetable');
    });

    // ── 28. Future Semester Masking & 403 Rejection ───────────
    await t.test('28. Future semester (Upcoming status) is hidden from selector and returns HTTP 403 on direct access', async () => {
        const context = await resolveStudentAcademicContext(mockStudent);
        const visibleNums = context.visibleSemesters.map(s => s.number);
        assert.ok(!visibleNums.includes(5), 'Semester 5 must be hidden');
        assert.ok(!visibleNums.includes(6), 'Semester 6 must be hidden');

        const req = { student: mockStudent, params: { semesterNumber: 5 } };
        const res = createMockRes();
        await studentAcademicsController.getSemesterDetail(req, res);
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
    });

    // ── 29. Historical Semester Authority & Unconfigured Safety ─
    await t.test('29. Completed/Past semesters are visible, unconfigured semesters are never exposed', async () => {
        const context = await resolveStudentAcademicContext(mockStudent);
        const pastSems = context.visibleSemesters.filter(s => s.isPast || s.status === 'Past');
        assert.equal(pastSems.length, 3, 'Semesters 1, 2, 3 must be visible as historical');

        // Requesting Semester 9 (not configured for batch) returns HTTP 404 / 403
        const reqUnconfigured = { student: mockStudent, params: { semesterNumber: 9 } };
        const resUnconfigured = createMockRes();
        await studentAcademicsController.getSemesterDetail(reqUnconfigured, resUnconfigured);
        assert.ok(resUnconfigured.statusCode === 404 || resUnconfigured.statusCode === 403);
    });

    // ── 30. Ambiguous Batch Handling ──────────────────────────
    await t.test('30. Resolver never silently picks a batch if multiple cohorts match admission year', async () => {
        const origBatchFind = AcademicBatch.find;
        AcademicBatch.find = () => createMockQuery([
            { _id: batch2026Id, name: '2022-2026 (Shift 1)' },
            { _id: new mongoose.Types.ObjectId(), name: '2022-2026 (Shift 2)' }
        ]);

        const studentWithoutBatchRef = {
            ...mockStudent,
            batch: null,
            admissionYear: 2022,
            graduationYear: 2026
        };

        const context = await resolveStudentAcademicContext(studentWithoutBatchRef);
        assert.equal(context.batchAmbiguous, true, 'Must flag batchAmbiguous');
        assert.equal(context.batch, null, 'Must NOT silently choose one batch');

        AcademicBatch.find = origBatchFind;
    });
});
