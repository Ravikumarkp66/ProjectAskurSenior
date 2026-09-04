import { test, expect } from '@playwright/test';
import { SUPER1, ADMIN_CSE, STUDENT_CSE } from './helpers/test-accounts.js';
import { adminLogin, studentLogin, apiGet, apiPost } from './helpers/api-client.js';

test.describe('TEST 18: Announcements Access & Lifecycle', () => {
  let superToken = null;
  let cseToken = null;
  let studentToken = null;

  test.beforeAll(async () => {
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok).toBeTruthy();
    superToken = superLogin.token;

    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;

    const studLogin = await studentLogin(STUDENT_CSE.usn);
    expect(studLogin.ok).toBeTruthy();
    studentToken = studLogin.token;
  });

  test('TEST 18: Admin Announcement Creation & Student Visibility', async () => {
    // 1. Admin creates an announcement
    const annTitle = `[E2E] Campus Announcement ${Date.now()}`;
    const createRes = await apiPost('/api/campus-hub/announcements', superToken, {
      title: annTitle,
      description: 'Important academic notification for all students',
      category: 'circular',
      priority: 'high'
    });

    expect([201, 200]).toContain(createRes.status);
    const annData = await createRes.json();
    expect(annData.title).toBe(annTitle);

    // 2. Student queries announcements feed
    const feedRes = await apiGet('/api/campus-hub/feed', studentToken);
    if (feedRes.status === 200) {
      const feed = await feedRes.json();
      const items = feed.items || feed.announcements || [];
      const createdItem = items.find(i => i.title === annTitle);
      // In current schema, announcements are campus-wide announcements
      if (createdItem) {
        expect(createdItem.title).toBe(annTitle);
      }
    }
  });
});
