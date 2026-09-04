import { test, expect } from '@playwright/test';
import { STUDENT_CSE, STUDENT_ECE, TEST_SUBJECTS } from './helpers/test-accounts.js';
import { studentLogin, apiGet } from './helpers/api-client.js';

test.describe('TEST 9 & 10: Student-Side Department Isolation (Subjects & Materials)', () => {
  let cseStudentToken = null;
  let eceStudentToken = null;

  test.beforeAll(async () => {
    // Authenticate test students
    const cseLogin = await studentLogin(STUDENT_CSE.usn, undefined, STUDENT_CSE.branchCode);
    expect(cseLogin.ok, `CSE student login failed: ${cseLogin.error}`).toBeTruthy();
    cseStudentToken = cseLogin.token;

    const eceLogin = await studentLogin(STUDENT_ECE.usn, undefined, STUDENT_ECE.branchCode);
    expect(eceLogin.ok, `ECE student login failed: ${eceLogin.error}`).toBeTruthy();
    eceStudentToken = eceLogin.token;
  });

  test('TEST 9: Student Subject Visibility by Department', async () => {
    // 1. CSE Student requests public subjects filtered by branch CSE
    const cseRes = await apiGet('/api/cms/subjects', cseStudentToken, { branch: 'CSE' });
    expect(cseRes.status).toBe(200);
    const cseSubjects = await cseRes.json();
    const cseList = Array.isArray(cseSubjects) ? cseSubjects : [];

    // Verify CSE test subject is present
    const hasCseSubject = cseList.some(s => s.code === TEST_SUBJECTS.cse.code);
    expect(hasCseSubject, 'CSE student must see CSE subjects').toBeTruthy();

    // Verify ECE & ISE subjects are NOT present in CSE branch list
    const hasEceInCse = cseList.some(s => s.code === TEST_SUBJECTS.ece.code);
    const hasIseInCse = cseList.some(s => s.code === TEST_SUBJECTS.ise.code);
    expect(hasEceInCse, 'CSE student must NOT see ECE subjects').toBeFalsy();
    expect(hasIseInCse, 'CSE student must NOT see ISE subjects').toBeFalsy();

    // 2. ECE Student requests subjects filtered by branch ECE
    const eceRes = await apiGet('/api/cms/subjects', eceStudentToken, { branch: 'ECE' });
    expect(eceRes.status).toBe(200);
    const eceSubjects = await eceRes.json();
    const eceList = Array.isArray(eceSubjects) ? eceSubjects : [];

    // Verify ECE test subject is present
    const hasEceSubject = eceList.some(s => s.code === TEST_SUBJECTS.ece.code);
    expect(hasEceSubject, 'ECE student must see ECE subjects').toBeTruthy();

    // Verify CSE & ISE subjects are NOT present in ECE branch list
    const hasCseInEce = eceList.some(s => s.code === TEST_SUBJECTS.cse.code);
    const hasIseInEce = eceList.some(s => s.code === TEST_SUBJECTS.ise.code);
    expect(hasCseInEce, 'ECE student must NOT see CSE subjects').toBeFalsy();
    expect(hasIseInEce, 'ECE student must NOT see ISE subjects').toBeFalsy();
  });

  test('TEST 10: Student Material Visibility Across Departments', async () => {
    // 1. Fetch materials for CSE subject by slug
    const cseSlug = TEST_SUBJECTS.cse.slug;
    const cseMatRes = await apiGet(`/api/cms/subjects/${cseSlug}/materials`, cseStudentToken);
    expect([200, 404]).toContain(cseMatRes.status);

    if (cseMatRes.status === 200) {
      const data = await cseMatRes.json();
      const mats = data.materials || [];
      // Verify CSE notes appear
      const hasCseNotes = mats.some(m => m.title && m.title.includes('Data Structures'));
      expect(hasCseNotes, 'CSE student should see Data Structures notes').toBeTruthy();
    }

    // 2. Fetch materials for ECE subject by slug
    const eceSlug = TEST_SUBJECTS.ece.slug;
    const eceMatRes = await apiGet(`/api/cms/subjects/${eceSlug}/materials`, eceStudentToken);
    expect([200, 404]).toContain(eceMatRes.status);

    if (eceMatRes.status === 200) {
      const data = await eceMatRes.json();
      const mats = data.materials || [];
      // Verify ECE notes appear
      const hasEceNotes = mats.some(m => m.title && m.title.includes('Network Theory'));
      expect(hasEceNotes, 'ECE student should see Network Theory notes').toBeTruthy();

      // Verify NO CSE notes leaked into ECE subject
      const leakedCse = mats.some(m => m.title && m.title.includes('Data Structures'));
      expect(leakedCse, 'ECE subject must NOT contain CSE notes').toBeFalsy();
    }
  });
});
