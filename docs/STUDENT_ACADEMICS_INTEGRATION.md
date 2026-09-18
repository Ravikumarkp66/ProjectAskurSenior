# AskUrSenior — Student Academics Architecture & Integration Specification

**Status**: Verified & Production Ready  
**Date**: September 2026  
**Architecture Rule**: The Admin Panel is the authoritative source of truth. Student Academics is a pure consumer and read-only projection of that data, with limited personal configuration (such as "My Target Attendance").

---

## 1. Architectural Foundation

```
                           ADMIN PANEL (Authoritative Master)
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
            Institutional Structure                   Section Assignments
       ├── College (SIT)                         ├── Academic Batch (2022-2026)
       ├── Program (B.E.)                        ├── Branch (CSE, ISE, ECE)
       ├── Working Days & Timings                ├── Academic Sections (A, B, C)
       ├── Attendance Threshold (85% Min)        ├── Official Semesters (S1..S8)
       └── Breaks & Periods (P1..P8)             └── Published Section Timetable
                                          │
                                          ▼
                               STUDENT ACADEMICS (Consumer)
                                          │
        ┌─────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                ▼
1. Semesters (View)             2. Subjects (Curriculum)          3. Timetable (Grid)
  • Past terms (completed)        • Authoritative syllabus          • Section schedule
  • Active term (current)         • Official course codes           • Rooms & faculty
  • Future terms (MASKED/403)     • Course registration             • Read-only projection
                                          │
                                          ▼
                             4. Academic Settings (Split)
               ┌──────────────────────────┴──────────────────────────┐
               ▼                                                     ▼
    Admin Baseline (Read-Only)                             Personal Settings (Editable)
    • College Minimum: 85% (Locked)                        • "My Target Attendance": 90%
    • Hours: 08:00 AM - 05:00 PM                           • Enrolled Section Switcher
    • Periods: 50m / Labs: 100m                            • (Does not alter 85% college min)
```

---

## 2. Data Ownership Matrix

| Feature / Attribute | Authority | Student Privilege | Backend Enforcement |
| :--- | :--- | :--- | :--- |
| **College & Program** | Admin Panel | Read-Only | Auto-resolved to SIT & B.E. |
| **Academic Batch** | Admin Panel | Read-Only | Computed from admission/graduation year |
| **Branch** | Admin Panel | Read-Only | Immutable once verified |
| **Academic Section** | Admin Panel | Controlled Enrolment | Validated against batch + branch + current semester (IDOR protected) |
| **Semester Dates** | Admin Panel | Read-Only | Defined on official `Semester` collection |
| **Semester Visibility** | Admin Panel | Read-Only (Past + Current) | `number <= student.semester`; future returns `HTTP 403` |
| **Timetable Structure** | Super Admin | Read-Only | Hours, duration, working days, and breaks are locked |
| **Section Timetable** | Scoped Admin | Read-Only | Slots, faculty, and rooms projected directly |
| **Curriculum Subjects** | Department Admin | Controlled Enrolment | Course codes and syllabus locked; student selects from catalogue |
| **College Min Attendance** | SIT Regulation | Read-Only (**85%**) | Hardened in resolver and controllers; immutable to students |
| **Personal Target Attendance** | Student | **Editable** (85% - 100%) | Saved to `StudentTimetableConfiguration` without mutating college threshold |

---

## 3. Academic Hierarchy Resolution (`studentAcademicResolver.js`)

Student academic identity is securely and authoritatively resolved without trusting client parameters:
1. **College**: Reads `student.college` or authoritatively defaults to SIT (`Siddaganga Institute of Technology`).
2. **Program**: Reads `student.program` or authoritatively defaults to `B.E.` (`Bachelor of Engineering`).
3. **Branch**: Resolves from student's verified record.
4. **Current Semester**: Authoritative integer (`student.semester`).
5. **Batch**: Resolves from `student.batch` or maps via `admissionYear` and `graduationYear`.
6. **Visible Semesters**: Strictly queries `Semester.find({ batch, number: { $lte: currentSemester } })`. Future terms are never leaked.
7. **Academic Section**: Resolves section within student's batch and branch.
8. **Section Timetable**: Resolves `Published` timetable matching the section.
9. **Timetable Structure**: Fetches active institutional structure (working days, period durations, breaks).
10. **Attendance Policies**: Combines institutional minimum (`85%`) with personal target (default `90%`).

---

## 4. API Endpoints (`/api/student/academics`)

All endpoints require `authenticateStudent` and `requireActiveAccount` middlewares:

| Method | Path | Purpose | Security Rules |
| :--- | :--- | :--- | :--- |
| `GET` | `/overview` | Returns student academic profile and resolved context | Resolves authoritative state |
| `GET` | `/semesters` | Returns visible past + current semesters | Only returns `number <= currentSemester` |
| `GET` | `/semesters/:semesterNumber` | Returns detail for single semester | Rejects future semesters with `HTTP 403` |
| `GET` | `/sections` | Returns available sections for batch & branch | Scoped to student cohort and branch |
| `PUT` | `/section` | Switches student's section | Strictly verifies batch, branch, and semester (IDOR protected) |
| `GET` | `/timetable` | Returns timetable for requested semester | Future semester returns `HTTP 403` |
| `GET` | `/subjects` | Returns curriculum catalogue & enrolled subjects | Future semester returns `HTTP 403` |
| `PUT` | `/registered-subjects` | Registers subjects from official curriculum | Rejects non-curriculum IDs & future semesters |
| `GET` | `/settings` | Returns Admin Baseline & Student Personal Settings | Separates immutable baseline from personal target |
| `PUT` | `/settings` | Updates student personal attendance target | Validates bounds [85..100], preserves college minimum |
| `GET` | `/calendar` | Returns academic calendar items & holidays | Filtered by student branch and global scope |

---

## 5. Security & IDOR Protections

1. **Cross-Branch Section Enrolment Prevention**:
   ```javascript
   if (String(targetSection.branch) !== String(context.branch?._id)) {
       return res.status(403).json({
           success: false,
           error: 'Unauthorized: You can only select a section within your assigned branch'
       });
   }
   ```
2. **Cross-Batch Section Enrolment Prevention**:
   ```javascript
   if (String(targetSection.batch) !== String(context.batch?._id)) {
       return res.status(403).json({
           success: false,
           error: 'Unauthorized: You can only select a section within your academic batch cohort'
       });
   }
   ```
3. **Date & Status Authority over Future Semesters**:
   Admin semester records dictate term lifecycle (`Active`, `Completed`, `Upcoming`). Any request for an upcoming or unconfigured future semester strictly returns `HTTP 403 Forbidden`.
   ```javascript
   if (context.isFuture) {
       return res.status(403).json({
           success: false,
           error: 'Forbidden: Future semester academic records are not accessible'
       });
   }
   ```
4. **Section Timetable Isolation**:
   Querying section timetables enforces exact section matching (`section: academicSection._id`). If no timetable has been published for that section, the resolver returns `hasPublishedTimetable: false` and `sectionTimetable: null` with `"No timetable has been published yet for Section {name}"` rather than leaking other sections' timetables.
5. **Batch Ambiguity Protection**:
   If a student's record has no direct `batch` ID and multiple cohorts match `admissionYear` (e.g. Day vs Evening shifts), the resolver flags `batchAmbiguous: true` and sets `batch: null` instead of silently guessing a cohort.
6. **Attendance Threshold Immutability**:
   Any attempt by a student to modify `attendanceThreshold` in settings requests is strictly neutralized. The institutional minimum is locked at 85%.

---

## 6. Verification & Test Evidence

### 6.1 Dedicated 30-Point E2E Test Suite (`studentAcademicsE2E.test.js`)
- **Suite Command**: `node --test tests/studentAcademicsE2E.test.js`
- **Results**:
  - `ok 1 - Resolves full academic identity authoritatively from DB records`
  - `ok 2 - Authoritatively falls back to SIT College if student record has null college`
  - `ok 3 - Authoritatively falls back to B.E. Program if student record has null program`
  - `ok 4 - Successfully resolves batch from admission and graduation years`
  - `ok 5 - Visible semesters strictly limited to number <= student.semester (1, 2, 3, 4)`
  - `ok 6 - Future semesters (5, 6, 7, 8) are strictly masked and never returned`
  - `ok 7 - GET /semesters/:semesterNumber succeeds for past semester (Semester 2)`
  - `ok 8 - GET /semesters/:semesterNumber succeeds for current active semester (Semester 4)`
  - `ok 9 - GET /semesters/:semesterNumber returns HTTP 403 when requesting future Semester 5`
  - `ok 10 - GET /sections returns only sections within student verified batch and branch`
  - `ok 11 - PUT /section returns HTTP 403 when selecting section from another branch (ECE Sec A)`
  - `ok 12 - PUT /section returns HTTP 403 when selecting section from another batch`
  - `ok 13 - PUT /section successfully updates student section within verified batch and branch (CSE Sec B)`
  - `ok 14 - GET /timetable returns published section slots and institutional structure`
  - `ok 15 - GET /timetable?semester=6 returns HTTP 403 for future semester request`
  - `ok 16 - GET /timetable?semester=3 succeeds for historical completed semester`
  - `ok 17 - GET /subjects returns official curriculum and student registered subjects`
  - `ok 18 - GET /subjects?semester=5 returns HTTP 403 for future semester`
  - `ok 19 - PUT /registered-subjects successfully registers curriculum subjects`
  - `ok 20 - PUT /registered-subjects rejects registration for future semester with HTTP 403`
  - `ok 21 - GET /settings exposes Admin Baseline (Read-Only) and Personal Settings (Editable)`
  - `ok 22 - PUT /settings does not allow student to modify college minimum attendance threshold`
  - `ok 23 - PUT /settings successfully updates personal target attendance (92%)`
  - `ok 24 - PUT /settings rejects invalid personal targets (<1 or >100) with HTTP 400`
  - `ok 25 - GET /calendar returns institutional items for college and student branch`
  - `ok 26 - GET /timetable returns hasPublishedTimetable: false when no timetable published for student section`
  - `ok 27 - Student in Section B never sees Section A slots (Strict Isolation)`
  - `ok 28 - Future semester (Upcoming status) is hidden from selector and returns HTTP 403 on direct access`
  - `ok 29 - Completed/Past semesters are visible, unconfigured semesters are never exposed`
  - `ok 30 - Resolver never silently picks a batch if multiple cohorts match admission year`
  - **Summary**: `31 / 31 passed, 0 failed` (100% pass rate).

### 6.2 Full Regression Test Suite
- **Suite Command**: `node --test tests/*.test.js`
- **Result**: `253 / 253 tests passed, 0 failed` across all 10 test suites.

### 6.3 Frontend & Admin Compilation
- **Frontend Build** (`npm run build` in `frontend`): `✓ built in 12.29s` (Exit code 0).
- **Admin Build** (`npm run build` in `admin`): `✓ built in 4.69s` (Exit code 0).
