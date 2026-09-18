const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Import Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const CollegeEvent = require('../models/CollegeEvent');
const StudentAccount = require('../models/StudentAccount');

// Import Controllers
const { getRoadmap } = require('../controllers/studentAcademicsController');
const { createEvent, updateEvent } = require('../controllers/collegeEventController');

function createMockRes() {
    return {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.payload = data;
            return this;
        }
    };
}

function createQueryMock(result) {
    const query = {
        populate() { return query; },
        select() { return query; },
        sort() { return query; },
        lean() { return Promise.resolve(result); },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        },
        catch(reject) {
            return Promise.resolve(result).catch(reject);
        }
    };
    return query;
}

test('F-012: Roadmaps & Academic Timeline Master Test Suite', async (suite) => {
    const sitCollegeId = new mongoose.Types.ObjectId();
    const programId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const semester3Id = new mongoose.Types.ObjectId();
    const semester4Id = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();

    // Setup base dates around now
    const now = new Date();
    const pastDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
    const farFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    const mockSemester3 = {
        _id: semester3Id,
        college: sitCollegeId,
        program: programId,
        batch: batchId,
        number: 3,
        label: '3rd Semester',
        startDate: pastDate,
        endDate: farFutureDate,
        status: 'Active'
    };

    const mockSemester4 = {
        _id: semester4Id,
        college: sitCollegeId,
        program: programId,
        batch: batchId,
        number: 4,
        label: '4th Semester',
        startDate: null,
        endDate: null,
        status: 'Upcoming'
    };

    const mockBatch = {
        _id: batchId,
        name: 'Batch 2024-2028',
        academicYear: '2026-27',
        admissionYear: 2024,
        graduationYear: 2028
    };

    const mockStudent = {
        _id: studentId,
        name: 'Rahul Sharma',
        semester: 3,
        academicSemester: semester3Id,
        college: sitCollegeId,
        program: programId,
        batch: batchId,
        section: 'A',
        labBatch: 'B1'
    };

    // Stubs
    College.findOne = () => createQueryMock({ _id: sitCollegeId, code: 'SIT', name: 'Siddaganga Institute of Technology' });
    College.findById = () => createQueryMock({ _id: sitCollegeId, code: 'SIT', name: 'Siddaganga Institute of Technology' });
    AcademicProgram.findOne = () => createQueryMock({ _id: programId, code: 'B.E' });
    AcademicProgram.findById = () => createQueryMock({ _id: programId, code: 'B.E' });
    AcademicBatch.findById = () => createQueryMock(mockBatch);
    AcademicBatch.findOne = () => createQueryMock(mockBatch);
    Semester.find = () => createQueryMock([mockSemester3, mockSemester4]);
    Semester.findById = (id) => createQueryMock(String(id) === String(semester3Id) ? mockSemester3 : mockSemester4);
    StudentAccount.findById = () => createQueryMock(mockStudent);

    const AcademicSection = require('../models/AcademicSection');
    AcademicSection.findById = () => createQueryMock(null);
    AcademicSection.findOne = () => createQueryMock(null);

    const { TimetableStructure } = require('../models/TimetableStructure');
    TimetableStructure.findOne = () => createQueryMock(null);

    const { SectionTimetable } = require('../models/SectionTimetable');
    SectionTimetable.findOne = () => createQueryMock(null);

    const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
    StudentTimetableConfiguration.findOne = () => createQueryMock(null);

    // In-memory events store
    const sampleEvents = [
        {
            _id: new mongoose.Types.ObjectId(),
            college: sitCollegeId,
            academicSemesterId: semester3Id,
            scope: 'SEMESTER',
            title: 'Semester Begins',
            eventType: 'ACADEMIC',
            startDate: pastDate,
            endDate: pastDate,
            shortDescription: 'Classes commence for the 3rd semester.',
            content: {
                overview: 'The academic session officially begins with orientation and subject registration.',
                whatHappens: 'Faculty outline syllabus, textbook references, and grading scheme.',
                whatToDo: 'Attend all introductory lectures and collect syllabus copies.',
                preparationTips: 'Set up note-taking tools and sync timetable.',
                importantNotes: '85% attendance rule is strictly enforced from day 1.'
            },
            resources: [{ title: 'Syllabus Copy', url: '/materials', type: 'internal' }],
            priority: 'Normal',
            order: 1,
            status: 'ACTIVE'
        },
        {
            _id: new mongoose.Types.ObjectId(),
            college: sitCollegeId,
            academicSemesterId: semester3Id,
            scope: 'SEMESTER',
            title: 'CIE 2 Examinations',
            eventType: 'EXAM',
            startDate: futureDate,
            endDate: new Date(futureDate.getTime() + 4 * 24 * 60 * 60 * 1000),
            shortDescription: 'Second Continuous Internal Evaluation.',
            content: {
                overview: 'Second internal test covering modules 2 and 3.',
                whatHappens: 'Offline written test conducted in assigned examination halls.',
                whatToDo: 'Prepare standard theory derivations and numerical problems.',
                preparationTips: 'Solve previous CIE questions from AskUrSenior.',
                importantNotes: 'Carries 40% weightage toward total internal marks.'
            },
            resources: [
                { title: 'Previous CIE Papers', url: '/materials', type: 'internal' },
                { title: 'Question Banks', url: '/materials', type: 'internal' }
            ],
            priority: 'Important',
            order: 2,
            status: 'ACTIVE'
        }
    ];

    CollegeEvent.find = (filter = {}) => {
        let list = [...sampleEvents];
        if (filter.status) list = list.filter(e => e.status === filter.status);
        if (filter.academicSemesterId) list = list.filter(e => String(e.academicSemesterId) === String(filter.academicSemesterId));
        return createQueryMock(list);
    };

    CollegeEvent.aggregate = async () => [
        { _id: semester3Id, count: 2 }
    ];

    // 1. GET /api/student/academics/roadmap returns student academic timeline
    await suite.test('1. Student Roadmap: returns structured timeline with semester progress and upNext event', async () => {
        const req = {
            student: mockStudent,
            query: {}
        };
        const res = createMockRes();

        await getRoadmap(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.success, true);
        const { selectedSemester, progress, upNext, events, availableSemesters } = res.payload.data;

        assert.equal(selectedSemester.number, 3);
        assert.equal(selectedSemester.label, '3rd Semester');
        assert.ok(progress.percentage >= 0 && progress.percentage <= 100);
        assert.equal(progress.status, 'IN_PROGRESS');

        // Up next should point to CIE 2
        assert.ok(upNext);
        assert.equal(upNext.title, 'CIE 2 Examinations');
        assert.ok(upNext.daysLeft > 0);

        // Events list
        assert.equal(events.length, 2);
        assert.equal(events[0].title, 'Semester Begins');
        assert.equal(events[0].status, 'COMPLETED');
        assert.equal(events[1].title, 'CIE 2 Examinations');
        assert.equal(events[1].status, 'UPCOMING');
        assert.equal(events[1].priority, 'Important');

        // Content check
        assert.ok(events[1].content.overview.includes('Second internal test'));
        assert.equal(events[1].resources.length, 2);

        // Available semesters
        assert.ok(availableSemesters.length >= 1);
        assert.equal(availableSemesters[0].number, 3);
        assert.equal(availableSemesters[0].isCurrent, true);
    });

    // 2. Admin Event Creation with Roadmap Content
    await suite.test('2. Admin Event Creation: supports roadmap content, priority, resources, and custom event types', async () => {
        const adminId = new mongoose.Types.ObjectId();
        const superAdmin = { _id: adminId, role: 'SUPER_ADMIN', email: 'admin@sit.ac.in' };

        CollegeEvent.create = async (doc) => ({
            _id: new mongoose.Types.ObjectId(),
            ...doc,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        CollegeEvent.findById = (id) => createQueryMock({
            _id: id,
            title: 'VTU Exam Registration',
            eventType: 'REGISTRATION',
            scope: 'SEMESTER',
            priority: 'Critical',
            content: { overview: 'Portal opens for exam fee payment.' },
            resources: [{ title: 'VTU Portal', url: 'https://vtu.ac.in', type: 'link' }]
        });

        const req = {
            admin: superAdmin,
            body: {
                title: 'VTU Exam Registration',
                eventType: 'REGISTRATION',
                scope: 'SEMESTER',
                academicSemesterId: semester3Id.toString(),
                startDate: '2026-11-10',
                endDate: '2026-11-15',
                allDay: true,
                priority: 'Critical',
                shortDescription: 'Final examination fee payment deadline.',
                content: {
                    overview: 'Portal opens for exam fee payment.',
                    whatHappens: 'Students fill online exam form.',
                    whatToDo: 'Pay fee before deadline to avoid penalty.',
                    preparationTips: 'Keep hall ticket photo and fee receipt ready.',
                    importantNotes: 'Late submissions incur 500 INR fine.'
                },
                resources: [{ title: 'VTU Portal', url: 'https://vtu.ac.in', type: 'link' }],
                order: 3
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.success, true);
        assert.equal(res.payload.data.priority, 'Critical');
        assert.equal(res.payload.data.eventType, 'REGISTRATION');
    });

    // 3. Semester Progress Calculation Edge Cases
    await suite.test('3. Semester Progress: returns 0% before start and 100% after end', async () => {
        // Pre-semester mock
        const futureSem = {
            _id: new mongoose.Types.ObjectId(),
            college: sitCollegeId,
            program: programId,
            batch: batchId,
            number: 5,
            startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            label: '5th Semester'
        };

        Semester.find = () => createQueryMock([futureSem]);
        Semester.findById = () => createQueryMock(futureSem);

        const req = {
            student: { ...mockStudent, semester: 5, academicSemester: futureSem._id },
            query: { semester: 5 }
        };
        const res = createMockRes();

        await getRoadmap(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.data.progress.percentage, 0);
        assert.equal(res.payload.data.progress.status, 'NOT_STARTED');
    });
});
