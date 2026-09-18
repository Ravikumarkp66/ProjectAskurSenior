# AskUrSenior — Performance Testing Foundation & Benchmarks

> **Purpose**: Establish an automated, repeatable local performance testing foundation to measure database query execution, API concurrency throughput, and browser-perceived user journey latencies.  
> **Key Principle**: Performance tests are **benchmarks**, not functional tests. They belong to their own lifecycle, have distinct tags/projects, and must **never** be mixed into the standard functional regression suite (`@regression`).

---

## 1. Available Performance Tooling & Classification

AskUrSenior includes three distinct tiers of non-destructive performance measurement tooling:

| Category | Tool / File | What It Measures | Target Service |
| :--- | :--- | :--- | :--- |
| **1. Database Query Profiler** | `performance/db-profiler.js` | Execution time (ms), docs examined vs. returned, scan ratio, index usage (`IXSCAN` vs `COLLSCAN`) | Local MongoDB instance (`MONGODB_URI`) |
| **2. API Concurrency Load Tester** | `performance/load-tester.js` | Throughput (RPS), average/p50/p95/p99 response latency, HTTP error rate across 1–100 Virtual Users (VUs) | Local Express Backend (`http://localhost:5000/api`) |
| **3. User-Perceived Journey Benchmark** | `performance/user-journey.bench.spec.js` | Client-side navigation timing, DOM render time, sidebar population, search-to-render latency, and modal open times | Full stack (Frontend on `:3000` + Backend on `:5000`) |
| **4. Orchestrator** | `performance/run-benchmarks.js` | Unified runner executing DB profiler + API load tester, generating Markdown reports in `performance/reports/` | Local DB + Local Backend |
| **5. Advanced Synthetic Runner** | `performance/bin/k6.exe` & `performance/k6/` | Standalone multi-stage load/stress testing scripts (`dashboard.js`, `materials.js`, `year-cards.js`) | Local Backend API |

---

## 2. Standard Performance Commands

All performance testing commands are standardized in root `package.json`:

```bash
# Run safe database query profiler
npm run test:performance:db
# (alias: npm run test:perf:db)

# Run safe local API concurrency load tester
npm run test:performance:load
# (alias: npm run test:perf:load)

# Run Playwright user-perceived journey benchmark
npm run test:performance:journey
# (alias: npm run test:perf:journey)

# Run unified performance suite (DB profiler + API load tester)
npm run test:performance
# (alias: npm run test:perf:all)
```

---

## 3. Prerequisites & Local Environment

Before executing performance tests locally:

1. **MongoDB**: Must be running locally (`mongodb://localhost:27017/askursenior_staging` or URI configured in `backend/.env`).
2. **Backend Server**: Express server running on port `5000`:
   ```bash
   node server.js
   ```
3. **Frontend Server** (required for `test:performance:journey`): Vite dev server running on port `3000`:
   ```bash
   npm --prefix frontend run dev
   # or
   npx vite --port 3000
   ```
4. **Auth Seed**: Ensure staging student credentials (`STAGING01` / `StagingE2EPass2026!`) exist in the local database for authenticated journey runs.

---

## 4. Safety Guardrails & Rules for Local Testing

Performance tests must never degrade local development stability or affect external services:

1. **Strictly Local Targets**: All requests target `http://localhost:5000` or `http://localhost:3000`. Never target production (`askursenior.com`) or remote staging (`render.com`).
2. **Zero External API Invocations**:
   - Third-party document downloads, previews, and PDF streams are mocked using Playwright network interception (`page.route('**/api/documents/*/preview-url', ...)`).
   - Third-party services (Twilio SMS, Cloudinary, AWS S3) are bypassed.
3. **Non-Destructive Workloads**:
   - Tests execute read-heavy queries (`find`, `explain`, `aggregate`, `GET`).
   - No performance test creates mass dummy records without atomic teardown.
4. **Controlled Concurrency**:
   - Concurrency is capped at a maximum of 100 VUs and 100 requests per tier locally to prevent exhausting Node's event loop or developer OS resources.
5. **Rate-Limit Bypass**:
   - Requests carry `x-perf-benchmark: true` and `User-Agent: AskUrSenior-LoadTester/1.0` headers to ensure rate-limiting middleware does not skew legitimate benchmark metrics during local testing.

---

## 5. Separation from Functional Regression

Performance tests are strictly separated from functional regression:
- **Directory Isolation**: Performance tests reside exclusively in `performance/`, outside `e2e/`, `admin-e2e/`, and `tests/`.
- **Playwright Project Isolation**: In `playwright.config.js`, performance specs run under a dedicated project (`name: 'performance'`).
- **Tag Isolation**: Browser benchmarks are tagged `@performance` and never `@regression`.
- **Zero Regression Leakage**: Running `npm run test:regression` or `npm run test:regression:unit` evaluates 0 performance tests.

---

## 6. Baseline Performance Metrics (Captured Step 13)

The following real metrics were captured on the local environment (`askursenior_staging` on MongoDB + Node.js Express + React Vite):

### A. Database Query Profiler Baseline

| Feature | MongoDB Query | Exec Time | Returned | Examined | Index Used | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Year Stats & CMS Sidebar** | `AcademicSubject.find({ year: "1st Year", status: "Published" })` | **1 ms** | 29 | 29 | ✅ Yes | 🟢 EXCELLENT |
| **Global Subjects List** | `AcademicSubject.find({ status: "Published" })` | **0 ms** | 438 | 438 | ✅ Yes | 🟢 EXCELLENT |
| **Card Breakdown Notes Count** | `AcademicMaterial.find({ subject: { $in: ids }, materialType: "Notes", status: "Published" })` | **3 ms** | 78 | 78 | ✅ Yes | 🟢 EXCELLENT |
| **Top Subjects Aggregation** | `AcademicMaterial.aggregate([ $match, $group, $sort, $limit ])` | **2 ms** | 3 | 116 | ✅ Yes | 🟢 EXCELLENT |
| **Subject Content View** | `AcademicMaterial.find({ subject: subId, status: "Published" })` | **0 ms** | 8 | 8 | ✅ Yes | 🟢 EXCELLENT |
| **Preview / Download Lookup** | `AcademicMaterial.findById(materialId)` | **1 ms** | 1 | 1 | ✅ Yes | 🟢 EXCELLENT |

*Finding*: All profiled queries utilize indexes efficiently with execution times <= 3ms and document scan ratios <= 1.5.

### B. API Concurrency Load Tester Baseline

#### 1. Year Stats (First Year) (`/api/subjects/stats/first-year`)
| VUs | Reqs / Sec | Avg Latency | P50 Latency | P95 Latency | P99 Latency | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 2.9 | 344.4 ms | 306.5 ms | **410.8 ms** | 410.8 ms | 0% | 🟢 Excellent (<500ms) |
| **10** | 18.8 | 435.1 ms | 426.1 ms | **793.4 ms** | 793.4 ms | 0% | 🟢 Good (<1s) |
| **25** | 14.1 | 950.5 ms | 870.5 ms | **1657.3 ms** | 1770.7 ms | 0% | 🟡 Acceptable (1-2s) |
| **50** | 16.4 | 1736.8 ms | 2050.4 ms | **2451.9 ms** | 3036.1 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 15.3 | 4346.5 ms | 4344.4 ms | **6070.2 ms** | 6516.1 ms | 0% | 🔴 Needs work (>2s) |

#### 2. Year Stats (2nd Year) (`/api/subjects/stats/2nd-Year`)
| VUs | Reqs / Sec | Avg Latency | P50 Latency | P95 Latency | P99 Latency | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 1.1 | 951.5 ms | 546.1 ms | **2537.7 ms** | 2537.7 ms | 0% | 🔴 Needs work (>2s) |
| **10** | 11.3 | 651.9 ms | 654.5 ms | **873.5 ms** | 873.5 ms | 0% | 🟢 Good (<1s) |
| **25** | 3.6 | 2803.7 ms | 2451.1 ms | **6446.9 ms** | 6971.7 ms | 0% | 🔴 Needs work (>2s) |
| **50** | 12.1 | 2837.5 ms | 2827.3 ms | **4084.5 ms** | 4117.8 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 15.2 | 4688.0 ms | 4655.3 ms | **6416.7 ms** | 6596.1 ms | 0% | 🔴 Needs work (>2s) |

#### 3. CMS Subjects List (`/api/cms/subjects?branch=CSE`)
| VUs | Reqs / Sec | Avg Latency | P50 Latency | P95 Latency | P99 Latency | Error % | Performance Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 0.8 | 1253.8 ms | 1128.2 ms | **1661.0 ms** | 1661.0 ms | 0% | 🟡 Acceptable (1-2s) |
| **10** | 5.8 | 1287.0 ms | 1402.1 ms | **1876.5 ms** | 1876.5 ms | 0% | 🟡 Acceptable (1-2s) |
| **25** | 12.2 | 1347.5 ms | 1341.1 ms | **1666.2 ms** | 2039.7 ms | 0% | 🟡 Acceptable (1-2s) |
| **50** | 12.5 | 2761.9 ms | 2826.4 ms | **3457.2 ms** | 3992.9 ms | 0% | 🔴 Needs work (>2s) |
| **100** | 12.4 | 8000.0 ms | 8000.0 ms | **8000.0 ms** | 8000.0 ms | 100% | 🔴 Needs work (>2s) |

*Finding*: Uncached aggregation endpoints scale well up to 10–25 concurrent users locally. At 50+ concurrent requests on a single Node process, response times exceed 2s and time out at 100 VUs.

### C. Playwright User Journey Benchmark Baseline

| User Journey | Total Perceived Time | Breakdown | Engineering Target |
| :--- | :---: | :--- | :--- |
| **First Year Complete Journey** | **6.17s** (6172ms) | • Dashboard & Cards Render: 2545 ms<br>• Sidebar Population: 189 ms<br>• Search & Materials Render: 3421 ms<br>• PDF Preview Open: 114 ms | 🔴 Needs work (>2s) |
| **Second Year Journey** | **2.20s** (2204ms) | • Sidebar & Subjects Render: 2204 ms | 🔴 Needs work (>2s) |
| **Third Year Journey** | **4.10s** (4104ms) | • Sidebar & Subjects Render: 4104 ms | 🔴 Needs work (>2s) |
| **Fourth Year (Coming Soon)** | **2.20s** (2195ms) | • Page & Placeholder Render: 2195 ms | 🔴 Needs work (>2s) |

*Finding*: Initial dashboard load and full subject listing take 2–6 seconds end-to-end in headless Chromium on local dev machines due to cold React tree hydration, multiple parallel stats queries, and dynamic SVG card generation.

---

## 7. Performance Thresholds & Service Level Guidelines (SLGs)

Use these standard grading criteria for features and queries:

### Database Queries
- 🟢 **Excellent**: Execution time <= 20 ms, Scan Ratio <= 1.5 (`IXSCAN`)
- 🟢 **Good**: Execution time <= 50 ms, Scan Ratio <= 2.0
- 🟡 **Acceptable**: Execution time 50–100 ms, Scan Ratio <= 5.0 (flagged for review)
- 🔴 **Needs Work**: Execution time > 100 ms or `COLLSCAN` (table scan with no index)

### API Endpoints (P95 Latency at 10 Concurrent Users)
- 🟢 **Excellent**: P95 < 500 ms
- 🟢 **Good**: P95 < 1000 ms (1s)
- 🟡 **Acceptable**: P95 between 1s and 2s
- 🔴 **Needs Work**: P95 > 2s or error rate > 1%

### Browser User Journeys (Perceived Interaction Time)
- 🟢 **Excellent**: < 500 ms (instantaneous feel)
- 🟢 **Good**: 500 ms – 1000 ms
- 🟡 **Acceptable**: 1000 ms – 2000 ms
- 🔴 **Needs Work**: > 2000 ms

---

## 8. How Developers Should Test Performance for New Features

When developing a new feature (e.g. CIE Analyzer, Timetable, Feedback):

1. **Database Layer**:
   - Profile all read queries using `.explain('executionStats')`.
   - Verify that winning plan uses `IXSCAN` on indexed fields (`year`, `branch`, `status`, `subject`, `studentId`).
   - Add new query cases to `performance/db-profiler.js` if the query runs on high-traffic screens.
2. **API Layer**:
   - Check endpoint response latency under light concurrency (10 VUs) using `performance/load-tester.js`.
   - Ensure the endpoint returns within < 500ms. If complex aggregations are used, consider projections (`.select()`), pagination, or caching.
3. **Browser Journey**:
   - If the feature introduces a primary navigation flow or dashboard widget, add a benchmark in `performance/user-journey.bench.spec.js`.
   - Use semantic role locators (`getByRole('button')`) to measure user-perceived interactions.
   - Run `npm run test:performance:journey` to verify that perceived latency meets engineering thresholds.
