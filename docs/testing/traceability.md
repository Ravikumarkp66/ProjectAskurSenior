# AskUrSenior — Test Traceability & Test Design Framework

> **Purpose**: Establish an end-to-end traceability model connecting business requirements to automated verification, test suites, and execution runs across AskUrSenior.  
> **Key Principle**: Maintainability through simplicity. Traceability is maintained via lightweight Markdown files co-located with the codebase, standard identifiers, and dynamic tags—never through bloated spreadsheets or external test-management databases.

---

## 1. Traceability Architecture

Traceability connects user needs directly to automated code execution:

```text
Requirement / User Story
         │
         ▼
     Test Case                (Specification: Human-readable intent & contract)
         │
         ▼
  Automated Test              (Implementation: Executable test code in repo)
         │
         ▼
    Suite / Tag               (Logical grouping: @regression, @critical, @security)
         │
         ▼
   Test Execution             (Runtime: Local terminal run, status, metrics)
```

---

## 2. Core Concepts & Distinctions

To avoid confusion in team discussions, AskUrSenior strictly distinguishes between the four concepts:

### A. Test Case (Specification)
A human-readable document defining **what** must be verified, **why**, and under what inputs/preconditions.  
- Defined using [`test-case-template.md`](./test-case-template.md).
- Stored in `docs/testing/features/<feature-name>.md`.
- Identified by a permanent, immutable Test ID (e.g. `CIE-UNIT-001`).

### B. Automated Test (Implementation)
The executable JavaScript/Node code that exercises the system and asserts the outcome.  
- Lives in test files (e.g. `*.test.js`, `*.spec.js`).
- Embedding the Test ID in the test name ensures grep-ability and linkability.

### C. Test Suite (Logical Selection)
A logical collection of automated tests selected for a specific quality gate or feedback loop.  
- AskUrSenior uses **tag-based and script-based selection**, NOT duplicate test files.
- Examples:
  - `npm run test:regression:unit`: Executes unit and integration tests.
  - `playwright test --grep @regression`: Executes end-to-end regression tests.
  - `playwright test --grep @security`: Executes security invariant tests.
  - `playwright test --project=performance`: Executes performance benchmarks.

### D. Test Execution (Runtime Evidence)
A specific invocation of one or more test suites in an environment at a point in time.  
- Produces pass/fail logs, execution time, and coverage reports.
- Captured locally during developer workflows.

---

## 3. Cardinality & Design Rules

1. **One-to-Many Mappings**: One Test Case may map to multiple automated tests. For instance, a requirement specifying "Marks cannot exceed maximum" may be implemented by a frontend client-side validation test (`CIE-E2E-004`) and a backend controller validation test (`CIE-API-004`).
2. **Multi-Suite Membership via Tags**: A single automated test can participate in multiple logical suites without code duplication. For example:
   ```javascript
   test.describe('CIE Analyzer Student Experience E2E', { tag: ['@regression', '@critical'] }, () => { ... });
   ```
3. **Immutability of Test IDs**: Once a Test ID is assigned, it must never be renamed or renumbered. If a test becomes obsolete, mark it `DEPRECATED` in the feature document rather than reusing the ID.
4. **Bidirectional Linkage**:
   - The test case document links to the source file path and function name.
   - The automated test code includes the Test ID in its string title (e.g. `test('CIE-UNIT-001: ...')`).

---

## 4. Test ID Naming Rules

AskUrSenior uses a structured identifier convention:

```text
<FEATURE>-<LAYER>-<SEQUENCE>
```

### Components

1. **`<FEATURE>`**: 2–4 character uppercase feature code:
   - `CIE`: CIE Internal Assessment Analyzer
   - `ACAD`: Academic Curriculum & Structure
   - `TIME`: Section Timetable
   - `AUTH`: Authentication & Session Management
   - `CALC`: SGPA / CGPA Calculators
   - `MAT`: Study Materials & Document Hub (AskFinder)

2. **`<LAYER>`**: The architectural layer under test:
   - `UNIT`: Isolated unit logic (pure functions, algorithms, helper modules)
   - `INTEGRATION`: Cross-component backend collaboration (controller + service + DB model)
   - `API`: HTTP boundary contract (Route -> Middleware -> Controller -> Response)
   - `E2E`: Full-stack browser experience via Playwright

3. **`<SEQUENCE>`**: 3-digit zero-padded number starting at `001` (e.g., `001`, `002`, `003`).

### Cross-Cutting Quality Dimension Identifiers

For system-wide non-functional dimensions not tied to a single feature, use:
- `A11Y-001` – `A11Y-nnn`: Accessibility assertions
- `SECURITY-001` – `SECURITY-nnn`: Administrative & session security assertions
- `PERF-001` – `PERF-nnn`: System benchmark flows

---

## 5. Test Design Technique Guidance

AskUrSenior testing applies rigorous test design techniques from academic software engineering syllabus. **Do not force every technique into every test.** Choose techniques based on the input types, risks, and logic of the feature:

| Technique | Description | When to Apply in AskUrSenior | Example in Codebase |
| :--- | :--- | :--- | :--- |
| **Boundary Value Analysis (BVA)** | Tests boundaries between equivalence classes (min, min+1, nominal, max-1, max, and out-of-bounds). | Numeric inputs, grade ranges, marks limits, attendance percentages. | `CIE-E2E-004` (testing IA mark 20 vs 21), `CIE-UNIT-004` (minimum 40% threshold). |
| **Equivalence Class Partitioning (ECP)** | Partitions input data into valid and invalid classes where system behaves similarly. | Categorical inputs, scheme years, course evaluation types. | `CIE-UNIT-001` (partitioning into `THEORY_ONLY`, `IPCC`, `PRACTICAL_ONLY`). |
| **Decision Tables** | Tables mapping combinations of input conditions to specific output actions. | Multi-factor business rules, passing criteria combining attendance + CIE. | `CIE-INTEGRATION-003` (evaluating theory pass + practical fail = overall fail). |
| **Cause-Effect Testing** | Analyzes input conditions (causes) and their direct and chained side effects. | State transitions, partial marks saves updating summary badges. | `CIE-INTEGRATION-005` (partial marks input cause -> `PARTIAL` status effect). |
| **Robustness Testing** | Exercises extreme values, negative numbers, out-of-range types, and unexpected characters. | API contract testing, payload validation, database schemas. | `CIE-API-004` (negative marks, non-numeric strings, missing required fields). |
| **Special Value Testing** | Tests specific known sensitive values (`0`, `null`, `undefined`, empty string, extreme dates). | Engine edge cases, zero marks, unrecorded subjects. | `CIE-UNIT-005` (empty marks object returning `NOT_STARTED` without `NaN`). |
| **Random Testing** | Generating arbitrary valid inputs to detect unpredictable crashes or rounding artifacts. | Floating-point calculations, SGPA scaling algorithms. | Scaling theory marks with varied fractional assignments. |
| **Basis Path / Code-Based Testing** | Derives independent execution paths through cyclomatic complexity analysis. | Complex calculation modules, conditional branching. | `cieRulesEngine.js` path coverage (100% decision coverage). |
| **Data Flow Testing** | Tracks variable lifecycles from definition (`def`) to usage (`use`) to destruction (`kill`). | State synchronization in React contexts and cached API responses. | Context mark auto-save debounce -> state commit -> API persist. |

---

## 6. How to Keep the System Maintainable

To ensure test documentation does not decay or become an administrative burden:

1. **Co-locate with Code**: Store feature test documentation in `docs/testing/features/<feature>.md` alongside the repo.
2. **Never Create Duplicate Tests**: Do not create a separate "regression" or "smoke" test file. Tag existing automated tests with `@regression`, `@critical`, etc.
3. **No External Spreadsheets**: Markdown tables under git version control ensure documentation evolves with pull requests.
4. **Automated Traceability Checks**: Run unit and regression commands directly from `package.json` to verify that documented IDs match executing code.
