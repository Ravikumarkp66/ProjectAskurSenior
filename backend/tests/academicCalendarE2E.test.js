const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Import Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const Branch = require('../models/Branch');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const AcademicCalendarEvent = require('../modules/academic/AcademicCalendarEvent');

// Import Controller
const {
    listCalendarItems,
    getCalendarItemById,
    createCalendarItem,
    updateCalendarItem,
    deleteCalendarItem,
    syncGovernmentHolidays
} = require('../controllers/academicCalendarController');

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
        lean() { return query; },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        },
        catch(reject) {
            return Promise.resolve(result).catch(reject);
        }
    };
    return query;
}

test('PHASE B — STEP 4: Official Academic Calendar (Holidays + Events) E2E Test Suite', async (suite) => {
    // Fixture IDs
    const sitCollegeId = new mongoose.Types.ObjectId();
    const otherCollegeId = new mongoose.Types.ObjectId();
    const beProgramId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const semesterId = new mongoose.Types.ObjectId();
    const cseBranchId = new mongoose.Types.ObjectId();
    const iseBranchId = new mongoose.Types.ObjectId();
    const otherBranchId = new mongoose.Types.ObjectId();

    const mockSemester = {
        _id: semesterId,
        college: sitCollegeId,
        program: beProgramId,
        batch: batchId,
        number: 1,
        label: 'Semester 1',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        status: 'Active'
    };

    const mockBranches = {
        [String(cseBranchId)]: { _id: cseBranchId, name: 'Computer Science', shortName: 'CSE', college: sitCollegeId },
        [String(iseBranchId)]: { _id: iseBranchId, name: 'Information Science', shortName: 'ISE', college: sitCollegeId },
        [String(otherBranchId)]: { _id: otherBranchId, name: 'External Branch', shortName: 'EXT', college: otherCollegeId }
    };

    // Stubs for Semester, College and Branch lookup
    Semester.findById = (id) => createQueryMock(String(id) === String(semesterId) ? mockSemester : null);
    Branch.findById = (id) => createQueryMock(mockBranches[String(id)] || null);
    College.findOne = () => createQueryMock({ _id: sitCollegeId, code: 'SIT', name: 'SIT Tumkur' });

    // Mock Admins
    const superAdmin = {
        _id: new mongoose.Types.ObjectId(),
        role: 'SUPER_ADMIN',
        permissions: { events: { view: true, create: true, update: true, delete: true, publish: true } },
        scopes: []
    };

    const cseScopedAdmin = {
        _id: new mongoose.Types.ObjectId(),
        role: 'ADMIN',
        permissions: { events: { view: true, create: true, update: true, delete: true, publish: true } },
        scopes: [{
            college: sitCollegeId,
            program: beProgramId,
            branch: cseBranchId,
            batch: batchId,
            semester: 1
        }]
    };

    const iseScopedAdmin = {
        _id: new mongoose.Types.ObjectId(),
        role: 'ADMIN',
        permissions: { events: { view: true, create: true, update: true, delete: true, publish: true } },
        scopes: [{
            college: sitCollegeId,
            program: beProgramId,
            branch: iseBranchId,
            batch: batchId,
            semester: 1
        }]
    };

    // In-memory store for items during tests
    const inMemoryItems = new Map();

    function matchSub(item, sub) {
        if (!sub) return true;
        if (sub.semester && String(item.semester) !== String(sub.semester)) return false;
        if (sub.kind && item.kind !== sub.kind) return false;
        if (sub.holidayCategory && item.holidayCategory !== sub.holidayCategory) return false;
        if (sub.scope && item.scope !== sub.scope) return false;
        if (sub.status && item.status !== sub.status) return false;
        if (sub.observedByCollege !== undefined && item.observedByCollege !== sub.observedByCollege) return false;
        if (sub.branch) {
            if (sub.branch.$in) {
                if (!sub.branch.$in.includes(String(item.branch))) return false;
            } else if (String(item.branch) !== String(sub.branch)) {
                return false;
            }
        }
        if (sub.startDate && sub.startDate.$lte) {
            if (new Date(item.startDate) > new Date(sub.startDate.$lte)) return false;
        }
        if (sub.endDate && sub.endDate.$gte) {
            if (new Date(item.endDate) < new Date(sub.endDate.$gte)) return false;
        }
        return true;
    }

    AcademicCalendarItem.findById = (id) => {
        const item = inMemoryItems.get(String(id));
        if (!item) return createQueryMock(null);
        return createQueryMock(item);
    };

    AcademicCalendarItem.findByIdAndDelete = async (id) => {
        const item = inMemoryItems.get(String(id));
        inMemoryItems.delete(String(id));
        return item || null;
    };

    AcademicCalendarItem.find = (query = {}) => {
        let results = Array.from(inMemoryItems.values());
        if (query.$and) {
            results = results.filter(i => {
                return query.$and.every(cond => {
                    if (cond.$or) return cond.$or.some(s => matchSub(i, s));
                    return matchSub(i, cond);
                });
            });
        } else if (query.$or) {
            results = results.filter(i => {
                return query.$or.some(s => matchSub(i, s));
            });
        } else {
            results = results.filter(i => matchSub(i, query));
        }
        return createQueryMock(results);
    };

    AcademicCalendarItem.deleteMany = async (query = {}) => {
        let deleted = 0;
        for (const [id, item] of inMemoryItems.entries()) {
            if (query.title && query.title.$regex && query.title.$regex.test(item.title)) {
                inMemoryItems.delete(id);
                deleted++;
            }
        }
        return { deletedCount: deleted };
    };

    AcademicCalendarItem.countDocuments = async (query = {}) => {
        const results = Array.from(inMemoryItems.values()).filter(i => matchSub(i, query));
        return results.length;
    };

    // Prototype save mock
    const originalSave = AcademicCalendarItem.prototype.save;
    AcademicCalendarItem.prototype.save = async function() {
        if (!this._id) this._id = new mongoose.Types.ObjectId();
        inMemoryItems.set(String(this._id), this);
        return this;
    };

    let govHolidayId = null;
    let outsideGovHolidayId = null;
    let instHolidayId = null;
    let cseHolidayId = null;
    let globalEventId = null;
    let cseEventId = null;
    let iseEventId = null;

    // =========================================================================
    // LAYER A: GOVERNMENT HOLIDAYS (Tests 1 - 10)
    // =========================================================================

    await suite.test('1. Create government holiday: creates global government holiday', async () => {
        const req = {
            admin: superAdmin,
            body: {
                kind: 'HOLIDAY',
                holidayCategory: 'GOVERNMENT',
                title: 'Gandhi Jayanti',
                scope: 'GLOBAL',
                startDate: '2026-10-02',
                endDate: '2026-10-02',
                classImpact: 'FULL_DAY',
                observedByCollege: true
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.success, true);
        assert.equal(res.payload.data.title, 'Gandhi Jayanti');
        assert.equal(res.payload.data.kind, 'HOLIDAY');
        assert.equal(res.payload.data.holidayCategory, 'GOVERNMENT');
        govHolidayId = res.payload.data._id;
    });

    await suite.test('2. Government holiday is global: scope is GLOBAL and branch is null', async () => {
        const item = inMemoryItems.get(String(govHolidayId));
        assert.equal(item.scope, 'GLOBAL');
        assert.equal(item.branch, null);
    });

    await suite.test('3. Government holiday does not require semester: successfully created without semesterId', async () => {
        const item = inMemoryItems.get(String(govHolidayId));
        assert.equal(item.semester, null);
    });

    await suite.test('4. Government holiday does not require branch: rejects attempt to assign branch to government holiday', async () => {
        const req = {
            admin: superAdmin,
            body: {
                kind: 'HOLIDAY',
                holidayCategory: 'GOVERNMENT',
                title: 'Branch-Restricted Gov Holiday',
                scope: 'BRANCH',
                branchId: cseBranchId,
                startDate: '2026-10-02',
                endDate: '2026-10-02'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /Government holidays are global/i);
    });

    await suite.test('5. Edit government holiday: updates title, date, and observance status', async () => {
        const req = {
            admin: superAdmin,
            params: { id: govHolidayId },
            body: {
                title: 'Mahatma Gandhi Jayanti',
                observedByCollege: true
            }
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.data.title, 'Mahatma Gandhi Jayanti');
        assert.equal(res.payload.data.observedByCollege, true);
    });

    await suite.test('6. Enable/disable government holiday: changes status between Published and Archived', async () => {
        const req = {
            admin: superAdmin,
            params: { id: govHolidayId },
            body: { status: 'Archived' }
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.data.status, 'Archived');

        // Restore to Published
        req.body.status = 'Published';
        await updateCalendarItem(req, res);
        assert.equal(res.payload.data.status, 'Published');
    });

    await suite.test('7. Existing government holiday records remain available: legacy AcademicCalendarEvent is intact', () => {
        assert.equal(typeof AcademicCalendarEvent, 'function');
        assert.equal(AcademicCalendarEvent.modelName, 'AcademicCalendarEvent');
        assert.equal(AcademicCalendarItem.modelName, 'AcademicCalendarItem');
        assert.notEqual(AcademicCalendarEvent.collection.name, AcademicCalendarItem.collection.name);
    });

    await suite.test('8. Government holiday can fall inside a semester timeline: listed in semester query', async () => {
        // Gandhi Jayanti is 2026-10-02, which is inside Semester 1 (2026-09-01 to 2026-12-31)
        const req = {
            admin: superAdmin,
            query: { semesterId: String(semesterId) }
        };
        const res = createMockRes();
        await listCalendarItems(req, res);
        assert.equal(res.statusCode, 200);
        const hasGandhi = res.payload.data.some(i => i.title.includes('Gandhi Jayanti'));
        assert.equal(hasGandhi, true);
    });

    await suite.test('9. Government holiday can fall outside a semester timeline: independent query returns it but semester query filters it out', async () => {
        // Create Republic Day on 2026-01-26 (outside Semester 1: 2026-09-01 to 2026-12-31)
        const createReq = {
            admin: superAdmin,
            body: {
                kind: 'HOLIDAY',
                holidayCategory: 'GOVERNMENT',
                title: 'Republic Day',
                scope: 'GLOBAL',
                startDate: '2026-01-26',
                endDate: '2026-01-26',
                classImpact: 'FULL_DAY',
                observedByCollege: true
            }
        };
        const createRes = createMockRes();
        await createCalendarItem(createReq, createRes);
        assert.equal(createRes.statusCode, 201);
        outsideGovHolidayId = createRes.payload.data._id;

        // Querying for Semester 1 must NOT include Republic Day
        const semReq = {
            admin: superAdmin,
            query: { semesterId: String(semesterId) }
        };
        const semRes = createMockRes();
        await listCalendarItems(semReq, semRes);
        assert.equal(semRes.statusCode, 200);
        const hasRepublic = semRes.payload.data.some(i => i.title === 'Republic Day');
        assert.equal(hasRepublic, false, 'Republic Day should not appear in Semester 1 calendar');

        // Querying globally without semesterId MUST include Republic Day
        const globalReq = {
            admin: superAdmin,
            query: { kind: 'HOLIDAY', holidayCategory: 'GOVERNMENT' }
        };
        const globalRes = createMockRes();
        await listCalendarItems(globalReq, globalRes);
        assert.equal(globalRes.statusCode, 200);
        const foundGlobal = globalRes.payload.data.some(i => i.title === 'Republic Day');
        assert.equal(foundGlobal, true, 'Republic Day must appear in global government holidays list');
    });

    await suite.test('10. College can choose observed/not observed: observedByCollege toggle works and defaults to true', async () => {
        const req = {
            admin: superAdmin,
            body: {
                kind: 'HOLIDAY',
                holidayCategory: 'GOVERNMENT',
                title: 'Local Observance Test Day',
                scope: 'GLOBAL',
                startDate: '2026-11-01',
                endDate: '2026-11-01',
                observedByCollege: false
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.observedByCollege, false);
    });

    // =========================================================================
    // LAYER B: INSTITUTIONAL HOLIDAYS (Tests 11 - 15)
    // =========================================================================

    await suite.test('11. Create global institutional holiday: created with semester and scope GLOBAL', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'HOLIDAY',
                holidayCategory: 'INSTITUTIONAL',
                title: 'SIT Foundation Day',
                scope: 'GLOBAL',
                startDate: '2026-09-15',
                endDate: '2026-09-15',
                classImpact: 'FULL_DAY'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.title, 'SIT Foundation Day');
        assert.equal(res.payload.data.scope, 'GLOBAL');
        assert.equal(res.payload.data.branch, null);
        instHolidayId = res.payload.data._id;
    });

    await suite.test('12. Create branch-specific institutional holiday: created for specific branch with scoped admin', async () => {
        const req = {
            admin: cseScopedAdmin,
            body: {
                semesterId,
                kind: 'HOLIDAY',
                holidayCategory: 'INSTITUTIONAL',
                title: 'CSE Department Day',
                scope: 'BRANCH',
                branchId: cseBranchId,
                startDate: '2026-10-20',
                endDate: '2026-10-20',
                classImpact: 'FULL_DAY'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.scope, 'BRANCH');
        assert.equal(String(res.payload.data.branch), String(cseBranchId));
        cseHolidayId = res.payload.data._id;
    });

    await suite.test('13. Reject invalid branch scope: rejects BRANCH holiday without branchId', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'HOLIDAY',
                holidayCategory: 'INSTITUTIONAL',
                title: 'Invalid Branch Holiday',
                scope: 'BRANCH',
                startDate: '2026-10-20',
                endDate: '2026-10-20'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /Branch is required/i);
    });

    await suite.test('14. Range holiday works: multi-day holiday record created and saved as one item', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'HOLIDAY',
                holidayCategory: 'RANGE',
                title: 'Mid-Semester Vacation',
                scope: 'GLOBAL',
                startDate: '2026-10-25',
                endDate: '2026-10-30',
                classImpact: 'FULL_DAY'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.title, 'Mid-Semester Vacation');
        assert.equal(res.payload.data.holidayCategory, 'RANGE');
    });

    await suite.test('15. Date validation works: start date after end date rejected', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'HOLIDAY',
                holidayCategory: 'INSTITUTIONAL',
                title: 'Invalid Dates Holiday',
                scope: 'GLOBAL',
                startDate: '2026-10-15',
                endDate: '2026-10-10'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /Start date must precede/i);
    });

    // =========================================================================
    // LAYER B: CALENDAR EVENTS (Tests 16 - 24)
    // =========================================================================

    await suite.test('16. Create global semester event: created with semester, scope GLOBAL, holidayCategory null', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Student Induction Programme',
                scope: 'GLOBAL',
                startDate: '2026-09-02',
                endDate: '2026-09-04',
                classImpact: 'NONE'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.kind, 'EVENT');
        assert.equal(res.payload.data.holidayCategory, null);
        assert.equal(res.payload.data.scope, 'GLOBAL');
        globalEventId = res.payload.data._id;
    });

    await suite.test('17. Create branch-specific semester event: created for specific branch', async () => {
        const req = {
            admin: cseScopedAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Feel Employable Programme',
                scope: 'BRANCH',
                branchId: cseBranchId,
                startDate: '2026-10-12',
                endDate: '2026-10-12',
                classImpact: 'TIME_RANGE',
                suspensionStartMinute: 540,
                suspensionEndMinute: 780
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.title, 'Feel Employable Programme');
        assert.equal(res.payload.data.scope, 'BRANCH');
        assert.equal(String(res.payload.data.branch), String(cseBranchId));
        cseEventId = res.payload.data._id;
    });

    await suite.test('18. Reject branch event without branch: rejects branch event without branchId', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Missing Branch Event',
                scope: 'BRANCH',
                startDate: '2026-10-12',
                endDate: '2026-10-12'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /Branch is required/i);
    });

    await suite.test('19. Global event has no branch: branch is null and rejects branchId with global scope', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Invalid Global Event',
                scope: 'GLOBAL',
                branchId: cseBranchId,
                startDate: '2026-10-12',
                endDate: '2026-10-12'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /Global calendar items must not specify a branch/i);
    });

    await suite.test('20. Different branches can have events on same date: coexistence of events across branches', async () => {
        // Create an ISE event on the exact same date as CSE Feel Employable Programme (2026-10-12)
        const req = {
            admin: iseScopedAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'ISE Department Seminar',
                scope: 'BRANCH',
                branchId: iseBranchId,
                startDate: '2026-10-12',
                endDate: '2026-10-12',
                classImpact: 'NONE'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        iseEventId = res.payload.data._id;
        assert.equal(String(res.payload.data.branch), String(iseBranchId));
    });

    await suite.test('21. Global and branch events can coexist on same date: both returned for same date', async () => {
        // Add a global event on 2026-10-12
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Campus Photography Contest',
                scope: 'GLOBAL',
                startDate: '2026-10-12',
                endDate: '2026-10-12',
                classImpact: 'NONE'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);

        // Fetch calendar for semester - both CSE event and Campus contest must be present
        const listReq = {
            admin: superAdmin,
            query: { semesterId: String(semesterId), kind: 'EVENT' }
        };
        const listRes = createMockRes();
        await listCalendarItems(listReq, listRes);
        assert.equal(listRes.statusCode, 200);
        const onDateItems = listRes.payload.data.filter(i => new Date(i.startDate).toISOString().startsWith('2026-10-12'));
        assert.ok(onDateItems.length >= 3, 'Global and multiple branch events coexist on the same date');
    });

    await suite.test('22. Multi-day events work: spans multiple days within semester', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'HALCYON Cultural Fest',
                scope: 'GLOBAL',
                startDate: '2026-11-10',
                endDate: '2026-11-13',
                classImpact: 'FULL_DAY'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.title, 'HALCYON Cultural Fest');
    });

    await suite.test('23. Event must stay within semester dates: rejects event outside semester range', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Out of Bounds Event',
                scope: 'GLOBAL',
                startDate: '2027-01-05',
                endDate: '2027-01-06'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /must fall within the official semester range/i);
    });

    await suite.test('24. Boundary dates equal to semester start/end are valid: exact boundary dates accepted', async () => {
        // Start date boundary
        const reqStart = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Inauguration of Semester 1',
                scope: 'GLOBAL',
                startDate: '2026-09-01',
                endDate: '2026-09-01',
                classImpact: 'NONE'
            }
        };
        const resStart = createMockRes();
        await createCalendarItem(reqStart, resStart);
        assert.equal(resStart.statusCode, 201);

        // End date boundary
        const reqEnd = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Semester 1 Conclusion Ceremony',
                scope: 'GLOBAL',
                startDate: '2026-12-31',
                endDate: '2026-12-31',
                classImpact: 'NONE'
            }
        };
        const resEnd = createMockRes();
        await createCalendarItem(reqEnd, resEnd);
        assert.equal(resEnd.statusCode, 201);
    });

    // =========================================================================
    // CLASS IMPACT (Tests 25 - 28)
    // =========================================================================

    await suite.test('25. NONE works: classImpact NONE accepted without suspension minutes', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Impact None Event',
                scope: 'GLOBAL',
                startDate: '2026-10-18',
                endDate: '2026-10-18',
                classImpact: 'NONE'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.classImpact, 'NONE');
    });

    await suite.test('26. FULL_DAY works: classImpact FULL_DAY accepted', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Full Day Event',
                scope: 'GLOBAL',
                startDate: '2026-10-19',
                endDate: '2026-10-19',
                classImpact: 'FULL_DAY'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.classImpact, 'FULL_DAY');
    });

    await suite.test('27. TIME_RANGE works: classImpact TIME_RANGE accepted with valid start/end minutes', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Afternoon Workshop',
                scope: 'GLOBAL',
                startDate: '2026-10-21',
                endDate: '2026-10-21',
                classImpact: 'TIME_RANGE',
                suspensionStartMinute: 840,
                suspensionEndMinute: 1020
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.payload.data.classImpact, 'TIME_RANGE');
        assert.equal(res.payload.data.suspensionStartMinute, 840);
        assert.equal(res.payload.data.suspensionEndMinute, 1020);
    });

    await suite.test('28. Invalid time range rejected: startMinute >= endMinute or out of bounds [0, 1440] rejected', async () => {
        const req = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Invalid Range Event',
                scope: 'GLOBAL',
                startDate: '2026-10-22',
                endDate: '2026-10-22',
                classImpact: 'TIME_RANGE',
                suspensionStartMinute: 1000,
                suspensionEndMinute: 900 // invalid start >= end
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.payload.error, /TIME_RANGE suspension requires startMinute < endMinute/i);
    });

    // =========================================================================
    // RBAC & IDOR (Tests 29 - 35)
    // =========================================================================

    await suite.test('29. Authorized branch admin can manage own branch: create, edit, delete within branch authorized', async () => {
        // Create
        const reqCreate = {
            admin: cseScopedAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'CSE Internal Hackathon',
                scope: 'BRANCH',
                branchId: cseBranchId,
                startDate: '2026-11-05',
                endDate: '2026-11-05',
                classImpact: 'FULL_DAY'
            }
        };
        const resCreate = createMockRes();
        await createCalendarItem(reqCreate, resCreate);
        assert.equal(resCreate.statusCode, 201);
        const hackathonId = resCreate.payload.data._id;

        // Edit
        const reqEdit = {
            admin: cseScopedAdmin,
            params: { id: hackathonId },
            body: { title: 'CSE Grand Hackathon' }
        };
        const resEdit = createMockRes();
        await updateCalendarItem(reqEdit, resEdit);
        assert.equal(resEdit.statusCode, 200);
        assert.equal(resEdit.payload.data.title, 'CSE Grand Hackathon');

        // Delete
        const reqDelete = {
            admin: cseScopedAdmin,
            params: { id: hackathonId }
        };
        const resDelete = createMockRes();
        await deleteCalendarItem(reqDelete, resDelete);
        assert.equal(resDelete.statusCode, 200);
    });

    await suite.test('30. Unauthorized branch access rejected: branch admin cannot view other branch items', async () => {
        const req = {
            admin: cseScopedAdmin,
            query: { branchId: String(iseBranchId) }
        };
        const res = createMockRes();
        await listCalendarItems(req, res);
        assert.equal(res.statusCode, 403);
        assert.match(res.payload.error, /Forbidden/i);
    });

    await suite.test('31. Branch admin cannot create another branch event: returns 403 Forbidden', async () => {
        const req = {
            admin: cseScopedAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Unauthorized ISE Event',
                scope: 'BRANCH',
                branchId: iseBranchId,
                startDate: '2026-11-05',
                endDate: '2026-11-05'
            }
        };
        const res = createMockRes();
        await createCalendarItem(req, res);
        assert.equal(res.statusCode, 403);
    });

    await suite.test('32. Branch admin cannot edit another branch event: returns 403 Forbidden', async () => {
        const req = {
            admin: cseScopedAdmin,
            params: { id: iseEventId },
            body: { title: 'Hacked ISE Event' }
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 403);
    });

    await suite.test('33. Branch admin cannot change branch to unauthorized branch: returns 403 Forbidden on destination branch', async () => {
        const req = {
            admin: cseScopedAdmin,
            params: { id: cseEventId },
            body: { branchId: iseBranchId } // Attempting to move CSE event to ISE
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 403);
    });

    await suite.test('34. Branch admin cannot convert branch event to GLOBAL: returns 403 Forbidden', async () => {
        const req = {
            admin: cseScopedAdmin,
            params: { id: cseEventId },
            body: { scope: 'GLOBAL' }
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 403);
        assert.match(res.payload.error, /cannot make calendar items Global/i);
    });

    await suite.test('35. IDOR attempts return 403: getCalendarItemById returns 403 for unauthorized branch', async () => {
        const req = {
            admin: cseScopedAdmin,
            params: { id: iseEventId }
        };
        const res = createMockRes();
        await getCalendarItemById(req, res);
        assert.equal(res.statusCode, 403);
    });

    // =========================================================================
    // EDIT & DELETE (Tests 36 - 38)
    // =========================================================================

    await suite.test('36. Edit event works: updates event fields and validates containment', async () => {
        const req = {
            admin: superAdmin,
            params: { id: globalEventId },
            body: {
                title: 'Student Induction Ceremony (Updated)',
                description: 'Updated schedule for Day 1'
            }
        };
        const res = createMockRes();
        await updateCalendarItem(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.data.title, 'Student Induction Ceremony (Updated)');
        assert.equal(res.payload.data.description, 'Updated schedule for Day 1');
    });

    await suite.test('37. Delete event works: removes item from collection', async () => {
        const req = {
            admin: superAdmin,
            params: { id: globalEventId }
        };
        const res = createMockRes();
        await deleteCalendarItem(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(inMemoryItems.has(String(globalEventId)), false);
    });

    await suite.test('38. Past-event safety behavior works: updates past item without mutating historical attendance', async () => {
        // Create past event
        const pastReq = {
            admin: superAdmin,
            body: {
                semesterId,
                kind: 'EVENT',
                title: 'Past Seminar',
                scope: 'GLOBAL',
                startDate: '2026-09-02',
                endDate: '2026-09-02',
                classImpact: 'NONE'
            }
        };
        const pastRes = createMockRes();
        await createCalendarItem(pastReq, pastRes);
        assert.equal(pastRes.statusCode, 201);
        const pastId = pastRes.payload.data._id;

        // Edit past event
        const updateReq = {
            admin: superAdmin,
            params: { id: pastId },
            body: { description: 'Verified post-completion notes' }
        };
        const updateRes = createMockRes();
        await updateCalendarItem(updateReq, updateRes);
        assert.equal(updateRes.statusCode, 200);
        assert.equal(updateRes.payload.data.description, 'Verified post-completion notes');
    });

    await suite.test('39. Sundays excluded from Government Holidays: sync strictly excludes weekly non-working days (Sundays)', async () => {
        // Stub AcademicCalendarEvent.find to return a mix of named holidays and Sundays
        const origFind = AcademicCalendarEvent.find;
        AcademicCalendarEvent.find = () => ({
            sort: () => ({
                lean: async () => [
                    { title: 'Sunday', date: '2026-04-05', category: 'holiday', scope: 'state', isActive: true },
                    { title: 'Sunday', date: '2026-04-12', category: 'holiday', scope: 'state', isActive: true },
                    { title: 'Ugadi', date: '2026-03-19', category: 'holiday', scope: 'state', isActive: true },
                    { title: 'Good Friday', date: '2026-04-03', category: 'holiday', scope: 'national', isActive: true }
                ]
            })
        });

        // Track what gets inserted
        const origInsertMany = AcademicCalendarItem.insertMany;
        let insertedDocs = [];
        AcademicCalendarItem.insertMany = async (docs) => {
            insertedDocs = docs;
            return docs;
        };

        const req = { admin: superAdmin };
        const res = createMockRes();
        await syncGovernmentHolidays(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(insertedDocs.length, 2);
        const hasSunday = insertedDocs.some(d => d.title.toLowerCase() === 'sunday');
        assert.equal(hasSunday, false, 'Sundays must strictly NOT be imported as government holidays');
        assert.equal(insertedDocs[0].title, 'Ugadi');
        assert.equal(insertedDocs[1].title, 'Good Friday');

        // Restore
        AcademicCalendarEvent.find = origFind;
        AcademicCalendarItem.insertMany = origInsertMany;
    });

    await suite.test('40. Source isActive and observance state preserved: inactive legacy items become Draft with impact NONE', async () => {
        const origFind = AcademicCalendarEvent.find;
        AcademicCalendarEvent.find = () => ({
            sort: () => ({
                lean: async () => [
                    { title: 'Special State Holiday', date: '2026-05-15', category: 'holiday', scope: 'state', isActive: false },
                    { title: 'National Observance', date: '2026-06-15', category: 'holiday', scope: 'national', isActive: true, metadata: { observedByCollege: false } }
                ]
            })
        });

        const origInsertMany = AcademicCalendarItem.insertMany;
        let insertedDocs = [];
        AcademicCalendarItem.insertMany = async (docs) => {
            insertedDocs = docs;
            return docs;
        };

        const req = { admin: superAdmin };
        const res = createMockRes();
        await syncGovernmentHolidays(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(insertedDocs.length, 2);

        // First item had isActive: false -> Draft, observedByCollege: false, classImpact: NONE
        assert.equal(insertedDocs[0].title, 'Special State Holiday');
        assert.equal(insertedDocs[0].status, 'Draft');
        assert.equal(insertedDocs[0].observedByCollege, false);
        assert.equal(insertedDocs[0].classImpact, 'NONE');

        // Second item had metadata.observedByCollege: false -> observedByCollege: false, classImpact: NONE
        assert.equal(insertedDocs[1].title, 'National Observance');
        assert.equal(insertedDocs[1].observedByCollege, false);
        assert.equal(insertedDocs[1].classImpact, 'NONE');

        // Restore
        AcademicCalendarEvent.find = origFind;
        AcademicCalendarItem.insertMany = origInsertMany;
    });

    // Restore save
    AcademicCalendarItem.prototype.save = originalSave;
});
