const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const FacultyReview = require('../models/FacultyReview');
const Branch = require('../models/Branch');

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
        const reviews = reviewsMap[facIdStr] || [];
        const deptShortName = fac.departmentId?.shortName || fac.departmentId?.name || (fac.departmentId ? branchMap[fac.departmentId.toString()] : null) || fac.department || 'GENERAL';

        let avgRating = 0;
        let weightedScore = null;
        let realMetrics = null;

        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
            avgRating = Number((sum / reviews.length).toFixed(1));

            // Weighted score calculation
            const scoresList = reviews.map(r => r.submissionScore || ((r.rating || 5) * 20));
            const scoreSum = scoresList.reduce((a, b) => a + b, 0);
            weightedScore = Math.min(100, Math.max(10, Math.round(scoreSum / scoresList.length)));

            // Compute real perception metrics from reviews
            const interactiveCount = reviews.filter(r => (r.classroomStyle || []).includes('Interactive') || (r.rating || 5) >= 4).length;
            const approachableCount = reviews.filter(r => (r.approachability || '').toLowerCase().includes('approachable')).length;
            const fairCount = reviews.filter(r => (r.performanceTreatment || []).includes('No noticeable difference')).length;
            const strictCount = reviews.filter(r => (r.classroomStyle || []).includes('Very strict about time / discipline')).length;
            const practicalCount = reviews.filter(r => (r.roles || []).some(role => role.includes('Lab') || role.includes('Project'))).length;
            const attendanceCount = reviews.filter(r => (r.attendanceResponse || '').includes('understanding') || (r.attendanceResponse || '').includes('case-by-case')).length;

            const total = reviews.length;
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
        reviews.forEach(r => (r.tags || []).forEach(t => tagsSet.add(t)));

        return {
            id: facIdStr,
            _id: facIdStr,
            facultyId: fac.facultyId,
            name: fac.name,
            designation: fac.designation || 'Faculty Member',
            department: deptShortName,
            email: fac.email || '',
            officeLocation: fac.officeLocation || '',
            experienceYears: fac.experienceYears || 0,
            subjects: fac.subjects || [],
            tags: Array.from(tagsSet),
            rating: avgRating,
            facultyExperienceScore: weightedScore,
            reviewCount: reviews.length,
            isLabFaculty: fac.isLabFaculty || false,
            metrics: realMetrics,
            reviews: reviews.map(r => ({
                id: r._id.toString(),
                author: r.author || 'Anonymous Student',
                rating: r.rating || 5,
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
            }))
        };
    });

    facultyCache = processedFaculties;
    lastCacheTime = now;
    return processedFaculties;
};

// GET /api/faculty - Fetch all faculty members (Optimized & Instant)
router.get('/', async (req, res) => {
    try {
        const { search, department } = req.query;

        let facultiesWithReviews = await getFacultiesFast();

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

// POST /api/faculty - Add a new faculty member
router.post('/', async (req, res) => {
    try {
        const { name, designation, department, email, officeLocation, experienceYears, subjects, isLabFaculty } = req.body;

        if (!name || !department) {
            return res.status(400).json({ success: false, message: 'Name and Department are required' });
        }

        let branchObj = await Branch.findOne({ 
            $or: [
                { shortName: department.trim().toUpperCase() },
                { name: new RegExp(department.trim(), 'i') }
            ] 
        });

        const facultyId = 'FAC' + Date.now().toString().slice(-6);

        const newFaculty = new Faculty({
            facultyId,
            departmentId: branchObj ? branchObj._id : undefined,
            name: name.trim(),
            designation: (designation || 'Professor').trim(),
            department: department.trim().toUpperCase(),
            email: (email || '').trim(),
            officeLocation: (officeLocation || '').trim(),
            experienceYears: Number(experienceYears) || 0,
            subjects: Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map(s => s.trim()) : []),
            isLabFaculty: !!isLabFaculty
        });

        await newFaculty.save();

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
            recommendation: recommendation || ''
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
