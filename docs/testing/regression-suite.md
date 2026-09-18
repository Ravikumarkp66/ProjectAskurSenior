# AskUrSenior — Regression Suite

> **Purpose**: Run after every feature change to detect whether existing behaviour has broken.  
> Regression is **not** a copy of the tests — it is a logical selection of the existing automated tests, re-executed as a baseline gate.

---

## What "Regression" Means in This Project

A **regression test** is any previously passing test that is re-run after new code is merged.  
If it fails, a regression has been introduced — something that used to work has broken.

In this project, regression tests are the existing unit, integration, and E2E tests that are tagged with `@regression`.  
There is **no separate regression test file or folder**. The tag is the selector.

---

## Test Layers That Participate

| Layer | Framework | Location | Included in Regression |
| :--- | :--- | :--- | :---: |
| Frontend unit | Vitest | `frontend/src/utils/__tests__/` | ✅ |
| Backend unit | `node:test` | `backend/services/__tests__/` | ✅ |
| Backend integration | `node:test` | `backend/tests/cieIntegration.test.js` | ✅ |
| Backend API | `node:test` + fetch | `backend/tests/api/cieApi.test.js` | via E2E (live server) |
| Student E2E | Playwright | `e2e/*.spec.js` | ✅ (tagged files only) |
| Admin E2E | Playwright | `admin-e2e/*.spec.js` | ✅ (tagged files, `test:regression:full`) |
| Performance | Playwright / node | `performance/` | ❌ always separate |

---

## Tagging Convention

### Playwright (E2E) Tests
Tags are added to `test.describe` using the Playwright options object:

```javascript
// Included in regression, not critical:
test.describe('Suite Name', { tag: '@regression' }, () => { ... });

// Included in regression AND flagged critical (P0 security/auth):
test.describe('Suite Name', { tag: ['@regression', '@critical'] }, () => { ... });
```

Run all regression-tagged E2E tests:
```
npx playwright test --grep @regression
```

Run only critical regression tests:
```
npx playwright test --grep @critical
```

### Node / Vitest Tests
These do not use tag strings — they participate in regression by being explicitly listed in the `test:regression:unit` script. Their test IDs (`CIE-UNIT-001`, `CIE-INTEGRATION-001`, etc.) serve as permanent traceability identifiers.

---

## Regression Selection Rationale

Only tests that detect **meaningful regressions** across core user-facing or security-critical behaviour are tagged. Tests for edge cases, long-running lifecycle flows, or data-dependent scenarios are reserved for the full E2E suite.

### `@critical` — Applied when failure = immediate P0 user-facing or security impact
- CIE Analyzer full-stack flow (marks, auto-save, persistence)
- Auth session persistence and profile lifecycle
- Student department data isolation (cross-department leak = data breach)
- Admin action-level permission enforcement (RBAC break = unauthorized access)
- Admin session management and risk engine

### `@regression` (not critical) — Applied when failure = visible feature breakage
- Landing page and public navigation routes
- SGPA / CGPA calculators
- Academic materials finder
- API routing (staging → staging, not staging → production)
- User registration and admin data integrity
- Super admin login and global access
- Normal admin department confinement
- Attack vector and URL tampering prevention

---

## Regression-Tagged Files

### Student E2E (`@regression`)

| File | Tag(s) | Why |
| :--- | :--- | :--- |
| `e2e/landing.spec.js` | `@regression` | App boots at all |
| `e2e/navigation.spec.js` | `@regression` | All public routes resolve |
| `e2e/cie-analyzer.spec.js` | `@regression @critical` | Primary feature, full-stack |
| `e2e/session-persistence-profile-flow.spec.js` | `@regression @critical` | Auth system integrity |
| `e2e/user-registration-admin-integrity.spec.js` | `@regression` | Onboarding gate |
| `e2e/academics.spec.js` | `@regression` | Materials finder + backend routing |
| `e2e/calculators.spec.js` | `@regression` | Core public utility |
| `e2e/api-routing.spec.js` | `@regression` | Environment integrity (no prod leakage) |

**Not tagged** (run in full E2E only): `attendance.spec.js`, `student-academics.spec.js`, `year-cards-materials.spec.js`, `usn-change-otp-cooldown.spec.js`, `existing-user-missing-profile-flow.spec.js`, `authenticated/playground.spec.js`, `authenticated/profile.spec.js`

### Admin E2E (`@regression`, run via `test:regression:full`)

| File | Tag(s) | Why |
| :--- | :--- | :--- |
| `admin-e2e/01-super-admin-access.spec.js` | `@regression` | Admin system baseline |
| `admin-e2e/02-normal-admin-access.spec.js` | `@regression` | Department confinement |
| `admin-e2e/04-student-isolation.spec.js` | `@regression @critical` | Cross-dept data isolation |
| `admin-e2e/05-permission-enforcement.spec.js` | `@regression @critical` | RBAC correctness |
| `admin-e2e/09-session-security.spec.js` | `@regression @critical` | Session / risk engine |
| `admin-e2e/11-attack-vectors.spec.js` | `@regression` | Attack surface boundary |

**Not tagged**: `03-material-upload.spec.js`, `06-admin-management.spec.js`, `07-contributions-audit.spec.js`, `08-announcements.spec.js`, `10-super-admin-limits.spec.js`, `12-full-lifecycle-workflow.spec.js`

### Backend Tests (always participate via scripts, no tag needed)

| File | Test IDs | Layer |
| :--- | :--- | :--- |
| `frontend/src/utils/__tests__/cieEngine.test.js` | `CIE-UNIT-001` – `CIE-UNIT-005` | Frontend unit |
| `backend/services/__tests__/cieRulesEngine.test.js` | `CIE-UNIT-001` – `CIE-UNIT-005` | Backend unit |
| `backend/tests/cieIntegration.test.js` | `CIE-INTEGRATION-001` – `CIE-INTEGRATION-005` | Backend integration |
| `backend/tests/api/cieApi.test.js` | `CIE-API-001` – `CIE-API-006` | Backend API (requires running server) |

---

## Commands

> All commands run from the repository root.  
> E2E commands require the frontend (`localhost:3000`) and backend (`localhost:5000`) to be running.  
> Admin E2E additionally requires the admin portal (`localhost:5174`).

### Primary Regression Commands

```bash
# Run full regression (unit + integration + student E2E)
npm run test:regression

# Run unit + integration only (no services required)
npm run test:regression:unit

# Run only the student E2E regression (services required)
npm run test:regression:e2e

# Run regression + admin E2E (all services required)
npm run test:regression:full
```

### Supporting Commands

```bash
# Individual layers
npm run test:unit:frontend        # Vitest, CIE engine unit tests
npm run test:unit:backend         # node:test, CIE rules engine unit tests
npm run test:integration          # node:test, CIE integration tests (no server)
npm run test:api                  # node:test + fetch, CIE API contract (server required)

# Full E2E suites (unfiltered)
npm run test:e2e                  # All student E2E specs
npm run test:admin-e2e            # All admin E2E specs

# Critical regression only (Playwright)
npx playwright test --grep @critical --project=public-chromium
```

---

## Relationship: Regression / Critical / Smoke

| Term | Definition | Status |
| :--- | :--- | :--- |
| **Regression** | Re-run of selected existing tests after changes | ✅ Implemented (this suite) |
| **Critical** | Subset of regression: P0 security and auth flows | ✅ Implemented (via `@critical` tag) |
| **Smoke** | Ultra-fast "is the app alive?" subset | Deferred to later step |
| **Performance** | Benchmarks, load, DB profiling | Always separate (`test:perf:*`) |

---

## Current Baseline Test Coverage

As of the last verified run (`2026-09-09`):

| Suite | Tests | Passed | Runtime |
| :--- | :---: | :---: | :--- |
| Frontend unit (`cieEngine.test.js`) | 5 | 5 | ~264ms |
| Backend unit (`cieRulesEngine.test.js`) | 5 | 5 | ~82ms |
| Backend integration (`cieIntegration.test.js`) | 5 | 5 | ~1.0s |
| Student E2E — CIE Analyzer (regression tag) | 6 | 6 | ~42s |
| **Total verified** | **21** | **21** | **~44s** |

The remaining tagged specs (`landing`, `navigation`, `academics`, `calculators`, `api-routing`, `user-registration`, `session-persistence`) and the admin E2E regression tags will be verified in the first full `test:regression` run.
