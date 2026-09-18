# API High-Concurrency Load Test Report

**Timestamp:** 2026-09-09T16:59:57.625Z

### 1. Year Stats (First Year) (`/subjects/stats/first-year`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 2.9 | 344.4 ms | 306.5 ms | **410.8 ms** | 410.8 ms | 0% | 🟢 Excellent (<500ms) |
| **10** | 18.8 | 435.1 ms | 426.1 ms | **793.4 ms** | 793.4 ms | 0% | 🟢 Good (<1s) |
| **25** | 14.1 | 950.5 ms | 870.5 ms | **1657.3 ms** | 1770.7 ms | 0% | 🟡 Acceptable (1-2s) |
| **50** | 16.4 | 1736.8 ms | 2050.4 ms | **2451.9 ms** | 3036.1 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 15.3 | 4346.5 ms | 4344.4 ms | **6070.2 ms** | 6516.1 ms | 0% | 🔴 Needs work (>2s) |

### 2. Year Stats (2nd Year) (`/subjects/stats/2nd-Year`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 1.1 | 951.5 ms | 546.1 ms | **2537.7 ms** | 2537.7 ms | 0% | 🔴 Needs work (>2s) |
| **10** | 11.3 | 651.9 ms | 654.5 ms | **873.5 ms** | 873.5 ms | 0% | 🟢 Good (<1s) |
| **25** | 3.6 | 2803.7 ms | 2451.1 ms | **6446.9 ms** | 6971.7 ms | 0% | 🔴 Needs work (>2s) |
| **50** | 12.1 | 2837.5 ms | 2827.3 ms | **4084.5 ms** | 4117.8 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 15.2 | 4688 ms | 4655.3 ms | **6416.7 ms** | 6596.1 ms | 0% | 🔴 Needs work (>2s) |

### 3. CMS Subjects List (`/cms/subjects?branch=CSE`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 0.8 | 1253.8 ms | 1128.2 ms | **1661 ms** | 1661 ms | 0% | 🟡 Acceptable (1-2s) |
| **10** | 5.8 | 1287 ms | 1402.1 ms | **1876.5 ms** | 1876.5 ms | 0% | 🟡 Acceptable (1-2s) |
| **25** | 12.2 | 1347.5 ms | 1341.1 ms | **1666.2 ms** | 2039.7 ms | 0% | 🟡 Acceptable (1-2s) |
| **50** | 12.5 | 2761.9 ms | 2826.4 ms | **3457.2 ms** | 3992.9 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 12.4 | 8000 ms | 8000 ms | **8000 ms** | 8000 ms | 100% | 🔴 Needs work (>2s) |

### 4. Subject Materials (Python) (`/subjects/plc6/materials`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 319.9 | 3.1 ms | 1.1 ms | **10.7 ms** | 10.7 ms | 100% | 🟢 Excellent (<500ms) |
| **10** | 1306.3 | 6 ms | 6.8 ms | **8.7 ms** | 8.7 ms | 100% | 🟢 Excellent (<500ms) |
| **25** | 1541.6 | 11 ms | 11.2 ms | **14.1 ms** | 14.4 ms | 100% | 🟢 Excellent (<500ms) |
| **50** | 1515.5 | 21.6 ms | 20.6 ms | **27.4 ms** | 28.1 ms | 100% | 🟢 Excellent (<500ms) |
| **100** | 1481.2 | 43.1 ms | 45.6 ms | **57.1 ms** | 58.7 ms | 100% | 🟢 Excellent (<500ms) |

