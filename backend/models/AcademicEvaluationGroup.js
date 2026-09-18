const mongoose = require('mongoose');

const academicEvaluationGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Theory', 'Theory + Lab', 'Lab Only', 'Practical'],
        index: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms'
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true,
    collection: 'academic_evaluation_groups'
});

academicEvaluationGroupSchema.index({ scheme: 1, name: 1 }, { unique: true });
academicEvaluationGroupSchema.index({ scheme: 1, category: 1 });
academicEvaluationGroupSchema.index({ scheme: 1, subjects: 1 });
academicEvaluationGroupSchema.index({ subjects: 1 });

module.exports = mongoose.models.AcademicEvaluationGroup || mongoose.model('AcademicEvaluationGroup', academicEvaluationGroupSchema);
