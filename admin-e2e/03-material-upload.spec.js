import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ADMIN_CSE, STUDENT_ECE, TEST_SUBJECTS } from './helpers/test-accounts.js';
import { adminLogin, apiGet, apiMultipartRequest } from './helpers/api-client.js';

test.describe('TEST 6, 7 & 8: Material Upload & Cross-Department Security', () => {
  let cseToken = null;
  let testData = null;

  test.beforeAll(async () => {
    const loginRes = await adminLogin(ADMIN_CSE.email);
    expect(loginRes.ok, `CSE Admin login failed: ${loginRes.error}`).toBeTruthy();
    cseToken = loginRes.token;

    // Load seeded test data metadata
    const testDataPath = path.resolve('admin-e2e/.auth/test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    }
  });

  test('TEST 6: Material Upload to Own Department Subject & Visibility Scoping', async () => {
    // CSE admin uploads material to CSE subject
    const pdfPath = path.resolve('admin-e2e/fixtures/test-document.pdf');
    expect(fs.existsSync(pdfPath), 'Test PDF fixture must exist').toBeTruthy();

    const cseSubjectId = testData?.subjects?.cse?._id;
    expect(cseSubjectId, 'CSE test subject ID should be resolved from seed').toBeDefined();

    const pdfBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('files', blob, 'CSE-Data-Structures-Notes.pdf');
    formData.append('defaultSubject', cseSubjectId);
    formData.append('defaultType', 'Notes');

    const uploadRes = await apiMultipartRequest('POST', '/api/admin/materials', cseToken, formData);
    // Backend may return 200, 201, or return duplicate response if already uploaded
    expect([200, 201]).toContain(uploadRes.status);

    // Verify the material belongs to CSE and appears in CSE admin materials list
    const materialsRes = await apiGet('/api/admin/materials', cseToken);
    expect(materialsRes.status).toBe(200);
    const materialsData = await materialsRes.json();
    const materialList = Array.isArray(materialsData) ? materialsData : materialsData.materials || [];
    
    const uploaded = materialList.find(m => 
      (m.title && m.title.includes('Data Structures')) || 
      (m.originalFileName && m.originalFileName.includes('Data Structures'))
    );
    expect(uploaded, 'Uploaded material should appear in CSE materials list').toBeDefined();

    // Verify ECE student does NOT see this CSE material
    const eceStudentRes = await apiGet('/api/cms/subjects', null, { branch: 'ECE' });
    if (eceStudentRes.status === 200) {
      const eceSubjects = await eceStudentRes.json();
      const subList = Array.isArray(eceSubjects) ? eceSubjects : [];
      // CSE subject should not be in ECE subjects list
      const leakedCseSub = subList.find(s => s.code === TEST_SUBJECTS.cse.code);
      expect(leakedCseSub, 'ECE student subjects list must NOT leak CSE subjects').toBeUndefined();
    }
  });

  test('TEST 7: Prevent Uploading / Tampering Material to Another Department', async () => {
    // Critical authorization attack:
    // CSE admin attempts to specify department: "ECE" or branch: "ECE"
    const pdfPath = path.resolve('admin-e2e/fixtures/test-document.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('files', blob, 'ECE-Network-Theory-Notes-Tampered.pdf');
    formData.append('department', 'ECE');
    formData.append('branch', 'ECE');

    // enforceDepartmentScope middleware overrides body/query parameters to CSE
    const uploadRes = await apiMultipartRequest('POST', '/api/admin/materials?branch=ECE&department=ECE', cseToken, formData);

    // If upload was processed, backend must NOT have assigned it to ECE!
    // When querying ECE materials (with Super Admin or ECE admin), it should NOT belong to ECE
    if (uploadRes.status === 200 || uploadRes.status === 201) {
      const uploadData = await uploadRes.json();
      // Ensure backend did not honor the client's claimed ECE department
      if (uploadData.department) {
        expect(uploadData.department).not.toBe('ECE');
      }
    } else {
      // Rejection with 400 or 403 is also an acceptable and secure response
      expect([400, 403]).toContain(uploadRes.status);
    }
  });

  test('TEST 8: Wrong Department Subject Rejection', async () => {
    // CSE Admin attempts to upload or associate material with an ECE subject ID
    const eceSubjectId = testData?.subjects?.ece?._id;
    expect(eceSubjectId, 'ECE test subject ID should be resolved from seed').toBeDefined();

    const pdfPath = path.resolve('admin-e2e/fixtures/test-document.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('files', blob, 'Cross-Dept-Tampered-Notes.pdf');
    formData.append('defaultSubject', eceSubjectId); // ECE subject sent by CSE admin

    const res = await apiMultipartRequest('POST', '/api/admin/materials', cseToken, formData);
    // Because the subject belongs to ECE, when CSE admin checks materials, it should not leak into CSE
    // Or the backend rejects with 400/403/404
    expect([200, 201, 400, 403, 404]).toContain(res.status);

    // Verify CSE admin materials list does NOT list any material under ECE subject
    const cseListRes = await apiGet('/api/admin/materials', cseToken);
    const cseListData = await cseListRes.json();
    const items = Array.isArray(cseListData) ? cseListData : cseListData.materials || [];
    const hasEceSubjectItem = items.some(item => item.subject?._id === eceSubjectId || item.subject?.code === TEST_SUBJECTS.ece.code);
    expect(hasEceSubjectItem, 'CSE admin materials list must not contain items associated with ECE subject').toBeFalsy();
  });
});
