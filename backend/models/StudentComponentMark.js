const mongoose = require('mongoose');

/**
 * StudentComponentMark Model (F-10 Part 1)
 * 
 * Provides flexible, normalized component-level mark storage for student evaluations.
 * Solves the architectural gap where legacy StudentCieRecord has rigid fields (test1, quiz1, etc.)
 * and cannot support dynamic administrator-defined project rubrics (SDC) or practical components (CAED).
 * 
 * - Coexists cleanly with StudentCieRecord without breaking legacy flows.
 * - Supports arbitrary component keys.
 * - Compound unique index guarantees no duplicate marks per component.
 */
const studentComponentMarkSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true,
        index: true
    },
    registeredSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentRegisteredSubject',
        default: null,
        index: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        index: true
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        required: true,
        index: true
    },
    evaluationGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicEvaluationGroup',
        default: null,
        index: true
    },
    componentKey: {
        type: String,
        required: true,
        trim: true
    },
    componentName: {
        type: String,
        default: '',
        trim: true
    },
    rawScore: {
        type: Number,
        default: null // Explicit null distinguishes unentered/missing marks from scored 0
    },
    rawMax: {
        type: Number,
        default: null,
        min: 0
    },
    isAbsent: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        enum: ['FACULTY_ENTRY', 'STUDENT_ENTRY', 'ADMIN_OVERRIDE', 'DIRECT', 'AUDIT_SIMULATION'],
        default: 'FACULTY_ENTRY'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true,
    collection: 'student_component_marks'
});

// Compound unique index: Enforces strictly one entry per student, subject, semester, and componentKey
studentComponentMarkSchema.index(
    { student: 1, subject: 1, semester: 1, componentKey: 1 },
    { unique: true }
);

// Query optimization indexes
studentComponentMarkSchema.index({ student: 1, semester: 1 });
studentComponentMarkSchema.index({ student: 1, registeredSubject: 1 });

module.exports = mongoose.models.StudentComponentMark || 
    mongoose.model('StudentComponentMark', studentComponentMarkSchema);
