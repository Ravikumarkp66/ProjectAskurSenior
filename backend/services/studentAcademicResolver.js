const mongoose = require('mongoose');
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const AcademicBatch = require('../models/AcademicBatch');
const Branch = require('../models/Branch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const AcademicSubjectCms = require('../models/AcademicSubject');
const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const { TimetableStructure, DEFAULT_PERIODS, DEFAULT_BREAKS, DEFAULT_WORKING_DAYS } = require('../models/TimetableStructure');
const { SectionTimetable, PERIOD_DEFINITIONS, BREAK_DEFINITIONS } = require('../models/SectionTimetable');
require('../models/Faculty');
require('../models/Scheme');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');

// High-performance in-memory TTL cache for student academic context
const ACADEMIC_CONTEXT_CACHE = new Map();
const ACADEMIC_CACHE_TTL_MS = 60 * 1000; // 60 seconds

function clearAcademicContextCache() {
    ACADEMIC_CONTEXT_CACHE.clear();
}

/**
 * Authoritatively resolves student academic context from DB records.
 * Follows the core rule: Admin panel is the authoritative source of truth.
 * Student Academics is a consumer and read-only projection of that data.
 */
async function resolveStudentAcademicContext(student, requestedSemester = null, options = {}) {
    if (!student) {
        throw new Error('Student record is required for academic context resolution');
    }

    const studentIdStr = student._id ? student._id.toString() : 'anon';
    const effectiveSem = requestedSemester ? Number(requestedSemester) : (student.semester || 1);
    const secKey = typeof student.section === 'object' ? (student.section?.name || student.section?.section || '') : String(student.section || '').trim().toUpperCase();
    const labKey = typeof student.labBatch === 'object' ? (student.labBatch?.name || '') : String(student.labBatch || '').trim().toUpperCase();
    const branchKey = (student.branch?.code || student.branch?.name || student.branch || '').toString();
    const collegeKey = (student.college?.code || student.college?.name || student.college || '').toString();
    const cacheKey = `${studentIdStr}_sem${effectiveSem}_sec${secKey}_lab${labKey}_br${branchKey}_col${collegeKey}`;

    const isTestEnv = Boolean(process.env.NODE_TEST_CONTEXT) || process.env.NODE_ENV === 'test';
    if (!isTestEnv && !options.forceRefresh) {
        const cached = ACADEMIC_CONTEXT_CACHE.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL_MS)) {
            return cached.data;
        }
    }

    // 1. Resolve College (Authoritative default: SIT)
    let college = null;
    if (student.college) {
        if (mongoose.Types.ObjectId.isValid(student.college)) {
            college = await College.findById(student.college).lean();
        }
        if (!college && typeof student.college === 'string') {
            college = await College.findOne({ code: student.college.toUpperCase() }).lean();
        }
    }
    if (!college) {
        college = await College.findOne({ code: 'SIT' }).lean() || await College.findOne().lean();
    }
    const collegeId = college ? college._id : null;

    // 2. Resolve Program (Authoritative default: B.E.)
    let program = null;
    if (student.program) {
        if (mongoose.Types.ObjectId.isValid(student.program)) {
            program = await AcademicProgram.findById(student.program).lean();
        }
        if (!program && typeof student.program === 'string') {
            program = await AcademicProgram.findOne({ code: student.program.toUpperCase() }).lean();
        }
    }
    if (!program && collegeId) {
        program = await AcademicProgram.findOne({ college: collegeId, code: 'B.E' }).lean() 
            || await AcademicProgram.findOne({ college: collegeId }).lean();
    }
    const programId = program ? program._id : null;

    // 3. Resolve Branch
    let branch = null;
    if (student.branch) {
        if (mongoose.Types.ObjectId.isValid(student.branch)) {
            branch = await Branch.findById(student.branch).lean();
        }
        if (!branch && typeof student.branch === 'string') {
            branch = await Branch.findOne({ 
                $or: [
                    { code: student.branch.toUpperCase() }, 
                    { shortName: student.branch.toUpperCase() },
                    { name: new RegExp('^' + student.branch + '$', 'i') }
                ] 
            }).lean();
        }
    }
    const branchId = branch ? branch._id : null;

    // 4. Resolve Batch with Ambiguity Protection
    // First priority: direct authoritative reference on student account
    let batch = null;
    let batchAmbiguous = false;

    if (student.batch) {
        if (mongoose.Types.ObjectId.isValid(student.batch)) {
            batch = await AcademicBatch.findById(student.batch).populate('program').lean();
        }
    }

    if (!batch && collegeId) {
        // Match by admissionYear and graduationYear if available
        if (student.admissionYear) {
            const batchQuery = {
                college: collegeId,
                admissionYear: student.admissionYear
            };
            if (student.graduationYear) {
                batchQuery.graduationYear = student.graduationYear;
            }
            if (programId) {
                batchQuery.program = programId;
            }

            const matchingBatches = await AcademicBatch.find(batchQuery).populate('program').lean();
            if (matchingBatches.length === 1) {
                batch = matchingBatches[0];
            } else if (matchingBatches.length > 1) {
                // Architectural Rule: Never silently pick a batch if multiple match.
                batchAmbiguous = true;
                batch = null;
            }
        } else {
            // Fallback: If student has no admissionYear set, check if there's a unique active batch
            const activeBatches = await AcademicBatch.find({
                college: collegeId,
                ...(programId ? { program: programId } : {}),
                status: 'Active'
            }).populate('program').lean();

            if (activeBatches.length === 1) {
                batch = activeBatches[0];
            } else if (activeBatches.length === 0) {
                const anyBatches = await AcademicBatch.find({
                    college: collegeId,
                    ...(programId ? { program: programId } : {})
                }).populate('program').lean();
                if (anyBatches.length === 1) {
                    batch = anyBatches[0];
                }
            }
        }
    }
    const batchId = batch ? batch._id : null;

    // 5. Official Semesters (Admin as Authority: dates & status)
    let allOfficialSemesters = [];
    if (batchId) {
        allOfficialSemesters = await Semester.find({ batch: batchId }).sort({ number: 1 }).lean();
    }

    const now = new Date();

    // Determine current official semester:
    // 1. Semester whose official dates span today (startDate <= now && now <= endDate)
    // 2. Or configured semester with status === 'Active' (case-insensitive)
    // 3. Fallback for test fixtures without dates
    let currentOfficialSemester = allOfficialSemesters.find(s => 
        s.startDate && s.endDate && new Date(s.startDate) <= now && now <= new Date(s.endDate)
    );
    if (!currentOfficialSemester) {
        currentOfficialSemester = allOfficialSemesters.find(s => 
            String(s.status || '').toLowerCase() === 'active'
        );
    }
    const hasConfiguredDates = allOfficialSemesters.some(s => s.startDate && s.endDate);
    if (!currentOfficialSemester && !hasConfiguredDates) {
        currentOfficialSemester = allOfficialSemesters.find(s => s.number === (Number(student.semester) || 1));
    }

    const isUnconfigured = !currentOfficialSemester;
    const currentOfficialSemNumber = currentOfficialSemester ? currentOfficialSemester.number : null;
    const semesterLabel = currentOfficialSemester 
        ? (currentOfficialSemester.label || `Semester ${currentOfficialSemester.number}`)
        : 'Current semester has not been configured yet.';
    const activeSemesterNumber = requestedSemester ? Number(requestedSemester) : (currentOfficialSemNumber || Number(student.semester) || 1);

    // Classify configured semesters: Past (Historical), Current, or Future
    const classifiedSemesters = allOfficialSemesters.map(s => {
        const statusLower = String(s.status || '').toLowerCase();
        const isCurrent = currentOfficialSemester && (
            String(s._id) === String(currentOfficialSemester._id) ||
            s.number === currentOfficialSemester.number
        );
        
        let isPast = false;
        let isFuture = false;

        if (isCurrent) {
            isPast = false;
            isFuture = false;
        } else if (statusLower === 'upcoming') {
            isFuture = true;
            isPast = false;
        } else if (statusLower === 'completed' || statusLower === 'archived') {
            isPast = true;
            isFuture = false;
        } else if (currentOfficialSemester) {
            if (s.number < currentOfficialSemester.number) {
                isPast = true;
                isFuture = false;
            } else if (s.number > currentOfficialSemester.number) {
                isFuture = true;
                isPast = false;
            }
        } else {
            if (s.endDate && new Date(s.endDate) < now) {
                isPast = true;
            } else if (s.startDate && new Date(s.startDate) > now) {
                isFuture = true;
            } else {
                isPast = s.number < activeSemesterNumber;
                isFuture = s.number > activeSemesterNumber;
            }
        }

        let studentStatus = 'Past';
        if (isCurrent) studentStatus = 'Current';
        else if (isFuture) studentStatus = 'Upcoming';

        return {
            _id: s._id,
            semester: s.number,
            number: s.number,
            label: s.label || `Semester ${s.number}`,
            name: s.label || `Semester ${s.number}`,
            status: studentStatus,
            officialStatus: s.status,
            startDate: s.startDate,
            endDate: s.endDate,
            termType: s.termType || 'Semester',
            isCurrent,
            isPast,
            isFuture,
            isHistorical: isPast,
            academicYear: batch ? `${batch.admissionYear + Math.floor((s.number - 1) / 2)}–${batch.admissionYear + Math.floor((s.number - 1) / 2) + 1}` : ''
        };
    });

    // Visible Semesters: strictly past + current official semesters (future strictly hidden)
    const visibleSemesters = classifiedSemesters.filter(s => !s.isFuture);

    // Identify if the requested semester is future or unconfigured
    const requestedSemDoc = classifiedSemesters.find(s => s.number === activeSemesterNumber);
    const isFuture = requestedSemDoc ? requestedSemDoc.isFuture : (activeSemesterNumber > currentOfficialSemNumber);
    const isConfigured = !!requestedSemDoc;

    // Resolve Official Semester Document for requested semester
    let officialSemester = requestedSemDoc || null;
    if (!officialSemester && batchId) {
        officialSemester = await Semester.findOne({
            batch: batchId,
            number: activeSemesterNumber
        }).lean();
    }

    // 5b. Resolve Teaching Schedule Bounds (Commencement of Regular Classes & Last Working Day)
    let commencementDate = null;
    let lastWorkingDayDate = null;
    try {
        const CollegeEvent = require('../models/CollegeEvent');
        const AcademicCalendarItem = require('../models/AcademicCalendarItem');
        const semesterId = officialSemester?._id;

        // Query canonical CollegeEvent first
        if (CollegeEvent && typeof CollegeEvent.find === 'function') {
            const collegeEvents = await CollegeEvent.find({
                status: { $ne: 'ARCHIVED' },
                $or: [
                    ...(semesterId ? [{ academicSemesterId: semesterId }] : []),
                    ...(collegeId ? [{ college: collegeId }] : [])
                ]
            }).lean() || [];

            for (const ev of collegeEvents) {
                const title = ev.title || '';
                if (!commencementDate && /commencement.*regular.*class/i.test(title)) {
                    commencementDate = ev.startDate;
                }
                if (!lastWorkingDayDate && /last.*working.*day/i.test(title)) {
                    lastWorkingDayDate = ev.endDate || ev.startDate;
                }
            }
        }

        // Fallback to legacy AcademicCalendarItem if not resolved
        if ((!commencementDate || !lastWorkingDayDate) && AcademicCalendarItem && typeof AcademicCalendarItem.find === 'function') {
            const calItems = await AcademicCalendarItem.find({
                $or: [
                    ...(semesterId ? [{ semester: semesterId }] : []),
                    ...(batchId ? [{ batch: batchId }] : []),
                    ...(collegeId ? [{ college: collegeId }] : [])
                ]
            }).lean() || [];

            for (const item of calItems) {
                const title = item.title || item.name || '';
                if (!commencementDate && /commencement.*regular.*class/i.test(title)) {
                    commencementDate = item.startDate;
                }
                if (!lastWorkingDayDate && /last.*working.*day/i.test(title)) {
                    lastWorkingDayDate = item.endDate || item.startDate;
                }
            }
        }
    } catch (milestoneErr) {
        // Non-fatal if event models fail
    }

    // 6. Resolve Academic Section (Strictly Scoped)
    let academicSection = null;
    const studentSectionName = (student.section || 'A').trim().toUpperCase();

    if (student.academicSection) {
        academicSection = await AcademicSection.findById(student.academicSection).lean();
    }

    if (!academicSection && batchId) {
        if (branchId) {
            academicSection = await AcademicSection.findOne({
                batch: batchId,
                branch: branchId,
                semester: activeSemesterNumber,
                name: studentSectionName
            }).lean();
        }

        if (!academicSection) {
            academicSection = await AcademicSection.findOne({
                batch: batchId,
                semester: activeSemesterNumber,
                name: studentSectionName
            }).lean();
        }

        if (!academicSection && branchId) {
            academicSection = await AcademicSection.findOne({
                batch: batchId,
                branch: branchId,
                semester: activeSemesterNumber,
                $or: [{ status: 'Active' }, { isActive: true }]
            }).sort({ name: 1 }).lean();
        }

        if (!academicSection) {
            academicSection = await AcademicSection.findOne({
                batch: batchId,
                semester: activeSemesterNumber,
                $or: [{ status: 'Active' }, { isActive: true }]
            }).sort({ name: 1 }).lean();
        }
    }

    // 7. Resolve Institutional Timetable Structure (Super Admin authoritative bell schedule)
    let timetableStructure = null;
    if (collegeId) {
        timetableStructure = await TimetableStructure.findOne({ college: collegeId, isActive: true }).lean();
        if (!timetableStructure) {
            timetableStructure = await TimetableStructure.findOne({ college: collegeId }).lean();
        }
    }
    if (!timetableStructure) {
        timetableStructure = {
            college: collegeId,
            scheduleName: 'SIT B.E. Standard Structure',
            classDuration: 50,
            labDuration: 100,
            collegeStartMinute: 480,
            collegeEndMinute: 960,
            periods: DEFAULT_PERIODS,
            breaks: DEFAULT_BREAKS,
            workingDays: DEFAULT_WORKING_DAYS
        };
    }

    // 8. Resolve Section Timetable (Strict Isolation: Section B never sees Section A's timetable)
    let sectionTimetable = null;
    let hasPublishedTimetable = false;

    if (academicSection) {
        sectionTimetable = await SectionTimetable.findOne({
            section: academicSection._id,
            status: { $in: ['Published', 'Draft'] }
        })
        .populate({ path: 'slots.subject', select: 'name code credits branch status year category evaluationType defaultTheoryClasses defaultLabSessions' })
        .populate({ path: 'slots.faculty', select: 'name designation facultyId email department' })
        .lean();

        if (sectionTimetable) {
            hasPublishedTimetable = true;
        }
    }

    // 9. Student Personal Settings vs Admin Minimum Policy
    let personalConfig = null;
    if (student._id) {
        personalConfig = await StudentTimetableConfiguration.findOne({
            student: student._id,
            $or: [{ semester: activeSemesterNumber }, { semester: { $exists: false } }]
        }).lean();
    }

    const collegeMinimumAttendance = 85; // Fixed authoritative institutional policy (SIT regulation)
    const personalAttendanceTarget = personalConfig?.personalAttendanceTarget ?? 90;

    const result = {
        studentId: student._id,
        college,
        program,
        batch,
        batchAmbiguous,
        branch,
        currentSemester: currentOfficialSemNumber,
        semesterLabel,
        isUnconfigured,
        activeSemesterNumber,
        isFuture,
        isConfigured,
        visibleSemesters,
        allOfficialSemesters: classifiedSemesters,
        officialSemester: officialSemester ? {
            ...officialSemester,
            commencementDate,
            lastWorkingDayDate
        } : null,
        commencementDate,
        lastWorkingDayDate,
        academicSection,
        sectionName: academicSection ? academicSection.name : studentSectionName,
        timetableStructure,
        sectionTimetable,
        hasPublishedTimetable,
        collegeMinimumAttendance,
        personalAttendanceTarget
    };

    if (!isTestEnv) {
        ACADEMIC_CONTEXT_CACHE.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
    }

    return result;
}

module.exports = {
    resolveStudentAcademicContext,
    clearAcademicContextCache
};
