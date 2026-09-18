# AskUrSenior — Test Coverage Foundation & Policy

> **Purpose**: Establish a local, low-overhead test coverage measurement system to guide testing quality during feature development.  
> **Key Principle**: **Coverage ≠ Quality**. A high line percentage does not guarantee absence of bugs. Coverage is a diagnostic tool to detect untested code paths and edge cases, not a metric to be blindly maximized.

---

## 1. Why Test Coverage is Used

In AskUrSenior, coverage measurement serves three pragmatic purposes:
1. **Gap Detection**: Identifies critical calculations, branches, or failure conditions in business logic that were missed during test-case design.
2. **Regression Confidence**: Confirms that newly introduced functions or modified algorithms are exercised by automated unit and integration tests.
3. **Traceability**: Validates that regulatory and academic rules (e.g. CIE calculation, attendance thresholds, SGPA scaling) have concrete test verification.

Coverage is strictly a **local development tool**. We do not enforce arbitrary global percentage gates that encourage writing superficial, low-value tests.

---

## 2. Tools and Technology Selection

The coverage toolchain aligns directly with our established testing architecture without adding heavy or conflicting frameworks:

| Subsystem | Test Runner | Coverage Engine | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vitest | `@vitest/coverage-v8` | Native V8 coverage integration with Vite; zero Babel overhead; fast in-memory execution. |
| **Admin** | Vitest *(when unit tests added)* | `@vitest/coverage-v8` | Independent configuration; matches frontend standard. |
| **Backend** | `node:test` | `c8` (V8 coverage) | Leverages Node.js native V8 code coverage without replacing the built-in `node:test` runner. |
| **E2E** | Playwright | N/A | E2E tests validate end-to-end user journeys; not measured via unit code coverage. |

Both `@vitest/coverage-v8` and `c8` utilize the identical underlying V8 coverage format, ensuring consistent branch and statement accounting across the stack.

---

## 3. Standardized Commands

All coverage commands can be executed from the root or inside their respective subdirectories:

### Root Level
```bash
# Run coverage across all testable layers (Frontend + Backend)
npm run test:coverage

# Run Frontend unit coverage only
npm run test:coverage:frontend

# Run Backend unit & integration coverage only
npm run test:coverage:backend
```

### Subdirectory Commands
```bash
# Frontend (from frontend/)
npm run test:coverage         # Runs Vitest with V8 coverage

# Backend (from backend/)
npm run test:coverage         # Runs c8 across unit and integration tests
npm run test:coverage:unit    # Runs c8 on unit tests only
npm run test:coverage:integration # Runs c8 on integration tests only
```

---

## 4. Scope and Exclusions

Coverage focuses strictly on **application business logic and services**.

### Excluded from Coverage
- `node_modules/**`: Third-party dependencies
- `**/*.test.{js,jsx}`, `**/*.spec.{js,jsx}`, `**/__tests__/**`: Test code itself
- `dist/**`, `build/**`: Production build outputs
- `coverage/**`, `.c8_output/**`: Generated coverage artifacts
- `uploads/**`, `logs/**`, `scratch/**`, `tmp/**`: Ephemeral runtime directories

### Report Formats & Local Artifacts
Both frontend and backend generate two complementary local reports:
1. **Terminal Text Summary**: Instant tabular breakdown of Statements, Branches, Functions, and Lines with uncovered line ranges.
2. **Interactive HTML Report**:
   - Frontend: `frontend/coverage/index.html`
   - Backend: `backend/coverage/index.html`
   - Open these in any browser to inspect lines and branches highlighted in red/yellow/green.

> **Note**: Generated `coverage/` directories and `.c8_output/` are ignored in `.gitignore` across the root, frontend, and backend packages. They should never be committed to git.

---

## 5. Current Baseline Coverage (Step 9)

Measurement taken with the established Step 4–7 CIE automated suites:

### A. Frontend Unit Coverage (`cieEngine.js`)
- **Suite**: `frontend/src/utils/__tests__/cieEngine.test.js` (5 tests)
- **Results**:
  - Statements: **61.87%** (86/139)
  - Branches: **61.16%** (63/103)
  - Functions: **30.76%** (4/13)
  - Lines: **60.31%** (76/126)
- **Uncovered Sections**: UI formatting helper routines and low-theory legacy fallbacks that are covered in component/integration tests rather than pure calculation tests.

### B. Backend Core Rules Coverage (`cieRulesEngine.js`)
- **Unit Suite Only** (`backend/services/__tests__/cieRulesEngine.test.js`):
  - Statements: **96.56%**
  - Branches: **78.26%**
  - Functions: **100.00%**
  - Lines: **96.56%**
- **Combined Unit + Integration Suite** (`cieRulesEngine.test.js` + `cieIntegration.test.js`):
  - Statements: **97.99%**
  - Branches: **82.35%**
  - Functions: **100.00%**
  - Lines: **97.99%**
- **Uncovered Sections**: Rare defensive branch fallbacks (e.g. division by zero guards).

### C. Admin Portal
- **Current State**: Admin currently relies on E2E testing (`admin-e2e/`, 12 test suites). No unit test files currently exist in `admin/src/`.
- **Status**: Unit coverage is deferred until unit tests are authored for admin utilities or components. The identical Vitest + V8 pattern will be applied at that time.

---

## 6. Practical Rule for Future Feature Development

Whenever developing a new feature (e.g. attendance tracking, grade forecasting, exam timetabling):

1. **Unit Layer — Critical Business Rules**:
   - Pure functions, calculations, algorithms, and decision matrices must have dedicated unit tests.
   - Target high branch coverage for calculation and validation algorithms (aim for >90% on newly added calculation engines).

2. **Integration / API Layer — Collaboration & Data Contracts**:
   - Service-to-database operations, ownership enforcement, and status persistence should have integration tests.
   - Verify that controllers propagate engine results to database records accurately.

3. **E2E Layer — Critical User Journeys**:
   - The primary user journey through the browser (form submission, auto-save, reload persistence) must have Playwright E2E coverage.

4. **Change-Focused Review**:
   - When reviewing PRs or local changes, inspect the HTML coverage report **specifically for the modified files**.
   - Check whether newly added `if/else` branches and error catches are covered.
   - Do not chase global repo-wide percentages; focus coverage on the code you touched.
