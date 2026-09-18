const mongoose = require('mongoose');
const { resolveStudentAcademicContext } = require('../services/studentAcademicResolver');
const AcademicSection = require('../models/AcademicSection');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Subject = require('../models/Subject');
const CollegeEvent = require('../models/CollegeEvent');
const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const Branch = require('../models/Branch');
const StudentAccount = require('../models/StudentAccount');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const AcademicPlacement = require('../models/AcademicPlacement');
const SectionChangeRequest = require('../models/SectionChangeRequest');
require('../models/Faculty');
require('../models/Scheme');

function calculateAcademicProfileCompletion(student, context) {
    // If student's batch is not configured in Admin Panel, onboarding is not applicable
    if (!context || !context.batch) {
        return {
            score: 100,
            isComplete: true,
            missingFields: [],
            batchConfigured: false
        };
    }

    const missingFields = [];
    if (!student.usn) missingFields.push('USN');
    if (!student.batch && !student.admissionYear) missingFields.push('BATCH');
    if (!student.branch) missingFields.push('BRANCH');
    if (!student.semester && !student.academicSemester) missingFields.push('SEMESTER');
    if (!student.academicSection && !student.section) missingFields.push('SECTION');
    if (!student.labBatch) missingFields.push('LAB_BATCH');

    let score = 0;
    if (student.college || context?.college) score += 15;
    if (student.batch || student.admissionYear) score += 15;
    if (student.branch) score += 20;
    if (student.semester || student.academicSemester) score += 15;
    if (student.usn) score += 15;
    if (student.academicSection || student.section) score += 10;
    if (student.labBatch) score += 10;

    return {
        score: Math.min(100, score),
        isComplete: missingFields.length === 0,
        missingFields,
        batchConfigured: true
    };
}

/**
 * 1. GET /api/student/academics/overview
 * Returns the authoritative academic identity and effective view for the student.
 */
async function getOverview(req, res) {
    try {
        const student = req.student || req.user;
        const context = await resolveStudentAcademicContext(student);
        const { score, isComplete, missingFields } = calculateAcademicProfileCompletion(student, context);

        return res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: student.name,
                    usn: student.usn,
                    usnType: student.usnType || 'TEMPORARY',
                    usnVerified: !!student.usnVerified,
                    usnLocked: !!student.usnLocked,
                    currentSemester: context.currentSemester,
                    semesterLabel: context.semesterLabel || (context.currentSemester ? `Semester ${context.currentSemester}` : 'Current semester has not been configured yet.'),
                    semesterUnconfigured: !!context.isUnconfigured,
                    section: context.sectionName,
                    sectionLocked: !!student.sectionLocked,
                    labBatch: student.labBatch || null,
                    labBatchLocked: !!student.labBatchLocked
                },
                academicOnboarding: {
                    batchConfigured: !!context.batch,
                    completionPercentage: score,
                    isComplete,
                    missingFields,
                    usn: student.usn || '',
                    usnType: student.usnType || 'TEMPORARY',
                    usnVerified: !!student.usnVerified,
                    usnLocked: !!student.usnLocked,
                    sectionLocked: !!student.sectionLocked,
                    labBatch: student.labBatch || null,
                    labBatchLocked: !!student.labBatchLocked
                },
                college: context.college ? {
                    id: context.college._id,
                    name: context.college.name,
                    code: context.college.code
                } : null,
                program: context.program ? {
                    id: context.program._id,
                    name: context.program.name,
                    code: context.program.code
                } : null,
                batch: context.batch ? {
                    id: context.batch._id,
                    name: context.batch.name,
                    admissionYear: context.batch.admissionYear,
                    graduationYear: context.batch.graduationYear
                } : null,
                branch: context.branch ? {
                    id: context.branch._id,
                    name: context.branch.name,
                    shortName: context.branch.shortName || context.branch.name,
                    code: context.branch.code
                } : null,
                section: context.academicSection ? {
                    id: context.academicSection._id,
                    name: context.academicSection.name,
                    capacity: context.academicSection.capacity
                } : null,
                visibleSemesters: context.visibleSemesters,
                attendancePolicy: {
                    collegeMinimum: context.collegeMinimumAttendance,
                    personalTarget: context.personalAttendanceTarget,
                    policyNote: 'SIT Institutional Policy: Minimum 85% attendance required for exam eligibility.'
                }
            }
        });
    } catch (err) {
        console.error('getOverview error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 2. GET /api/student/academics/semesters
 * Returns strictly past + current official semesters for the student's batch. Never exposes future.
 */
async function getSemesters(req, res) {
    try {
        const student = req.student || req.user;
        const context = await resolveStudentAcademicContext(student);

        return res.status(200).json({
            success: true,
            data: context.visibleSemesters
        });
    } catch (err) {
        console.error('getSemesters error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 3. GET /api/student/academics/semesters/:semesterNumber
 * Returns specific semester details. Rejects future semesters with 403.
 */
async function getSemesterDetail(req, res) {
    try {
        const student = req.student || req.user;
        const semNum = Number(req.params.semesterNumber);

        if (isNaN(semNum) || semNum < 1) {
            return res.status(400).json({ success: false, error: 'Invalid semester number provided' });
        }

        const currentSemester = Number(student.semester) || 1;
        if (semNum > currentSemester) {
            return res.status(403).json({
                success: false,
                error: `Forbidden: Semester ${semNum} is a future semester. You can only view past and current semesters.`
            });
        }

        const context = await resolveStudentAcademicContext(student, semNum);

        if (context.isFuture) {
            return res.status(403).json({
                success: false,
                error: `Forbidden: Semester ${semNum} is a future semester. You can only view past and current semesters.`
            });
        }

        const match = context.allOfficialSemesters.find(s => s.number === semNum);

        if (!match) {
            return res.status(404).json({
                success: false,
                error: `Official Semester ${semNum} is not configured for your academic batch`
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...match,
                isCurrent: match.isCurrent,
                isHistorical: match.isPast
            }
        });
    } catch (err) {
        console.error('getSemesterDetail error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 4. GET /api/student/academics/sections
 * Returns active sections within the student's verified batch, branch, and semester for controlled switching.
 */
async function getAvailableSections(req, res) {
    try {
        const student = req.student || req.user;
        const semNum = req.query?.semester ? Number(req.query.semester) : (Number(student.semester) || 1);

        const context = await resolveStudentAcademicContext(student, semNum);

        if (context.isFuture) {
            return res.status(403).json({
                success: false,
                error: 'Cannot query sections for future semesters'
            });
        }

        if (!context.batch || !context.branch) {
            return res.status(200).json({ success: true, data: { sections: [] } });
        }

        let sections = await AcademicSection.find({
            batch: context.batch._id,
            branch: context.branch._id,
            semester: semNum,
            $or: [{ status: 'Active' }, { isActive: true }]
        }).sort({ name: 1 }).lean();

        if ((!sections || sections.length === 0) && (semNum === 1 || semNum === 2)) {
            sections = await AcademicSection.find({
                batch: context.batch._id,
                semester: semNum,
                $or: [{ status: 'Active' }, { isActive: true }]
            }).sort({ name: 1 }).lean();
        }

        const mappedSections = (sections || []).map(sec => ({
            id: sec._id,
            name: sec.name,
            capacity: sec.capacity,
            isCurrent: context.academicSection && String(context.academicSection._id) === String(sec._id)
        }));

        return res.status(200).json({
            success: true,
            data: {
                sections: mappedSections
            }
        });
    } catch (err) {
        console.error('getAvailableSections error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 5. PUT /api/student/academics/section
 * Controlled section switching: strictly validates target section belongs to student's batch and branch.
 */
async function updateSection(req, res) {
    try {
        const student = req.student || req.user;
        const { sectionId } = req.body;

        if (!sectionId || !mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ success: false, error: 'Valid sectionId is required' });
        }

        const targetSection = await AcademicSection.findById(sectionId).lean();
        if (!targetSection) {
            return res.status(404).json({ success: false, error: 'Target academic section not found' });
        }

        const context = await resolveStudentAcademicContext(student, targetSection.semester);

        // Security / IDOR Verification: Full academic hierarchy validation
        if (targetSection.college && context.college && String(targetSection.college) !== String(context.college._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Section does not belong to your college'
            });
        }

        if (targetSection.program && context.program && String(targetSection.program) !== String(context.program._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Section does not belong to your program'
            });
        }

        if (String(targetSection.branch) !== String(context.branch?._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: You can only select a section within your assigned branch'
            });
        }

        if (String(targetSection.batch) !== String(context.batch?._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: You can only select a section within your academic batch cohort'
            });
        }

        if (context.isFuture) {
            return res.status(403).json({
                success: false,
                error: 'Cannot select a section in a future semester'
            });
        }

        // Update student account
        const updatedStudent = await StudentAccount.findByIdAndUpdate(student._id, {
            section: targetSection.name,
            academicSection: targetSection._id
        }, { new: true });

        // Invalidate cached expected schedule so next attendance query regenerates from the new section's timetable
        if (mongoose.connection.readyState === 1) {
            try {
                const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');
                await StudentExpectedSchedule.deleteOne({ student: student._id, semester: targetSection.semester });
            } catch (cacheErr) {
                // Non-fatal cache eviction failure
            }
        }

        return res.status(200).json({
            success: true,
            message: `Section successfully switched to ${targetSection.name}`,
            data: {
                student: updatedStudent,
                sectionId: targetSection._id,
                name: targetSection.name,
                sectionName: targetSection.name,
                semester: targetSection.semester
            }
        });
    } catch (err) {
        console.error('updateSection error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 6. GET /api/student/academics/timetable
 * Returns authoritative institutional timetable structure and published section timetable slots. Read-only.
 */
async function getTimetable(req, res) {
    try {
        const student = req.student || req.user;
        const semNum = req.query?.semester ? Number(req.query.semester) : (Number(student.semester) || 1);

        const context = await resolveStudentAcademicContext(student, semNum);

        if (context.isFuture) {
            return res.status(403).json({
                success: false,
                error: 'Cannot access timetable for future semesters'
            });
        }

        const studentLabBatch = (student.labBatch || '').toUpperCase();
        const allSlots = context.sectionTimetable?.slots || [];
        let filteredSlots = allSlots;

        if (studentLabBatch && allSlots.length > 0) {
            filteredSlots = allSlots.filter(slot => {
                const bg = (slot.batchGroup || 'ALL').toUpperCase();
                return bg === 'ALL' || bg === studentLabBatch;
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                isReadOnly: true,
                semester: semNum,
                isHistorical: context.officialSemester?.isHistorical ?? (semNum < context.currentSemester),
                hasPublishedTimetable: context.hasPublishedTimetable,
                message: context.hasPublishedTimetable 
                    ? 'Timetable loaded successfully' 
                    : `No timetable has been published yet for Section ${context.sectionName}.`,
                sectionName: context.sectionName || (context.academicSection ? context.academicSection.name : 'A'),
                section: context.academicSection ? {
                    id: context.academicSection._id,
                    name: context.academicSection.name
                } : null,
                studentLabBatch: studentLabBatch || null,
                timetableStructure: context.timetableStructure,
                structure: {
                    classDuration: context.timetableStructure.classDuration,
                    labDuration: context.timetableStructure.labDuration,
                    periods: context.timetableStructure.periods || [],
                    breaks: context.timetableStructure.breaks || [],
                    workingDays: context.timetableStructure.workingDays || []
                },
                slots: filteredSlots,
                allSlots: allSlots,
                timetable: context.sectionTimetable ? {
                    id: context.sectionTimetable._id,
                    status: context.sectionTimetable.status,
                    slots: filteredSlots
                } : null
            }
        });
    } catch (err) {
        console.error('getTimetable error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 7. GET /api/student/academics/subjects
 * Returns official Admin curriculum subjects plus the student's personal registrations.
 */
async function getSubjects(req, res) {
    try {
        const student = req.student || req.user;
        const semNum = req.query?.semester ? Number(req.query.semester) : (Number(student.semester) || 1);

        const context = await resolveStudentAcademicContext(student, semNum);

        if (context.isFuture) {
            return res.status(403).json({
                success: false,
                error: 'Cannot access subjects for future semesters'
            });
        }

        // 1. Fetch Common Branch
        const commonBranch = await Branch.findOne({
            $or: [{ shortName: { $in: ['COMMON', 'Common'] } }, { name: 'Common to All' }]
        }).lean();
        const allowedBranchIds = [context.branch?._id].filter(Boolean);
        if (commonBranch) allowedBranchIds.push(commonBranch._id);

        const studyYearVal = Math.max(1, Math.min(4, Math.ceil(semNum / 2)));
        const expectedYear = studyYearVal === 1 ? '1st Year' : (studyYearVal === 2 ? '2nd Year' : (studyYearVal === 3 ? '3rd Year' : '4th Year'));

        // 2. Query Authoritative Admin Curriculum
        const curriculumQuery = {
            status: 'Published'
        };

        if (semNum <= 2) {
            const branchCode = context.branch?.shortName || context.branch?.code || '';
            const uiBranchMap = {
                CIVIL: 'CV', CSE: 'CS', ISE: 'IS', AIML: 'CI',
                ECE: 'EC', EEE: 'EE', MECH: 'ME', BT: 'BT',
                IM: 'IM', CH: 'CH', ETC: 'ET', EIE: 'EI'
            };
            const uiBranch = uiBranchMap[String(branchCode).toUpperCase()] || branchCode;

            let cycle = req.query?.cycle;
            if (!cycle || !['P', 'C'].includes(String(cycle).toUpperCase())) {
                const secLetter = (context.sectionName || student.section || 'A').trim().toUpperCase();
                if (['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].includes(secLetter)) {
                    cycle = semNum === 2 ? 'P' : 'C';
                } else {
                    cycle = semNum === 2 ? 'C' : 'P';
                }
            }

            const curriculumCycleSubjects = await Subject.find({ branch: uiBranch, cycle: String(cycle).toUpperCase() }).lean();
            if (curriculumCycleSubjects && curriculumCycleSubjects.length > 0) {
                const codeMap = {
                    AMC1: 'MATH', AMS1: 'MATH', AMM1: 'MATH', AME1: 'MATH', AME2: 'MATH', AMC2: 'MATH', AMS2: 'MATH', AMM2: 'MATH',
                    APC: 'PHYS', APS: 'PHYS', APM: 'PHYS', APEC: 'PHYS',
                    ACC: 'CHEM', ACS: 'CHEM', ACM: 'CHEM', ACE: 'CHEM',
                    CAEDC: 'CAED', CAEDS: 'CAED', CAEDM: 'CAED', CAEDEE: 'CAED', CAEDEC: 'CAED',
                    SDCCV1: 'SDC1', SDCCS1: 'SDC1', SDCIS1: 'SDC1', SDCBT1: 'SDC1', SDCME1: 'SDC1', SDCIM1: 'SDC1', SDCCH1: 'SDC1', SDCEE1: 'SDC1', SDCEC1: 'SDC1', SDCEI1: 'SDC1'
                };
                const eligibleCodes = new Set();
                curriculumCycleSubjects.forEach(cs => {
                    const mapped = codeMap[cs.code] || cs.code;
                    eligibleCodes.add(mapped);
                    eligibleCodes.add(cs.code);
                });

                curriculumQuery.$or = [
                    { code: { $in: Array.from(eligibleCodes) } }
                ];
            } else {
                curriculumQuery.branch = { $in: allowedBranchIds };
                curriculumQuery.$or = [
                    { semester: semNum },
                    { semester: null, year: expectedYear }
                ];
            }
        } else {
            curriculumQuery.branch = { $in: allowedBranchIds };
            curriculumQuery.$or = [
                { semester: semNum },
                { semester: null, year: expectedYear }
            ];
        }

        if (student.scheme) {
            curriculumQuery.scheme = student.scheme;
        }

        let curriculumSubjects = await AcademicSubjectCms.find(curriculumQuery)
            .select('name code credits branch semester year status type')
            .sort({ name: 1 })
            .lean();

        // If scheme filter returned empty, fallback without scheme
        if (curriculumSubjects.length === 0 && curriculumQuery.scheme) {
            delete curriculumQuery.scheme;
            curriculumSubjects = await AcademicSubjectCms.find(curriculumQuery)
                .select('name code credits branch semester year status type')
                .sort({ name: 1 })
                .lean();
        }

        // 3. Query Student Personal Registered Subjects
        const registered = await StudentRegisteredSubject.find({
            student: student._id,
            semester: semNum,
            $or: [{ isActive: true }, { isActive: { $exists: false } }]
        })
        .populate('subject', 'name code credits branch semester year')
        .lean();

        return res.status(200).json({
            success: true,
            data: {
                semester: semNum,
                isReadOnlyBaseline: true,
                curriculum: curriculumSubjects,
                registered: registered,
                curriculumSubjects: curriculumSubjects,
                registeredSubjects: registered
            }
        });
    } catch (err) {
        console.error('getSubjects error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 8. POST /api/student/academics/subjects/register
 * Student personal subject registration: registers ONLY approved curriculum subjects.
 * Strictly blocks injection of custom curriculum subjects.
 */
async function saveRegisteredSubjects(req, res) {
    try {
        const student = req.student || req.user;
        const { semester, subjectIds } = req.body;

        const semNum = Number(semester);
        if (isNaN(semNum) || semNum < 1) {
            return res.status(400).json({ success: false, error: 'Valid semester number is required' });
        }

        const currentSemester = Number(student.semester) || 1;
        if (semNum > currentSemester) {
            return res.status(403).json({ success: false, error: 'Cannot register subjects for future semesters' });
        }

        if (!Array.isArray(subjectIds)) {
            return res.status(400).json({ success: false, error: 'subjectIds must be an array' });
        }

        // Validate that all subjectIds are existing Published curriculum subjects
        const verifiedSubjects = await AcademicSubjectCms.find({
            _id: { $in: subjectIds },
            status: 'Published'
        }).lean();

        if (verifiedSubjects.length !== subjectIds.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more selected subjects are not published curriculum subjects'
            });
        }

        // Delete existing registrations for this semester
        await StudentRegisteredSubject.deleteMany({
            student: student._id,
            semester: semNum
        });

        // Insert verified registrations
        const docs = verifiedSubjects.map(sub => ({
            student: student._id,
            subject: sub._id,
            semester: semNum,
            registeredCredits: sub.credits || 3,
            category: sub.type || 'Theory',
            isActive: true
        }));

        await StudentRegisteredSubject.insertMany(docs);

        return res.status(200).json({
            success: true,
            message: 'Registered subjects updated successfully',
            data: {
                registeredCount: docs.length,
                registered: docs,
                docs: docs
            }
        });
    } catch (err) {
        console.error('saveRegisteredSubjects error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 9. GET /api/student/academics/settings
 * Returns Admin Baseline (Read-Only) alongside Student Personal Settings.
 */
async function getSettings(req, res) {
    try {
        const student = req.student || req.user;
        const context = await resolveStudentAcademicContext(student);

        return res.status(200).json({
            success: true,
            data: {
                adminBaseline: {
                    isReadOnly: true,
                    collegeStartTime: '08:00 AM',
                    collegeEndTime: '04:00 PM',
                    classDuration: context.timetableStructure.classDuration,
                    labDuration: context.timetableStructure.labDuration,
                    breaks: context.timetableStructure.breaks || [],
                    workingDays: context.timetableStructure.workingDays || [],
                    semesterStartDate: context.officialSemester?.startDate || null,
                    semesterEndDate: context.officialSemester?.endDate || null,
                    collegeMinimumAttendance: context.collegeMinimumAttendance,
                    collegeAttendanceThreshold: context.collegeMinimumAttendance,
                    policyStatement: 'SIT Institutional Rule: Minimum 85% attendance required for semester exam eligibility.'
                },
                personalSettings: {
                    isEditable: true,
                    personalAttendanceTarget: context.personalAttendanceTarget
                }
            }
        });
    } catch (err) {
        console.error('getSettings error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 10. PUT /api/student/academics/settings
 * Updates ONLY student-owned personal settings (personalAttendanceTarget).
 * Rejects or ignores any attempt to modify Admin baseline settings.
 */
async function updatePersonalSettings(req, res) {
    try {
        const student = req.student || req.user;
        const { personalAttendanceTarget } = req.body;

        if (personalAttendanceTarget === undefined || personalAttendanceTarget === null) {
            return res.status(400).json({ success: false, error: 'personalAttendanceTarget is required' });
        }

        const targetNum = Number(personalAttendanceTarget);
        if (isNaN(targetNum) || targetNum < 85 || targetNum > 100) {
            return res.status(400).json({
                success: false,
                error: 'Personal attendance target must be between the college minimum (85%) and 100%'
            });
        }

        // Upsert personal configuration
        const currentSemester = Number(student.semester) || 1;
        await StudentTimetableConfiguration.findOneAndUpdate(
            { student: student._id, semester: currentSemester },
            { personalAttendanceTarget: targetNum },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Personal attendance target updated successfully',
            data: {
                personalAttendanceTarget: targetNum,
                collegeMinimum: 85,
                collegeMinimumAttendance: 85
            }
        });
    } catch (err) {
        console.error('updatePersonalSettings error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 11. GET /api/student/academics/calendar
 * Returns official holidays and events applicable to student's college and semester.
 * Canonical Source of Truth: CollegeEvent (collection: 'college_events')
 */
async function getCalendar(req, res) {
    try {
        const student = req.student || req.user;
        const semNum = req.query.semester ? Number(req.query.semester) : (Number(student.semester) || 1);

        const currentSemester = Number(student.semester) || 1;
        if (semNum > currentSemester) {
            return res.status(403).json({ success: false, error: 'Cannot access calendar for future semesters' });
        }

        const context = await resolveStudentAcademicContext(student, semNum);

        const semStart = context.officialSemester?.startDate ? new Date(context.officialSemester.startDate) : null;
        const semEnd = context.officialSemester?.endDate ? new Date(context.officialSemester.endDate) : null;

        // Canonical filter on CollegeEvent:
        // Only Government / College Holidays can be GLOBAL.
        // Other events are SEMESTER scoped.
        const filter = {
            status: { $ne: 'ARCHIVED' },
            $or: [
                {
                    scope: 'GLOBAL',
                    eventType: 'Holiday / Closure'
                },
                ...(context.officialSemester ? [{
                    scope: 'SEMESTER',
                    academicSemesterId: context.officialSemester._id
                }] : [])
            ]
        };

        if (context.college) {
            filter.college = context.college._id;
        }

        if (req.query.startDate && req.query.endDate) {
            filter.startDate = { $lte: new Date(req.query.endDate) };
            filter.endDate = { $gte: new Date(req.query.startDate) };
        } else if (semStart && semEnd) {
            filter.startDate = { $lte: semEnd };
            filter.endDate = { $gte: semStart };
        }

        const events = await CollegeEvent.find(filter)
            .sort({ startDate: 1, startTime: 1 })
            .lean();

        // Map items for uniform consumer compatibility
        const calendarItems = (events || []).map(e => ({
            _id: e._id,
            title: e.title,
            description: e.description || '',
            eventType: e.eventType,
            type: e.eventType === 'Holiday / Closure' ? 'HOLIDAY' : (e.eventType === 'Exam' ? 'EXAM' : 'EVENT'),
            kind: e.eventType === 'Holiday / Closure' ? 'HOLIDAY' : 'EVENT',
            scope: e.scope,
            academicSemesterId: e.academicSemesterId,
            startDate: e.startDate,
            endDate: e.endDate,
            allDay: e.allDay,
            isAllDay: e.allDay,
            startTime: e.startTime,
            endTime: e.endTime,
            status: e.status
        }));

        return res.status(200).json({
            success: true,
            data: calendarItems,
            officialSemester: context.officialSemester ? {
                id: context.officialSemester._id,
                number: context.officialSemester.number,
                startDate: context.officialSemester.startDate,
                endDate: context.officialSemester.endDate,
                label: context.officialSemester.label,
                status: context.officialSemester.status
            } : null
        });
    } catch (err) {
        console.error('getCalendar error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 12. POST /api/student/academics/placement/confirm
 * Student confirms Section and Lab Batch allocation. Locks upon submission.
 */
async function confirmPlacement(req, res) {
    try {
        const student = req.student || req.user;
        const { sectionId, labBatch } = req.body;

        if (student.sectionLocked && student.labBatchLocked) {
            return res.status(400).json({
                success: false,
                error: 'Your section and lab batch are locked. Submit a section change request to request a transfer.'
            });
        }

        if (!sectionId || !mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ success: false, error: 'Valid sectionId is required' });
        }

        const validLabBatches = ['B1', 'B2'];
        const normalizedLabBatch = labBatch ? String(labBatch).toUpperCase() : null;
        if (!normalizedLabBatch || !validLabBatches.includes(normalizedLabBatch)) {
            return res.status(400).json({ success: false, error: 'Lab Batch must be either B1 or B2' });
        }

        const targetSection = await AcademicSection.findById(sectionId).lean();
        if (!targetSection) {
            return res.status(404).json({ success: false, error: 'Target academic section not found' });
        }

        const context = await resolveStudentAcademicContext(student, targetSection.semester);

        // Security / Hierarchy Validation
        if (targetSection.college && context.college && String(targetSection.college) !== String(context.college._id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Section does not belong to your college' });
        }
        if (targetSection.program && context.program && String(targetSection.program) !== String(context.program._id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Section does not belong to your program' });
        }
        if (String(targetSection.branch) !== String(context.branch?._id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Section must belong to your assigned branch' });
        }
        if (String(targetSection.batch) !== String(context.batch?._id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Section must belong to your academic batch' });
        }
        if (context.isFuture) {
            return res.status(403).json({ success: false, error: 'Cannot select a section in a future semester' });
        }

        const effectiveDate = new Date();
        let semId = context.officialSemester?._id || targetSection.academicSemester || student.academicSemester;
        if (!semId && context.batch?._id) {
            const Semester = require('../models/Semester');
            const semDoc = await Semester.findOne({ batch: context.batch._id, number: targetSection.semester }).lean();
            if (semDoc) semId = semDoc._id;
        }

        // Supersede any active placement
        if (semId) {
            await AcademicPlacement.updateMany(
                { student: student._id, officialSemester: semId, status: 'ACTIVE' },
                { status: 'SUPERSEDED', effectiveTo: effectiveDate }
            );

            // Create new active AcademicPlacement
            await AcademicPlacement.create({
                student: student._id,
                college: context.college?._id || student.college,
                program: context.program?._id || student.program,
                batch: context.batch?._id || student.batch,
                branch: context.branch?._id || student.branch,
                officialSemester: semId,
                semesterNumber: targetSection.semester || context.currentSemester || 1,
                section: targetSection._id,
                labBatch: normalizedLabBatch,
                effectiveFrom: effectiveDate,
                status: 'ACTIVE',
                placementType: 'STUDENT_CONFIRMED'
            });
        }

        // Update StudentAccount
        const studentDoc = await StudentAccount.findById(student._id);
        studentDoc.academicSection = targetSection._id;
        studentDoc.section = targetSection.name;
        if (semId) {
            studentDoc.academicSemester = semId;
        }
        studentDoc.sectionLocked = true;
        studentDoc.labBatch = normalizedLabBatch;
        studentDoc.labBatchLocked = true;

        const { score, isComplete } = calculateAcademicProfileCompletion(studentDoc, context);
        studentDoc.academicProfileCompletion = score;
        studentDoc.academicProfileComplete = isComplete;

        await studentDoc.save();

        const populatedStudent = await StudentAccount.findById(student._id)
            .populate('branch')
            .populate('scheme')
            .populate('academicSection')
            .populate('academicSemester')
            .lean();

        const User = require('../models/User');
        await User.findByIdAndUpdate(student._id, {
            section: targetSection.name,
            academicSection: targetSection._id,
            sectionLocked: true,
            labBatch: normalizedLabBatch,
            labBatchLocked: true
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Placement confirmed for Section ${targetSection.name}, Lab Batch ${normalizedLabBatch}`,
            data: {
                student: populatedStudent,
                section: {
                    id: targetSection._id,
                    name: targetSection.name
                },
                labBatch: normalizedLabBatch,
                sectionLocked: true,
                labBatchLocked: true,
                academicProfileCompletion: score,
                academicProfileComplete: isComplete
            }
        });
    } catch (err) {
        console.error('confirmPlacement error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 13. POST /api/student/academics/section-change-request
 * Submits a section change request for administrative approval.
 */
async function requestSectionChange(req, res) {
    try {
        const student = req.student || req.user;
        const { requestedSectionId, requestedLabBatch, reason } = req.body;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a detailed reason (at least 10 characters) for requesting a section transfer.'
            });
        }

        if (!requestedSectionId || !mongoose.Types.ObjectId.isValid(requestedSectionId)) {
            return res.status(400).json({ success: false, error: 'Valid requestedSectionId is required' });
        }

        const existingPending = await SectionChangeRequest.findOne({
            student: student._id,
            status: 'PENDING'
        });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                error: 'You already have a section change request pending administrative review.'
            });
        }

        const targetSection = await AcademicSection.findById(requestedSectionId).lean();
        if (!targetSection) {
            return res.status(404).json({ success: false, error: 'Target academic section not found' });
        }

        const context = await resolveStudentAcademicContext(student, targetSection.semester);

        if (String(targetSection.branch) !== String(context.branch?._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Requested section must belong to your assigned branch'
            });
        }

        if (String(targetSection.batch) !== String(context.batch?._id)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Requested section must belong to your academic batch'
            });
        }

        if (context.academicSection && String(context.academicSection._id) === String(targetSection._id)) {
            return res.status(400).json({
                success: false,
                error: 'Requested section is already your current assigned section.'
            });
        }

        let semId = context.officialSemester?._id || targetSection.academicSemester || student.academicSemester;
        if (!semId && context.batch?._id) {
            const Semester = require('../models/Semester');
            const semDoc = await Semester.findOne({ batch: context.batch._id, number: targetSection.semester }).lean();
            if (semDoc) semId = semDoc._id;
        }

        const changeReq = await SectionChangeRequest.create({
            student: student._id,
            college: context.college?._id || student.college,
            program: context.program?._id || student.program,
            batch: context.batch?._id || student.batch,
            branch: context.branch?._id || student.branch,
            officialSemester: semId,
            semesterNumber: targetSection.semester || context.currentSemester || 1,
            currentSection: context.academicSection?._id || student.academicSection,
            requestedSection: targetSection._id,
            currentLabBatch: student.labBatch || null,
            requestedLabBatch: requestedLabBatch ? String(requestedLabBatch).toUpperCase() : (student.labBatch || 'B1'),
            reason: reason.trim(),
            status: 'PENDING'
        });

        return res.status(201).json({
            success: true,
            message: 'Section change request submitted successfully for administrative review',
            data: changeReq
        });
    } catch (err) {
        console.error('requestSectionChange error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 14. GET /api/student/academics/section-change-request
 * Retrieves student's section change request history.
 */
async function getStudentSectionChangeRequests(req, res) {
    try {
        const student = req.student || req.user;
        const requests = await SectionChangeRequest.find({ student: student._id })
            .populate('currentSection', 'name')
            .populate('requestedSection', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (err) {
        console.error('getStudentSectionChangeRequests error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * 15. GET /api/student/academics/roadmap
 * Returns academic timeline, semester progress, upcoming events, and blog/explainer content.
 * Canonical Source of Truth: CollegeEvent (models/CollegeEvent.js)
 */
async function getRoadmap(req, res) {
    try {
        const student = req.student || req.user;
        const requestedSem = req.query.semester;

        // 1. Resolve student's baseline academic context
        const currentSemNum = Number(student.semester) || 1;
        let semNum = requestedSem ? Number(requestedSem) : currentSemNum;
        if (isNaN(semNum) || semNum < 1) {
            semNum = currentSemNum;
        }

        const context = await resolveStudentAcademicContext(student, semNum);
        const collegeId = context.college?._id || student.college;

        // 2. Discover available semesters that have configured events
        const Semester = require('../models/Semester');
        const semQuery = {};
        if (collegeId) semQuery.college = collegeId;
        if (context.batch?._id) semQuery.batch = context.batch._id;
        if (context.program?._id) semQuery.program = context.program._id;

        const allSemesters = await Semester.find(semQuery).sort({ number: 1 }).lean();

        // Get event counts per semester
        const eventCounts = await CollegeEvent.aggregate([
            {
                $match: {
                    status: 'ACTIVE',
                    scope: 'SEMESTER',
                    academicSemesterId: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$academicSemesterId',
                    count: { $sum: 1 }
                }
            }
        ]);

        const eventCountMap = new Map(eventCounts.map(c => [String(c._id), c.count]));

        // Filter semesters that have configured roadmap events, or student's current semester
        const availableSemesters = allSemesters
            .filter(s => (eventCountMap.get(String(s._id)) || 0) > 0 || s.number === currentSemNum)
            .map(s => ({
                id: s._id,
                number: s.number,
                label: s.label || `Semester ${s.number}`,
                academicYear: context.batch?.academicYear || '2026-27',
                startDate: s.startDate,
                endDate: s.endDate,
                isCurrent: s.number === currentSemNum,
                eventsCount: eventCountMap.get(String(s._id)) || 0
            }));

        // 3. Resolve active official semester
        let officialSem = context.officialSemester;
        if (!officialSem && allSemesters.length > 0) {
            officialSem = allSemesters.find(s => s.number === semNum) || allSemesters[0];
        }

        // 4. Query events for this semester
        const eventFilter = {
            status: 'ACTIVE',
            $or: []
        };

        if (officialSem) {
            eventFilter.$or.push({
                scope: 'SEMESTER',
                academicSemesterId: officialSem._id
            });
        }

        // Include global holidays within semester dates if available
        if (officialSem?.startDate && officialSem?.endDate) {
            eventFilter.$or.push({
                scope: 'GLOBAL',
                eventType: { $in: ['Holiday / Closure', 'HOLIDAY'] },
                startDate: { $lte: new Date(officialSem.endDate) },
                endDate: { $gte: new Date(officialSem.startDate) }
            });
        }

        if (collegeId) {
            eventFilter.college = collegeId;
        }

        let rawEvents = [];
        if (eventFilter.$or.length > 0) {
            rawEvents = await CollegeEvent.find(eventFilter)
                .sort({ startDate: 1, order: 1, createdAt: 1 })
                .lean();
        }

        // 5. Calculate status and days left
        const now = new Date();
        const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        const processedEvents = rawEvents.map(e => {
            const start = new Date(e.startDate);
            const end = e.endDate ? new Date(e.endDate) : start;

            const startUtc = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
            const endUtc = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

            let status = 'UPCOMING';
            if (todayUtc > endUtc) {
                status = 'COMPLETED';
            } else if (todayUtc >= startUtc && todayUtc <= endUtc) {
                status = 'ONGOING';
            } else {
                status = 'UPCOMING';
            }

            const daysLeft = Math.ceil((startUtc.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24));

            return {
                id: e._id,
                title: e.title,
                eventType: e.eventType,
                scope: e.scope,
                startDate: e.startDate,
                endDate: e.endDate,
                allDay: e.allDay,
                shortDescription: e.shortDescription || e.description || '',
                description: e.description || '',
                content: {
                    overview: e.content?.overview || '',
                    whatHappens: e.content?.whatHappens || '',
                    whatToDo: e.content?.whatToDo || '',
                    preparationTips: e.content?.preparationTips || '',
                    importantNotes: e.content?.importantNotes || ''
                },
                resources: Array.isArray(e.resources) ? e.resources : [],
                priority: e.priority || 'Normal',
                order: e.order || 0,
                status,
                daysLeft: daysLeft >= 0 ? daysLeft : 0
            };
        });

        // 6. Calculate Semester Progress
        const progress = {
            percentage: null,
            startDate: officialSem?.startDate || null,
            endDate: officialSem?.endDate || null,
            status: 'UNKNOWN'
        };

        if (officialSem?.startDate && officialSem?.endDate) {
            const semStart = new Date(officialSem.startDate);
            const semEnd = new Date(officialSem.endDate);

            if (semStart.getTime() === semEnd.getTime()) {
                progress.percentage = now >= semStart ? 100 : 0;
            } else if (now < semStart) {
                progress.percentage = 0;
                progress.status = 'NOT_STARTED';
            } else if (now > semEnd) {
                progress.percentage = 100;
                progress.status = 'COMPLETED';
            } else {
                const total = semEnd.getTime() - semStart.getTime();
                const elapsed = now.getTime() - semStart.getTime();
                progress.percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                progress.status = 'IN_PROGRESS';
            }
        }

        // 7. Calculate "Up Next"
        const nextEvent = processedEvents.find(e => e.status === 'ONGOING' || e.status === 'UPCOMING') || null;
        const upNext = nextEvent ? {
            id: nextEvent.id,
            title: nextEvent.title,
            eventType: nextEvent.eventType,
            date: nextEvent.startDate,
            daysLeft: nextEvent.daysLeft,
            status: nextEvent.status,
            shortDescription: nextEvent.shortDescription
        } : null;

        return res.status(200).json({
            success: true,
            data: {
                selectedSemester: {
                    id: officialSem?._id || null,
                    number: semNum,
                    label: officialSem?.label || `Semester ${semNum}`,
                    academicYear: context.batch?.academicYear || '2026-27',
                    startDate: officialSem?.startDate || null,
                    endDate: officialSem?.endDate || null
                },
                progress,
                upNext,
                events: processedEvents,
                availableSemesters
            }
        });
    } catch (err) {
        console.error('getRoadmap error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    getOverview,
    getSemesters,
    getSemesterDetail,
    getAvailableSections,
    updateSection,
    getTimetable,
    getSubjects,
    saveRegisteredSubjects,
    getSettings,
    updatePersonalSettings,
    getCalendar,
    getRoadmap,
    confirmPlacement,
    requestSectionChange,
    getStudentSectionChangeRequests
};
