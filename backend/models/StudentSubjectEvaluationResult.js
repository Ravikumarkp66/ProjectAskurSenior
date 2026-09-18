const mongoose = require('mongoose');

/**
 * Sub-schema: Evaluated Component
 * 
 * Generic component structure capable of representing any evaluation component:
 * Standard Theory, AEC, IPCC, Lab with runtime N, dynamic SDC project rubrics, CAED, etc.
 * Does NOT hardcode any pattern-specific or subject-specific component keys.
 */
const evaluatedComponentSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['ASSESSMENT', 'LAB_RECORD', 'LAB_TEST', 'PROJECT', 'PRACTICAL_EXAM', 'THEORY_EXAM', 'OTHER'],
        default: 'ASSESSMENT'
    },
    partition: {
        type: String,
        enum: ['THEORY', 'PRACTICAL', null],
        default: null
    },
    rawScore: {
        type: Number,
        default: null // Explicit null distinguishes missing/unentered marks from zero marks
    },
    rawMax: {
        type: Number,
        required: true,
        min: 0
    },
    convertedScore: {
        type: Number,
        default: null
    },
    targetMax: {
        type: Number,
        required: true,
        min: 0
    },
    isAbsent: {
        type: Boolean,
        default: false
    },
    isMissing: {
        type: Boolean,
        default: false
    },
    wasClamped: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        default: 'StudentCieRecord',
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    }
}, { _id: false });

/**
 * Sub-schema: Partition Result
 * Used for multi-partition subjects (e.g., Integrated IPCC Theory + Practical partitions).
 */
const partitionResultSchema = new mongoose.Schema({
    partition: {
        type: String,
        required: true,
        enum: ['THEORY', 'PRACTICAL']
    },
    total: {
        type: Number,
        default: null
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    minRequired: {
        type: Number,
        default: null
    },
    passed: {
        type: Boolean,
        default: true
    }
}, { _id: false });

/**
 * Sub-schema: Condition Evaluation Detail
 */
const conditionResultSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    required: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    actual: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    met: {
        type: Boolean,
        required: true
    }
}, { _id: false });

/**
 * Main Schema: StudentSubjectEvaluationResult
 * 
 * Represents the official EVALUATED RESULT OUTPUT for a student's enrolled subject.
 * - Decoupled from raw mark entry collections (StudentCieRecord, StudentSemesterResult).
 * - Stores the calculation output produced by the active AcademicEvaluationRule.
 * - Preserves complete rule version lineage so future rule edits do not retroactively alter results.
 * - Supports all 7 Scheme 2025 patterns dynamically.
 */
const studentSubjectEvaluationResultSchema = new mongoose.Schema({
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

    // Evaluation Rule & Group Snapshot (Version Tracking & Audit Lineage)
    evaluationGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicEvaluationGroup',
        required: true,
        index: true
    },
    evaluationGroupName: {
        type: String,
        default: '',
        trim: true
    },
    evaluationRule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicEvaluationRule',
        required: true,
        index: true
    },
    ruleVersion: {
        type: Number,
        required: true,
        min: 1
    },
    ruleName: {
        type: String,
        required: true,
        trim: true
    },
    pattern: {
        type: String,
        default: '',
        trim: true
    },

    // CIE Evaluated Output
    cie: {
        enabled: {
            type: Boolean,
            default: true
        },
        total: {
            type: Number,
            default: null
        },
        maxMarks: {
            type: Number,
            default: 50,
            min: 0
        },
        status: {
            type: String,
            enum: ['NOT_STARTED', 'INCOMPLETE', 'COMPLETE'],
            default: 'NOT_STARTED'
        },
        components: [evaluatedComponentSchema]
    },

    // SEE Evaluated Output (Disabled for NCMC)
    see: {
        enabled: {
            type: Boolean,
            default: true
        },
        total: {
            type: Number,
            default: null
        },
        maxMarks: {
            type: Number,
            default: 50,
            min: 0
        },
        status: {
            type: String,
            enum: ['NOT_APPLICABLE', 'PENDING', 'ENTERED', 'ABSENT'],
            default: 'PENDING'
        },
        components: [evaluatedComponentSchema]
    },

    // Partitions (e.g. IPCC Theory / Practical)
    partitions: [partitionResultSchema],

    // Aggregate (CIE + SEE)
    aggregate: {
        total: {
            type: Number,
            default: null
        },
        maxMarks: {
            type: Number,
            default: 100,
            min: 0
        },
        percentage: {
            type: Number,
            default: null
        }
    },

    // Eligibility Assessment
    eligibility: {
        eligible: {
            type: Boolean,
            default: false
        },
        passed: {
            type: Boolean,
            default: false
        },
        failedConditions: [{
            type: String,
            trim: true
        }],
        conditionResults: [conditionResultSchema]
    },

    // Final Subject Result & Grade
    result: {
        status: {
            type: String,
            enum: ['PENDING', 'PASS', 'FAIL', 'NOT_ELIGIBLE', 'COMPLETED', 'NOT_COMPLETED'],
            default: 'PENDING'
        },
        letterGrade: {
            type: String,
            default: 'PENDING',
            trim: true
        },
        gradePoint: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // SGPA Metadata (Subject-level credit & contribution weights for F-11)
    sgpa: {
        contributesToSGPA: {
            type: Boolean,
            default: true
        },
        credits: {
            type: Number,
            default: 0,
            min: 0
        },
        gradePoint: {
            type: Number,
            default: 0,
            min: 0
        },
        weightedGradePoints: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // Contextual Attendance Snapshot (For auditability & eligibility tracing)
    attendance: {
        percentage: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },
        attended: {
            type: Number,
            default: null,
            min: 0
        },
        total: {
            type: Number,
            default: null,
            min: 0
        }
    },

    // Lifecycle & Stale / Recalculation Tracking
    lifecycleStatus: {
        type: String,
        enum: ['DRAFT', 'FINALIZED'],
        default: 'DRAFT',
        index: true
    },
    finalizedAt: {
        type: Date,
        default: null
    },
    finalizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    isStale: {
        type: Boolean,
        default: false,
        index: true
    },
    staleReason: {
        type: String,
        default: null,
        trim: true
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    },
    inputsHash: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'student_subject_evaluation_results'
});

// Compound Unique Index: One evaluated result per student, subject, and semester
studentSubjectEvaluationResultSchema.index(
    { student: 1, subject: 1, semester: 1 },
    { unique: true }
);

// Query optimization indexes
studentSubjectEvaluationResultSchema.index({ student: 1, semester: 1 });
studentSubjectEvaluationResultSchema.index({ evaluationRule: 1, ruleVersion: 1 });
studentSubjectEvaluationResultSchema.index({ evaluationGroup: 1 });
studentSubjectEvaluationResultSchema.index({ isStale: 1 });

module.exports = mongoose.models.StudentSubjectEvaluationResult || 
    mongoose.model('StudentSubjectEvaluationResult', studentSubjectEvaluationResultSchema);
