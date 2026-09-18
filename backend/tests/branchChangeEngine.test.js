const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    canonicalizeBranch,
    getJoinedDataset,
    getTargetBranchStats,
    getTransitionStats,
    compareStudentProfile
} = require('../services/branchChangeEngine');

describe('Branch Change Analysis Engine (SIT AY 2025-26)', () => {
    it('should canonicalize standard branch aliases correctly', () => {
        assert.equal(canonicalizeBranch('CSE'), 'CS');
        assert.equal(canonicalizeBranch('cs'), 'CS');
        assert.equal(canonicalizeBranch('ISE'), 'IS');
        assert.equal(canonicalizeBranch('AIML'), 'AD');
        assert.equal(canonicalizeBranch('ECE'), 'EC');
        assert.equal(canonicalizeBranch('MECH'), 'ME');
    });

    it('should correctly join 75 merit applicants and 58 allocation records by USN', () => {
        const dataset = getJoinedDataset();
        assert.equal(dataset.totalApplicants, 75);
        assert.equal(dataset.totalAllocations, 58);

        // Vishal C R is BT -> BT (CoC), so branchChanged must be false
        const vishal = dataset.allocations.find(a => a.presentUsn === '4BD24BT020');
        assert.ok(vishal);
        assert.equal(vishal.isSameBranch, true);
        assert.equal(vishal.branchChanged, false);

        // Total branch changes must be 57 (58 minus 1 CoC same branch)
        assert.equal(dataset.totalBranchChanges, 57);
    });

    it('should calculate accurate stats for Computer Science (CS)', () => {
        const csStats = getTargetBranchStats('CS');
        assert.equal(csStats.confirmedCount, 7);
        assert.equal(csStats.cgpaStats.lowest, 9.10);
        assert.equal(csStats.cgpaStats.highest, 9.80);
        assert.equal(csStats.cgpaStats.median, 9.78);
        assert.equal(csStats.rankRange.min, 1);
        assert.equal(csStats.rankRange.max, 31);

        // Feeders: CI (1), ME (1), CV (1), IM (1), EC (3)
        assert.equal(csStats.feederBranches.EC, 3);
        assert.equal(csStats.feederBranches.ME, 1);
    });

    it('should verify transition stats from ME to CS', () => {
        const transition = getTransitionStats('ME', 'CS');
        assert.equal(transition.hasPrecedent, true);
        assert.equal(transition.count, 1);
        assert.equal(transition.cgpaRange.min, 9.80);
        assert.equal(transition.cgpaRange.max, 9.80);
    });

    it('should handle student profile comparison with no backlogs within range', () => {
        const result = compareStudentProfile({
            cgpa: 9.50,
            currentBranch: 'EC',
            targetBranch: 'CS',
            hasBacklog: false,
            targetPreference: 1
        });

        assert.equal(result.analysis.cgpaPosition, 'WITHIN_RANGE');
        assert.equal(result.analysis.isBacklogRestricted, false);
        assert.ok(result.analysis.cgpaDelta > 0);

        // Precedent from EC to CS exists
        assert.equal(result.transitionStats.hasPrecedent, true);
    });

    it('should flag regulatory restriction when student has active backlog', () => {
        const result = compareStudentProfile({
            cgpa: 9.85,
            currentBranch: 'EC',
            targetBranch: 'CS',
            hasBacklog: true
        });

        assert.equal(result.analysis.isBacklogRestricted, true);
        const regulatoryAlert = result.analysis.observations.find(o => o.type === 'REGULATORY_ALERT');
        assert.ok(regulatoryAlert);
        assert.equal(regulatoryAlert.tone, 'negative');
    });

    it('should reject invalid input: same source and target branch', () => {
        assert.throws(() => {
            compareStudentProfile({
                cgpa: 9.00,
                currentBranch: 'CS',
                targetBranch: 'CSE'
            });
        }, /Target branch cannot be the same as your current branch/);
    });
});
