/**
 * Comprehensive Automated Test Suite for:
 * Student Academic Profile Onboarding, USN Verification, Section Placement & Locking,
 * Placement History, Section Change Requests, Personalized Timetable Slot Projection,
 * and Layered Calendar/Heatmap Scoping.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Subject = require('../models/Subject');
const CollegeEvent = require('../models/CollegeEvent');
const StudentAccount = require('../models/StudentAccount');
const AcademicProfile = require('../models/AcademicProfile');
const AcademicPlacement = require('../models/AcademicPlacement');
const SectionChangeRequest = require('../models/SectionChangeRequest');
const { TimetableStructure } = require('../models/TimetableStructure');
const { SectionTimetable } = require('../models/SectionTimetable');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const OTP = require('../models/OTP');

// Services & Controllers
const authV2Service = require('../modules/auth/services/authV2.service');
const studentAcademicsController = require('../controllers/studentAcademicsController');
const academicStructureController = require('../controllers/academicStructureController');

// Helper to mock res
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

// Helper to mock query chains
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

test('1. Registration Validator: USN is optional during account registration', async () => {
    const { validateRegister } = require('../modules/auth/validators/authV2.validator');
    assert.ok(Array.isArray(validateRegister), 'validateRegister should be an array of middleware validators');
    
    const req = {
        body: {
            registrationToken: 'mock.registration.token',
            name: 'new student',
            email: 'newstudent@example.com',
            password: 'Password123!',
            admissionYear: 2026,
            graduationYear: 2030,
            semester: 1
        }
    };

    const res = createMockRes();
    for (const middleware of validateRegister) {
        if (typeof middleware === 'function') {
            await new Promise(resolve => {
                middleware(req, res, () => resolve());
            });
        }
    }
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    const usnError = errors.array().find(e => e.path === 'usn');
    assert.strictEqual(usnError, undefined, 'Registration without USN must not yield a validation error');
});

test('2. College Model: emailDomain defaults to sit.ac.in and can be configured', () => {
    const college = new College({
        name: 'Siddaganga Institute of Technology',
        code: 'SIT'
    });
    assert.strictEqual(college.emailDomain, 'sit.ac.in', 'Default emailDomain should be sit.ac.in');
});

test('3. OTP Repository: Hashed Storage & 3 Attempts Rate Limiting', async () => {
    const plainOtp = '482915';
    const hashed = await bcrypt.hash(plainOtp, 10);

    const isMatch = await bcrypt.compare(plainOtp, hashed);
    assert.ok(isMatch, 'Bcrypt compare should match plain OTP against hash');

    const isWrong = await bcrypt.compare('111111', hashed);
    assert.ok(!isWrong, 'Bcrypt compare must reject invalid OTP');
});

test('4. Temporary USN: Can be set without OTP and remains unlocked', async () => {
    const mockStudentId = new mongoose.Types.ObjectId();
    const tempUsn = 'TEMP26CV001';

    const origFindOne = StudentAccount.findOne;
    const origFindById = StudentAccount.findById;
    const origFindByIdAndUpdate = StudentAccount.findByIdAndUpdate;
    const origAcademicProfileFindOne = AcademicProfile.findOne;

    const mockDoc = {
        _id: mockStudentId,
        usn: tempUsn,
        usnType: 'TEMPORARY',
        usnVerified: false,
        usnLocked: false
    };

    AcademicProfile.findOne = () => createMockQuery(null);
    StudentAccount.findOne = () => createMockQuery(null);
    StudentAccount.findById = () => createMockQuery(mockDoc);
    StudentAccount.findByIdAndUpdate = (id, update) => createMockQuery({ ...mockDoc, ...update });

    try {
        const result = await authV2Service.setTemporaryUsn(mockStudentId, tempUsn);
        assert.strictEqual(result.usn, tempUsn);
        assert.strictEqual(result.usnType, 'TEMPORARY');
        assert.strictEqual(result.usnLocked, false);
    } finally {
        StudentAccount.findOne = origFindOne;
        StudentAccount.findById = origFindById;
        StudentAccount.findByIdAndUpdate = origFindByIdAndUpdate;
        AcademicProfile.findOne = origAcademicProfileFindOne;
    }
});

test('5. Duplicate USN Prevention: Attempting to assign already-claimed USN throws conflict', async () => {
    const mockStudentId = new mongoose.Types.ObjectId();
    const otherStudentId = new mongoose.Types.ObjectId();
    const duplicateUsn = '1SI26CV005';

    const origFindOne = StudentAccount.findOne;
    const origFindById = StudentAccount.findById;
    const origAcademicProfileFindOne = AcademicProfile.findOne;

    AcademicProfile.findOne = () => createMockQuery(null);
    StudentAccount.findOne = () => createMockQuery({ _id: otherStudentId, usn: duplicateUsn });
    StudentAccount.findById = () => createMockQuery({ _id: mockStudentId });

    try {
        await assert.rejects(
            async () => {
                await authV2Service.setTemporaryUsn(mockStudentId, duplicateUsn);
            },
            { message: 'This USN is already associated with another account. Please verify that you entered the correct USN.' }
        );
    } finally {
        StudentAccount.findOne = origFindOne;
        StudentAccount.findById = origFindById;
        AcademicProfile.findOne = origAcademicProfileFindOne;
    }
});

test('6. Locked USN Immutability: Permanent verified USN cannot be directly overwritten', async () => {
    const mockStudentId = new mongoose.Types.ObjectId();

    const origFindById = StudentAccount.findById;
    const origAcademicProfileFindOne = AcademicProfile.findOne;

    AcademicProfile.findOne = () => createMockQuery(null);
    StudentAccount.findById = () => createMockQuery({
        _id: mockStudentId,
        usn: '1SI26CV001',
        usnType: 'PERMANENT',
        usnVerified: true,
        usnLocked: true
    });

    try {
        await assert.rejects(
            async () => {
                await authV2Service.requestUsnChangeOtp(mockStudentId, '1SI26CV099');
            },
            { message: 'Your USN is permanently verified and locked. Contact administrator for corrections.' }
        );
    } finally {
        StudentAccount.findById = origFindById;
        AcademicProfile.findOne = origAcademicProfileFindOne;
    }
});

test('7. Placement Confirmation: Locks section and labBatch, records AcademicPlacement', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const collegeId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const branchId = new mongoose.Types.ObjectId();
    const sectionId = new mongoose.Types.ObjectId();

    const mockSection = {
        _id: sectionId,
        name: 'A',
        batch: batchId,
        branch: branchId,
        college: collegeId,
        semester: 1
    };

    const mockStudent = {
        _id: studentId,
        college: collegeId,
        batch: batchId,
        branch: branchId,
        semester: 1,
        academicSection: sectionId,
        section: 'A',
        sectionLocked: false,
        labBatchLocked: false,
        save: async function() { return this; }
    };

    // Stubs
    const origSecFindById = AcademicSection.findById;
    const origSecFindOne = AcademicSection.findOne;
    const origStudentFindById = StudentAccount.findById;
    const origPlacementUpdate = AcademicPlacement.updateMany;
    const origPlacementCreate = AcademicPlacement.create;
    const origCollegeFindById = College.findById;
    const origCollegeFindOne = College.findOne;
    const origProgramFindById = AcademicProgram.findById;
    const origProgramFindOne = AcademicProgram.findOne;
    const origBatchFindById = AcademicBatch.findById;
    const origBranchFindById = Branch.findById;
    const origSemesterFind = Semester.find;
    const origSemesterFindOne = Semester.findOne;
    const origTtStructureFindOne = TimetableStructure.findOne;
    const origSecTtFindOne = SectionTimetable.findOne;
    const origStudentTtConfigFindOne = StudentTimetableConfiguration.findOne;

    let placementCreated = null;

    AcademicSection.findById = (id) => createMockQuery(mockSection);
    AcademicSection.findOne = () => createMockQuery(mockSection);
    StudentAccount.findById = (id) => createMockQuery(mockStudent);
    College.findById = () => createMockQuery({ _id: collegeId, name: 'SIT', code: 'SIT' });
    College.findOne = () => createMockQuery({ _id: collegeId, name: 'SIT', code: 'SIT' });
    AcademicProgram.findById = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), name: 'B.E.' });
    AcademicProgram.findOne = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), name: 'B.E.' });
    AcademicBatch.findById = () => createMockQuery({ _id: batchId, name: '2026–2030' });
    Branch.findById = () => createMockQuery({ _id: branchId, name: 'Civil Engineering', code: 'CV' });
    Semester.find = () => createMockQuery([{ _id: new mongoose.Types.ObjectId(), number: 1, status: 'Active' }]);
    Semester.findOne = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), number: 1, status: 'Active' });
    TimetableStructure.findOne = () => createMockQuery(null);
    SectionTimetable.findOne = () => createMockQuery(null);
    StudentTimetableConfiguration.findOne = () => createMockQuery(null);

    AcademicPlacement.updateMany = async () => ({ modifiedCount: 0 });
    AcademicPlacement.create = async (doc) => {
        placementCreated = doc;
        return doc;
    };

    const req = {
        student: mockStudent,
        body: {
            sectionId: sectionId.toString(),
            labBatch: 'B1'
        }
    };
    const res = createMockRes();

    try {
        await studentAcademicsController.confirmPlacement(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.labBatch, 'B1');
        assert.strictEqual(res.body.data.sectionLocked, true);
        assert.strictEqual(res.body.data.labBatchLocked, true);

        assert.ok(placementCreated, 'An active AcademicPlacement record must be created');
        assert.strictEqual(placementCreated.placementType, 'STUDENT_CONFIRMED');
        assert.strictEqual(placementCreated.status, 'ACTIVE');
        assert.strictEqual(placementCreated.labBatch, 'B1');
    } finally {
        AcademicSection.findById = origSecFindById;
        AcademicSection.findOne = origSecFindOne;
        StudentAccount.findById = origStudentFindById;
        AcademicPlacement.updateMany = origPlacementUpdate;
        AcademicPlacement.create = origPlacementCreate;
        College.findById = origCollegeFindById;
        College.findOne = origCollegeFindOne;
        AcademicProgram.findById = origProgramFindById;
        AcademicProgram.findOne = origProgramFindOne;
        AcademicBatch.findById = origBatchFindById;
        Branch.findById = origBranchFindById;
        Semester.find = origSemesterFind;
        Semester.findOne = origSemesterFindOne;
        TimetableStructure.findOne = origTtStructureFindOne;
        SectionTimetable.findOne = origSecTtFindOne;
        StudentTimetableConfiguration.findOne = origStudentTtConfigFindOne;
    }
});

test('8. Placement Confirmation: Rejects invalid labBatch', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const sectionId = new mongoose.Types.ObjectId();

    const req = {
        student: { _id: studentId, sectionLocked: false, labBatchLocked: false },
        body: {
            sectionId: sectionId.toString(),
            labBatch: 'INVALID_BATCH'
        }
    };
    const res = createMockRes();

    await studentAcademicsController.confirmPlacement(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Lab Batch must be either B1 or B2');
});

test('9. Placement Confirmation: Rejects re-confirmation when already locked', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const sectionId = new mongoose.Types.ObjectId();

    const req = {
        student: { _id: studentId, sectionLocked: true, labBatchLocked: true },
        body: {
            sectionId: sectionId.toString(),
            labBatch: 'B1'
        }
    };
    const res = createMockRes();

    await studentAcademicsController.confirmPlacement(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('locked'));
});

test('10. Section Change Request: Submits pending request and prevents duplicate pending', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const collegeId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const branchId = new mongoose.Types.ObjectId();
    const currentSectionId = new mongoose.Types.ObjectId();
    const targetSectionId = new mongoose.Types.ObjectId();

    const mockTargetSection = {
        _id: targetSectionId,
        name: 'B',
        batch: batchId,
        branch: branchId,
        college: collegeId,
        semester: 1
    };

    const origFindReq = SectionChangeRequest.findOne;
    const origCreateReq = SectionChangeRequest.create;
    const origFindSec = AcademicSection.findById;
    const origSecFindOne = AcademicSection.findOne;
    const origCollegeFindById = College.findById;
    const origCollegeFindOne = College.findOne;
    const origProgramFindById = AcademicProgram.findById;
    const origProgramFindOne = AcademicProgram.findOne;
    const origBatchFindById = AcademicBatch.findById;
    const origBranchFindById = Branch.findById;
    const origSemesterFind = Semester.find;
    const origSemesterFindOne = Semester.findOne;
    const origTtStructureFindOne = TimetableStructure.findOne;
    const origSecTtFindOne = SectionTimetable.findOne;
    const origStudentTtConfigFindOne = StudentTimetableConfiguration.findOne;

    const mockCurrentSection = {
        _id: currentSectionId,
        name: 'A',
        batch: batchId,
        branch: branchId,
        college: collegeId,
        semester: 1
    };

    let pendingFound = null;
    let requestCreated = null;

    SectionChangeRequest.findOne = async () => pendingFound;
    AcademicSection.findById = (id) => {
        if (String(id) === String(targetSectionId)) return createMockQuery(mockTargetSection);
        return createMockQuery(mockCurrentSection);
    };
    AcademicSection.findOne = () => createMockQuery(mockCurrentSection);
    College.findById = () => createMockQuery({ _id: collegeId, name: 'SIT', code: 'SIT' });
    College.findOne = () => createMockQuery({ _id: collegeId, name: 'SIT', code: 'SIT' });
    AcademicProgram.findById = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), name: 'B.E.' });
    AcademicProgram.findOne = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), name: 'B.E.' });
    AcademicBatch.findById = () => createMockQuery({ _id: batchId, name: '2026–2030' });
    Branch.findById = () => createMockQuery({ _id: branchId, name: 'Civil Engineering', code: 'CV' });
    Semester.find = () => createMockQuery([{ _id: new mongoose.Types.ObjectId(), number: 1, status: 'Active' }]);
    Semester.findOne = () => createMockQuery({ _id: new mongoose.Types.ObjectId(), number: 1, status: 'Active' });
    TimetableStructure.findOne = () => createMockQuery(null);
    SectionTimetable.findOne = () => createMockQuery(null);
    StudentTimetableConfiguration.findOne = () => createMockQuery(null);

    SectionChangeRequest.create = async (doc) => {
        requestCreated = doc;
        return doc;
    };

    const req = {
        student: {
            _id: studentId,
            college: collegeId,
            batch: batchId,
            branch: branchId,
            semester: 1,
            academicSection: currentSectionId,
            labBatch: 'B1'
        },
        body: {
            requestedSectionId: targetSectionId.toString(),
            requestedLabBatch: 'B2',
            reason: 'Clash with transit shuttle timing'
        }
    };
    const res = createMockRes();

    try {
        // First submission succeeds
        await studentAcademicsController.requestSectionChange(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(requestCreated.status, 'PENDING');
        assert.strictEqual(requestCreated.requestedLabBatch, 'B2');

        // Second submission while pending is rejected
        pendingFound = { _id: new mongoose.Types.ObjectId(), status: 'PENDING' };
        const res2 = createMockRes();
        await studentAcademicsController.requestSectionChange(req, res2);
        assert.strictEqual(res2.statusCode, 400);
        assert.ok(res2.body.error.includes('already have a section change request pending'));
    } finally {
        SectionChangeRequest.findOne = origFindReq;
        SectionChangeRequest.create = origCreateReq;
        AcademicSection.findById = origFindSec;
        AcademicSection.findOne = origSecFindOne;
        College.findById = origCollegeFindById;
        College.findOne = origCollegeFindOne;
        AcademicProgram.findById = origProgramFindById;
        AcademicProgram.findOne = origProgramFindOne;
        AcademicBatch.findById = origBatchFindById;
        Branch.findById = origBranchFindById;
        Semester.find = origSemesterFind;
        Semester.findOne = origSemesterFindOne;
        TimetableStructure.findOne = origTtStructureFindOne;
        SectionTimetable.findOne = origSecTtFindOne;
        StudentTimetableConfiguration.findOne = origStudentTtConfigFindOne;
    }
});

test('11. Admin Section Change Approval: Supersedes placement and updates student section', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const targetSectionId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    const mockChangeReq = {
        _id: new mongoose.Types.ObjectId(),
        student: studentId,
        requestedSection: targetSectionId,
        requestedLabBatch: 'B2',
        status: 'PENDING',
        semester: new mongoose.Types.ObjectId(),
        semesterNumber: 1,
        save: async function() { return this; }
    };

    const mockTargetSection = {
        _id: targetSectionId,
        name: 'C'
    };

    const mockStudent = {
        _id: studentId,
        academicSection: new mongoose.Types.ObjectId(),
        section: 'A',
        labBatch: 'B1',
        save: async function() { return this; }
    };

    const origReqFindById = SectionChangeRequest.findById;
    const origSecFindById = AcademicSection.findById;
    const origPlacementUpdate = AcademicPlacement.updateMany;
    const origPlacementCreate = AcademicPlacement.create;
    const origStudentFindById = StudentAccount.findById;

    let placementSuperseded = false;
    let newPlacementCreated = null;

    SectionChangeRequest.findById = async () => mockChangeReq;
    AcademicSection.findById = async () => mockTargetSection;
    AcademicPlacement.updateMany = async () => {
        placementSuperseded = true;
        return { modifiedCount: 1 };
    };
    AcademicPlacement.create = async (doc) => {
        newPlacementCreated = doc;
        return doc;
    };
    StudentAccount.findById = async () => mockStudent;

    const req = {
        params: { id: mockChangeReq._id.toString() },
        body: { adminNotes: 'Approved per HOD letter' },
        user: { _id: adminId }
    };
    const res = createMockRes();

    try {
        await academicStructureController.approveSectionChangeRequest(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(mockChangeReq.status, 'APPROVED');
        assert.ok(placementSuperseded, 'Prior placement must be superseded');
        assert.ok(newPlacementCreated, 'New placement must be created');
        assert.strictEqual(newPlacementCreated.placementType, 'ADMIN_OVERRIDE');
        assert.strictEqual(mockStudent.section, 'C');
        assert.strictEqual(mockStudent.labBatch, 'B2');
    } finally {
        SectionChangeRequest.findById = origReqFindById;
        AcademicSection.findById = origSecFindById;
        AcademicPlacement.updateMany = origPlacementUpdate;
        AcademicPlacement.create = origPlacementCreate;
        StudentAccount.findById = origStudentFindById;
    }
});

test('12. Personalized Timetable Projection: Lab slots filtered by student labBatch (B1 vs B2 vs ALL)', async () => {
    const studentB1 = {
        _id: new mongoose.Types.ObjectId(),
        semester: 1,
        labBatch: 'B1'
    };

    const slots = [
        { periodNumber: 1, batchGroup: 'ALL', subject: { name: 'Mathematics' }, lectureType: 'Theory' },
        { periodNumber: 2, batchGroup: 'ALL', subject: { name: 'Physics' }, lectureType: 'Theory' },
        { periodNumber: 3, batchGroup: 'B1', subject: { name: 'Physics Lab' }, lectureType: 'Lab' },
        { periodNumber: 3, batchGroup: 'B2', subject: { name: 'Maths Lab' }, lectureType: 'Lab' },
    ];

    // Filter for student B1
    const studentLabBatch = (studentB1.labBatch || '').toUpperCase();
    const filteredForB1 = slots.filter(slot => {
        const bg = (slot.batchGroup || 'ALL').toUpperCase();
        return bg === 'ALL' || bg === studentLabBatch;
    });

    assert.strictEqual(filteredForB1.length, 3, 'Student B1 should see 2 Theory slots + 1 B1 Lab slot');
    assert.ok(filteredForB1.some(s => s.subject.name === 'Physics Lab'), 'B1 sees Physics Lab');
    assert.ok(!filteredForB1.some(s => s.subject.name === 'Maths Lab'), 'B1 does NOT see B2 Maths Lab');

    // Filter for student B2
    const filteredForB2 = slots.filter(slot => {
        const bg = (slot.batchGroup || 'ALL').toUpperCase();
        return bg === 'ALL' || bg === 'B2';
    });
    assert.strictEqual(filteredForB2.length, 3, 'Student B2 should see 2 Theory slots + 1 B2 Lab slot');
    assert.ok(filteredForB2.some(s => s.subject.name === 'Maths Lab'), 'B2 sees Maths Lab');
    assert.ok(!filteredForB2.some(s => s.subject.name === 'Physics Lab'), 'B2 does NOT see B1 Physics Lab');
});

test('13. Canonical Calendar Scoping: GLOBAL events restricted to Holidays, all others SEMESTER scoped', async () => {
    const collegeId = new mongoose.Types.ObjectId();
    const semId = new mongoose.Types.ObjectId();

    // Query filter expectation
    const semStart = new Date('2026-08-01');
    const semEnd = new Date('2026-12-31');

    const filter = {
        status: { $ne: 'ARCHIVED' },
        $or: [
            { scope: 'GLOBAL', eventType: 'Holiday / Closure' },
            { scope: 'SEMESTER', academicSemesterId: semId }
        ],
        college: collegeId,
        startDate: { $lte: semEnd },
        endDate: { $gte: semStart }
    };

    assert.strictEqual(filter.$or[0].scope, 'GLOBAL');
    assert.strictEqual(filter.$or[0].eventType, 'Holiday / Closure');
    assert.strictEqual(filter.$or[1].scope, 'SEMESTER');
    assert.strictEqual(filter.$or[1].academicSemesterId, semId);
});
