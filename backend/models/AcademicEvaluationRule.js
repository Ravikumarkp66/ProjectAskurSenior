const mongoose = require('mongoose');

// Sub-schema: Manual Entry
const manualEntrySchema = new mongoose.Schema({
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true, min: 0.1 }
}, { _id: false });

// Sub-schema: Component
const evaluationComponentSchema = new mongoose.Schema({
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['ASSESSMENT', 'LAB_RECORD', 'LAB_TEST', 'PROJECT', 'PRACTICAL_EXAM', 'THEORY_EXAM', 'OTHER'],
        default: 'ASSESSMENT'
    },
    enabled: { type: Boolean, default: true },
    entryMode: {
        type: String,
        enum: ['COUNTED', 'MANUAL'],
        default: 'COUNTED'
    },
    entries: {
        count: { type: Number, default: 1, min: 1 },
        maxMarksEach: { type: Number, default: 50, min: 0.1 },
        manualEntries: [manualEntrySchema]
    },
    aggregation: {
        method: {
            type: String,
            enum: ['SUM', 'AVERAGE', 'BEST_N'],
            default: 'SUM'
        },
        bestN: { type: Number, default: null, min: 1 }
    },
    conversion: {
        enabled: { type: Boolean, default: false },
        sourceMax: { type: Number, default: null, min: 0.1 },
        targetMax: { type: Number, default: null, min: 0 }
    },
    order: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema: Eligibility Condition
const eligibilityConditionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['CIE_MIN', 'SEE_MIN', 'AGGREGATE_MIN', 'COMPONENT_MIN', 'ATTENDANCE_MIN']
    },
    componentKey: { type: String, default: null, trim: true },
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['MARKS', 'PERCENTAGE'], default: 'MARKS' },
    description: { type: String, default: '', trim: true }
}, { _id: false });

// Sub-schema: Grade Item
const gradeItemSchema = new mongoose.Schema({
    grade: { type: String, required: true, trim: true },
    minMarks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    gradePoint: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 }
}, { _id: false });

// Main Schema: AcademicEvaluationRule
const academicEvaluationRuleSchema = new mongoose.Schema({
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        required: true,
        index: true
    },
    evaluationGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicEvaluationGroup',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    status: {
        type: String,
        required: true,
        enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
        default: 'DRAFT',
        index: true
    },
    contributesToSGPA: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    cie: {
        enabled: { type: Boolean, default: true },
        components: [evaluationComponentSchema]
    },
    see: {
        enabled: { type: Boolean, default: true },
        components: [evaluationComponentSchema]
    },
    eligibility: {
        enabled: { type: Boolean, default: true },
        operator: {
            type: String,
            enum: ['AND', 'OR'],
            default: 'AND'
        },
        conditions: [eligibilityConditionSchema]
    },
    gradeScale: {
        enabled: { type: Boolean, default: true },
        type: {
            type: String,
            enum: ['MARK_RANGE', 'PASS_FAIL'],
            default: 'MARK_RANGE'
        },
        grades: [gradeItemSchema]
    }
}, {
    timestamps: true,
    collection: 'academic_evaluation_rules'
});

// Compound unique index for version per evaluationGroup
academicEvaluationRuleSchema.index({ evaluationGroup: 1, version: 1 }, { unique: true });

// Partial unique index enforcing at most ONE ACTIVE rule per evaluationGroup
academicEvaluationRuleSchema.index(
    { evaluationGroup: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

module.exports = mongoose.models.AcademicEvaluationRule || mongoose.model('AcademicEvaluationRule', academicEvaluationRuleSchema);
