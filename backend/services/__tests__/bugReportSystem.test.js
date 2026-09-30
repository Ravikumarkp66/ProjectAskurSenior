const test = require('node:test');
const assert = require('node:assert/strict');
const { createBug, listBugs, updateBugStatus, deleteBug } = require('../../controllers/bugController');
const BugReport = require('../../models/BugReport');
const StudentAccount = require('../../models/StudentAccount');
const User = require('../../models/User');

test('Bug Report System Suite', async (t) => {
    await t.test('1. createBug rejects missing required fields', async () => {
        const mockRes = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.body = data;
                return res;
            };
            return res;
        };

        // Missing title
        const res1 = mockRes();
        await createBug({ body: { description: 'desc', pageUrl: 'https://askursenior.in' } }, res1);
        assert.strictEqual(res1.statusCode, 400);
        assert.strictEqual(res1.body.error, 'Title is required');

        // Missing description
        const res2 = mockRes();
        await createBug({ body: { title: 'Something broken', pageUrl: 'https://askursenior.in' } }, res2);
        assert.strictEqual(res2.statusCode, 400);
        assert.strictEqual(res2.body.error, 'Description is required');

        // Missing pageUrl
        const res3 = mockRes();
        await createBug({ body: { title: 'Something broken', description: 'desc' } }, res3);
        assert.strictEqual(res3.statusCode, 400);
        assert.strictEqual(res3.body.error, 'Page URL is required');
    });

    await t.test('2. updateBugStatus validates status enum', async () => {
        const mockRes = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.body = data;
                return res;
            };
            return res;
        };

        const res = mockRes();
        await updateBugStatus({ params: { id: 'invalid-id' }, body: { status: 'invalid_status' } }, res);
        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /Status must be one of/);
    });

    await t.test('3. BugReport model schema defaults and enum verification', () => {
        const schema = BugReport.schema;
        const statusField = schema.path('status');
        const problemTypeField = schema.path('problemType');

        assert.ok(statusField, 'status field must exist in BugReport schema');
        assert.deepStrictEqual(
            statusField.enumValues.sort(),
            ['closed', 'in_progress', 'open', 'resolved'].sort(),
            'status must support open, in_progress, resolved, closed'
        );

        assert.ok(problemTypeField, 'problemType field must exist in BugReport schema');
        assert.ok(problemTypeField.enumValues.includes('UI / Design'));
        assert.ok(problemTypeField.enumValues.includes('Academic data'));
        assert.ok(problemTypeField.enumValues.includes('Feature not working'));
        assert.ok(problemTypeField.enumValues.includes('Login / Account'));
        assert.ok(problemTypeField.enumValues.includes('Performance'));
        assert.ok(problemTypeField.enumValues.includes('Other'));

        assert.ok(schema.path('contactEmail'), 'contactEmail field must exist in BugReport schema');
        assert.ok(schema.path('adminNotes'), 'adminNotes field must exist in BugReport schema');
        assert.ok(schema.path('resolvedAt'), 'resolvedAt field must exist in BugReport schema');
        assert.ok(schema.path('resolvedBy'), 'resolvedBy field must exist in BugReport schema');
    });

    await t.test('4. Plus vs Free vs Guest vs Anonymous resolution logic contract', () => {
        const { resolvePlusAccess } = require('../plusAccessService');

        // Plus student (active subscription)
        const plusStudent = {
            _id: 'student_plus_1',
            name: 'Priya Sharma',
            email: 'priya@sit.ac.in',
            isPlus: true,
            role: 'student'
        };
        const plusResolved = resolvePlusAccess(plusStudent);
        assert.strictEqual(plusResolved.plan, 'PLUS');
        assert.strictEqual(plusResolved.hasPlusAccess, true);

        // Free student (standard account)
        const freeStudent = {
            _id: 'student_free_1',
            name: 'Rahul Verma',
            email: 'rahul@sit.ac.in',
            isPlus: false,
            role: 'student'
        };
        const freeResolved = resolvePlusAccess(freeStudent);
        assert.strictEqual(freeResolved.plan, 'FREE');
        assert.strictEqual(freeResolved.hasPlusAccess, false);

        // Guest / Unauthenticated (null user)
        const guestResolved = resolvePlusAccess(null);
        assert.strictEqual(guestResolved.plan, 'FREE');
        assert.strictEqual(guestResolved.hasPlusAccess, false);
        assert.strictEqual(guestResolved.source, 'NONE');
    });
});

