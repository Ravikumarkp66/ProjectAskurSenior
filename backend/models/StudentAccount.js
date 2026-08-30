const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentAccountSchema = new mongoose.Schema({
    // Authentication
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    authProvider: {
        type: String,
        enum: ['google', 'email'],
        required: true
    },
    password: {
        type: String
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    // Identity
    studentId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        lowercase: true,
        trim: true
    },
    usn: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
    },


    // Academic Identity
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College'
    },
    collegeName: {
        type: String,
        default: ''
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme'
    },
    admissionYear: {
        type: Number
    },
    graduationYear: {
        type: Number
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        default: 1
    },
    cgpa: {
        type: Number,
        default: null,
        min: 0,
        max: 10
    },
    section: {
        type: String,
        default: 'A',
        uppercase: true,
        trim: true
    },

    // Profile
    profilePicture: {
        type: String
    },

    // Onboarding
    registrationStatus: {
        type: String,
        enum: ['pending', 'identity_completed', 'academic_completed', 'attendance_completed', 'completed'],
        default: 'pending'
    },
    onboardingCompleted: {
        type: Boolean,
        default: false
    },
    profileCompletion: {
        identity: { type: Boolean, default: false },
        academic: { type: Boolean, default: false },
        attendance: { type: Boolean, default: false }
    },

    // Account Control
    accountType: {
        type: String,
        default: 'student'
    },
    role: {
        type: String,
        default: 'student'
    },
    accountStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },

    // Metadata
    lastLogin: {
        type: Date
    },
    lastActive: {
        type: Date
    },
    phone: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    socialLinks: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        instagram: { type: String, default: '' },
        leetcode: { type: String, default: '' },
        x: { type: String, default: '' }
    }
}, {
    timestamps: true,
    collection: 'student_accounts'
});

// Indexes for fast lookup
studentAccountSchema.index({ email: 1 }, { unique: true });
studentAccountSchema.index({ usn: 1 }, { unique: true, sparse: true });
studentAccountSchema.index({ googleId: 1 }, { unique: true, sparse: true });
studentAccountSchema.index({ studentId: 1 }, { unique: true });
studentAccountSchema.index({ registrationStatus: 1 });
studentAccountSchema.index({ branch: 1 });
studentAccountSchema.index({ scheme: 1 });
studentAccountSchema.index({ college: 1 });
studentAccountSchema.index({ isDeleted: 1 });

// Pre-save/pre-validate hook to generate sequential studentId
studentAccountSchema.pre('validate', async function (next) {
    if (this.studentId) return next();

    try {
        const yearCode = (this.admissionYear || new Date().getFullYear()).toString().slice(-2);
        const prefix = `ASK${yearCode}`;

        // Query the db for the latest account matching ASKYYxxxxx using this.constructor (the model)
        const lastAccount = await this.constructor.findOne({
            studentId: new RegExp(`^${prefix}\\d{5}$`)
        }).sort({ studentId: -1 });

        let sequence = 1;
        if (lastAccount && lastAccount.studentId) {
            const lastSeq = parseInt(lastAccount.studentId.replace(prefix, ''), 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        this.studentId = `${prefix}${sequence.toString().padStart(5, '0')}`;
        next();
    } catch (error) {
        next(error);
    }
});

// Hash password before saving
studentAccountSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
studentAccountSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.StudentAccount || mongoose.model('StudentAccount', studentAccountSchema);
