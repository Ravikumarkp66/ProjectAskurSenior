/**
 * Unit Tests for Attendance Occurrence Engine
 * 
 * Verifies all mathematical invariants, state transitions, streaks,
 * faculty subject swaps, and future class protection rules.
 */

const assert = require('assert');
const {
    STATUS,
    normalizeStatus,
    validateStatusTransition,
    calculateSubjectAttendance,
    calculateSubjectStreak,
    calculateSemesterAttendanceSummary
} = require('../services/occurrenceEngine');

function runTests() {
    console.log('--- Starting Attendance Occurrence Engine Tests ---');

    const subjMath = 'subj_math_101';
    const subjPhysics = 'subj_phy_102';
    const subjChem = 'subj_chem_103';

    // Test 1: PENDING does not increment counters
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PENDING },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.PENDING }
        ];
        const res = calculateSubjectAttendance(occurrences, subjMath);
        assert.strictEqual(res.present, 0);
        assert.strictEqual(res.absent, 0);
        assert.strictEqual(res.conducted, 0);
        assert.strictEqual(res.attendancePercentage, null, 'Zero conducted must yield null percentage');
        assert.strictEqual(res.pending, 2);
        console.log('✓ Test 1 Passed: PENDING does not increment conducted or absent, yields null %');
    }

    // Test 2: PRESENT increases present and conducted (conducted = present + absent)
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT }
        ];
        const res = calculateSubjectAttendance(occurrences, subjMath);
        assert.strictEqual(res.present, 1);
        assert.strictEqual(res.absent, 0);
        assert.strictEqual(res.conducted, 1);
        assert.strictEqual(res.attendancePercentage, 100.0);
        console.log('✓ Test 2 Passed: PRESENT updates present=1, conducted=1, pct=100%');
    }

    // Test 3: ABSENT increases absent and conducted (conducted = present + absent)
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.ABSENT }
        ];
        const res = calculateSubjectAttendance(occurrences, subjMath);
        assert.strictEqual(res.present, 1);
        assert.strictEqual(res.absent, 1);
        assert.strictEqual(res.conducted, 2);
        assert.strictEqual(res.attendancePercentage, 50.0);
        console.log('✓ Test 3 Passed: ABSENT updates absent=1, conducted=2, pct=50%');
    }

    // Test 4: SUSPENDED does not count as conducted
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.ABSENT },
            { date: '2026-08-03', actualSubject: subjMath, status: STATUS.SUSPENDED }
        ];
        const res = calculateSubjectAttendance(occurrences, subjMath);
        assert.strictEqual(res.present, 1);
        assert.strictEqual(res.absent, 1);
        assert.strictEqual(res.suspended, 1);
        assert.strictEqual(res.conducted, 2);
        assert.strictEqual(res.conducted, res.present + res.absent, 'Invariant: conducted === present + absent');
        assert.strictEqual(res.attendancePercentage, 50.0);
        console.log('✓ Test 4 Passed: SUSPENDED is excluded from conducted classes');
    }

    // Test 5: PRESENT -> SUSPENDED correction decreases present & conducted
    {
        const initialOccurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.PRESENT }
        ];
        const initialRes = calculateSubjectAttendance(initialOccurrences, subjMath);
        assert.strictEqual(initialRes.present, 2);
        assert.strictEqual(initialRes.conducted, 2);

        // Correct 2026-08-02 from PRESENT -> SUSPENDED
        initialOccurrences[1].status = STATUS.SUSPENDED;
        const correctedRes = calculateSubjectAttendance(initialOccurrences, subjMath);
        assert.strictEqual(correctedRes.present, 1);
        assert.strictEqual(correctedRes.conducted, 1);
        console.log('✓ Test 5 Passed: PRESENT -> SUSPENDED correction decreases present & conducted');
    }

    // Test 6: ABSENT -> SUSPENDED correction decreases absent & conducted
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.ABSENT }
        ];
        occurrences[1].status = STATUS.SUSPENDED;
        const res = calculateSubjectAttendance(occurrences, subjMath);
        assert.strictEqual(res.present, 1);
        assert.strictEqual(res.absent, 0);
        assert.strictEqual(res.conducted, 1);
        assert.strictEqual(res.attendancePercentage, 100.0);
        console.log('✓ Test 6 Passed: ABSENT -> SUSPENDED decreases absent & conducted');
    }

    // Test 7: Faculty Subject Swap (Physics replaces Mathematics)
    {
        const occurrences = [
            // Slot scheduled for Math, but faculty swapped to Physics and attended
            {
                date: '2026-08-01',
                timeSlot: '08:00-09:00',
                scheduledSubject: subjMath,
                actualSubject: subjPhysics,
                status: STATUS.PRESENT
            }
        ];

        const mathStats = calculateSubjectAttendance(occurrences, subjMath);
        const phyStats = calculateSubjectAttendance(occurrences, subjPhysics);

        assert.strictEqual(mathStats.conducted, 0, 'Math has 0 conducted since it did not happen');
        assert.strictEqual(phyStats.conducted, 1, 'Physics conducted incremented');
        assert.strictEqual(phyStats.present, 1, 'Physics present incremented');
        console.log('✓ Test 7 Passed: Faculty subject swap awards attendance to actualSubject, not scheduledSubject');
    }

    // Test 8: Correcting Swapped Subject (Physics -> Chemistry)
    {
        const occurrences = [
            {
                date: '2026-08-01',
                timeSlot: '08:00-09:00',
                scheduledSubject: subjMath,
                actualSubject: subjPhysics,
                status: STATUS.PRESENT
            }
        ];
        // Correct actualSubject from Physics to Chemistry
        occurrences[0].actualSubject = subjChem;

        const phyStats = calculateSubjectAttendance(occurrences, subjPhysics);
        const chemStats = calculateSubjectAttendance(occurrences, subjChem);

        assert.strictEqual(phyStats.conducted, 0, 'Physics attendance removed');
        assert.strictEqual(chemStats.conducted, 1, 'Chemistry attendance added');
        assert.strictEqual(chemStats.present, 1);
        console.log('✓ Test 8 Passed: Correcting swapped subject cleanly shifts attendance without duplicate');
    }

    // Test 9: Subject Streak Calculation
    // PRESENT extends, ABSENT breaks, SUSPENDED preserves, PENDING blocks continuation
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-03', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-05', actualSubject: subjMath, status: STATUS.PRESENT }
        ];
        let streak = calculateSubjectStreak(occurrences, subjMath);
        assert.strictEqual(streak.current, 3);
        assert.strictEqual(streak.longest, 3);

        // Saturday class SUSPENDED -> streak preserved at 3
        occurrences.push({ date: '2026-08-06', actualSubject: subjMath, status: STATUS.SUSPENDED });
        streak = calculateSubjectStreak(occurrences, subjMath);
        assert.strictEqual(streak.current, 3, 'Suspension preserves streak');

        // Next class PRESENT -> streak becomes 4
        occurrences.push({ date: '2026-08-08', actualSubject: subjMath, status: STATUS.PRESENT });
        streak = calculateSubjectStreak(occurrences, subjMath);
        assert.strictEqual(streak.current, 4, 'Present after suspension extends streak to 4');
        assert.strictEqual(streak.longest, 4);

        // Class ABSENT -> current streak breaks to 0, longest remains 4
        occurrences.push({ date: '2026-08-10', actualSubject: subjMath, status: STATUS.ABSENT });
        streak = calculateSubjectStreak(occurrences, subjMath);
        assert.strictEqual(streak.current, 0, 'Absent breaks streak');
        assert.strictEqual(streak.longest, 4, 'Longest streak preserved');

        console.log('✓ Test 9 Passed: Subject streak correctly handles PRESENT, SUSPENDED neutrality, and ABSENT breakage');
    }

    // Test 10: Pending Streak Rule (Pending blocks continuation without breaking)
    {
        const occurrences = [
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-03', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-05', actualSubject: subjMath, status: STATUS.PENDING },
            { date: '2026-08-07', actualSubject: subjMath, status: STATUS.PRESENT }
        ];
        const streak = calculateSubjectStreak(occurrences, subjMath);
        assert.strictEqual(streak.current, 2, 'Pending stops streak continuation at 2 confirmed');
        console.log('✓ Test 10 Passed: PENDING occurrence blocks streak continuation until resolved');
    }

    // Test 11: Future Class Protection Guard
    {
        assert.throws(() => {
            validateStatusTransition(STATUS.PENDING, STATUS.PRESENT, '2099-12-31');
        }, /Cannot record attendance for future class occurrences/);
        console.log('✓ Test 11 Passed: Future class marking strictly blocked by backend validator');
    }

    // Test 12: Semester Summary Aggregation (Weighted total, not average of percentages)
    {
        const occurrences = [
            // Math: 4/4 (100%)
            { date: '2026-08-01', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-03', actualSubject: subjMath, status: STATUS.PRESENT },
            { date: '2026-08-04', actualSubject: subjMath, status: STATUS.PRESENT },
            // Physics: 1/2 (50%)
            { date: '2026-08-01', actualSubject: subjPhysics, status: STATUS.PRESENT },
            { date: '2026-08-02', actualSubject: subjPhysics, status: STATUS.ABSENT }
        ];

        const regSubjects = [
            { subject: { _id: subjMath, subjectName: 'Mathematics', subjectCode: 'MAT101' } },
            { subject: { _id: subjPhysics, subjectName: 'Physics', subjectCode: 'PHY102' } }
        ];

        const summary = calculateSemesterAttendanceSummary(occurrences, regSubjects, { collegeThreshold: 85, userThreshold: 90 });
        assert.strictEqual(summary.totalPresent, 5);
        assert.strictEqual(summary.totalAbsent, 1);
        assert.strictEqual(summary.totalConducted, 6);
        assert.strictEqual(summary.overallAttendance, 83.33); // 5/6 * 100 = 83.33%, not (100+50)/2 = 75%
        console.log('✓ Test 12 Passed: Semester overall attendance correctly uses totalPresent / totalConducted');
    }

    console.log('🎉 ALL 12 OCCURRENCE ENGINE TEST SUITES PASSED PERFECTLY!');
}

runTests();
