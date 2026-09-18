/**
 * ============================================================================
 * DEPRECATED / LEGACY MODEL NOTICE
 * ============================================================================
 * AcademicCalendarItem (collection: 'academic_calendar_items') is DEPRECATED.
 * It is preserved strictly for historical audit and non-destructive backwards
 * compatibility.
 *
 * CANONICAL SOURCE OF TRUTH:
 * All active college-wide events, government holidays, institutional closures,
 * and semester-scoped events are now canonically stored and managed in:
 *    Model: CollegeEvent (models/CollegeEvent.js)
 *    Collection: college_events
 *
 * DO NOT write new operational events or holidays to this collection.
 * ============================================================================
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const academicCalendarItemSchema = new Schema({
    semester: {
        type: Schema.Types.ObjectId,
        ref: 'Semester',
        required: false,
        default: null,
        index: true
    },
    college: {
        type: Schema.Types.ObjectId,
        ref: 'College',
        required: false,
        default: null
    },
    program: {
        type: Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        default: null
    },
    batch: {
        type: Schema.Types.ObjectId,
        ref: 'AcademicBatch',
        default: null
    },
    kind: {
        type: String,
        enum: ['HOLIDAY', 'EVENT'],
        required: true,
        index: true
    },
    holidayCategory: {
        type: String,
        enum: ['GOVERNMENT', 'INSTITUTIONAL', 'RANGE', null],
        default: null
    },
    observedByCollege: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    scope: {
        type: String,
        enum: ['GLOBAL', 'BRANCH'],
        required: true,
        default: 'GLOBAL',
        index: true
    },
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        default: null,
        index: true
    },
    startDate: {
        type: Date,
        required: true,
        index: true
    },
    endDate: {
        type: Date,
        required: true,
        index: true
    },
    isAllDay: {
        type: Boolean,
        default: true
    },
    classImpact: {
        type: String,
        enum: ['NONE', 'FULL_DAY', 'TIME_RANGE'],
        default: 'NONE'
    },
    suspensionStartMinute: {
        type: Number,
        default: null
    },
    suspensionEndMinute: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Published',
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true,
    collection: 'academic_calendar_items',
    versionKey: false
});

// Indexes for typical calendar lookups & range filtering
academicCalendarItemSchema.index({ semester: 1, kind: 1, startDate: 1 });
academicCalendarItemSchema.index({ semester: 1, scope: 1, branch: 1 });
academicCalendarItemSchema.index({ holidayCategory: 1, scope: 1, startDate: 1 });

module.exports = mongoose.model('AcademicCalendarItem', academicCalendarItemSchema);
