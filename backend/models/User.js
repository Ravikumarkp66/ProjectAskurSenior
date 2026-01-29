const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        usn: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            match: /^[a-z0-9]{8,12}$/i // Accept 8-12 alphanumeric characters
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
            required: true,
            minlength: 6
        },
        branch: {
            type: String,
            required: true,
            enum: ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT']
        },
        currentBranch: {
            type: String,
            required: true,
            enum: ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT']
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        progress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Progress'
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
