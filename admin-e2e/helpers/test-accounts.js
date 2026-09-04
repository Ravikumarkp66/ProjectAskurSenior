/**
 * AskUrSenior E2E Test Accounts
 * 
 * Defines all test accounts used across the admin E2E test suite.
 * All emails use @test.askursenior.org domain, all USNs use E2E prefix.
 * This ensures zero collision with real data.
 */

export const TEST_PASSWORD = 'E2eTestPass2026!';
export const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
export const ADMIN_PORTAL_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';
export const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';

// ─── Super Admins ────────────────────────────────────────────────

export const SUPER1 = {
  email: 'e2e-super1@test.askursenior.org',
  name: 'E2E Super Admin 1',
  role: 'SUPER_ADMIN',
  departmentCode: null,
};

export const SUPER2 = {
  email: 'e2e-super2@test.askursenior.org',
  name: 'E2E Super Admin 2',
  role: 'SUPER_ADMIN',
  departmentCode: null,
};

// ─── Department Admins ───────────────────────────────────────────

/**
 * CSE Admin — FULL permissions across all modules.
 * This is the "happy path" admin for testing full CRUD within department scope.
 */
export const ADMIN_CSE = {
  email: 'e2e-admin-cse@test.askursenior.org',
  name: 'E2E Admin CSE',
  role: 'ADMIN',
  departmentCode: 'CSE',
  permissions: {
    users:     { view: true,  create: false, update: true,  delete: false },
    subjects:  { view: true,  create: true,  update: true,  delete: true },
    materials: { view: true,  create: true,  update: true,  delete: true, publish: true, archive: true },
    queries:   { view: true,  respond: true, resolve: true, delete: false },
    requests:  { view: true,  approve: true, reject: true },
  },
};

/**
 * ECE Admin — PARTIAL permissions.
 * Has materials view+create but NOT update/delete.
 * Has NO requests permission at all.
 * This tests the "permission gaps" scenario.
 */
export const ADMIN_ECE = {
  email: 'e2e-admin-ece@test.askursenior.org',
  name: 'E2E Admin ECE',
  role: 'ADMIN',
  departmentCode: 'ECE',
  permissions: {
    users:     { view: true,  create: false, update: false, delete: false },
    subjects:  { view: true,  create: true,  update: true,  delete: false },
    materials: { view: true,  create: true,  update: false, delete: false, publish: false, archive: false },
    queries:   { view: true,  respond: false, resolve: false, delete: false },
    requests:  { view: false, approve: false, reject: false },
  },
};

/**
 * ISE Admin — MINIMAL permissions (view-only across most modules).
 * Tests the "read-only admin" scenario.
 */
export const ADMIN_ISE = {
  email: 'e2e-admin-ise@test.askursenior.org',
  name: 'E2E Admin ISE',
  role: 'ADMIN',
  departmentCode: 'ISE',
  permissions: {
    users:     { view: true,  create: false, update: false, delete: false },
    subjects:  { view: true,  create: false, update: false, delete: false },
    materials: { view: true,  create: false, update: false, delete: false, publish: false, archive: false },
    queries:   { view: false, respond: false, resolve: false, delete: false },
    requests:  { view: false, approve: false, reject: false },
  },
};

// ─── Students ────────────────────────────────────────────────────

export const STUDENT_CSE = {
  usn: 'E2ECSE0001',
  email: 'e2e-student-cse@test.askursenior.org',
  name: 'E2E Student CSE',
  branchCode: 'CSE',
};

export const STUDENT_ECE = {
  usn: 'E2EECE0001',
  email: 'e2e-student-ece@test.askursenior.org',
  name: 'E2E Student ECE',
  branchCode: 'ECE',
};

// ─── Test Subjects ───────────────────────────────────────────────

export const TEST_SUBJECTS = {
  cse: {
    name: '[E2E] Data Structures',
    code: 'E2E-DS',
    year: '2nd Year',
    departmentCode: 'CSE',
    slug: 'e2e-data-structures',
  },
  ece: {
    name: '[E2E] Network Theory',
    code: 'E2E-NT',
    year: '2nd Year',
    departmentCode: 'ECE',
    slug: 'e2e-network-theory',
  },
  ise: {
    name: '[E2E] Database Management',
    code: 'E2E-DBMS',
    year: '2nd Year',
    departmentCode: 'ISE',
    slug: 'e2e-database-management',
  },
};

// ─── All Accounts (convenience arrays) ──────────────────────────

export const ALL_ADMINS = [SUPER1, SUPER2, ADMIN_CSE, ADMIN_ECE, ADMIN_ISE];
export const ALL_STUDENTS = [STUDENT_CSE, STUDENT_ECE];
export const ALL_TEST_EMAILS = ALL_ADMINS.map(a => a.email);
export const ALL_TEST_USNS = ALL_STUDENTS.map(s => s.usn);

// ─── Permission Test Matrix ─────────────────────────────────────

/**
 * Returns whether an admin account has a specific permission.
 * Super admins always return true.
 */
export function hasPermission(account, permissionKey) {
  if (account.role === 'SUPER_ADMIN') return true;
  const [module, action] = permissionKey.split('.');
  return account.permissions?.[module]?.[action] === true;
}
