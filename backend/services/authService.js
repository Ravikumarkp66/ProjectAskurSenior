const userRepository = require('../repositories/UserRepository');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const usnParser = require('../modules/auth/utils/usnParser');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/emailService');

const ADMIN_EMAILS = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase())
    : [];

class AuthService {
    generateToken(userId, branch, currentBranch, isAdmin, sessionId = null, expiresIn = '7d', email = null) {
        const payload = { userId, branch, currentBranch, isAdmin: !!isAdmin };
        if (email) {
            payload.email = email;
        }
        if (sessionId) {
            payload.sessionId = sessionId;
        }
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn }
        );
    }

    async getV2BranchId(legacyBranchCode) {
        if (!legacyBranchCode) return null;
        const Branch = require('../models/Branch');
        const code = legacyBranchCode.toUpperCase();
        const mappedCode = code === 'IS' ? 'ISE' : (code === 'CS' ? 'CSE' : (code === 'EC' ? 'ECE' : (code === 'EE' ? 'EEE' : (code === 'ME' ? 'ME' : (code === 'CV' ? 'CIV' : code)))));
        const v2Branch = await Branch.findOne({ shortName: mappedCode });
        return v2Branch ? v2Branch._id : null;
    }

    async registerStudent({ usn, email, password, branch }) {
        const trimmedUSN = usn.trim().toUpperCase();
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check existing student account
        const existingStudent = await StudentAccount.findOne({
            $or: [{ usn: trimmedUSN }, { email: normalizedEmail }]
        });

        if (existingStudent) {
            if (existingStudent.accountStatus === 'suspended') {
                const err = new Error('Your account has been suspended. Please contact support.');
                err.statusCode = 403;
                throw err;
            }
            const err = new Error('User already exists');
            err.statusCode = 400;
            throw err;
        }

        // Clean up legacy conflicting credentials if present
        const existingLegacyUsn = await User.findOne({ usn: trimmedUSN });
        if (existingLegacyUsn) {
            await User.updateOne({ _id: existingLegacyUsn._id }, { $unset: { usn: "", username: "" } });
        }

        const existingLegacyEmail = await User.findOne({ email: normalizedEmail });
        if (existingLegacyEmail) {
            const oldEmail = existingLegacyEmail.email.split('@')[0];
            const oldDomain = existingLegacyEmail.email.split('@')[1] || 'askursenior.org';
            const newEmailPlaceholder = `${oldEmail}_old_${Date.now()}@${oldDomain}`;
            await User.updateOne({ _id: existingLegacyEmail._id }, { 
                $set: { email: newEmailPlaceholder },
                $unset: { username: "" }
            });
        }

        const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);

        // 2. Create user record
        const user = new User({
            usn: trimmedUSN,
            email: normalizedEmail,
            password,
            branch,
            currentBranch: branch,
            isAdmin: isAdminEmail
        });
        await user.save();

        // 3. Create V2 StudentAccount
        try {
            const parsed = await usnParser.parseUsn(trimmedUSN);
            const v2BranchId = (await this.getV2BranchId(branch)) || parsed?.branchId;
            const student = new StudentAccount({
                _id: user._id,
                email: normalizedEmail,
                authProvider: 'email',
                password,
                name: normalizedEmail.split('@')[0],
                usn: trimmedUSN,
                college: parsed?.collegeId || undefined,
                branch: v2BranchId,
                scheme: parsed?.schemeId || undefined,
                admissionYear: parsed?.admissionYear || new Date().getFullYear(),
                graduationYear: parsed?.graduationYear || (new Date().getFullYear() + 4),
                registrationStatus: 'completed',
                onboardingCompleted: true,
                profileCompletion: { identity: true, academic: false, attendance: false }
            });
            await student.save();
        } catch (err) {
            console.error('Error auto-creating StudentAccount in registration:', err);
        }

        sendWelcomeEmail(user.email, user.name || user.username || 'Student')
            .catch(err => console.error('Error sending welcome email:', err));

        const token = this.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        return { user, token };
    }

    async loginStudent({ usn, password, branch, req = null }) {
        const trimmedUSN = usn.trim().toUpperCase();
        const { logLoginAttempt, createLoginSession } = require('./sessionService');
        const { getClientIp } = require('../utils/geoIpLookup');

        // 1. Search in StudentAccount
        let student = await StudentAccount.findOne({ usn: trimmedUSN, isDeleted: false })
            .populate('branch')
            .populate('scheme');

        let user;

        if (student) {
            if (student.accountStatus === 'suspended') {
                const err = new Error('Your account has been suspended. Contact AskUrSenior support.');
                err.statusCode = 403;
                throw err;
            }

            const isValidPassword = await student.comparePassword(password);
            if (!isValidPassword) {
                if (req) {
                    await logLoginAttempt({
                        email: student.email,
                        ipAddress: getClientIp(req),
                        success: false,
                        reason: 'Invalid password',
                        userAgent: req.headers['user-agent']
                    });
                }
                const err = new Error('Invalid credentials');
                err.statusCode = 401;
                throw err;
            }

            user = await User.findOne({ usn: trimmedUSN });
            if (!user) {
                user = new User({
                    _id: student._id,
                    usn: student.usn,
                    email: student.email,
                    password: password,
                    branch: branch || student.branch?._id || 'CS',
                    currentBranch: branch || student.branch?._id || 'CS',
                    isAdmin: student.role === 'admin',
                    registrationComplete: true
                });
            } else {
                if (branch && user.currentBranch !== branch) {
                    user.currentBranch = branch;
                }
            }

            student.lastLogin = new Date();
            student.lastActive = new Date();
            await student.save();

            user.lastLogin = new Date();
            user.lastActiveAt = new Date();
            await user.save();

        } else {
            // 2. Search in legacy User collection
            user = await User.findOne({ usn: trimmedUSN });
            if (!user) {
                if (req) {
                    await logLoginAttempt({
                        email: trimmedUSN,
                        ipAddress: getClientIp(req),
                        success: false,
                        reason: 'User not found',
                        userAgent: req.headers['user-agent']
                    });
                }
                const err = new Error('Invalid credentials');
                err.statusCode = 401;
                throw err;
            }

            if (user.isSuspended) {
                const err = new Error('Your account has been suspended. Contact AskUrSenior support.');
                err.statusCode = 403;
                throw err;
            }

            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                if (req) {
                    await logLoginAttempt({
                        email: user.email,
                        ipAddress: getClientIp(req),
                        success: false,
                        reason: 'Invalid password',
                        userAgent: req.headers['user-agent']
                    });
                }
                const err = new Error('Invalid credentials');
                err.statusCode = 401;
                throw err;
            }

            if (user.registrationComplete === false) {
                user.registrationComplete = true;
            }

            if (branch && user.currentBranch !== branch) {
                user.currentBranch = branch;
            }

            user.lastLogin = new Date();
            user.lastActiveAt = new Date();
            await user.save();
        }

        let sessionId = null;
        const targetDoc = student || user;
        const targetEmail = (targetDoc?.email || '').toLowerCase().trim();

        const Admin = require('../models/Admin');
        const adminDoc = await Admin.findOne({ email: targetEmail, status: 'ACTIVE' });
        const isUserAdmin = !!adminDoc || !!user.isAdmin || (student && student.role === 'admin');

        if (req) {
            const sessionResult = await createLoginSession({
                user: targetDoc,
                userType: adminDoc?.role === 'SUPER_ADMIN' ? 'super_admin' : (isUserAdmin ? 'admin' : 'student'),
                department: adminDoc?.department?._id || adminDoc?.department || targetDoc.branch?._id || targetDoc.branch || null,
                departmentCode: adminDoc?.department?.shortName || null,
                req
            });
            sessionId = sessionResult.sessionId;
        }

        user.isAdmin = isUserAdmin;
        const token = this.generateToken(user._id, user.branch, user.currentBranch, isUserAdmin, sessionId, '7d', targetEmail);

        return { user, student, token, sessionId };
    }
}

module.exports = new AuthService();
