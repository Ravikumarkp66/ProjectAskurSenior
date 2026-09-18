/**
 * CIE API Test Suite
 * 
 * Exercises the actual HTTP endpoints of the CIE Analyzer:
 * - Route registration (/api/v2/auth/profile/cie)
 * - Authentication middleware (authenticateStudent, requireActiveAccount)
 * - Controller validation and execution (authV2Controller)
 * - Real service calculation (cieRulesEngine)
 * - Database retrieval & persistence (StudentRegisteredSubject, StudentCieRecord)
 * - HTTP response status codes and body contracts
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = (process.env.API_BASE_URL || process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const TEST_USN = (process.env.E2E_TEST_USN || 'STAGING01').toUpperCase().trim();
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!';

// Foreign subject ID belonging to a different student in the database
const FOREIGN_SUBJECT_ID = '6a58b63ea7247a773f56a757';

let authToken = null;
let testSubjectId = null;

async function authenticateTestUser() {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usn: TEST_USN,
            password: TEST_PASSWORD,
            branch: 'CS'
        })
    });

    if (!loginRes.ok) {
        throw new Error(`Authentication failed for ${TEST_USN}: ${loginRes.status} ${await loginRes.text()}`);
    }

    const data = await loginRes.json();
    return data.token;
}

test('CIE HTTP API Contract Suite', async (t) => {
    // Authenticate before running tests
    t.before(async () => {
        authToken = await authenticateTestUser();
        assert.ok(authToken, 'Expected valid JWT token from login endpoint');

        // Retrieve initial dashboard to resolve a registered subject for the test student
        const dashRes = await fetch(`${BASE_URL}/api/v2/auth/profile/cie?semester=4`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const dashData = await dashRes.json();

        if (dashData.data?.subjects?.length > 0) {
            testSubjectId = dashData.data.subjects[0].registeredSubjectId;
        }
    });

    await t.test('CIE-API-001: Successful authenticated CIE dashboard retrieval (GET)', async () => {
        const res = await fetch(`${BASE_URL}/api/v2/auth/profile/cie?semester=4`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        assert.strictEqual(res.status, 200, 'Expected HTTP 200 for authenticated GET /profile/cie');

        const body = await res.json();
        assert.strictEqual(body.success, true);
        assert.strictEqual(body.message, 'CIE dashboard data retrieved successfully');
        assert.ok(body.data, 'Expected data payload in response');
        assert.strictEqual(body.data.semester, 4);
        assert.ok(Array.isArray(body.data.availableSemesters), 'Expected availableSemesters array');
        assert.ok(body.data.summaryStats, 'Expected summaryStats object');
        assert.ok(typeof body.data.summaryStats.totalSubjects === 'number');
        assert.ok(Array.isArray(body.data.subjects), 'Expected subjects array');
    });

    await t.test('CIE-API-002: Successful authenticated CIE save/update (PUT)', async () => {
        assert.ok(testSubjectId, 'Test requires a valid registeredSubjectId for the student');

        const putRes = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                registeredSubjectId: testSubjectId,
                semester: 4,
                rawMarks: {
                    test1: 45,
                    test2: 45,
                    quiz1: 15,
                    quiz2: 15,
                    assignment1: 15,
                    assignment2: 15,
                    labRecord: 300,
                    labTest: 12
                }
            })
        });

        assert.strictEqual(putRes.status, 200, 'Expected HTTP 200 for valid PUT /profile/cie');

        const body = await putRes.json();
        assert.strictEqual(body.success, true);
        assert.strictEqual(body.message, 'CIE marks saved and recalculated successfully');
        assert.ok(body.data, 'Expected data payload in response');
        assert.strictEqual(body.data.registeredSubjectId, testSubjectId);
        assert.strictEqual(body.data.evaluationType, 'IPCC');
        assert.strictEqual(body.data.isEligible, true);
        assert.strictEqual(body.data.status, 'ELIGIBLE');
        assert.strictEqual(body.data.totalCie, 42.16);
        assert.strictEqual(body.data.contributions.theoryTotal, 21.3);
        assert.strictEqual(body.data.contributions.practicalTotal, 20.86);
        assert.ok(body.data.updatedAt, 'Expected updatedAt timestamp');
    });

    await t.test('CIE-API-003: Unauthenticated access is rejected (401)', async () => {
        // Request without Authorization header
        const resNoAuth = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'GET'
        });

        assert.strictEqual(resNoAuth.status, 401, 'Expected HTTP 401 for unauthenticated request');
        const bodyNoAuth = await resNoAuth.json();
        assert.strictEqual(bodyNoAuth.success, false);
        assert.strictEqual(bodyNoAuth.message, 'Access token is required');

        // Request with invalid token
        const resBadToken = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid_token_xyz_123' }
        });

        assert.strictEqual(resBadToken.status, 401, 'Expected HTTP 401 for invalid token');
        const bodyBadToken = await resBadToken.json();
        assert.strictEqual(bodyBadToken.success, false);
        assert.match(bodyBadToken.message, /Invalid|expired|jwt/i);
    });

    await t.test('CIE-API-004: Invalid request validation on save/update (400)', async () => {
        // Missing registeredSubjectId
        const res = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                semester: 4,
                rawMarks: { test1: 45 }
            })
        });

        assert.strictEqual(res.status, 400, 'Expected HTTP 400 for missing registeredSubjectId');
        const body = await res.json();
        assert.strictEqual(body.success, false);
        assert.strictEqual(body.message, 'registeredSubjectId is required');
    });

    await t.test('CIE-API-005: Cross-student resource isolation enforced over HTTP (404)', async () => {
        // Student attempts to update a subject that belongs to a different student
        const res = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                registeredSubjectId: FOREIGN_SUBJECT_ID,
                semester: 1,
                rawMarks: { test1: 45 }
            })
        });

        assert.strictEqual(res.status, 404, 'Expected HTTP 404 when updating non-owned subject');
        const body = await res.json();
        assert.strictEqual(body.success, false);
        assert.strictEqual(body.message, 'Registered subject not found');
    });

    await t.test('CIE-API-006: Partial marks workflow updates status to PARTIAL over HTTP', async () => {
        assert.ok(testSubjectId, 'Test requires a valid registeredSubjectId for the student');

        const putRes = await fetch(`${BASE_URL}/api/v2/auth/profile/cie`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                registeredSubjectId: testSubjectId,
                semester: 4,
                rawMarks: {
                    test1: 45,
                    test2: 45,
                    labRecord: 300
                    // Quizzes, assignments, and labTest omitted (3/8 entered, totalCie = 28.16 >= 20)
                }
            })
        });

        assert.strictEqual(putRes.status, 200, 'Expected HTTP 200 for partial marks save');

        const body = await putRes.json();
        assert.strictEqual(body.success, true);
        assert.strictEqual(body.data.status, 'PARTIAL');
        assert.strictEqual(body.data.isEligible, true);
        assert.strictEqual(body.data.totalEnteredCount, 3);
        assert.strictEqual(body.data.totalPossibleSubcomponents, 8);
    });
});
