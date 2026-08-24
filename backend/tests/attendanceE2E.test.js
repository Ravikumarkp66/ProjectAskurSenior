/**
 * End-to-End (E2E) Test Suite for Attendance Section & Occurrence Engine
 * 
 * Tests the complete flow from Class Occurrence generation,
 * status transitions, attendance aggregation, subject streaks,
 * faculty swaps, to dashboard metrics response structure.
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

function runE2ETests() {
    console.log('====================================================');
    console.log('🚀 RUNNING ATTENDANCE E2E INTEGRATION TEST SUITE');
    console.log('====================================================\n');

    const studentId = 'student_65a123456789abcdef012345';
    const semester = 1;

    const subjects = [
        {
            _id: 'subj_math_01',
            subject: { _id: 'subj_math_01', subjectName: 'Mathematics for Computing', subjectCode: 'MAT301' },
            category: 'Theory',
            registeredCredits: 4,
            weeklyPlan: { theory: { required: 4 }, lab: { required: 0 } }
        },
        {
            _id: 'subj_phy_02',
            subject: { _id: 'subj_phy_02', subjectName: 'Applied Physics', subjectCode: 'PHY302' },
            category: 'Theory',
            registeredCredits: 4,
            weeklyPlan: { theory: { required: 3 }, lab: { required: 1 } }
        },
        {
            _id: 'subj_dsa_03',
            subject: { _id: 'subj_dsa_03', subjectName: 'Data Structures Lab', subjectCode: 'CSL303' },
            category: 'Lab',
            registeredCredits: 2,
            weeklyPlan: { theory: { required: 0 }, lab: { required: 2 } }
        }
    ];

    // Scenario 1: Fresh Semester (0 Conducted Classes)
    console.log('📍 Scenario 1: Fresh Semester Initial State');
    {
        const occurrences = [
            { date: '2026-08-01', timeSlot: '08:00-09:00', actualSubject: 'subj_math_01', status: STATUS.PENDING },
            { date: '2026-08-01', timeSlot: '09:00-10:00', actualSubject: 'subj_phy_02', status: STATUS.PENDING },
            { date: '2026-08-01', timeSlot: '11:00-13:00', actualSubject: 'subj_dsa_03', status: STATUS.PENDING }
        ];

        const summary = calculateSemesterAttendanceSummary(occurrences, subjects, { collegeThreshold: 85, userThreshold: 90 });
        assert.strictEqual(summary.totalConducted, 0, 'Initial conducted must be 0');
        assert.strictEqual(summary.totalPresent, 0);
        assert.strictEqual(summary.totalAbsent, 0);
        assert.strictEqual(summary.overallAttendance, null, 'Overall attendance should be null (not 0%) when 0 classes conducted');

        summary.subjects.forEach(s => {
            assert.strictEqual(s.attendancePercentage, null);
            assert.strictEqual(s.healthStatus, '⚪ Not Started');
        });
        console.log('   ✅ Passed: Initial semester state shows null % / Not Started without false 0% penalties.\n');
    }

    // Scenario 2: Student Attends Week 1 Classes
    console.log('📍 Scenario 2: Marking Week 1 Attendance & Streak Progression');
    {
        const occurrences = [
            // Math: 3 Present, 1 Absent (75%)
            { date: '2026-08-03', timeSlot: '08:00-09:00', actualSubject: 'subj_math_01', status: STATUS.PRESENT },
            { date: '2026-08-04', timeSlot: '08:00-09:00', actualSubject: 'subj_math_01', status: STATUS.PRESENT },
            { date: '2026-08-05', timeSlot: '08:00-09:00', actualSubject: 'subj_math_01', status: STATUS.ABSENT },
            { date: '2026-08-06', timeSlot: '08:00-09:00', actualSubject: 'subj_math_01', status: STATUS.PRESENT },

            // Physics: 3 Present (100%)
            { date: '2026-08-03', timeSlot: '09:00-10:00', actualSubject: 'subj_phy_02', status: STATUS.PRESENT },
            { date: '2026-08-04', timeSlot: '09:00-10:00', actualSubject: 'subj_phy_02', status: STATUS.PRESENT },
            { date: '2026-08-05', timeSlot: '09:00-10:00', actualSubject: 'subj_phy_02', status: STATUS.PRESENT },

            // DSA Lab: 1 Present (100%)
            { date: '2026-08-06', timeSlot: '11:00-13:00', actualSubject: 'subj_dsa_03', status: STATUS.PRESENT }
        ];

        const summary = calculateSemesterAttendanceSummary(occurrences, subjects, { collegeThreshold: 85, userThreshold: 90 });
        
        // Math Assertions
        const math = summary.subjects.find(s => s.subjectId === 'subj_math_01');
        assert.strictEqual(math.present, 3);
        assert.strictEqual(math.absent, 1);
        assert.strictEqual(math.conducted, 4);
        assert.strictEqual(math.attendancePercentage, 75.0);
        assert.strictEqual(math.statusCategory, 'CRITICAL', '75% is below 85% college minimum');
        assert.strictEqual(math.streak.current, 1, 'Current streak reset after absent on Aug 5, then 1 on Aug 6');
        assert.strictEqual(math.streak.longest, 2, 'Longest streak was 2');

        // Physics Assertions
        const phy = summary.subjects.find(s => s.subjectId === 'subj_phy_02');
        assert.strictEqual(phy.present, 3);
        assert.strictEqual(phy.conducted, 3);
        assert.strictEqual(phy.attendancePercentage, 100.0);
        assert.strictEqual(phy.streak.current, 3);

        // Overall Assertions (Total: 7 present / 8 conducted = 87.5%)
        assert.strictEqual(summary.totalPresent, 7);
        assert.strictEqual(summary.totalConducted, 8);
        assert.strictEqual(summary.overallAttendance, 87.5);

        console.log('   ✅ Passed: Week 1 attendance, streak break/recovery, and overall 87.5% verified.\n');
    }

    // Scenario 3: Faculty Subject Swap & Immediate Recalculation
    console.log('📍 Scenario 3: Faculty Swap (Physics took Math slot) & Suspension');
    {
        const occurrences = [
            // Scheduled Math slot was swapped to Physics on Aug 10
            {
                date: '2026-08-10',
                timeSlot: '08:00-09:00',
                scheduledSubject: 'subj_math_01',
                actualSubject: 'subj_phy_02',
                status: STATUS.PRESENT
            },
            // Scheduled Physics slot on Aug 11 was suspended due to college fest
            {
                date: '2026-08-11',
                timeSlot: '09:00-10:00',
                scheduledSubject: 'subj_phy_02',
                actualSubject: 'subj_phy_02',
                status: STATUS.SUSPENDED
            }
        ];

        const mathStats = calculateSubjectAttendance(occurrences, 'subj_math_01');
        const phyStats = calculateSubjectAttendance(occurrences, 'subj_phy_02');

        assert.strictEqual(mathStats.conducted, 0, 'Math has 0 conducted classes');
        assert.strictEqual(phyStats.conducted, 1, 'Physics conducted class credited');
        assert.strictEqual(phyStats.present, 1);
        assert.strictEqual(phyStats.suspended, 1);
        assert.strictEqual(phyStats.attendancePercentage, 100.0, 'Suspended class not included in percentage denominator');

        console.log('   ✅ Passed: Faculty swap credited Physics and suspension did not penalize student.\n');
    }

    // Scenario 4: Historical Attendance Correction (Absent -> Present & Present -> Suspended)
    console.log('📍 Scenario 4: Historical Attendance Correction & State Transitions');
    {
        const initialOccurrences = [
            { date: '2026-08-01', actualSubject: 'subj_math_01', status: STATUS.ABSENT }
        ];
        let math = calculateSubjectAttendance(initialOccurrences, 'subj_math_01');
        assert.strictEqual(math.attendancePercentage, 0.0);
        assert.strictEqual(math.conducted, 1);

        // Transition 1: Correct ABSENT -> PRESENT
        const valid1 = validateStatusTransition(STATUS.ABSENT, STATUS.PRESENT, '2026-08-01');
        initialOccurrences[0].status = valid1;
        math = calculateSubjectAttendance(initialOccurrences, 'subj_math_01');
        assert.strictEqual(math.attendancePercentage, 100.0);
        assert.strictEqual(math.present, 1);
        assert.strictEqual(math.conducted, 1);

        // Transition 2: Correct PRESENT -> SUSPENDED
        const valid2 = validateStatusTransition(STATUS.PRESENT, STATUS.SUSPENDED, '2026-08-01');
        initialOccurrences[0].status = valid2;
        math = calculateSubjectAttendance(initialOccurrences, 'subj_math_01');
        assert.strictEqual(math.conducted, 0);
        assert.strictEqual(math.attendancePercentage, null);
        assert.strictEqual(math.suspended, 1);

        console.log('   ✅ Passed: ABSENT -> PRESENT -> SUSPENDED transitions dynamically recalculated metrics.\n');
    }

    // Scenario 5: Future Date Protection
    console.log('📍 Scenario 5: Future Date Protection Security Guard');
    {
        let blocked = false;
        try {
            validateStatusTransition(STATUS.PENDING, STATUS.PRESENT, '2099-01-01');
        } catch (err) {
            blocked = true;
            assert.strictEqual(err.code, 'FUTURE_CLASS_PROTECTION');
        }
        assert.strictEqual(blocked, true, 'Must throw error when attempting to mark future class');
        console.log('   ✅ Passed: Server guard strictly rejected future attendance attempt.\n');
    }

    console.log('====================================================');
    console.log('🎯 ALL ATTENDANCE E2E INTEGRATION TESTS PASSED 100%!');
    console.log('====================================================\n');
}

runE2ETests();
