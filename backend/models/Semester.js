const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        default: null
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        default: null
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicBatch',
        default: null
    },
    number: {
        type: Number,
        required: [true, 'Semester number is required'],
        min: 1,
        max: 20
    },
    sequence: {
        type: Number,
        default: function() { return this.number; }
    },
    label: {
        type: String,
        required: [true, 'Semester label is required'],
        trim: true
    },
    termType: {
        type: String,
        enum: ['Semester', 'Trimester', 'Term', 'Yearly'],
        default: 'Semester'
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null,
        validate: {
            validator: function(val) {
                if (!val || !this.startDate) return true;
                return this.startDate < val;
            },
            message: 'Official start date must be before end date (startDate cannot be after endDate)'
        }
    },
    status: {
        type: String,
        enum: ['Active', 'Upcoming', 'Completed', 'Cancelled', 'Archived'],
        default: 'Upcoming',
        required: true
    },
    // Legacy support fields
    year: {
        type: Number,
        default: null
    }
}, {
    timestamps: true,
    collection: 'cms_semesters'
});

// Ensure unique semester number/sequence per context
semesterSchema.index({ batch: 1, number: 1 }, { unique: true, sparse: true });
semesterSchema.index({ college: 1, program: 1, batch: 1, number: 1 }, { unique: true });
semesterSchema.index({ college: 1, program: 1, batch: 1, sequence: 1 });

module.exports = mongoose.models.Semester || mongoose.model('Semester', semesterSchema);
