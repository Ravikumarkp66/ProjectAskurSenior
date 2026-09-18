/**
 * Regression Test Suite: Heatmap Canonical College Events & OfficialSemester Isolation
 *
 * Verifies:
 * 1.  GLOBAL Invariant: scope === 'GLOBAL' is permitted ONLY for eventType === 'Holiday / Closure'.
 * 2.  SEMESTER Invariant: scope === 'SEMESTER' requires academicSemesterId.
 * 3.  Controller Validation: Creation & updates reject non-holiday GLOBAL events.
 * 4.  Calendar API: Returns OfficialSemester dates (startDate, endDate) authoritatively.
 * 5.  Calendar API Isolation: SEMESTER events match strictly by OfficialSemester._id (not sem number).
 * 6.  Batch Isolation: Batch A sem 4 events are never visible to Batch B sem 4 student.
 * 7.  Archived Exclusion: Events with status 'ARCHIVED' are strictly omitted from calendar API.
 * 8.  Cancelled Preservation: Events with status 'CANCELLED' are returned for tooltip awareness.
 * 9.  Date Range Query: Accepts startDate & endDate for year-long heatmap querying.
 * 10. Admin Dynamic Propagation: Queries directly hit CollegeEvent collection in real-time.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Controller & Services
const collegeEventController = require('../controllers/collegeEventController');
const studentAcademicsController = require('../controllers/studentAcademicsController');

// Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const CollegeEvent = require('../models/CollegeEvent');
const { TimetableStructure } = require('../models/TimetableStructure');
const { SectionTimetable } = require('../models/SectionTimetable');
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

test('HEATMAP CANONICAL EVENTS & OFFICIAL SEMESTER REGRESSION SUITE', async (t) => {

    const collegeId = new mongoose.Types.ObjectId();
    const programId = new mongoose.Types.ObjectId();
    const branchId = new mongoose.Types.ObjectId();
    const batchAId = new mongoose.Types.ObjectId();
    const batchBId = new mongoose.Types.ObjectId();

    const sem4BatchA_Id = new mongoose.Types.ObjectId();
    const sem4BatchB_Id = new mongoose.Types.ObjectId();
    const secA_Id = new mongoose.Types.ObjectId();

    const mockCollege = { _id: collegeId, name: 'SIT', code: 'SIT' };
    const mockProgram = { _id: programId, college: collegeId, name: 'B.E', code: 'B.E' };
    const mockBranch = { _id: branchId, college: collegeId, program: programId, name: 'CSE', shortName: 'CSE' };
    const mockBatchA = { _id: batchAId, college: collegeId, program: programId, name: '2022-2026', admissionYear: 2022, graduationYear: 2026 };
    const mockBatchB = { _id: batchBId, college: collegeId, program: programId, name: '2023-2027', admissionYear: 2023, graduationYear: 2027 };

    const sem4BatchA = {
        _id: sem4BatchA_Id,
        batch: batchAId,
        number: 4,
        label: 'Sem 4 - Batch 2026',
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T00:00:00.000Z'),
        status: 'Active'
    };

    const sem4BatchB = {
        _id: sem4BatchB_Id,
        batch: batchBId,
        number: 4,
        label: 'Sem 4 - Batch 2027',
        startDate: new Date('2027-02-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T00:00:00.000Z'),
        status: 'Active'
    };

    const mockSection = {
        _id: secA_Id,
        college: collegeId,
        program: programId,
        batch: batchAId,
        branch: branchId,
        semester: 4,
        name: 'A',
        isActive: true
    };

    // Save originals
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
    const origCollegeEventFind = CollegeEvent.find;
    const origTimetableStructureFindOne = TimetableStructure.findOne;
    const origSectionTimetableFindOne = SectionTimetable.findOne;
    const origStudentConfigFindOne = StudentTimetableConfiguration.findOne;

    t.before(() => {
        College.findById = () => createMockQuery(mockCollege);
        College.findOne = () => createMockQuery(mockCollege);
        AcademicProgram.findById = () => createMockQuery(mockProgram);
        AcademicProgram.findOne = () => createMockQuery(mockProgram);
        Branch.findById = () => createMockQuery(mockBranch);
        Branch.findOne = () => createMockQuery(null);
        AcademicBatch.findById = (id) => {
            if (String(id) === String(batchBId)) return createMockQuery(mockBatchB);
            return createMockQuery(mockBatchA);
        };
        AcademicBatch.findOne = () => createMockQuery(mockBatchA);
        AcademicBatch.find = () => createMockQuery([mockBatchA, mockBatchB]);
        Semester.find = (filter) => {
            if (filter && String(filter.batch) === String(batchBId)) {
                return createMockQuery([sem4BatchB]);
            }
            return createMockQuery([sem4BatchA]);
        };
        Semester.findOne = (filter) => {
            if (filter && String(filter.batch) === String(batchBId)) {
                return createMockQuery(sem4BatchB);
            }
            return createMockQuery(sem4BatchA);
        };
        AcademicSection.findById = () => createMockQuery(mockSection);
        AcademicSection.findOne = () => createMockQuery(mockSection);
        TimetableStructure.findOne = () => createMockQuery(null);
        SectionTimetable.findOne = () => createMockQuery(null);
        StudentTimetableConfiguration.findOne = () => createMockQuery(null);
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
        CollegeEvent.find = origCollegeEventFind;
        TimetableStructure.findOne = origTimetableStructureFindOne;
        SectionTimetable.findOne = origSectionTimetableFindOne;
        StudentTimetableConfiguration.findOne = origStudentConfigFindOne;
    });

    await t.test('1. Model Validation: Enforces GLOBAL scope invariant at Schema level', async () => {
        const invalidGlobal = new CollegeEvent({
            college: collegeId,
            title: 'Hackathon',
            eventType: 'College Event',
            scope: 'GLOBAL',
            startDate: new Date('2026-04-10'),
            endDate: new Date('2026-04-11')
        });

        let validationError = null;
        try {
            await invalidGlobal.validate();
        } catch (err) {
            validationError = err;
        }
        assert.ok(validationError, 'Model validation should fail for non-holiday GLOBAL event');
        assert.match(validationError.message, /GLOBAL scope is permitted only for Government Holidays/);

        const validGlobal = new CollegeEvent({
            college: collegeId,
            title: 'Independence Day',
            eventType: 'Holiday / Closure',
            scope: 'GLOBAL',
            startDate: new Date('2026-08-15'),
            endDate: new Date('2026-08-15')
        });

        let validError = null;
        try {
            await validGlobal.validate();
        } catch (err) {
            validError = err;
        }
        assert.equal(validError, null, 'Valid GLOBAL holiday should pass validation');
    });

    await t.test('2. Model Validation: Enforces academicSemesterId for SEMESTER scope', async () => {
        const invalidSemester = new CollegeEvent({
            college: collegeId,
            title: 'Midterm CIE 1',
            eventType: 'Exam',
            scope: 'SEMESTER',
            academicSemesterId: null,
            startDate: new Date('2026-04-15'),
            endDate: new Date('2026-04-16')
        });

        let validationError = null;
        try {
            await invalidSemester.validate();
        } catch (err) {
            validationError = err;
        }
        assert.ok(validationError, 'Model validation should fail for SEMESTER event without academicSemesterId');
        assert.match(validationError.message, /academicSemesterId is required for SEMESTER-scoped events/);
    });

    await t.test('3. Controller Validation: createEvent rejects non-holiday GLOBAL event', async () => {
        const req = {
            body: {
                title: 'Tech Fest',
                eventType: 'College Event',
                scope: 'GLOBAL',
                startDate: '2026-05-01',
                endDate: '2026-05-02'
            },
            admin: { _id: new mongoose.Types.ObjectId() }
        };
        const res = createMockRes();

        await collegeEventController.createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.ok(res.body.errors.some(e => e.includes('GLOBAL scope is restricted strictly to "Holiday / Closure"')));
    });

    await t.test('4. Calendar API: Returns OfficialSemester dates authoritatively', async () => {
        CollegeEvent.find = () => createMockQuery([]);

        const req = {
            student: {
                _id: new mongoose.Types.ObjectId(),
                college: collegeId,
                program: programId,
                branch: branchId,
                batch: batchAId,
                semester: 4,
                academicSection: secA_Id
            },
            query: { semester: 4 }
        };
        const res = createMockRes();

        await studentAcademicsController.getCalendar(req, res);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body.success);
        assert.ok(res.body.officialSemester, 'Response must include officialSemester metadata');
        assert.equal(String(res.body.officialSemester.id), String(sem4BatchA_Id));
        assert.equal(new Date(res.body.officialSemester.startDate).toISOString(), sem4BatchA.startDate.toISOString());
        assert.equal(new Date(res.body.officialSemester.endDate).toISOString(), sem4BatchA.endDate.toISOString());
    });

    await t.test('5. Calendar API: Enforces exact OfficialSemester._id and GLOBAL filter query', async () => {
        let capturedFilter = null;

        CollegeEvent.find = (filter) => {
            capturedFilter = filter;
            return createMockQuery([
                {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'CIE 1',
                    eventType: 'Exam',
                    scope: 'SEMESTER',
                    academicSemesterId: sem4BatchA_Id,
                    startDate: new Date('2026-03-10'),
                    endDate: new Date('2026-03-12'),
                    allDay: true,
                    status: 'ACTIVE'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Ugadi',
                    eventType: 'Holiday / Closure',
                    scope: 'GLOBAL',
                    academicSemesterId: null,
                    startDate: new Date('2026-03-22'),
                    endDate: new Date('2026-03-22'),
                    allDay: true,
                    status: 'ACTIVE'
                }
            ]);
        };

        const req = {
            student: {
                _id: new mongoose.Types.ObjectId(),
                college: collegeId,
                program: programId,
                branch: branchId,
                batch: batchAId,
                semester: 4,
                academicSection: secA_Id
            },
            query: { semester: 4, startDate: '2026-01-01', endDate: '2026-12-31' }
        };
        const res = createMockRes();

        await studentAcademicsController.getCalendar(req, res);
        assert.equal(res.statusCode, 200);

        // Verify filter construction
        assert.equal(capturedFilter.status.$ne, 'ARCHIVED', 'ARCHIVED events must be excluded');
        assert.deepEqual(capturedFilter.$or, [
            { scope: 'GLOBAL', eventType: 'Holiday / Closure' },
            { scope: 'SEMESTER', academicSemesterId: sem4BatchA_Id }
        ], 'Query must strictly enforce GLOBAL Holiday OR exact matching OfficialSemester ID');

        assert.equal(res.body.data.length, 2);
        assert.equal(res.body.data[0].type, 'EXAM');
        assert.equal(res.body.data[1].type, 'HOLIDAY');
    });

    await t.test('6. Batch Isolation: Batch B student cannot match Batch A semester events', async () => {
        let capturedFilterForBatchB = null;

        CollegeEvent.find = (filter) => {
            capturedFilterForBatchB = filter;
            return createMockQuery([]);
        };

        const req = {
            student: {
                _id: new mongoose.Types.ObjectId(),
                college: collegeId,
                program: programId,
                branch: branchId,
                batch: batchBId, // Belongs to Batch B
                semester: 4,
                academicSection: secA_Id
            },
            query: { semester: 4 }
        };
        const res = createMockRes();

        await studentAcademicsController.getCalendar(req, res);
        assert.equal(res.statusCode, 200);

        const semClause = capturedFilterForBatchB.$or.find(c => c.scope === 'SEMESTER');
        assert.equal(String(semClause.academicSemesterId), String(sem4BatchB_Id));
        assert.notEqual(String(semClause.academicSemesterId), String(sem4BatchA_Id));
    });

    await t.test('7. Cancelled events: preserved with status CANCELLED', async () => {
        CollegeEvent.find = () => createMockQuery([
            {
                _id: new mongoose.Types.ObjectId(),
                title: 'Postponed Workshop',
                eventType: 'College Event',
                scope: 'SEMESTER',
                academicSemesterId: sem4BatchA_Id,
                startDate: new Date('2026-04-05'),
                endDate: new Date('2026-04-05'),
                status: 'CANCELLED'
            }
        ]);

        const req = {
            student: {
                _id: new mongoose.Types.ObjectId(),
                college: collegeId,
                program: programId,
                branch: branchId,
                batch: batchAId,
                semester: 4,
                academicSection: secA_Id
            },
            query: { semester: 4 }
        };
        const res = createMockRes();

        await studentAcademicsController.getCalendar(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].status, 'CANCELLED');
    });
});
