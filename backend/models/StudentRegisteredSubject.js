const mongoose = require('mongoose');

const studentRegisteredSubjectSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },
    customName: {
        type: String,
        default: ''
    },
    customCode: {
        type: String,
        default: ''
    },
    registeredCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: String,
        enum: ['Theory', 'Theory + Lab', 'Lab Only', 'Project', 'Seminar', 'Elective'],
        default: 'Theory'
    },
    evaluationType: {
        type: String,
        enum: ['IPCC', 'THEORY_ONLY', 'LAB_ONLY', 'LOW_THEORY'],
        default: null
    },
    weeklyPlan: {
        theory: {
            required: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        lab: {
            required: {
                type: Number,
                default: 0,
                min: 0
            }
        }
    },
    defaults: {
        room: {
            type: String,
            default: ''
        },
        faculty: {
            type: String,
            default: ''
        }
    },
    baseline: {
        present: {
            type: Number,
            default: 0,
            min: 0
        },
        conducted: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    userThreshold: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    isOptional: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    semester: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    timestamps: true,
    collection: 'student_registered_subjects'
});

// Unique compound index: student + semester + subject (only enforce for non-custom subjects)
studentRegisteredSubjectSchema.index(
    { student: 1, semester: 1, subject: 1 }, 
    { unique: true, partialFilterExpression: { subject: { $type: 'objectId' } } }
);

module.exports = mongoose.models.StudentRegisteredSubject || mongoose.model('StudentRegisteredSubject', studentRegisteredSubjectSchema);
