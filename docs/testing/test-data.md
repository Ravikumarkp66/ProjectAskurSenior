# AskUrSenior — Test Data & Environment Management Strategy

> **Purpose**: Establish a controlled, repeatable, and isolated test data and environment management foundation for AskUrSenior.  
> **Core Principle**: Future automated tests must be **isolated**, **deterministic**, **safe to re-run**, and **easy to reset**, without ever touching production systems, copying sensitive student data, or risking developer database loss.

---

## 1. Core Test Data Principles

Every automated test in AskUrSenior must adhere to these foundational principles:

1. **Preference for Isolated Data**: Tests should construct their own local state or operate on dedicated test records rather than depending on data left behind by other tests.
2. **Order Independence**: A test should never require that another test ran before it (except in explicitly declared serial E2E user journey flows).
3. **No Reliance on Developer Data**: Tests must never rely on arbitrary manual entries or legacy developer accounts created during exploratory testing.
4. **Deterministic Behavior**: Running the same test 10 times consecutively must produce the exact same outcome every time.
5. **Zero Production Data in Tests**: Sensitive production databases, real student phone numbers, live emails, or actual VTU marks must **never** be copied into local test suites.
6. **Zero Secrets in Repository**: Passwords, production JWT secrets, Twilio auth tokens, AWS credentials, and MongoDB connection strings with production credentials must never be committed to git.
7. **Clear Identification (`e2e-` / `test-` Prefix)**: All synthetic accounts, subjects, and materials must use recognizable prefixes (`e2e-`, `E2E-`, `@test.askursenior.org`, `STAGING01`) to enable safe, targeted cleanup.
8. **Immutability of Shared Fixtures**: If a fixture is shared across multiple tests (e.g. branch definitions or VTU scheme rules), it must be strictly read-only. Tests must never mutate shared fixtures.
9. **Atomic Cleanup for Mutating Tests**: Tests that write records to persistent databases must perform targeted teardown or run within an automated setup/cleanup lifecycle.

---

## 2. Test Environment Categories

AskUrSenior categorizes test execution environments into distinct layers. We distinguish **currently implemented local environments** from **future environments**:

| Environment | Scope & Dependencies | Status | How It Is Managed |
| :--- | :--- | :--- | :--- |
| **1. Local Unit** | Pure in-memory execution. No external network, database, or server processes. Pure logic and calculation algorithms. | **Active / Implemented** | Run via Vitest (frontend) or `node:test` (backend). Executed anywhere instantly. |
| **2. Local Integration** | Application controllers and services running locally. Database models mocked or stubbed in memory (`createMockQuery`). | **Active / Implemented** | Run via `node:test`. Model methods stubbed in `before()` and restored in `after()`. |
| **3. Local API** | Real HTTP requests to a local Express server on `http://127.0.0.1:5000` connected to local MongoDB. | **Active / Implemented** | Developer launches `node server.js`. Tests invoke REST endpoints via native `fetch`. |
| **4. Local E2E** | Full-stack execution: Chromium browser -> Vite dev server (`:3000`) -> Express backend (`:5000`) -> Local MongoDB. | **Active / Implemented** | Managed via Playwright. Uses local auth sessions and targeted seed/cleanup scripts. |
| **5. Future Staging** | Isolated pre-production cloud environment with synthetic staging database and ephemeral test accounts. | *Future (Deferred)* | *Documented only. Do not configure or deploy during local testing steps.* |
| **6. Future Production** | Live user-facing system. Strict read-only synthetic probes or non-destructive heartbeat checks only. | *Future (Deferred)* | *Documented only. Production testing is prohibited during local development.* |

---

## 3. Test Environment Variables Audit & Standards

The following environment variables govern test execution. Safe local defaults are enforced across all test harnesses:

| Variable Name | Purpose | Test Layer(s) | Required? | Safe Local Default | Committed Secret? |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `MONGODB_URI` | Connection string to local MongoDB database. | Backend Server, Admin E2E, DB Profiler | Yes (local DB) | `mongodb://localhost:27017/askursenior_staging` (in `backend/.env`) | ❌ Never |
| `API_BASE_URL` | Base URL for API tests and performance load testing. | API Tests, Load Tester | No | `http://localhost:5000/api` | ❌ No |
| `E2E_BACKEND_URL` | Base backend server URL for Playwright tests and auth setup. | Student E2E, Admin E2E, Auth Setup | No | `http://localhost:5000` | ❌ No |
| `PLAYWRIGHT_BASE_URL` | Base student frontend URL. | Student E2E, Performance Journey | No | `http://localhost:3000` | ❌ No |
| `E2E_ADMIN_URL` | Base admin portal frontend URL. | Admin E2E | No | `http://localhost:5174` | ❌ No |
| `E2E_TEST_USN` | Pre-seeded test student USN for local authentication. | API Tests, Student E2E | No | `STAGING01` | ❌ No |
| `E2E_TEST_PASSWORD` | Test student password. | API Tests, Student E2E | No | Safe local placeholder | ❌ No |
| `JWT_SECRET` | Backend JWT signing secret. | Backend Auth Middleware | Yes (server) | Defined locally in `backend/.env` | ❌ Never |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Header secret for bypassing Vercel deployment protection. | Staging / Remote only | No | `undefined` (ignored locally) | ❌ Never |

> [!IMPORTANT]
> **Safety Rule**: If `E2E_BACKEND_URL` is omitted, tests must default to local `http://localhost:5000`. Tests must **never** silently fall back to remote hosting (e.g. `onrender.com`) during local development.

---

## 4. Test Database Strategy & Safeguards

AskUrSenior utilizes a hybrid database testing strategy designed to balance execution speed with data safety:

```text
┌────────────────────────────────────────────────────────┐
│                   Unit Tests Layer                     │
│               (Zero Database / Pure JS)                │
└────────────────────────────────────────────────────────┘
                           │
┌────────────────────────────────────────────────────────┐
│               Integration Tests Layer                  │
│       (In-Memory Mongoose Query Stubs / No DB)         │
└────────────────────────────────────────────────────────┘
                           │
┌────────────────────────────────────────────────────────┐
│               API & E2E Tests Layer                    │
│      (Controlled Local DB: askursenior_staging)        │
│    Targeted Seeding (seed.setup.js) + Unique Prefixes  │
│    Targeted Cleanup (cleanup.teardown.js) via Regex    │
└────────────────────────────────────────────────────────┘
```

### Safeguards for Local Developer Databases:
1. **No Destructive Database Commands**: Tests must **never** execute `db.dropDatabase()` or `collection.drop()`. Doing so would wipe a developer's local seed data, branches, and subject catalogs.
2. **Selective Teardown**: Deletion queries must strictly target test-prefixed entities:
   ```javascript
   // Safe teardown pattern in admin-e2e/cleanup.teardown.js
   await db.collection('users').deleteMany({
     $or: [
       { email: { $in: ALL_TEST_EMAILS } },
       { email: { $regex: /^e2e-.*@test\.askursenior\.org$/ } },
       { usn: { $in: ALL_TEST_USNS } }
     ]
   });
   ```
3. **Dedicated Staging / Test Database**: The backend `MONGODB_URI` in local development points to `askursenior_staging` or `askursenior_dev`, keeping development data separated from any production mirrors.

---

## 5. Reusable Test-Data Guidance & Selection Matrix

When writing a new automated test, select the most lightweight data strategy that satisfies the test objective:

| Scenario / Need | Recommended Strategy | Why | Example in Codebase |
| :--- | :--- | :--- | :--- |
| **Pure calculation or algorithm** | **Inline Test Data** | Fastest, zero overhead, perfectly self-contained. | Marks payload in `cieEngine.test.js` (`marks = { test1: 45, ... }`). |
| **Repeated entity object** | **Reusable Fixtures / Helpers** | Avoids boilerplate, standardizes test credentials. | `admin-e2e/helpers/test-accounts.js` (`SUPER1`, `ADMIN_CSE`, `STUDENT_CSE`). |
| **External service dependency** | **Network Stubs / Mocks** | Eliminates external flakiness and third-party rate limits. | S3 document preview mock (`page.route('**/preview-url', ...)`). |
| **Service & Controller collaboration** | **In-Memory Query Stubs** | Fast integration testing without MongoDB connection overhead. | `createMockQuery` stubs in `backend/tests/cieIntegration.test.js`. |
| **Full HTTP / Browser persistence** | **Seeded Database Records** | Validates real Express serialization, middleware, and database write operations. | Test student `STAGING01` in `e2e/cie-analyzer.spec.js` and `cieApi.test.js`. |

---

## 6. CIE Pilot Test Data Mapping

The CIE Analyzer illustrates how different test data inputs map directly to automated test cases across all four layers:

| Data Scenario | Input Data Characteristics | Purpose / Quality Goal | Verified In |
| :--- | :--- | :--- | :--- |
| **Valid Marks (Theory)** | `test1: 45, test2: 45, quiz1: 15, abl1: 15` (within bounds) | Proves standard VTU theory calculation & passing eligibility (`CIE >= 20/50`). | `CIE-UNIT-002`, `CIE-INTEGRATION-002`, `CIE-API-002`, `CIE-E2E-003` |
| **Valid Marks (IPCC)** | Theory: `50` (scaled to 25) + Practical: `25` | Proves scaling algorithm (0.5 multiplier) and component addition without round-off. | `CIE-UNIT-003`, `CIE-INTEGRATION-002`, `CIE-E2E-002` |
| **Component Threshold Failure** | Theory: `18/25` (Pass) + Practical: `8/25` (Fail < 10) | Proves 40% component minimum requirement causes `status: FAILED` despite total >= 20. | `CIE-UNIT-004`, `CIE-INTEGRATION-003` |
| **Zero / Empty Marks** | `{}` or missing fields (`test1: undefined`) | Robustness test: ensures initial subject state returns `NOT_STARTED` without throwing or producing `NaN`. | `CIE-UNIT-005`, `CIE-INTEGRATION-004` |
| **Maximum Boundary Marks** | `ia1: 20` (max allowed for IA component) | Proves upper boundary value analysis. | `CIE-UNIT-002`, `CIE-E2E-004` |
| **Out-of-Bounds / Excessive Marks** | `ia1: 25` (exceeds max 20) | Negative testing: client-side validation prevents submission and flags error. | `CIE-E2E-004` |
| **Malformed / Negative Marks** | `ia1: -5` or `{ rawMarks: "invalid" }` | Robustness: Express route validation returns HTTP 400 Bad Request. | `CIE-API-004` |
| **Partial Marks** | `test1: 30`, remaining components empty | State transition testing: sets status to `PARTIAL` rather than `NOT_STARTED` or `PASSED`. | `CIE-INTEGRATION-005`, `CIE-API-006` |
| **Unauthorized / Cross-Student Access** | Foreign subject ID `6a58b63ea7247a773f56a757` | Security / IDOR: verifies that updating another student's subject returns HTTP 404/403. | `CIE-API-005`, `CIE-INTEGRATION-001` |
| **Unauthenticated Request** | No `Authorization` header | Security: verifies rejection with HTTP 401. | `CIE-API-003` |

---

## 7. Test Isolation & Order-Dependency Review

An audit of existing automated tests identified the following isolation characteristics:

| Test Layer / Suite | Isolation Characteristics | Classification | Notes & Recommendations |
| :--- | :--- | :---: | :--- |
| **Frontend Unit** (`cieEngine.test.js`) | Pure functions, zero shared state, zero I/O. | 🟢 **SAFE** | Completely isolated and parallel-safe. |
| **Backend Unit** (`cieRulesEngine.test.js`) | Pure functions, zero shared state, zero I/O. | 🟢 **SAFE** | Completely isolated and parallel-safe. |
| **Backend Integration** (`cieIntegration.test.js`) | In-memory arrays (`mockSubjects`, `persistedCieRecords`). Stubs restored in `t.after()`. | 🟢 **SAFE** | Isolated within the test file. Does not touch MongoDB. |
| **Admin E2E** (`admin-e2e/`) | Pre-seeds dedicated `e2e-*` records in setup, purges via targeted regex in teardown. | 🟢 **SAFE** | Clean lifecycle; independent of developer records. |
| **Backend API** (`cieApi.test.js`) | Modifies `STAGING01` marks in `CIE-API-002` without an explicit post-test reset. | 🟡 **Needs Attention** | Safe when run serially; if concurrent suites use `STAGING01`, mark values may fluctuate. Documented as safe for single-worker local execution. |
| **Student E2E** (`cie-analyzer.spec.js`) | Declared serial suite (`mode: 'serial'`). `CIE-E2E-006` explicitly tests persistence of marks entered in `CIE-E2E-003`. | 🟡 **Needs Attention** | Order-dependent by design to verify persistence. Serial execution must be maintained. |
| **Legacy Auth Setup** (`auth.setup.js`) | Remote URL fallback (`askursenior-staging.onrender.com`) when `E2E_BACKEND_URL` was unset. | 🟡 **Needs Attention** | Fixed in Step 13/14: local tests now enforce `http://localhost:5000` default. |
