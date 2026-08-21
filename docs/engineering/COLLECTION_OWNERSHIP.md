# MongoDB Collection Ownership Matrix

## Overview
Every MongoDB collection is owned by a **single feature domain**.

---

| Collection Name | Owner Feature Domain | Primary Model File | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | Profile | `User.js` | Student identity & credentials |
| `subjects` | Materials | `Subject.js` | VTU syllabus subjects & modules |
| `documents` | Materials | `Document.js` | PDF notes & question papers |
| `useruploads` | Ask+ | `UserUpload.js` | Student submitted materials |
| `academicsetups` | Home | `AcademicSetup.js` | Student semester timing & daily setup |
| `attendancerecords` | Plus | `AttendanceRecord.js` | Dynamic Attendance Engine records |
| `academicevents` | Profile / Home | `AcademicEvent.js` | Semester exam dates & holidays |
| `experiences` | Interviews | `Experience.js` | Campus placement interview logs |
| `campushub` | Campus | `CampusHub.js` | Marketplace & campus notices |
| `articles` | Blog | `Article.js` | Academic guides & articles |
