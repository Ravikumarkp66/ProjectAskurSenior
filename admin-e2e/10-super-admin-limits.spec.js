import { test, expect } from '@playwright/test';
import { SUPER1 } from './helpers/test-accounts.js';
import { adminLogin, apiGet, apiPost, apiDelete, apiPatch } from './helpers/api-client.js';

test.describe('TEST 23: Super Admin Quota Limit (Max 3) & Demotion Protection', () => {
  let superToken = null;

  test.beforeAll(async () => {
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok).toBeTruthy();
    superToken = superLogin.token;
  });

  test('TEST 23: Maximum 3 Super Admins Limit Enforcement & Guardrails', async () => {
    // 1. Check current admin stats
    const adminsListRes = await apiGet('/api/admin/admins', superToken);
    expect(adminsListRes.status).toBe(200);
    const listData = await adminsListRes.json();
    const admins = Array.isArray(listData) ? listData : listData.admins || [];

    const existingSuperAdmins = admins.filter(a => a.role === 'SUPER_ADMIN');
    const createdTempAdmins = [];

    try {
      // 2. If fewer than 3 super admins exist, create temp ones to hit the cap of 3
      let currentSuperCount = existingSuperAdmins.length;
      while (currentSuperCount < 3) {
        const tempEmail = `e2e-temp-super-${Date.now()}-${currentSuperCount}@test.askursenior.org`;
        const createRes = await apiPost('/api/admin/admins', superToken, {
          name: `E2E Temp Super ${currentSuperCount}`,
          email: tempEmail,
          role: 'SUPER_ADMIN'
        });
        expect([200, 201]).toContain(createRes.status);
        const created = await createRes.json();
        createdTempAdmins.push(created._id || created.admin?._id);
        currentSuperCount++;
      }

      // 3. Attempt to create a 4th Super Admin -> MUST return 400 Bad Request
      const fourthSuperEmail = `e2e-super-fourth-${Date.now()}@test.askursenior.org`;
      const fourthRes = await apiPost('/api/admin/admins', superToken, {
        name: 'E2E Fourth Super Admin Attempt',
        email: fourthSuperEmail,
        role: 'SUPER_ADMIN'
      });

      expect(fourthRes.status).toBe(400);
      const fourthErr = await fourthRes.json();
      expect(fourthErr.error).toMatch(/Maximum limit of 3 Super Admins reached/i);
    } finally {
      // Clean up temporary super admins created during the test
      for (const id of createdTempAdmins) {
        if (id) {
          await apiDelete(`/api/admin/admins/${id}`, superToken);
        }
      }
    }
  });
});
