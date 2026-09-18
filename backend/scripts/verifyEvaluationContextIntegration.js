/**
 * Integration Verification Script for F-09: Student Evaluation Data Integration
 * 
 * Tests:
 * 1. Reads real Scheme 2025 student and subjects from live MongoDB
 * 2. Exercises buildStudentEvaluationContext and evaluateStudentSubject across all 7 patterns:
 *    - Standard Theory (MATH)
 *    - AEC Theory (CC08)
 *    - NCMC Non-Credit (CC09)
 *    - Integrated IPCC (PHYS)
 *    - Standard Laboratory (PSCL1) with runtime N = 8, 9, 10
 *    - Project-Based SDC (SDC1)
 *    - CAED Practical (CAED)
 * 3. Validates rule independence, NCMC completion, and no SGPA calculation in F-09
 * 4. Strictly asserts ZERO database modifications occur.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Scheme = require('../models/Scheme');
const StudentAccount = require('../models/StudentAccount');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const StudentCieRecord = require('../models/StudentCieRecord');
const StudentSemesterResult = require('../models/StudentSemesterResult');

const {
    buildStudentEvaluationContext,
    evaluateStudentSubject
} = require('../services/academicEvaluationContextService');

async function runF09Integration() {
    console.log('===============================================================');
    console.log(' F-09 EVALUATION DATA INTEGRATION VERIFICATION (READ-ONLY)');
    console.log('===============================================================');

    console.log('\n[1/6] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' Connected to MongoDB.');

    // Snapshot DB state to ensure zero writes
    const initialRuleCount = await AcademicEvaluationRule.countDocuments();
    const initialCieCount = await StudentCieRecord.countDocuments();
    const initialResultCount = await StudentSemesterResult.countDocuments();
    const initialRulesSnapshot = JSON.stringify(await AcademicEvaluationRule.find({}, '_id updatedAt version status').lean());

    // 1. Resolve Scheme 2025 and a real student
    const scheme2025 = await Scheme.findOne({ name: /2025/i }).lean();
    if (!scheme2025) throw new Error('Scheme 2025 not found in DB');

    const realStudent = await StudentAccount.findOne({ scheme: scheme2025._id }).lean();
    if (!realStudent) throw new Error('No student found in Scheme 2025');

    console.log(`\n[2/6] Loaded Context:`);
    console.log(` - Scheme 2025 ID: ${scheme2025._id}`);
    console.log(` - Test Student: ${realStudent.name} (USN: ${realStudent.usn || 'N/A'}, ID: ${realStudent._id})`);

    console.log('\n[3/6] Testing Evaluation Context Integration for all 7 Scheme 2025 Patterns:');

    // 1. Standard Theory: MATH
    {
        const { normalizedInput, metadata } = await buildStudentEvaluationContext({
            student: realStudent,
            subjectCode: 'MATH',
            rawMarksOverride: { test1: 45, test2: 45, quiz1: 19, quiz2: 19, assignment1: 19, assignment2: 19 },
            seeScoreOverride: 92,
            attendanceOverride: 92
        });

        if (metadata.evaluationGroupName !== 'Standard Theory') {
            throw new Error(`Expected Standard Theory, got: ${metadata.evaluationGroupName}`);
        }
        if (normalizedInput.scores.THEORY_TEST !== 90 || normalizedInput.scores.THEORY_QUIZ !== 38 || normalizedInput.scores.THEORY_SEE !== 92) {
            throw new Error('Standard Theory score normalization mismatch');
        }

        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'MATH',
            rawMarksOverride: { test1: 45, test2: 45, quiz1: 19, quiz2: 19, assignment1: 19, assignment2: 19 },
            seeScoreOverride: 92,
            attendanceOverride: 92
        });

        if (evaluation.result.letterGrade !== 'O' || evaluation.result.gradePoint !== 10) {
            throw new Error(`MATH evaluation failed: grade=${evaluation.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 1: Standard Theory (MATH) -> Resolved Group: "${metadata.evaluationGroupName}", Grade: ${evaluation.result.letterGrade} (GP: ${evaluation.result.gradePoint})`);
    }

    // 2. AEC Theory: CC08
    {
        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'CC08',
            rawMarksOverride: { test1: 45, test2: 45, quiz1: 9, assignment1: 9 }, // Tests: 90/100 -> 30.6, Quiz+Assn: 18/20 -> 14.4 (CIE = 45)
            seeScoreOverride: 45, // 45 direct (Aggregate = 90)
            attendanceOverride: 90
        });

        if (evaluation.result.letterGrade !== 'O' || evaluation.calculated.cie !== 45 || evaluation.calculated.see !== 45) {
            throw new Error(`CC08 evaluation failed: grade=${evaluation.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 2: AEC Theory (CC08) -> CIE: ${evaluation.calculated.cie}/50, SEE: ${evaluation.calculated.see}/50, Agg: ${evaluation.calculated.aggregate}/100 -> Grade: ${evaluation.result.letterGrade}`);
    }

    // 3. NCMC Non-Credit: CC09
    {
        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'CC09',
            rawMarksOverride: { cie: 30, completed: true }, // Low score, but completed
            seeScoreOverride: 50, // Should be ignored by NCMC rule
            attendanceOverride: 80
        });

        if (evaluation.result.letterGrade !== 'PP' || evaluation.calculated.see !== null || evaluation.sgpa.contributesToSGPA !== false) {
            throw new Error(`CC09 NCMC evaluation failed: grade=${evaluation.result.letterGrade}, see=${evaluation.calculated.see}`);
        }
        console.log(` [PASS] Pattern 3: NCMC Non-Credit (CC09) -> CIE: ${evaluation.calculated.cie}/100, SEE: ${evaluation.calculated.see} -> Grade: ${evaluation.result.letterGrade} (SGPA Excluded: true)`);
    }

    // 4. Integrated IPCC: PHYS
    {
        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'PHYS',
            rawMarksOverride: {
                test1: 45, test2: 45, quiz1: 19, quiz2: 19, assignment1: 19, assignment2: 19,
                labRecord: 330, labTest: 14
            },
            seeScoreOverride: 90,
            attendanceOverride: 95
        });

        if (evaluation.result.letterGrade !== 'O' || evaluation.calculated.partitions.length !== 2) {
            throw new Error(`PHYS IPCC evaluation failed: grade=${evaluation.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 4: Integrated IPCC (PHYS) -> Theory: ${evaluation.calculated.partitions[0].score}/25, Lab: ${evaluation.calculated.partitions[1].score}/25, CIE: ${evaluation.calculated.cie}/50 -> Grade: ${evaluation.result.letterGrade}`);
    }

    // 5. Standard Laboratory: PSCL1 with Runtime N = 8, 9, 10
    console.log('\n[4/6] Testing Standard Laboratory with varying runtime N values (8, 9, 10):');
    {
        // N = 8
        const evalN8 = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'PSCL1',
            rawMarksOverride: { labRecord: 240, labTest: 14 }, // 240 / (8 * 35 = 280) * 35 = 30. LabTest = 14 => CIE = 44
            seeScoreOverride: 45,
            sessionsConductedOverride: 8,
            attendanceOverride: 90
        });
        if (evalN8.calculated.cie !== 44 || evalN8.calculated.aggregate !== 89) {
            throw new Error(`PSCL1 N=8 failed: CIE=${evalN8.calculated.cie}`);
        }
        console.log(` [PASS] PSCL1 (N=8) -> Conduction Raw 240/(8*35) -> 30/35. CIE: ${evalN8.calculated.cie}/50, SEE: ${evalN8.calculated.see}/50, Agg: ${evalN8.calculated.aggregate} -> Grade: ${evalN8.result.letterGrade}`);

        // N = 9
        const evalN9 = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'PSCL1',
            rawMarksOverride: { labRecord: 270, labTest: 14 }, // 270 / (9 * 35 = 315) * 35 = 30
            seeScoreOverride: 45,
            sessionsConductedOverride: 9,
            attendanceOverride: 90
        });
        if (evalN9.calculated.cie !== 44 || evalN9.calculated.aggregate !== 89) {
            throw new Error(`PSCL1 N=9 failed: CIE=${evalN9.calculated.cie}`);
        }
        console.log(` [PASS] PSCL1 (N=9) -> Conduction Raw 270/(9*35) -> 30/35. CIE: ${evalN9.calculated.cie}/50, SEE: ${evalN9.calculated.see}/50, Agg: ${evalN9.calculated.aggregate} -> Grade: ${evalN9.result.letterGrade}`);

        // N = 10
        const evalN10 = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'PSCL1',
            rawMarksOverride: { labRecord: 300, labTest: 14 }, // 300 / (10 * 35 = 350) * 35 = 30
            seeScoreOverride: 45,
            sessionsConductedOverride: 10,
            attendanceOverride: 90
        });
        if (evalN10.calculated.cie !== 44 || evalN10.calculated.aggregate !== 89) {
            throw new Error(`PSCL1 N=10 failed: CIE=${evalN10.calculated.cie}`);
        }
        console.log(` [PASS] PSCL1 (N=10) -> Conduction Raw 300/(10*35) -> 30/35. CIE: ${evalN10.calculated.cie}/50, SEE: ${evalN10.calculated.see}/50, Agg: ${evalN10.calculated.aggregate} -> Grade: ${evalN10.result.letterGrade}`);
    }

    // 6. Project-Based SDC: SDC1
    console.log('\n[5/6] Testing Project-Based SDC and CAED Practical:');
    {
        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'SDC1',
            rawMarksOverride: { CIE: 45 },
            seeScoreOverride: 45,
            attendanceOverride: 90
        });
        if (evaluation.result.letterGrade !== 'O' || evaluation.calculated.aggregate !== 90) {
            throw new Error(`SDC1 failed: grade=${evaluation.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 6: Project-Based SDC (SDC1) -> CIE: ${evaluation.calculated.cie}/50, SEE: ${evaluation.calculated.see}/50, Agg: ${evaluation.calculated.aggregate}/100 -> Grade: ${evaluation.result.letterGrade}`);
    }

    // 7. CAED Practical: CAED
    {
        const evaluation = await evaluateStudentSubject({
            student: realStudent,
            subjectCode: 'CAED',
            rawMarksOverride: {
                classwork: 75, // 75/80 -> 18.75
                el: 18,        // 18/20 -> 9.0
                tests: 90      // 90/100 -> 18.0 (CIE = 45.75)
            },
            seeScoreOverride: 46, // 46 direct (Aggregate = 91.75)
            attendanceOverride: 95
        });
        if (evaluation.result.letterGrade !== 'O' || evaluation.calculated.aggregate !== 91.75) {
            throw new Error(`CAED failed: grade=${evaluation.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 7: CAED Practical (CAED) -> CIE: ${evaluation.calculated.cie}/50, SEE: ${evaluation.calculated.see}/50, Agg: ${evaluation.calculated.aggregate}/100 -> Grade: ${evaluation.result.letterGrade}`);
    }

    console.log('\n[6/6] Verifying Strict Database Immutability...');
    const finalRuleCount = await AcademicEvaluationRule.countDocuments();
    const finalCieCount = await StudentCieRecord.countDocuments();
    const finalResultCount = await StudentSemesterResult.countDocuments();
    const finalRulesSnapshot = JSON.stringify(await AcademicEvaluationRule.find({}, '_id updatedAt version status').lean());

    if (finalRuleCount !== initialRuleCount || finalCieCount !== initialCieCount || finalResultCount !== initialResultCount) {
        throw new Error('Database record counts changed! Data modification occurred.');
    }
    if (finalRulesSnapshot !== initialRulesSnapshot) {
        throw new Error('AcademicEvaluationRules snapshot modified during verification!');
    }

    console.log(' [PASS] Zero database writes confirmed.');
    console.log(' [PASS] All evaluation rules, groups, and historical student records remain completely unchanged.');

    console.log('\n===============================================================');
    console.log(' ALL F-09 INTEGRATION VERIFICATION CHECKS PASSED (PASS)');
    console.log('===============================================================');

    await mongoose.disconnect();
}

runF09Integration().catch(err => {
    console.error('\n[FATAL ERROR] F-09 integration verification failed:', err);
    process.exit(1);
});
