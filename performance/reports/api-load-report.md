# API High-Concurrency Load Test Report

**Timestamp:** 2026-08-22T05:15:27.025Z

### 1. Year Stats (First Year) (`/subjects/stats/first-year`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 2.9 | 346.6 ms | 310.3 ms | **446.8 ms** | 446.8 ms | 0% | 🟢 Excellent (<500ms) |
| **10** | 15.6 | 473.3 ms | 503.3 ms | **672.1 ms** | 672.1 ms | 0% | 🟢 Good (<1s) |
| **25** | 11.7 | 1670.9 ms | 1710.7 ms | **2121.1 ms** | 2140.4 ms | 0% | 🔴 Needs work (>2s) |
| **50** | 16.9 | 1937.6 ms | 1983.3 ms | **2723 ms** | 2960.6 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 14.5 | 4610.4 ms | 4639.3 ms | **6631.9 ms** | 6856.7 ms | 0% | 🔴 Needs work (>2s) |

### 2. Year Stats (2nd Year) (`/subjects/stats/2nd-Year`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 1.3 | 747.4 ms | 653.6 ms | **1125.2 ms** | 1125.2 ms | 0% | 🟡 Acceptable (1-2s) |
| **10** | 5.2 | 1442 ms | 1406.1 ms | **2054.4 ms** | 2054.4 ms | 0% | 🔴 Needs work (>2s) |
| **25** | 10.1 | 1924.6 ms | 1965.2 ms | **2267.8 ms** | 2483.7 ms | 0% | 🔴 Needs work (>2s) |
| **50** | 9.9 | 3988.8 ms | 4091 ms | **4976.6 ms** | 5044.3 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 12.4 | 7678.1 ms | 8000 ms | **8000 ms** | 8000 ms | 73% | 🔴 Needs work (>2s) |

### 3. CMS Subjects List (`/cms/subjects?branch=CSE`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 0.5 | 1910.8 ms | 845.9 ms | **6395.9 ms** | 6395.9 ms | 0% | 🔴 Needs work (>2s) |
| **10** | 3.9 | 1879.9 ms | 1921.7 ms | **2752.3 ms** | 2752.3 ms | 0% | 🔴 Needs work (>2s) |
| **25** | 4.9 | 4536.2 ms | 4624.8 ms | **5111.7 ms** | 5115.3 ms | 0% | 🔴 Needs work (>2s) |
| **50** | 6.2 | 8000 ms | 8000 ms | **8000 ms** | 8000 ms | 100% | 🔴 Needs work (>2s) |
| **100** | 12.4 | 8000 ms | 8000 ms | **8000 ms** | 8000 ms | 100% | 🔴 Needs work (>2s) |

### 4. Subject Materials (Python) (`/subjects/plc6/materials`)

| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 213.2 | 4.5 ms | 2 ms | **14.9 ms** | 14.9 ms | 100% | 🟢 Excellent (<500ms) |
| **10** | 730.5 | 11.5 ms | 14.3 ms | **18.5 ms** | 18.5 ms | 100% | 🟢 Excellent (<500ms) |
| **25** | 1220.7 | 16.3 ms | 16.3 ms | **18.3 ms** | 18.5 ms | 100% | 🟢 Excellent (<500ms) |
| **50** | 2799.8 | 12.3 ms | 12.9 ms | **15.2 ms** | 15.5 ms | 100% | 🟢 Excellent (<500ms) |
| **100** | 2675.7 | 26.8 ms | 26.7 ms | **32.4 ms** | 32.9 ms | 100% | 🟢 Excellent (<500ms) |

