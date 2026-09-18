const mongoose = require('mongoose');

const academicBatchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Batch name is required'],
        trim: true
    },
    admissionYear: {
        type: Number,
        required: [true, 'Admission year is required'],
        min: 1950,
        max: 2100
    },
    graduationYear: {
        type: Number,
        required: [true, 'Graduation year is required'],
        min: 1950,
        max: 2100,
        validate: {
            validator: function(val) {
                if (!val || !this.admissionYear) return true;
                return val > this.admissionYear;
            },
            message: 'Graduation year must be after admission year'
        }
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: [true, 'College reference is required']
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        required: [true, 'Program reference is required']
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null,
        description: 'Optional; null for single-cohort programs (e.g. MCA)'
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Graduated', 'Archived'],
        default: 'Active',
        required: true
    }
}, {
    timestamps: true,
    collection: 'academic_batches'
});

academicBatchSchema.index({ college: 1, program: 1, branch: 1, admissionYear: 1 }, { unique: true });
academicBatchSchema.index({ college: 1, status: 1 });

module.exports = mongoose.models.AcademicBatch || mongoose.model('AcademicBatch', academicBatchSchema);
