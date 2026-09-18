const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const express = require('express');

const academicContentController = require('../../controllers/academicContentController');
const academicContentResolver = require('../academicContentResolver');
const studentSubjectResolver = require('../studentSubjectResolver');
const academicContentRoutes = require('../../routes/academicContentRoutes');
const CourseModule = require('../../models/CourseModule');
const Topic = require('../../models/Topic');
const EditorialContent = require('../../models/EditorialContent');

// Helper to create mock Express response object
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

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 & 4.1: Unauthenticated request -> 401
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-001: Unauthenticated request returns 401 Authentication required', async () => {
    const resTree = createMockRes();
    await academicContentController.getContentTree({ params: { subjectSlug: 'plc5' } }, resTree);
    assert.strictEqual(resTree.statusCode, 401);
    assert.strictEqual(resTree.body.success, false);
    assert.strictEqual(resTree.body.message, 'Authentication required');

    const resTopic = createMockRes();
    await academicContentController.getTopicEditorial({
        params: { subjectSlug: 'plc5', moduleSlug: 'basics', topicSlug: 'before-you-start' }
    }, resTopic);
    assert.strictEqual(resTopic.statusCode, 401);
    assert.strictEqual(resTopic.body.success, false);
    assert.strictEqual(resTopic.body.message, 'Authentication required');
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 & 4.2: Authenticated student requesting an unallocated subject -> 403
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-002: Authenticated student requesting an unallocated subject returns 403', async () => {
    let mockResolverCalledWith = null;

    academicContentResolver.setSubjectResolver({
        resolveStudentSubjects: async (student, sem) => {
            mockResolverCalledWith = { student, sem };
            return {
                subjects: [
                    { _id: new mongoose.Types.ObjectId(), slug: 'mathematics-1', code: 'MATH1' }
                ]
            };
        }
    });

    try {
        const student = { _id: new mongoose.Types.ObjectId(), name: 'Test Student', semester: 1 };
        const req = {
            student,
            params: { subjectSlug: 'unallocated-random-subject' }
        };
        const res = createMockRes();

        await academicContentController.getContentTree(req, res);

        assert.ok(mockResolverCalledWith, 'Mock resolver must be called by resolver service');
        assert.strictEqual(mockResolverCalledWith.student, student);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /access denied/i);
    } finally {
        academicContentResolver.resetSubjectResolver();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 & 4.3: Valid subject in MongoDB but NOT allocated to student -> 403
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-003: Valid subject that exists in MongoDB but is NOT allocated to student returns 403', async () => {
    const validDbSubjectId = new mongoose.Types.ObjectId('6a4fb2bf331c312c6404093b'); // Real PLC5 ID

    let mockResolverCalled = false;
    academicContentResolver.setSubjectResolver({
        resolveStudentSubjects: async (student) => {
            mockResolverCalled = true;
            // Student is only enrolled in Chemistry and Physics, NOT PLC5
            return {
                subjects: [
                    { _id: new mongoose.Types.ObjectId(), slug: 'applied-chemistry', code: 'CHEM1' },
                    { _id: new mongoose.Types.ObjectId(), slug: 'applied-physics', code: 'PHYS1' }
                ]
            };
        }
    });

    try {
        const student = { _id: new mongoose.Types.ObjectId() };
        
        // Student attempts to request PLC5 by slug
        const resBySlug = await academicContentResolver.resolveAuthorizedSubject(student, 'introduction-to-c-programming');
        assert.strictEqual(mockResolverCalled, true);
        assert.strictEqual(resBySlug.authorized, false);
        assert.strictEqual(resBySlug.reason, 'NOT_ALLOCATED');

        // Student attempts to request PLC5 by course code
        const resByCode = await academicContentResolver.resolveAuthorizedSubject(student, 'plc5');
        assert.strictEqual(resByCode.authorized, false);

        // Student attempts to request PLC5 by known database ObjectId directly
        const resById = await academicContentResolver.resolveAuthorizedSubject(student, validDbSubjectId.toString());
        assert.strictEqual(resById.authorized, false);
    } finally {
        academicContentResolver.resetSubjectResolver();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 & 4.4: Authenticated student requesting allocated subject by supported identifiers -> authorized
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-004: Student requesting allocated subject by slug, code, branchCode, or ObjectId is authorized', async () => {
    const authoritativeSubjectId = new mongoose.Types.ObjectId('6a4fb2bf331c312c6404093b');

    let resolverCallCount = 0;
    academicContentResolver.setSubjectResolver({
        resolveStudentSubjects: async (student) => {
            resolverCallCount++;
            return {
                subjects: [
                    {
                        _id: authoritativeSubjectId,
                        id: authoritativeSubjectId.toString(),
                        slug: 'introduction-to-c-programming',
                        code: 'PLC5',
                        branchCode: 'PLC5',
                        name: 'Introduction to C Programming'
                    }
                ]
            };
        }
    });

    try {
        const student = { _id: new mongoose.Types.ObjectId() };

        // 1. By CMS / timetable slug
        const bySlug = await academicContentResolver.resolveAuthorizedSubject(student, 'introduction-to-c-programming');
        assert.strictEqual(bySlug.authorized, true);
        assert.strictEqual(bySlug.subjectId, authoritativeSubjectId.toString());

        // 2. By Course Code (case-insensitive)
        const byCode = await academicContentResolver.resolveAuthorizedSubject(student, 'plc5');
        assert.strictEqual(byCode.authorized, true);
        assert.strictEqual(byCode.subjectId, authoritativeSubjectId.toString());

        // 3. By Branch Code
        const byBranchCode = await academicContentResolver.resolveAuthorizedSubject(student, 'PLC5');
        assert.strictEqual(byBranchCode.authorized, true);
        assert.strictEqual(byBranchCode.subjectId, authoritativeSubjectId.toString());

        // 4. By ObjectId
        const byId = await academicContentResolver.resolveAuthorizedSubject(student, authoritativeSubjectId.toString());
        assert.strictEqual(byId.authorized, true);
        assert.strictEqual(byId.subjectId, authoritativeSubjectId.toString());

        assert.strictEqual(resolverCallCount, 4, 'Mock resolver must be called for each authorization check');
    } finally {
        academicContentResolver.resetSubjectResolver();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.5: Changing subjectSlug cannot bypass authorization
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-005: Client altering subjectSlug to bypass authorization is blocked at controller', async () => {
    const allocatedSubjId = new mongoose.Types.ObjectId();
    const unallocatedSubjId = new mongoose.Types.ObjectId();

    academicContentResolver.setSubjectResolver({
        resolveStudentSubjects: async (student) => ({
            subjects: [
                { _id: allocatedSubjId, slug: 'subject-a', code: 'SUBA', name: 'Subject A' }
            ]
        })
    });

    try {
        const student = { _id: new mongoose.Types.ObjectId() };

        // Controller check for unallocated Subject B
        const req = { student, params: { subjectSlug: 'subject-b' } };
        const res = createMockRes();
        await academicContentController.getContentTree(req, res);

        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /access denied/i);
    } finally {
        academicContentResolver.resetSubjectResolver();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.6: Module lookup constrained by academicSubjectId + moduleSlug
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-006: Module lookup is strictly constrained by academicSubjectId and moduleSlug', async () => {
    const subjectA = new mongoose.Types.ObjectId();
    const subjectB = new mongoose.Types.ObjectId();
    const moduleFromSubjectB = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;

    let capturedQuery = null;
    CourseModule.findOne = (query) => {
        capturedQuery = query;
        // If query asks for Subject A but module belongs to Subject B, return null
        if (query.academicSubjectId.toString() === subjectA.toString()) {
            return { lean: async () => null };
        }
        return { lean: async () => ({ _id: moduleFromSubjectB, academicSubjectId: subjectB, moduleSlug: 'basics' }) };
    };

    try {
        const result = await academicContentResolver.getTopicEditorialContent(
            subjectA,
            'basics',
            'intro'
        );

        assert.ok(capturedQuery);
        assert.strictEqual(capturedQuery.academicSubjectId.toString(), subjectA.toString());
        assert.strictEqual(capturedQuery.moduleSlug, 'basics');
        assert.strictEqual(result.error, 'MODULE_NOT_FOUND');
    } finally {
        CourseModule.findOne = origModFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.7: Topic lookup constrained by moduleId + topicSlug + status: 'Published'
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-007: Topic lookup is strictly constrained by moduleId, topicSlug, and status Published', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics' })
    });

    let capturedTopicQuery = null;
    Topic.findOne = (query) => {
        capturedTopicQuery = query;
        return { lean: async () => null };
    };

    try {
        const result = await academicContentResolver.getTopicEditorialContent(
            subjectId,
            'basics',
            'some-topic'
        );

        assert.ok(capturedTopicQuery);
        assert.strictEqual(capturedTopicQuery.moduleId.toString(), moduleId.toString());
        assert.strictEqual(capturedTopicQuery.topicSlug, 'some-topic');
        assert.strictEqual(capturedTopicQuery.status, 'Published', 'Topic query must filter for status: Published');
        assert.strictEqual(result.error, 'TOPIC_NOT_FOUND');
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.8: Editorial lookup constrained by topicId + status: 'Published'
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-008: Editorial lookup is strictly constrained by topicId (Topic._id) and status Published', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const topicObjectId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;
    const origEdFindOne = EditorialContent.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics' })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: topicObjectId,
            academicSubjectId: subjectId,
            moduleId: moduleId,
            topicSlug: 'intro',
            topicId: '0-1',
            status: 'Published'
        })
    });

    let capturedEdQuery = null;
    EditorialContent.findOne = (query) => {
        capturedEdQuery = query;
        return { lean: async () => null };
    };

    try {
        const result = await academicContentResolver.getTopicEditorialContent(
            subjectId,
            'basics',
            'intro'
        );

        assert.ok(capturedEdQuery);
        assert.strictEqual(capturedEdQuery.topicId.toString(), topicObjectId.toString());
        assert.strictEqual(capturedEdQuery.status, 'Published', 'EditorialContent query must filter for status: Published');
        assert.strictEqual(result.error, 'EDITORIAL_NOT_FOUND');
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
        EditorialContent.findOne = origEdFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.9: Invariant: Topic.academicSubjectId must equal CourseModule.academicSubjectId
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-009: Invariant violation between Topic and CourseModule throws data integrity error', async () => {
    const subjectA = new mongoose.Types.ObjectId();
    const subjectB = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectA, moduleSlug: 'basics' })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: topicId,
            academicSubjectId: subjectB, // Tampered or cross-linked to Subject B!
            moduleId: moduleId,
            topicSlug: 'intro',
            status: 'Published'
        })
    });

    try {
        await assert.rejects(
            async () => {
                await academicContentResolver.getTopicEditorialContent(subjectA, 'basics', 'intro');
            },
            /Data integrity violation/
        );
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.10: Draft Topic is not returned
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-010: Draft Topic is excluded from content tree and topic endpoint', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const origTopicFind = Topic.find;
    const origModFind = CourseModule.find;

    CourseModule.find = () => ({
        sort: () => ({
            lean: async () => [{ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics', title: 'Basics', order: 0 }]
        })
    });

    let queryCapturedInTree = null;
    Topic.find = (query) => {
        queryCapturedInTree = query;
        return {
            sort: () => ({
                select: () => ({
                    lean: async () => [] // Draft topics are filtered out by query { status: 'Published' }
                })
            })
        };
    };

    try {
        const tree = await academicContentResolver.getSubjectContentTree(subjectId);
        assert.strictEqual(queryCapturedInTree.status, 'Published', 'Content tree query must exclude non-published topics');
        assert.strictEqual(tree.modules[0].topics.length, 0);
    } finally {
        CourseModule.find = origModFind;
        Topic.find = origTopicFind;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.11: Archived Topic is not returned
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-011: Archived Topic is rejected with 404', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics' })
    });

    Topic.findOne = (query) => {
        // Query has { status: 'Published' }, so an Archived topic returns null
        return { lean: async () => null };
    };

    try {
        const result = await academicContentResolver.getTopicEditorialContent(
            subjectId,
            'basics',
            'archived-topic'
        );
        assert.strictEqual(result.error, 'TOPIC_NOT_FOUND');
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.12: Published Topic with Draft/Archived EditorialContent is not returned
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-012: Published Topic with Draft EditorialContent returns 404 EDITORIAL_NOT_FOUND', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;
    const origEdFindOne = EditorialContent.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics' })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: topicId,
            academicSubjectId: subjectId,
            moduleId: moduleId,
            topicSlug: 'draft-editorial-topic',
            topicId: '0-2',
            status: 'Published'
        })
    });

    EditorialContent.findOne = (query) => {
        // Since query filters for { status: 'Published' }, a draft editorial returns null
        assert.strictEqual(query.status, 'Published');
        return { lean: async () => null };
    };

    try {
        const result = await academicContentResolver.getTopicEditorialContent(
            subjectId,
            'basics',
            'draft-editorial-topic'
        );
        assert.strictEqual(result.error, 'EDITORIAL_NOT_FOUND');
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
        EditorialContent.findOne = origEdFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.13: EditorialContent from another Topic cannot be returned
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-013: EditorialContent lookup strictly enforces topicId matching Topic._id', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const targetTopicId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;
    const origEdFindOne = EditorialContent.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: moduleId, academicSubjectId: subjectId, moduleSlug: 'basics' })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: targetTopicId,
            academicSubjectId: subjectId,
            moduleId: moduleId,
            topicSlug: 'topic-a',
            topicId: '0-1',
            status: 'Published'
        })
    });

    let queriedTopicId = null;
    EditorialContent.findOne = (query) => {
        queriedTopicId = query.topicId;
        return {
            lean: async () => ({
                topicId: targetTopicId,
                title: 'Topic A Editorial',
                status: 'Published',
                blocks: []
            })
        };
    };

    try {
        await academicContentResolver.getTopicEditorialContent(subjectId, 'basics', 'topic-a');
        assert.strictEqual(queriedTopicId.toString(), targetTopicId.toString(), 'EditorialContent query must use exact Topic._id');
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
        EditorialContent.findOne = origEdFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.14: Unknown module/topic returns 404 without exposing other subject data
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-014: Unknown module or topic returns descriptive 404 without leaking other modules', async () => {
    const subjectId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    CourseModule.findOne = () => ({ lean: async () => null });

    try {
        const res = await academicContentResolver.getTopicEditorialContent(subjectId, 'invalid-module', 'intro');
        assert.strictEqual(res.error, 'MODULE_NOT_FOUND');
        assert.strictEqual(res.subject, undefined);
    } finally {
        CourseModule.findOne = origModFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.15: Tree endpoint does not return editorial blocks or sections
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-015: Tree endpoint strictly excludes blocks and sections from payload', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const modId = new mongoose.Types.ObjectId();

    const origModFind = CourseModule.find;
    const origTopicFind = Topic.find;

    CourseModule.find = () => ({
        sort: () => ({
            lean: async () => [{ _id: modId, academicSubjectId: subjectId, moduleSlug: 'basics', title: 'Basics', order: 0 }]
        })
    });

    Topic.find = () => ({
        sort: () => ({
            select: () => ({
                lean: async () => [
                    {
                        _id: new mongoose.Types.ObjectId(),
                        academicSubjectId: subjectId,
                        moduleId: modId,
                        topicSlug: 't1',
                        topicId: '0-1',
                        title: 'T1',
                        order: 0,
                        status: 'Published',
                        blocks: [{ type: 'paragraph', text: 'Should be stripped' }],
                        sections: [{ id: 's1', title: 'Should be stripped' }]
                    }
                ]
            })
        })
    });

    try {
        const tree = await academicContentResolver.getSubjectContentTree(subjectId);
        const topicInTree = tree.modules[0].topics[0];
        assert.strictEqual(topicInTree.blocks, undefined, 'Blocks must never be present in content tree');
        assert.strictEqual(topicInTree.sections, undefined, 'Sections must never be present in content tree');
        assert.strictEqual(topicInTree.topicId, '0-1', 'topicId must be preserved for progress compatibility');
    } finally {
        CourseModule.find = origModFind;
        Topic.find = origTopicFind;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4.16: Topic endpoint returns expected structured editorial data
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-016: Topic endpoint returns complete structured editorial data with blocks', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const modId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;
    const origEdFindOne = EditorialContent.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({ _id: modId, academicSubjectId: subjectId, moduleSlug: 'basics', title: '0. Basics' })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: topicId,
            academicSubjectId: subjectId,
            moduleId: modId,
            topicSlug: 'intro',
            topicId: '0-1',
            title: '0.1 Introduction',
            order: 0,
            status: 'Published'
        })
    });

    EditorialContent.findOne = () => ({
        lean: async () => ({
            topicId,
            title: '0.1 Introduction',
            version: 1,
            status: 'Published',
            sections: [{ id: 'sec1', title: 'Intro' }],
            blocks: [
                { type: 'heading', level: 1, text: 'Hello' },
                { type: 'paragraph', text: 'Welcome to C programming' }
            ],
            publishedAt: new Date()
        })
    });

    try {
        const data = await academicContentResolver.getTopicEditorialContent(subjectId, 'basics', 'intro');
        assert.strictEqual(data.editorial.title, '0.1 Introduction');
        assert.strictEqual(data.editorial.version, 1);
        assert.strictEqual(data.editorial.status, 'Published');
        assert.strictEqual(data.editorial.blocks.length, 2);
        assert.strictEqual(EditorialContent.validateEditorialBlocks(data.editorial.blocks), true);
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
        EditorialContent.findOne = origEdFindOne;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5: Test Actual Route Mounting and Server Wiring
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-017: Verify /api/v2/academic-content is mounted in server.js behind auth middleware', () => {
    // 1. Verify server.js contains the authoritative route mount
    const serverSourcePath = path.resolve(__dirname, '../../server.js');
    const serverSource = fs.readFileSync(serverSourcePath, 'utf8');

    const mountPattern = /app\.use\(\s*['"]\/api\/v2\/academic-content['"]\s*,\s*require\(\s*['"]\.\/routes\/academicContentRoutes['"]\s*\)\s*\)/;
    assert.ok(mountPattern.test(serverSource), 'server.js must mount /api/v2/academic-content');

    // 2. Verify academicContentRoutes router stack has both authentication and route handlers
    const router = require('../../routes/academicContentRoutes');
    const stack = router.stack || [];

    // First layer should be authenticateStudent
    const authMiddlewareLayer = stack.find(l => l.name === 'authenticateStudent');
    assert.ok(authMiddlewareLayer, 'Router must include authenticateStudent middleware');

    // Second layer should be requireActiveAccount
    const activeAccountLayer = stack.find(l => l.name === 'requireActiveAccount');
    assert.ok(activeAccountLayer, 'Router must include requireActiveAccount middleware');

    // Route layers
    const registeredRoutes = stack
        .filter(l => l.route)
        .map(l => l.route.path);

    assert.ok(registeredRoutes.includes('/:subjectSlug'), 'Must register /:subjectSlug');
    assert.ok(registeredRoutes.includes('/:subjectSlug/:moduleSlug/:topicSlug'), 'Must register /:subjectSlug/:moduleSlug/:topicSlug');
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 6: Response Field Exposure Audit
// ─────────────────────────────────────────────────────────────────────────────
test('CONTENT-SEC-018: Response field exposure audit guarantees no MongoDB internals or secrets leak', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const modId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();

    const origModFindOne = CourseModule.findOne;
    const origTopicFindOne = Topic.findOne;
    const origEdFindOne = EditorialContent.findOne;

    CourseModule.findOne = () => ({
        lean: async () => ({
            _id: modId,
            academicSubjectId: subjectId,
            moduleSlug: 'basics',
            title: 'Basics',
            __v: 0,
            internalAuditLog: 'secret-audit'
        })
    });

    Topic.findOne = () => ({
        lean: async () => ({
            _id: topicId,
            academicSubjectId: subjectId,
            moduleId: modId,
            topicSlug: 'intro',
            topicId: '0-1',
            title: 'Introduction',
            order: 0,
            status: 'Published',
            __v: 0,
            createdByAdmin: 'admin-id-123'
        })
    });

    EditorialContent.findOne = () => ({
        lean: async () => ({
            _id: new mongoose.Types.ObjectId(),
            topicId,
            title: 'Introduction',
            version: 1,
            status: 'Published',
            sections: [{ id: 'sec1', title: 'Intro', internalNote: 'dont show' }],
            blocks: [{ type: 'paragraph', text: 'Clean content' }],
            __v: 0,
            internalFlags: { reviewedBy: 'senior-editor' }
        })
    });

    try {
        const response = await academicContentResolver.getTopicEditorialContent(
            subjectId,
            'basics',
            'intro',
            { id: subjectId.toString(), code: 'PLC5', name: 'Introduction to C Programming', slug: 'c-prog' }
        );

        // Subject check
        assert.deepStrictEqual(Object.keys(response.subject).sort(), ['code', 'id', 'name', 'slug']);

        // Module check
        assert.deepStrictEqual(Object.keys(response.module).sort(), ['id', 'moduleId', 'moduleNumber', 'moduleSlug', 'name', 'title']);
        assert.strictEqual(response.module.internalAuditLog, undefined);
        assert.strictEqual(response.module.__v, undefined);

        // Topic check
        assert.deepStrictEqual(Object.keys(response.topic).sort(), ['id', 'order', 'status', 'title', 'topicId', 'topicSlug']);
        assert.strictEqual(response.topic.createdByAdmin, undefined);
        assert.strictEqual(response.topic.__v, undefined);

        // Editorial check
        assert.deepStrictEqual(Object.keys(response.editorial).sort(), ['blocks', 'publishedAt', 'sections', 'status', 'title', 'version']);
        assert.strictEqual(response.editorial._id, undefined);
        assert.strictEqual(response.editorial.__v, undefined);
        assert.strictEqual(response.editorial.internalFlags, undefined);

        // Sections check
        assert.deepStrictEqual(Object.keys(response.editorial.sections[0]).sort(), ['id', 'title']);
        assert.strictEqual(response.editorial.sections[0].internalNote, undefined);
    } finally {
        CourseModule.findOne = origModFindOne;
        Topic.findOne = origTopicFindOne;
        EditorialContent.findOne = origEdFindOne;
    }
});
