const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.state;

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior';
        const decoded = jwt.verify(token, jwtSecret);

        // Enforce session validity (single-device & revocation checks)
        if (decoded.sessionId) {
            const { validateSession } = require('../services/sessionService');
            const sessionCheck = await validateSession(decoded.sessionId);
            if (!sessionCheck.valid) {
                return res.status(401).json({
                    error: sessionCheck.message,
                    code: sessionCheck.code,
                    sessionInvalid: true
                });
            }
            req.session = sessionCheck.session;
            req.sessionId = decoded.sessionId;
        }

        const userId = decoded.userId || decoded.id || decoded._id;
        const mongoose = require('mongoose');
        const StudentAccount = require('../models/StudentAccount');

        let user = null;
        let isStudentAccount = false;

        if (mongoose.isValidObjectId(userId)) {
            // Verify the student account exists (source of truth for students)
            const student = await StudentAccount.findById(userId).select('_id email name accountStatus registrationStatus role branch');
            
            if (student) {
                user = {
                    _id: student._id,
                    email: student.email,
                    name: student.name,
                    isSuspended: student.accountStatus === 'suspended',
                    registrationComplete: student.registrationStatus === 'completed' || student.registrationStatus === 'identity_completed' || student.registrationStatus === 'academic_completed',
                    role: student.role,
                    branch: student.branch,
                    currentBranch: student.branch,
                    isStudentAccount: true
                };
                isStudentAccount = true;
            } else {
                // Fallback to legacy User
                const legacyUser = await User.findById(userId).select('_id email name isSuspended registrationComplete role branch currentBranch');
                if (legacyUser) {
                    user = legacyUser;
                }
            }
        }

        const clientPortal = (req.headers['x-client-portal'] || '').toLowerCase();
        const isFrontendPlatform = clientPortal === 'frontend_3000';

        // Check Admin collection by email, adminId, or userId (Admins may not have a StudentAccount)
        // If request is from the main student platform, DO NOT grant admin access - treat strictly as normal student
        const Admin = require('../models/Admin');
        const tokenEmail = (decoded.email || (user ? user.email : '') || '').toLowerCase().trim();
        let adminRecord = null;

        if (!isFrontendPlatform && (tokenEmail || decoded.adminId)) {
            adminRecord = await Admin.findOne(
                decoded.adminId ? { _id: decoded.adminId } : { email: tokenEmail }
            ).populate('department');
        }

        // If this token represents an admin, check Admin status
        if (adminRecord) {
            if (adminRecord.status === 'INACTIVE') {
                return res.status(403).json({
                    error: 'Your administrator account has been disabled. Please contact a Super Administrator.'
                });
            }

            if (!user) {
                user = {
                    _id: adminRecord._id,
                    email: adminRecord.email,
                    name: adminRecord.name,
                    role: adminRecord.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'admin',
                    isAdmin: true,
                    registrationComplete: true
                };
            } else {
                user.isAdmin = true;
                user.role = adminRecord.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'admin';
                user.admin = adminRecord;
            }

            req.admin = adminRecord;
            req.isAdmin = true;
            req.isSuperAdmin = adminRecord.role === 'SUPER_ADMIN';
            req.adminRole = adminRecord.role;
            req.adminDepartment = adminRecord.department || null;
            req.adminDepartmentId = adminRecord.department?._id || null;
            req.adminDepartmentCode = adminRecord.department?.shortName || null;
            req.adminPermissions = adminRecord.permissions || {};
        }

        // Check if admin email or token is admin in legacy User
        if (!isFrontendPlatform && !user && decoded.role === 'admin' && decoded.email) {
            const adminByEmail = await User.findOne({ email: decoded.email, role: 'admin' }) ||
                                 await StudentAccount.findOne({ email: decoded.email, role: 'admin' });
            if (adminByEmail) {
                user = adminByEmail;
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'User account not found', sessionExpired: true });
        }
        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        // Restrict users with incomplete registration from accessing non-profile endpoints (exempt admins)
        if (!adminRecord && user.registrationComplete === false &&
            !req.originalUrl.includes('/complete-google-registration') &&
            !req.originalUrl.includes('/complete-profile') &&
            !req.originalUrl.includes('/profile') &&
            !req.originalUrl.includes('/me') &&
            !req.originalUrl.includes('/heartbeat') &&
            !req.originalUrl.includes('/events')) {
            return res.status(403).json({ error: 'Please complete your profile registration first.', needsCompletion: true });
        }

        req.userId = decoded.userId || user._id;
        req.userEmail = (user.email || tokenEmail || '').toLowerCase().trim();
        req.userBranch = decoded.branch || user.branch;
        req.currentBranch = decoded.currentBranch || user.currentBranch;
        req.user = user;
        if (isFrontendPlatform) {
            req.isAdmin = false;
            req.admin = null;
            if (user) {
                user.isAdmin = false;
                if (user.role === 'admin' || user.role === 'SUPER_ADMIN') {
                    user.role = 'student';
                }
            }
        } else if (!req.isAdmin) {
            req.isAdmin = !!req.admin || decoded.isAdmin || user.role === 'admin' || user.isAdmin === true;
        }

        // Background update of lastActiveAt for real-time analytics
        if (isStudentAccount) {
            const StudentAccount = require('../models/StudentAccount');
            StudentAccount.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).catch(() => {});
        } else if (user._id && !adminRecord) {
            User.findByIdAndUpdate(decoded.userId, { lastActiveAt: new Date() }).catch(() => {});
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
