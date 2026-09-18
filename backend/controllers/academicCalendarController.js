const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const Semester = require('../models/Semester');
const Branch = require('../models/Branch');
const AcademicBatch = require('../models/AcademicBatch');
const Admin = require('../models/Admin');
const AcademicCalendarEvent = require('../modules/academic/AcademicCalendarEvent');
const { validateAdminAccess, isScopeMatching } = require('../middleware/scopeAuthorization');

const mongoose = require('mongoose');

/**
 * Helper to auto-populate AcademicCalendarItem with existing government holidays from AcademicCalendarEvent if empty
 */
const autoImportGovernmentHolidaysIfEmpty = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return 0;
        const count = await AcademicCalendarItem.countDocuments({
            kind: 'HOLIDAY',
            holidayCategory: 'GOVERNMENT'
        });
        if (count > 0) return count;

        const legacyHolidays = await AcademicCalendarEvent.find({ category: 'holiday' }).sort({ date: 1 }).lean();
        if (!legacyHolidays || legacyHolidays.length === 0) return 0;

        // Filter out weekly non-working days (Sundays) - government holidays are official public holidays only
        const validHolidays = legacyHolidays.filter(ev => ev.title && ev.title.trim().toLowerCase() !== 'sunday');
        if (validHolidays.length === 0) return 0;

        const docs = validHolidays.map(ev => {
            const start = new Date(ev.date + 'T00:00:00.000Z');
            const end = new Date(ev.date + 'T23:59:59.999Z');
            const isObserved = ev.metadata && ev.metadata.observedByCollege !== undefined
                ? ev.metadata.observedByCollege === true
                : (ev.isActive !== false);

            return {
                title: ev.title.trim(),
                description: ev.scope === 'national' ? 'National Public Holiday' : 'State Public Holiday',
                kind: 'HOLIDAY',
                holidayCategory: 'GOVERNMENT',
                scope: 'GLOBAL',
                branch: null,
                semester: null,
                startDate: start,
                endDate: end,
                isAllDay: true,
                observedByCollege: isObserved,
                classImpact: isObserved ? 'FULL_DAY' : 'NONE',
                status: ev.isActive === false ? 'Draft' : 'Published'
            };
        });

        await AcademicCalendarItem.insertMany(docs, { ordered: false });
        return docs.length;
    } catch (err) {
        console.error('autoImportGovernmentHolidaysIfEmpty warning:', err.message);
        return 0;
    }
};

/**
 * Normalizes Date to YYYY-MM-DD string for unambiguous day-level boundary comparisons
 */
const toDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

/**
 * Helper to check if an admin is restricted to specific branch(es)
 */
const isBranchRestrictedAdmin = (admin) => {
    if (!admin || admin.role === 'SUPER_ADMIN') return false;
    return (admin.scopes || []).some(s => s.branch != null);
};

/**
 * Helper to get list of branch IDs an admin is authorized for
 */
const getAdminAuthorizedBranchIds = (admin) => {
    if (!admin || admin.role === 'SUPER_ADMIN') return null; // null means unrestricted
    const branchIds = new Set();
    for (const s of (admin.scopes || [])) {
        if (s.branch) {
            branchIds.add(String(s.branch._id || s.branch));
        }
    }
    return Array.from(branchIds);
};

// ==========================================
// 1. LIST CALENDAR ITEMS
// ==========================================
exports.listCalendarItems = async (req, res) => {
    try {
        const { semesterId, kind, holidayCategory, scope, branchId, status, observedOnly } = req.query;

        // Auto-seed government holidays from legacy repository collection if none exist
        if (holidayCategory === 'GOVERNMENT' || !semesterId) {
            await autoImportGovernmentHolidaysIfEmpty();
        }

        let baseFilter = {};

        if (semesterId) {
            const semester = await Semester.findById(semesterId);
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'Referenced official semester not found'
                });
            }

            // If user specifically requested items that cannot match global government holidays
            if (kind === 'EVENT' || scope === 'BRANCH' || branchId || (holidayCategory && holidayCategory !== 'GOVERNMENT')) {
                baseFilter.semester = semester._id;
                if (kind) baseFilter.kind = kind;
                if (holidayCategory) baseFilter.holidayCategory = holidayCategory;
                if (scope) baseFilter.scope = scope;
                if (branchId) baseFilter.branch = branchId;
            } else if (holidayCategory === 'GOVERNMENT') {
                // Only government holidays overlapping this semester
                baseFilter = {
                    kind: 'HOLIDAY',
                    holidayCategory: 'GOVERNMENT',
                    scope: 'GLOBAL',
                    startDate: { $lte: semester.endDate },
                    endDate: { $gte: semester.startDate }
                };
            } else {
                // Return items belonging to this semester OR overlapping global government holidays
                const semBranch = { semester: semester._id };
                if (kind) semBranch.kind = kind;

                const govBranch = {
                    kind: 'HOLIDAY',
                    holidayCategory: 'GOVERNMENT',
                    scope: 'GLOBAL',
                    startDate: { $lte: semester.endDate },
                    endDate: { $gte: semester.startDate }
                };
                if (observedOnly === 'true' || observedOnly === true) {
                    govBranch.observedByCollege = true;
                }

                baseFilter.$or = [semBranch, govBranch];
            }
        } else {
            // No semesterId specified - direct querying (e.g. all government holidays)
            if (kind) baseFilter.kind = kind;
            if (holidayCategory) baseFilter.holidayCategory = holidayCategory;
            if (scope) baseFilter.scope = scope;
            if (branchId) baseFilter.branch = branchId;
        }

        if (status) {
            baseFilter.status = status;
        }

        // Server-side RBAC confinement:
        // Branch-scoped admins can only see GLOBAL items + items for their authorized branch(es)
        let query = baseFilter;
        if (req.admin && req.admin.role !== 'SUPER_ADMIN') {
            const authorizedBranches = getAdminAuthorizedBranchIds(req.admin);
            if (authorizedBranches !== null) {
                // Admin is branch-scoped
                if (branchId) {
                    if (!authorizedBranches.includes(String(branchId))) {
                        return res.status(403).json({
                            success: false,
                            error: 'Forbidden: You do not have access to calendar items for this branch'
                        });
                    }
                } else {
                    const rbacFilter = {
                        $or: [
                            { scope: 'GLOBAL' },
                            { branch: { $in: authorizedBranches } }
                        ]
                    };
                    query = { $and: [baseFilter, rbacFilter] };
                }
            }
        }

        const items = await AcademicCalendarItem.find(query)
            .populate('branch', 'name shortName code')
            .populate({
                path: 'semester',
                select: 'number label startDate endDate status batch college program',
                populate: [
                    { path: 'batch', select: 'name admissionYear graduationYear' }
                ]
            })
            .populate('createdBy', 'name email')
            .sort({ startDate: 1, title: 1 });

        return res.status(200).json({
            success: true,
            data: items,
            count: items.length
        });
    } catch (err) {
        console.error('listCalendarItems error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to list academic calendar items'
        });
    }
};

// ==========================================
// 2. GET CALENDAR ITEM BY ID
// ==========================================
exports.getCalendarItemById = async (req, res) => {
    try {
        const item = await AcademicCalendarItem.findById(req.params.id)
            .populate('branch', 'name shortName code')
            .populate({
                path: 'semester',
                select: 'number label startDate endDate status batch college program',
                populate: [
                    { path: 'batch', select: 'name admissionYear graduationYear' }
                ]
            })
            .populate('createdBy', 'name email');

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Academic calendar item not found'
            });
        }

        // Check IDOR / Scoped Access
        if (req.admin && req.admin.role !== 'SUPER_ADMIN' && item.scope === 'BRANCH') {
            const authorizedBranches = getAdminAuthorizedBranchIds(req.admin);
            if (authorizedBranches && !authorizedBranches.includes(String(item.branch?._id || item.branch))) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: You do not have access to calendar items for this branch'
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: item
        });
    } catch (err) {
        console.error('getCalendarItemById error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to fetch calendar item'
        });
    }
};

// ==========================================
// 3. CREATE CALENDAR ITEM
// ==========================================
exports.createCalendarItem = async (req, res) => {
    try {
        const {
            semesterId,
            kind,
            holidayCategory,
            title,
            description,
            scope = 'GLOBAL',
            branchId,
            startDate,
            endDate,
            isAllDay = true,
            classImpact = 'NONE',
            suspensionStartMinute,
            suspensionEndMinute,
            status = 'Published',
            observedByCollege
        } = req.body;

        // 1. Basic field presence
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }
        if (!kind || !['HOLIDAY', 'EVENT'].includes(kind)) {
            return res.status(400).json({ success: false, error: 'Kind must be either HOLIDAY or EVENT' });
        }
        if (!startDate) {
            return res.status(400).json({ success: false, error: 'Start date is required' });
        }

        // 2. Date chronology & formatting
        const sDate = new Date(startDate);
        const eDate = new Date(endDate || startDate);
        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid date format' });
        }
        if (sDate > eDate) {
            return res.status(400).json({ success: false, error: 'Start date must precede or equal end date' });
        }

        const isGovHoliday = (kind === 'HOLIDAY' && holidayCategory === 'GOVERNMENT');

        let semester = null;
        let finalCollege = null;
        let finalProgram = null;
        let finalBatch = null;
        let finalBranch = null;
        let finalHolidayCat = null;
        let finalObserved = true;

        if (isGovHoliday) {
            // LAYER A: Global Government Holiday
            // Must be global
            if (scope === 'BRANCH' || branchId) {
                return res.status(400).json({
                    success: false,
                    error: 'Government holidays are global and cannot be branch-specific'
                });
            }

            // Branch-scoped admins cannot create global government holidays
            if (isBranchRestrictedAdmin(req.admin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Branch-scoped administrators cannot create Global government holidays'
                });
            }

            finalHolidayCat = 'GOVERNMENT';
            finalObserved = observedByCollege !== undefined ? Boolean(observedByCollege) : true;

            const College = require('../models/College');
            const defaultCollege = await College.findOne({ code: 'SIT' }) || await College.findOne();
            finalCollege = defaultCollege ? defaultCollege._id : null;

            if (semesterId) {
                semester = await Semester.findById(semesterId);
                if (semester) {
                    finalCollege = semester.college || finalCollege;
                    finalProgram = semester.program || null;
                    finalBatch = semester.batch || null;
                }
            }
        } else {
            // LAYER B: Institutional / Range Holidays & Calendar Events
            if (!semesterId) {
                return res.status(400).json({ success: false, error: 'Official Semester ID is required' });
            }

            semester = await Semester.findById(semesterId);
            if (!semester) {
                return res.status(404).json({ success: false, error: 'Referenced official semester not found' });
            }

            finalCollege = semester.college;
            finalProgram = semester.program;
            finalBatch = semester.batch;

            // Semester containment check
            const itemStartStr = toDateString(sDate);
            const itemEndStr = toDateString(eDate);
            const semStartStr = toDateString(semester.startDate);
            const semEndStr = toDateString(semester.endDate);

            if (itemStartStr < semStartStr || itemEndStr > semEndStr) {
                return res.status(400).json({
                    success: false,
                    error: `Calendar item dates (${itemStartStr} to ${itemEndStr}) must fall within the official semester range (${semStartStr} to ${semEndStr})`
                });
            }

            // Holiday category validation
            if (kind === 'HOLIDAY') {
                if (!holidayCategory || !['INSTITUTIONAL', 'RANGE'].includes(holidayCategory)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Holiday category is required for holidays and must be one of: INSTITUTIONAL, RANGE'
                    });
                }
                finalHolidayCat = holidayCategory;
            } else {
                finalHolidayCat = null;
            }

            // Scope & Branch Validation
            if (scope === 'GLOBAL') {
                if (branchId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Global calendar items must not specify a branch'
                    });
                }
                if (isBranchRestrictedAdmin(req.admin)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Forbidden: Branch-scoped administrators cannot create Global calendar items'
                    });
                }
                finalBranch = null;
            } else if (scope === 'BRANCH') {
                if (!branchId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Branch is required for branch-specific calendar items'
                    });
                }
                const branchDoc = await Branch.findById(branchId);
                if (!branchDoc) {
                    return res.status(404).json({ success: false, error: 'Branch not found' });
                }
                if (branchDoc.college && semester.college && String(branchDoc.college) !== String(semester.college)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Selected branch does not belong to the official semester institution context'
                    });
                }
                if (req.admin && req.admin.role !== 'SUPER_ADMIN') {
                    const targetContext = {
                        collegeId: semester.college,
                        programId: semester.program,
                        batchId: semester.batch,
                        branchId: branchDoc._id,
                        semester: semester.number
                    };
                    const access = validateAdminAccess(req.admin, targetContext, 'events', 'create');
                    if (!access.allowed) {
                        return res.status(403).json({
                            success: false,
                            error: access.reason || 'Forbidden: You do not have permission to create calendar items for this branch'
                        });
                    }
                }
                finalBranch = branchDoc._id;
            } else {
                return res.status(400).json({ success: false, error: 'Scope must be either GLOBAL or BRANCH' });
            }
        }

        // Class Impact & Suspension Minutes
        let parsedStartMin = null;
        let parsedEndMin = null;
        if (!['NONE', 'FULL_DAY', 'TIME_RANGE'].includes(classImpact)) {
            return res.status(400).json({ success: false, error: 'classImpact must be NONE, FULL_DAY, or TIME_RANGE' });
        }

        if (classImpact === 'TIME_RANGE') {
            parsedStartMin = Number(suspensionStartMinute);
            parsedEndMin = Number(suspensionEndMinute);
            if (
                isNaN(parsedStartMin) ||
                isNaN(parsedEndMin) ||
                parsedStartMin < 0 ||
                parsedEndMin > 1440 ||
                parsedStartMin >= parsedEndMin
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'TIME_RANGE suspension requires startMinute < endMinute within 0 and 1440'
                });
            }
        }

        const newItem = new AcademicCalendarItem({
            semester: semester ? semester._id : null,
            college: finalCollege,
            program: finalProgram,
            batch: finalBatch,
            kind,
            holidayCategory: finalHolidayCat,
            observedByCollege: finalObserved,
            title: title.trim(),
            description: (description || '').trim(),
            scope: isGovHoliday ? 'GLOBAL' : scope,
            branch: finalBranch,
            startDate: sDate,
            endDate: eDate,
            isAllDay: Boolean(isAllDay),
            classImpact,
            suspensionStartMinute: parsedStartMin,
            suspensionEndMinute: parsedEndMin,
            status: ['Draft', 'Published', 'Archived'].includes(status) ? status : 'Published',
            createdBy: req.admin?._id || null
        });

        await newItem.save();

        const populated = await AcademicCalendarItem.findById(newItem._id)
            .populate('branch', 'name shortName code')
            .populate('semester', 'number label startDate endDate');

        return res.status(201).json({
            success: true,
            message: `${kind === 'HOLIDAY' ? 'Holiday' : 'Calendar event'} created successfully`,
            data: populated
        });
    } catch (err) {
        console.error('createCalendarItem error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to create academic calendar item'
        });
    }
};

// ==========================================
// 4. UPDATE CALENDAR ITEM
// ==========================================
exports.updateCalendarItem = async (req, res) => {
    try {
        const item = await AcademicCalendarItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Academic calendar item not found' });
        }

        const semester = item.semester ? await Semester.findById(item.semester) : null;
        const isGovHoliday = (item.kind === 'HOLIDAY' && item.holidayCategory === 'GOVERNMENT');

        // Authorization check on EXISTING item
        if (req.admin && req.admin.role !== 'SUPER_ADMIN') {
            if (item.scope === 'GLOBAL' && isBranchRestrictedAdmin(req.admin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Branch-scoped administrators cannot edit Global calendar items'
                });
            }
            if (item.scope === 'BRANCH') {
                const existingTarget = {
                    collegeId: item.college,
                    programId: item.program,
                    batchId: item.batch,
                    branchId: item.branch,
                    semester: semester ? semester.number : null
                };
                const access = validateAdminAccess(req.admin, existingTarget, 'events', 'update');
                if (!access.allowed) {
                    return res.status(403).json({
                        success: false,
                        error: access.reason || 'Forbidden: You do not have permission to edit this item'
                    });
                }
            }
        }

        const {
            title,
            description,
            kind,
            holidayCategory,
            observedByCollege,
            scope,
            branchId,
            startDate,
            endDate,
            isAllDay,
            classImpact,
            suspensionStartMinute,
            suspensionEndMinute,
            status
        } = req.body;

        // Title
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ success: false, error: 'Title cannot be empty' });
            }
            item.title = title.trim();
        }

        if (description !== undefined) {
            item.description = description.trim();
        }

        if (observedByCollege !== undefined) {
            item.observedByCollege = Boolean(observedByCollege);
        }

        // Kind
        const nextKind = kind !== undefined ? kind : item.kind;
        if (!['HOLIDAY', 'EVENT'].includes(nextKind)) {
            return res.status(400).json({ success: false, error: 'Kind must be HOLIDAY or EVENT' });
        }
        item.kind = nextKind;

        // Holiday category
        if (nextKind === 'HOLIDAY') {
            const nextCat = holidayCategory !== undefined ? holidayCategory : item.holidayCategory;
            if (isGovHoliday) {
                // If it's a global government holiday, category remains GOVERNMENT
                item.holidayCategory = 'GOVERNMENT';
            } else {
                if (!nextCat || !['INSTITUTIONAL', 'RANGE'].includes(nextCat)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Holiday category must be one of: INSTITUTIONAL, RANGE'
                    });
                }
                item.holidayCategory = nextCat;
            }
        } else {
            item.holidayCategory = null;
        }

        // Dates & Containment
        const nextStartDate = startDate !== undefined ? new Date(startDate) : item.startDate;
        const nextEndDate = endDate !== undefined ? new Date(endDate) : item.endDate;
        if (isNaN(nextStartDate.getTime()) || isNaN(nextEndDate.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid date format' });
        }
        if (nextStartDate > nextEndDate) {
            return res.status(400).json({ success: false, error: 'Start date must precede or equal end date' });
        }

        if (semester) {
            const itemStartStr = toDateString(nextStartDate);
            const itemEndStr = toDateString(nextEndDate);
            const semStartStr = toDateString(semester.startDate);
            const semEndStr = toDateString(semester.endDate);

            if (itemStartStr < semStartStr || itemEndStr > semEndStr) {
                return res.status(400).json({
                    success: false,
                    error: `Calendar item dates (${itemStartStr} to ${itemEndStr}) must fall within the official semester range (${semStartStr} to ${semEndStr})`
                });
            }
        }
        item.startDate = nextStartDate;
        item.endDate = nextEndDate;

        if (isAllDay !== undefined) {
            item.isAllDay = Boolean(isAllDay);
        }

        // Scope & Branch verification (IDOR protection on move)
        const nextScope = scope !== undefined ? scope : item.scope;
        if (!['GLOBAL', 'BRANCH'].includes(nextScope)) {
            return res.status(400).json({ success: false, error: 'Scope must be GLOBAL or BRANCH' });
        }

        if (isGovHoliday) {
            if (nextScope === 'BRANCH' || branchId) {
                return res.status(400).json({
                    success: false,
                    error: 'Government holidays are global and cannot be branch-specific'
                });
            }
            item.scope = 'GLOBAL';
            item.branch = null;
        } else if (nextScope === 'GLOBAL') {
            if (branchId) {
                return res.status(400).json({ success: false, error: 'Global calendar items must not specify a branch' });
            }
            if (isBranchRestrictedAdmin(req.admin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Branch-scoped administrators cannot make calendar items Global'
                });
            }
            item.scope = 'GLOBAL';
            item.branch = null;
        } else {
            // BRANCH scope
            const nextBranchId = branchId !== undefined ? branchId : item.branch;
            if (!nextBranchId) {
                return res.status(400).json({ success: false, error: 'Branch is required for branch-specific calendar items' });
            }
            const branchDoc = await Branch.findById(nextBranchId);
            if (!branchDoc) {
                return res.status(404).json({ success: false, error: 'Branch not found' });
            }
            if (semester && branchDoc.college && semester.college && String(branchDoc.college) !== String(semester.college)) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected branch does not belong to the official semester institution context'
                });
            }

            // Verify authorization for destination branch scope
            if (req.admin && req.admin.role !== 'SUPER_ADMIN') {
                const destTarget = {
                    collegeId: semester ? semester.college : item.college,
                    programId: semester ? semester.program : item.program,
                    batchId: semester ? semester.batch : item.batch,
                    branchId: branchDoc._id,
                    semester: semester ? semester.number : null
                };
                const destAccess = validateAdminAccess(req.admin, destTarget, 'events', 'update');
                if (!destAccess.allowed) {
                    return res.status(403).json({
                        success: false,
                        error: destAccess.reason || 'Forbidden: You do not have permission to move items to this branch'
                    });
                }
            }
            item.scope = 'BRANCH';
            item.branch = branchDoc._id;
        }

        // Class Impact & Suspension
        const nextImpact = classImpact !== undefined ? classImpact : item.classImpact;
        if (!['NONE', 'FULL_DAY', 'TIME_RANGE'].includes(nextImpact)) {
            return res.status(400).json({ success: false, error: 'classImpact must be NONE, FULL_DAY, or TIME_RANGE' });
        }
        item.classImpact = nextImpact;

        if (nextImpact === 'TIME_RANGE') {
            const startMin = suspensionStartMinute !== undefined ? Number(suspensionStartMinute) : item.suspensionStartMinute;
            const endMin = suspensionEndMinute !== undefined ? Number(suspensionEndMinute) : item.suspensionEndMinute;
            if (
                isNaN(startMin) ||
                isNaN(endMin) ||
                startMin < 0 ||
                endMin > 1440 ||
                startMin >= endMin
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'TIME_RANGE suspension requires startMinute < endMinute within 0 and 1440'
                });
            }
            item.suspensionStartMinute = startMin;
            item.suspensionEndMinute = endMin;
        } else {
            item.suspensionStartMinute = null;
            item.suspensionEndMinute = null;
        }

        if (status !== undefined) {
            if (!['Draft', 'Published', 'Archived'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Status must be Draft, Published, or Archived' });
            }
            item.status = status;
        }

        item.updatedBy = req.admin?._id || null;
        await item.save();

        const populated = await AcademicCalendarItem.findById(item._id)
            .populate('branch', 'name shortName code')
            .populate('semester', 'number label startDate endDate');

        return res.status(200).json({
            success: true,
            message: 'Academic calendar item updated successfully',
            data: populated
        });
    } catch (err) {
        console.error('updateCalendarItem error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to update academic calendar item'
        });
    }
};

// ==========================================
// 5. DELETE CALENDAR ITEM
// ==========================================
exports.deleteCalendarItem = async (req, res) => {
    try {
        const item = await AcademicCalendarItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Academic calendar item not found' });
        }

        const semester = item.semester ? await Semester.findById(item.semester) : null;

        // RBAC check on delete
        if (req.admin && req.admin.role !== 'SUPER_ADMIN') {
            if (item.scope === 'GLOBAL' && isBranchRestrictedAdmin(req.admin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Branch-scoped administrators cannot delete Global calendar items'
                });
            }
            if (item.scope === 'BRANCH') {
                const targetContext = {
                    collegeId: item.college,
                    programId: item.program,
                    batchId: item.batch,
                    branchId: item.branch,
                    semester: semester ? semester.number : null
                };
                const access = validateAdminAccess(req.admin, targetContext, 'events', 'delete');
                if (!access.allowed) {
                    return res.status(403).json({
                        success: false,
                        error: access.reason || 'Forbidden: You do not have permission to delete this calendar item'
                    });
                }
            }
        }

        await AcademicCalendarItem.findByIdAndDelete(item._id);

        return res.status(200).json({
            success: true,
            message: 'Academic calendar item deleted successfully',
            data: { id: req.params.id }
        });
    } catch (err) {
        console.error('deleteCalendarItem error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to delete academic calendar item'
        });
    }
};

// ==========================================
// 8. SYNC GOVERNMENT HOLIDAYS FROM REPOSITORY
// ==========================================
exports.syncGovernmentHolidays = async (req, res) => {
    try {
        const legacyHolidays = await AcademicCalendarEvent.find({ category: 'holiday' }).sort({ date: 1 }).lean();
        if (!legacyHolidays || legacyHolidays.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No government holidays found in repository source.',
                importedCount: 0
            });
        }

        // Exclude weekly non-working days (Sundays) - government holidays are official public holidays only
        const validHolidays = legacyHolidays.filter(ev => ev.title && ev.title.trim().toLowerCase() !== 'sunday');
        if (validHolidays.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No valid government holidays found in repository source.',
                importedCount: 0
            });
        }

        // Clean up any stray Sunday records in AcademicCalendarItem if previously imported
        await AcademicCalendarItem.deleteMany({
            kind: 'HOLIDAY',
            holidayCategory: 'GOVERNMENT',
            title: { $regex: /^sunday$/i }
        });

        const existingGov = await AcademicCalendarItem.find({
            kind: 'HOLIDAY',
            holidayCategory: 'GOVERNMENT'
        }).lean();

        const existingMap = new Set();
        for (const item of existingGov) {
            const dateStr = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '';
            existingMap.add(`${item.title.trim().toLowerCase()}_${dateStr}`);
        }

        const toInsert = [];
        for (const ev of validHolidays) {
            const key = `${ev.title.trim().toLowerCase()}_${ev.date}`;
            if (!existingMap.has(key)) {
                const start = new Date(ev.date + 'T00:00:00.000Z');
                const end = new Date(ev.date + 'T23:59:59.999Z');
                const isObserved = ev.metadata && ev.metadata.observedByCollege !== undefined
                    ? ev.metadata.observedByCollege === true
                    : (ev.isActive !== false);

                toInsert.push({
                    title: ev.title.trim(),
                    description: ev.scope === 'national' ? 'National Public Holiday' : 'State Public Holiday',
                    kind: 'HOLIDAY',
                    holidayCategory: 'GOVERNMENT',
                    scope: 'GLOBAL',
                    branch: null,
                    semester: null,
                    startDate: start,
                    endDate: end,
                    isAllDay: true,
                    observedByCollege: isObserved,
                    classImpact: isObserved ? 'FULL_DAY' : 'NONE',
                    status: ev.isActive === false ? 'Draft' : 'Published'
                });
            }
        }

        let insertedCount = 0;
        if (toInsert.length > 0) {
            const result = await AcademicCalendarItem.insertMany(toInsert, { ordered: false });
            insertedCount = result.length;
        }

        const totalGovCount = await AcademicCalendarItem.countDocuments({
            kind: 'HOLIDAY',
            holidayCategory: 'GOVERNMENT'
        });

        return res.status(200).json({
            success: true,
            message: `Synchronized government holidays. Added ${insertedCount} new items. Total: ${totalGovCount}`,
            importedCount: insertedCount,
            totalCount: totalGovCount
        });
    } catch (err) {
        console.error('syncGovernmentHolidays error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to sync government holidays'
        });
    }
};

