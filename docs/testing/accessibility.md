# AskUrSenior — Accessibility (a11y) Testing Foundation

> **Purpose**: Establish an automated, repeatable accessibility testing foundation using Playwright and `@axe-core/playwright` to detect structural accessibility defects, missing ARIA attributes, form labeling gaps, and contrast issues during feature development.  
> **Key Principle**: **Automated tests catch only ~30–40% of accessibility issues**. Automated checks with Axe are an essential baseline gate, but true accessibility requires manual keyboard navigation, screen-reader validation, and semantic design.

---

## 1. Tooling & Architecture

We use **`@axe-core/playwright`** directly embedded within our established Playwright testing infrastructure:
- **Zero new test runners**: Uses standard Playwright browser fixtures (`page`) and matchers (`expect`).
- **Standardized Engine**: Axe-core evaluates DOM trees against WCAG 2.0, 2.1, and 2.2 Level A and AA criteria.
- **Tagging**: Accessibility tests are tagged with `@accessibility` and integrated into the test selection architecture.

---

## 2. What Automated Accessibility Testing Can and Cannot Detect

### What It Can Detect
- **Form Controls & Labels**: Inputs, buttons, and `<select>` dropdowns missing accessible names, `<label>` elements, or `aria-label` attributes (`button-name`, `select-name`, `label`).
- **Color Contrast**: Foreground text vs. background contrast ratios below 4.5:1 (normal text) or 3:1 (large text) in standard static DOM (`color-contrast`).
- **ARIA Semantics**: Invalid ARIA roles, missing required ARIA parent/child relationships, or unsupported attributes (`aria-valid-attr`, `aria-roles`).
- **Heading Hierarchy**: Skipped heading levels (e.g. `<h1>` followed directly by `<h4>`).
- **Images & Icons**: Missing `alt` attributes on `<img>` or missing accessible labels on interactive SVG icons (`image-alt`, `svg-img-alt`).
- **Landmarks**: Duplicate or missing landmark regions (`<main>`, `<nav>`, `<header>`).

### What It Cannot Detect
- **Keyboard Logical Tab Order**: Whether tab focus travels naturally through interactive components.
- **Focus Indicators & Trapping**: Whether modal dialogs properly trap and restore focus upon dismissal.
- **Dynamic Content & Live Regions**: Whether screen readers announce live notifications, toasts, or real-time score updates (`aria-live`).
- **Semantic Meaning of Text**: Whether button or link labels make sense in context (e.g., "Click here" vs. "View CIE Summary").
- **Custom Touch Target Sizing**: Physical tap target sizes on mobile layouts.

---

## 3. Standard Commands

All accessibility commands run from the repository root:

```bash
# Run student-facing automated accessibility suite (Landing, Calculators, Dashboard, CIE Analyzer)
npm run test:accessibility

# Run specific student accessibility test
npm run test:accessibility:student

# Run admin portal accessibility test (requires admin portal running on :5174)
npm run test:accessibility:admin
```

---

## 4. Current Baseline & Pages Checked

Ran against the active local development environment (`http://localhost:3000` + `http://localhost:5000`):

| Test ID | Target Page / Flow | URL / State | Status | Violations Discovered |
| :--- | :--- | :--- | :---: | :--- |
| **`A11Y-001`** | Public Landing Page | `/` (Public) | ✅ PASS | 1 rule (`color-contrast` [SERIOUS] on subtle footer/hero text) |
| **`A11Y-002`** | Public Calculators | `/calculator` (Public) | ✅ PASS | 2 rules (`button-name` [CRITICAL] on reset icon; `select-name` [CRITICAL] on grading dropdowns) |
| **`A11Y-003`** | Student CIE Workspace | `/dashboard/settings?tab=cie` (Auth) | ✅ PASS | 1 rule (`color-contrast` [SERIOUS] on status badges) |
| **`A11Y-004`** | Student Home / Dashboard | `/home` (Auth) | ✅ PASS | 2 rules (`color-contrast` [SERIOUS]; `svg-img-alt` [SERIOUS] on Lucide icon buttons) |

---

## 5. Existing Violations Catalog (Baseline Technical Debt)

The following pre-existing UI accessibility issues were cataloged during the Step 12 baseline scan:

1. **Calculators Page (`/calculator`)**:
   - `button-name`: Icon-only action button lacks `aria-label` or visually hidden text.
   - `select-name`: Semester and scheme `<select>` elements lack explicit `<label for="...">` or `aria-label`.
2. **Landing & Student Dashboard**:
   - `color-contrast`: Dark-mode theme elements using semi-transparent text colors (e.g. `text-white/60`) have contrast ratios slightly below the 4.5:1 WCAG AA threshold against dark card backgrounds.
   - `svg-img-alt`: SVG icons rendered inside interactive elements without `aria-hidden="true"` or `title`.

*Per project policy, these pre-existing issues are cataloged rather than modified in a broad cosmetic refactoring pass.*

---

## 6. Future Feature Rule: Adding Accessibility Checks

When building a new UI component or student/admin page:
1. **Semantic HTML First**:
   - Use real `<button>` elements for actions and `<a>` elements for navigation.
   - Every input and select must have an associated `<label>` or `aria-label`.
2. **Icon Buttons**:
   - Always supply an `aria-label` on buttons that contain only icons (e.g. `<button aria-label="Close dialog"><X /></button>`).
3. **Automated Axe Assertion**:
   - In the feature's E2E test, add an automated Axe scan:
     ```javascript
     import AxeBuilder from '@axe-core/playwright';
     
     const results = await new AxeBuilder({ page })
       .withTags(['wcag2a', 'wcag2aa'])
       .analyze();
     expect(results.violations).toHaveLength(0);
     ```
