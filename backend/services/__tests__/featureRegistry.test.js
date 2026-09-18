const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Feature = require('../../models/Feature');
const AdminLog = require('../../models/AdminLog');
const featureRegistryService = require('../featureRegistryService');
const { resolvePlusAccess } = require('../plusAccessService');

// ============================================================================
// STEP-04 TEST SUITE: Feature Registry & Premium Feature Configuration
// ============================================================================

test('FEATURE-001: Feature Mongoose Model schema validation and indexes', () => {
    const keyPath = Feature.schema.path('key');
    assert.ok(keyPath, 'Feature model must define key');
    assert.strictEqual(keyPath.instance, 'String');

    const namePath = Feature.schema.path('name');
    assert.ok(namePath, 'Feature model must define name');

    const categoryPath = Feature.schema.path('category');
    assert.ok(categoryPath, 'Feature model must define category');
    assert.deepStrictEqual(categoryPath.enumValues, ['ACADEMIC', 'CONTENT', 'CAREER', 'TOOLS', 'COMMUNITY']);

    const accessPath = Feature.schema.path('access');
    assert.ok(accessPath, 'Feature model must define access');
    assert.deepStrictEqual(accessPath.enumValues, ['FREE', 'PLUS', 'DISABLED']);

    const enabledPath = Feature.schema.path('enabled');
    assert.ok(enabledPath, 'Feature model must define enabled');
    assert.strictEqual(enabledPath.instance, 'Boolean');
    assert.strictEqual(enabledPath.defaultValue, true);

    const previewPath = Feature.schema.path('previewEnabled');
    assert.ok(previewPath, 'Feature model must define previewEnabled');
    assert.strictEqual(previewPath.instance, 'Boolean');
    assert.strictEqual(previewPath.defaultValue, true);
});

test('FEATURE-002: Initial Feature Registry inventory completeness and key uniqueness', () => {
    const inventory = featureRegistryService.INITIAL_FEATURE_REGISTRY;
    assert.ok(Array.isArray(inventory), 'INITIAL_FEATURE_REGISTRY must be an array');
    assert.ok(inventory.length >= 15, `Expected at least 15 features, got ${inventory.length}`);

    // Verify key uniqueness
    const keysSeen = new Set();
    for (const item of inventory) {
        assert.ok(item.key, 'Every feature must have a key');
        assert.ok(!keysSeen.has(item.key), `Duplicate feature key detected: ${item.key}`);
        keysSeen.add(item.key);

        assert.ok(item.name, `Feature ${item.key} must have a name`);
        assert.ok(['ACADEMIC', 'CONTENT', 'CAREER', 'TOOLS', 'COMMUNITY'].includes(item.category), `Invalid category on ${item.key}`);
        assert.ok(['FREE', 'PLUS', 'DISABLED'].includes(item.access), `Invalid access tier on ${item.key}`);
        assert.strictEqual(typeof item.enabled, 'boolean', `enabled must be boolean on ${item.key}`);
        assert.strictEqual(typeof item.previewEnabled, 'boolean', `previewEnabled must be boolean on ${item.key}`);
    }

    // Verify core known features are present
    const expectedKeys = [
        'attendance_tracker',
        'cie_analyzer',
        'timetable',
        'sgpa_calculator',
        'cgpa_calculator',
        'academic_summary',
        'my_subjects',
        'academic_calendar',
        'year_back_predictor',
        'branch_change_predictor',
        'materials',
        'quizzes',
        'blogs',
        'interview_experiences',
        'roadmaps',
        'coding_playground',
        'campus_hub',
        'sessions',
        'announcements'
    ];

    for (const expectedKey of expectedKeys) {
        assert.ok(keysSeen.has(expectedKey), `Missing expected feature in registry: ${expectedKey}`);
    }
});

test('FEATURE-003: Access Evaluation for FREE features allows all users unconditionally', async () => {
    // Mock getFeatureByKey / findOne by stubbing Feature.findOne
    const origFindOne = Feature.findOne;
    Feature.findOne = (query) => ({
        lean: async () => ({
            key: query.key,
            name: 'Study Materials & Notes',
            category: 'CONTENT',
            access: 'FREE',
            enabled: true,
            previewEnabled: false
        })
    });

    try {
        // 1. Normal student
        const normalUser = { _id: 'user_norm', role: 'student', isAdmin: false, isTestUser: false };
        const resNormal = await featureRegistryService.canAccessFeature(normalUser, 'materials');
        assert.strictEqual(resNormal.allowed, true);
        assert.strictEqual(resNormal.reason, 'FREE_FEATURE');
        assert.strictEqual(resNormal.access, 'FREE');

        // 2. Unauthenticated user
        const resUnauth = await featureRegistryService.canAccessFeature(null, 'materials');
        assert.strictEqual(resUnauth.allowed, true);
        assert.strictEqual(resUnauth.reason, 'FREE_FEATURE');
        assert.strictEqual(resUnauth.access, 'FREE');

        // 3. Test user
        const testUser = { _id: 'user_test', isTestUser: true };
        const resTest = await featureRegistryService.canAccessFeature(testUser, 'materials');
        assert.strictEqual(resTest.allowed, true);
        assert.strictEqual(resTest.reason, 'FREE_FEATURE');

        // 4. Admin user
        const adminUser = { _id: 'user_admin', isAdmin: true };
        const resAdmin = await featureRegistryService.canAccessFeature(adminUser, 'materials');
        assert.strictEqual(resAdmin.allowed, true);
        assert.strictEqual(resAdmin.reason, 'FREE_FEATURE');
    } finally {
        Feature.findOne = origFindOne;
    }
});

test('FEATURE-004: Access Evaluation for PLUS features grants access to Admins and Test Users, blocks Free users', async () => {
    const origFindOne = Feature.findOne;
    Feature.findOne = (query) => ({
        lean: async () => ({
            key: query.key,
            name: 'Attendance Tracker',
            category: 'ACADEMIC',
            access: 'PLUS',
            enabled: true,
            previewEnabled: true
        })
    });

    try {
        // 1. Normal free user -> blocked with REQUIRES_PLUS and previewEnabled: true
        const normalUser = { _id: 'norm_1', role: 'student', isAdmin: false, isTestUser: false };
        const resNormal = await featureRegistryService.canAccessFeature(normalUser, 'attendance_tracker');
        assert.strictEqual(resNormal.allowed, false);
        assert.strictEqual(resNormal.reason, 'REQUIRES_PLUS');
        assert.strictEqual(resNormal.access, 'PLUS');
        assert.strictEqual(resNormal.plan, 'FREE');
        assert.strictEqual(resNormal.previewEnabled, true);

        // 2. Unauthenticated user -> blocked with REQUIRES_PLUS
        const resUnauth = await featureRegistryService.canAccessFeature(null, 'attendance_tracker');
        assert.strictEqual(resUnauth.allowed, false);
        assert.strictEqual(resUnauth.reason, 'REQUIRES_PLUS');
        assert.strictEqual(resUnauth.previewEnabled, true);

        // 3. Test user -> granted with source TEST_USER
        const testUser = { _id: 'test_1', isTestUser: true };
        const resTest = await featureRegistryService.canAccessFeature(testUser, 'attendance_tracker');
        assert.strictEqual(resTest.allowed, true);
        assert.strictEqual(resTest.reason, 'TEST_USER');
        assert.strictEqual(resTest.access, 'PLUS');
        assert.strictEqual(resTest.plan, 'PLUS');

        // 4. Admin user -> granted with source ADMIN
        const adminUser = { _id: 'admin_1', isAdmin: true, role: 'admin' };
        const resAdmin = await featureRegistryService.canAccessFeature(adminUser, 'attendance_tracker');
        assert.strictEqual(resAdmin.allowed, true);
        assert.strictEqual(resAdmin.reason, 'ADMIN');
        assert.strictEqual(resAdmin.access, 'PLUS');
        assert.strictEqual(resAdmin.plan, 'PLUS');
    } finally {
        Feature.findOne = origFindOne;
    }
});

test('FEATURE-005: Access Evaluation for DISABLED features blocks everyone unconditionally', async () => {
    const origFindOne = Feature.findOne;
    Feature.findOne = (query) => ({
        lean: async () => ({
            key: query.key,
            name: 'Coding Playground',
            category: 'TOOLS',
            access: 'DISABLED',
            enabled: true,
            previewEnabled: false
        })
    });

    try {
        // Admin is blocked when feature is DISABLED
        const adminUser = { _id: 'admin_1', isAdmin: true };
        const resAdmin = await featureRegistryService.canAccessFeature(adminUser, 'coding_playground');
        assert.strictEqual(resAdmin.allowed, false);
        assert.strictEqual(resAdmin.reason, 'FEATURE_DISABLED');
        assert.strictEqual(resAdmin.access, 'DISABLED');

        // Test user is blocked
        const testUser = { _id: 'test_1', isTestUser: true };
        const resTest = await featureRegistryService.canAccessFeature(testUser, 'coding_playground');
        assert.strictEqual(resTest.allowed, false);
        assert.strictEqual(resTest.reason, 'FEATURE_DISABLED');

        // Normal user is blocked
        const normalUser = { _id: 'norm_1' };
        const resNormal = await featureRegistryService.canAccessFeature(normalUser, 'coding_playground');
        assert.strictEqual(resNormal.allowed, false);
        assert.strictEqual(resNormal.reason, 'FEATURE_DISABLED');
    } finally {
        Feature.findOne = origFindOne;
    }
});

test('FEATURE-006: Feature kill switch (enabled: false) blocks access regardless of access tier', async () => {
    const origFindOne = Feature.findOne;
    Feature.findOne = (query) => ({
        lean: async () => ({
            key: query.key,
            name: 'Interview Experiences',
            category: 'CAREER',
            access: 'FREE', // Even though access is FREE
            enabled: false,  // Kill switch is active
            previewEnabled: false
        })
    });

    try {
        const res = await featureRegistryService.canAccessFeature({ isAdmin: true }, 'interview_experiences');
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.reason, 'FEATURE_DISABLED');
        assert.strictEqual(res.access, 'DISABLED');
    } finally {
        Feature.findOne = origFindOne;
    }
});

test('FEATURE-007: updateFeature validation rejects invalid access tier and non-boolean flags', async () => {
    const origFindOne = Feature.findOne;
    Feature.findOne = () => ({
        key: 'attendance_tracker',
        name: 'Attendance Tracker',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        save: async () => {}
    });

    try {
        // 1. Invalid access tier
        await assert.rejects(
            async () => {
                await featureRegistryService.updateFeature('attendance_tracker', { access: 'GOLD_TIER' });
            },
            {
                message: /Invalid access tier/
            }
        );

        // 2. Non-boolean previewEnabled
        await assert.rejects(
            async () => {
                await featureRegistryService.updateFeature('attendance_tracker', { previewEnabled: 'yes' });
            },
            {
                message: /previewEnabled must be a boolean/
            }
        );

        // 3. Non-boolean enabled
        await assert.rejects(
            async () => {
                await featureRegistryService.updateFeature('attendance_tracker', { enabled: 123 });
            },
            {
                message: /enabled must be a boolean/
            }
        );
    } finally {
        Feature.findOne = origFindOne;
    }
});

test('FEATURE-008: AdminLog schema supports FEATURE_UPDATED action', () => {
    const actionEnum = AdminLog.schema.path('action').enumValues;
    assert.ok(actionEnum.includes('FEATURE_UPDATED'), 'AdminLog must include FEATURE_UPDATED');
});
