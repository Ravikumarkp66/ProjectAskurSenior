# AskUrSenior — Security Testing Foundation & Policy

> **Purpose**: Establish an automated, pragmatic security testing workflow to guarantee authentication boundaries, multi-tenant RBAC, cross-student data isolation, and tamper resistance for every feature.  
> **Key Principle**: Security testing in AskUrSenior is **not** a pen-testing lab or external scanner. It is a set of automated contract, integration, and E2E assertions that verify security invariants continuously during local development.

---

## 1. Security Test Categories

Our security baseline focuses on five concrete application guarantees:

### A. Authentication Boundaries
- Unauthenticated requests to protected endpoints must be rejected with HTTP 401.
- Expired, forged, or missing JWT tokens must never grant access.
- Valid tokens must correctly unpack user claims and enforce active account status.

### B. Authorization & Scoped RBAC
- Role boundaries must be strictly enforced (e.g. `STUDENT` vs `NORMAL_ADMIN` vs `SUPER_ADMIN`).
- Department and scope confinement: A department admin (e.g. CSE) cannot read, create, or update academic structures, timetables, or materials in another department (e.g. ECE, ISE).
- Super admin guardrails: Super admin account quotas (maximum 3) and demotion protection must be enforced.

### C. Cross-User Data Isolation (IDOR Prevention)
- Direct Object Reference (IDOR) attempts must fail. Changing a URL parameter or request body identifier (e.g. `registeredSubjectId`, `sectionId`) to a foreign user's resource must result in HTTP 404 (Not Found) or 403 (Forbidden), preventing resource enumeration and data leakage.
- Student department isolation: Students cannot see unapproved or cross-department materials.

### D. Input Validation & Security Boundaries
- Malformed payloads, invalid dates, negative scores, or out-of-range parameters must be rejected with HTTP 400 before touching database models.
- Client validation prevents invalid submissions, but backend route and controller validators must independently reject unauthorized payloads.

### E. Session Security & Attack Surface Boundaries
- Single active session enforcement: Logging in from a new device invalidates prior active sessions.
- Student frontend isolation: The student-facing frontend must never invoke administrative endpoints (`/api/admin/*`).
- Environment integrity: Staging frontend must never leak requests to production backends.
- Direct URL tampering to protected routes without elevated credentials must redirect or reject.

---

## 2. Tagging Convention (`@security`)

In Playwright E2E suites, security tests are designated using tags on `test.describe`:

```javascript
// Test verifying security property, included in standard regression:
test.describe('Suite Title', { tag: ['@regression', '@security'] }, () => { ... });

// Test verifying critical security/auth property:
test.describe('Suite Title', { tag: ['@regression', '@critical', '@security'] }, () => { ... });
```

### How Security Tests Relate to Regression
- Security tests that validate core functional boundaries (e.g. session persistence, department confinement) are dual-tagged with `@regression` and run during normal regression passes.
- Standalone administrative security attack tests (e.g. super admin quota limits, direct URL tampering) can be executed specifically via dedicated security commands.

---

## 3. Standard Commands

All security test commands are accessible from the repository root:

```bash
# Run local security tests (Backend contract + Student E2E security)
npm run test:security

# Run Backend security tests only (RBAC engine + CIE API 401/404 contracts)
npm run test:security:backend

# Run Student E2E security tests only (Playwright @security)
npm run test:security:e2e

# Run Admin E2E security tests (Playwright @security across admin projects)
npm run test:security:admin-e2e
```

---

## 4. Current Security Testing Baseline

| Security Domain | Existing Coverage & Verification | Test File | Layer |
| :--- | :--- | :--- | :--- |
| **Authentication** | Rejection of missing/invalid JWT (401), token validation | `backend/tests/api/cieApi.test.js` (`CIE-API-003`) | HTTP API |
| **Session Integrity** | JWT session persistence across reloads, single-session invalidation | `e2e/session-persistence-profile-flow.spec.js`, `admin-e2e/09-session-security.spec.js` | E2E |
| **IDOR / Data Isolation** | Cross-student subject update prevention (404/403) | `backend/tests/api/cieApi.test.js` (`CIE-API-005`), `backend/tests/cieIntegration.test.js` (`CIE-INTEGRATION-001`) | API / Integration |
| **RBAC / Scope Control** | Multi-tenant college/branch/section matching, HoD wildcard, `requireScope` middleware (403) | `backend/tests/academicScopeAuthorization.test.js` (7 scenarios) | Backend Integration |
| **IDOR (Admin)** | Scoped CSE admin blocked from reading or mutating ECE timetable (403) | `backend/tests/realE2EQAPass.test.js` (`E2E-09`) | Backend Integration |
| **Department Confinement** | Normal admin confined to own department; student visibility isolated | `admin-e2e/02-normal-admin-access.spec.js`, `admin-e2e/04-student-isolation.spec.js` | Admin E2E |
| **Privilege Enforcement** | Action-level CRUD permissions (view vs create vs update vs delete) | `admin-e2e/05-permission-enforcement.spec.js` | Admin E2E |
| **Attack Vectors** | Direct URL tampering, privilege escalation, unauthorized page access | `admin-e2e/11-attack-vectors.spec.js` | Admin E2E |
| **Super Admin Quota** | Max 3 super admins cap enforcement and demotion protection | `admin-e2e/10-super-admin-limits.spec.js` | Admin E2E |
| **Privilege Separation** | Student frontend network traffic verified to never call `/api/admin/*` | `e2e/user-registration-admin-integrity.spec.js` | Student E2E |
| **Environment Leakage** | Staging frontend strictly verified never to call production backend | `e2e/api-routing.spec.js` | Student E2E |

---

## 5. Future Feature Rule: Adding Security Tests

Whenever authoring a new feature, apply the **Security Test Checklist**:

1. **Unauthenticated Check**:
   - Add a test verifying that calling the endpoint without authentication returns HTTP 401.
2. **Cross-User / IDOR Check**:
   - Add a test verifying that User A cannot read or mutate User B's record (returns 404 or 403).
3. **Role / Privilege Check**:
   - If the endpoint has role restrictions (e.g. Admin-only or HoD-only), verify that a lower-privileged user is rejected with HTTP 403.
4. **Input Sanitization / Boundary Check**:
   - Verify that malformed IDs, out-of-range values, or missing required fields return HTTP 400.

---

## 6. What is Intentionally NOT Covered Yet

To keep the local testing workflow fast, maintainable, and low-friction, the following are deferred:
- Automated penetration-testing daemons (OWASP ZAP, Burp Suite)
- External fuzzing harnesses
- Secrets scanning and SAST/DAST CI pipeline integrations
- Network DDoS / rate-limit threshold flooding
