const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collegeEventSchema = new Schema({
    college: {
        type: Schema.Types.ObjectId,
        ref: 'College',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    shortDescription: {
        type: String,
        default: '',
        trim: true
    },
    eventType: {
        type: String,
        enum: {
            values: [
                'College Event', 'Academic Event', 'Exam', 'Holiday / Closure', 'Other',
                'ACADEMIC', 'EXAM', 'REGISTRATION', 'DEADLINE', 'CAREER', 'CAMPUS', 'HOLIDAY', 'RESULT', 'GENERAL'
            ],
            message: '{VALUE} is not a supported event type'
        },
        required: [true, 'Event type is required'],
        index: true
    },
    content: {
        overview: { type: String, default: '', trim: true },
        whatHappens: { type: String, default: '', trim: true },
        whatToDo: { type: String, default: '', trim: true },
        preparationTips: { type: String, default: '', trim: true },
        importantNotes: { type: String, default: '', trim: true }
    },
    resources: [{
        title: { type: String, default: '', trim: true },
        url: { type: String, default: '', trim: true },
        type: { type: String, default: 'link', trim: true }
    }],
    priority: {
        type: String,
        enum: ['Normal', 'Important', 'Critical'],
        default: 'Normal',
        index: true
    },
    order: {
        type: Number,
        default: 0
    },
    scope: {
        type: String,
        enum: {
            values: ['GLOBAL', 'SEMESTER'],
            message: '{VALUE} is not a valid scope. Use GLOBAL or SEMESTER'
        },
        required: [true, 'Event scope is required'],
        default: 'GLOBAL',
        index: true
    },
    academicSemesterId: {
        type: Schema.Types.ObjectId,
        ref: 'Semester',
        default: null,
        index: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        index: true
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        index: true
    },
    allDay: {
        type: Boolean,
        default: true
    },
    startTime: {
        type: String, // Format "HH:mm" (24-hour)
        default: null,
        trim: true
    },
    endTime: {
        type: String, // Format "HH:mm" (24-hour)
        default: null,
        trim: true
    },
    classesSuspended: {
        type: Boolean,
        default: false,
        index: true
    },
    suspensionType: {
        type: String,
        enum: {
            values: ['none', 'full_day', 'time_range'],
            message: '{VALUE} is not a valid suspension type. Use none, full_day, or time_range'
        },
        default: 'none',
        index: true
    },
    suspensionStartTime: {
        type: String, // Format "HH:mm"
        default: null,
        trim: true
    },
    suspensionEndTime: {
        type: String, // Format "HH:mm"
        default: null,
        trim: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED', 'ARCHIVED'],
        default: 'ACTIVE',
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
    collection: 'college_events',
    versionKey: false
});

collegeEventSchema.pre('validate', function(next) {
    const isHoliday = this.eventType === 'Holiday / Closure' || this.eventType === 'HOLIDAY';
    if (this.scope === 'GLOBAL' && !isHoliday) {
        return next(new Error("GLOBAL scope is permitted only for Government Holidays ('Holiday / Closure'). All other events must be SEMESTER-scoped."));
    }
    if (this.scope === 'SEMESTER' && !this.academicSemesterId) {
        return next(new Error('academicSemesterId is required for SEMESTER-scoped events.'));
    }
    if (this.scope === 'GLOBAL' && this.academicSemesterId) {
        return next(new Error('academicSemesterId must be null for global events.'));
    }

    // Default suspension rules
    if (isHoliday) {
        this.classesSuspended = true;
        if (!this.suspensionType || this.suspensionType === 'none') {
            this.suspensionType = 'full_day';
        }
    } else if (this.suspensionType === 'full_day' || this.suspensionType === 'time_range') {
        this.classesSuspended = true;
    } else {
        this.classesSuspended = false;
        this.suspensionType = 'none';
    }

    if (this.suspensionType === 'time_range') {
        if (!this.suspensionStartTime || !this.suspensionEndTime) {
            return next(new Error('suspensionStartTime and suspensionEndTime are required for time_range class suspension.'));
        }
    }

    next();
});

// Composite indexes for common query patterns
collegeEventSchema.index({ college: 1, scope: 1, startDate: 1, endDate: 1 });
collegeEventSchema.index({ college: 1, academicSemesterId: 1, startDate: 1 });
collegeEventSchema.index({ college: 1, eventType: 1, status: 1 });

module.exports = mongoose.model('CollegeEvent', collegeEventSchema);
