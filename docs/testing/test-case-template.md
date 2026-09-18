# AskUrSenior — Test Case Specification Template

> **Purpose**: A lightweight, practical markdown template for specifying functional and non-functional test cases across AskUrSenior.  
> **Philosophy**: Simple, maintainable, and directly connected to automated test code. Avoid heavyweight spreadsheets or disconnected test management tools.

---

## Blank Test Case Template

Copy and paste the template below when documenting new feature test specifications (e.g., in `docs/testing/features/<feature-name>.md`).

```markdown
### [TEST-ID]: [Short Descriptive Title]

- **Feature**: [Feature name, e.g. CIE Analyzer, Timetable, Attendance]
- **Requirement / Scenario**: [Specific requirement or user story reference]
- **Objective**: [What behavior or invariant does this test prove?]
- **Test Layer**: [Frontend Unit | Backend Unit | Integration | API | E2E]
- **Test Design Technique**: [Boundary Value Analysis | Equivalence Class Partitioning | Decision Table | Cause-Effect | Robustness | Special Value | Code-based / Basis Path]
- **Priority**: [P0 - Blocker | P1 - High | P2 - Medium | P3 - Low]
- **Risk**: [High | Medium | Low]
- **Tags**: [@regression, @critical, @smoke, @security, @performance]
- **Status**: [Automated | In Progress | Draft]

#### Preconditions
- [State of system before test executes, e.g. Authenticated student with USN 'STAGING01']
- [Database seed state, e.g. Registered IPCC subject 'CS301' with scheme '2022']

#### Test Data
- **Input**: `{ ... }`
- **Boundary / Constraints**: [e.g. IA-1 max 20, Quiz max 10, total theory max 50]

#### Test Steps
1. [Action step 1]
2. [Action step 2]
3. [Action step 3]

#### Expected Result
- [Observable outcome, assertion, HTTP status, or UI state]

#### Automation Link
- **Automated Test File**: `path/to/test-file.test.js`
- **Automated Test Identifier**: `[TEST-ID]`
- **Local Run Command**: `npm run ...`
```

---

## Concrete Example: CIE Analyzer Unit Test

```markdown
### CIE-UNIT-003: Calculate IPCC Course CIE with Theory Scaling and Practical Component

- **Feature**: CIE Analyzer
- **Requirement / Scenario**: VTU 2022 Scheme IPCC evaluation formula (Theory 50 scaled to 25 + Practical 25 = CIE 50)
- **Objective**: Verify that Integrated Professional Core Courses correctly scale theory marks by 0.5 and add practical marks without round-off error.
- **Test Layer**: Backend Unit
- **Test Design Technique**: Equivalence Class Partitioning + Boundary Value Analysis
- **Priority**: P0 - Blocker
- **Risk**: High (calculation inaccuracy impacts academic standing)
- **Tags**: `@regression`, `@critical`
- **Status**: Automated

#### Preconditions
- Calculation engine loaded in isolation without database dependency.

#### Test Data
- **Subject Type**: `IPCC`
- **Theory Marks**: `ia1: 20`, `ia2: 18`, `quiz1: 10`, `assignment: 2` (Total: 50)
- **Practical Marks**: `lab1: 15`, `lab2: 10` (Total: 25)

#### Test Steps
1. Pass IPCC marks payload to `calculateSubjectCie()`.
2. Inspect scaled theory component and practical sum.
3. Verify total CIE score and passing status.

#### Expected Result
- Scaled theory equals `25.0` (50 * 0.5).
- Practical equals `25.0`.
- Total CIE equals `50.0`.
- Passing status is `PASSED` (`isEligible: true`).

#### Automation Link
- **Automated Test File**: `backend/services/__tests__/cieRulesEngine.test.js`
- **Automated Test Identifier**: `CIE-UNIT-003`
- **Local Run Command**: `npm run test:unit:backend`
```

---

## Guidelines for Field Selection

| Field | Allowed Values / Guidance |
| :--- | :--- |
| **Test Layer** | `Frontend Unit` (Vitest/V8), `Backend Unit` (`node:test`), `Integration` (`node:test` + mock DB/services), `API` (`node:test` + native fetch), `E2E` (Playwright browser). |
| **Test Design Technique** | Select the primary technique applied (see [`traceability.md`](./traceability.md#5-test-design-technique-guidance)). |
| **Priority** | `P0` (core calculation / authentication / data loss), `P1` (primary user journey), `P2` (secondary workflow / edge cases), `P3` (cosmetic / non-blocking). |
| **Tags** | `@regression` (runs in regression gate), `@critical` (P0 smoke flow), `@security` (security invariant), `@performance` (latency benchmark). |
| **Automation Link** | Must reference an existing file path and test identifier. If not yet automated, record `Pending Automation`. |
