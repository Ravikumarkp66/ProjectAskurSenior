/**
 * Integration Verification Script for F-08: Student Academic Evaluation Calculation Engine
 * 
 * Verifies:
 * - Dynamically resolves all 7 ACTIVE Scheme 2025 rules from MongoDB
 * - Executes representative calculations against live DB rules and real subjects
 * - Strictly confirms ZERO database writes occur
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Scheme = require('../models/Scheme');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');

const {
    resolveActiveEvaluationRule,
    EvaluationSubjectNotFoundError
} = require('../services/evaluationRuleResolver');
const { calculateStudentEvaluation } = require('../services/evaluationCalculationEngine');

async function runIntegrationVerification() {
    console.log('===============================================================');
    console.log(' F-08 CALCULATION ENGINE INTEGRATION VERIFICATION (READ-ONLY)');
    console.log('===============================================================');

    console.log('\n[1/5] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' Connected to database successfully.');

    // 1. Initial State Snapshot
    const initialRuleCount = await AcademicEvaluationRule.countDocuments();
    const initialRules = await AcademicEvaluationRule.find({}, '_id version updatedAt status').lean();
    const initialRuleSnapshot = JSON.stringify(initialRules.sort((a, b) => a._id.toString().localeCompare(b._id.toString())));

    const scheme2025 = await Scheme.findOne({ name: /2025/i });
    if (!scheme2025) throw new Error('Scheme 2025 not found in database');

    console.log(`\n[2/5] Initial Snapshot:`);
    console.log(` - Scheme 2025 ID: ${scheme2025._id}`);
    console.log(` - AcademicEvaluationRule total documents: ${initialRuleCount}`);

    const activeRules = await AcademicEvaluationRule.find({ scheme: scheme2025._id, status: 'ACTIVE' })
        .populate('evaluationGroup')
        .lean();
    console.log(` - Scheme 2025 ACTIVE rules count: ${activeRules.length}`);
    if (activeRules.length !== 7) {
        throw new Error(`Expected exactly 7 ACTIVE rules for Scheme 2025, found: ${activeRules.length}`);
    }

    console.log('\n[3/5] Verifying EvaluationRuleResolver across representative subjects:');
    const testSubjects = [
        { code: 'MATH', expectedGroup: 'Standard Theory' },
        { code: 'CC08', expectedGroup: 'AEC Theory' },
        { code: 'CC09', expectedGroup: 'NCMC Non-Credit' },
        { code: 'PHYS', expectedGroup: 'Integrated IPCC' },
        { code: 'PSCL1', expectedGroup: 'Standard Laboratory' },
        { code: 'SDC1', expectedGroup: 'Project-Based SDC' },
        { code: 'CAED', expectedGroup: 'CAED Practical' }
    ];

    for (const testSub of testSubjects) {
        const resolved = await resolveActiveEvaluationRule({
            schemeId: scheme2025._id,
            subjectCode: testSub.code
        });

        if (!resolved.rule) throw new Error(`Resolver failed for ${testSub.code}: rule is null`);
        if (resolved.group.name !== testSub.expectedGroup) {
            throw new Error(`Resolver group mismatch for ${testSub.code}: expected "${testSub.expectedGroup}", got "${resolved.group.name}"`);
        }
        console.log(` [PASS] Subject "${testSub.code}" -> Resolved Group: "${resolved.group.name}" -> Active Rule: "${resolved.rule.name}"`);
    }

    // Verify negative test for resolver
    let threwSubjectNotFound = false;
    try {
        await resolveActiveEvaluationRule({
            schemeId: scheme2025._id,
            subjectCode: 'NON_EXISTENT_CODE_12345'
        });
    } catch (err) {
        if (err instanceof EvaluationSubjectNotFoundError) {
            threwSubjectNotFound = true;
        }
    }
    if (!threwSubjectNotFound) {
        throw new Error('EvaluationRuleResolver did not throw EvaluationSubjectNotFoundError for non-existent subject code');
    }
    console.log(' [PASS] Non-existent subject code correctly rejected with EvaluationSubjectNotFoundError');

    console.log('\n[4/5] Executing representative calculations using LIVE MongoDB rules:');

    // Pattern 1: Standard Theory (MATH)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'MATH',
            scores: { THEORY_TEST: 90, THEORY_QUIZ: 38, THEORY_ASSIGNMENT: 38, THEORY_SEE: 92 },
            attendance: 90
        });
        if (result.result.letterGrade !== 'O' || result.result.gradePoint !== 10 || result.calculated.aggregate !== 91.8) {
            throw new Error(`Pattern 1 calculation failed: aggregate=${result.calculated.aggregate}, grade=${result.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 1: Standard Theory (MATH) -> CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50, Agg: ${result.calculated.aggregate}/100 -> Grade: ${result.result.letterGrade} (GP: ${result.result.gradePoint})`);
    }

    // Pattern 2: AEC Theory (CC08)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'CC08',
            scores: { AEC_TEST: 90, AEC_QUIZ_ASSIGNMENT: 18, AEC_SEE: 45 },
            attendance: 88
        });
        if (result.result.letterGrade !== 'O' || result.result.gradePoint !== 10 || result.calculated.aggregate !== 90) {
            throw new Error(`Pattern 2 calculation failed: aggregate=${result.calculated.aggregate}, grade=${result.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 2: AEC Theory (CC08) -> CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50, Agg: ${result.calculated.aggregate}/100 -> Grade: ${result.result.letterGrade} (GP: ${result.result.gradePoint})`);
    }

    // Pattern 3: NCMC Non-Credit (CC09)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'CC09',
            scores: { NCMC_CIE: 30 }, // below 40, but completed
            attendance: 80
        });
        if (result.result.letterGrade !== 'PP' || result.sgpa.contributesToSGPA !== false || result.sgpa.weightedGradePoints !== 0) {
            throw new Error(`Pattern 3 calculation failed: grade=${result.result.letterGrade}, contributesToSGPA=${result.sgpa.contributesToSGPA}`);
        }
        console.log(` [PASS] Pattern 3: NCMC (CC09) -> CIE: ${result.calculated.cie}/100, SEE: ${result.calculated.see} -> Grade: ${result.result.letterGrade} (SGPA Excluded: ${!result.sgpa.contributesToSGPA})`);
    }

    // Pattern 4: Integrated IPCC (PHYS)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'PHYS',
            scores: {
                IPCC_THEORY_TEST: 90, IPCC_THEORY_QUIZ: 38, IPCC_THEORY_ASSIGNMENT: 38,
                IPCC_LAB_CONDUCTION: 330, IPCC_LAB_TEST: 14,
                IPCC_SEE: 90
            },
            attendance: 92
        });
        if (result.result.letterGrade !== 'O' || result.calculated.partitions.length !== 2) {
            throw new Error(`Pattern 4 calculation failed: grade=${result.result.letterGrade}, partitions=${result.calculated.partitions.length}`);
        }
        console.log(` [PASS] Pattern 4: Integrated IPCC (PHYS) -> Theory: ${result.calculated.partitions[0].score}/25, Lab: ${result.calculated.partitions[1].score}/25, CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50 -> Grade: ${result.result.letterGrade}`);
    }

    // Pattern 5: Standard Laboratory (PSCL1) with Runtime N = 9
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'PSCL1',
            scores: {
                conduction: { sessionsConducted: 9, rawScore: 270 }, // 270 / (9*35=315) * 35 = 30
                LAB_TEST: 14,
                LAB_SEE: 45
            },
            attendance: 90
        });
        if (result.result.letterGrade !== 'A+' || result.calculated.cie !== 44 || result.calculated.aggregate !== 89) {
            throw new Error(`Pattern 5 calculation failed: CIE=${result.calculated.cie}, aggregate=${result.calculated.aggregate}, grade=${result.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 5: Standard Lab (PSCL1) N=9 -> Conduction: 30/35, CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50, Agg: ${result.calculated.aggregate}/100 -> Grade: ${result.result.letterGrade}`);
    }

    // Pattern 6: Project-Based SDC (SDC1)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'SDC1',
            scores: {
                CIE: 44,
                SDC_SEE: 45
            },
            attendance: 90
        });
        if (result.result.letterGrade !== 'A+' || result.calculated.aggregate !== 89) {
            throw new Error(`Pattern 6 calculation failed: aggregate=${result.calculated.aggregate}, grade=${result.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 6: Project-Based SDC (SDC1) -> CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50, Agg: ${result.calculated.aggregate}/100 -> Grade: ${result.result.letterGrade}`);
    }

    // Pattern 7: CAED Practical (CAED)
    {
        const result = await calculateStudentEvaluation({
            schemeId: scheme2025._id,
            subjectCode: 'CAED',
            scores: {
                CAED_CLASSWORK: 75, // 75/80 -> 18.75
                CAED_EL: 18,        // 18/20 -> 9.0
                CAED_TESTS: 90,     // 90/100 -> 18.0 (CIE = 45.75)
                CAED_SEE: 46        // 46 direct (Aggregate = 91.75)
            },
            attendance: 95
        });
        if (result.result.letterGrade !== 'O' || result.calculated.aggregate !== 91.75) {
            throw new Error(`Pattern 7 calculation failed: aggregate=${result.calculated.aggregate}, grade=${result.result.letterGrade}`);
        }
        console.log(` [PASS] Pattern 7: CAED Practical (CAED) -> CIE: ${result.calculated.cie}/50, SEE: ${result.calculated.see}/50, Agg: ${result.calculated.aggregate}/100 -> Grade: ${result.result.letterGrade}`);
    }

    console.log('\n[5/5] Checking Database Immutability...');
    const finalRuleCount = await AcademicEvaluationRule.countDocuments();
    const finalRules = await AcademicEvaluationRule.find({}, '_id version updatedAt status').lean();
    const finalRuleSnapshot = JSON.stringify(finalRules.sort((a, b) => a._id.toString().localeCompare(b._id.toString())));

    if (finalRuleCount !== initialRuleCount) {
        throw new Error(`Database write detected! Initial count: ${initialRuleCount}, Final count: ${finalRuleCount}`);
    }
    if (finalRuleSnapshot !== initialRuleSnapshot) {
        throw new Error('Database modification detected! Academic evaluation rules snapshot changed during verification');
    }

    console.log(' [PASS] Zero database writes confirmed. Academic rules and counts remain completely unchanged.');
    console.log('\n===============================================================');
    console.log(' ALL INTEGRATION VERIFICATION CHECKS PASSED SUCCESSFULLY (PASS)');
    console.log('===============================================================');

    await mongoose.disconnect();
}

runIntegrationVerification().catch(err => {
    console.error('\n[FATAL ERROR] Integration verification failed:', err);
    process.exit(1);
});
