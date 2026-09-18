import { describe, it, expect } from 'vitest';
import {
    canonicalizeBranch,
    getJoinedDataset,
    getTargetBranchStats,
    getTransitionStats,
    compareStudentProfile,
    getBranchList
} from '../utils/branchChangeEngine';

describe('Frontend Branch Change Engine (SIT AY 2025-26)', () => {
    it('should provide full list of 13 SIT engineering branches', () => {
        const branches = getBranchList();
        expect(branches.length).toBe(13);
        const codes = branches.map(b => b.code);
        expect(codes).toContain('CS');
        expect(codes).toContain('IS');
        expect(codes).toContain('EC');
        expect(codes).toContain('ME');
    });

    it('should canonicalize aliases (CSE -> CS, ECE -> EC, etc.)', () => {
        expect(canonicalizeBranch('CSE')).toBe('CS');
        expect(canonicalizeBranch('cse')).toBe('CS');
        expect(canonicalizeBranch('ISE')).toBe('IS');
        expect(canonicalizeBranch('AIML')).toBe('AD');
        expect(canonicalizeBranch('ECE')).toBe('EC');
        expect(canonicalizeBranch('CIVIL')).toBe('CV');
    });

    it('should accurately join 75 applicants with 58 allocation records', () => {
        const dataset = getJoinedDataset();
        expect(dataset.totalApplicants).toBe(75);
        expect(dataset.totalAllocations).toBe(58);

        // Verify Vishal C R: CoC transfer, same branch (BT -> BT)
        const vishal = dataset.allocations.find(a => a.presentUsn === '4BD24BT020');
        expect(vishal).toBeDefined();
        expect(vishal.isSameBranch).toBe(true);
        expect(vishal.branchChanged).toBe(false);

        // Confirmed internal branch changes count
        expect(dataset.totalBranchChanges).toBe(57);
    });

    it('should compute exact historical metrics for CS', () => {
        const stats = getTargetBranchStats('CS');
        expect(stats.confirmedCount).toBe(7);
        expect(stats.cgpaStats.lowest).toBe(9.10);
        expect(stats.cgpaStats.highest).toBe(9.80);
        expect(stats.cgpaStats.median).toBe(9.78);
        expect(stats.rankRange.min).toBe(1);
        expect(stats.rankRange.max).toBe(31);

        // Check feeder branches
        expect(stats.feederBranches.CI).toBe(1);
        expect(stats.feederBranches.ME).toBe(1);
        expect(stats.feederBranches.CV).toBe(1);
        expect(stats.feederBranches.IM).toBe(1);
        expect(stats.feederBranches.EC).toBe(3);
    });

    it('should analyze pairwise transition precedent (ME -> CS)', () => {
        const transition = getTransitionStats('ME', 'CS');
        expect(transition.hasPrecedent).toBe(true);
        expect(transition.count).toBe(1);
        expect(transition.cgpaRange.min).toBe(9.80);
        expect(transition.cgpaRange.max).toBe(9.80);
        expect(transition.students[0].rank).toBe(2);
    });

    it('should evaluate student comparison within observed range', () => {
        const comparison = compareStudentProfile({
            cgpa: 9.60,
            currentBranch: 'EC',
            targetBranch: 'CS',
            hasBacklog: false,
            targetPreference: 1
        });

        expect(comparison.analysis.cgpaPosition).toBe('WITHIN_RANGE');
        expect(comparison.analysis.isBacklogRestricted).toBe(false);
        expect(comparison.transitionStats.hasPrecedent).toBe(true);

        const posObs = comparison.analysis.observations.find(o => o.type === 'CGPA_POSITION');
        expect(posObs).toBeDefined();
        expect(posObs.tone).toBe('positive');
    });

    it('should evaluate student comparison below observed range without fake cutoffs', () => {
        const comparison = compareStudentProfile({
            cgpa: 8.50,
            currentBranch: 'ME',
            targetBranch: 'CS',
            hasBacklog: false
        });

        expect(comparison.analysis.cgpaPosition).toBe('BELOW_RANGE');
        expect(comparison.analysis.cgpaDelta).toBeLessThan(0);
        const obs = comparison.analysis.observations.find(o => o.type === 'CGPA_POSITION');
        expect(obs.tone).toBe('caution');
        expect(obs.text).toContain('below the lowest confirmed allocation (9.10)');
    });

    it('should enforce SIT zero-backlog regulatory alert', () => {
        const comparison = compareStudentProfile({
            cgpa: 9.90,
            currentBranch: 'ME',
            targetBranch: 'CS',
            hasBacklog: true
        });

        expect(comparison.analysis.isBacklogRestricted).toBe(true);
        const alert = comparison.analysis.observations.find(o => o.type === 'REGULATORY_ALERT');
        expect(alert).toBeDefined();
        expect(alert.tone).toBe('negative');
    });

    it('should throw error when current branch is equal to target branch', () => {
        expect(() => {
            compareStudentProfile({
                cgpa: 9.00,
                currentBranch: 'ME',
                targetBranch: 'ME'
            });
        }).toThrow('Target branch cannot be the same as your current branch');
    });
});
