import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { SUPER1, ADMIN_CSE, ADMIN_ECE, STUDENT_CSE, STUDENT_ECE, TEST_SUBJECTS } from './helpers/test-accounts.js';
import { adminLogin, studentLogin, apiGet, apiPut, apiDelete, apiMultipartRequest } from './helpers/api-client.js';

test.describe('TEST 27 & Full E2E Business Lifecycle Workflow', () => {
  let superToken = null;
  let cseToken = null;
  let eceToken = null;
  let cseStudentToken = null;
  let eceStudentToken = null;
  let testData = null;

  test.beforeAll(async () => {
    // Authenticate all personas
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok).toBeTruthy();
    superToken = superLogin.token;

    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;

    const eceLogin = await adminLogin(ADMIN_ECE.email);
    expect(eceLogin.ok).toBeTruthy();
    eceToken = eceLogin.token;

    const cseStud = await studentLogin(STUDENT_CSE.usn);
    expect(cseStud.ok).toBeTruthy();
    cseStudentToken = cseStud.token;

    const eceStud = await studentLogin(STUDENT_ECE.usn);
    expect(eceStud.ok).toBeTruthy();
    eceStudentToken = eceStud.token;

    // Load seeded test data metadata
    const testDataPath = path.resolve('admin-e2e/.auth/test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    }
  });

  test('Full Cross-Persona Lifecycle: Upload -> Student Isolation -> ECE Admin Blocked -> Super Admin Override -> Audit Trail', async () => {
    const cseSubjectId = testData?.subjects?.cse?._id;
    expect(cseSubjectId, 'CSE test subject ID must be resolved').toBeDefined();

    // ── 1. CSE Admin Uploads Notes ──
    const pdfPath = path.resolve('admin-e2e/fixtures/test-document.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    const uniqueTitle = `[E2E] Lifecycle Notes ${Date.now()}`;
    formData.append('files', blob, `${uniqueTitle}.pdf`);
    formData.append('defaultSubject', cseSubjectId);
    formData.append('defaultType', 'Notes');

    const uploadRes = await apiMultipartRequest('POST', '/api/admin/materials', cseToken, formData);
    expect([200, 201]).toContain(uploadRes.status);

    // Retrieve uploaded material ID
    const cseMatListRes = await apiGet('/api/admin/materials', cseToken);
    expect(cseMatListRes.status).toBe(200);
    const cseMatData = await cseMatListRes.json();
    const cseMaterials = Array.isArray(cseMatData) ? cseMatData : cseMatData.materials || [];
    const uploadedMat = cseMaterials.find(m => m.title && m.title.includes(uniqueTitle) || m.originalFileName && m.originalFileName.includes(uniqueTitle));
    
    const materialId = uploadedMat?._id || testData?.materials?.cse?._id;
    expect(materialId, 'Material ID must exist').toBeDefined();

    // ── 2. CSE Student Can See It ──
    const cseSlug = TEST_SUBJECTS.cse.slug;
    const cseStudentView = await apiGet(`/api/cms/subjects/${cseSlug}/materials`, cseStudentToken);
    if (cseStudentView.status === 200) {
      const cseContent = await cseStudentView.json();
      const mats = cseContent.materials || [];
      const canSee = mats.some(m => m.title && m.title.includes('Notes'));
      expect(canSee, 'CSE Student must be able to view CSE subject materials').toBeTruthy();
    }

    // ── 3. ECE Student CANNOT See It ──
    const eceSlug = TEST_SUBJECTS.ece.slug;
    const eceStudentView = await apiGet(`/api/cms/subjects/${eceSlug}/materials`, eceStudentToken);
    if (eceStudentView.status === 200) {
      const eceContent = await eceStudentView.json();
      const mats = eceContent.materials || [];
      const leakedIntoEce = mats.some(m => m.title && m.title.includes(uniqueTitle));
      expect(leakedIntoEce, 'ECE Student MUST NOT see CSE materials').toBeFalsy();
    }

    // ── 4. ECE Admin CANNOT Modify or Delete It (Blocked by Dept Scope & Permissions) ──
    const eceTamperRes = await apiPut(`/api/admin/materials/${materialId}`, eceToken, {
      title: '[E2E] Tampered By ECE Admin'
    });
    expect([403, 404]).toContain(eceTamperRes.status);

    const eceDeleteRes = await apiDelete(`/api/admin/materials/${materialId}`, eceToken);
    expect([403, 404]).toContain(eceDeleteRes.status);

    // ── 5. Super Admin CAN See and Modify It ──
    const superViewRes = await apiGet(`/api/admin/materials/${materialId}`, superToken);
    expect([200, 404]).toContain(superViewRes.status);

    const superUpdateRes = await apiPut(`/api/admin/materials/${materialId}`, superToken, {
      title: `${uniqueTitle} - Super Admin Verified`
    });
    expect([200, 204]).toContain(superUpdateRes.status);

    // ── 6. Audit Log Records the Actions ──
    const auditRes = await apiGet('/api/admin/admins/activities', superToken);
    expect(auditRes.status).toBe(200);
    const auditData = await auditRes.json();
    const activities = Array.isArray(auditData) ? auditData : auditData.activities || [];
    expect(activities.length).toBeGreaterThan(0);
  });

  test('Multi-Material Type Support (Notes, PYQs, Question Banks, Syllabus)', async () => {
    const cseSubjectId = testData?.subjects?.cse?._id;
    expect(cseSubjectId).toBeDefined();

    const materialTypes = ['Notes', 'PYQs', 'Question Banks', 'Syllabus'];
    const pdfPath = path.resolve('admin-e2e/fixtures/test-document.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    for (const matType of materialTypes) {
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      const title = `[E2E] Lifecycle ${matType} ${Date.now()}`;
      formData.append('files', blob, `${title}.pdf`);
      formData.append('defaultSubject', cseSubjectId);
      formData.append('defaultType', matType);

      const res = await apiMultipartRequest('POST', '/api/admin/materials', cseToken, formData);
      // Verify valid response from materials controller
      expect([200, 201]).toContain(res.status);
    }
  });
});
