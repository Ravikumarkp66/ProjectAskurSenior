/**
 * Faculty and Interview Experiences Admin Backend Contract & Security Test Suite
 * 
 * Layer: API & Security Contract
 * Framework: node:test + node:assert/strict
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = (process.env.API_BASE_URL || process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior';

// Models
const Admin = require('../../models/Admin');
const Branch = require('../../models/Branch');
const Faculty = require('../../models/Faculty');
const FacultyReview = require('../../models/FacultyReview');
const Experience = require('../../models/Experience');
const Company = require('../../models/Company');
const AdminActivity = require('../../models/AdminActivity');

test('Faculty & Interview Experiences Admin Foundation Suite', async (suite) => {
    let iseBranch = null;
    let cseBranch = null;
    let superAdmin = null;
    let iseAdmin = null;
    let superAdminToken = null;
    let iseAdminToken = null;
    let studentToken = null;

    // Track test IDs for cleanup
    const createdFacultyIds = [];
    const createdReviewIds = [];
    const createdExperienceIds = [];
    const createdCompanyIds = [];
    const createdAdminIds = [];

    suite.before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Ensure branches exist
        iseBranch = await Branch.findOne({ shortName: 'ISE' });
        if (!iseBranch) {
            iseBranch = await Branch.create({ name: 'Information Science & Engineering', shortName: 'ISE' });
        }

        cseBranch = await Branch.findOne({ shortName: 'CSE' });
        if (!cseBranch) {
            cseBranch = await Branch.create({ name: 'Computer Science & Engineering', shortName: 'CSE' });
        }

        // Create Super Admin test fixture
        const superAdminEmail = `super_admin_test_${Date.now()}@sit.ac.in`;
        superAdmin = await Admin.create({
            name: 'Test Super Admin',
            email: superAdminEmail,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            permissions: {
                faculty: { view: true, create: true, update: true, delete: true },
                facultyReviews: { view: true, moderate: true, delete: true },
                interviews: { view: true, publish: true, archive: true, delete: true },
                companies: { view: true, create: true, update: true, delete: true }
            }
        });
        createdAdminIds.push(superAdmin._id);
        superAdminToken = jwt.sign({ email: superAdmin.email, adminId: superAdmin._id }, JWT_SECRET, { expiresIn: '1h' });

        // Create ISE Department Admin test fixture
        const iseAdminEmail = `ise_admin_test_${Date.now()}@sit.ac.in`;
        iseAdmin = await Admin.create({
            name: 'Test ISE Admin',
            email: iseAdminEmail,
            role: 'ADMIN',
            department: iseBranch._id,
            status: 'ACTIVE',
            permissions: {
                faculty: { view: true, create: true, update: true, delete: true },
                facultyReviews: { view: true, moderate: true, delete: true },
                interviews: { view: true, publish: true, archive: true, delete: true },
                companies: { view: true, create: true, update: true, delete: true }
            }
        });
        createdAdminIds.push(iseAdmin._id);
        iseAdminToken = jwt.sign({ email: iseAdmin.email, adminId: iseAdmin._id }, JWT_SECRET, { expiresIn: '1h' });

        // Authenticate student without session race conditions
        const StudentAccount = require('../../models/StudentAccount');
        const student = await StudentAccount.findOne({});
        if (student) {
            studentToken = jwt.sign({
                userId: student._id.toString(),
                email: student.email,
                role: 'student'
            }, JWT_SECRET, { expiresIn: '1h' });
        } else {
            throw new Error('No student account found in database for test fixtures');
        }
    });

    suite.after(async () => {
        // Cleanup test data
        if (createdFacultyIds.length > 0) {
            await Faculty.deleteMany({ _id: { $in: createdFacultyIds } });
        }
        if (createdReviewIds.length > 0) {
            await FacultyReview.deleteMany({ _id: { $in: createdReviewIds } });
        }
        if (createdExperienceIds.length > 0) {
            await Experience.deleteMany({ _id: { $in: createdExperienceIds } });
        }
        if (createdCompanyIds.length > 0) {
            await Company.deleteMany({ _id: { $in: createdCompanyIds } });
        }
        if (createdAdminIds.length > 0) {
            await Admin.deleteMany({ _id: { $in: createdAdminIds } });
        }
        await mongoose.disconnect();
    });

    // -------------------------------------------------------------
    // PART 1 & 2: FACULTY SECURITY & MANAGEMENT TESTS
    // -------------------------------------------------------------

    await suite.test('FAC-001: Unauthenticated POST /api/faculty is rejected (401)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Hacker Faculty', department: 'CSE' })
        });
        assert.strictEqual(res.status, 401, 'Unauthenticated faculty creation must be rejected');
    });

    await suite.test('FAC-002: Student cannot create faculty (403)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studentToken}`
            },
            body: JSON.stringify({ name: 'Student Added Faculty', department: 'CSE' })
        });
        assert.strictEqual(res.status, 403, 'Student faculty creation must be rejected');
    });

    await suite.test('FAC-003: Normal Admin (ISE) cannot create CSE faculty (403 Department Scoping)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ name: 'Dr. Cross Dept', department: 'CSE' })
        });
        assert.strictEqual(res.status, 403, 'Normal admin must not create faculty outside their department');
    });

    let iseFaculty = null;
    await suite.test('FAC-004: Normal Admin (ISE) can create ISE faculty (201)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({
                name: 'Prof. ISE Specialist',
                designation: 'Associate Professor',
                department: 'ISE',
                email: 'ise_specialist@sit.ac.in',
                officeLocation: 'ISE Block 301',
                experienceYears: 12,
                subjects: ['Data Science', 'Machine Learning'],
                isLabFaculty: true
            })
        });
        assert.strictEqual(res.status, 201, 'Normal admin should create faculty in their department');
        const json = await res.json();
        assert.ok(json.data?._id, 'Expected created faculty data');
        assert.strictEqual(json.data.department, 'ISE');
        assert.strictEqual(json.data.status, 'Active');
        iseFaculty = json.data;
        createdFacultyIds.push(iseFaculty._id);
    });

    let cseFaculty = null;
    await suite.test('FAC-005: Super Admin can create CSE faculty (201)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({
                name: 'Dr. CSE Veteran',
                designation: 'Professor & HOD',
                department: 'CSE',
                email: 'cse_hod@sit.ac.in',
                officeLocation: 'CSE Block 101',
                experienceYears: 20,
                subjects: ['Algorithms', 'Compiler Design']
            })
        });
        assert.strictEqual(res.status, 201, 'Super Admin should create faculty in any department');
        const json = await res.json();
        cseFaculty = json.data;
        createdFacultyIds.push(cseFaculty._id);
    });

    await suite.test('FAC-006: Normal Admin (ISE) cannot update CSE faculty (403)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty/${cseFaculty._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ name: 'Tampered Name' })
        });
        assert.strictEqual(res.status, 403, 'Normal admin cannot update other department faculty');
    });

    await suite.test('FAC-007: Normal Admin (ISE) can update ISE faculty (200)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ designation: 'Senior Professor' })
        });
        assert.strictEqual(res.status, 200, 'Normal admin can update their department faculty');
        const json = await res.json();
        assert.strictEqual(json.data.designation, 'Senior Professor');
    });

    await suite.test('FAC-008: Super Admin can update CSE faculty (200)', async () => {
        const res = await fetch(`${BASE_URL}/api/faculty/${cseFaculty._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({ officeLocation: 'CSE Research Wing Room 4' })
        });
        assert.strictEqual(res.status, 200, 'Super Admin can update any faculty');
        const json = await res.json();
        assert.strictEqual(json.data.officeLocation, 'CSE Research Wing Room 4');
    });

    await suite.test('FAC-009: Toggle status to Inactive excludes faculty from public GET /api/faculty', async () => {
        // Deactivate iseFaculty
        const patchRes = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ status: 'Inactive' })
        });
        assert.strictEqual(patchRes.status, 200);

        // Student GET /api/faculty should NOT include Inactive faculty
        const getRes = await fetch(`${BASE_URL}/api/faculty?search=ISE%20Specialist`);
        assert.strictEqual(getRes.status, 200);
        const getData = await getRes.json();
        const found = getData.data.some(f => f.id === iseFaculty._id || f._id === iseFaculty._id);
        assert.strictEqual(found, false, 'Inactive faculty must be hidden from student list');

        // Admin GET /api/faculty?includeInactive=true CAN see Inactive faculty
        const adminGetRes = await fetch(`${BASE_URL}/api/faculty?includeInactive=true&search=ISE%20Specialist`, {
            headers: { 'Authorization': `Bearer ${iseAdminToken}` }
        });
        assert.strictEqual(adminGetRes.status, 200);
        const adminData = await adminGetRes.json();
        const adminFound = adminData.data.some(f => f.id === iseFaculty._id || f._id === iseFaculty._id);
        assert.strictEqual(adminFound, true, 'Admin should be able to view inactive faculty');

        // Restore to Active
        await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ status: 'Active' })
        });
    });

    let facultyReview = null;
    await suite.test('FAC-010: Student can submit review and Admin can moderate it (Published -> Hidden -> Published)', async () => {
        // Submit review
        const revRes = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rating: 5,
                comment: 'Outstanding professor, truly inspiring lectures.',
                author: 'SIT Junior'
            })
        });
        assert.strictEqual(revRes.status, 201);
        const revData = await revRes.json();
        facultyReview = revData.data;
        createdReviewIds.push(facultyReview._id);
        assert.strictEqual(facultyReview.status, 'Published');

        // Moderate to Hidden
        const hideRes = await fetch(`${BASE_URL}/api/faculty/reviews/${facultyReview._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ status: 'Hidden' })
        });
        assert.strictEqual(hideRes.status, 200);

        // Student GET /api/faculty/:id/reviews should NOT return Hidden review
        const getRevRes = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}/reviews`);
        const getRevData = await getRevRes.json();
        const foundInStudent = getRevData.data.some(r => r._id === facultyReview._id);
        assert.strictEqual(foundInStudent, false, 'Hidden review must not be returned to student');

        // Admin GET /api/faculty/:id/reviews DOES return Hidden review
        const getAdminRevRes = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}/reviews`, {
            headers: { 'Authorization': `Bearer ${iseAdminToken}` }
        });
        const getAdminRevData = await getAdminRevRes.json();
        const foundInAdmin = getAdminRevData.data.some(r => r._id === facultyReview._id);
        assert.strictEqual(foundInAdmin, true, 'Admin should see hidden reviews');

        // Unhide back to Published
        const unhideRes = await fetch(`${BASE_URL}/api/faculty/reviews/${facultyReview._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${iseAdminToken}`
            },
            body: JSON.stringify({ status: 'Published' })
        });
        assert.strictEqual(unhideRes.status, 200);
    });

    await suite.test('FAC-011: Deleting faculty with reviews deactivates instead of deleting', async () => {
        const delRes = await fetch(`${BASE_URL}/api/faculty/${iseFaculty._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${iseAdminToken}` }
        });
        assert.strictEqual(delRes.status, 200);
        const delData = await delRes.json();
        assert.strictEqual(delData.deactivated, true, 'Faculty with reviews should be deactivated');
        const dbFac = await Faculty.findById(iseFaculty._id);
        assert.strictEqual(dbFac.status, 'Inactive');
    });

    // -------------------------------------------------------------
    // PART 3 & 4: INTERVIEW EXPERIENCES & COMPANIES TESTS
    // -------------------------------------------------------------

    let testCompany = null;
    await suite.test('EXP-001: Company creation requires admin permission', async () => {
        // Non-admin rejected
        const unauthRes = await fetch(`${BASE_URL}/api/experiences/admin/companies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studentToken}`
            },
            body: JSON.stringify({ name: 'Acme Corp' })
        });
        assert.strictEqual(unauthRes.status, 403, 'Non-admin company creation must be rejected');

        // Admin success
        const adminRes = await fetch(`${BASE_URL}/api/experiences/admin/companies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({
                name: `Test Tech Solutions ${Date.now()}`,
                logo: 'https://placehold.co/100x100?text=TestTech',
                type: 'Product',
                industry: 'Software',
                website: 'https://testtech.example.com'
            })
        });
        assert.strictEqual(adminRes.status, 201, 'Admin should be able to create company');
        testCompany = await adminRes.json();
        createdCompanyIds.push(testCompany._id);
    });

    await suite.test('EXP-002: Company update requires admin permission', async () => {
        const updateRes = await fetch(`${BASE_URL}/api/experiences/admin/companies/${testCompany._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({ industry: 'Cloud & AI' })
        });
        assert.strictEqual(updateRes.status, 200);
        const updated = await updateRes.json();
        assert.strictEqual(updated.industry, 'Cloud & AI');
    });

    let pendingExperience = null;
    await suite.test('EXP-003: Student POST /api/experiences/create enforces status=Pending', async () => {
        const res = await fetch(`${BASE_URL}/api/experiences/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                companyId: testCompany._id,
                company: testCompany.name,
                role: 'SDE Intern',
                ctc: '14',
                batch: '2026',
                difficulty: 'Medium',
                selected: true,
                overallExperience: 'Great interview experience with 3 rounds.',
                status: 'Published' // Student attempts to self-publish
            })
        });
        assert.strictEqual(res.status, 201);
        pendingExperience = await res.json();
        createdExperienceIds.push(pendingExperience._id);

        assert.strictEqual(
            pendingExperience.status,
            'Pending',
            'Student submissions must default to Pending status regardless of payload'
        );
    });

    await suite.test('EXP-004: Public GET /api/experiences/list excludes Pending experiences', async () => {
        const res = await fetch(`${BASE_URL}/api/experiences/list?companyId=${testCompany._id}`);
        assert.strictEqual(res.status, 200);
        const list = await res.json();
        const found = list.some(e => e._id === pendingExperience._id);
        assert.strictEqual(found, false, 'Pending experience must be hidden from student list');
    });

    await suite.test('EXP-005: Admin can view Pending experiences using ?status=Pending', async () => {
        const res = await fetch(`${BASE_URL}/api/experiences/list?companyId=${testCompany._id}&status=Pending`, {
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        assert.strictEqual(res.status, 200);
        const list = await res.json();
        const found = list.some(e => e._id === pendingExperience._id);
        assert.strictEqual(found, true, 'Admin must be able to view Pending experiences');
    });

    await suite.test('EXP-006: Admin can approve/publish experience (PATCH status=Published)', async () => {
        const patchRes = await fetch(`${BASE_URL}/api/experiences/${pendingExperience._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({ status: 'Published' })
        });
        assert.strictEqual(patchRes.status, 200);

        // Now public list should contain it
        const pubRes = await fetch(`${BASE_URL}/api/experiences/list?companyId=${testCompany._id}`);
        const list = await pubRes.json();
        const found = list.some(e => e._id === pendingExperience._id);
        assert.strictEqual(found, true, 'Published experience must now be visible in student list');
    });

    await suite.test('EXP-007: Admin can reject experience and public list excludes it', async () => {
        const rejRes = await fetch(`${BASE_URL}/api/experiences/${pendingExperience._id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({ status: 'Rejected', reason: 'Insufficient details provided' })
        });
        assert.strictEqual(rejRes.status, 200);

        // Verify excluded from public
        const pubRes = await fetch(`${BASE_URL}/api/experiences/list?companyId=${testCompany._id}`);
        const list = await pubRes.json();
        const found = list.some(e => e._id === pendingExperience._id);
        assert.strictEqual(found, false, 'Rejected experience must be hidden from student list');
    });

    await suite.test('EXP-008: Admin can archive experience (DELETE /api/experiences/:id)', async () => {
        const delRes = await fetch(`${BASE_URL}/api/experiences/${pendingExperience._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        assert.strictEqual(delRes.status, 200);

        const expDb = await Experience.findById(pendingExperience._id);
        assert.strictEqual(expDb.status, 'Archived');
    });

    await suite.test('EXP-009: Deleting company with associated experiences deactivates instead of deleting', async () => {
        const delRes = await fetch(`${BASE_URL}/api/experiences/admin/companies/${testCompany._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        assert.strictEqual(delRes.status, 200);
        const delData = await delRes.json();
        assert.strictEqual(delData.deactivated, true, 'Company with experiences must be deactivated');

        const compDb = await Company.findById(testCompany._id);
        assert.strictEqual(compDb.status, 'Inactive');
    });

    // -------------------------------------------------------------
    // PART 5: AUDIT LOG VERIFICATION
    // -------------------------------------------------------------

    await suite.test('AUDIT-001: AdminActivity logs are recorded for faculty, review, experience, and company', async () => {
        const facultyLog = await AdminActivity.findOne({ resourceType: 'FACULTY', action: 'CREATE' });
        assert.ok(facultyLog, 'Expected AdminActivity log for FACULTY CREATE');

        const reviewLog = await AdminActivity.findOne({ resourceType: 'FACULTY_REVIEW', action: 'UNPUBLISH' });
        assert.ok(reviewLog, 'Expected AdminActivity log for FACULTY_REVIEW UNPUBLISH');

        const expLog = await AdminActivity.findOne({ resourceType: 'EXPERIENCE', action: 'PUBLISH' });
        assert.ok(expLog, 'Expected AdminActivity log for EXPERIENCE PUBLISH');

        const compLog = await AdminActivity.findOne({ resourceType: 'COMPANY', action: 'CREATE' });
        assert.ok(compLog, 'Expected AdminActivity log for COMPANY CREATE');
    });
});
