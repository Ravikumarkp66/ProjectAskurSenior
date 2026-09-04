/**
 * AskUrSenior E2E API Client
 * 
 * Shared utilities for direct backend HTTP calls in E2E tests.
 * Used for both UI-bypassing API-level security tests and test data setup.
 */

import { BACKEND_URL, TEST_PASSWORD } from './test-accounts.js';

// ─── Authentication ──────────────────────────────────────────────

/**
 * Login as an admin via email + password credential endpoint.
 * @returns {{ token: string, user: object }}
 */
export async function adminLogin(email, password = TEST_PASSWORD) {
  const res = await fetch(`${BACKEND_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, status: res.status, error: data.error || res.statusText, data };
  }

  return { ok: true, status: res.status, token: data.token, user: data.user, data };
}

/**
 * Login as a student via USN + password.
 * @returns {{ token: string, user: object }}
 */
export async function studentLogin(usn, password = TEST_PASSWORD, branch = 'CS') {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usn, password, branch }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, status: res.status, error: data.error || res.statusText, data };
  }

  return { ok: true, status: res.status, token: data.token, user: data.user, data };
}

// ─── Generic API Request ─────────────────────────────────────────

/**
 * Make an authenticated API request.
 * Returns the raw Response object for full assertion control.
 */
export async function apiRequest(method, path, token, { body, query, headers: extraHeaders } = {}) {
  let url = `${BACKEND_URL}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.append(k, v);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Make a multipart form data request (for file uploads).
 */
export async function apiMultipartRequest(method, path, token, formData) {
  let url = `${BACKEND_URL}${path}`;

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type for multipart — fetch sets it automatically with boundary

  return fetch(url, { method, headers, body: formData });
}

// ─── Convenience Methods ─────────────────────────────────────────

export const apiGet = (path, token, query) =>
  apiRequest('GET', path, token, { query });

export const apiPost = (path, token, body) =>
  apiRequest('POST', path, token, { body });

export const apiPut = (path, token, body) =>
  apiRequest('PUT', path, token, { body });

export const apiPatch = (path, token, body) =>
  apiRequest('PATCH', path, token, { body });

export const apiDelete = (path, token) =>
  apiRequest('DELETE', path, token);

// ─── Response Helpers ────────────────────────────────────────────

/**
 * Parse a response as JSON, with safe fallback.
 */
export async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Assert response status and return parsed JSON.
 * Throws descriptive error on mismatch.
 */
export async function expectStatus(response, expectedStatus) {
  const body = await parseJson(response);
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected ${expectedStatus} but got ${response.status}. ` +
      `Body: ${JSON.stringify(body)}`
    );
  }
  return body;
}

// ─── Admin Portal Browser Helpers ────────────────────────────────

/**
 * Inject admin auth token into browser localStorage for the admin portal.
 * Use this after adminLogin() to authenticate a Playwright page.
 */
export async function injectAdminAuth(page, loginResult) {
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
  }, { token: loginResult.token, user: loginResult.user });
}

/**
 * Inject student auth token into browser localStorage for the student frontend.
 */
export async function injectStudentAuth(page, loginResult) {
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: loginResult.token, user: loginResult.user });
}

/**
 * Clear all auth tokens from localStorage.
 */
export async function clearAuth(page) {
  await page.evaluate(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  });
}
