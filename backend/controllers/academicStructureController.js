const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const Branch = require('../models/Branch');
const Scheme = require('../models/Scheme');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const User = require('../models/User');
const { SectionTimetable } = require('../models/SectionTimetable');
const CollegeEvent = require('../models/CollegeEvent');
const AcademicCalendarItem = require('../models/AcademicCalendarItem'); // Retained for backwards compatibility
const Admin = require('../models/Admin');
const StudentAccount = require('../models/StudentAccount');
const AcademicPlacement = require('../models/AcademicPlacement');
const SectionChangeRequest = require('../models/SectionChangeRequest');
const { logActivity } = require('../services/adminActivityService');
const { validateAdminAccess } = require('../middleware/scopeAuthorization');

// Default SIT Tumkur details from platform configuration
const SIT_COLLEGE_DEFAULTS = {
    name: 'Siddaganga Institute of Technology, Tumkur',
    code: 'SIT',
    slug: 'sit-tumkur',
    status: 'Active',
    address: {
        city: 'Tumakuru',
        state: 'Karnataka',
        country: 'India'
    },
    website: 'https://sit.ac.in'
};

const ensureSITCollege = async () => {
    let sit = await College.findOne({ code: 'SIT' });
    if (!sit) {
        sit = await College.create(SIT_COLLEGE_DEFAULTS);
    }
    return sit;
};

// ==========================================
// 1. COLLEGES (SIT Tumkur Focused)
// ==========================================

const listColleges = async (req, res) => {
    try {
        // Ensure SIT Tumkur is present as the primary institution
        const sit = await ensureSITCollege();
        
        // Single-college target: only return SIT
        const colleges = await College.find({ code: 'SIT' }).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, count: colleges.length, data: colleges, primary: sit });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getPrimaryCollege = async (req, res) => {
    try {
        const sit = await ensureSITCollege();
        res.status(200).json({ success: true, data: sit });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getCollegeById = async (req, res) => {
    try {
        const college = await College.findById(req.params.id).lean();
        if (!college) {
            return res.status(404).json({ success: false, error: 'College not found' });
        }
        res.status(200).json({ success: true, data: college });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createCollege = async (req, res) => {
    try {
        // Enforce single-institution mode for SIT while preserving future scalability
        const existingCount = await College.countDocuments({ code: 'SIT' });
        if (existingCount >= 1) {
            return res.status(403).json({
                success: false,
                error: 'Single-institution mode active: Currently locked to Siddaganga Institute of Technology (SIT). Adding additional colleges is disabled.'
            });
        }

        const { name, code, slug, address, website, status } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, error: 'College name and code are required' });
        }

        const college = new College({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            slug: (slug || code).trim().toLowerCase(),
            address: address || {},
            website: website || '',
            status: status || 'Active'
        });

        await college.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'COLLEGE',
            resourceId: college._id,
            metadata: { title: college.name, extra: { code: college.code } }
        });

        res.status(201).json({ success: true, data: college });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Duplicate college code or slug' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateCollege = async (req, res) => {
    try {
        const { name, code, slug, address, website, status } = req.body;
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ success: false, error: 'College not found' });
        }

        if (name) college.name = name.trim();
        if (code) college.code = code.trim().toUpperCase();
        if (slug) college.slug = slug.trim().toLowerCase();
        if (address) college.address = address;
        if (website !== undefined) college.website = website;
        if (status) college.status = status;

        await college.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'COLLEGE',
            resourceId: college._id,
            metadata: { title: college.name }
        });

        res.status(200).json({ success: true, data: college });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Duplicate college code or slug' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteCollege = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ success: false, error: 'College not found' });
        }

        // Prevent orphan records check: check if programs exist
        const programsCount = await AcademicProgram.countDocuments({ college: college._id });
        if (programsCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete college with ${programsCount} existing programs. Remove dependent programs first.`
            });
        }

        await College.findByIdAndDelete(req.params.id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'COLLEGE',
            resourceId: college._id,
            metadata: { title: college.name }
        });

        res.status(200).json({ success: true, message: 'College deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// 2. SCHEMES
// ==========================================

const listSchemes = async (req, res) => {
    try {
        const { collegeId } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        const schemes = await Scheme.find(filter).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, count: schemes.length, data: schemes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createScheme = async (req, res) => {
    try {
        const { name, code, collegeId, status } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'Scheme name is required' });
        }

        // Check duplicate within same college
        if (collegeId) {
            const existing = await Scheme.findOne({ name: name.trim(), college: collegeId });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Scheme name already exists in this college' });
            }
        }

        const scheme = new Scheme({
            name: name.trim(),
            code: code ? code.trim() : null,
            college: collegeId || null,
            status: status || 'Active'
        });

        await scheme.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'SCHEME',
            resourceId: scheme._id,
            metadata: { title: scheme.name, extra: { college: collegeId } }
        });

        res.status(201).json({ success: true, data: scheme });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateScheme = async (req, res) => {
    try {
        const { name, code, status } = req.body;
        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, error: 'Scheme not found' });
        }

        if (name) scheme.name = name.trim();
        if (code !== undefined) scheme.code = code;
        if (status) scheme.status = status;

        await scheme.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'SCHEME',
            resourceId: scheme._id,
            metadata: { title: scheme.name }
        });

        res.status(200).json({ success: true, data: scheme });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteScheme = async (req, res) => {
    try {
        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, error: 'Scheme not found' });
        }

        await Scheme.findByIdAndDelete(req.params.id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'SCHEME',
            resourceId: scheme._id,
            metadata: { title: scheme.name }
        });

        res.status(200).json({ success: true, message: 'Scheme deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// 3. PROGRAMS & BRANCHES
// ==========================================

const listPrograms = async (req, res) => {
    try {
        const { collegeId } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        const programs = await AcademicProgram.find(filter).populate('college', 'name code').sort({ displayOrder: 1, name: 1 }).lean();
        res.status(200).json({ success: true, count: programs.length, data: programs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createProgram = async (req, res) => {
    try {
        const { collegeId, name, code, level, minSemesters, maxSemesters, hasBranches, status, displayOrder } = req.body;
        if (!collegeId || !name || !code) {
            return res.status(400).json({ success: false, error: 'College ID, Program name and code are required' });
        }

        // Verify college exists (prevent orphan)
        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(400).json({ success: false, error: 'Referenced college does not exist' });
        }

        const program = new AcademicProgram({
            college: collegeId,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            level: level || 'Undergraduate',
            minSemesters: minSemesters || 1,
            maxSemesters: maxSemesters || 8,
            hasBranches: hasBranches !== undefined ? hasBranches : true,
            status: status || 'Active',
            displayOrder: displayOrder || 0
        });

        await program.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'PROGRAM',
            resourceId: program._id,
            metadata: { title: program.name, extra: { code: program.code, college: collegeId } }
        });

        res.status(201).json({ success: true, data: program });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Program code already exists for this college' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateProgram = async (req, res) => {
    try {
        const { name, code, level, minSemesters, maxSemesters, hasBranches, status, displayOrder } = req.body;
        const program = await AcademicProgram.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ success: false, error: 'Program not found' });
        }

        if (name) program.name = name.trim();
        if (code) program.code = code.trim().toUpperCase();
        if (level) program.level = level;
        if (minSemesters) program.minSemesters = minSemesters;
        if (maxSemesters) program.maxSemesters = maxSemesters;
        if (hasBranches !== undefined) program.hasBranches = hasBranches;
        if (status) program.status = status;
        if (displayOrder !== undefined) program.displayOrder = displayOrder;

        await program.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'PROGRAM',
            resourceId: program._id,
            metadata: { title: program.name }
        });

        res.status(200).json({ success: true, data: program });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteProgram = async (req, res) => {
    try {
        const program = await AcademicProgram.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ success: false, error: 'Program not found' });
        }

        // Prevent orphan records: check batches
        const batchesCount = await AcademicBatch.countDocuments({ program: program._id });
        if (batchesCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete program with ${batchesCount} existing batches. Remove dependent batches first.`
            });
        }

        await AcademicProgram.findByIdAndDelete(req.params.id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'PROGRAM',
            resourceId: program._id,
            metadata: { title: program.name }
        });

        res.status(200).json({ success: true, message: 'Program deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const listBranches = async (req, res) => {
    try {
        const { collegeId, programId } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        if (programId) filter.program = programId;
        const branches = await Branch.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
        res.status(200).json({ success: true, count: branches.length, data: branches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createBranch = async (req, res) => {
    try {
        const { name, shortName, collegeId, programId, displayOrder, status } = req.body;
        if (!name || !shortName) {
            return res.status(400).json({ success: false, error: 'Branch name and shortName are required' });
        }

        // If collegeId provided, check college existence
        if (collegeId) {
            const college = await College.findById(collegeId);
            if (!college) {
                return res.status(400).json({ success: false, error: 'Referenced college does not exist' });
            }
        }

        const branch = new Branch({
            name: name.trim(),
            shortName: shortName.trim().toUpperCase(),
            college: collegeId || null,
            program: programId || null,
            displayOrder: displayOrder || 0,
            status: status || 'Published'
        });

        await branch.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'BRANCH',
            resourceId: branch._id,
            metadata: { title: branch.name, extra: { shortName: branch.shortName, college: collegeId } }
        });

        res.status(201).json({ success: true, data: branch });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Branch shortName already exists' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// ==========================================
// 4. BATCHES
// ==========================================

const listBatches = async (req, res) => {
    try {
        const { collegeId, programId, branchId } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        if (programId) filter.program = programId;
        if (branchId) filter.branch = branchId;

        const batches = await AcademicBatch.find(filter)
            .populate('college', 'name code')
            .populate('program', 'name code')
            .populate('branch', 'name shortName')
            .populate('scheme', 'name')
            .sort({ admissionYear: -1, name: 1 })
            .lean();

        // Calculate dependent records for each batch
        const batchesWithDeps = await Promise.all(batches.map(async (b) => {
            let semIds = [];
            let semCount = 0;
            try {
                const semQuery = Semester.find({ $or: [{ batch: b._id }, { academicBatch: b._id }] });
                const batchSemesters = (typeof semQuery?.select === 'function')
                    ? await semQuery.select('_id').lean()
                    : await semQuery;
                semIds = (batchSemesters || []).map(s => s._id).filter(Boolean);
                semCount = (batchSemesters || []).length;
            } catch (e) {
                semIds = [];
                semCount = 0;
            }

            const [secCount, userCount, ttCount, canonicalEvents, legacyEvents] = await Promise.all([
                AcademicSection.countDocuments({ batch: b._id }),
                User.countDocuments({ academicBatch: b._id }),
                SectionTimetable.countDocuments({ batch: b._id }),
                semIds.length > 0 && CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: { $in: semIds }, status: { $ne: 'ARCHIVED' } }) : 0,
                AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ batch: b._id }) : 0
            ]);
            const eventCount = Math.max(canonicalEvents || 0, legacyEvents || 0);
            const totalDependencies = semCount + secCount + userCount + ttCount + eventCount;
            return {
                ...b,
                semestersCount: semCount,
                sectionsCount: secCount,
                studentsCount: userCount,
                timetablesCount: ttCount,
                eventsCount: eventCount,
                totalDependencies,
                hasDependencies: totalDependencies > 0
            };
        }));

        res.status(200).json({ success: true, count: batchesWithDeps.length, data: batchesWithDeps });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createBatch = async (req, res) => {
    try {
        const { collegeId, programId, schemeId, admissionYear, graduationYear, status } = req.body;
        
        if (!admissionYear) {
            return res.status(400).json({
                success: false,
                error: 'Admission year is required'
            });
        }

        const admYear = Number(admissionYear);
        const gradYear = graduationYear ? Number(graduationYear) : admYear + 4;

        if (!Number.isInteger(admYear) || admYear < 1950 || admYear > 2100 || !Number.isInteger(gradYear) || gradYear < 1950 || gradYear > 2100) {
            return res.status(400).json({
                success: false,
                error: 'Academic years must be between 1950 and 2100'
            });
        }

        if (gradYear <= admYear) {
            return res.status(400).json({
                success: false,
                error: 'Graduation year must be after admission year'
            });
        }

        // Enforce 4-year duration for B.E. cohort batch
        if (gradYear - admYear !== 4) {
            return res.status(400).json({
                success: false,
                error: `For the 4-year B.E. program, graduation year must be exactly 4 years after admission year (${admYear} → ${admYear + 4})`
            });
        }

        // Auto-resolve SIT College if not explicitly provided
        let effectiveCollegeId = collegeId;
        if (!effectiveCollegeId) {
            const sit = await ensureSITCollege();
            effectiveCollegeId = sit._id;
        } else {
            const college = await College.findById(effectiveCollegeId);
            if (!college) {
                return res.status(400).json({ success: false, error: 'Referenced college does not exist' });
            }
        }

        // Auto-resolve SIT B.E. Program if not explicitly provided
        let effectiveProgramId = programId;
        if (!effectiveProgramId) {
            let beProg = await AcademicProgram.findOne({
                college: effectiveCollegeId,
                code: { $in: ['B.E', 'BE'] }
            });
            if (!beProg) {
                beProg = await AcademicProgram.create({
                    college: effectiveCollegeId,
                    name: 'Bachelor of Engineering',
                    code: 'B.E',
                    level: 'Undergraduate',
                    minSemesters: 1,
                    maxSemesters: 8,
                    hasBranches: true,
                    status: 'Active'
                });
            }
            effectiveProgramId = beProg._id;
        } else {
            const program = await AcademicProgram.findById(effectiveProgramId);
            if (!program) {
                return res.status(400).json({ success: false, error: 'Referenced program does not exist' });
            }
        }

        // Check for duplicate cohort batch in the same institution + program
        const duplicate = await AcademicBatch.findOne({
            college: effectiveCollegeId,
            program: effectiveProgramId,
            branch: null,
            admissionYear: admYear
        });
        if (duplicate) {
            return res.status(400).json({
                success: false,
                error: `A B.E. cohort batch for ${admYear}–${gradYear} already exists`
            });
        }

        // Auto-derived batch name: e.g. 2026-2030
        const batchName = `${admYear}-${gradYear}`;

        const batch = new AcademicBatch({
            name: batchName,
            admissionYear: admYear,
            graduationYear: gradYear,
            college: effectiveCollegeId,
            program: effectiveProgramId,
            branch: null, // Whole B.E. cohort, not separated by branch
            scheme: schemeId || null,
            status: status || 'Active'
        });

        await batch.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'BATCH',
            resourceId: batch._id,
            metadata: { title: batch.name, extra: { admissionYear: admYear, graduationYear: gradYear, college: effectiveCollegeId } }
        });

        res.status(201).json({ success: true, data: batch });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: `A batch for admission year ${req.body.admissionYear} already exists in this academic context`
            });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateBatch = async (req, res) => {
    try {
        const { admissionYear, graduationYear, schemeId, status, forceTransition } = req.body;
        const batch = await AcademicBatch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ success: false, error: 'Batch not found' });
        }

        // Terminal academic state guard: Graduated batches should not casually revert to Active
        if (batch.status === 'Graduated' && status && status !== 'Graduated') {
            if (forceTransition !== true) {
                return res.status(400).json({
                    success: false,
                    error: 'Graduated is a terminal academic state. Cannot reactivate a graduated batch without explicit confirmation.'
                });
            }
        }

        const nextAdmission = admissionYear ? Number(admissionYear) : batch.admissionYear;
        const nextGraduation = graduationYear ? Number(graduationYear) : batch.graduationYear;
        const isYearChangeRequested = (nextAdmission !== batch.admissionYear) || (nextGraduation !== batch.graduationYear);

        // Dependency protection for cohort years
        if (isYearChangeRequested) {
            let semIds = [];
            let semCount = 0;
            try {
                const semQuery = Semester.find({ $or: [{ batch: batch._id }, { academicBatch: batch._id }] });
                const batchSemesters = (typeof semQuery?.select === 'function')
                    ? await semQuery.select('_id').lean()
                    : await semQuery;
                semIds = (batchSemesters || []).map(s => s._id).filter(Boolean);
                semCount = (batchSemesters || []).length;
            } catch (e) {
                semIds = [];
                semCount = 0;
            }

            const [secCount, userCount, ttCount, canonicalEvents, legacyEvents] = await Promise.all([
                AcademicSection.countDocuments({ batch: batch._id }),
                User.countDocuments({ academicBatch: batch._id }),
                SectionTimetable.countDocuments({ batch: batch._id }),
                semIds.length > 0 && CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: { $in: semIds }, status: { $ne: 'ARCHIVED' } }) : 0,
                AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ batch: batch._id }) : 0
            ]);
            const eventCount = Math.max(canonicalEvents || 0, legacyEvents || 0);
            const totalDependencies = semCount + secCount + userCount + ttCount + eventCount;

            if (totalDependencies > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Admission and graduation years cannot be modified because academic records are linked to this cohort (${semCount} semester(s), ${secCount} section(s), ${userCount} student(s)).`
                });
            }

            if (!Number.isInteger(nextAdmission) || nextAdmission < 1950 || nextAdmission > 2100 || !Number.isInteger(nextGraduation) || nextGraduation < 1950 || nextGraduation > 2100) {
                return res.status(400).json({ success: false, error: 'Academic years must be between 1950 and 2100' });
            }

            if (nextAdmission >= nextGraduation) {
                return res.status(400).json({ success: false, error: 'Graduation year must be after admission year' });
            }

            // Check if existing semesters exceed proposed duration
            const maxAllowedSem = (nextGraduation - nextAdmission) * 2;
            const exceedingSem = await Semester.findOne({
                $or: [{ batch: batch._id }, { academicBatch: batch._id }],
                number: { $gt: maxAllowedSem }
            });
            if (exceedingSem) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot reduce cohort duration: existing Semester ${exceedingSem.number} exceeds the new cohort duration (${maxAllowedSem} semesters max)`
                });
            }

            if (nextGraduation - nextAdmission !== 4) {
                return res.status(400).json({
                    success: false,
                    error: `For the 4-year B.E. program, graduation year must be exactly 4 years after admission year (${nextAdmission} → ${nextAdmission + 4})`
                });
            }

            // Check duplicate collision
            const duplicate = await AcademicBatch.findOne({
                _id: { $ne: batch._id },
                college: batch.college,
                program: batch.program,
                branch: null,
                admissionYear: nextAdmission
            });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    error: `A B.E. cohort batch for ${nextAdmission}–${nextGraduation} already exists`
                });
            }

            batch.admissionYear = nextAdmission;
            batch.graduationYear = nextGraduation;
            batch.name = `${nextAdmission}-${nextGraduation}`;
        }

        if (schemeId !== undefined) batch.scheme = schemeId;
        if (status && ['Active', 'Graduated', 'Archived'].includes(status)) {
            batch.status = status;
        }

        await batch.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'BATCH',
            resourceId: batch._id,
            metadata: { title: batch.name, extra: { status: batch.status } }
        });

        res.status(200).json({ success: true, data: batch });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Batch year collision in this academic context' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteBatch = async (req, res) => {
    try {
        const batch = await AcademicBatch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ success: false, error: 'Batch not found' });
        }

        // Comprehensive dependency check across all academic modules
        let semIds = [];
        let semestersCount = 0;
        try {
            const semQuery = Semester.find({ $or: [{ batch: batch._id }, { academicBatch: batch._id }] });
            const batchSemesters = (typeof semQuery?.select === 'function')
                ? await semQuery.select('_id').lean()
                : await semQuery;
            semIds = (batchSemesters || []).map(s => s._id).filter(Boolean);
            semestersCount = (batchSemesters || []).length;
        } catch (e) {
            semIds = [];
            semestersCount = 0;
        }

        const [sectionsCount, studentsCount, timetablesCount, canonicalEvents, legacyEvents] = await Promise.all([
            AcademicSection.countDocuments({ batch: batch._id }),
            User.countDocuments({ academicBatch: batch._id }),
            SectionTimetable.countDocuments({ batch: batch._id }),
            semIds.length > 0 && CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: { $in: semIds }, status: { $ne: 'ARCHIVED' } }) : 0,
            AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ batch: batch._id }) : 0
        ]);
        const eventsCount = Math.max(canonicalEvents || 0, legacyEvents || 0);

        const depMessages = [];
        if (semestersCount > 0) depMessages.push(`${semestersCount} semester(s)`);
        if (sectionsCount > 0) depMessages.push(`${sectionsCount} section(s)`);
        if (studentsCount > 0) depMessages.push(`${studentsCount} student(s)`);
        if (timetablesCount > 0) depMessages.push(`${timetablesCount} timetable(s)`);
        if (eventsCount > 0) depMessages.push(`${eventsCount} event(s)`);

        if (depMessages.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete batch: ${depMessages.join(', ')} depend on it. This batch cannot be deleted because academic records are linked to it. Archive the batch instead.`
            });
        }

        await AcademicBatch.findByIdAndDelete(batch._id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'BATCH',
            resourceId: batch._id,
            metadata: { title: batch.name }
        });

        res.status(200).json({ success: true, message: `Cohort Batch "${batch.name}" deleted successfully` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// ==========================================
// 5. SEMESTERS (ADMIN BASELINE DATES)
// ==========================================

const listSemesters = async (req, res) => {
    try {
        const { collegeId, programId, batchId, status } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        if (programId) filter.program = programId;
        if (batchId) filter.batch = batchId;
        if (status) filter.status = status;

        const semesters = await Semester.find(filter)
            .populate('college', 'name code')
            .populate('program', 'name code')
            .populate('batch', 'name admissionYear graduationYear status')
            .sort({ number: 1, sequence: 1 })
            .lean();

        // Calculate dependency counts for each semester
        const semestersWithDeps = await Promise.all(semesters.map(async (s) => {
            const batchRef = s.batch?._id || s.batch;
            const [sectionsCount, timetablesCount, canonicalEvents, legacyEvents] = await Promise.all([
                AcademicSection.countDocuments({ batch: batchRef, semester: s.number }),
                SectionTimetable.countDocuments({ $or: [{ semester: s._id }, { batch: batchRef, semesterNumber: s.number }] }),
                CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: s._id, status: { $ne: 'ARCHIVED' } }) : 0,
                AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ semester: s._id }) : 0
            ]);
            const eventsCount = Math.max(canonicalEvents || 0, legacyEvents || 0);
            const totalDependencies = sectionsCount + timetablesCount + eventsCount;
            return {
                ...s,
                sectionsCount,
                timetablesCount,
                eventsCount,
                totalDependencies,
                hasDependencies: totalDependencies > 0
            };
        }));

        res.status(200).json({ success: true, count: semestersWithDeps.length, data: semestersWithDeps });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createSemester = async (req, res) => {
    try {
        const { collegeId, programId, batchId, number, sequence, label, termType, startDate, endDate, status } = req.body;

        if (!batchId) {
            return res.status(400).json({ success: false, error: 'Batch cohort is required' });
        }
        if (number === undefined || number === null || number === '') {
            return res.status(400).json({ success: false, error: 'Semester number is required' });
        }
        if (!startDate) {
            return res.status(400).json({ success: false, error: 'Official start date is required' });
        }
        if (!endDate) {
            return res.status(400).json({ success: false, error: 'Official end date is required' });
        }

        // Verify parent batch exists and populate program context
        const batch = await AcademicBatch.findById(batchId).populate('program');
        if (!batch) {
            return res.status(400).json({ success: false, error: 'Referenced batch does not exist' });
        }

        // Derive college and program from parent batch
        const effectiveCollegeId = collegeId || batch.college;
        const effectiveProgramId = programId || (batch.program ? (batch.program._id || batch.program) : null);

        if (!effectiveCollegeId) {
            return res.status(400).json({ success: false, error: 'Batch does not have an associated college' });
        }
        if (!effectiveProgramId) {
            return res.status(400).json({ success: false, error: 'Batch does not have an associated program' });
        }

        // Semester number range validation (strictly 1 to 8 for B.E.)
        const semNum = Number(number);
        const maxSem = (batch.program && batch.program.maxSemesters) ? batch.program.maxSemesters : 8;
        if (isNaN(semNum) || !Number.isInteger(semNum) || semNum < 1 || semNum > maxSem) {
            return res.status(400).json({
                success: false,
                error: `Semester must be an integer between 1 and ${maxSem}`
            });
        }

        // Start date vs End date validation
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid date format provided' });
        }
        if (start >= end) {
            return res.status(400).json({ success: false, error: 'Official start date must be before end date' });
        }

        // Check duplicate semester number for THIS specific batch cohort
        const existingSameSem = await Semester.findOne({
            batch: batch._id,
            number: semNum
        });
        if (existingSameSem) {
            return res.status(400).json({
                success: false,
                error: `Official Semester ${semNum} already exists for this batch cohort`
            });
        }

        // Timeline validation: non-overlapping official dates & chronological progression within this batch
        // Check overlap via findOne first
        const overlappingSem = await Semester.findOne({
            batch: batch._id,
            startDate: { $lte: end },
            endDate: { $gte: start }
        });
        if (overlappingSem) {
            return res.status(400).json({
                success: false,
                error: `Semester date range overlaps with existing Semester ${overlappingSem.number}`
            });
        }

        let otherSemesters = [];
        try {
            const findQuery = Semester.find({ batch: batch._id });
            otherSemesters = (findQuery && typeof findQuery.lean === 'function') ? await findQuery.lean() : (await findQuery || []);
        } catch (e) {
            otherSemesters = [];
        }

        if (Array.isArray(otherSemesters)) {
            for (const other of otherSemesters) {
                if (!other.startDate || !other.endDate) continue;
                const oStart = new Date(other.startDate);
                const oEnd = new Date(other.endDate);
                const oStartStr = oStart.toISOString().slice(0, 10);
                const oEndStr = oEnd.toISOString().slice(0, 10);

                // 1. Direct date overlap: [start, end] and [oStart, oEnd] overlap if start <= oEnd && end >= oStart
                if (start <= oEnd && end >= oStart) {
                    return res.status(400).json({
                        success: false,
                        error: `Semester date range overlaps with existing Semester ${other.number} (${oStartStr} to ${oEndStr})`
                    });
                }

                // 2. Chronological sequence check
                if (semNum > other.number && start <= oEnd) {
                    return res.status(400).json({
                        success: false,
                        error: `Semester ${semNum} timeline cannot start before or during Semester ${other.number} (${oStartStr} to ${oEndStr})`
                    });
                }
                if (semNum < other.number && end >= oStart) {
                    return res.status(400).json({
                        success: false,
                        error: `Semester ${semNum} timeline cannot end after or during Semester ${other.number} (${oStartStr} to ${oEndStr})`
                    });
                }
            }
        }

        const cleanLabel = (label && label.trim()) ? label.trim() : `Semester ${semNum}`;

        const semester = new Semester({
            college: effectiveCollegeId,
            program: effectiveProgramId,
            batch: batch._id,
            number: semNum,
            sequence: sequence != null ? Number(sequence) : semNum,
            label: cleanLabel,
            termType: termType || 'Semester',
            startDate: start,
            endDate: end,
            status: status || 'Upcoming'
        });

        await semester.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'SEMESTER',
            resourceId: semester._id,
            metadata: { title: semester.label, extra: { number: semNum, college: effectiveCollegeId, batch: batch._id } }
        });

        res.status(201).json({ success: true, data: semester });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: `Official Semester ${req.body.number} already exists for this batch cohort` });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateSemester = async (req, res) => {
    try {
        const { number, label, termType, startDate, endDate, status, sequence } = req.body;
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ success: false, error: 'Semester not found' });
        }

        if (number !== undefined && number !== null && number !== '') {
            const semNum = Number(number);
            if (isNaN(semNum) || semNum < 1 || semNum > 8) {
                return res.status(400).json({ success: false, error: 'Semester number must be an integer between 1 and 8' });
            }
            if (semNum !== semester.number) {
                const [secCount, ttCount, canonicalEvents, legacyEvents] = await Promise.all([
                    AcademicSection.countDocuments({ batch: semester.batch, semester: semester.number }),
                    SectionTimetable.countDocuments({ $or: [{ semester: semester._id }, { batch: semester.batch, semesterNumber: semester.number }] }),
                    CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: semester._id, status: { $ne: 'ARCHIVED' } }) : 0,
                    AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ semester: semester._id }) : 0
                ]);
                const evtCount = Math.max(canonicalEvents || 0, legacyEvents || 0);
                const totalDeps = secCount + ttCount + evtCount;
                if (totalDeps > 0) {
                    const depItems = [];
                    if (secCount > 0) depItems.push(`${secCount} section(s)`);
                    if (ttCount > 0) depItems.push(`${ttCount} timetable(s)`);
                    if (evtCount > 0) depItems.push(`${evtCount} event(s)`);
                    return res.status(400).json({
                        success: false,
                        error: `Cannot change semester number from ${semester.number} to ${semNum}: ${depItems.join(', ')} depend on Semester ${semester.number}.`
                    });
                }
                const existing = await Semester.findOne({
                    batch: semester.batch,
                    number: semNum,
                    _id: { $ne: semester._id }
                });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        error: `Semester ${semNum} already exists for this batch cohort`
                    });
                }
                semester.number = semNum;
                semester.sequence = semNum;
                if (!label) {
                    semester.label = `Semester ${semNum}`;
                }
            }
        }

        const nextStart = startDate !== undefined ? (startDate ? new Date(startDate) : null) : semester.startDate;
        const nextEnd = endDate !== undefined ? (endDate ? new Date(endDate) : null) : semester.endDate;

        if (nextStart && nextEnd && nextStart >= nextEnd) {
            return res.status(400).json({ success: false, error: 'Official start date must be before end date' });
        }

        // Overlap & chronological validation if dates are updated
        if (startDate !== undefined || endDate !== undefined) {
            if (nextStart && nextEnd) {
                const effectiveNum = (number != null && !isNaN(Number(number))) ? Number(number) : semester.number;
                const overlapping = await Semester.findOne({
                    batch: semester.batch,
                    _id: { $ne: semester._id },
                    startDate: { $lte: nextEnd },
                    endDate: { $gte: nextStart }
                });
                if (overlapping) {
                    return res.status(400).json({
                        success: false,
                        error: `Semester date range overlaps with existing Semester ${overlapping.number}`
                    });
                }

                let otherSemesters = [];
                try {
                    const findQuery = Semester.find({
                        batch: semester.batch,
                        _id: { $ne: semester._id }
                    });
                    otherSemesters = (findQuery && typeof findQuery.lean === 'function') ? await findQuery.lean() : (await findQuery || []);
                } catch (e) {
                    otherSemesters = [];
                }

                if (Array.isArray(otherSemesters)) {
                    for (const other of otherSemesters) {
                        if (!other.startDate || !other.endDate) continue;
                        const oStart = new Date(other.startDate);
                        const oEnd = new Date(other.endDate);
                        const oStartStr = oStart.toISOString().slice(0, 10);
                        const oEndStr = oEnd.toISOString().slice(0, 10);

                        if (nextStart <= oEnd && nextEnd >= oStart) {
                            return res.status(400).json({
                                success: false,
                                error: `Semester date range overlaps with existing Semester ${other.number} (${oStartStr} to ${oEndStr})`
                            });
                        }
                        if (effectiveNum > other.number && nextStart <= oEnd) {
                            return res.status(400).json({
                                success: false,
                                error: `Semester ${effectiveNum} timeline cannot start before or during Semester ${other.number} (${oStartStr} to ${oEndStr})`
                            });
                        }
                        if (effectiveNum < other.number && nextEnd >= oStart) {
                            return res.status(400).json({
                                success: false,
                                error: `Semester ${effectiveNum} timeline cannot end after or during Semester ${other.number} (${oStartStr} to ${oEndStr})`
                            });
                        }
                    }
                }
            }
        }

        if (label) semester.label = label.trim();
        if (termType) semester.termType = termType;
        if (sequence != null) semester.sequence = Number(sequence);
        if (startDate !== undefined) semester.startDate = nextStart;
        if (endDate !== undefined) semester.endDate = nextEnd;
        if (status && ['Active', 'Upcoming', 'Completed', 'Cancelled', 'Archived'].includes(status)) {
            semester.status = status;
        }

        await semester.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'SEMESTER',
            resourceId: semester._id,
            metadata: { title: semester.label }
        });

        res.status(200).json({ success: true, data: semester });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Official Semester already exists for this batch cohort' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteSemester = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ success: false, error: 'Semester not found' });
        }

        // Comprehensive dependency check across Sections, Timetables, and Events
        const [sectionsCount, timetablesCount, canonicalEvents, legacyEvents] = await Promise.all([
            AcademicSection.countDocuments({
                batch: semester.batch,
                semester: semester.number
            }),
            SectionTimetable.countDocuments({
                $or: [
                    { semester: semester._id },
                    { batch: semester.batch, semesterNumber: semester.number }
                ]
            }),
            CollegeEvent ? CollegeEvent.countDocuments({ academicSemesterId: semester._id, status: { $ne: 'ARCHIVED' } }) : 0,
            AcademicCalendarItem ? AcademicCalendarItem.countDocuments({ semester: semester._id }) : 0
        ]);
        const eventsCount = Math.max(canonicalEvents || 0, legacyEvents || 0);

        const depItems = [];
        if (sectionsCount > 0) depItems.push(`${sectionsCount} section(s)`);
        if (timetablesCount > 0) depItems.push(`${timetablesCount} timetable(s)`);
        if (eventsCount > 0) depItems.push(`${eventsCount} calendar event(s)`);

        if (depItems.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete Semester ${semester.number}: ${depItems.join(', ')} depend on it. This semester cannot be deleted because academic records are linked to it. Archive or cancel the semester instead.`
            });
        }

        // Safe delete: parent batch is never touched or modified
        await Semester.findByIdAndDelete(req.params.id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'SEMESTER',
            resourceId: semester._id,
            metadata: { title: semester.label }
        });

        res.status(200).json({ success: true, message: `Official Semester ${semester.number} deleted successfully` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// 6. SECTIONS
// ==========================================

const SECTION_NAME_REGEX = /^[A-Z]{1,2}[0-9]?$/;

const listSections = async (req, res) => {
    try {
        const { collegeId, programId, branchId, batchId, semester, semesterId, status } = req.query;
        const filter = {};
        if (collegeId) filter.college = collegeId;
        if (programId) filter.program = programId;
        if (branchId) filter.branch = branchId;
        if (batchId) filter.batch = batchId;
        if (semesterId) {
            filter.$or = [{ academicSemester: semesterId }, { semester: semesterId }];
        } else if (semester) {
            const semNum = Number(semester);
            if (!isNaN(semNum) && Number.isInteger(semNum)) {
                filter.semester = semNum;
            } else {
                filter.$or = [{ academicSemester: semester }, { semester: semester }];
            }
        }
        if (status) filter.status = status;

        const rawSections = await AcademicSection.find(filter)
            .populate('college', 'name code')
            .populate('program', 'name code')
            .populate('branch', 'name shortName')
            .populate('batch', 'name admissionYear graduationYear')
            .populate('academicSemester', 'number label startDate endDate status')
            .sort({ semester: 1, name: 1 })
            .lean();

        // Efficient dependency counts across timetables and students
        const sectionIds = rawSections.map(s => s._id);
        const { SectionTimetable } = require('../models/SectionTimetable');
        const User = require('../models/User');

        let timetableCountsMap = {};
        let studentCountsMap = {};

        if (sectionIds.length > 0) {
            try {
                if (SectionTimetable && typeof SectionTimetable.aggregate === 'function') {
                    const ttAgg = await SectionTimetable.aggregate([
                        { $match: { section: { $in: sectionIds } } },
                        { $group: { _id: '$section', count: { $sum: 1 } } }
                    ]);
                    timetableCountsMap = Object.fromEntries(ttAgg.map(a => [String(a._id), a.count]));
                }
            } catch (e) {
                timetableCountsMap = {};
            }

            try {
                if (User && typeof User.aggregate === 'function') {
                    const userAgg = await User.aggregate([
                        { $match: { academicSection: { $in: sectionIds } } },
                        { $group: { _id: '$academicSection', count: { $sum: 1 } } }
                    ]);
                    studentCountsMap = Object.fromEntries(userAgg.map(a => [String(a._id), a.count]));
                }
            } catch (e) {
                studentCountsMap = {};
            }
        }

        const sections = rawSections.map(s => {
            const timetablesCount = timetableCountsMap[String(s._id)] || 0;
            const studentsCount = studentCountsMap[String(s._id)] || 0;
            const totalDependencies = timetablesCount + studentsCount;
            return {
                ...s,
                room: s.room || '',
                timetablesCount,
                studentsCount,
                totalDependencies,
                hasDependencies: totalDependencies > 0
            };
        });

        res.status(200).json({ success: true, count: sections.length, data: sections });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const createSection = async (req, res) => {
    try {
        const { collegeId, programId, branchId, batchId, semester, semesterId, name, room, capacity, status } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ success: false, error: 'Section name is required' });
        }

        const cleanName = name.trim().toUpperCase();
        if (!SECTION_NAME_REGEX.test(cleanName)) {
            return res.status(400).json({
                success: false,
                error: 'Section name must be 1-2 uppercase letters optionally followed by a number (e.g. A, B, C, A1, B1)'
            });
        }

        let effectiveBatchId = batchId;
        let semNum = null;
        let academicSemDoc = null;

        if (semesterId) {
            academicSemDoc = await Semester.findById(semesterId);
            if (!academicSemDoc) {
                return res.status(400).json({ success: false, error: 'Referenced official semester does not exist' });
            }
            if (batchId && String(academicSemDoc.batch) !== String(batchId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected semester does not belong to the selected batch cohort'
                });
            }
            effectiveBatchId = batchId || academicSemDoc.batch;
            semNum = academicSemDoc.number;
        } else if (semester !== undefined && semester !== null && semester !== '') {
            semNum = Number(semester);
            if (!effectiveBatchId) {
                return res.status(400).json({ success: false, error: 'Batch is required' });
            }
        } else {
            return res.status(400).json({ success: false, error: 'Semester is required' });
        }

        if (!effectiveBatchId) {
            return res.status(400).json({ success: false, error: 'Batch is required' });
        }

        // Verify parent batch exists and populate program context
        const batch = await AcademicBatch.findById(effectiveBatchId).populate('program');
        if (!batch) {
            return res.status(400).json({ success: false, error: 'Referenced batch does not exist' });
        }

        // Derive college and program from parent batch
        const effectiveCollegeId = collegeId || batch.college;
        const effectiveProgramId = programId || (batch.program ? (batch.program._id || batch.program) : null);

        if (!effectiveCollegeId) {
            return res.status(400).json({ success: false, error: 'Batch does not have an associated college' });
        }
        if (!effectiveProgramId) {
            return res.status(400).json({ success: false, error: 'Batch does not have an associated program' });
        }

        // Check whether program requires branches (B.E. programs require branches)
        const progHasBranches = batch.program ? batch.program.hasBranches !== false : true;
        if (progHasBranches && !branchId) {
            return res.status(400).json({ success: false, error: 'Branch is required for this program' });
        }

        if (branchId) {
            const branch = await Branch.findById(branchId);
            if (!branch) {
                return res.status(400).json({ success: false, error: 'Referenced branch does not exist' });
            }
        }

        // Semester range validation
        const maxSem = (batch.program && batch.program.maxSemesters) ? batch.program.maxSemesters : 8;
        if (isNaN(semNum) || !Number.isInteger(semNum) || semNum < 1 || semNum > maxSem) {
            return res.status(400).json({
                success: false,
                error: `Semester must be an integer between 1 and ${maxSem}`
            });
        }

        // Validate that an official semester instance exists for this batch cohort
        if (!academicSemDoc) {
            academicSemDoc = await Semester.findOne({
                batch: batch._id,
                number: semNum
            });
        }
        if (!academicSemDoc) {
            return res.status(400).json({
                success: false,
                error: `Cannot create section for Semester ${semNum}: Official Semester ${semNum} has not been scheduled for this batch cohort. Please schedule the official semester first.`
            });
        }

        // Capacity validation
        let capNum = 60;
        if (capacity !== undefined && capacity !== null && capacity !== '') {
            capNum = Number(capacity);
            if (isNaN(capNum) || capNum < 1 || capNum > 500) {
                return res.status(400).json({ success: false, error: 'Capacity must be between 1 and 500' });
            }
        }

        // Normalize optional room
        const cleanRoom = (room && typeof room === 'string') ? room.trim() : '';

        // Check compound duplicate section
        const existingSection = await AcademicSection.findOne({
            batch: batch._id,
            branch: branchId || null,
            semester: semNum,
            name: cleanName
        });
        if (existingSection) {
            return res.status(400).json({
                success: false,
                error: `Section "${cleanName}" already exists for this batch, branch, and semester`
            });
        }

        const section = new AcademicSection({
            college: effectiveCollegeId,
            program: effectiveProgramId,
            branch: branchId || null,
            batch: batch._id,
            academicSemester: academicSemDoc._id,
            semester: semNum,
            name: cleanName,
            room: cleanRoom,
            capacity: capNum,
            status: status || 'Active'
        });

        await section.save();

        logActivity({
            req,
            action: 'CREATE',
            resourceType: 'SECTION',
            resourceId: section._id,
            metadata: { title: section.name, extra: { semester: semNum, batch: batch._id, branch: branchId, room: cleanRoom } }
        });

        res.status(201).json({ success: true, data: section });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: `Section "${req.body.name}" already exists for this batch, branch, and semester`
            });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const updateSection = async (req, res) => {
    let section;
    try {
        const { name, capacity, status, semester, semesterId, branchId, batchId, room } = req.body;
        section = await AcademicSection.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: 'Section not found' });
        }

        // Dependency check: protect core identity if academic records depend on this section
        const { SectionTimetable } = require('../models/SectionTimetable');
        const User = require('../models/User');
        const [timetablesCount, studentsCount] = await Promise.all([
            SectionTimetable.countDocuments({ section: section._id }),
            User.countDocuments({ academicSection: section._id })
        ]);
        const hasDependencies = (timetablesCount + studentsCount) > 0;

        const isNameChanged = name !== undefined && name.trim().toUpperCase() !== section.name;
        const isBranchChanged = branchId !== undefined && String(branchId || '') !== String(section.branch || '');
        const isSemesterChanged = (semester !== undefined && Number(semester) !== section.semester) ||
                                  (semesterId !== undefined && String(semesterId) !== String(section.academicSemester || ''));
        const isBatchChanged = batchId !== undefined && String(batchId) !== String(section.batch);

        if (hasDependencies && (isNameChanged || isBranchChanged || isSemesterChanged || isBatchChanged)) {
            const depItems = [];
            if (timetablesCount > 0) depItems.push(`${timetablesCount} timetable(s)`);
            if (studentsCount > 0) depItems.push(`${studentsCount} student(s)`);
            return res.status(400).json({
                success: false,
                error: `Cannot change section core identity (name, branch, or semester): academic records (${depItems.join(', ')}) depend on Section ${section.name}. You can update the room, capacity, or status.`
            });
        }

        if (name !== undefined) {
            if (typeof name !== 'string') {
                return res.status(400).json({ success: false, error: 'Section name must be a string' });
            }
            const cleanName = name.trim().toUpperCase();
            if (!SECTION_NAME_REGEX.test(cleanName)) {
                return res.status(400).json({
                    success: false,
                    error: 'Section name must be 1-2 uppercase letters optionally followed by a number (e.g. A, B, C, A1, B1)'
                });
            }
            section.name = cleanName;
        }

        if (room !== undefined) {
            section.room = (room && typeof room === 'string') ? room.trim() : '';
        }

        if (capacity !== undefined && capacity !== null && capacity !== '') {
            const capNum = Number(capacity);
            if (isNaN(capNum) || capNum < 1 || capNum > 500) {
                return res.status(400).json({ success: false, error: 'Capacity must be between 1 and 500' });
            }
            section.capacity = capNum;
        }

        if (semesterId !== undefined) {
            const targetSemDoc = await Semester.findById(semesterId);
            if (!targetSemDoc) {
                return res.status(400).json({ success: false, error: 'Target official semester does not exist' });
            }
            if (String(targetSemDoc.batch) !== String(section.batch)) {
                return res.status(400).json({ success: false, error: 'Target semester does not belong to section batch' });
            }
            section.semester = targetSemDoc.number;
            section.academicSemester = targetSemDoc._id;
        } else if (semester !== undefined && semester !== null && semester !== '') {
            const semNum = Number(semester);
            if (isNaN(semNum) || !Number.isInteger(semNum) || semNum < 1 || semNum > 8) {
                return res.status(400).json({ success: false, error: 'Semester must be between 1 and 8' });
            }

            // Verify target official semester exists for this batch
            const targetSemester = await Semester.findOne({
                batch: section.batch,
                number: semNum
            });
            if (!targetSemester) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot assign section to Semester ${semNum}: Official Semester ${semNum} has not been scheduled for this batch cohort. Please schedule the official semester first.`
                });
            }

            // Scoped admin check for semester transition
            if (req.admin && req.admin.role !== 'SUPER_ADMIN' && semNum !== section.semester) {
                const targetContext = {
                    collegeId: section.college,
                    programId: section.program,
                    branchId: section.branch,
                    batchId: section.batch,
                    semester: semNum
                };
                const scopeCheck = validateAdminAccess(req.admin, targetContext, 'academic_structure', 'update');
                if (!scopeCheck.allowed) {
                    return res.status(403).json({
                        success: false,
                        error: `Out of administrative scope: You do not have permission for Semester ${semNum}.`
                    });
                }
            }

            section.semester = semNum;
            section.academicSemester = targetSemester._id;
        }

        if (branchId !== undefined) {
            if (branchId) {
                const branch = await Branch.findById(branchId);
                if (!branch) {
                    return res.status(400).json({ success: false, error: 'Selected branch does not exist' });
                }

                // Scoped admin check for branch change
                if (req.admin && req.admin.role !== 'SUPER_ADMIN' && String(branchId) !== String(section.branch)) {
                    const targetContext = {
                        collegeId: section.college,
                        programId: section.program,
                        branchId: branchId,
                        batchId: section.batch,
                        semester: section.semester
                    };
                    const scopeCheck = validateAdminAccess(req.admin, targetContext, 'academic_structure', 'update');
                    if (!scopeCheck.allowed) {
                        return res.status(403).json({
                            success: false,
                            error: `Out of administrative scope: You do not have permission to assign sections to this branch.`
                        });
                    }
                }
                section.branch = branchId;
            } else {
                section.branch = null;
            }
        }

        if (status !== undefined) {
            if (!['Active', 'Archived'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Status must be Active or Archived' });
            }
            section.status = status;
        }

        // If core identity fields were updated, check for duplicate collision
        if (isNameChanged || isBranchChanged || isSemesterChanged || isBatchChanged) {
            const duplicate = await AcademicSection.findOne({
                _id: { $ne: section._id },
                batch: section.batch,
                branch: section.branch,
                semester: section.semester,
                name: section.name
            });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    error: `Section "${section.name}" already exists for this batch, branch, and semester`
                });
            }
        }

        await section.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'SECTION',
            resourceId: section._id,
            metadata: { title: section.name, extra: { room: section.room, capacity: section.capacity } }
        });

        res.status(200).json({ success: true, data: section });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: `Section "${req.body.name || section.name}" already exists for this batch, branch, and semester`
            });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

const deleteSection = async (req, res) => {
    try {
        const section = await AcademicSection.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: 'Section not found' });
        }

        // Dependency check: prevent deleting section with active/existing section timetables or students
        const { SectionTimetable } = require('../models/SectionTimetable');
        const User = require('../models/User');
        const [timetablesCount, studentsCount] = await Promise.all([
            SectionTimetable.countDocuments({ section: section._id }),
            User.countDocuments({ academicSection: section._id })
        ]);

        const depItems = [];
        if (timetablesCount > 0) depItems.push(`${timetablesCount} timetable record(s)`);
        if (studentsCount > 0) depItems.push(`${studentsCount} student(s)`);

        if (depItems.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete Section ${section.name}: ${depItems.join(', ')} depend on it. Remove or archive dependent records first.`
            });
        }

        // Safe delete: parent batch and parent semester are never touched or modified
        await AcademicSection.findByIdAndDelete(req.params.id);

        logActivity({
            req,
            action: 'DELETE',
            resourceType: 'SECTION',
            resourceId: section._id,
            metadata: { title: section.name }
        });

        res.status(200).json({ success: true, message: `Section "${section.name}" deleted successfully` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// 7. ADMIN SCOPES MANAGEMENT
// ==========================================

const getAdminScopes = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.adminId)
            .populate('scopes.college', 'name code')
            .populate('scopes.program', 'name code')
            .populate('scopes.branch', 'name shortName')
            .populate('scopes.batch', 'name admissionYear')
            .populate('scopes.sections', 'name semester')
            .lean();

        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        res.status(200).json({
            success: true,
            adminId: admin._id,
            name: admin.name,
            role: admin.role,
            scopes: admin.scopes || []
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const assignAdminScope = async (req, res) => {
    try {
        const { collegeId, programId, branchId, batchId, semester, sectionIds } = req.body;
        if (!collegeId) {
            return res.status(400).json({ success: false, error: 'College ID is required for academic scope' });
        }

        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const newScope = {
            college: collegeId,
            program: programId || null,
            branch: branchId || null,
            batch: batchId || null,
            semester: semester != null ? Number(semester) : null,
            sections: Array.isArray(sectionIds) ? sectionIds : []
        };

        admin.scopes.push(newScope);
        await admin.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'ADMIN_SCOPE',
            resourceId: admin._id,
            metadata: { title: `Assigned scope to ${admin.name}`, extra: newScope }
        });

        res.status(200).json({
            success: true,
            message: 'Scope assigned successfully',
            scopes: admin.scopes
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

const removeAdminScope = async (req, res) => {
    try {
        const { adminId, scopeId } = req.params;
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const initialLength = admin.scopes.length;
        admin.scopes = admin.scopes.filter(s => String(s._id) !== String(scopeId));

        if (admin.scopes.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Scope ID not found on admin' });
        }

        await admin.save();

        logActivity({
            req,
            action: 'UPDATE',
            resourceType: 'ADMIN_SCOPE',
            resourceId: admin._id,
            metadata: { title: `Removed scope from ${admin.name}`, extra: { scopeId } }
        });

        res.status(200).json({
            success: true,
            message: 'Scope removed successfully',
            scopes: admin.scopes
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==========================================
// 8. SECTION CHANGE REQUESTS
// ==========================================
const listSectionChangeRequests = async (req, res) => {
    try {
        const { status, batchId, branchId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (batchId) query.batch = batchId;
        if (branchId) query.branch = branchId;

        const requests = await SectionChangeRequest.find(query)
            .populate('student', 'name usn email usnType usnVerified phone')
            .populate('currentSection', 'name semester')
            .populate('requestedSection', 'name semester')
            .populate('batch', 'name admissionYear')
            .populate('branch', 'name shortName code')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Error listing section change requests:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const approveSectionChangeRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { effectiveDate, adminNotes } = req.body;

        const changeReq = await SectionChangeRequest.findById(id);
        if (!changeReq) {
            return res.status(404).json({ success: false, error: 'Section change request not found' });
        }

        if (changeReq.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Request has already been ${changeReq.status.toLowerCase()}`
            });
        }

        const targetSection = await AcademicSection.findById(changeReq.requestedSection);
        if (!targetSection) {
            return res.status(404).json({ success: false, error: 'Requested target section no longer exists' });
        }

        const effDate = effectiveDate ? new Date(effectiveDate) : new Date();

        // 1. Supersede any active placement
        await AcademicPlacement.updateMany(
            { student: changeReq.student, semester: changeReq.semester, status: 'ACTIVE' },
            { status: 'SUPERSEDED', effectiveTo: effDate }
        );

        // 2. Create new active placement
        await AcademicPlacement.create({
            student: changeReq.student,
            college: changeReq.college,
            program: changeReq.program,
            batch: changeReq.batch,
            branch: changeReq.branch,
            semester: changeReq.semester,
            semesterNumber: changeReq.semesterNumber,
            section: targetSection._id,
            labBatch: changeReq.requestedLabBatch || 'B1',
            effectiveFrom: effDate,
            status: 'ACTIVE',
            placementType: 'ADMIN_OVERRIDE',
            adminReason: adminNotes || changeReq.reason
        });

        // 3. Update student account
        const student = await StudentAccount.findById(changeReq.student);
        if (student) {
            student.academicSection = targetSection._id;
            student.section = targetSection.name;
            student.sectionLocked = true;
            if (changeReq.requestedLabBatch) {
                student.labBatch = changeReq.requestedLabBatch;
                student.labBatchLocked = true;
            }
            await student.save();
        }

        // 4. Update request status
        changeReq.status = 'APPROVED';
        changeReq.effectiveDate = effDate;
        changeReq.adminNotes = adminNotes || '';
        changeReq.reviewedBy = req.user?._id || req.admin?._id;
        changeReq.reviewedAt = new Date();
        await changeReq.save();

        return res.status(200).json({
            success: true,
            message: `Section change request approved. Student moved to Section ${targetSection.name}.`,
            data: changeReq
        });
    } catch (error) {
        console.error('Error approving section change request:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const rejectSectionChangeRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, adminNotes } = req.body;

        const changeReq = await SectionChangeRequest.findById(id);
        if (!changeReq) {
            return res.status(404).json({ success: false, error: 'Section change request not found' });
        }

        if (changeReq.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Request has already been ${changeReq.status.toLowerCase()}`
            });
        }

        changeReq.status = 'REJECTED';
        changeReq.rejectionReason = rejectionReason || adminNotes || 'Request rejected by administrator';
        changeReq.adminNotes = adminNotes || '';
        changeReq.reviewedBy = req.user?._id || req.admin?._id;
        changeReq.reviewedAt = new Date();
        await changeReq.save();

        return res.status(200).json({
            success: true,
            message: 'Section change request rejected',
            data: changeReq
        });
    } catch (error) {
        console.error('Error rejecting section change request:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    // Colleges
    listColleges,
    getPrimaryCollege,
    ensureSITCollege,
    getCollegeById,
    createCollege,
    updateCollege,
    deleteCollege,
    // Schemes
    listSchemes,
    createScheme,
    updateScheme,
    deleteScheme,
    // Programs & Branches
    listPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    listBranches,
    createBranch,
    // Batches
    listBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    // Semesters
    listSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    // Sections
    listSections,
    createSection,
    updateSection,
    deleteSection,
    // Section Change Requests
    listSectionChangeRequests,
    approveSectionChangeRequest,
    rejectSectionChangeRequest,
    // Admin Scopes
    getAdminScopes,
    assignAdminScope,
    removeAdminScope
};
