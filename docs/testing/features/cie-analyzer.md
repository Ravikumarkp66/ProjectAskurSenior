# Feature Traceability Matrix: CIE Analyzer

> **Feature**: Continuous Internal Evaluation (CIE) Analyzer  
> **Module**: Student Academics & Grade Prediction  
> **Status**: Fully Automated & Verified across all 4 Testing Layers  
> **Pilot Reference**: Step 14 Test Traceability Pilot

---

## 1. Feature Overview & Requirements

The CIE Analyzer empowers VTU students to track internal assessment performance, calculate theory and practical component contributions, evaluate passing eligibility against institutional thresholds (40% component minimum), and analyze required Semester End Examination (SEE) marks.

### Key Requirements (User Stories)
- **REQ-CIE-01**: The system shall accurately classify courses into evaluation categories (`THEORY_ONLY`, `IPCC`, `PRACTICAL_ONLY`) based on course codes, names, and credit structures.
- **REQ-CIE-02**: The system shall compute total CIE marks using scheme-specific formulas (e.g., VTU 2022 IPCC: Theory 50 scaled to 25 + Practical 25 = CIE 50).
- **REQ-CIE-03**: The system shall enforce component-level passing thresholds (minimum 40% in theory and practical components) to determine eligibility.
- **REQ-CIE-04**: The system shall support real-time auto-saving with debouncing when students edit marks in the UI.
- **REQ-CIE-05**: The system shall prevent client-side and server-side submission of marks exceeding prescribed limits (e.g., IA max 20, Quiz max 10).
- **REQ-CIE-06**: The system shall isolate student CIE records to prevent cross-student tampering or resource enumeration (IDOR prevention).
- **REQ-CIE-07**: The system shall ensure CIE calculations and persisted marks roundtrip seamlessly through the database and reload accurately.

---

## 2. Traceability Matrix

| Requirement | Test ID | Test Layer | Summary / Objective | Automated Test File | Tags / Suites |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-CIE-01** | `CIE-UNIT-001` | Frontend Unit & Backend Unit | Course classification by credit & name pattern | `frontend/src/utils/__tests__/cieEngine.test.js`<br>`backend/services/__tests__/cieRulesEngine.test.js` | Unit Regression |
| **REQ-CIE-02** | `CIE-UNIT-002` | Frontend Unit & Backend Unit | Theory-only course calculation & eligibility | `frontend/src/utils/__tests__/cieEngine.test.js`<br>`backend/services/__tests__/cieRulesEngine.test.js` | Unit Regression |
| **REQ-CIE-02** | `CIE-UNIT-003` | Frontend Unit & Backend Unit | IPCC theory scaling (50 to 25) and practical summation | `frontend/src/utils/__tests__/cieEngine.test.js`<br>`backend/services/__tests__/cieRulesEngine.test.js` | Unit Regression |
| **REQ-CIE-03** | `CIE-UNIT-004` | Frontend Unit & Backend Unit | Enforce 40% component minimum passing threshold | `frontend/src/utils/__tests__/cieEngine.test.js`<br>`backend/services/__tests__/cieRulesEngine.test.js` | Unit Regression |
| **REQ-CIE-02** | `CIE-UNIT-005` | Frontend Unit & Backend Unit | Empty/missing inputs handling without NaN | `frontend/src/utils/__tests__/cieEngine.test.js`<br>`backend/services/__tests__/cieRulesEngine.test.js` | Unit Regression |
| **REQ-CIE-06** | `CIE-INTEGRATION-001` | Integration | Controller payload validation & subject ownership | `backend/tests/cieIntegration.test.js` | Unit Regression, Security |
| **REQ-CIE-02** | `CIE-INTEGRATION-002` | Integration | Full service/model flow: save, rules engine, DB persist | `backend/tests/cieIntegration.test.js` | Unit Regression |
| **REQ-CIE-03** | `CIE-INTEGRATION-003` | Integration | Threshold failure propagation to status in database | `backend/tests/cieIntegration.test.js` | Unit Regression |
| **REQ-CIE-07** | `CIE-INTEGRATION-004` | Integration | Dashboard aggregation of registered subjects + marks | `backend/tests/cieIntegration.test.js` | Unit Regression |
| **REQ-CIE-04** | `CIE-INTEGRATION-005` | Integration | Partial marks workflow assigns PARTIAL status | `backend/tests/cieIntegration.test.js` | Unit Regression |
| **REQ-CIE-07** | `CIE-API-001` | HTTP API | Authenticated GET `/api/auth/profile/cie` | `backend/tests/api/cieApi.test.js` | API Suite |
| **REQ-CIE-04** | `CIE-API-002` | HTTP API | Authenticated PUT `/api/auth/profile/cie` (Save) | `backend/tests/api/cieApi.test.js` | API Suite |
| **REQ-CIE-06** | `CIE-API-003` | HTTP API | Unauthenticated request rejected with HTTP 401 | `backend/tests/api/cieApi.test.js` | API Suite, Security |
| **REQ-CIE-05** | `CIE-API-004` | HTTP API | Invalid payload validation rejected with HTTP 400 | `backend/tests/api/cieApi.test.js` | API Suite, Robustness |
| **REQ-CIE-06** | `CIE-API-005` | HTTP API | Cross-student IDOR attempt rejected with HTTP 404 | `backend/tests/api/cieApi.test.js` | API Suite, Security |
| **REQ-CIE-04** | `CIE-API-006` | HTTP API | Partial marks workflow updates status over HTTP | `backend/tests/api/cieApi.test.js` | API Suite |
| **REQ-CIE-07** | `CIE-E2E-001` | Student E2E | Student opens CIE Analyzer & views navigation | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |
| **REQ-CIE-01** | `CIE-E2E-002` | Student E2E | Semester selector loads registered CIE cards | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |
| **REQ-CIE-04** | `CIE-E2E-003` | Student E2E | Enter marks -> auto-save debouncing -> score updates | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |
| **REQ-CIE-05** | `CIE-E2E-004` | Student E2E | Client-side input validation prevents exceeding max | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |
| **REQ-CIE-02** | `CIE-E2E-005` | Student E2E | Switch between Entry workspace and CIE Summary tab | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |
| **REQ-CIE-07** | `CIE-E2E-006` | Student E2E | Database persistence verified across full page reload | `e2e/cie-analyzer.spec.js` | `@regression`, `@critical` |

---

## 3. Detailed Test Case Specifications

### A. Unit Testing Layer

#### CIE-UNIT-001: Course Evaluation Type Classification
- **What**: Verifies `determineEvaluationType` / `detectSubjectType` accurately categorizes courses.
- **Why**: Evaluation formulas differ substantially between IPCC, Theory, and Practical courses. Misclassification invalidates calculations.
- **Where**:
  - Frontend: [`frontend/src/utils/__tests__/cieEngine.test.js`](file:///c:/AskUrSenior/frontend/src/utils/__tests__/cieEngine.test.js)
  - Backend: [`backend/services/__tests__/cieRulesEngine.test.js`](file:///c:/AskUrSenior/backend/services/__tests__/cieRulesEngine.test.js)
- **Layer**: Unit
- **Test Design Technique**: Equivalence Class Partitioning (classes: theory credits, 4-credit IPCC keywords, practical codes).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Courses with laboratory components map to `IPCC`, labs map to `PRACTICAL_ONLY`, standard courses map to `THEORY_ONLY`.

#### CIE-UNIT-002: Theory-Only CIE Calculation & Eligibility
- **What**: Computes CIE for theory-only subjects with IA tests and assignments.
- **Why**: Proves core VTU calculation logic (IA best-of/average + assignments) produces accurate total CIE and passing status.
- **Where**: `cieEngine.test.js` & `cieRulesEngine.test.js`
- **Layer**: Unit
- **Test Design Technique**: Boundary Value Analysis (score thresholds at passing line 20/50).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Score correctly sums to passing grade; `isEligible: true`.

#### CIE-UNIT-003: IPCC Scaling and Practical Summation
- **What**: Scales theory component (50 * 0.5 = 25) and adds practical marks (25) to derive CIE out of 50.
- **Why**: Guarantees no floating-point rounding errors occur during scale conversion.
- **Where**: `cieEngine.test.js` & `cieRulesEngine.test.js`
- **Layer**: Unit
- **Test Design Technique**: Equivalence Partitioning & Special Value Testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Scaled theory (25.0) + Practical (25.0) = 50.0 total CIE.

#### CIE-UNIT-004: Component-Level Minimum Threshold Enforcement
- **What**: Evaluates failure when a component drops below institutional minimum (e.g. theory < 10/25 or practical < 10/25).
- **Why**: VTU regulations fail students who achieve high overall total but fail individual components.
- **Where**: `cieEngine.test.js` & `cieRulesEngine.test.js`
- **Layer**: Unit
- **Test Design Technique**: Boundary Value Analysis & Decision Table testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: `isEligible: false`, `status: FAILED` even if composite score >= 20.

#### CIE-UNIT-005: Missing / Empty Input Handling
- **What**: Verifies calculation engines handle unrecorded marks without throwing exceptions or generating `NaN`.
- **Why**: Prevents client crashes and backend unhandled rejections during initial student registration.
- **Where**: `cieEngine.test.js` & `cieRulesEngine.test.js`
- **Layer**: Unit
- **Test Design Technique**: Robustness Testing & Special Value Testing (`undefined`, `null`, `{}`).
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Returns `status: NOT_STARTED`, `cieTotal: 0`, `isEligible: false`, without runtime errors.

---

### B. Integration Testing Layer

#### CIE-INTEGRATION-001: Controller Validation & Ownership
- **What**: Ensures controller verifies payload structure and asserts that the student owns the registered subject.
- **Why**: Prevents saving marks to subjects outside the student's curriculum.
- **Where**: [`backend/tests/cieIntegration.test.js`](file:///c:/AskUrSenior/backend/tests/cieIntegration.test.js)
- **Layer**: Integration (Controller + Service)
- **Test Design Technique**: Robustness & Security Confinement.
- **Suites**: Unit Regression (`npm run test:regression:unit`), Security.
- **Expected Result**: Valid payloads pass; foreign subject requests reject cleanly.

#### CIE-INTEGRATION-002: End-to-End Save & Rules Engine Persistence
- **What**: Controller invokes `cieRulesEngine`, updates student document, and commits to database.
- **Why**: Proves model schema, rules engine calculations, and Mongoose persistence collaborate correctly.
- **Where**: [`backend/tests/cieIntegration.test.js`](file:///c:/AskUrSenior/backend/tests/cieIntegration.test.js)
- **Layer**: Integration (Service + Database Model)
- **Test Design Technique**: State Transition & Equivalence Class Testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: HTTP 200 returned; persisted document matches calculation output.

#### CIE-INTEGRATION-003: Component Threshold Failure Persistence
- **What**: Ensures calculation failure status persists accurately in database records.
- **Why**: Prevents database state drifting out of sync with calculation rules.
- **Where**: [`backend/tests/cieIntegration.test.js`](file:///c:/AskUrSenior/backend/tests/cieIntegration.test.js)
- **Layer**: Integration
- **Test Design Technique**: Decision Table Testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Document saved with `status: 'FAILED'`, `isEligible: false`.

#### CIE-INTEGRATION-004: Dashboard Aggregation & Summary Metrics
- **What**: Aggregates all registered semester subjects, joins persisted CIE records, and calculates summary metrics.
- **Why**: Powers the student overview dashboard.
- **Where**: [`backend/tests/cieIntegration.test.js`](file:///c:/AskUrSenior/backend/tests/cieIntegration.test.js)
- **Layer**: Integration
- **Test Design Technique**: Basis Path Testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Returns combined array with overall passing percentage and subject count.

#### CIE-INTEGRATION-005: Partial Marks Workflow Status Assignment
- **What**: Validates that recording some but not all assessment marks marks the subject status as `PARTIAL`.
- **Why**: Students record marks incrementally as semesters progress.
- **Where**: [`backend/tests/cieIntegration.test.js`](file:///c:/AskUrSenior/backend/tests/cieIntegration.test.js)
- **Layer**: Integration
- **Test Design Technique**: Cause-Effect Testing.
- **Suites**: Unit Regression (`npm run test:regression:unit`)
- **Expected Result**: Status committed as `PARTIAL` rather than `NOT_STARTED` or `PASSED`.

---

### C. HTTP API Testing Layer

#### CIE-API-001: Authenticated CIE Dashboard Retrieval
- **What**: GET `/api/auth/profile/cie` returns student's complete CIE dashboard payload over HTTP.
- **Why**: Verifies complete HTTP route, middleware, controller, and serializer contract.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: Equivalence Class Testing (valid authenticated session).
- **Suites**: API Suite (`npm run test:api`)
- **Expected Result**: HTTP 200 with JSON structure `{ success: true, data: { subjects: [...] } }`.

#### CIE-API-002: Authenticated CIE Marks Update
- **What**: PUT `/api/auth/profile/cie` updates assessment marks over HTTP.
- **Why**: Proves frontend client can persist student entries via standard REST API.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: State Transition Testing.
- **Suites**: API Suite (`npm run test:api`)
- **Expected Result**: HTTP 200 with updated scores and eligibility status.

#### CIE-API-003: Unauthenticated Access Rejection
- **What**: GET/PUT `/api/auth/profile/cie` without token or with invalid token.
- **Why**: Proves authentication boundary protects student grade data.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: Robustness & Negative Testing.
- **Suites**: API Suite (`npm run test:api`), Security Suite.
- **Expected Result**: HTTP 401 Unauthorized.

#### CIE-API-004: Malformed Payload Validation
- **What**: PUT `/api/auth/profile/cie` with negative numbers, strings, or missing identifiers.
- **Why**: Validates Express route validation before database models process inputs.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: Boundary Value Analysis & Robustness.
- **Suites**: API Suite (`npm run test:api`)
- **Expected Result**: HTTP 400 Bad Request with descriptive validation error message.

#### CIE-API-005: Cross-Student Resource Isolation (IDOR)
- **What**: Student A submits a mark update referencing Student B's registered subject ID.
- **Why**: Guarantees multi-tenant data isolation; prevents Insecure Direct Object References.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: Security Boundary Testing.
- **Suites**: API Suite (`npm run test:api`), Security Suite.
- **Expected Result**: HTTP 404 (or 403), preventing data mutation or resource enumeration.

#### CIE-API-006: Partial Marks Workflow Over HTTP
- **What**: Saving incomplete marks payload over HTTP sets `PARTIAL` status in API response.
- **Why**: Verifies API serializer matches integration contract.
- **Where**: [`backend/tests/api/cieApi.test.js`](file:///c:/AskUrSenior/backend/tests/api/cieApi.test.js)
- **Layer**: HTTP API
- **Test Design Technique**: Cause-Effect Testing.
- **Suites**: API Suite (`npm run test:api`)
- **Expected Result**: HTTP 200 with `status: 'PARTIAL'`.

---

### D. Student E2E Browser Testing Layer

#### CIE-E2E-001: Header Navigation & Workspace Mounting
- **What**: Student navigates to `/home/cie` and verifies header, tabs, and layout elements mount.
- **Why**: Proves routing, authenticated layout, and top bar render properly in real browser.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: Equivalence Class Testing.
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: Header and Entry/Summary tabs visible within timeout.

#### CIE-E2E-002: Semester Selection & Subject Card Rendering
- **What**: Student selects Semester 4; subject cards for registered curriculum render.
- **Why**: Proves live API fetch, state synchronization, and card grid generation.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: State Transition Testing.
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: IPCC card (`E2E-CIE-IPCC`) and Theory card render on screen.

#### CIE-E2E-003: Mark Input, Debounced Auto-Save & Live Score Update
- **What**: Student inputs IA-1 and IA-2 marks; UI updates total CIE score and triggers network auto-save.
- **Why**: Core student interaction: verifies debounced typing does not freeze UI or lose input.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: Cause-Effect & Data Flow Testing.
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: Total CIE marks update reactively; auto-save indicator confirms persistence.

#### CIE-E2E-004: Client-Side Input Boundary Enforcement
- **What**: Student attempts to input marks greater than component maximum (e.g. typing `25` into a 20-mark field).
- **Why**: Immediate visual feedback prevents invalid submissions before network roundtrips.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: Boundary Value Analysis (inputting max+1).
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: Input clamps or flags validation error; submission blocked.

#### CIE-E2E-005: Workspace Tab Switching (Entry to Summary)
- **What**: Student toggles between "Marks Entry" workspace and "CIE Summary" overview tab.
- **Why**: Proves tab state persistence without losing uncommitted or reactive changes.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: State Transition Testing.
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: Summary table reflects updated marks and overall passing standing.

#### CIE-E2E-006: Persistence Across Full Page Reload
- **What**: Student reloads page (`F5`) after entering marks; previously entered marks are restored from backend.
- **Why**: Proves full database roundtrip: Browser -> React -> Express -> MongoDB -> Reload -> Restored State.
- **Where**: [`e2e/cie-analyzer.spec.js`](file:///c:/AskUrSenior/e2e/cie-analyzer.spec.js)
- **Layer**: E2E (Playwright)
- **Test Design Technique**: Equivalence Partitioning & Roundtrip Verification.
- **Suites**: `@regression`, `@critical` (`npm run test:regression:e2e`)
- **Expected Result**: All entered marks and computed totals match pre-reload values exactly.

---

## 4. Cross-Cutting Quality Dimension Coverage

In addition to feature-specific tests, the CIE Analyzer is verified by cross-cutting test suites:

- **Accessibility**: Covered in [`docs/testing/accessibility.md`](../accessibility.md) via [`e2e/accessibility.spec.js`](file:///c:/AskUrSenior/e2e/accessibility.spec.js). Audits semantic structure, input labels, contrast ratios, and keyboard navigation across student pages.
- **Security**: Documented in [`docs/testing/security-testing.md`](../security-testing.md). Specifically covers `CIE-API-003` (unauthenticated 401) and `CIE-API-005` (cross-student IDOR isolation).
- **Performance**: Documented in [`docs/testing/performance.md`](../performance.md). Query execution times on `AcademicSubject` and `AcademicMaterial` maintain sub-3ms execution (`db-profiler.js`).
