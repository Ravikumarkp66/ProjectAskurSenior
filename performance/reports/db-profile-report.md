# Database Performance Profile Report

**Timestamp:** 2026-09-09T17:10:19.498Z

| Feature | MongoDB Query | Time (ms) | Returned | Examined | Index Used | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Year Stats & CMS Sidebar** | `AcademicSubject.find({ year: "1st Year", status: "Published" })` | **1 ms** | 29 | 29 | ✅ Yes | 🟢 EXCELLENT |
| **Global Subjects List** | `AcademicSubject.find({ status: "Published" })` | **0 ms** | 438 | 438 | ✅ Yes | 🟢 EXCELLENT |
| **Card Breakdown Notes Count** | `AcademicMaterial.find({ subject: { $in: ids }, materialType: "Notes", status: "Published" })` | **3 ms** | 78 | 78 | ✅ Yes | 🟢 EXCELLENT |
| **Top Subjects Aggregation** | `AcademicMaterial.aggregate([ $match, $group, $sort, $limit ])` | **2 ms** | 3 | 116 | ✅ Yes | 🟢 EXCELLENT |
| **Subject Content View** | `AcademicMaterial.find({ subject: subId, status: "Published" })` | **0 ms** | 8 | 8 | ✅ Yes | 🟢 EXCELLENT |
| **Preview / Download Lookup** | `AcademicMaterial.findById(materialId)` | **1 ms** | 1 | 1 | ✅ Yes | 🟢 EXCELLENT |

## Recommendations
- 🟢 **All queried fields are indexed efficiently with sub-millisecond to low-millisecond execution times.**
- 💡 Keep monitoring collection growth; consider compound index `{ year: 1, status: 1 }` on `academic_subjects` and `{ subject: 1, status: 1, materialType: 1 }` on `academic_materials` as collections scale past 100k records.
