const mongoose = require('mongoose');

/**
 * StudentEvaluationComponentRecord Model (F-10 Part 2)
 * 
 * Provides flexible, normalized component-level mark storage for student evaluations.
 * Specifically handles dynamic administrator-defined components:
 * - SDC (SDC_PHASE_1, SDC_PHASE_2, SDC_REVIEW, SDC_DEMO, SDC_VIVA)
 * - CAED (CAED_CLASSWORK, CAED_EL, CAED_TESTS)
 * - Any future evaluation components without requiring schema modifications.
 * 
 * Coexists cleanly with legacy StudentCieRecord without breaking historical data.
 */
const studentEvaluationComponentRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    registeredSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentRegisteredSubject',
        default: null,
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true,
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
    evaluationRule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicEvaluationRule',
        required: true,
        index: true
    },
    componentKey: {
        type: String,
        required: true,
        trim: true
    },
    rawMarks: {
        type: Number,
        default: null // Explicit null distinguishes unentered/missing marks from 0
    },
    maxRawMarks: {
        type: Number,
        default: null,
        min: 0
    },
    normalizedMarks: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['NOT_ENTERED', 'ENTERED', 'ABSENT', 'EXEMPT'],
        default: 'NOT_ENTERED'
    },
    isAbsent: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true,
    collection: 'student_evaluation_component_records'
});

// Idempotency: Exactly one record per student + registeredSubject + componentKey
studentEvaluationComponentRecordSchema.index(
    { student: 1, registeredSubject: 1, componentKey: 1 },
    { unique: true, partialFilterExpression: { registeredSubject: { $type: 'objectId' } } }
);

// Fallback uniqueness: Exactly one record per student + subject + semester + componentKey (when registeredSubject is null)
studentEvaluationComponentRecordSchema.index(
    { student: 1, subject: 1, semester: 1, componentKey: 1 },
    { unique: true }
);

// Fast lookups
studentEvaluationComponentRecordSchema.index({ student: 1, semester: 1 });
studentEvaluationComponentRecordSchema.index({ evaluationRule: 1 });

module.exports = mongoose.models.StudentEvaluationComponentRecord || 
    mongoose.model('StudentEvaluationComponentRecord', studentEvaluationComponentRecordSchema);
