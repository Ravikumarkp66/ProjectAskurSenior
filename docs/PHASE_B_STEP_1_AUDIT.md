# Phase B — Step 1: System Inspection & Architectural Audit

**Document:** `docs/PHASE_B_STEP_1_AUDIT.md`  
**Date:** September 2026  
**Status:** Complete  
**Scope:** Academic Structural Core + Admin Scoping (Phase B, Step 1)

---

## 1. Current Academic Structure

The existing AskUrSenior backend was historically designed around a single-institution or flat-department operational model. An inspection of the codebase reveals the following existing academic elements:

1. **Branch / Department:**
   - Represented by `backend/models/Branch.js` (collection: `branches`).
   - Fields: `name` (String, required), `shortName` (String, unique, uppercase, e.g., 'CSE'), `displayOrder` (Number), `status` ('Published' | 'Hidden').
   - Legacy usage: Served as the primary division for academic materials, syllabus notes, and admin department assignment.
   - Limitation: Lacked any relationship to parent colleges or degree programs.

2. **Program:**
   - Represented by `backend/models/Program.js` (collection: `cms_programs`).
   - Fields: `name`, `shortName` (unique), `status`, `displayOrder`.
   - Legacy usage: Used strictly for CMS curriculum grouping (e.g. VTU engineering).

3. **Semester:**
   - Represented by `backend/models/Semester.js` (collection: `cms_semesters`).
   - Fields: `number` (Number), `label` (String), `year` (Number), `program` (ref: `Program`).
   - Limitation: Unconnected to college, batch, or calendar start/end dates.

4. **Scheme:**
   - Represented by `backend/models/Scheme.js` (collection: `schemes`).
   - Fields: `name` (String, unique, e.g., '2022 Scheme'), `status` ('Published' | 'Hidden').
   - Limitation: Global uniqueness on `name` prevents multi-college tenanting where two institutions both operate a '2022 Scheme'.

5. **College:**
   - Prior to Step 1, referenced in `backend/models/StudentAccount.js` (`college: { type: ObjectId, ref: 'College' }`), but **no Mongoose model** existed for `College`.
   - Colleges were treated primarily as free-text strings (`collegeName`).

6. **Batch & Section:**
   - No dedicated models existed.
   - `StudentAccount` tracked batch implicitly via `admissionYear` (Number) and `graduationYear` (Number), and section as a flat uppercase string (defaulting to `'A'`).
   - Did not support programs without sections or distinct section capacities.

---

## 2. Existing Admin Authorization

The administrative authorization layer is implemented across:
- `backend/models/Admin.js` (collection: `admins`)
- `backend/middleware/adminAuth.js`
- `backend/controllers/adminManagementController.js`
- `admin/src/utils/permissions.js` (Frontend permissions helper)

### Current Capabilities:
1. **Roles:**
   - `SUPER_ADMIN`: Root platform administrator with full bypass over departmental filters and granular permissions. Hard limit of 3 Super Admins enforced in business logic.
   - `ADMIN`: Institutional or departmental administrator.

2. **Granular Permissions Object:**
   - `Admin.permissions` contains a nested Map/Mixed structure covering modules:
     - `users`, `subjects`, `materials`, `queries`, `requests`, `timetable`, `events`, `academicSettings`, `semesters`.
   - Evaluated via `requirePermission('module.action')` middleware.

3. **Legacy Department Confinement:**
   - `enforceDepartmentScope` in `adminAuth.js` restricts an `ADMIN` to their assigned `Admin.department` (an ObjectId ref to `Branch`).
   - It forcefully overrides `req.query.branch` and `req.body.branch` with the admin's `shortName`.

### Critical Deficiencies Identified:
1. **Flat Departmental Confinement:** Only understands a single `Branch`. Has zero comprehension of `College`, `Program`, `Batch`, `Semester`, or `Section`.
2. **Cannot Express Class-Level Administration:** A faculty member acting as a Section Teacher for "CSE Section A (Batch 2024)" cannot be restricted to Section A; they either receive whole-branch access or nothing.
3. **No Multi-Tenancy Defense:** An admin from College A could theoretically query resources of College B if endpoints only filter on branch name (e.g. `branch='CSE'`).
4. **No Server-Side IDOR Interception:** Resource routes taking entity IDs (such as `/:sectionId` or `/:batchId`) did not verify whether the referenced entity falls within the admin's institutional jurisdiction.

---

## 3. Existing Data Models

| Model | Collection | Primary Identifiers | Academic Fields |
|---|---|---|---|
| `Admin` | `admins` | `_id`, `email` (unique) | `department` (ref `Branch`), `permissions`, `status` |
| `StudentAccount` | `student_accounts` | `_id`, `email`, `studentId`, `usn` | `college` (ref `College`), `collegeName`, `branch` (ref `Branch`), `scheme` (ref `Scheme`), `admissionYear`, `graduationYear`, `semester` (1-8), `section` ('A') |
| `User` (Legacy) | `users` | `_id`, `email`, `usn` | `branch` (Enum: 22 strings), `collegeName` (String), `semesterTimeline` (embedded dates) |
| `Branch` | `branches` | `_id`, `shortName` (unique) | `name`, `shortName`, `displayOrder`, `status` |
| `Scheme` | `schemes` | `_id`, `name` (unique) | `name`, `status` |
| `Program` | `cms_programs` | `_id`, `shortName` (unique) | `name`, `shortName`, `status` |
| `Semester` | `cms_semesters` | `_id`, compound `(number, program)` | `number`, `label`, `year`, `program` |
| `AdminActivity` | `admin_activities` | `_id`, `adminId` | `action`, `resourceType`, `resourceId`, `department`, `metadata` |

---

## 4. Conflicts with Phase A Architecture

| Conflict Item | Legacy Implementation | Phase A Requirement | Resolution Strategy |
|---|---|---|---|
| **Global Uniqueness on Scheme Name** | `Scheme.name` is globally unique. | Multiple colleges share common scheme names (e.g., "2022 Scheme"). | Add `college` ref to `Scheme`. Make index compound: `{ name: 1, college: 1 }`. |
| **Global Uniqueness on Branch ShortName** | `Branch.shortName` is globally unique. | Different colleges operate a "CSE" department independently. | Maintain legacy `shortName` unique for single-tenant legacy routes, while enabling `(college, shortName)` compound scoping for multi-college structure. |
| **Hardcoded Semester Bounds** | `StudentAccount.semester` restricted to `min: 1, max: 8`. | Programs have variable semester counts (e.g., MCA is 4, diplomas 6). | Drive semester counts dynamically from `AcademicProgram.maxSemesters`. |
| **Flat Single-Branch Admin** | `Admin.department` is a single `Branch` ObjectId. | Admins need multi-level hierarchical scopes (College, Program, Branch, Batch, Semester, Sections). | Add `Admin.scopes` array: `[{ college, program, branch, batch, semester, sections }]`. Keep `Admin.department` as fallback for legacy routes. |
| **Orphan Sections & Batches** | Sections and batches did not exist as formal entities. | Every section must belong to a batch, which belongs to a program/branch, under a college. | Implement `AcademicBatch` and `AcademicSection` with enforced parent foreign keys. |
| **Missing Official Semester Dates** | Semesters lacked admin calendar baseline start/end dates. | Semester model must store official admin dates that serve as baseline for timetables and calendars. | Add official baseline dates (`startDate`, `endDate`, `termType`) to the academic semester model. |

---

## 5. Proposed Migration / Compatibility Approach

To guarantee zero regression across all existing features (including public notes, student auth, and existing admin panel):

1. **Additive Schema Strategy:**
   - Do **NOT** drop or rename legacy collections (`branches`, `schemes`, `cms_semesters`, `admins`).
   - Add new structural models:
     - `backend/models/College.js` (`colleges`)
     - `backend/models/AcademicProgram.js` (`academic_programs`)
     - `backend/models/AcademicBatch.js` (`academic_batches`)
     - `backend/models/AcademicSection.js` (`academic_sections`)
   - Enhance existing models in a backward-compatible manner:
     - `Branch.js`: Add optional `college` and `program` fields.
     - `Scheme.js`: Add optional `college` field.
     - `Semester.js`: Add optional `college`, `batch`, `startDate`, `endDate`, and `status`.
     - `Admin.js`: Add `scopes` array and support new academic permission keys (`academic_structure`, `academic_settings`).

2. **Dual-Layer Authorization Engine:**
   - Create `backend/middleware/scopeAuthorization.js`:
     - Computes access: `Access = Role + Scope + Permissions`.
     - Super Admin bypasses scope constraints (while remaining fully authenticated and audited).
     - Regular Admin is validated against `admin.scopes` hierarchically:
       - If `scope.college` matches, evaluates descendants (`program`, `branch`, `batch`, `semester`, `sections`).
       - Empty `sections: []` or omitted sub-fields act as wildcards (e.g. Department Head has access to all sections in CSE).
       - Explicit `sections: [secA, secB]` restricts admin strictly to those section IDs.
     - Protects against IDOR by inspecting URL route params (`:collegeId`, `:branchId`, `:batchId`, `:semesterId`, `:sectionId`) and payload IDs.

3. **Audit Continuity:**
   - Hook all structural mutations directly into the existing `adminActivityService.logActivity()`.
   - Log `resourceType: 'COLLEGE' | 'SCHEME' | 'PROGRAM' | 'BRANCH' | 'BATCH' | 'SEMESTER' | 'SECTION' | 'ADMIN_SCOPE'`.

---

## 6. Files That Will Be Changed / Created

### New Files Created (Step 1):
1. `backend/models/College.js` — Institution entity.
2. `backend/models/AcademicProgram.js` — Degree program entity (B.E., MCA, etc.).
3. `backend/models/AcademicBatch.js` — Cohort entity (2022-2026).
4. `backend/models/AcademicSection.js` — Classroom section entity.
5. `backend/middleware/scopeAuthorization.js` — Scope and IDOR validation middleware.
6. `backend/controllers/academicStructureController.js` — REST controller for Step 1 structural CRUD and admin scopes.
7. `backend/routes/academicStructureRoutes.js` — Step 1 academic routes.
8. `backend/tests/academicStructureE2E.test.js` — Comprehensive test suite covering all 26 scenarios and edge cases.
9. `admin/src/pages/AcademicStructurePage.jsx` — Clean minimal admin UI for structural core and scope management.

### Existing Files Modified:
1. `backend/models/Admin.js` — Added `scopes` array and academic permission schema defaults.
2. `backend/models/Branch.js` — Added optional `college` and `program` references.
3. `backend/models/Scheme.js` — Added optional `college` reference.
4. `backend/models/Semester.js` — Added academic context and official baseline dates.
5. `backend/server.js` — Registered `/api/academic/structure` routes.
6. `admin/src/layouts/AdminLayout.jsx` — Added Structural Core navigation tab for authorized admins.
7. `admin/src/App.jsx` — Registered route `/academic-structure`.

---

## 7. Files That Will Remain Untouched

To maintain strict adherence to Step 1 boundaries:
- **Subjects & Curriculum:** `backend/models/AcademicSubject.js`, `backend/models/CmsSubject.js`, `backend/models/StudentRegisteredSubject.js`, `backend/routes/subjectRoutes.js`, `backend/controllers/subjectController.js`.
- **Timetable & Schedules:** `backend/models/ClassOccurrence.js`, `backend/routes/timetableRoutes.js`.
- **Attendance Engine:** `backend/controllers/attendanceController.js`, `backend/services/attendanceCalculatorService.js`, `backend/tests/attendance*.test.js`.
- **Student Overrides & Personalization:** All student-side overrides, student custom calendars, student subject registrations.
- **Legacy Notes & Materials:** `backend/models/CmsMaterial.js`, `backend/routes/materialRoutes.js`.

---

## 8. Institutional Scope & Scaling Decision: SIT Tumkur

- **Target Institution:** Siddaganga Institute of Technology (SIT), Tumakuru, Karnataka.
- **Operating Mode:** The platform is configured in single-institution mode targeting SIT exclusively.
- **Extensibility & Future Scaling:** Adding extra colleges has been disabled in the UI and locked in the backend controller to prevent accidental addition of external colleges. However, the data architecture maintains complete multi-tenant scalability (i.e. `College` model, `college` foreign keys on programs, batches, sections, and admin scopes). When future colleges are onboarded, zero database restructuring or migrations will be required.

---
*End of Audit Document.*
