# AskUrSenior — Static Code Quality Foundation & Policy

> **Purpose**: Establish an automated, low-overhead static code analysis workflow to prevent syntax errors, runtime reference bugs (`no-undef`), bad React hook practices, and dead variables before code is committed.  
> **Key Principle**: **Quality over Cosmetic Churn**. We enforce structural correctness, error prevention, and framework rules rather than enforcing mass formatting modifications across existing code.

---

## 1. Tools and Configuration

We use modern **ESLint (Flat Config)** tailored to each project's runtime environment without unnecessary cross-project coupling:

| Subsystem | Runtime / Framework | Configuration File | Ruleset / Plugins |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite (ESM) | `frontend/eslint.config.js` | `@eslint/js` recommended, `eslint-plugin-react`, `eslint-plugin-react-hooks` (Rules of Hooks & exhaustive-deps), browser globals. |
| **Admin** | React 18 + Vite (ESM) | `admin/eslint.config.js` | `@eslint/js` recommended, `eslint-plugin-react`, `eslint-plugin-react-hooks`, browser globals. |
| **Backend** | Node.js + Express (CJS) | `backend/eslint.config.mjs` | `@eslint/js` recommended, Node.js & ES2021 globals, test runners globals (`node:test`). |

*Note: Prettier was not present in the repository and has intentionally not been added to avoid wholesale repository-wide reformatting diffs.*

---

## 2. Standard Commands

All lint commands are accessible at both the root level and inside individual workspaces:

### Root Level
```bash
# Run linting across all three workspaces sequentially
npm run lint

# Lint individual workspaces from the root
npm run lint:frontend
npm run lint:admin
npm run lint:backend
```

### Workspace Subdirectories
```bash
# In frontend/
npm run lint

# In admin/
npm run lint

# In backend/
npm run lint
```

---

## 3. What Linting Checks

ESLint is configured to catch real functional and structural defects:
1. **Reference & Syntax Errors (`no-undef`, `no-dupe-keys`)**: Catches misspelled identifiers, missing imports, and duplicate object keys that cause runtime crashes.
2. **React Hook Invariants (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`)**: Ensures hooks are never called conditionally or after early returns, preventing component desynchronization and re-render crashes.
3. **Dead Code & Unused Variables (`no-unused-vars`)**: Flags unused imports, dangling variables, and unreferenced parameters (arguments starting with `_` are permitted).
4. **Empty Blocks (`no-empty`)**: Flags unhandled empty statements, while allowing intentional empty `catch {}` blocks (`allowEmptyCatch: true`).
5. **Test Code Integrity**: Test suites (`__tests__`, `*.test.js`) are actively linted with testing globals (`describe`, `test`, `expect`, `vi`) configured.

---

## 4. Scope and Exclusions

The following directories and artifacts are explicitly ignored from static analysis:
- `node_modules/**` (external dependencies)
- `dist/**`, `build/**` (compiled production assets)
- `coverage/**`, `.c8_output/**` (code coverage reports)
- `test-results/**`, `playwright-report/**` (E2E run artifacts)
- `uploads/**`, `logs/**`, `scratch/**`, `tmp/**` (temporary runtime directories)

---

## 5. Current Baseline & Handling Pre-Existing Violations

### Baseline Audit Summary (Step 10)

| Workspace | Errors | Warnings | Primary Violation Categories |
| :--- | :---: | :---: | :--- |
| **Frontend** | ~27 | ~2,300 | Pre-existing conditional hooks in landing components (`react-hooks/rules-of-hooks`), unused icon/Lucide imports in UI pages. |
| **Admin** | 1 | ~147 | 1 undefined variable in `AcademicStructurePage.jsx` (`PERIOD_DEFINITIONS`), unused imports. |
| **Backend** | ~60 | ~240 | Pre-existing empty blocks in legacy scripts, unused route arguments, duplicate Mongo query keys (`$ne`). |

### Policy for Existing vs. New Code
- **Do NOT mass-fix unrelated legacy code**: Running a wholesale automated fix across thousands of pre-existing warnings risks introducing behavioral regressions and obscures git history.
- **Rule for New Features & PRs**:
  1. Any newly created or modified file must pass lint with **0 errors**.
  2. Test code (`*.test.js`, `*.spec.js`) introduced with a feature must have clean imports and no unused declarations.
  3. Pre-existing warnings in untouched files remain tracked as tech debt and should be addressed incrementally during dedicated refactoring passes.

---

## 6. Fixes Applied in Step 10
During configuration, the following immediate, high-value fixes were applied to newly introduced testing and component files:
- **`frontend/src/utils/__tests__/cieEngine.test.js`**: Removed unreferenced `CIE_RULES` import.
- **`frontend/src/pages/dashboard/settings/components/cie/CieRawInputWorkspace.jsx`**: Refactored `useState` and `useEffect` calls to run unconditionally before early exit checks, fixing a `react-hooks/rules-of-hooks` violation.
- **`backend/services/cieRulesEngine.js`**: Removed dead pre-assignment of `status` and `isEligible` variables (`no-useless-assignment`).
- **`backend/services/__tests__/cieRulesEngine.test.js`**: Removed unreferenced `SIT_CIE_CONFIG` import.
- **`backend/tests/cieIntegration.test.js`**: Removed unused `cieRulesEngine` controller-layer require.
