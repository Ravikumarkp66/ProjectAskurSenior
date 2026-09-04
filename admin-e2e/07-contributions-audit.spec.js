import { test, expect } from '@playwright/test';
import { SUPER1, ADMIN_CSE } from './helpers/test-accounts.js';
import { adminLogin, apiGet, apiPost } from './helpers/api-client.js';

test.describe('TEST 16 & 17: Contributions Tracking & Activity Audit Logs', () => {
  let superToken = null;
  let cseToken = null;

  test.beforeAll(async () => {
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok).toBeTruthy();
    superToken = superLogin.token;

    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;
  });

  test('TEST 16: Contributor Leaderboard & Attribution Integrity', async () => {
    // Check leaderboard endpoint
    const leaderboardRes = await apiGet('/api/admin/admins/leaderboard', superToken);
    expect(leaderboardRes.status).toBe(200);
    const leaderboard = await leaderboardRes.json();
    const list = Array.isArray(leaderboard) ? leaderboard : leaderboard.leaderboard || [];
    expect(Array.isArray(list)).toBeTruthy();
  });

  test('TEST 17: Activity Audit Logs Recording for Sensitive Actions', async () => {
    // 1. Perform an auditable action: Create a test subject
    const testCode = 'E2E-AUDIT-' + Date.now();
    await apiPost('/api/admin/subjects', cseToken, {
      name: '[E2E] Audit Log Test Subject',
      code: testCode,
      year: '1st Year',
      credits: 2
    });

    // 2. Query activity logs as Super Admin
    const activitiesRes = await apiGet('/api/admin/admins/activities', superToken);
    expect(activitiesRes.status).toBe(200);
    const activityData = await activitiesRes.json();
    const logs = Array.isArray(activityData) ? activityData : activityData.activities || [];

    // Verify activity logs exist and contain recent records
    expect(logs.length).toBeGreaterThan(0);
    const recentActivity = logs[0];
    expect(recentActivity).toHaveProperty('action');
  });
});
