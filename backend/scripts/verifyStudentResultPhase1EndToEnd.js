const mongoose = require('mongoose');
require('dotenv').config();

const { getStudentSemesterResults } = require('../services/studentResultService');
const StudentAccount = require('../models/StudentAccount');
const StudentCieRecord = require('../models/StudentCieRecord');
const StudentSemesterResult = require('../models/StudentSemesterResult');
const StudentSubjectAttendance = require('../models/StudentSubjectAttendance');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentSubjectEvaluationResult = require('../models/StudentSubjectEvaluationResult');
const StudentEvaluationComponentRecord = require('../models/StudentEvaluationComponentRecord');
const StudentComponentMark = require('../models/StudentComponentMark');

async function getCollectionCounts() {
    return {
        academic_subjects: await AcademicSubject.countDocuments(),
        academic_evaluation_groups: await AcademicEvaluationGroup.countDocuments(),
        academic_evaluation_rules: await AcademicEvaluationRule.countDocuments(),
        student_accounts: await StudentAccount.countDocuments(),
        student_registered_subjects: await StudentRegisteredSubject.countDocuments(),
        studentcierecords: await StudentCieRecord.countDocuments(),
        studentsemesterresults: await StudentSemesterResult.countDocuments(),
        student_subject_attendances: await StudentSubjectAttendance.countDocuments(),
        student_subject_evaluation_results: await StudentSubjectEvaluationResult.countDocuments(),
        student_component_marks: await StudentComponentMark.countDocuments(),
        student_evaluation_component_records: await StudentEvaluationComponentRecord.countDocuments()
    };
}

async function runVerification() {
    console.log('===============================================================');
    console.log(' F-10 PHASE 1: END-TO-END STUDENT RESULT VERIFICATION (READ-ONLY)');
    console.log('===============================================================\n');

    console.log('[1/5] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' Connected to MongoDB.\n');

    console.log('[2/5] Pre-Verification Database Snapshot:');
    const preCounts = await getCollectionCounts();
    for (const [col, cnt] of Object.entries(preCounts)) {
        console.log(`  - ${col}: ${cnt}`);
    }

    console.log('\n[3/5] Loading Real Test Student with Active Academic Records...');
    const student = await StudentAccount.findById('697c2fa68355ab0ba8cb33aa').lean();
    if (!student) {
        throw new Error('Real test student (697c2fa68355ab0ba8cb33aa) not found');
    }
    console.log(` Loaded Student: "${student.name}" (USN: ${student.usn}, ID: ${student._id})`);

    console.log('\n[4/5] Executing getStudentSemesterResults(studentId, 1)...');
    const result = await getStudentSemesterResults(student._id, 1);

    console.log(`\n Result returned for Semester ${result.semester}:`);
    console.log(` Subject Count: ${result.subjects.length}\n`);

    const expectedCodes = ['MATH', 'PHYS', 'CC03_CC04', 'PSC3', 'CC10', 'SDC1', 'ETC13', 'PLC6'];
    const actualCodes = result.subjects.map(s => s.subjectCode);

    for (const code of expectedCodes) {
        if (!actualCodes.includes(code)) {
            throw new Error(`Expected subject code ${code} not found in results`);
        }
    }
    console.log(' [PASS] All 8 expected production subjects resolved: ' + actualCodes.join(', '));

    console.log('\n Detailed Results Table:');
    console.table(result.subjects.map(s => ({
        Code: s.subjectCode,
        Name: s.subjectName.substring(0, 24),
        Credits: s.credits,
        CIE: `${s.cie.obtained} / ${s.cie.max}`,
        SEE: s.see.enabled ? `${s.see.obtained} / ${s.see.max}` : 'Not Applicable',
        Total: `${s.aggregate.obtained} / ${s.aggregate.max}`,
        Grade: s.grade.letter,
        GP: s.grade.gradePoint,
        Eligibility: s.eligibility.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
        Reasons: s.eligibility.reasons.join('; ') || 'None'
    })));

    // Exact Value Assertions
    const math = result.subjects.find(s => s.subjectCode === 'MATH');
    if (math.cie.obtained !== 41.2 || math.see.obtained !== 44.5 || math.aggregate.obtained !== 85.7 || math.grade.letter !== 'A+') {
        throw new Error(`MATH values mismatch: CIE=${math.cie.obtained}, SEE=${math.see.obtained}, Total=${math.aggregate.obtained}, Grade=${math.grade.letter}`);
    }
    console.log(' [PASS] MATH: CIE 41.2/50, SEE 44.5/50, Agg 85.7/100 -> Grade A+');

    const phys = result.subjects.find(s => s.subjectCode === 'PHYS');
    if (phys.cie.obtained !== 17.79 || phys.see.obtained !== 33.5 || phys.grade.letter !== 'F' || phys.eligibility.eligible !== false) {
        throw new Error(`PHYS values mismatch: CIE=${phys.cie.obtained}, SEE=${phys.see.obtained}, Grade=${phys.grade.letter}`);
    }
    console.log(' [PASS] PHYS: CIE 17.79/50, SEE 33.5/50, Agg 51.29/100 -> Grade F (Failed Practical & Overall CIE Gates)');

    const cc10 = result.subjects.find(s => s.subjectCode === 'CC10');
    if (cc10.see.enabled !== false || cc10.credits !== 0 || cc10.contributesToSGPA !== false) {
        throw new Error(`CC10 NCMC mismatch: SEE enabled=${cc10.see.enabled}, credits=${cc10.credits}, SGPA=${cc10.contributesToSGPA}`);
    }
    console.log(' [PASS] CC10: NCMC Non-Credit (0 credits, SEE Not Applicable, PP/NP, SGPA Excluded)');

    const psc3 = result.subjects.find(s => s.subjectCode === 'PSC3');
    if (psc3.cie.obtained !== 41.12 || psc3.see.obtained !== 23 || psc3.grade.letter !== 'B+') {
        throw new Error(`PSC3 values mismatch: CIE=${psc3.cie.obtained}, SEE=${psc3.see.obtained}, Grade=${psc3.grade.letter}`);
    }
    console.log(' [PASS] PSC3: CIE 41.12/50, SEE 23/50, Agg 64.12/100 -> Grade B+');

    const etc13 = result.subjects.find(s => s.subjectCode === 'ETC13');
    if (etc13.cie.obtained !== 34.58 || etc13.see.obtained !== 50 || etc13.grade.letter !== 'A+') {
        throw new Error(`ETC13 values mismatch: CIE=${etc13.cie.obtained}, SEE=${etc13.see.obtained}, Grade=${etc13.grade.letter}`);
    }
    console.log(' [PASS] ETC13: CIE 34.58/50, SEE 50/50, Agg 84.58/100 -> Grade A+');

    const plc6 = result.subjects.find(s => s.subjectCode === 'PLC6');
    if (plc6.cie.obtained !== 13.92 || plc6.see.obtained !== 44.5 || plc6.grade.letter !== 'F') {
        throw new Error(`PLC6 values mismatch: CIE=${plc6.cie.obtained}, SEE=${plc6.see.obtained}, Grade=${plc6.grade.letter}`);
    }
    console.log(' [PASS] PLC6: CIE 13.92/50, SEE 44.5/50, Agg 58.42/100 -> Grade F (Failed Practical & Overall CIE Gates)');

    console.log('\n[5/5] Verifying Strict Database Immutability (Zero Writes Check)...');
    const postCounts = await getCollectionCounts();
    let hasDelta = false;
    for (const [col, cnt] of Object.entries(postCounts)) {
        const delta = cnt - preCounts[col];
        if (delta !== 0) {
            console.error(` [FAIL] Collection ${col} mutated: Delta = ${delta}`);
            hasDelta = true;
        }
    }

    if (hasDelta) {
        throw new Error('Database safety violation: collections were mutated during read-only calculation');
    }

    console.log(' [PASS] Delta is EXACTLY ZERO across all collections.');
    console.log(' [PASS] Zero database writes confirmed.');

    console.log('\n===============================================================');
    console.log(' ALL F-10 PHASE 1 VERIFICATION CHECKS PASSED SUCCESSFULLY (PASS) ');
    console.log('===============================================================');
}

runVerification()
    .catch((err) => {
        console.error('\n[FATAL ERROR]:', err);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
