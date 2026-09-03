const authService = require('../services/authService');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const studentDto = require('../modules/auth/dtos/authV2.dto');
const authV2Service = require('../modules/auth/services/authV2.service');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');
const usnParser = require('../modules/auth/utils/usnParser');
const {
    normalizeEmail,
    validateEmail,
    normalizeName,
    validateName,
    normalizeUsn,
    validateUsn,
    getMissingProfileFields,
    isProfileComplete
} = require('../utils/userValidation');

const ADMIN_EMAILS = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase())
    : [];
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
    try {
        const { usn, email, password, branch } = req.body;
        const { user, token } = await authService.registerStudent({ usn, email, password, branch });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { usn, password, branch } = req.body;
        const { user, student, token } = await authService.loginStudent({ usn, password, branch });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: true,
                onboardingCompleted: student ? !!student.onboardingCompleted : true,
                registrationStatus: student ? student.registrationStatus : 'completed'
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail, isAdmin: true });

        if (!user) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, true);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                usn: user.usn,
                branch: user.branch,
                isAdmin: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        let user = await User.findById(req.userId).select('-password');
        if (!user) {
            const StudentAccount = require('../models/StudentAccount');
            const student = await StudentAccount.findById(req.userId).populate('branch').populate('scheme');
            if (student) {
                user = {
                    _id: student._id,
                    id: student._id,
                    name: student.name,
                    usn: student.usn,
                    email: student.email,
                    studentId: student.studentId,
                    college: student.collegeName || 'Siddaganga Institute of Technology, Tumkur',
                    collegeName: student.collegeName || 'Siddaganga Institute of Technology, Tumkur',
                    branch: student.branch?.shortName || student.branch?.name || (typeof student.branch === 'string' ? student.branch : 'CS'),
                    currentBranch: student.branch?.shortName || student.branch?.name || (typeof student.branch === 'string' ? student.branch : 'CS'),
                    role: student.role || 'student',
                    isAdmin: student.role === 'admin',
                    profilePicture: student.profilePicture,
                    avatar: student.profilePicture,
                    registrationComplete: student.registrationStatus === 'completed' || student.registrationStatus === 'identity_completed' || student.registrationStatus === 'academic_completed',
                    subscription: 'free'
                };
            }
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [users, students] = await Promise.all([
            User.find().select('-password').lean(),
            StudentAccount.find().populate('branch').populate('scheme').lean()
        ]);

        const emailMap = new Map();

        // 1. Add legacy / standard users
        users.forEach(u => {
            const email = (u.email || '').toLowerCase().trim();
            if (!email) return;
            emailMap.set(email, {
                _id: u._id,
                name: u.name || '',
                email: u.email,
                usn: u.usn || '',
                collegeName: u.collegeName || '',
                branch: u.branch || 'CS',
                role: u.role || (u.isAdmin ? 'admin' : 'student'),
                isAdmin: !!u.isAdmin,
                registrationComplete: u.registrationComplete !== false,
                lastActiveAt: u.lastActiveAt || u.updatedAt,
                createdAt: u.createdAt,
                phone: u.phone || '',
                dob: u.dob
            });
        });

        // 2. Add / merge student accounts without writing copies to database
        students.forEach(s => {
            const email = (s.email || '').toLowerCase().trim();
            if (!email) return;
            const existing = emailMap.get(email);
            if (!existing) {
                emailMap.set(email, {
                    _id: s._id,
                    studentId: s.studentId,
                    name: s.name || '',
                    email: s.email,
                    usn: s.usn || '',
                    collegeName: s.collegeName || '',
                    branch: s.branch?.shortName || s.branch?.name || s.branch || 'CS',
                    scheme: s.scheme?.name || s.scheme?.year || s.scheme || '2022',
                    role: s.role || 'student',
                    isAdmin: s.role === 'admin',
                    registrationComplete: s.registrationStatus === 'completed' || !!s.onboardingCompleted,
                    lastActiveAt: s.lastActive || s.updatedAt,
                    createdAt: s.createdAt,
                    phone: s.phone || '',
                    dob: s.dob,
                    semester: s.semester,
                    graduationYear: s.graduationYear
                });
            } else {
                existing.name = s.name || existing.name;
                existing.usn = s.usn || existing.usn;
                existing.collegeName = s.collegeName || existing.collegeName;
                existing.branch = s.branch?.shortName || s.branch?.name || existing.branch;
                existing.scheme = s.scheme?.name || s.scheme?.year || existing.scheme;
                existing.phone = s.phone || existing.phone;
                existing.dob = s.dob || existing.dob;
                existing.semester = s.semester || existing.semester;
                existing.graduationYear = s.graduationYear || existing.graduationYear;
                existing.lastActiveAt = s.lastActive || existing.lastActiveAt;
                existing.registrationComplete = s.registrationStatus === 'completed' || !!s.onboardingCompleted;
            }
        });

        const userList = Array.from(emailMap.values());
        res.json({
            success: true,
            users: userList,
            count: userList.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const switchBranch = async (req, res) => {
    try {
        const { newBranch } = req.body;
        if (!newBranch) {
            return res.status(400).json({ error: 'New branch is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.currentBranch = newBranch;
        await user.save();

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Branch switched successfully',
            token,
            currentBranch: user.currentBranch
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Google authorization token is required.' });
        }

        let payload;

        // 1. Attempt ID token verification
        try {
            if (process.env.GOOGLE_CLIENT_ID) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            }
        } catch (idTokenErr) {
            // ID Token verification skipped/failed - token may be an OAuth2 access_token
        }

        // 2. Fallback to Google UserInfo endpoint for OAuth2 Access Tokens
        if (!payload) {
            try {
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                payload = {
                    email: response.data.email,
                    email_verified: response.data.email_verified,
                    sub: response.data.sub,
                    picture: response.data.picture,
                    name: response.data.name
                };
            } catch (userInfoErr) {
                console.error('Google userinfo fetch failed:', userInfoErr.response?.data || userInfoErr.message);
                return res.status(401).json({ error: 'Invalid or expired Google authorization token.' });
            }
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Unable to retrieve valid Google user profile.' });
        }

        const email = payload.email.toLowerCase();

        let user = await User.findOne({ email });
        const adminEmail = (process.env.ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();
        const isDesignatedAdmin = email === adminEmail;

        if (!user) {
            user = new User({
                email,
                name: payload.name || email.split('@')[0],
                authProvider: 'google',
                googleId: payload.sub,
                isAdmin: isDesignatedAdmin,
                role: isDesignatedAdmin ? 'admin' : 'student',
                registrationComplete: false
            });
            await user.save();
        } else {
            let changed = false;
            if (!user.googleId) {
                user.googleId = payload.sub;
                user.authProvider = 'google';
                changed = true;
            }
            if (isDesignatedAdmin && (!user.isAdmin || user.role !== 'admin')) {
                user.isAdmin = true;
                user.role = 'admin';
                changed = true;
            }
            if (changed) {
                await user.save();
            }
        }
        let student = await StudentAccount.findOne({ email, isDeleted: false });
        let profileComplete = false;
        let prefilledData = null;
        let missingFields = [];

        if (student) {
            profileComplete = isProfileComplete(student);
            missingFields = getMissingProfileFields(student);
            const branchId = student.branch?._id || student.branch;
            const schemeId = student.scheme?._id || student.scheme;
            const dobStr = student.dob ? (student.dob instanceof Date ? student.dob.toISOString().split('T')[0] : String(student.dob).split('T')[0]) : '';
            prefilledData = {
                email: student.email,
                name: validateName(normalizeName(student.name)) ? normalizeName(student.name) : (student.name || ''),
                usn: student.usn || '',
                college: student.collegeName || '',
                branch: branchId ? String(branchId) : '',
                scheme: schemeId ? String(schemeId) : '',
                semester: student.semester ? String(student.semester) : '',
                dob: dobStr,
                phone: student.phone || '',
                graduationYear: student.graduationYear ? String(student.graduationYear) : '',
                profilePicture: student.profilePicture || payload.picture || ''
            };
        } else if (user) {
            profileComplete = isProfileComplete(user);
            missingFields = getMissingProfileFields(user);
            prefilledData = {
                email: user.email,
                name: validateName(normalizeName(user.name)) ? normalizeName(user.name) : (user.name || ''),
                usn: user.usn || '',
                college: user.collegeName || '',
                branch: user.branch || '',
                phone: user.phone || '',
                dob: user.dob ? (user.dob instanceof Date ? user.dob.toISOString().split('T')[0] : String(user.dob).split('T')[0]) : '',
                profilePicture: payload.picture || ''
            };
        }

        const authToken = authService.generateToken(user._id, user.branch || 'CS', user.currentBranch || 'CS', !!user.isAdmin);
        return res.json({
            token: authToken,
            user: {
                id: (student && student._id) ? student._id : user._id,
                email: user.email,
                name: user.name || user.email.split('@')[0],
                isAdmin: !!user.isAdmin,
                role: user.role || (user.isAdmin ? 'admin' : 'student'),
                registrationComplete: profileComplete
            },
            prefilled: prefilledData,
            missingFields
        });
    } catch (error) {
        console.error('googleLogin server error:', error);
        return res.status(500).json({ error: error.message || 'Google authentication error' });
    }
};

const completeGoogleRegistration = async (req, res) => {
    try {
        const { usn, name, branch, scheme, graduationYear, collegeName, phone, dob, semester } = req.body;
        const cleanName = name ? normalizeName(name) : undefined;
        const cleanUsn = usn ? normalizeUsn(usn) : undefined;

        if (cleanName && !validateName(cleanName)) {
            return res.status(400).json({ error: 'Name must contain only lowercase English letters and single spaces (2-50 characters)' });
        }
        if (cleanUsn && !validateUsn(cleanUsn)) {
            return res.status(400).json({ error: 'Invalid USN format (e.g. 1SI23IS080)' });
        }

        let user = null;
        let student = null;

        if (req.userId && mongoose.isValidObjectId(req.userId)) {
            user = await User.findById(req.userId);
            student = await StudentAccount.findById(req.userId);
        }

        const effectiveEmail = req.user?.email || user?.email || student?.email;
        if (!student && effectiveEmail) {
            student = await StudentAccount.findOne({ email: effectiveEmail });
        }
        if (!user && effectiveEmail) {
            user = await User.findOne({ email: effectiveEmail });
        }

        if (!user && !student) {
            return res.status(404).json({ error: 'User account not found' });
        }

        const email = effectiveEmail || user?.email || student?.email;
        let parsed = null;
        if (cleanUsn) {
            try {
                parsed = await usnParser.parseUsn(cleanUsn);
            } catch (pErr) {}
        }

        const Branch = require('../models/Branch');
        const Scheme = require('../models/Scheme');

        let resolvedBranchId = isValidObjectId(branch) ? branch : undefined;
        if (!resolvedBranchId && branch && typeof branch === 'string') {
            const bDoc = await Branch.findOne({ shortName: new RegExp(`^${branch.trim()}$`, 'i') });
            if (bDoc) resolvedBranchId = bDoc._id;
        }
        if (!resolvedBranchId && isValidObjectId(parsed?.branchId)) {
            resolvedBranchId = parsed.branchId;
        }

        let resolvedSchemeId = undefined;
        const gradYearInt = graduationYear ? parseInt(graduationYear, 10) : (parsed?.graduationYear || 2027);
        const targetSchemeKey = gradYearInt <= 2028 ? '2022' : '2025';
        let sDoc = await Scheme.findOne({ name: new RegExp(`^${targetSchemeKey}`, 'i') });
        if (!sDoc) sDoc = await Scheme.findOne({ name: targetSchemeKey });
        if (sDoc) resolvedSchemeId = sDoc._id;

        if (!resolvedSchemeId) {
            if (isValidObjectId(scheme)) {
                resolvedSchemeId = scheme;
            } else if (scheme && typeof scheme === 'string') {
                const manualDoc = await Scheme.findOne({ name: new RegExp(scheme.trim(), 'i') });
                if (manualDoc) resolvedSchemeId = manualDoc._id;
            } else if (isValidObjectId(parsed?.schemeId)) {
                resolvedSchemeId = parsed.schemeId;
            }
        }

        // 1. Update or Create StudentAccount (if registering as a Student)
        if (student) {
            if (cleanName) student.name = cleanName;
            if (cleanUsn) student.usn = cleanUsn;
            if (collegeName) student.collegeName = collegeName.trim();
            if (resolvedBranchId) student.branch = resolvedBranchId;
            if (resolvedSchemeId) student.scheme = resolvedSchemeId;
            if (phone) student.phone = phone.trim();
            if (dob) student.dob = new Date(dob);
            if (semester) student.semester = parseInt(semester, 10);
            if (graduationYear) student.graduationYear = parseInt(graduationYear, 10);
            if (!student.authProvider) student.authProvider = 'google';
            if (!student.studentId) {
                student.studentId = await authV2Service.generateStudentId(parsed?.admissionYear);
            }
            student.registrationStatus = 'completed';
            student.onboardingCompleted = true;
            student.lastActive = new Date();
            await student.save();
        } else if (user) {
            if (cleanName) user.name = cleanName;
            if (cleanUsn) user.usn = cleanUsn;
            if (collegeName) user.collegeName = collegeName.trim();
            if (resolvedBranchId) {
                user.branch = resolvedBranchId;
                user.currentBranch = resolvedBranchId;
            }
            if (phone) user.phone = phone.trim();
            if (dob) user.dob = new Date(dob);
            user.registrationComplete = true;
            await user.save();
        } else if (email) {
            const studentId = await authV2Service.generateStudentId(parsed?.admissionYear);
            student = new StudentAccount({
                email,
                studentId,
                authProvider: 'google',
                googleId: req.user?.googleId || undefined,
                name: cleanName || 'student',
                usn: cleanUsn || '',
                college: parsed?.collegeId,
                collegeName: collegeName ? collegeName.trim() : (parsed?.collegeName || ''),
                branch: resolvedBranchId || parsed?.branchId,
                scheme: resolvedSchemeId || parsed?.schemeId,
                admissionYear: parsed?.admissionYear || (new Date().getFullYear()),
                graduationYear: graduationYear ? parseInt(graduationYear, 10) : (parsed?.graduationYear || (new Date().getFullYear() + 4)),
                semester: semester ? parseInt(semester, 10) : 1,
                phone: phone ? phone.trim() : '',
                dob: dob ? new Date(dob) : undefined,
                profilePicture: req.user?.profilePicture || '',
                registrationStatus: 'completed',
                onboardingCompleted: true,
                emailVerified: true,
                lastLogin: new Date(),
                lastActive: new Date()
            });
            await student.save();
        }

        const finalUserId = (student && student._id) ? student._id : (user && user._id ? user._id : req.userId);
        const finalBranch = student?.branch || user?.branch || 'CS';
        const finalCurrentBranch = user?.currentBranch || student?.branch || 'CS';
        const isAdmin = !!(user?.isAdmin || student?.role === 'admin');

        const token = authService.generateToken(finalUserId, finalBranch, finalCurrentBranch, isAdmin, '30d');
        const userObj = {
            id: finalUserId,
            _id: finalUserId,
            email: email,
            name: cleanName || student?.name || user?.name || 'student',
            usn: cleanUsn || student?.usn || user?.usn || '',
            collegeName: collegeName || student?.collegeName || user?.collegeName || '',
            branch: finalBranch,
            registrationComplete: true,
            role: isAdmin ? 'admin' : 'student'
        };

        return res.json({
            success: true,
            message: 'Registration completed successfully',
            token,
            user: userObj,
            data: {
                accessToken: token,
                student: student ? studentDto.toStudentResponseDto(student) : userObj
            }
        });
    } catch (error) {
        console.error('completeGoogleRegistration error:', error);
        return res.status(500).json({ error: error.message || 'Failed to complete registration' });
    }
};

const heartbeat = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { lastActiveAt: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!validateEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await OTP.create({ email: normalizedEmail, otp: otpCode, expiresAt });
        await sendEmail({ email: normalizedEmail, subject: 'Your OTP Code', message: `Your OTP code is: ${otpCode}` });
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const otpRecord = await OTP.findOne({ email: normalizedEmail, otp }).sort({ createdAt: -1 });

        if (!otpRecord || (otpRecord.expiresAt && otpRecord.expiresAt < new Date())) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);
        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSemesterTimeline = async (req, res) => {
    try {
        res.json({ success: true, message: 'Timeline updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    googleLogin,
    completeGoogleRegistration,
    heartbeat,
    ADMIN_EMAILS,
    sendOtp,
    verifyOtp,
    updateSemesterTimeline
};
