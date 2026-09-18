const mongoose = require('mongoose');
const { resolveStudentAcademicContext } = require('./studentAcademicResolver');
const { resolveFirstYearSubjectDetails } = require('./firstYearCurriculum');
const AcademicSubjectCms = require('../models/AcademicSubject');
const Subject = require('../models/Subject');

// High-performance in-memory TTL cache for allocated subjects
const RESOLVER_CACHE = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function clearResolverCache() {
    RESOLVER_CACHE.clear();
}

/**
 * Authoritatively resolves a student's allocated subjects from their current SectionTimetable.
 * 
 * Invariant Chain:
 * Student -> Batch -> Official Semester -> Branch -> Section -> SectionTimetable -> unique subjects -> AcademicSubjectCms/Subject
 * 
 * Rules:
 * - Read-only projection from SectionTimetable
 * - Deduplicated by subject ID (a subject appearing multiple times appears ONCE)
 * - Theory + Lab remains one subject
 * - Multi-period lab sessions (2 periods) count as 1 lab session
 * - No manual student registration dependency
 */
async function resolveStudentSubjects(student, requestedSemester = null) {
    if (!student) {
        throw new Error('Student record is required to resolve allocated subjects');
    }

    const studentIdStr = student._id ? student._id.toString() : 'anon';
    const effectiveSem = requestedSemester ? Number(requestedSemester) : (student.semester || 1);
    const secKey = (student.section || '').trim().toUpperCase();
    const labKey = (student.labBatch || '').trim().toUpperCase();
    const branchKey = (student.branch?.code || student.branch || '').toString();
    const cacheKey = `${studentIdStr}_sem${effectiveSem}_sec${secKey}_lab${labKey}_br${branchKey}`;

    const isTestEnv = Boolean(process.env.NODE_TEST_CONTEXT) || process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('test')) || process.execArgv.some(a => a.includes('test'));
    if (!isTestEnv) {
        const cachedEntry = RESOLVER_CACHE.get(cacheKey);
        if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
            return cachedEntry.data;
        }
    }

    // 1. Resolve student canonical academic context
    const academicContext = await resolveStudentAcademicContext(student, requestedSemester);
    const sectionTimetable = academicContext.sectionTimetable;

    const baseResult = {
        semester: academicContext.activeSemesterNumber || student.semester || 1,
        officialSemester: academicContext.officialSemester,
        academicSection: academicContext.academicSection,
        sectionName: academicContext.sectionName,
        branch: academicContext.branch,
        batch: academicContext.batch,
        hasTimetable: !!(sectionTimetable && sectionTimetable.slots?.length > 0),
        totalSubjects: 0,
        subjects: []
    };

    // Strict Semester & Future Isolation:
    // Future semesters or mismatched semester section cannot inherit current semester timetable
    if (academicContext.isFuture || (academicContext.academicSection && academicContext.academicSection.semester !== academicContext.activeSemesterNumber)) {
        return {
            ...baseResult,
            isFuture: academicContext.isFuture,
            hasTimetable: false,
            totalSubjects: 0,
            subjects: []
        };
    }

    if (!sectionTimetable || !sectionTimetable.slots || sectionTimetable.slots.length === 0) {
        return baseResult;
    }

    const rawSlots = sectionTimetable.slots || [];
    const studentLabBatch = (student.labBatch || '').trim().toUpperCase();

    // 2. Filter slots for student's assigned lab batch if configured
    const relevantSlots = rawSlots.filter(slot => {
        const bg = (slot.batchGroup || 'ALL').trim().toUpperCase();
        if (!studentLabBatch) return true;
        return bg === 'ALL' || bg === studentLabBatch;
    });

    // 3. Group slots by unique subject ID
    const subjectSlotMap = new Map();
    for (const slot of relevantSlots) {
        if (!slot.subject) continue;
        const subjId = (slot.subject._id || slot.subject).toString();

        if (!subjectSlotMap.has(subjId)) {
            subjectSlotMap.set(subjId, {
                subjectRef: slot.subject,
                theorySlots: [],
                labSlots: [],
                labSessionGroups: new Set(),
                facultySet: new Set(),
                rooms: new Set(),
                totalSlotCount: 0
            });
        }

        const item = subjectSlotMap.get(subjId);
        item.totalSlotCount++;

        const isLab = slot.lectureType === 'Lab';
        if (isLab) {
            item.labSlots.push(slot);
            // Deduplicate 2-period lab blocks sharing sessionGroupId or day+time
            const groupId = slot.sessionGroupId || `day-${slot.dayOfWeek}-period-${slot.periodNumber}`;
            item.labSessionGroups.add(groupId);
        } else {
            item.theorySlots.push(slot);
        }

        if (slot.faculty) {
            const facName = slot.faculty.name || (typeof slot.faculty === 'string' ? slot.faculty : null);
            if (facName && facName.trim()) {
                item.facultySet.add(facName.trim());
            }
        }

        if (slot.room && slot.room.trim()) {
            item.rooms.add(slot.room.trim());
        }
    }

    if (subjectSlotMap.size === 0) {
        return baseResult;
    }

    // 4. Fetch full subject details from AcademicSubjectCms and Subject catalogs
    const subjectIds = Array.from(subjectSlotMap.keys()).map(id => {
        try {
            return new mongoose.Types.ObjectId(id);
        } catch (e) {
            return id;
        }
    });

    const cmsSubjectDocs = await AcademicSubjectCms.find({ _id: { $in: subjectIds } }).lean();
    const cmsMap = new Map();
    for (const doc of cmsSubjectDocs) {
        cmsMap.set(doc._id.toString(), doc);
    }

    // Also look up corresponding catalog Subjects for rich modules & syllabi (projected to prevent heavy PDF arrays)
    const subjectCodes = cmsSubjectDocs.map(s => s.code).filter(Boolean);
    const catalogSubjects = await Subject.find({ code: { $in: subjectCodes } })
        .select('code name credits modules.moduleNumber modules.title modules.slug')
        .lean();
    const catalogMap = new Map();
    for (const catSubj of catalogSubjects) {
        catalogMap.set((catSubj.code || '').toUpperCase(), catSubj);
    }

    // 5. Build normalized, deduplicated My Subjects list
    const normalizedSubjects = [];
    const studentBranchCode = student.branch?.code || academicContext.branch?.code || student.branch || 'CS';
    const semesterNum = academicContext.activeSemesterNumber || student.semester || 1;

    for (const [subjIdStr, slotData] of subjectSlotMap.entries()) {
        const cmsDoc = cmsMap.get(subjIdStr) || (typeof slotData.subjectRef === 'object' ? slotData.subjectRef : null) || {};
        let code = (cmsDoc.code || '').trim().toUpperCase();
        let name = cmsDoc.name || (typeof slotData.subjectRef === 'object' ? slotData.subjectRef?.name : null) || code || 'Untitled Subject';

        // Authoritatively resolve branch-specific stream code (AMS1, APS, ACS, etc.) and module names for first year
        const firstYearMeta = resolveFirstYearSubjectDetails(code, name, studentBranchCode, semesterNum);
        const branchCode = firstYearMeta?.code || code;
        const branchName = firstYearMeta?.name || name;

        const catalogDoc = catalogMap.get(branchCode) || catalogMap.get(code) || catalogMap.get((cmsDoc.code || '').toUpperCase());

        const theoryCount = slotData.theorySlots.length;
        const labSessionsCount = slotData.labSessionGroups.size;

        // Determine delivery type
        const catLower = (cmsDoc.category || '').toLowerCase();
        const evalType = cmsDoc.evaluationType || '';

        let type = 'Theory';
        if (catLower.includes('theory + lab') || evalType === 'IPCC' || (theoryCount > 0 && labSessionsCount > 0)) {
            type = 'Theory + Lab';
        } else if (catLower.includes('lab') || evalType === 'LAB_ONLY' || (theoryCount === 0 && labSessionsCount > 0)) {
            type = 'Lab';
        }

        // Faculty string
        const facultyList = Array.from(slotData.facultySet);
        const facultyDisplay = facultyList.length > 0 ? facultyList.join(', ') : 'TBA';

        // Room string
        const roomList = Array.from(slotData.rooms);
        const roomDisplay = roomList.length > 0 ? roomList.join(', ') : 'TBA';

        // Lab session information
        const periodsPerSession = (type === 'Lab' || type === 'Theory + Lab') && slotData.labSlots.length > 0 && labSessionsCount > 0
            ? Math.round(slotData.labSlots.length / labSessionsCount)
            : 0;

        // Modules: Prioritize branch-specific module titles from first-year authority, catalog, or standard 5
        let modules = [];
        if (firstYearMeta?.modules && firstYearMeta.modules.length > 0) {
            modules = firstYearMeta.modules;
        } else if (catalogDoc && Array.isArray(catalogDoc.modules) && catalogDoc.modules.length > 0) {
            modules = catalogDoc.modules.map(m => ({
                id: `module-${m.moduleNumber}`,
                slug: `module-${m.moduleNumber}`,
                moduleNumber: m.moduleNumber,
                title: m.title || `Module ${m.moduleNumber}`,
                name: m.title || `Module ${m.moduleNumber}`,
                description: m.description || ''
            }));
        } else {
            modules = [1, 2, 3, 4, 5].map(num => ({
                id: `module-${num}`,
                slug: `module-${num}`,
                moduleNumber: num,
                title: `Module ${num}`,
                name: `Module ${num}`,
                description: `Syllabus and study materials for Module ${num}`
            }));
        }

        const subjectSlug = (branchName || name || branchCode || code || subjIdStr)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        normalizedSubjects.push({
            _id: subjIdStr,
            id: subjIdStr,
            slug: subjectSlug,
            code: code || 'TBA',
            branchCode: branchCode || code || 'TBA',
            displayCode: branchCode || code || 'TBA',
            name: branchName || name || 'Untitled Subject',
            displayName: branchName || name || 'Untitled Subject',
            rawName: name,
            credits: Number.isInteger(cmsDoc.credits) ? cmsDoc.credits : (catalogDoc?.credits ?? 4),
            category: cmsDoc.category || (type === 'Lab' ? 'Lab Only' : (type === 'Theory + Lab' ? 'Theory + Lab' : 'Theory')),
            type,
            evaluationType: evalType || null,
            theoryClassesPerWeek: theoryCount,
            labSessionsPerWeek: labSessionsCount,
            periodsPerLabSession: periodsPerSession || (labSessionsCount > 0 ? 2 : 0),
            classesPerWeek: type === 'Theory' 
                ? theoryCount 
                : (type === 'Lab' ? labSessionsCount : (theoryCount + labSessionsCount)),
            classesPerWeekLabel: type === 'Theory'
                ? `${theoryCount} classes / week`
                : (type === 'Lab' 
                    ? `${labSessionsCount} session${labSessionsCount > 1 ? 's' : ''} / week (${periodsPerSession || 2} periods / session)`
                    : `${theoryCount} theory + ${labSessionsCount} lab / week`),
            faculty: facultyDisplay,
            room: roomDisplay,
            totalWeeklySlots: slotData.totalSlotCount,
            modules
        });
    }

    // Sort alphabetically by subject code or name
    normalizedSubjects.sort((a, b) => (a.branchCode || a.code || a.name).localeCompare(b.branchCode || b.code || b.name));

    const finalResult = {
        ...baseResult,
        totalSubjects: normalizedSubjects.length,
        subjects: normalizedSubjects
    };

    if (!isTestEnv) {
        RESOLVER_CACHE.set(cacheKey, { data: finalResult, timestamp: Date.now() });
    }

    return finalResult;
}

/**
 * Authoritatively resolves curriculum subjects for a student based strictly on:
 * Branch + Semester + Scheme
 * Completely decoupled from Section and SectionTimetable.
 */
async function resolveStudentCurriculumSubjects(student, requestedSemester = null) {
    if (!student) return [];

    const effectiveSem = requestedSemester ? Number(requestedSemester) : (student.semester || 1);
    const studyYearVal = Math.max(1, Math.min(4, Math.ceil(effectiveSem / 2)));
    const expectedYear = studyYearVal === 1 ? '1st Year' : (studyYearVal === 2 ? '2nd Year' : (studyYearVal === 3 ? '3rd Year' : '4th Year'));

    const Branch = require('../models/Branch');

    // Resolve student branch ID
    let branchId = null;
    let branchCode = '';
    if (student.branch) {
        if (mongoose.Types.ObjectId.isValid(student.branch)) {
            branchId = student.branch;
        } else if (typeof student.branch === 'object' && student.branch._id) {
            branchId = student.branch._id;
            branchCode = student.branch.shortName || student.branch.code || '';
        } else if (typeof student.branch === 'string') {
            const bDoc = await Branch.findOne({ 
                $or: [
                    { code: student.branch.toUpperCase() }, 
                    { shortName: student.branch.toUpperCase() },
                    { name: new RegExp('^' + student.branch + '$', 'i') }
                ] 
            }).lean();
            if (bDoc) {
                branchId = bDoc._id;
                branchCode = bDoc.shortName || bDoc.code || '';
            } else {
                branchCode = student.branch;
            }
        }
    }

    if (branchId && !branchCode) {
        const bDoc = await Branch.findById(branchId).lean();
        if (bDoc) branchCode = bDoc.shortName || bDoc.code || '';
    }

    // Common branch fallback
    const commonBranch = await Branch.findOne({
        $or: [{ shortName: { $in: ['COMMON', 'Common'] } }, { name: 'Common to All' }]
    }).lean();

    const allowedBranchIds = [branchId].filter(Boolean);
    if (commonBranch) allowedBranchIds.push(commonBranch._id);

    const curriculumQuery = {
        status: 'Published'
    };

    if (effectiveSem <= 2) {
        const uiBranchMap = {
            CIVIL: 'CV', CSE: 'CS', ISE: 'IS', AIML: 'CI',
            ECE: 'EC', EEE: 'EE', MECH: 'ME', BT: 'BT',
            IM: 'IM', CH: 'CH', ETC: 'ET', EIE: 'EI'
        };
        const uiBranch = uiBranchMap[String(branchCode).toUpperCase()] || branchCode || 'CS';

        let cycle = (effectiveSem === 2 ? 'P' : 'C');
        const secLetter = (student.section || 'A').trim().toUpperCase();
        if (['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].includes(secLetter)) {
            cycle = effectiveSem === 2 ? 'P' : 'C';
        } else {
            cycle = effectiveSem === 2 ? 'C' : 'P';
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
            curriculumQuery.$or = [{ code: { $in: Array.from(eligibleCodes) } }];
        } else {
            if (allowedBranchIds.length > 0) curriculumQuery.branch = { $in: allowedBranchIds };
            curriculumQuery.$or = [
                { semester: effectiveSem },
                { semester: null, year: expectedYear }
            ];
        }
    } else {
        if (allowedBranchIds.length > 0) curriculumQuery.branch = { $in: allowedBranchIds };
        curriculumQuery.$or = [
            { semester: effectiveSem },
            { semester: null, year: expectedYear }
        ];
    }

    if (student.scheme) {
        curriculumQuery.scheme = student.scheme;
    }

    let docs = await AcademicSubjectCms.find(curriculumQuery).sort({ name: 1 }).lean();

    if (docs.length === 0 && curriculumQuery.scheme) {
        delete curriculumQuery.scheme;
        docs = await AcademicSubjectCms.find(curriculumQuery).sort({ name: 1 }).lean();
    }

    if (docs.length === 0 && allowedBranchIds.length > 0) {
        docs = await AcademicSubjectCms.find({
            branch: { $in: allowedBranchIds },
            year: expectedYear,
            status: 'Published'
        }).sort({ name: 1 }).lean();
    }

    return docs.map(doc => {
        const catLower = (doc.category || '').toLowerCase();
        let type = 'Theory';
        if (catLower.includes('theory + lab') || doc.evaluationType === 'IPCC') {
            type = 'Theory + Lab';
        } else if (catLower.includes('lab') || doc.evaluationType === 'LAB_ONLY') {
            type = 'Lab';
        }

        const subjIdStr = doc._id.toString();
        const subjectSlug = (doc.slug || doc.code || subjIdStr)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        return {
            _id: subjIdStr,
            id: subjIdStr,
            slug: subjectSlug,
            code: doc.code || 'TBA',
            branchCode: doc.code || 'TBA',
            displayCode: doc.code || 'TBA',
            name: doc.name || 'Untitled Subject',
            displayName: doc.name || 'Untitled Subject',
            credits: Number.isInteger(doc.credits) ? doc.credits : 4,
            category: doc.category || type,
            type,
            evaluationType: doc.evaluationType || null,
            theoryClassesPerWeek: doc.defaultTheoryClasses || (type === 'Lab' ? 0 : 4),
            labSessionsPerWeek: doc.defaultLabSessions || (type === 'Theory' ? 0 : 1),
            classesPerWeek: (doc.defaultTheoryClasses || 4) + (doc.defaultLabSessions || 0),
            faculty: 'TBA',
            room: 'TBA',
            modules: [1, 2, 3, 4, 5].map(num => ({
                id: `module-${num}`,
                slug: `module-${num}`,
                moduleNumber: num,
                title: `Module ${num}`,
                name: `Module ${num}`,
                description: `Syllabus and study materials for Module ${num}`
            }))
        };
    });
}

/**
 * Returns the subjects applicable to the student for the selected semester:
 * 1. Uses student-specific registration (StudentRegisteredSubject) when available (preserving electives/overrides).
 * 2. Seamlessly falls back to authoritative curriculum (AcademicSubjectCms) when registration has not yet been created.
 */
async function resolveApplicableStudentSubjects(student, requestedSemester = null) {
    if (!student) return { semester: 1, isFromRegistration: false, subjects: [] };

    const studentId = student._id || student.id;
    const effectiveSem = requestedSemester ? Number(requestedSemester) : (student.semester || 1);

    const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');

    const registered = await StudentRegisteredSubject.find({
        student: studentId,
        $and: [
            { $or: [{ semester: effectiveSem }, { semester: { $exists: false } }] },
            { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
        ]
    }).populate('subject').lean();

    const validRegistered = (registered || []).filter(r => r.subject);

    if (validRegistered.length > 0) {
        const mapped = validRegistered.map(reg => {
            const subj = reg.subject || {};
            const subjIdStr = (subj._id || reg._id).toString();
            const catLower = (reg.category || subj.category || '').toLowerCase();
            let type = 'Theory';
            if (catLower.includes('theory + lab') || subj.evaluationType === 'IPCC') {
                type = 'Theory + Lab';
            } else if (catLower.includes('lab') || subj.evaluationType === 'LAB_ONLY') {
                type = 'Lab';
            }

            return {
                _id: subjIdStr,
                id: subjIdStr,
                registeredSubjectId: reg._id,
                slug: subj.slug || (subj.code || 'subj').toLowerCase(),
                code: reg.customCode || subj.code || 'TBA',
                branchCode: reg.customCode || subj.code || 'TBA',
                displayCode: reg.customCode || subj.code || 'TBA',
                name: reg.customName || subj.name || 'Untitled Subject',
                displayName: reg.customName || subj.name || 'Untitled Subject',
                credits: reg.registeredCredits !== undefined && reg.registeredCredits !== null ? reg.registeredCredits : (subj.credits ?? 4),
                category: reg.category || subj.category || type,
                type,
                evaluationType: subj.evaluationType || null,
                isElective: reg.registrationType === 'ELECTIVE' || reg.category === 'Elective',
                subject: subj
            };
        });

        return {
            semester: effectiveSem,
            isFromRegistration: true,
            totalSubjects: mapped.length,
            subjects: mapped
        };
    }

    // Fallback to Authoritative Curriculum Subjects
    const curriculumSubjects = await resolveStudentCurriculumSubjects(student, effectiveSem);
    return {
        semester: effectiveSem,
        isFromRegistration: false,
        totalSubjects: curriculumSubjects.length,
        subjects: curriculumSubjects
    };
}

module.exports = {
    resolveStudentSubjects,
    resolveStudentCurriculumSubjects,
    resolveApplicableStudentSubjects,
    clearResolverCache
};

