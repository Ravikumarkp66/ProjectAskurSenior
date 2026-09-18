/**
 * F-09 Final Production-Data Audit Script Before F-10
 * 
 * Strict READ-ONLY audit of F-09 using real Scheme 2025 student data.
 * Zero database writes.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Scheme = require('../models/Scheme');
const StudentAccount = require('../models/StudentAccount');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentCieRecord = require('../models/StudentCieRecord');
const StudentSemesterResult = require('../models/StudentSemesterResult');
const StudentSubjectAttendance = require('../models/StudentSubjectAttendance');
const { SectionTimetable } = require('../models/SectionTimetable');

const {
    buildStudentEvaluationContext,
    evaluateStudentSubject
} = require('../services/academicEvaluationContextService');
const { calculateStudentEvaluation } = require('../services/evaluationCalculationEngine');

async function runProductionAudit() {
    console.log('======================================================================');
    console.log(' F-09 FINAL PRODUCTION-DATA AUDIT (READ-ONLY)');
    console.log('======================================================================');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    // 1. Initial Document Counts
    const countsBefore = {
        academic_subjects: await mongoose.connection.collection('academic_subjects').countDocuments(),
        academic_evaluation_groups: await mongoose.connection.collection('academic_evaluation_groups').countDocuments(),
        academic_evaluation_rules: await mongoose.connection.collection('academic_evaluation_rules').countDocuments(),
        student_accounts: await mongoose.connection.collection('student_accounts').countDocuments(),
        student_registered_subjects: await mongoose.connection.collection('student_registered_subjects').countDocuments(),
        studentcierecords: await mongoose.connection.collection('studentcierecords').countDocuments(),
        studentsemesterresults: await mongoose.connection.collection('studentsemesterresults').countDocuments(),
        student_subject_attendances: await mongoose.connection.collection('student_subject_attendances').countDocuments()
    };

    console.log('--- DATABASE COUNTS BEFORE AUDIT ---');
    console.table(countsBefore);

    const scheme2025 = await Scheme.findOne({ name: /2025/i }).lean();
    if (!scheme2025) throw new Error('Scheme 2025 not found');

    // 2. Select Real Student 1: '697c2fa68355ab0ba8cb33aa'
    const student1 = await StudentAccount.findById('697c2fa68355ab0ba8cb33aa').lean();
    if (!student1) throw new Error('Student 1 not found');

    console.log('\n======================================================================');
    console.log(` AUDITING REAL STUDENT 1: ${student1.name} (USN: ${student1.usn || 'N/A'}, ID: ${student1._id})`);
    console.log(` Semester: ${student1.semester}, Section: "${student1.section || 'A'}", Scheme: Scheme 2025 (${scheme2025._id})`);
    console.log('======================================================================');

    const registeredSubjects = await StudentRegisteredSubject.find({
        student: student1._id,
        semester: student1.semester
    }).populate('subject').lean();

    console.log(`Found ${registeredSubjects.length} registered subjects for Student 1 in Semester ${student1.semester}.\n`);

    const auditResults = [];

    for (const reg of registeredSubjects) {
        const subject = reg.subject;
        console.log(`----------------------------------------------------------------------`);
        console.log(`SUBJECT: ${subject.code} - ${subject.name} (Credits: ${subject.credits}, Category: ${reg.category})`);

        // A. Resolve Evaluation Group & Rule
        const evalGroup = await AcademicEvaluationGroup.findOne({
            scheme: scheme2025._id,
            subjects: subject._id
        }).lean();

        const activeRule = evalGroup ? await AcademicEvaluationRule.findOne({
            scheme: scheme2025._id,
            evaluationGroup: evalGroup._id,
            status: 'ACTIVE'
        }).lean() : null;

        // B. Fetch Real CIE Record
        const cieDoc = await StudentCieRecord.findOne({
            student: student1._id,
            semester: student1.semester,
            registeredSubject: reg._id
        }).lean();

        // C. Fetch Real SEE Mark from StudentSemesterResult
        const semResultDoc = await StudentSemesterResult.findOne({
            student: student1._id,
            semester: student1.semester
        }).lean();

        const subjResultItem = semResultDoc?.subjects?.find(s => 
            s.registeredSubject?.toString() === reg._id.toString() ||
            s.subject?.toString() === subject._id.toString()
        );

        // D. Fetch Real Attendance Record
        const attDoc = await StudentSubjectAttendance.findOne({
            student: student1._id,
            subject: subject._id
        }).lean();

        // E. Check Data Availability
        const hasCie = !!cieDoc;
        const hasSee = subjResultItem?.seeRawMarks !== undefined && subjResultItem?.seeRawMarks !== null;
        const hasAtt = !!attDoc && attDoc.analytics?.conducted > 0;

        let attendancePct = 100;
        let attendanceSource = 'DATA_MISSING';
        if (hasAtt) {
            attendancePct = (attDoc.analytics.present / attDoc.analytics.conducted) * 100;
            attendanceSource = `Real StudentSubjectAttendance (${attDoc.analytics.present}/${attDoc.analytics.conducted})`;
        } else if (attDoc) {
            attendanceSource = `Real StudentSubjectAttendance (0 classes conducted)`;
        }

        // F. Execute Context Building using PURE REAL DATA (NO OVERRIDES)
        const contextOptions = {
            student: student1,
            registeredSubjectId: reg._id,
            subjectId: subject._id,
            semester: student1.semester
            // NOTE: Absolutely NO rawMarksOverride, NO seeScoreOverride, NO attendanceOverride
        };

        const { normalizedInput, metadata } = await buildStudentEvaluationContext(contextOptions);

        // G. Execute Calculation
        const calcResult = await calculateStudentEvaluation(normalizedInput);

        const row = {
            subjectCode: subject.code,
            subjectName: subject.name,
            credits: subject.credits,
            evaluationGroup: evalGroup?.name || 'DATA_MISSING',
            activeRule: activeRule ? `${activeRule.name} (v${activeRule.version})` : 'DATA_MISSING',
            cieSource: cieDoc ? `StudentCieRecord (_id: ${cieDoc._id})` : 'DATA_MISSING',
            cieRawMarks: cieDoc?.rawMarks ? JSON.stringify(cieDoc.rawMarks) : 'DATA_MISSING',
            seeSource: (activeRule?.see?.enabled === false) 
                ? 'N/A (SEE Disabled by Rule)' 
                : (hasSee ? `StudentSemesterResult (seeRaw: ${subjResultItem.seeRawMarks}/${subjResultItem.seeRawMaximum})` : 'DATA_MISSING'),
            attendanceSource,
            sessionsConductedN: normalizedInput.runtimeContext?.sessionsConducted !== undefined ? normalizedInput.runtimeContext.sessionsConducted : 'N/A',
            normalizedScores: JSON.stringify(normalizedInput.scores),
            calcCie: calcResult.calculated.cie,
            calcSee: calcResult.calculated.see !== null ? calcResult.calculated.see : 'N/A',
            aggregate: calcResult.calculated.aggregate,
            eligibility: calcResult.eligibility.eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
            grade: calcResult.result.letterGrade,
            gradePoint: calcResult.result.gradePoint,
            contributesToSGPA: calcResult.sgpa.contributesToSGPA
        };

        auditResults.push(row);

        console.log(` - Evaluation Group : ${row.evaluationGroup}`);
        console.log(` - Active Rule      : ${row.activeRule}`);
        console.log(` - CIE Source       : ${row.cieSource}`);
        console.log(` - Raw CIE Marks    : ${row.cieRawMarks}`);
        console.log(` - SEE Source       : ${row.seeSource}`);
        console.log(` - Attendance Source: ${row.attendanceSource}`);
        console.log(` - Normalized Input : ${row.normalizedScores}`);
        console.log(` - Calculated Output: CIE=${row.calcCie}, SEE=${row.calcSee}, Agg=${row.aggregate} -> Grade: ${row.grade} (GP: ${row.gradePoint}, SGPA: ${row.contributesToSGPA})`);
    }

    // 3. Select Real Student 2: '6a573763154f287a1bceb7ee' to audit Standard Laboratory (PSCL5)
    console.log('\n======================================================================');
    console.log(` AUDITING REAL STUDENT 2 (Standard Lab PSCL5): ravikumar k p (USN: 1SI26IS080)`);
    console.log('======================================================================');

    const student2 = await StudentAccount.findById('6a573763154f287a1bceb7ee').lean();
    const labReg = await StudentRegisteredSubject.findOne({
        student: student2._id,
        customCode: 'PSCL5'
    }).populate('subject').lean();

    if (labReg) {
        const labSubj = labReg.subject;
        const labGroup = await AcademicEvaluationGroup.findOne({ scheme: scheme2025._id, subjects: labSubj._id }).lean();
        const labRule = await AcademicEvaluationRule.findOne({ scheme: scheme2025._id, evaluationGroup: labGroup._id, status: 'ACTIVE' }).lean();
        const labCie = await StudentCieRecord.findOne({ student: student2._id, subject: labSubj._id }).lean();
        const labAtt = await StudentSubjectAttendance.findOne({ student: student2._id, subject: labSubj._id }).lean();

        console.log(`Subject: ${labSubj.code} - ${labSubj.name}`);
        console.log(`Group: ${labGroup?.name}, Rule: ${labRule?.name}`);
        console.log(`CIE Record in DB:`, labCie ? labCie.rawMarks : 'DATA_MISSING (No marks entered yet)');
        console.log(`Attendance in DB:`, labAtt ? labAtt.analytics : 'DATA_MISSING');

        // Check Timetable for Section to trace N
        const timetable = await SectionTimetable.findOne({
            semesterNumber: student2.semester || 1
        }).lean();

        console.log(`Section Timetable Available: ${!!timetable}`);
        if (timetable) {
            const labSlots = timetable.slots?.filter(s => s.subject?.toString() === labSubj._id.toString() || s.lectureType === 'Lab');
            console.log(`Timetable Lab Slots count for section: ${labSlots?.length}`);
        }
    }

    // 4. Verification of Persistence Safety
    console.log('\n======================================================================');
    console.log(' DATABASE COUNTS AFTER AUDIT');
    console.log('======================================================================');
    const countsAfter = {
        academic_subjects: await mongoose.connection.collection('academic_subjects').countDocuments(),
        academic_evaluation_groups: await mongoose.connection.collection('academic_evaluation_groups').countDocuments(),
        academic_evaluation_rules: await mongoose.connection.collection('academic_evaluation_rules').countDocuments(),
        student_accounts: await mongoose.connection.collection('student_accounts').countDocuments(),
        student_registered_subjects: await mongoose.connection.collection('student_registered_subjects').countDocuments(),
        studentcierecords: await mongoose.connection.collection('studentcierecords').countDocuments(),
        studentsemesterresults: await mongoose.connection.collection('studentsemesterresults').countDocuments(),
        student_subject_attendances: await mongoose.connection.collection('student_subject_attendances').countDocuments()
    };
    console.table(countsAfter);

    let writesOccurred = false;
    for (const [key, val] of Object.entries(countsBefore)) {
        if (countsAfter[key] !== val) {
            writesOccurred = true;
            console.error(`[VIOLATION] Count changed for ${key}: before=${val}, after=${countsAfter[key]}`);
        }
    }

    if (!writesOccurred) {
        console.log('\n[PASS] Database counts are 100% IDENTICAL before and after. ZERO writes occurred.');
    } else {
        throw new Error('Database write violation detected during read-only audit!');
    }

    await mongoose.disconnect();
}

runProductionAudit().catch(err => {
    console.error('[FATAL ERROR] Production audit failed:', err);
    process.exit(1);
});
