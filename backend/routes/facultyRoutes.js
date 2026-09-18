const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Faculty = require('../models/Faculty');
const FacultyReview = require('../models/FacultyReview');
const Branch = require('../models/Branch');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission, enforceDepartmentScope } = require('../middleware/adminAuth');
const { logActivity } = require('../services/adminActivityService');

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

// Helper to check if request is authenticated admin without blocking public routes
const resolveAdminFromToken = async (req) => {
    if (req.admin && req.admin.status === 'ACTIVE') return req.admin;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.query?.token || null);
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior');
        const tokenEmail = (decoded.email || '').toLowerCase().trim();
        if (decoded.adminId || tokenEmail) {
            const admin = await Admin.findOne(
                decoded.adminId ? { _id: decoded.adminId } : { email: tokenEmail }
            ).populate('department');
            if (admin && admin.status === 'ACTIVE') {
                return admin;
            }
        }
    } catch (_) {}
    return null;
};

// Fast In-Memory Cache (TTL: 3 minutes)
let facultyCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000;

const getFacultiesFast = async () => {
    const now = Date.now();
    if (facultyCache && (now - lastCacheTime < CACHE_TTL_MS)) {
        return facultyCache;
    }

    // 1 Bulk Query for Branches, Reviews, and Faculties in parallel
    const [branches, allReviews, faculties] = await Promise.all([
        Branch.find({}).lean(),
        FacultyReview.find({}).sort({ createdAt: -1 }).lean(),
        Faculty.find({}).populate('departmentId').lean()
    ]);

    const branchMap = {};
    branches.forEach(b => {
        branchMap[b._id.toString()] = b.shortName || b.name || 'GENERAL';
    });

    // Group reviews by facultyId in O(N) time
    const reviewsMap = {};
    allReviews.forEach(r => {
        const facIdStr = r.facultyId ? r.facultyId.toString() : '';
        if (!reviewsMap[facIdStr]) reviewsMap[facIdStr] = [];
        reviewsMap[facIdStr].push(r);
    });

    // Process faculties in memory
    const processedFaculties = faculties.map(fac => {
        const facIdStr = fac._id.toString();
        const allFacReviews = reviewsMap[facIdStr] || [];
        const deptShortName = fac.departmentId?.shortName || fac.departmentId?.name || (fac.departmentId ? branchMap[fac.departmentId.toString()] : null) || fac.department || 'GENERAL';

        // Only Published reviews count towards student metrics and ratings
        const publishedReviews = allFacReviews.filter(r => (r.status || 'Published') === 'Published');

        let avgRating = 0;
        let weightedScore = null;
        let realMetrics = null;

        if (publishedReviews.length > 0) {
            const sum = publishedReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
            avgRating = Number((sum / publishedReviews.length).toFixed(1));

            // Weighted score calculation
            const scoresList = publishedReviews.map(r => r.submissionScore || ((r.rating || 5) * 20));
            const scoreSum = scoresList.reduce((a, b) => a + b, 0);
            weightedScore = Math.min(100, Math.max(10, Math.round(scoreSum / scoresList.length)));

            // Compute real perception metrics from reviews
            const interactiveCount = publishedReviews.filter(r => (r.classroomStyle || []).includes('Interactive') || (r.rating || 5) >= 4).length;
            const approachableCount = publishedReviews.filter(r => (r.approachability || '').toLowerCase().includes('approachable')).length;
            const fairCount = publishedReviews.filter(r => (r.performanceTreatment || []).includes('No noticeable difference')).length;
            const strictCount = publishedReviews.filter(r => (r.classroomStyle || []).includes('Very strict about time / discipline')).length;
            const practicalCount = publishedReviews.filter(r => (r.roles || []).some(role => role.includes('Lab') || role.includes('Project'))).length;
            const attendanceCount = publishedReviews.filter(r => (r.attendanceResponse || '').includes('understanding') || (r.attendanceResponse || '').includes('case-by-case')).length;

            const total = publishedReviews.length;
            realMetrics = {
                clarity: Math.round((interactiveCount / total) * 100),
                approachability: Math.round((approachableCount / total) * 100),
                gradingFairness: Math.round((fairCount / total) * 100),
                strictness: Math.round((strictCount / total) * 100),
                practicalFocus: Math.round((practicalCount / total) * 100),
                attendanceExperience: Math.round((attendanceCount / total) * 100)
            };
        }

        const tagsSet = new Set();
        publishedReviews.forEach(r => (r.tags || []).forEach(t => tagsSet.add(t)));

        const mapReview = r => ({
            id: r._id.toString(),
            _id: r._id.toString(),
            author: r.author || 'Anonymous Student',
            rating: r.rating || 5,
            status: r.status || 'Published',
            comment: r.comment,
            tags: r.tags || [],
            subjects: r.subjects || [],
            roles: r.roles || [],
            classroomStyle: r.classroomStyle || [],
            performanceTreatment: r.performanceTreatment || [],
            approachability: r.approachability || '',
            attendanceResponse: r.attendanceResponse || '',
            wishIKnew: r.wishIKnew || '',
            advice: r.advice || '',
            recommendation: r.recommendation || '',
            helpfulCount: r.helpfulCount || 0,
            date: new Date(r.createdAt).toLocaleDateString()
        });

        return {
            id: facIdStr,
            _id: facIdStr,
            facultyId: fac.facultyId,
            name: fac.name,
            designation: fac.designation || 'Faculty Member',
            department: deptShortName,
            departmentId: fac.departmentId?._id || fac.departmentId || null,
            email: fac.email || '',
            officeLocation: fac.officeLocation || '',
            experienceYears: fac.experienceYears || 0,
            subjects: fac.subjects || [],
            tags: Array.from(tagsSet),
            rating: avgRating,
            facultyExperienceScore: weightedScore,
            reviewCount: publishedReviews.length,
            isLabFaculty: fac.isLabFaculty || false,
            status: fac.status || 'Active',
            isActive: fac.isActive !== false && fac.status !== 'Inactive',
            metrics: realMetrics,
            publishedReviews: publishedReviews.map(mapReview),
            allReviews: allFacReviews.map(mapReview)
        };
    });

    facultyCache = processedFaculties;
    lastCacheTime = now;
    return processedFaculties;
};

// GET /api/faculty - Fetch faculty members
// Public/Students: Active faculty only, Published reviews only
// Admins: Can view all, include Inactive, or filter by status
router.get('/', async (req, res) => {
    try {
        const { search, department, status, includeInactive, allReviews } = req.query;
        const admin = await resolveAdminFromToken(req);
        const isAdmin = !!admin;

        let facultiesWithReviews = await getFacultiesFast();

        // Enforce active status for students; allow status filtering for admins
        if (!isAdmin) {
            facultiesWithReviews = facultiesWithReviews.filter(f => f.status === 'Active');
        } else {
            if (status && status.toLowerCase() !== 'all') {
                const targetStatus = status.trim().toLowerCase();
                facultiesWithReviews = facultiesWithReviews.filter(f => (f.status || 'Active').toLowerCase() === targetStatus);
            } else if (includeInactive !== 'true' && status !== 'all') {
                facultiesWithReviews = facultiesWithReviews.filter(f => f.status === 'Active');
            }
        }

        // Attach reviews based on requester role
        const returnAllReviews = isAdmin && (allReviews === 'true' || includeInactive === 'true' || status === 'all');
        facultiesWithReviews = facultiesWithReviews.map(f => {
            const { publishedReviews, allReviews: fullReviews, ...rest } = f;
            return {
                ...rest,
                reviews: returnAllReviews ? fullReviews : publishedReviews
            };
        });

        // Filter by department query parameter if provided
        if (department && department.toLowerCase() !== 'all') {
            const targetDept = department.trim().toLowerCase();
            facultiesWithReviews = facultiesWithReviews.filter(f => {
                const fDept = (f.department || '').toLowerCase();
                return fDept === targetDept || (targetDept === 'me' && fDept === 'mech');
            });
        }

        // Filter by search query if provided
        if (search) {
            const query = search.trim().toLowerCase();
            facultiesWithReviews = facultiesWithReviews.filter(f =>
                f.name.toLowerCase().includes(query) ||
                f.designation.toLowerCase().includes(query) ||
                f.department.toLowerCase().includes(query) ||
                (f.subjects || []).some(s => s.toLowerCase().includes(query))
            );
        }

        return res.json({ success: true, data: facultiesWithReviews });
    } catch (err) {
        console.error('Error fetching faculty list:', err);
        return res.status(500).json({ success: false, message: 'Server error fetching faculty' });
    }
});

// PATCH /api/faculty/reviews/:reviewId/status -> Moderate review status (Admin only)
router.patch('/reviews/:reviewId/status', authMiddleware, requireAdmin, requirePermission('facultyReviews.moderate'), async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;

        if (!['Published', 'Hidden'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either 'Published' or 'Hidden'"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const review = await FacultyReview.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        review.status = status;
        await review.save();

        await logActivity({
            req,
            action: status === 'Published' ? 'PUBLISH' : 'UNPUBLISH',
            resourceType: 'FACULTY_REVIEW',
            resourceId: review._id,
            metadata: { facultyId: review.facultyId, status }
        });

        facultyCache = null;

        return res.json({
            success: true,
            message: `Review marked as ${status}`,
            data: review
        });
    } catch (err) {
        console.error('Error moderating review:', err);
        return res.status(500).json({ success: false, message: 'Server error moderating review' });
    }
});

// GET /api/faculty/:id/reviews - Fetch reviews for a specific faculty
router.get('/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await resolveAdminFromToken(req);
        const isAdmin = !!admin;

        const query = { facultyId: id };
        if (!isAdmin) {
            query.status = { $in: ['Published', null] };
        }

        const reviews = await FacultyReview.find(query).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: reviews });
    } catch (err) {
        console.error('Error fetching faculty reviews:', err);
        return res.status(500).json({ success: false, message: 'Server error fetching faculty reviews' });
    }
});

// GET /api/faculty/:id - Get single faculty by id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let faculty = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            faculty = await Faculty.findById(id).populate('departmentId').lean();
        }
        if (!faculty) {
            faculty = await Faculty.findOne({ facultyId: id }).populate('departmentId').lean();
        }

        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        const admin = await resolveAdminFromToken(req);
        if (!admin && faculty.status === 'Inactive') {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        return res.json({ success: true, data: faculty });
    } catch (err) {
        console.error('Error fetching faculty detail:', err);
        return res.status(500).json({ success: false, message: 'Server error fetching faculty' });
    }
});

// POST /api/faculty - Add a new faculty member (Admin only, department scoped)
router.post('/', authMiddleware, requireAdmin, requirePermission('faculty.create'), enforceDepartmentScope, async (req, res) => {
    try {
        const { name, designation, department, email, officeLocation, experienceYears, subjects, isLabFaculty } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Faculty name is required' });
        }

        let targetDeptCode = department;
        let targetDeptId = req.body.departmentId || req.body.branchId;

        // Strict department scope enforcement for normal admins
        if (req.departmentScope) {
            if (department && department.trim().toUpperCase() !== req.departmentScope.code.toUpperCase()) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: Cannot create faculty outside your assigned department (${req.departmentScope.code})`
                });
            }
            targetDeptCode = req.departmentScope.code;
            targetDeptId = req.departmentScope.id;
        }

        if (!targetDeptCode) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }

        let branchObj = null;
        if (targetDeptId && mongoose.Types.ObjectId.isValid(targetDeptId)) {
            branchObj = await Branch.findById(targetDeptId);
        }
        if (!branchObj) {
            branchObj = await Branch.findOne({ 
                $or: [
                    { shortName: targetDeptCode.trim().toUpperCase() },
                    { name: new RegExp('^' + escapeRegExp(targetDeptCode.trim()) + '$', 'i') }
                ] 
            });
        }

        const facultyId = 'FAC' + Date.now().toString().slice(-6);

        const newFaculty = new Faculty({
            facultyId,
            departmentId: branchObj ? branchObj._id : (targetDeptId || undefined),
            name: name.trim(),
            designation: (designation || 'Professor').trim(),
            department: branchObj ? branchObj.shortName : targetDeptCode.trim().toUpperCase(),
            email: (email || '').trim(),
            officeLocation: (officeLocation || '').trim(),
            experienceYears: Number(experienceYears) || 0,
            subjects: Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : []),
            isLabFaculty: !!isLabFaculty,
            status: 'Active',
            isActive: true
        });

        await newFaculty.save();

        await logActivity({
            req,
            action: 'CREATE',
            resourceType: 'FACULTY',
            resourceId: newFaculty._id,
            department: newFaculty.departmentId,
            departmentCode: newFaculty.department,
            metadata: { name: newFaculty.name, designation: newFaculty.designation }
        });

        // Invalidate cache
        facultyCache = null;

        return res.status(201).json({
            success: true,
            message: 'Faculty added successfully',
            data: newFaculty
        });
    } catch (err) {
        console.error('Error adding faculty:', err);
        return res.status(500).json({ success: false, message: 'Server error adding faculty' });
    }
});

// PUT /api/faculty/:id - Update faculty details (Admin only, department scoped)
router.put('/:id', authMiddleware, requireAdmin, requirePermission('faculty.update'), enforceDepartmentScope, async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findById(id);

        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        // Enforce department scope for normal admins
        if (req.departmentScope) {
            const facDeptId = faculty.departmentId ? faculty.departmentId.toString() : null;
            const facDeptCode = (faculty.department || '').toUpperCase();
            const scopeDeptId = req.departmentScope.id ? req.departmentScope.id.toString() : null;
            const scopeDeptCode = req.departmentScope.code.toUpperCase();

            const matchesId = facDeptId && scopeDeptId && facDeptId === scopeDeptId;
            const matchesCode = facDeptCode && facDeptCode === scopeDeptCode;

            if (!matchesId && !matchesCode) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: Cannot update faculty outside your assigned department (${req.departmentScope.code})`
                });
            }

            if (req.body.department && req.body.department.trim().toUpperCase() !== scopeDeptCode) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: Cannot reassign faculty to another department (${req.body.department})`
                });
            }
        }

        // Apply updates
        const { name, designation, department, email, officeLocation, experienceYears, subjects, isLabFaculty, status } = req.body;

        if (name !== undefined) faculty.name = name.trim();
        if (designation !== undefined) faculty.designation = designation.trim();
        if (email !== undefined) faculty.email = email.trim();
        if (officeLocation !== undefined) faculty.officeLocation = officeLocation.trim();
        if (experienceYears !== undefined) faculty.experienceYears = Number(experienceYears) || 0;
        if (subjects !== undefined) {
            faculty.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (isLabFaculty !== undefined) faculty.isLabFaculty = !!isLabFaculty;

        if (status !== undefined) {
            faculty.status = status;
            faculty.isActive = status === 'Active';
        }

        // Handle department changes for super admins
        if (department && (!req.departmentScope || req.isSuperAdmin)) {
            let branchObj = await Branch.findOne({
                $or: [
                    { shortName: department.trim().toUpperCase() },
                    { name: new RegExp('^' + escapeRegExp(department.trim()) + '$', 'i') }
                ]
            });
            faculty.department = branchObj ? branchObj.shortName : department.trim().toUpperCase();
            if (branchObj) faculty.departmentId = branchObj._id;
        }

        await faculty.save();

        await logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'FACULTY',
            resourceId: faculty._id,
            department: faculty.departmentId,
            departmentCode: faculty.department,
            metadata: { name: faculty.name, designation: faculty.designation }
        });

        facultyCache = null;

        return res.json({
            success: true,
            message: 'Faculty updated successfully',
            data: faculty
        });
    } catch (err) {
        console.error('Error updating faculty:', err);
        return res.status(500).json({ success: false, message: 'Server error updating faculty' });
    }
});

// PATCH /api/faculty/:id/status - Toggle active/inactive status (Admin only, department scoped)
router.patch('/:id/status', authMiddleware, requireAdmin, requirePermission('faculty.update'), enforceDepartmentScope, async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findById(id);

        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        // Enforce department scope
        if (req.departmentScope) {
            const facDeptId = faculty.departmentId ? faculty.departmentId.toString() : null;
            const facDeptCode = (faculty.department || '').toUpperCase();
            const scopeDeptId = req.departmentScope.id ? req.departmentScope.id.toString() : null;
            const scopeDeptCode = req.departmentScope.code.toUpperCase();

            const matchesId = facDeptId && scopeDeptId && facDeptId === scopeDeptId;
            const matchesCode = facDeptCode && facDeptCode === scopeDeptCode;

            if (!matchesId && !matchesCode) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: Cannot modify faculty outside your assigned department (${req.departmentScope.code})`
                });
            }
        }

        const newStatus = req.body.status || (faculty.status === 'Active' ? 'Inactive' : 'Active');
        faculty.status = newStatus;
        faculty.isActive = newStatus === 'Active';
        await faculty.save();

        await logActivity({
            req,
            action: newStatus === 'Active' ? 'RESTORE' : 'DISABLE',
            resourceType: 'FACULTY',
            resourceId: faculty._id,
            department: faculty.departmentId,
            departmentCode: faculty.department,
            metadata: { name: faculty.name, status: newStatus }
        });

        facultyCache = null;

        return res.json({
            success: true,
            message: `Faculty status updated to ${newStatus}`,
            data: faculty
        });
    } catch (err) {
        console.error('Error updating faculty status:', err);
        return res.status(500).json({ success: false, message: 'Server error updating faculty status' });
    }
});

// DELETE /api/faculty/:id - Soft-deactivate if reviews exist, or remove if unused (Admin only, department scoped)
router.delete('/:id', authMiddleware, requireAdmin, requirePermission('faculty.delete'), enforceDepartmentScope, async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findById(id);

        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        // Enforce department scope
        if (req.departmentScope) {
            const facDeptId = faculty.departmentId ? faculty.departmentId.toString() : null;
            const facDeptCode = (faculty.department || '').toUpperCase();
            const scopeDeptId = req.departmentScope.id ? req.departmentScope.id.toString() : null;
            const scopeDeptCode = req.departmentScope.code.toUpperCase();

            const matchesId = facDeptId && scopeDeptId && facDeptId === scopeDeptId;
            const matchesCode = facDeptCode && facDeptCode === scopeDeptCode;

            if (!matchesId && !matchesCode) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: Cannot delete faculty outside your assigned department (${req.departmentScope.code})`
                });
            }
        }

        const reviewCount = await FacultyReview.countDocuments({ facultyId: faculty._id });

        if (reviewCount > 0) {
            faculty.status = 'Inactive';
            faculty.isActive = false;
            await faculty.save();

            await logActivity({
                req,
                action: 'DISABLE',
                resourceType: 'FACULTY',
                resourceId: faculty._id,
                department: faculty.departmentId,
                departmentCode: faculty.department,
                metadata: { name: faculty.name, reason: 'Deactivated due to existing student reviews', reviewCount }
            });

            facultyCache = null;

            return res.json({
                success: true,
                message: 'Faculty has student reviews and was deactivated instead of deleted',
                data: faculty,
                deactivated: true
            });
        }

        await Faculty.findByIdAndDelete(faculty._id);

        await logActivity({
            req,
            action: 'DELETE',
            resourceType: 'FACULTY',
            resourceId: faculty._id,
            department: faculty.departmentId,
            departmentCode: faculty.department,
            metadata: { name: faculty.name }
        });

        facultyCache = null;

        return res.json({
            success: true,
            message: 'Faculty deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting faculty:', err);
        return res.status(500).json({ success: false, message: 'Server error deleting faculty' });
    }
});

// POST /api/faculty/:id/reviews - Submit student review for a faculty member
router.post('/:id/reviews', async (req, res) => {
    try {
        const facultyId = req.params.id;
        const { 
            rating, 
            comment, 
            tags, 
            author,
            subjects,
            roles,
            classroomStyle,
            engagementStyle,
            performanceTreatment,
            singledOut,
            approachability,
            cieMarks,
            internalMarks,
            quizMarks,
            attendanceResponse,
            wishIKnew,
            advice,
            recommendation
        } = req.body;

        // Map rating from recommendation if not provided directly
        let finalRating = Number(rating);
        if (!finalRating || isNaN(finalRating)) {
            if (recommendation === 'Definitely' || recommendation === 'Yes') finalRating = 5;
            else if (recommendation === 'Depends on the student') finalRating = 3;
            else if (recommendation === 'Probably not') finalRating = 2;
            else if (recommendation === 'No') finalRating = 1;
            else finalRating = 4;
        }

        // Construct comment from advice/wishIKnew if comment is omitted
        let finalComment = (comment || '').trim();
        if (!finalComment) {
            const parts = [];
            if (wishIKnew) parts.push(`Before taking this faculty: ${wishIKnew}`);
            if (advice) parts.push(`Advice: ${advice}`);
            finalComment = parts.join(' | ') || 'Anonymous student feedback.';
        }

        const review = new FacultyReview({
            facultyId,
            rating: finalRating,
            comment: finalComment,
            tags: Array.isArray(tags) ? tags : (roles || []),
            author: (author || 'Anonymous Student').trim(),
            subjects: Array.isArray(subjects) ? subjects : [],
            roles: Array.isArray(roles) ? roles : [],
            classroomStyle: Array.isArray(classroomStyle) ? classroomStyle : [],
            engagementStyle: Array.isArray(engagementStyle) ? engagementStyle : [],
            performanceTreatment: Array.isArray(performanceTreatment) ? performanceTreatment : [],
            singledOut: singledOut || '',
            approachability: approachability || '',
            cieMarks: cieMarks !== null && cieMarks !== undefined ? Number(cieMarks) : null,
            internalMarks: internalMarks !== null && internalMarks !== undefined ? Number(internalMarks) : null,
            quizMarks: quizMarks !== null && quizMarks !== undefined ? Number(quizMarks) : null,
            attendanceResponse: attendanceResponse || '',
            wishIKnew: wishIKnew || '',
            advice: advice || '',
            recommendation: recommendation || '',
            status: 'Published' // Reviews default to Published
        });

        await review.save();

        // Invalidate cache
        facultyCache = null;

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, message: 'Server error submitting review' });
    }
});

module.exports = router;
