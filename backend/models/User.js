const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        usn: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
            match: /^[a-z0-9]{8,12}$/i
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            minlength: 3,
            maxlength: 20
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        name: {
            type: String,
            default: ''
        },
        profilePicture: {
            type: String,
            default: ''
        },
        // OAuth fields
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        discordId: {
            type: String,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            default: null
        },
        otp: {
            type: String,
            default: null
        },
        otpExpires: {
            type: Date,
            default: null
        },
        branch: {
            type: String,
            enum: [
                'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT',
                'CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'
            ],
            default: 'CS'
        },
        currentBranch: {
            type: String,
            enum: [
                'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT',
                'CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'
            ],
            default: 'CS'
        },
        role: {
            type: String,
            enum: ['admin', 'student'],
            default: 'student'
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        registrationComplete: {
            type: Boolean,
            default: true
        },
        isSuspended: {
            type: Boolean,
            default: false
        },
        suspendedAt: Date,
        suspendedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bookmarks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }],
        semesterTimeline: {
            collegeStart: { type: Date },
            cie1: { type: Date },
            cie2: { type: Date },
            lastWorkingDay: { type: Date },
            seeStart: { type: Date },
            seeEnd: { type: Date },
            nextSem: { type: Date }
        },
        uploads: {
            type: Number,
            default: 0
        },
        score: {
            type: Number,
            default: 0
        },
        demeritPoints: {
            type: Number,
            default: 0
        },
        chatBanUntil: {
            type: Date,
            default: null
        },
        phone: {
            type: String,
            default: null
        },
        whatsappEnabled: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            enum: ['attendance', 'marks', 'balanced'],
            default: 'balanced'
        },
        todos: [{
            text: { type: String, required: true },
            done: { type: Boolean, default: false }
        }],
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        lastLogin: {
            type: Date
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        setupProgress: {
            type: String,
            enum: ['none', 'dates_done', 'subjects_done', 'timetable_done', 'complete'],
            default: 'none'
        },
        dailyAiQuestionsCount: {
            type: Number,
            default: 0
        },
        lastAiQuestionDate: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.role === 'free' || !['admin', 'student'].includes(this.role)) {
        this.role = 'student';
    }
    if (this.usn === null || this.usn === '') {
        this.usn = undefined;
    }
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
