import sitData from '../data/branchChange/sit_2025_26_data.json';

export const BRANCH_ALIASES = {
    'CSE': 'CS',
    'CS': 'CS',
    'ISE': 'IS',
    'IS': 'IS',
    'AIML': 'AD',
    'AI&ML': 'AD',
    'AD': 'AD',
    'CSDS': 'CI',
    'DS': 'CI',
    'CI': 'CI',
    'ECE': 'EC',
    'EC': 'EC',
    'EEE': 'EE',
    'EE': 'EE',
    'EIE': 'EI',
    'EI': 'EI',
    'ETE': 'ET',
    'ET': 'ET',
    'MECH': 'ME',
    'ME': 'ME',
    'CIVIL': 'CV',
    'CV': 'CV',
    'CHEM': 'CH',
    'CH': 'CH',
    'IEM': 'IM',
    'IM': 'IM',
    'BIOTECH': 'BT',
    'BT': 'BT'
};

export function canonicalizeBranch(code) {
    if (!code) return '';
    const upper = String(code).trim().toUpperCase();
    return BRANCH_ALIASES[upper] || upper;
}

export function getBranchDictionary() {
    return sitData.branchDictionary || {};
}

export function getBranchList() {
    return Object.values(getBranchDictionary());
}

/**
 * Join Merit List (75 applicants) and Allocations (58 records) by USN
 */
export function getJoinedDataset(dataset = sitData) {
    const meritMap = new Map();
    (dataset.meritList || []).forEach(applicant => {
        meritMap.set(applicant.usn, applicant);
    });

    const joinedAllocations = [];
    (dataset.allocations || []).forEach(alloc => {
        const fromBranch = canonicalizeBranch(alloc.fromBranch);
        const toBranch = canonicalizeBranch(alloc.toBranch);
        const isSameBranch = fromBranch === toBranch;
        const branchChanged = !isSameBranch && alloc.remark !== 'CoC';

        const meritRecord = meritMap.get(alloc.presentUsn);

        let prefIndex = null;
        if (meritRecord && Array.isArray(meritRecord.preferences)) {
            const idx = meritRecord.preferences.findIndex(p => canonicalizeBranch(p) === toBranch);
            if (idx !== -1) {
                prefIndex = idx + 1; // 1-indexed (1st, 2nd, 3rd, 4th)
            }
        }

        joinedAllocations.push({
            slNo: alloc.slNo,
            presentUsn: alloc.presentUsn,
            newUsn: alloc.newUsn,
            fromBranch,
            toBranch,
            isSameBranch,
            branchChanged,
            remark: alloc.remark || null,
            meritRank: meritRecord ? meritRecord.rank : null,
            cgpa: meritRecord ? meritRecord.cgpa : null,
            puc: meritRecord ? meritRecord.puc : null,
            preferences: meritRecord ? meritRecord.preferences : [],
            preferenceAllocated: prefIndex
        });
    });

    return {
        academicYear: dataset.academicYear,
        institution: dataset.institution,
        branchDictionary: dataset.branchDictionary,
        totalApplicants: dataset.meritList.length,
        totalAllocations: dataset.allocations.length,
        totalBranchChanges: joinedAllocations.filter(a => a.branchChanged).length,
        allocations: joinedAllocations,
        meritList: dataset.meritList
    };
}

/**
 * Calculate statistical spread for a specific target branch
 */
export function getTargetBranchStats(targetBranchInput, dataset = sitData) {
    const targetBranch = canonicalizeBranch(targetBranchInput);
    const joined = getJoinedDataset(dataset);

    const branchInfo = joined.branchDictionary[targetBranch] || {
        code: targetBranch,
        alias: targetBranch,
        name: targetBranch,
        category: 'core'
    };

    const allocations = joined.allocations.filter(
        a => a.branchChanged && a.toBranch === targetBranch && a.cgpa !== null
    );

    if (allocations.length === 0) {
        return {
            targetBranch,
            branchInfo,
            confirmedCount: 0,
            hasAllocations: false,
            cgpaStats: null,
            rankRange: null,
            feederBranches: {},
            preferenceDistribution: { p1: 0, p2: 0, p3: 0, p4: 0, other: 0 }
        };
    }

    const cgpas = allocations.map(a => a.cgpa).sort((a, b) => a - b);
    const ranks = allocations.map(a => a.meritRank).filter(Boolean).sort((a, b) => a - b);

    const lowestCgpa = cgpas[0];
    const highestCgpa = cgpas[cgpas.length - 1];
    const sumCgpa = cgpas.reduce((sum, val) => sum + val, 0);
    const averageCgpa = Number((sumCgpa / cgpas.length).toFixed(2));

    const mid = Math.floor(cgpas.length / 2);
    const medianCgpa = cgpas.length % 2 !== 0
        ? cgpas[mid]
        : Number(((cgpas[mid - 1] + cgpas[mid]) / 2).toFixed(2));

    const feederBranches = {};
    const preferenceDistribution = { p1: 0, p2: 0, p3: 0, p4: 0, other: 0 };

    allocations.forEach(a => {
        feederBranches[a.fromBranch] = (feederBranches[a.fromBranch] || 0) + 1;
        if (a.preferenceAllocated === 1) preferenceDistribution.p1++;
        else if (a.preferenceAllocated === 2) preferenceDistribution.p2++;
        else if (a.preferenceAllocated === 3) preferenceDistribution.p3++;
        else if (a.preferenceAllocated === 4) preferenceDistribution.p4++;
        else preferenceDistribution.other++;
    });

    return {
        targetBranch,
        branchInfo,
        confirmedCount: allocations.length,
        hasAllocations: true,
        cgpaStats: {
            lowest: lowestCgpa,
            highest: highestCgpa,
            median: medianCgpa,
            average: averageCgpa,
            all: cgpas
        },
        rankRange: {
            min: ranks[0] || null,
            max: ranks[ranks.length - 1] || null
        },
        feederBranches,
        preferenceDistribution
    };
}

/**
 * Pairwise transition stats (fromBranch -> toBranch)
 */
export function getTransitionStats(fromBranchInput, toBranchInput, dataset = sitData) {
    const fromBranch = canonicalizeBranch(fromBranchInput);
    const toBranch = canonicalizeBranch(toBranchInput);
    const joined = getJoinedDataset(dataset);

    const transitions = joined.allocations.filter(
        a => a.branchChanged && a.fromBranch === fromBranch && a.toBranch === toBranch
    );

    const cgpas = transitions.map(a => a.cgpa).filter(Boolean).sort((a, b) => a - b);
    const ranks = transitions.map(a => a.meritRank).filter(Boolean).sort((a, b) => a - b);

    return {
        fromBranch,
        toBranch,
        count: transitions.length,
        hasPrecedent: transitions.length > 0,
        cgpaRange: cgpas.length > 0 ? { min: cgpas[0], max: cgpas[cgpas.length - 1] } : null,
        rankRange: ranks.length > 0 ? { min: ranks[0], max: ranks[ranks.length - 1] } : null,
        students: transitions.map(t => ({
            rank: t.meritRank,
            cgpa: t.cgpa,
            preferenceAllocated: t.preferenceAllocated
        }))
    };
}

/**
 * Compare student profile against official historical records
 */
export function compareStudentProfile({
    cgpa,
    currentBranch: rawCurrent,
    targetBranch: rawTarget,
    hasBacklog = false,
    targetPreference = 1
}, dataset = sitData) {
    const currentBranch = canonicalizeBranch(rawCurrent);
    const targetBranch = canonicalizeBranch(rawTarget);
    const numCgpa = parseFloat(cgpa);

    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        throw new Error('Valid CGPA between 0.00 and 10.00 is required');
    }

    if (!currentBranch || !targetBranch) {
        throw new Error('Both current branch and target branch must be specified');
    }

    if (currentBranch === targetBranch) {
        throw new Error('Target branch cannot be the same as your current branch');
    }

    const targetStats = getTargetBranchStats(targetBranch, dataset);
    const transitionStats = getTransitionStats(currentBranch, targetBranch, dataset);

    const observations = [];
    let cgpaPosition = 'UNKNOWN';
    let cgpaDelta = 0;

    // 1. Regulatory backlog check
    if (hasBacklog) {
        observations.push({
            type: 'REGULATORY_ALERT',
            tone: 'negative',
            text: 'SIT Autonomous Regulations require 0 active backlogs across 1st & 2nd semesters. Active backlogs make an applicant ineligible for the branch change merit list.'
        });
    }

    // 2. CGPA Historical Position Check
    if (!targetStats.hasAllocations) {
        cgpaPosition = 'NO_DATA';
        observations.push({
            type: 'NO_ALLOCATIONS',
            tone: 'neutral',
            text: `No branch change allocations to ${targetBranch} were recorded in the AY 2025–26 official data (0 confirmed seats).`
        });
    } else {
        const lowest = targetStats.cgpaStats.lowest;
        const highest = targetStats.cgpaStats.highest;
        const median = targetStats.cgpaStats.median;

        if (numCgpa >= highest) {
            cgpaPosition = 'ABOVE_OR_EQUAL_MAX';
            cgpaDelta = Number((numCgpa - lowest).toFixed(2));
            observations.push({
                type: 'CGPA_POSITION',
                tone: 'positive',
                text: `Your CGPA (${numCgpa.toFixed(2)}) is equal to or higher than the highest confirmed allocation (${highest.toFixed(2)}) for ${targetBranch} in 2025–26.`
            });
        } else if (numCgpa >= lowest) {
            cgpaPosition = 'WITHIN_RANGE';
            cgpaDelta = Number((numCgpa - lowest).toFixed(2));
            const diffFromMedian = Number((numCgpa - median).toFixed(2));
            const medianRelation = diffFromMedian >= 0 ? `+${diffFromMedian.toFixed(2)} above` : `${diffFromMedian.toFixed(2)} below`;
            observations.push({
                type: 'CGPA_POSITION',
                tone: 'positive',
                text: `Your CGPA (${numCgpa.toFixed(2)}) falls within the historical confirmed allocation range (${lowest.toFixed(2)} – ${highest.toFixed(2)}) for ${targetBranch}. It is ${medianRelation} the median (${median.toFixed(2)}).`
            });
        } else {
            cgpaPosition = 'BELOW_RANGE';
            cgpaDelta = Number((numCgpa - lowest).toFixed(2)); // negative
            observations.push({
                type: 'CGPA_POSITION',
                tone: 'caution',
                text: `Your CGPA (${numCgpa.toFixed(2)}) is below the lowest confirmed allocation (${lowest.toFixed(2)}) recorded for ${targetBranch} in 2025–26 by ${Math.abs(cgpaDelta).toFixed(2)} grade points.`
            });
        }
    }

    // 3. Feeder / Transition Insight
    if (transitionStats.hasPrecedent) {
        observations.push({
            type: 'TRANSITION_PRECEDENT',
            tone: 'info',
            text: `Historical precedent: ${transitionStats.count} student(s) successfully switched from ${currentBranch} to ${targetBranch} in 2025–26 (CGPA range: ${transitionStats.cgpaRange.min.toFixed(2)} – ${transitionStats.cgpaRange.max.toFixed(2)}).`
        });
    } else {
        const feeders = Object.keys(targetStats.feederBranches);
        if (feeders.length > 0) {
            observations.push({
                type: 'TRANSITION_PRECEDENT',
                tone: 'neutral',
                text: `No students transitioned directly from ${currentBranch} to ${targetBranch} in 2025–26. Confirmed allocations originated from: ${feeders.join(', ')}.`
            });
        }
    }

    // 4. Preference Distribution Insight
    if (targetStats.hasAllocations) {
        const prefKey = `p${targetPreference}`;
        const matchCount = targetStats.preferenceDistribution[prefKey] || 0;
        const total = targetStats.confirmedCount;
        const pct = Math.round((matchCount / total) * 100);
        observations.push({
            type: 'PREFERENCE_ALIGNMENT',
            tone: 'info',
            text: `${matchCount} of ${total} (${pct}%) students who were allocated ${targetBranch} in 2025–26 had listed it as their Preference #${targetPreference}.`
        });
    }

    return {
        studentInput: {
            cgpa: numCgpa,
            currentBranch,
            targetBranch,
            hasBacklog,
            targetPreference
        },
        targetStats,
        transitionStats,
        analysis: {
            cgpaPosition,
            cgpaDelta,
            isBacklogRestricted: hasBacklog,
            observations
        },
        meta: {
            academicYear: '2025–26',
            datasetSource: 'Official SIT Merit & Allocation Records',
            disclaimer: 'This analysis reflects confirmed administrative outcomes from AY 2025–26. Annual seat availability, departmental vacancy quotas, and applicant pool strength fluctuate each academic year.'
        }
    };
}
