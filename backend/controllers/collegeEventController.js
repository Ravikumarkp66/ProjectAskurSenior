const mongoose = require('mongoose');
const CollegeEvent = require('../models/CollegeEvent');
const Semester = require('../models/Semester');
const College = require('../models/College');
const AcademicBatch = require('../models/AcademicBatch');
const AcademicProgram = require('../models/AcademicProgram');
const Admin = require('../models/Admin');
const { logActivity } = require('../services/adminActivityService');

/**
 * Helper to resolve SIT or default college record
 */
async function resolveCollege(collegeId = null) {
    if (collegeId && mongoose.Types.ObjectId.isValid(collegeId)) {
        const col = await College.findById(collegeId);
        if (col) return col;
    }
    let col = await College.findOne({ code: 'SIT' });
    if (!col) {
        col = await College.findOne();
    }
    return col;
}

/**
 * Validates HH:mm 24-hour time format
 */
function isValidTimeFormat(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return false;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr.trim());
}

/**
 * Converts HH:mm to minutes from midnight
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Validate Event Input payload
 */
async function validateEventPayload(body, isUpdate = false) {
    const errors = [];
    const {
        title,
        eventType,
        scope,
        academicSemesterId,
        startDate,
        endDate,
        allDay,
        startTime,
        endTime,
        status,
        classesSuspended,
        suspensionType,
        suspensionStartTime,
        suspensionEndTime
    } = body;

    // 1. Title validation
    if (!isUpdate || title !== undefined) {
        if (!title || typeof title !== 'string' || !title.trim()) {
            errors.push('Event title is required');
        }
    }

    // 2. Event Type validation
    const validEventTypes = [
        'College Event', 'Academic Event', 'Exam', 'Holiday / Closure', 'Other',
        'ACADEMIC', 'EXAM', 'REGISTRATION', 'DEADLINE', 'CAREER', 'CAMPUS', 'HOLIDAY', 'RESULT', 'GENERAL'
    ];
    if (!isUpdate || eventType !== undefined) {
        if (!eventType || !validEventTypes.includes(eventType)) {
            errors.push(`Event type must be one of: ${validEventTypes.join(', ')}`);
        }
    }

    // 3. Scope & Semester validation
    const validScopes = ['GLOBAL', 'SEMESTER'];
    if (!isUpdate || scope !== undefined) {
        if (!scope || !validScopes.includes(scope)) {
            errors.push(`Scope must be either 'GLOBAL' or 'SEMESTER'`);
        }
    }

    const resolvedScope = (scope || body.scope || '').toUpperCase();
    const resolvedEventType = eventType || body.eventType;

    if (resolvedScope === 'SEMESTER') {
        if (!academicSemesterId) {
            errors.push('academicSemesterId is required for semester-scoped events');
        } else if (!mongoose.Types.ObjectId.isValid(academicSemesterId)) {
            errors.push('academicSemesterId must be a valid ObjectId');
        } else {
            const semester = await Semester.findById(academicSemesterId);
            if (!semester) {
                errors.push('Referenced academic semester does not exist');
            }
        }
    } else if (resolvedScope === 'GLOBAL') {
        if (academicSemesterId && academicSemesterId !== null) {
            errors.push('academicSemesterId must be null for global events');
        }
        if (resolvedEventType && resolvedEventType !== 'Holiday / Closure' && resolvedEventType !== 'HOLIDAY') {
            errors.push('GLOBAL scope is restricted strictly to "Holiday / Closure" events');
        }
    }

    // 4. Date validation
    let startD = null;
    let endD = null;

    if (!isUpdate || startDate !== undefined) {
        if (!startDate) {
            errors.push('Start date is required');
        } else {
            startD = new Date(startDate);
            if (isNaN(startD.getTime())) {
                errors.push('Start date is invalid');
            }
        }
    }

    if (!isUpdate || endDate !== undefined) {
        if (!endDate) {
            errors.push('End date is required');
        } else {
            endD = new Date(endDate);
            if (isNaN(endD.getTime())) {
                errors.push('End date is invalid');
            }
        }
    }

    if (startD && endD) {
        if (endD < startD) {
            errors.push('End date cannot be before start date');
        }

        // 5. Timed event validation
        const isAllDay = allDay === true || allDay === 'true';
        if (!isAllDay) {
            if (startTime && !isValidTimeFormat(startTime)) {
                errors.push('Start time must be in HH:mm 24-hour format (e.g. 09:30)');
            }
            if (endTime && !isValidTimeFormat(endTime)) {
                errors.push('End time must be in HH:mm 24-hour format (e.g. 17:00)');
            }

            // If same calendar day and both times provided, end time must be after start time
            const isSameDay = startD.toISOString().slice(0, 10) === endD.toISOString().slice(0, 10);
            if (isSameDay && startTime && endTime) {
                if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
                    errors.push('End time must be strictly after start time for same-day timed events');
                }
            }
        }
    }

    // 6. Status validation
    if (status !== undefined) {
        const validStatuses = ['ACTIVE', 'CANCELLED', 'ARCHIVED'];
        if (!validStatuses.includes(status)) {
            errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
        }
    }

    // 7. Suspension validation
    const validSuspensionTypes = ['none', 'full_day', 'time_range'];
    if (suspensionType !== undefined && !validSuspensionTypes.includes(suspensionType)) {
        errors.push(`Suspension type must be one of: ${validSuspensionTypes.join(', ')}`);
    }
    if (suspensionType === 'time_range') {
        if (!suspensionStartTime || !isValidTimeFormat(suspensionStartTime)) {
            errors.push('Suspension start time must be in HH:mm 24-hour format');
        }
        if (!suspensionEndTime || !isValidTimeFormat(suspensionEndTime)) {
            errors.push('Suspension end time must be in HH:mm 24-hour format');
        }
        if (suspensionStartTime && suspensionEndTime && isValidTimeFormat(suspensionStartTime) && isValidTimeFormat(suspensionEndTime)) {
            if (timeToMinutes(suspensionEndTime) <= timeToMinutes(suspensionStartTime)) {
                errors.push('Suspension end time must be strictly after suspension start time');
            }
        }
    }

    return errors;
}

/**
 * Auto-seeds CollegeEvent from existing academic calendar items if collection is empty
 */
async function autoSeedIfEmpty(collegeId) {
    try {
        if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
        const count = await CollegeEvent.countDocuments({ college: collegeId });
        if (count > 0) return;

        const db = mongoose.connection.db;
        if (!db) return;

        const sourceItems = await db.collection('academic_calendar_items').find().toArray();
        if (!sourceItems || sourceItems.length === 0) return;

        const determineEventType = (item) => {
            const title = (item.title || '').toLowerCase();
            if (item.kind === 'HOLIDAY' || item.holidayCategory === 'GOVERNMENT') {
                return 'Holiday / Closure';
            }
            if (title.includes('test') || title.includes('exam') || title.includes('see') || title.includes('cie')) {
                return 'Exam';
            }
            if (title.includes('commencement') || title.includes('classes') || title.includes('attendance') || title.includes('submission') || title.includes('withdrawal') || title.includes('dropping')) {
                return 'Academic Event';
            }
            if (title.includes('cultural') || title.includes('spandana') || title.includes('meeting') || title.includes('sip') || title.includes('inauguration')) {
                return 'College Event';
            }
            return 'Other';
        };

        const docs = sourceItems.map(it => {
            const eventType = determineEventType(it);
            const isSemesterScope = Boolean(it.semester && mongoose.Types.ObjectId.isValid(it.semester));
            return {
                college: collegeId,
                title: (it.title || 'Untitled Event').trim(),
                description: it.description || (eventType === 'Holiday / Closure' ? 'Government Public Holiday' : ''),
                eventType,
                scope: isSemesterScope ? 'SEMESTER' : 'GLOBAL',
                academicSemesterId: isSemesterScope ? it.semester : null,
                startDate: new Date(it.startDate),
                endDate: new Date(it.endDate || it.startDate),
                allDay: it.isAllDay !== false,
                startTime: it.startTime || null,
                endTime: it.endTime || null,
                status: it.status === 'Archived' ? 'ARCHIVED' : 'ACTIVE'
            };
        });

        await CollegeEvent.insertMany(docs, { ordered: false });
    } catch (err) {
        console.warn('autoSeedIfEmpty warning:', err.message);
    }
}

// ============================================================
// 1. LIST EVENTS
// ============================================================
exports.listEvents = async (req, res) => {
    try {
        const {
            scope,
            eventType,
            status,
            academicSemesterId,
            search,
            startDate,
            endDate,
            collegeId
        } = req.query;

        const college = await resolveCollege(collegeId);
        if (!college) {
            return res.status(404).json({ success: false, error: 'College not found' });
        }

        // Auto-seed default events if empty
        await autoSeedIfEmpty(college._id);

        const filter = { college: college._id };


        if (scope && ['GLOBAL', 'SEMESTER'].includes(scope.toUpperCase())) {
            filter.scope = scope.toUpperCase();
        }

        if (eventType) {
            filter.eventType = eventType;
        }

        if (status) {
            filter.status = status.toUpperCase();
        }

        if (academicSemesterId && mongoose.Types.ObjectId.isValid(academicSemesterId)) {
            filter.academicSemesterId = academicSemesterId;
        }

        if (search && search.trim()) {
            filter.title = { $regex: search.trim(), $options: 'i' };
        }

        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) {
                dateFilter.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.$lte = new Date(endDate);
            }
            filter.startDate = dateFilter;
        }

        const events = await CollegeEvent.find(filter)
            .populate({
                path: 'academicSemesterId',
                select: 'number label startDate endDate status batch',
                populate: {
                    path: 'batch',
                    select: 'name admissionYear graduationYear academicYear status'
                }
            })
            .populate('createdBy', 'name email username')
            .populate('updatedBy', 'name email username')
            .sort({ startDate: 1, startTime: 1, createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error) {
        console.error('listEvents error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to list events'
        });
    }
};

// ============================================================
// 2. GET EVENT BY ID
// ============================================================
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid event ID' });
        }

        const event = await CollegeEvent.findById(id)
            .populate({
                path: 'academicSemesterId',
                select: 'number label startDate endDate status batch',
                populate: {
                    path: 'batch',
                    select: 'name admissionYear graduationYear academicYear status'
                }
            })
            .populate('createdBy', 'name email username')
            .populate('updatedBy', 'name email username');

        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('getEventById error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve event'
        });
    }
};

// ============================================================
// 3. CREATE EVENT
// ============================================================
exports.createEvent = async (req, res) => {
    try {
        const validationErrors = await validateEventPayload(req.body, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: validationErrors[0],
                errors: validationErrors
            });
        }

        const {
            title,
            description,
            shortDescription,
            eventType,
            scope,
            academicSemesterId,
            startDate,
            endDate,
            allDay,
            startTime,
            endTime,
            status,
            classesSuspended,
            suspensionType,
            suspensionStartTime,
            suspensionEndTime,
            content,
            resources,
            priority,
            order,
            collegeId
        } = req.body;

        const college = await resolveCollege(collegeId);
        if (!college) {
            return res.status(404).json({ success: false, error: 'College not found' });
        }

        const isAllDay = allDay !== false && allDay !== 'false';
        const eventScope = (scope || 'GLOBAL').toUpperCase();

        const suspType = suspensionType || (eventType === 'Holiday / Closure' || eventType === 'HOLIDAY' ? 'full_day' : 'none');
        const isSusp = classesSuspended !== undefined ? Boolean(classesSuspended) : (suspType !== 'none');

        const event = await CollegeEvent.create({
            college: college._id,
            title: title.trim(),
            description: (description || '').trim(),
            shortDescription: (shortDescription || description || '').trim(),
            eventType,
            scope: eventScope,
            academicSemesterId: eventScope === 'SEMESTER' ? academicSemesterId : null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            allDay: isAllDay,
            startTime: !isAllDay && startTime ? startTime.trim() : null,
            endTime: !isAllDay && endTime ? endTime.trim() : null,
            classesSuspended: isSusp,
            suspensionType: suspType,
            suspensionStartTime: suspType === 'time_range' && suspensionStartTime ? suspensionStartTime.trim() : null,
            suspensionEndTime: suspType === 'time_range' && suspensionEndTime ? suspensionEndTime.trim() : null,
            content: content || {},
            resources: Array.isArray(resources) ? resources : [],
            priority: priority || 'Normal',
            order: Number(order) || 0,
            status: status ? status.toUpperCase() : 'ACTIVE',
            createdBy: req.admin?._id || req.user?._id || null
        });

        // Populate semester and return created record
        const populated = await CollegeEvent.findById(event._id)
            .populate({
                path: 'academicSemesterId',
                select: 'number label startDate endDate status batch',
                populate: {
                    path: 'batch',
                    select: 'name admissionYear graduationYear academicYear status'
                }
            });

        // Audit log
        await logActivity({
            adminId: req.admin?._id || req.user?._id,
            adminEmail: req.admin?.email || req.user?.email || 'admin@sit.ac.in',
            adminRole: req.admin?.role || 'SUPER_ADMIN',
            action: 'CREATE',
            module: 'events',
            targetId: event._id.toString(),
            targetModel: 'CollegeEvent',
            description: `Created ${event.scope} event: "${event.title}" (${event.eventType})`,
            metadata: { eventId: event._id, eventType: event.eventType, scope: event.scope }
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: populated
        });
    } catch (error) {
        console.error('createEvent error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create event'
        });
    }
};

// ============================================================
// 4. UPDATE EVENT
// ============================================================
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid event ID' });
        }

        const existingEvent = await CollegeEvent.findById(id);
        if (!existingEvent) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        // Merge existing with updates for cross-field validation
        const mergedPayload = {
            title: req.body.title !== undefined ? req.body.title : existingEvent.title,
            eventType: req.body.eventType !== undefined ? req.body.eventType : existingEvent.eventType,
            scope: req.body.scope !== undefined ? req.body.scope : existingEvent.scope,
            academicSemesterId: req.body.academicSemesterId !== undefined ? req.body.academicSemesterId : existingEvent.academicSemesterId,
            startDate: req.body.startDate !== undefined ? req.body.startDate : existingEvent.startDate,
            endDate: req.body.endDate !== undefined ? req.body.endDate : existingEvent.endDate,
            allDay: req.body.allDay !== undefined ? req.body.allDay : existingEvent.allDay,
            startTime: req.body.startTime !== undefined ? req.body.startTime : existingEvent.startTime,
            endTime: req.body.endTime !== undefined ? req.body.endTime : existingEvent.endTime,
            status: req.body.status !== undefined ? req.body.status : existingEvent.status
        };

        const validationErrors = await validateEventPayload(mergedPayload, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: validationErrors[0],
                errors: validationErrors
            });
        }

        const eventScope = (mergedPayload.scope || 'GLOBAL').toUpperCase();
        const isAllDay = mergedPayload.allDay !== false && mergedPayload.allDay !== 'false';

        existingEvent.title = mergedPayload.title.trim();
        if (req.body.description !== undefined) {
            existingEvent.description = (req.body.description || '').trim();
        }
        if (req.body.shortDescription !== undefined) {
            existingEvent.shortDescription = (req.body.shortDescription || '').trim();
        }
        if (req.body.content !== undefined) {
            existingEvent.content = req.body.content || {};
        }
        if (req.body.resources !== undefined) {
            existingEvent.resources = Array.isArray(req.body.resources) ? req.body.resources : [];
        }
        if (req.body.priority !== undefined) {
            existingEvent.priority = req.body.priority || 'Normal';
        }
        if (req.body.order !== undefined) {
            existingEvent.order = Number(req.body.order) || 0;
        }
        existingEvent.eventType = mergedPayload.eventType;
        existingEvent.scope = eventScope;
        existingEvent.academicSemesterId = eventScope === 'SEMESTER' ? mergedPayload.academicSemesterId : null;
        existingEvent.startDate = new Date(mergedPayload.startDate);
        existingEvent.endDate = new Date(mergedPayload.endDate);
        existingEvent.allDay = isAllDay;
        existingEvent.startTime = !isAllDay && mergedPayload.startTime ? mergedPayload.startTime.trim() : null;
        existingEvent.endTime = !isAllDay && mergedPayload.endTime ? mergedPayload.endTime.trim() : null;
        if (mergedPayload.status) {
            existingEvent.status = mergedPayload.status.toUpperCase();
        }

        if (mergedPayload.suspensionType !== undefined || mergedPayload.classesSuspended !== undefined) {
            const suspType = mergedPayload.suspensionType || (mergedPayload.classesSuspended ? 'full_day' : 'none');
            existingEvent.suspensionType = suspType;
            existingEvent.classesSuspended = suspType !== 'none';
            existingEvent.suspensionStartTime = suspType === 'time_range' && mergedPayload.suspensionStartTime ? mergedPayload.suspensionStartTime.trim() : null;
            existingEvent.suspensionEndTime = suspType === 'time_range' && mergedPayload.suspensionEndTime ? mergedPayload.suspensionEndTime.trim() : null;
        }

        existingEvent.updatedBy = req.admin?._id || req.user?._id || null;

        await existingEvent.save();

        const populated = await CollegeEvent.findById(existingEvent._id)
            .populate({
                path: 'academicSemesterId',
                select: 'number label startDate endDate status batch',
                populate: {
                    path: 'batch',
                    select: 'name admissionYear graduationYear academicYear status'
                }
            });

        // Audit log
        await logActivity({
            adminId: req.admin?._id || req.user?._id,
            adminEmail: req.admin?.email || req.user?.email || 'admin@sit.ac.in',
            adminRole: req.admin?.role || 'SUPER_ADMIN',
            action: 'UPDATE',
            module: 'events',
            targetId: existingEvent._id.toString(),
            targetModel: 'CollegeEvent',
            description: `Updated event: "${existingEvent.title}" (${existingEvent.eventType})`,
            metadata: { eventId: existingEvent._id }
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: populated
        });
    } catch (error) {
        console.error('updateEvent error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to update event'
        });
    }
};

// ============================================================
// 5. DELETE / ARCHIVE EVENT
// ============================================================
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid event ID' });
        }

        const event = await CollegeEvent.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        // Check if event is archived or cancelled, or if hard deletion requested
        if (hardDelete === 'true') {
            await CollegeEvent.findByIdAndDelete(id);
            return res.status(200).json({
                success: true,
                message: 'Event permanently deleted'
            });
        }

        // Soft deletion / Archiving by default for historical integrity
        event.status = 'ARCHIVED';
        event.updatedBy = req.admin?._id || req.user?._id || null;
        await event.save();

        return res.status(200).json({
            success: true,
            message: 'Event archived successfully',
            data: event
        });
    } catch (error) {
        console.error('deleteEvent error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete event'
        });
    }
};
