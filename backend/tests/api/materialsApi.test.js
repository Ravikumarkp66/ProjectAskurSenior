/**
 * Materials Section API & Security Test Suite
 * 
 * Layer: API & Security Contract
 * Framework: node:test + node:assert/strict
 * 
 * Verifies:
 * - Document search & summary contract (MAT-API-001)
 * - Regex & special-character query robustness (MAT-API-002)
 * - Download endpoint & counter handling (MAT-API-003)
 * - 404 response for non-existent document download (MAT-API-004)
 * - 401 on unauthenticated bookmark & valid toggle when authenticated (MAT-API-005)
 * - @security: 403 on non-admin document patch (MAT-API-006)
 * - @security: 403 on non-admin document deletion (MAT-API-007)
 * - @security: 403 on non-admin document approval (MAT-API-008)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = (process.env.API_BASE_URL || process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const TEST_USN = (process.env.E2E_TEST_USN || 'STAGING01').toUpperCase().trim();
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!';

let studentToken = null;
let sampleDocumentId = null;

async function loginStudent() {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usn: TEST_USN,
            password: TEST_PASSWORD,
            branch: 'CS'
        })
    });

    if (!res.ok) {
        throw new Error(`Authentication failed for ${TEST_USN}: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.token;
}

test('Materials Section HTTP API & Security Suite', async (suite) => {

    suite.before(async () => {
        studentToken = await loginStudent();
        assert.ok(studentToken, 'Expected valid JWT token for student STAGING01');

        // Fetch published documents to resolve an existing sample document ID
        const searchRes = await fetch(`${BASE_URL}/api/documents/search`);
        assert.strictEqual(searchRes.status, 200, 'Search endpoint should be accessible');
        const searchData = await searchRes.json();
        const docs = searchData.documents || searchData || [];
        assert.ok(docs.length > 0, 'Expected at least one document in database for API tests');
        sampleDocumentId = docs[0]._id;
    });

    // -------------------------------------------------------------
    // MAT-API-001: Document search and summary schema contract
    // -------------------------------------------------------------
    await suite.test('MAT-API-001: GET /api/documents/search returns documents and summary counts', async () => {
        const res = await fetch(`${BASE_URL}/api/documents/search`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data.documents), 'Response must contain documents array');
        assert.ok(data.summary, 'Response must contain summary object');
        assert.strictEqual(typeof data.summary.total, 'number', 'summary.total must be numeric');
        assert.strictEqual(typeof data.summary.notes, 'number', 'summary.notes must be numeric');
        assert.strictEqual(typeof data.summary.see, 'number', 'summary.see must be numeric');
        assert.strictEqual(typeof data.summary.internals, 'number', 'summary.internals must be numeric');
        assert.strictEqual(typeof data.summary.others, 'number', 'summary.others must be numeric');

        // Validate first document schema fields
        const doc = data.documents[0];
        assert.ok(doc._id, 'Document must have _id');
        assert.ok(doc.title || doc.originalName || doc.fileName, 'Document must have a title or file name');
        assert.strictEqual(typeof doc.fileSize, 'number', 'Document must have numeric fileSize');
        assert.ok(doc.createdAt, 'Document must have createdAt timestamp');
    });

    // -------------------------------------------------------------
    // MAT-API-002: Regex & special-character query robustness
    // -------------------------------------------------------------
    await suite.test('MAT-API-002: GET /api/documents/search safely handles regex metacharacters', async () => {
        const metacharQueries = ['C++', '[AI]', 'Maths (1st)', 'Notes.*', '(?=.*)'];

        for (const q of metacharQueries) {
            const res = await fetch(`${BASE_URL}/api/documents/search?q=${encodeURIComponent(q)}`);
            assert.strictEqual(
                res.status,
                200,
                `Query with special characters "${q}" must return HTTP 200 without regex engine crash`
            );
            const data = await res.json();
            assert.ok(Array.isArray(data.documents || data), `Result for "${q}" must return valid array`);
        }
    });

    // -------------------------------------------------------------
    // MAT-API-003: Download link generation and valid structure
    // -------------------------------------------------------------
    await suite.test('MAT-API-003: GET /api/documents/:id/download returns download link', async () => {
        assert.ok(sampleDocumentId, 'Precondition failed: sampleDocumentId missing');

        const res = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}/download`);
        assert.strictEqual(res.status, 200, 'Download link request must return HTTP 200');

        const data = await res.json();
        assert.ok(data.downloadUrl, 'Response must provide downloadUrl');
        assert.ok(typeof data.downloadUrl === 'string', 'downloadUrl must be string');
    });

    // -------------------------------------------------------------
    // MAT-API-004: Non-existent document ID handling
    // -------------------------------------------------------------
    await suite.test('MAT-API-004: GET /api/documents/:id/download returns 404 for invalid ID', async () => {
        const nonExistentId = '600000000000000000000000';
        const res = await fetch(`${BASE_URL}/api/documents/${nonExistentId}/download`);
        assert.strictEqual(res.status, 404, 'Expected HTTP 404 for non-existent document');
        const data = await res.json();
        assert.strictEqual(data.error, 'Document not found');
    });

    // -------------------------------------------------------------
    // MAT-API-005: Bookmark authentication requirement & toggle
    // -------------------------------------------------------------
    await suite.test('MAT-API-005: POST /api/documents/:id/bookmark enforces auth and toggles cleanly', async () => {
        assert.ok(sampleDocumentId, 'Precondition failed: sampleDocumentId missing');

        // 1. Unauthenticated request should be rejected with 401
        const unauthRes = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}/bookmark`, {
            method: 'POST'
        });
        assert.strictEqual(unauthRes.status, 401, 'Unauthenticated bookmark request must return HTTP 401');

        // 2. Authenticated bookmark toggle: ON
        const bookmarkOnRes = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });
        assert.strictEqual(bookmarkOnRes.status, 200, 'Authenticated bookmark request must return HTTP 200');
        const onData = await bookmarkOnRes.json();
        assert.ok(Array.isArray(onData.bookmarks), 'Expected bookmarks array in response');
        assert.ok(onData.bookmarks.includes(sampleDocumentId), 'Document ID must be in bookmarks list');

        // 3. Authenticated bookmark toggle: OFF (cleanup)
        const bookmarkOffRes = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });
        assert.strictEqual(bookmarkOffRes.status, 200);
        const offData = await bookmarkOffRes.json();
        assert.ok(!offData.bookmarks.includes(sampleDocumentId), 'Document ID must be removed on second toggle');
    });

    // -------------------------------------------------------------
    // MAT-API-006: Security - Reject non-admin document patch
    // -------------------------------------------------------------
    await suite.test('MAT-API-006: PATCH /api/documents/:id rejects non-admin with 403 [@security]', async () => {
        assert.ok(sampleDocumentId, 'Precondition failed: sampleDocumentId missing');

        const res = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${studentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Malicious Title Tamper Attempt'
            })
        });

        assert.strictEqual(res.status, 403, 'Non-admin patch must be rejected with HTTP 403 Forbidden');
        const data = await res.json();
        assert.strictEqual(data.error, 'Admin access required');
    });

    // -------------------------------------------------------------
    // MAT-API-007: Security - Reject non-admin document deletion
    // -------------------------------------------------------------
    await suite.test('MAT-API-007: DELETE /api/documents/:id rejects non-admin with 403 [@security]', async () => {
        assert.ok(sampleDocumentId, 'Precondition failed: sampleDocumentId missing');

        const res = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });

        assert.strictEqual(res.status, 403, 'Non-admin delete must be rejected with HTTP 403 Forbidden');
        const data = await res.json();
        assert.strictEqual(data.error, 'Admin access required');
    });

    // -------------------------------------------------------------
    // MAT-API-008: Security - Reject non-admin document approval
    // -------------------------------------------------------------
    await suite.test('MAT-API-008: POST /api/documents/:id/approve rejects non-admin with 403 [@security]', async () => {
        assert.ok(sampleDocumentId, 'Precondition failed: sampleDocumentId missing');

        const res = await fetch(`${BASE_URL}/api/documents/${sampleDocumentId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });

        assert.strictEqual(res.status, 403, 'Non-admin approval must be rejected with HTTP 403 Forbidden');
        const data = await res.json();
        assert.strictEqual(data.error, 'Admin access required');
    });
});
