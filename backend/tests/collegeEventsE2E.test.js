const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Import Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const CollegeEvent = require('../models/CollegeEvent');

// Import Controller
const {
    listEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/collegeEventController');

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

test('PHASE B — STEP 5: Official College Events Suite', async (suite) => {
    const sitCollegeId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const validSemesterId = new mongoose.Types.ObjectId();
    const nonExistentSemesterId = new mongoose.Types.ObjectId();

    const mockSemester = {
        _id: validSemesterId,
        college: sitCollegeId,
        batch: batchId,
        number: 1,
        label: 'Semester 1',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        status: 'Active'
    };

    // Stubs
    Semester.findById = (id) => createQueryMock(String(id) === String(validSemesterId) ? mockSemester : null);
    College.findOne = () => createQueryMock({ _id: sitCollegeId, code: 'SIT', name: 'Siddaganga Institute of Technology' });
    College.findById = (id) => createQueryMock({ _id: id, code: 'SIT', name: 'Siddaganga Institute of Technology' });

    const superAdmin = {
        _id: new mongoose.Types.ObjectId(),
        role: 'SUPER_ADMIN',
        email: 'superadmin@sit.ac.in',
        permissions: { events: { create: true, update: true, delete: true } }
    };

    // In-memory store for events in this test
    const eventsStore = new Map();

    CollegeEvent.create = async (doc) => {
        const id = new mongoose.Types.ObjectId();
        const created = {
            _id: id,
            ...doc,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        eventsStore.set(String(id), created);
        return created;
    };

    CollegeEvent.find = (filter = {}) => {
        let results = Array.from(eventsStore.values());
        if (filter.scope) {
            results = results.filter(e => e.scope === filter.scope);
        }
        if (filter.eventType) {
            results = results.filter(e => e.eventType === filter.eventType);
        }
        if (filter.status) {
            results = results.filter(e => e.status === filter.status);
        }
        if (filter.academicSemesterId) {
            results = results.filter(e => String(e.academicSemesterId) === String(filter.academicSemesterId));
        }
        if (filter.title && filter.title.$regex) {
            const re = new RegExp(filter.title.$regex, filter.title.$options || '');
            results = results.filter(e => re.test(e.title));
        }
        return createQueryMock(results);
    };

    CollegeEvent.findById = (id) => {
        const item = eventsStore.get(String(id));
        if (!item) return createQueryMock(null);
        const doc = {
            ...item,
            save: async function() {
                eventsStore.set(String(this._id), this);
                return this;
            }
        };
        return createQueryMock(doc);
    };

    CollegeEvent.findByIdAndDelete = async (id) => {
        const item = eventsStore.get(String(id));
        eventsStore.delete(String(id));
        return item;
    };

    let globalEventId = null;
    let semesterEventId = null;

    // 1. Global event creation (all-day holiday)
    await suite.test('1. Global event creation: creates Independence Day as a GLOBAL holiday', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Independence Day',
                eventType: 'Holiday / Closure',
                scope: 'GLOBAL',
                startDate: '2026-08-15',
                endDate: '2026-08-15',
                allDay: true,
                description: 'National public holiday'
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.payload)}`);
        assert.equal(res.payload.success, true);
        assert.equal(res.payload.data.title, 'Independence Day');
        assert.equal(res.payload.data.scope, 'GLOBAL');
        assert.equal(res.payload.data.academicSemesterId, null);
        assert.equal(res.payload.data.allDay, true);
        assert.equal(res.payload.data.status, 'ACTIVE');

        globalEventId = res.payload.data._id;
    });

    // 2. Semester-scoped event creation (exam tied to official semester)
    await suite.test('2. Semester-scoped event creation: creates CIE-1 tied to official semester', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'CIE 1 Examinations',
                eventType: 'Exam',
                scope: 'SEMESTER',
                academicSemesterId: validSemesterId.toString(),
                startDate: '2026-10-12',
                endDate: '2026-10-16',
                allDay: true,
                description: 'First continuous internal evaluation'
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.success, true);
        assert.equal(res.payload.data.title, 'CIE 1 Examinations');
        assert.equal(res.payload.data.scope, 'SEMESTER');
        assert.equal(String(res.payload.data.academicSemesterId), String(validSemesterId));

        semesterEventId = res.payload.data._id;
    });

    // 3. Semester required for semester scope
    await suite.test('3. Semester required for semester scope: rejects missing academicSemesterId', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Midterm Test',
                eventType: 'Exam',
                scope: 'SEMESTER',
                // missing academicSemesterId
                startDate: '2026-10-20',
                endDate: '2026-10-20',
                allDay: true
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.payload.success, false);
        assert.match(res.payload.error, /academicSemesterId is required/i);
    });

    // 4. Semester forbidden / null for global scope
    await suite.test('4. Semester forbidden/null for global scope: rejects global event with academicSemesterId', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Republic Day',
                eventType: 'Holiday / Closure',
                scope: 'GLOBAL',
                academicSemesterId: validSemesterId.toString(), // forbidden
                startDate: '2027-01-26',
                endDate: '2027-01-26',
                allDay: true
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.payload.success, false);
        assert.match(res.payload.error, /must be null for global events/i);
    });

    // 5. Invalid date range rejected (endDate < startDate)
    await suite.test('5. Invalid date range rejected: rejects endDate before startDate', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Invalid Event Dates',
                eventType: 'Academic Event',
                scope: 'SEMESTER',
                academicSemesterId: validSemesterId.toString(),
                startDate: '2026-10-15',
                endDate: '2026-10-10', // earlier than start!
                allDay: true
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.payload.success, false);
        assert.match(res.payload.error, /End date cannot be before start date/i);
    });

    // 6. Invalid time range rejected (endTime <= startTime on same-day timed event)
    await suite.test('6. Invalid time range rejected: rejects endTime earlier than or equal to startTime on same day', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Invalid Seminar Time',
                eventType: 'Academic Event',
                scope: 'SEMESTER',
                academicSemesterId: validSemesterId.toString(),
                startDate: '2026-11-05',
                endDate: '2026-11-05',
                allDay: false,
                startTime: '14:00',
                endTime: '11:00' // earlier than start!
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.payload.success, false);
        assert.match(res.payload.error, /End time must be strictly after start time/i);
    });

    // 7. All-day event flags and behavior
    await suite.test('7. All-day event: supports timed event with valid startTime and endTime', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Gandhi Jayanti Special Event',
                eventType: 'Holiday / Closure',
                scope: 'GLOBAL',
                startDate: '2026-10-02',
                endDate: '2026-10-02',
                allDay: false,
                startTime: '09:30',
                endTime: '12:30'
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.success, true);
        assert.equal(res.payload.data.allDay, false);
        assert.equal(res.payload.data.startTime, '09:30');
        assert.equal(res.payload.data.endTime, '12:30');
    });

    // 8. Cancelled / archived event
    await suite.test('8. Cancelled and archived event: updates status to CANCELLED and soft deletes to ARCHIVED', async () => {
        // Update status to CANCELLED
        const updateReq = {
            admin: superAdmin,
            params: { id: semesterEventId.toString() },
            body: {
                status: 'CANCELLED'
            }
        };
        const updateRes = createMockRes();
        await updateEvent(updateReq, updateRes);
        assert.equal(updateRes.statusCode, 200);
        assert.equal(updateRes.payload.data.status, 'CANCELLED');

        // Delete (archive) event
        const deleteReq = {
            admin: superAdmin,
            params: { id: semesterEventId.toString() },
            query: {}
        };
        const deleteRes = createMockRes();
        await deleteEvent(deleteReq, deleteRes);
        assert.equal(deleteRes.statusCode, 200);
        assert.equal(deleteRes.payload.data.status, 'ARCHIVED');
    });

    // 9. Invalid semester reference rejected
    await suite.test('9. Invalid semester reference rejected: rejects nonexistent semester ID', async () => {
        const req = {
            admin: superAdmin,
            body: {
                title: 'Orphan Exam Event',
                eventType: 'Exam',
                scope: 'SEMESTER',
                academicSemesterId: nonExistentSemesterId.toString(),
                startDate: '2026-11-20',
                endDate: '2026-11-25',
                allDay: true
            }
        };
        const res = createMockRes();

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.payload.success, false);
        assert.match(res.payload.error, /semester does not exist/i);
    });

    // 10. List events with filters
    await suite.test('10. List events: correctly filters by scope and eventType', async () => {
        const reqGlobal = { query: { scope: 'GLOBAL' } };
        const resGlobal = createMockRes();
        await listEvents(reqGlobal, resGlobal);
        assert.equal(resGlobal.statusCode, 200);
        assert.ok(resGlobal.payload.data.length >= 2);
        assert.ok(resGlobal.payload.data.every(e => e.scope === 'GLOBAL'));

        const reqHolidays = { query: { eventType: 'Holiday / Closure' } };
        const resHolidays = createMockRes();
        await listEvents(reqHolidays, resHolidays);
        assert.equal(resHolidays.statusCode, 200);
        assert.ok(resHolidays.payload.data.every(e => e.eventType === 'Holiday / Closure'));
    });
});
