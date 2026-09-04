import { test, expect } from '@playwright/test';
import { SUPER1, ADMIN_CSE, STUDENT_CSE } from './helpers/test-accounts.js';
import { adminLogin, studentLogin, apiGet } from './helpers/api-client.js';

test.describe('TEST 19, 20, 21 & 22: Session Management, Security History & Risk Engine', () => {
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

  test('TEST 19: Single Device Login & Session Replacement Invalidation', async () => {
    // 1. First device login for student
    const session1 = await studentLogin(STUDENT_CSE.usn);
    expect(session1.ok, 'First login should succeed').toBeTruthy();
    const tokenDevice1 = session1.token;

    // Verify tokenDevice1 works
    const profileCheck1 = await apiGet('/api/auth/profile', tokenDevice1);
    expect(profileCheck1.status).toBe(200);

    // 2. Second device login for same student
    const session2 = await studentLogin(STUDENT_CSE.usn);
    expect(session2.ok, 'Second login should succeed').toBeTruthy();
    const tokenDevice2 = session2.token;

    // Verify tokenDevice2 works
    const profileCheck2 = await apiGet('/api/auth/profile', tokenDevice2);
    expect(profileCheck2.status).toBe(200);

    // 3. Attempt to use tokenDevice1 again -> MUST be rejected with 401 SESSION_REPLACED
    const replacedCheck = await apiGet('/api/auth/profile', tokenDevice1);
    expect(replacedCheck.status).toBe(401);
    const errData = await replacedCheck.json();
    expect(errData.code || errData.error).toMatch(/SESSION_REPLACED|invalid/i);
  });

  test('TEST 20: Self-Service Login History Inspection', async () => {
    // Normal admin calls /my-history to inspect own sessions
    const historyRes = await apiGet('/api/admin/security/my-history', cseToken);
    expect(historyRes.status).toBe(200);
    const historyData = await historyRes.json();
    const sessions = Array.isArray(historyData) ? historyData : historyData.sessions || [];
    expect(Array.isArray(sessions)).toBeTruthy();

    if (sessions.length > 0) {
      const recent = sessions[0];
      // Verify recorded telemetry fields
      expect(recent).toHaveProperty('status');
    }
  });

  test('TEST 21: Security Risk Engine Telemetry & Suspicious Detection Verification', async () => {
    // Super Admin accesses suspicious logins endpoint
    const suspiciousRes = await apiGet('/api/admin/security/suspicious', superToken);
    expect(suspiciousRes.status).toBe(200);
    const suspData = await suspiciousRes.json();
    expect(suspData).toBeDefined();
  });

  test('TEST 22: Super Admin vs Normal Admin Security Dashboard Access', async () => {
    // 1. Super Admin has unrestricted access to security management endpoints
    const overviewRes = await apiGet('/api/admin/security/overview', superToken);
    expect(overviewRes.status).toBe(200);

    const logsRes = await apiGet('/api/admin/security/logs', superToken);
    expect(logsRes.status).toBe(200);

    const sessionsRes = await apiGet('/api/admin/security/sessions', superToken);
    expect(sessionsRes.status).toBe(200);

    // 2. Normal Admin is strictly BLOCKED from global security endpoints (403 Forbidden)
    const blockedOverview = await apiGet('/api/admin/security/overview', cseToken);
    expect(blockedOverview.status).toBe(403);

    const blockedLogs = await apiGet('/api/admin/security/logs', cseToken);
    expect(blockedLogs.status).toBe(403);

    const blockedSessions = await apiGet('/api/admin/security/sessions', cseToken);
    expect(blockedSessions.status).toBe(403);

    const blockedSuspicious = await apiGet('/api/admin/security/suspicious', cseToken);
    expect(blockedSuspicious.status).toBe(403);
  });
});
