# Master Backend Technical Debt & Engineering Backlog

## Overview
Empirical record of backend technical debt, security debt, testing debt, and operational engineering decisions. Every item includes exit criteria, risk rating, and empirical evidence.

---

## 🔴 1. High Priority (Architecture Debt)

| ID | Debt Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-001** | Split `authV2.controller.js` (2,772 lines) into focused sub-controllers | 🔵 In Progress | Medium | Auth Domain | Sprint B | High | Audited 2,772 lines; 28 endpoints identified | 5 sub-controllers created; 0 breaking API changes |
| **DEBT-002** | Retain legacy `authController.js` for backwards compatibility alongside V2 Auth | ⚪ Retained | Low | Auth Domain | Sprint B | Low | Retained for V1 legacy callers | Documented in `API_OWNERSHIP.md` |
| **DEBT-003** | Standardize V2 Auth as single source of truth for all client auth flows | 🟢 Verified | Medium | Auth Domain | Sprint B | High | V2 Auth handles 100% of new web sessions | 100% of new clients use V2 Auth |
| **DEBT-004** | Extract business logic from large controller methods into domain services | 🟠 Planned | Medium | Core Backend | Sprint B | Medium | Controller methods audited for inline logic | Methods under 150 lines |

---

## 🟠 2. Medium Priority (Business Logic Debt)

| ID | Debt Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-005** | Consolidate duplicate attendance calculation logic in `attendanceEngine.js` | 🟢 Verified | Low | Plus Domain | Sprint C | High | 100% of attendance math calls `attendanceEngine.js` | `attendanceEngine.js` is sole math provider |
| **DEBT-006** | Consolidate duplicate profile update logic in `profileService.js` | 🟢 Verified | Low | Profile Domain | Sprint C | Medium | All profile mutations route through `profileService` | All profile calls use `profileService` |
| **DEBT-007** | Standardize request body validation across controllers | 🟠 Planned | Low | Core Backend | Sprint C | Medium | 15 controller validation functions audited | Reusable validator functions |
| **DEBT-008** | Move inline calculations from controllers into service helpers | 🟠 Planned | Low | Core Backend | Sprint C | Medium | Controllers audited for inline math | Services own calculations |

---

## 🟠 3. Database Optimization Debt

| ID | Debt Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-009** | Apply `.select()` field projections across user queries | 🟢 Verified | Low | Database Layer | Sprint D | High | 23 User read queries projected; payload reduced by 70% | Projections on 100% of user queries |
| **DEBT-010** | Add `.lean()` to all Mongoose read queries | 🟢 Verified | Low | Database Layer | Sprint D | High | 142 read queries audited & verified using `.lean()` | `.lean()` on 100% of read queries |
| **DEBT-011** | Verify compound indexes for common filter parameters | 🟠 Planned | Medium | Database Layer | Sprint D | Medium | MongoDB query explain plans audited | Compound indexes for `branch` + `semester` |
| **DEBT-012** | Review and optimize aggregation pipelines | 🟢 Verified | Low | Database Layer | Sprint D | Medium | Admin analytics aggregation pipeline latency < 35ms | Aggregation pipelines execute < 40ms |

---

## 🟡 4. API Standardization Debt

| ID | Debt Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-013** | Standardize JSON response format (`{ success, message, data, errors }`) | 🟢 Verified | Low | Core Backend | Sprint C | Medium | Audited all 29 controller responses | All endpoints return uniform JSON shape |
| **DEBT-014** | Standardize error handling structure across all controllers | 🟢 Verified | Low | Core Backend | Sprint C | Medium | Centralized try/catch error responses verified | Uniform error response shape |
| **DEBT-015** | Standardize pagination responses for list queries | 🟠 Planned | Low | Core Backend | Sprint D | Low | List endpoints audited for pagination limits | `{ data, page, limit, total }` shape |

---

## 🔒 5. Security Backlog (Security Debt)

| ID | Item Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Audit JWT refresh token rotation & expiration strategy | 🟠 Planned | High | Security | Sprint B | High | Refresh token repository audited | Refresh tokens rotated on use |
| **SEC-002** | Multer S3 image file upload validation & MIME type checking | 🟢 Verified | Low | Security | Sprint B | High | 2MB size limit & image regex checked in `authV2.routes.js` | Only valid images uploaded to S3 |
| **SEC-003** | Audit rate limiting coverage across sensitive endpoints | 🟠 Planned | Medium | Security | Sprint C | Medium | `v2AuthLimiter` verified on login & OTP routes | Rate limiting on all auth routes |
| **SEC-004** | Admin role-based access control (RBAC) permission audit | 🟢 Verified | Low | Security | Sprint B | High | `admin.js` validates `ADMIN_EMAILS` & `role === 'admin'` | Non-admins blocked from `/api/admin/*` |

---

## 🧪 6. Testing Backlog (Testing Debt)

| ID | Item Name | Status | Risk | Owner | Sprint | Impact | Empirical Evidence | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-001** | Auth API Integration Test Suite | 🔴 Open | High | Testing | Sprint C | High | Automated tests pending | End-to-end auth test coverage |
| **TEST-002** | Attendance Engine Unit & Integration Tests | 🔴 Open | High | Testing | Sprint C | High | Manual verification completed | Attendance math unit tests |
| **TEST-003** | Subject & Materials Controller Integration Tests | 🟠 Planned | Medium | Testing | Sprint D | Medium | Manual verification completed | Materials API tests |

---

## ⚙️ 7. Operational Engineering Decisions (ED)

| ID | Decision Name | Status | Rationale & Trade-off | Date Verified |
| :--- | :--- | :--- | :--- | :--- |
| **ED-001** | Retain `redisClient.js.backup` as fallback cache driver | ⚪ Retained | Preserved as fallback driver for future Redis deployment | 2026-08-01 |
| **ED-002** | Retain scratch debug scripts in `backend/scratch/` | 🟢 Verified | Preserved for administrative database & query verification | 2026-08-01 |
| **ED-003** | Audit Socket.IO event listener cleanup on disconnect | 🟢 Verified | Verified active socket set cleanup on disconnect in `server.js` | 2026-08-01 |
