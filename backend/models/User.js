const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: ''
        },
        usn: {
            type: String,
            unique: true,
            uppercase: true,
            sparse: true, // Allows null/missing values while maintaining uniqueness
            match: /^[a-z0-9]{8,12}$/i
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        password: {
            type: String,
            minlength: 6,
            required: function () {
                return !this.authProvider || this.authProvider === 'local';
            }
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        branch: {
            type: String,
            required: function () {
                return !this.authProvider || this.authProvider === 'local';
            },
            enum: [
                'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT',
                'CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'
            ]
        },
        currentBranch: {
            type: String,
            required: function () {
                return !this.authProvider || this.authProvider === 'local';
            },
            enum: [
                'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT',
                'CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'
            ]
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        profilePicture: {
            type: String,
            default: ''
        },
        bio: {
            type: String,
            default: '',
            maxlength: 500
        },
        socialLinks: {
            linkedin: { type: String, default: '' },
            github: { type: String, default: '' },
            leetcode: { type: String, default: '' }
        },
        resetOtp: {
            code: String,
            expiresAt: Date,
            attempts: { type: Number, default: 0 }
        },
        signupOtp: {
            code: String,
            expiresAt: Date,
            requestCount: { type: Number, default: 0 },
            lastRequestAt: Date
        },
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
