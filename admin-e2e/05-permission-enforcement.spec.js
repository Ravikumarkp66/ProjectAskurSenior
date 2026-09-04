import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ADMIN_CSE, ADMIN_ECE, ADMIN_ISE } from './helpers/test-accounts.js';
import { adminLogin, apiGet, apiPost, apiPut, apiDelete } from './helpers/api-client.js';

test.describe('TEST 11 & 12: Action-Level Permissions & Permission + Department Matrix', () => {
  let cseToken = null;
  let eceToken = null;
  let iseToken = null;
  let testData = null;

  test.beforeAll(async () => {
    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;

    const eceLogin = await adminLogin(ADMIN_ECE.email);
    expect(eceLogin.ok).toBeTruthy();
    eceToken = eceLogin.token;

    const iseLogin = await adminLogin(ADMIN_ISE.email);
    expect(iseLogin.ok).toBeTruthy();
    iseToken = iseLogin.token;

    const testDataPath = path.resolve('admin-e2e/.auth/test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    }
  });

  test('TEST 11: Granular Permission Enforcement (View vs Create vs Update vs Delete)', async () => {
    // ECE admin has materials.view = true, materials.create = true, but update = false, delete = false
    // 1. View materials: Allowed
    const viewRes = await apiGet('/api/admin/materials', eceToken);
    expect(viewRes.status).toBe(200);

    // 2. Direct API call to update material: MUST return 403
    const fakeId = '507f1f77bcf86cd799439011';
    const eceMaterialId = testData?.materials?.ece?._id || fakeId;

    const updateRes = await apiPut(`/api/admin/materials/${eceMaterialId}`, eceToken, {
      title: 'Hacked Title Attempt'
    });
    expect(updateRes.status).toBe(403);
    const updateErr = await updateRes.json();
    expect(updateErr.error).toMatch(/permission|forbidden/i);

    // 3. Direct API call to delete material: MUST return 403
    const deleteRes = await apiDelete(`/api/admin/materials/${eceMaterialId}`, eceToken);
    expect(deleteRes.status).toBe(403);
    const deleteErr = await deleteRes.json();
    expect(deleteErr.error).toMatch(/permission|forbidden/i);

    // 4. ISE admin has subjects.create = false
    const createSubjRes = await apiPost('/api/admin/subjects', iseToken, {
      name: '[E2E] Unauthorized Subject',
      code: 'E2E-UNAUTH-' + Date.now(),
      year: '1st Year'
    });
    expect(createSubjRes.status).toBe(403);
    const createSubjErr = await createSubjRes.json();
    expect(createSubjErr.error).toMatch(/permission|forbidden/i);
  });

  test('TEST 12: Permission + Department Joint Enforcement', async () => {
    // CSE admin HAS materials.update = true
    // However, they must NOT be able to modify an ECE material!
    const eceMaterialId = testData?.materials?.ece?._id;
    const cseMaterialId = testData?.materials?.cse?._id;

    if (cseMaterialId) {
      // Modifying own CSE material should succeed or pass permission check
      const cseUpdateRes = await apiPut(`/api/admin/materials/${cseMaterialId}`, cseToken, {
        title: '[E2E] CSE Data Structures Notes Updated'
      });
      // 200 if updated, or 404 if file URL requires AWS, but NOT 403 Forbidden!
      expect(cseUpdateRes.status).not.toBe(403);
    }

    if (eceMaterialId) {
      // Crucial: CSE admin attempts to update ECE material
      // Even with materials.update = true, department scope or subject filter blocks it
      const attackRes = await apiPut(`/api/admin/materials/${eceMaterialId}`, cseToken, {
        title: '[E2E] Tampered Cross-Dept Title'
      });
      // Expected: 403 Forbidden (department check) or 404 Not Found (scoped out of CSE)
      expect([403, 404]).toContain(attackRes.status);
    }
  });
});
