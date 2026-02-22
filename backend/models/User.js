const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        usn: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
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
        password: {
            type: String,
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
            enum: ['free', 'premium', 'admin'],
            default: 'free'
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        registrationComplete: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
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
