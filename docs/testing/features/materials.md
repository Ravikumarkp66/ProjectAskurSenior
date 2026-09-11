# Feature Traceability Matrix: Materials Section & Academic Scoping

> **Feature**: Study Materials Hub & AskFinder (`/materials`)  
> **Module**: Academic Resources & Document Repository  
> **Status**: Fully Automated & Verified across all Testing Layers (Unit, Backend API, Security, E2E, A11y)  
> **Feature Code**: `MAT`

---

## 1. Feature Overview & Requirements

The Study Materials section (`/materials` and `/ask-finder`) allows VTU students to search, view, preview, bookmark, and download relevant academic documents (lecture notes, question papers, internal CIE tests, and syllabus/curriculum plans).

To eliminate information overload and academic clutter, the system enforces **strict academic scoping**:
1. Students only see study materials matching their specific academic branch and year level (plus institution-wide "Common" materials for that year level).
2. Students filter only by **Material Type** tabs (`All`, `Notes`, `PYQs`, `Internals`, `Others`), the search bar, and **Subject** (available via toolbar dropdown).
3. The secondary filter drawer and sort dropdown are removed, keeping the interface focused and clutter-free (documents naturally sort newest first).
4. Every document row displays exact file metadata: formatted file size (in MB) and human-friendly relative upload time (e.g. `1 day ago`, `2 days ago`, `2 months ago`) with a full date tooltip.
5. Administrators possess a scope toggle (`Scope: My Branch` vs `Admin: All Branches`), unlocking global multi-branch management when needed.

### Key Requirements (User Stories)
- **REQ-MAT-01**: The system shall display document size (in MB) and relative upload time (`X days/months ago`) directly underneath the file name for all documents, with a full date tooltip.
- **REQ-MAT-02**: The system shall strictly isolate document visibility to the logged-in student's branch and year level, including Common materials for that academic year level.
- **REQ-MAT-03**: The system shall allow students to filter by Material Type tabs, text search, and Subject, while keeping Year Level and Branch locked to their academic scope.
- **REQ-MAT-04**: The system shall provide administrators with a dedicated scope toggle button to switch between their personal branch view and the global repository view.
- **REQ-MAT-05**: The system shall enforce zero-latency contextual counter updates on Material Type tabs when search queries, subject filters, or scopes change.
- **REQ-MAT-06**: The backend API shall protect document mutation, approval, and deletion endpoints against unauthorized and unprivileged modifications (HTTP 401/403).
- **REQ-MAT-07**: The backend API shall safely handle special characters and regex metacharacters in search queries without throwing server errors or unhandled regex exceptions.
- **REQ-MAT-08**: The materials UI shall conform to WCAG 2.1 AA accessibility standards with zero critical violations.

---

## 2. Traceability Matrix

| Requirement | Test ID | Test Layer | Summary / Objective | Automated Test File | Tags / Suites |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-MAT-01** | `MAT-UNIT-001` | Frontend Unit | Format document byte sizes to formatted MB with BVA & NaN safety | `frontend/src/utils/__tests__/materialsScope.test.js` | Unit Regression |
| **REQ-MAT-01** | `MAT-UNIT-002` | Frontend Unit | Relative upload time calculation (minutes, hours, days, months, years) | `frontend/src/utils/__tests__/materialsScope.test.js` | Unit Regression |
| **REQ-MAT-02** | `MAT-UNIT-003` | Frontend Unit | Academic branch matching & Common/General wildcard inclusion | `frontend/src/utils/__tests__/materialsScope.test.js` | Unit Regression |
| **REQ-MAT-02** | `MAT-UNIT-004` | Frontend Unit | Academic year level & semester-to-year mapping calculation | `frontend/src/utils/__tests__/materialsScope.test.js` | Unit Regression |
| **REQ-MAT-02** | `MAT-UNIT-005` | Frontend Unit | Student academic scope derivation from profile and USN patterns | `frontend/src/utils/__tests__/materialsScope.test.js` | Unit Regression |
| **REQ-MAT-05** | `MAT-API-001` | Backend API | Documents search and summary statistics schema contract | `backend/tests/api/materialsApi.test.js` | API Suite |
| **REQ-MAT-07** | `MAT-API-002` | Backend API | Search query regex metacharacter robustness (`C++`, `[AI]`, `.*`) | `backend/tests/api/materialsApi.test.js` | API Suite |
| **REQ-MAT-01** | `MAT-API-003` | Backend API | Document download link resolution | `backend/tests/api/materialsApi.test.js` | API Suite |
| **REQ-MAT-07** | `MAT-API-004` | Backend API | Non-existent document returns HTTP 404 cleanly | `backend/tests/api/materialsApi.test.js` | API Suite |
| **REQ-MAT-06** | `MAT-API-005` | Backend API | Bookmark toggle authentication enforcement | `backend/tests/api/materialsApi.test.js` | API Suite |
| **REQ-MAT-06** | `MAT-API-006` | Backend Security | Non-admin document patch rejected with HTTP 403 | `backend/tests/api/materialsApi.test.js` | Security Suite |
| **REQ-MAT-06** | `MAT-API-007` | Backend Security | Non-admin document deletion rejected with HTTP 403 | `backend/tests/api/materialsApi.test.js` | Security Suite |
| **REQ-MAT-06** | `MAT-API-008` | Backend Security | Non-admin document approval rejected with HTTP 403 | `backend/tests/api/materialsApi.test.js` | Security Suite |
| **REQ-MAT-01**<br>**REQ-MAT-02**<br>**REQ-MAT-03** | `MAT-E2E-001` | Student E2E | Student sees scope badge, subject filter, enforced scope drawer, and file metadata | `e2e/materials-scoping.spec.js` | `@regression`, `@materials` |
| **REQ-MAT-03**<br>**REQ-MAT-05** | `MAT-E2E-002` | Student E2E | Material Type tabs filtering and stable contextual counts | `e2e/materials-scoping.spec.js` | `@regression`, `@materials` |
| **REQ-MAT-03** | `MAT-E2E-003` | Student E2E | Search query filtering and reset button behavior | `e2e/materials-scoping.spec.js` | `@regression`, `@materials` |
| **REQ-MAT-04** | `MAT-E2E-004` | Student E2E | Admin user toggles from student scope to All Branches & opens drawer | `e2e/materials-scoping.spec.js` | `@regression`, `@materials` |
| **REQ-MAT-08** | `MAT-A11Y-001` | Accessibility | Axe-core automated WCAG 2.1 AA scan on Materials page | `e2e/materials-scoping.spec.js` | `@regression`, `@materials` |

---

## 3. Detailed Test Case Specifications

### A. Unit Testing Layer

#### MAT-UNIT-001: Document File Size Byte Formatting
- **What**: Verifies `formatSize` / `formatFileSize` converts raw byte counts to human-readable megabyte strings.
- **Why**: Students need to immediately assess mobile data usage before downloading materials.
- **Where**: [`frontend/src/utils/__tests__/materialsScope.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/materialsScope.test.js)
- **Layer**: Unit
- **Test Design Technique**: Boundary Value Analysis (`0`, `524288` [0.50 MB], `1048576` [1.00 MB], `388421` [0.37 MB]) & Robustness (`null`, `undefined`, negative numbers, non-numeric strings).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Outputs string formatted as `X.XX MB`; handles invalid/empty inputs gracefully as `'0.00 MB'`.

#### MAT-UNIT-002: Relative Time Ago Formatter
- **What**: Computes human-friendly relative upload timestamps (e.g. `Just now`, `5 minutes ago`, `2 hours ago`, `1 day ago`, `2 days ago`, `2 months ago`, `1 year ago`).
- **Why**: Users requested concise freshness markers under every document title.
- **Where**: [`frontend/src/utils/__tests__/materialsScope.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/materialsScope.test.js)
- **Layer**: Unit
- **Test Design Technique**: Boundary Value Analysis (interval edges at 60 seconds, 24 hours, 30 days, 365 days) & Equivalence Class Partitioning.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Produces grammatically accurate singular/plural relative strings; defaults to `'Recently'` on invalid dates.

#### MAT-UNIT-003: Academic Branch Scoping & Common Wildcards
- **What**: Evaluates whether a document's branch matches the target student's branch.
- **Why**: Core scoping requirement ensuring students do not see irrelevant materials from other departments.
- **Where**: [`frontend/src/utils/__tests__/materialsScope.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/materialsScope.test.js)
- **Layer**: Unit
- **Test Design Technique**: Equivalence Class Partitioning (classes: direct branch code match, alias equivalence e.g. CS -> CSE, wildcard branches `COMMON`/`ALL`/`GENERAL`, 1st Year all-branch wildcard, cross-branch mismatch).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: True for same branch, aliases, and common subjects; False for non-matching branches (e.g. `ECE` document for `ISE` student in 4th Year).

#### MAT-UNIT-004: Academic Year Level & Semester Mapping
- **What**: Evaluates whether a document matches the student's academic year level.
- **Why**: Documents may be tagged with year levels (`4th Year`) or specific semester numbers (`7th Sem`, `Sem 8`). Both must resolve accurately.
- **Where**: [`frontend/src/utils/__tests__/materialsScope.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/materialsScope.test.js)
- **Layer**: Unit
- **Test Design Technique**: Decision Table & Equivalence Partitioning (Semesters 1-2 -> 1st Year, 3-4 -> 2nd Year, 5-6 -> 3rd Year, 7-8 -> 4th Year).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Documents in matching semesters return true; documents in differing year levels return false.

#### MAT-UNIT-005: Student Scope Derivation from Profile & USN
- **What**: Derives `{ branch, yearLevel, isScoped }` from user objects across various population states.
- **Why**: Students register with different profile completeness; fallback USN parsing ensures zero configuration is needed.
- **Where**: [`frontend/src/utils/__tests__/materialsScope.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/materialsScope.test.js)
- **Layer**: Unit
- **Test Design Technique**: Robustness Testing & Equivalence Partitioning (`null` user, full user, USN-only user, semester-only user).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Accurately normalizes branch to canonical acronym (e.g. `ISE`, `CSE`) and year level to `Nth Year`.

---

### B. Backend API & Security Layer

#### MAT-API-001: Documents Search & Summary Contract
- **What**: Exercises `GET /api/documents/search` and verifies JSON schema of returned items and type summary counters.
- **Where**: [`backend/tests/api/materialsApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/materialsApi.test.js)
- **Layer**: HTTP API
- **Suites**: API Suite (`npm run test:api`)

#### MAT-API-002: Regex Metacharacter Robustness
- **What**: Sends complex query strings (`C++`, `[AI]`, `(Math)`, `.*`) to `GET /api/documents/search?q=...`.
- **Where**: [`backend/tests/api/materialsApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/materialsApi.test.js)
- **Layer**: HTTP API Robustness
- **Suites**: API Suite (`npm run test:api`)

#### MAT-API-003 – MAT-API-005: Download, 404, & Bookmark Contracts
- **What**: Tests document download URL generation, non-existent 404 handling, and bookmark authentication checks.
- **Where**: [`backend/tests/api/materialsApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/materialsApi.test.js)
- **Layer**: HTTP API
- **Suites**: API Suite (`npm run test:api`)

#### MAT-API-006 – MAT-API-008: Admin Endpoint Authorization Gates
- **What**: Attempts document patch, deletion, and approval using non-admin student credentials.
- **Where**: [`backend/tests/api/materialsApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/materialsApi.test.js)
- **Layer**: Security (`@security`)
- **Suites**: Security Suite (`npm run test:security`)
- **Expected Result**: HTTP 403 Forbidden with security error message.

---

### C. Playwright E2E & Accessibility Layer

#### MAT-E2E-001: Authenticated Student View & Metadata
- **What**: Verifies academic scope badge (`ISE · 4th Year`), file size, relative upload time, full date tooltip, and absence of secondary filter drawer.
- **Where**: [`e2e/materials-scoping.spec.js`](file:///c:/AskUrSenior/e2e/materials-scoping.spec.js)
- **Layer**: Student E2E
- **Suites**: `@regression`, `@materials`

#### MAT-E2E-002: Material Type Tabs Filtering & Counters
- **What**: Cycles through Material Type tabs (`All`, `Notes`, `PYQs`, `Internals`, `Others`), verifying documents filtered and contextual counts remained stable.
- **Where**: [`e2e/materials-scoping.spec.js`](file:///c:/AskUrSenior/e2e/materials-scoping.spec.js)
- **Layer**: Student E2E
- **Suites**: `@regression`, `@materials`

#### MAT-E2E-003: Search Filtering & Query Reset
- **What**: Types keyword queries, confirms filtered results, verifies empty state on non-matching query, and tests both search clear button (X) and reset button.
- **Where**: [`e2e/materials-scoping.spec.js`](file:///c:/AskUrSenior/e2e/materials-scoping.spec.js)
- **Layer**: Student E2E
- **Suites**: `@regression`, `@materials`

#### MAT-E2E-004: Admin Scope Toggle & Drawer Access
- **What**: Injects admin user, toggles `Scope: My Branch` -> `Admin: All Branches`, and verifies secondary filter drawer with Year and Branch selectors opens.
- **Where**: [`e2e/materials-scoping.spec.js`](file:///c:/AskUrSenior/e2e/materials-scoping.spec.js)
- **Layer**: Student E2E
- **Suites**: `@regression`, `@materials`

#### MAT-A11Y-001: WCAG 2.1 AA Accessibility Audit
- **What**: Scans the Materials section using `@axe-core/playwright` for WCAG 2.1 Level A and AA compliance.
- **Where**: [`e2e/materials-scoping.spec.js`](file:///c:/AskUrSenior/e2e/materials-scoping.spec.js)
- **Layer**: Automated Accessibility
- **Suites**: `@regression`, `@materials`
- **Expected Result**: 0 critical violations.
