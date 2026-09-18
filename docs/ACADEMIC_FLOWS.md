# ACADEMIC MANAGEMENT SYSTEM — FINAL SYSTEM LIFECYCLE FLOWS

> **Document Status:** 🟢 APPROVED WITH FINAL GUARDRAILS (Phase A Frozen)  
> **Companion Document:** [ACADEMIC_MANAGEMENT_SPEC.md](file:///c:/AskUrSenior/docs/ACADEMIC_MANAGEMENT_SPEC.md)  
> **Core Mandate:** Visual sequence flows and state diagrams aligned with frozen guardrails: Universal Two-Layer Pattern, Deterministic Cascading Settings, Curriculum vs Timetable separation, and Non-Destructive Reset Engine.

---

## TABLE OF FLOWS
1. [Flow 1: Admin Creates Academic Structure & Scopes](#flow-1-admin-creates-academic-structure--scopes)
2. [Flow 2: Admin Configures Semester (Official Dates & Student Personal Dates)](#flow-2-admin-configures-semester-official-dates--student-personal-dates)
3. [Flow 3: Admin Configures Curriculum (CurriculumSubject Baseline vs Student Registered)](#flow-3-admin-configures-curriculum-curriculumsubject-baseline-vs-student-registered)
4. [Flow 4: Deterministic Cascading Settings (The Most Specific Wins)](#flow-4-deterministic-cascading-settings-the-most-specific-wins)
5. [Flow 5: Lean Timetable Publishing (Draft -> Published)](#flow-5-lean-timetable-publishing-draft---published)
6. [Flow 6: Admin Publishes Official Events (Suspensions & Student Reminders)](#flow-6-admin-publishes-official-events-suspensions--student-reminders)
7. [Flow 7: Student Receives & Renders Baseline](#flow-7-student-receives--renders-baseline)
8. [Flow 8: Student Personalizes Timetable & Electives](#flow-8-student-personalizes-timetable--electives)
9. [Flow 9: Student Resets Overrides to Admin Baseline](#flow-9-student-resets-overrides-to-admin-baseline)
10. [Flow 10: Admin Modifies Baseline (Student Has No Override)](#flow-10-admin-modifies-baseline-student-has-no-override)
11. [Flow 11: Admin Modifies Baseline (Student Has Active Override — The Exact Trace)](#flow-11-admin-modifies-baseline-student-has-active-override--the-exact-trace)
12. [Flow 12: Student Changes Section / Academic Context](#flow-12-student-changes-section--academic-context)

---

### Flow 1: Admin Creates Academic Structure & Scopes

Super Admin provisions the institutional structure (Program e.g. B.E. or MCA, optional Branch, Batch, Section) and delegates scoped authority.

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    participant Gateway as API Gateway / Auth
    participant MasterDB as Master Database
    actor Admin as Department Admin (HoD)

    SA->>Gateway: POST /api/v2/admin/tenants (College, Scheme, Program e.g. B.E., MCA)
    Gateway->>MasterDB: Insert College, Scheme, Program Records
    MasterDB-->>Gateway: 201 Created

    SA->>Gateway: POST /api/v2/admin/structure (Branch: CSE [Optional for MCA], Batch, Section)
    Gateway->>MasterDB: Insert Branch, Batch, Section Records
    MasterDB-->>Gateway: 201 Created

    SA->>Gateway: POST /api/v2/admin/users/assign-scope
    Note over SA,Gateway: Assign HoD to (College: SIT, Branch: CSE, Sections: [A, B])
    Gateway->>MasterDB: Persist Admin + Scopes + Permissions
    MasterDB-->>Gateway: 200 OK (Scope Assigned)

    Admin->>Gateway: GET /api/v2/admin/my-scopes
    Gateway-->>Admin: Returns Scoped Context: SIT -> CSE -> [A, B]
```

---

### Flow 2: Admin Configures Semester (Official Dates & Student Personal Dates)

Admin provisions the official term calendar. Students receive official dates and can customize their personal academic timeline without mutating official records.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Scoped Admin
    participant SemSvc as Semester Service
    participant DB as Semester Database
    actor Student as Enrolled Student

    Admin->>SemSvc: POST /api/v2/admin/semesters
    Note over Admin,SemSvc: Official Semester: Start June 1, End Sept 5
    SemSvc->>DB: Save Official Semester Baseline (status: "ACTIVE")
    DB-->>Admin: 201 Created (Official Dates Armed)

    Note over Student,DB: Student registers / onboarded for semester...
    Student->>SemSvc: GET /api/v2/student/semester/current
    SemSvc->>DB: Query Official Semester Dates
    DB-->>Student: Renders Official: June 1 - Sept 5

    opt Student Personalizes Academic Timeline
        Student->>SemSvc: PUT /api/v2/student/semester/personal-dates
        Note over Student,SemSvc: Personal Dates: myStartDate = June 3, myEndDate = Sept 5
        SemSvc->>DB: Save to student_semester_profiles (personal overlay)
        DB-->>Student: 200 OK (Personal Dates Active)
        Note over DB: Official Admin dates (June 1 - Sept 5) 100% untouched!
    end
```

---

### Flow 3: Admin Configures Curriculum (CurriculumSubject Baseline vs Student Registered)

`CurriculumSubject` is the authoritative baseline. `StudentRegisteredSubject` is strictly the personal layer.

```mermaid
flowchart TD
    Start([Admin Opens Curriculum Module]) --> ScopeCheck{Admin Scope Valid?}
    ScopeCheck -- Denied --> Err403[403 Forbidden]
    ScopeCheck -- Authorized --> DefineBaseline[Define CurriculumSubject - Baseline SoT]

    DefineBaseline --> Form[Input: Code: 21CS51, Title: DBMS, Credits: 4]
    Form --> Freq[Curriculum Requirement: 4 classes/week + 1 lab session/week]
    Freq --> Category{Is Elective?}
    
    Category -- No (Core) --> SaveCore[(Save to CurriculumSubject - Canonical Baseline)]
    Category -- Yes --> Basket[Assign to Elective Basket e.g. Elective 1]
    Basket --> SaveCore

    SaveCore --> StudentSync([Auto-provision to StudentRegisteredSubject])
    StudentSync --> PersonalLayer[Student Layer: Selects Elective Choice, Sets Custom Nickname 'DBMS', Sets Attendance Target 85%]
    PersonalLayer --> EffectiveView([Effective Subjects View = Admin Baseline + Student Personal Layer])
```

---

### Flow 4: Deterministic Cascading Settings (The Most Specific Wins)

The most specific applicable configuration wins: `Section Override > Semester Override > Branch Override > College Default`.

```mermaid
sequenceDiagram
    autonumber
    actor CollegeAdmin as College Admin
    actor DeptAdmin as Branch Admin (CSE)
    actor SecAdmin as Section Admin (CSE Sec A)
    participant Engine as Cascading Settings Engine
    participant DB as Settings Database

    CollegeAdmin->>Engine: Set College Default: Class = 60 min
    Engine->>DB: Persist College Default

    DeptAdmin->>Engine: Set CSE Branch Override: Class = 55 min
    Engine->>DB: Persist Branch Override

    SecAdmin->>Engine: Set CSE Section A Override: Class = 50 min
    Engine->>DB: Persist Section Override

    Note over Engine: Deterministic Resolution Rule: Most Specific Wins!
    Engine-->>SecAdmin: CSE Section A resolves to: 50 min (Section Override)
    Engine-->>DeptAdmin: CSE Section B (no section override) resolves to: 55 min (Branch Override)
    Engine-->>CollegeAdmin: Mechanical (no branch/sec override) resolves to: 60 min (College Default)
```

---

### Flow 5: Lean Timetable Publishing (Draft -> Published)

Timetable management with practical state transitions and publishing metadata.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Scoped Admin
    participant GridSvc as Timetable Grid Engine
    participant DB as Timetable DB Collection

    Admin->>GridSvc: Place Slots in Draft (Meeting 4 classes/week quota)
    GridSvc->>DB: Save Draft Timetable Slots (status: "DRAFT")

    Admin->>GridSvc: POST /api/v2/admin/timetable/publish (scope: CSE_5A)
    Note over GridSvc,DB: Set status = "PUBLISHED", version = 1,<br/>publishedBy = "ADM_4401", publishedAt = 2024-09-05T09:30:00Z
    GridSvc->>DB: Save Published Timetable
    GridSvc-->>Admin: 200 OK (Official Timetable Live for Students)
```

---

### Flow 6: Admin Publishes Official Events (Suspensions & Student Reminders)

Official events are authoritative and un-hideable. Students can attach personal notes and study milestones.

```mermaid
flowchart TD
    Admin([Admin Inputs Official Event]) --> Form[Title: CIE-1 Internal Assessment, Date: Sept 20]
    Form --> SuspendCheck{Classes Suspended?}
    SuspendCheck -- Yes --> SetScope[suspensionScope = TIME_WINDOW 09:00-11:00]
    SuspendCheck -- No --> SetNone[suspensionScope = NONE]

    SetScope --> SaveOfficial[(Save to Official Events Collection)]
    SetNone --> SaveOfficial

    SaveOfficial --> StudentView([Student Views Official Event on Calendar])
    StudentView --> StudentAction{Student Action}
    StudentAction -- Attempt Edit/Delete/Hide --> Denied[BLOCKED: Official events are immutable & un-hideable]
    StudentAction -- Add Personal Prep Note --> SaveNote[(Save Personal Reminder / Note)]
    SaveNote --> PersonalDisplay([Event displayed with student's personal study note])
```

---

### Flow 7: Student Receives & Renders Baseline

Dynamic resolution combines canonical admin baseline with student personal choices.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Client
    participant Resolver as Dynamic Resolution Engine
    participant ProfileDB as Student Profile DB
    participant BaselineDB as Admin Baseline DB
    participant OverrideDB as Student Override DB

    Student->>Resolver: GET /api/v2/student/timetable/effective
    Resolver->>ProfileDB: Fetch Student Context (CSE, Sem 5, Sec A, Elective: "Cloud Computing")
    ProfileDB-->>Resolver: Context Resolved

    par Query Baseline and Sparse Overrides
        Resolver->>BaselineDB: Query Active Timetable for CSE 5A
        Resolver->>OverrideDB: Query Sparse Overrides for studentId
    end
    BaselineDB-->>Resolver: Canonical Section Timetable Slots
    OverrideDB-->>Resolver: Empty (No overrides yet)

    Resolver->>Resolver: Filter Electives (Keep "Cloud Computing", drop others)
    Resolver-->>Student: 200 OK (Render Canonical Admin Baseline)
```

---

### Flow 8: Student Personalizes Timetable & Electives

Students customize individual slots without mutating the administrative baseline.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Client
    participant OverrideSvc as Personalization Service
    participant OverrideDB as Student Override DB
    participant BaselineDB as Admin Baseline DB

    Student->>OverrideSvc: PUT /api/v2/student/timetable/override-slot
    Note over Student,OverrideSvc: Slot: Monday 10:00 AM<br/>customTitle: "Personal Study (Library)"

    OverrideSvc->>OverrideDB: Upsert Sparse Delta Record
    Note over OverrideDB: Stored in student_timetable_overrides<br/>(studentId, semId, slotKey, customTitle)
    OverrideDB-->>OverrideSvc: Delta Saved

    OverrideSvc-->>Student: 200 OK (Effective View Updated)
    Note over BaselineDB: Admin Baseline is 100% Unmodified!
```

---

### Flow 9: Student Resets Overrides to Admin Baseline

Reverting local personal overrides purges the sparse delta records and immediately falls back to the canonical admin baseline.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Client
    participant ResetSvc as Reset Engine Service
    participant OverrideDB as Student Override DB
    participant Resolver as Dynamic Resolution Engine
    participant BaselineDB as Admin Baseline DB

    Student->>ResetSvc: POST /api/v2/student/reset (tier: "SLOT", slotKey: "MON_1000")
    ResetSvc->>OverrideDB: Delete Sparse Delta for Monday 10:00 AM
    OverrideDB-->>ResetSvc: Delta Deleted

    ResetSvc->>Resolver: Fetch Fresh Effective Slot
    Resolver->>BaselineDB: Read Canonical Slot (Physics, Room 204)
    BaselineDB-->>Resolver: Canonical Data
    Resolver-->>Student: 200 OK (Slot Reverted to Canonical Admin State)
```

---

### Flow 10: Admin Modifies Baseline (Student Has No Override)

Admin changes instantly reflect on all un-overridden student slots in real time.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Scoped Admin
    participant AdminTT as Admin Timetable Service
    participant BaselineDB as Admin Baseline DB
    actor Student as Student (Zero Overrides)
    participant Resolver as Dynamic Resolution Engine

    Admin->>AdminTT: PUT /timetable/slot (Change Room: 101 -> 204)
    AdminTT->>BaselineDB: Update AdminTimetableSlot
    BaselineDB-->>AdminTT: Saved

    Note over Student,Resolver: Student accesses timetable 10 minutes later...
    Student->>Resolver: GET /api/v2/student/timetable/effective
    Resolver->>BaselineDB: Query Current Baseline
    BaselineDB-->>Resolver: Returns Room 204
    Resolver-->>Student: Renders Room 204 (Zero manual sync needed)
```

---

### Flow 11: Admin Modifies Baseline (Student Has Active Override — The Exact Trace)

**Locked Invariant:** Admin changes NEVER destroy student customizations. Overrides persist until student triggers Reset.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Scoped Admin
    participant BaselineDB as Admin Baseline DB
    actor Student as Student (Has Active Override)
    participant Resolver as Dynamic Resolution Engine
    participant OverrideDB as Student Override DB

    Note over Student,OverrideDB: Step 1: Admin baseline was Monday 10:00 -> Mathematics<br/>Step 2: Student set override Monday 10:00 -> "Personal Study"
    
    Admin->>BaselineDB: Step 3: Admin updates Monday 10:00 -> Physics
    BaselineDB-->>Admin: Baseline Updated to Physics

    Note over Student,Resolver: Student opens timetable...
    Student->>Resolver: GET /api/v2/student/timetable/effective
    Resolver->>BaselineDB: Read Baseline (Now: Physics)
    Resolver->>OverrideDB: Read Student Override ("Personal Study")

    Resolver->>Resolver: Apply Invariant: Student Override Takes Precedence!
    Resolver-->>Student: Renders: "Personal Study"<br/>+ Subtle badge: "Admin updated baseline to Physics [Reset]"

    Note over Student: Student continues seeing "Personal Study"!

    opt Step 4: Student Clicks Reset
        Student->>OverrideDB: Delete Sparse Override for Monday 10:00 AM
        OverrideDB-->>Student: Delta Removed
        Student->>Resolver: GET /api/v2/student/timetable/effective
        Resolver->>BaselineDB: Read Baseline (Physics)
        Resolver-->>Student: Now Renders: "Physics" (Returned to latest Admin Baseline)
    end
```

---

### Flow 12: Student Changes Section / Academic Context

Re-binding academic baseline upon cohort transfers.

```mermaid
flowchart TD
    AdminAction([Admin Updates Student Section to Section B]) --> UpdateDB[Update StudentProfile.sectionId = 'SEC_B']
    UpdateDB --> ArchiveOld[Archive Section A Overrides in History]
    ArchiveOld --> StudentLogin([Student Opens Application])

    StudentLogin --> DetectShift{Section Shift Detected?}
    DetectShift -- Yes --> Prompt[Display Notification: 'You have been transferred to Section B']
    Prompt --> LoadBaseline[Load Pristine Section B Admin Baseline]
    LoadBaseline --> Ready([Student Operates on Section B Schedule])
```
