const express = require('express');
const router = express.Router();
const {
    getJoinedDataset,
    getTargetBranchStats,
    getTransitionStats,
    compareStudentProfile
} = require('../services/branchChangeEngine');

/**
 * GET /api/branch-change/meta
 * Returns metadata, summary counts, and available branch dictionary
 */
router.get('/meta', (req, res) => {
    try {
        const dataset = getJoinedDataset();
        return res.json({
            success: true,
            data: {
                academicYear: dataset.academicYear,
                institution: dataset.institution,
                totalApplicants: dataset.totalApplicants,
                totalAllocations: dataset.totalAllocations,
                totalBranchChanges: dataset.totalBranchChanges,
                branches: Object.values(dataset.branchDictionary)
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/branch-change/stats/:branch
 * Returns observed stats for a specific target branch
 */
router.get('/stats/:branch', (req, res) => {
    try {
        const stats = getTargetBranchStats(req.params.branch);
        return res.json({ success: true, data: stats });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/branch-change/matrix
 * Returns the entire anonymized allocation matrix for dashboard visualization
 */
router.get('/matrix', (req, res) => {
    try {
        const dataset = getJoinedDataset();
        // Sanitize - omit names and raw USNs to maintain strict privacy
        const sanitizedAllocations = dataset.allocations.map(a => ({
            slNo: a.slNo,
            fromBranch: a.fromBranch,
            toBranch: a.toBranch,
            isSameBranch: a.isSameBranch,
            branchChanged: a.branchChanged,
            meritRank: a.meritRank,
            cgpa: a.cgpa,
            preferenceAllocated: a.preferenceAllocated
        }));

        return res.json({
            success: true,
            data: {
                academicYear: dataset.academicYear,
                totalAllocations: sanitizedAllocations.length,
                allocations: sanitizedAllocations
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/branch-change/analyze
 * Compares student input against historical confirmed outcomes
 */
router.post('/analyze', (req, res) => {
    try {
        const { cgpa, currentBranch, targetBranch, hasBacklog, targetPreference } = req.body;
        const result = compareStudentProfile({
            cgpa,
            currentBranch,
            targetBranch,
            hasBacklog: Boolean(hasBacklog),
            targetPreference: targetPreference ? parseInt(targetPreference, 10) : 1
        });
        return res.json({ success: true, data: result });
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
