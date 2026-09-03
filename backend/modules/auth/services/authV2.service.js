const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const StudentAccount = require('../../../models/StudentAccount');
const studentAccountRepository = require('../repositories/studentAccount.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const otpRepository = require('../repositories/otp.repository');
const tokenUtil = require('../utils/token');
const usnParser = require('../utils/usnParser');
const sendEmail = require('../../../utils/sendEmail');
const {
    normalizeEmail,
    validateEmail,
    normalizeName,
    validateName,
    normalizeUsn,
    validateUsn,
    getMissingProfileFields,
    isProfileComplete
} = require('../../../utils/userValidation');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const isValidObjectId = (id) => {
    if (!id) return false;
    return mongoose.Types.ObjectId.isValid(id) && (typeof id === 'object' || String(new mongoose.Types.ObjectId(id)) === String(id));
};

class AuthV2Service {
    buildPrefilled(student, email, extra = {}) {
        if (!student) {
            return {
                email,
                profilePicture: extra.profilePicture || ''
            };
        }
        const branchId = student.branch?._id || (typeof student.branch === 'object' ? student.branch._id : student.branch);
        const schemeId = student.scheme?._id || (typeof student.scheme === 'object' ? student.scheme._id : student.scheme);
        const dobStr = student.dob ? (student.dob instanceof Date ? student.dob.toISOString().split('T')[0] : String(student.dob).split('T')[0]) : '';

        return {
            email: email || student.email,
            name: validateName(normalizeName(student.name)) ? normalizeName(student.name) : (student.name || ''),
            usn: student.usn || '',
            college: student.collegeName || (student.college && typeof student.college === 'object' ? student.college.name : null) || student.college || '',
            branch: branchId ? String(branchId) : '',
            scheme: schemeId ? String(schemeId) : '',
            semester: student.semester ? String(student.semester) : '',
            dob: dobStr,
            phone: student.phone || '',
            graduationYear: student.graduationYear ? String(student.graduationYear) : '',
            profilePicture: student.profilePicture || extra.profilePicture || ''
        };
    }

    // Session Audit logging helper
    async logSessionHistory(userId, action, reqInfo = {}) {
        // Reserved for audit session logging
    }

    async generateStudentId(admissionYear) {
        try {
            const yearCode = (admissionYear || new Date().getFullYear()).toString().slice(-2);
            const prefix = `ASK${yearCode}`;
            const lastAccount = await StudentAccount.findOne({
                studentId: new RegExp(`^${prefix}\\d{5}$`)
            }).sort({ studentId: -1 });

            let sequence = 1;
            if (lastAccount && lastAccount.studentId) {
                const lastSeq = parseInt(lastAccount.studentId.replace(prefix, ''), 10);
                if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1;
                }
            }
            return `${prefix}${sequence.toString().padStart(5, '0')}`;
        } catch (e) {
            const rand = Math.floor(10000 + Math.random() * 90000);
            return `ASK${(admissionYear || new Date().getFullYear()).toString().slice(-2)}${rand}`;
        }
    }

    /**
     * Google Login Handler:
     * - Verifies Google identity and verified email
     * - Never trusts Google display name as AskUrSenior canonical name
     * - Existing complete users -> normal login
     * - Existing incomplete users -> registrationRequired with registrationToken
     * - New users -> registrationRequired with registrationToken
     * - Never performs admin checks or redirects in user flow
     */
    async loginGoogle(googleToken, traceId = 'internal', reqInfo = {}) {
        console.log(`[V2 Service][${traceId}] loginGoogle initiated`);
        let payload;
        try {
            if (googleClient) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: googleToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            } else {
                throw new Error('OAuth2Client not initialized');
            }
        } catch (err) {
            // Fallback to UserInfo endpoint if access token is supplied instead of ID token
            try {
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${googleToken}` }
                });
                payload = {
                    email: response.data.email,
                    email_verified: response.data.email_verified,
                    sub: response.data.sub,
                    picture: response.data.picture,
                    name: response.data.name
                };
            } catch (fallbackErr) {
                throw new Error('Invalid or expired Google token');
            }
        }

        if (!payload || !payload.email) {
            throw new Error('Invalid Google token profile payload');
        }

        // Security check: Google email must be verified
        if (payload.email_verified !== true && payload.email_verified !== 'true') {
            throw new Error('Unverified Google email address. Access denied.');
        }

        const email = normalizeEmail(payload.email);
        const googleId = payload.sub;

        console.log(`[V2 Service][${traceId}] loginGoogle verified email: "${email}"`);

        // Check if student exists in StudentAccount or legacy User
        let student = await studentAccountRepository.findByEmail(email, traceId);
        let legacyUser = null;

        if (!student) {
            legacyUser = await User.findOne({ email });
            if (legacyUser) {
                console.log(`[V2 Service][${traceId}] Legacy User Found for email: "${email}"`);
                student = legacyUser;
            }
        }

        if (student) {
            console.log(`[V2 Service][${traceId}] Found existing user account for email: "${email}"`);
            // Check suspension/soft deletion
            if (student.isDeleted || student.deletedAt) {
                throw new Error('This account has been deleted');
            }
            if (student.accountStatus === 'suspended' || student.isSuspended) {
                throw new Error('Your account has been suspended. Please contact support.');
            }

            const profileComplete = isProfileComplete(student);

            if (profileComplete) {
                console.log(`[V2 Service][${traceId}] Existing user profile is COMPLETE -> Normal login`);
                // Create tokens
                const accessToken = tokenUtil.signAccessToken(student);
                const refreshTokenStr = tokenUtil.signRefreshToken(student);

                // Save Refresh Token
                await refreshTokenRepository.create({
                    userId: student._id,
                    userModel: 'StudentAccount',
                    token: refreshTokenStr,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });

                // Update metadata (DO NOT overwrite name or usn with Google data)
                const updates = {
                    lastLogin: new Date(),
                    lastActive: new Date(),
                    emailVerified: true
                };
                if (!student.googleId) {
                    updates.googleId = googleId;
                    updates.authProvider = 'google';
                }
                if (payload.picture && !student.profilePicture) {
                    updates.profilePicture = payload.picture;
                }

                if (student.studentId) {
                    await studentAccountRepository.update(student._id, updates, traceId);
                } else {
                    await User.findByIdAndUpdate(student._id, {
                        lastActiveAt: new Date(),
                        googleId: student.googleId || googleId
                    });
                }

                await this.logSessionHistory(student._id, 'login_google', reqInfo);

                return {
                    registrationRequired: false,
                    accessToken,
                    refreshToken: refreshTokenStr,
                    student
                };
            } else {
                console.log(`[V2 Service][${traceId}] Existing user profile is INCOMPLETE -> registrationRequired = true`);
                const registrationToken = tokenUtil.signRegistrationToken(email, {
                    isExistingUser: true,
                    userId: student._id.toString(),
                    googleId,
                    profilePicture: student.profilePicture || payload.picture || ''
                });

                const missingFields = getMissingProfileFields(student);

                return {
                    registrationRequired: true,
                    isExistingUser: true,
                    registrationToken,
                    prefilled: this.buildPrefilled(student, email, { profilePicture: payload.picture }),
                    missingFields
                };
            }
        } else {
            console.log(`[V2 Service][${traceId}] New user account -> registrationRequired = true`);
            // New user — issue 10-minute registrationToken (DO NOT prefill name from Google display name)
            const registrationToken = tokenUtil.signRegistrationToken(email, {
                isExistingUser: false,
                googleId,
                profilePicture: payload.picture || ''
            });

            return {
                registrationRequired: true,
                isExistingUser: false,
                registrationToken,
                prefilled: {
                    email,
                    profilePicture: payload.picture || ''
                },
                missingFields: ['Name', 'USN', 'College', 'Branch', 'Scheme', 'Semester', 'DOB', 'Phone']
            };
        }
    }

    /**
     * Send OTP email verification
     */
    async loginEmail(rawEmail) {
        const email = normalizeEmail(rawEmail);
        if (!validateEmail(email)) {
            throw new Error('Please provide a valid email address');
        }

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await otpRepository.deleteOtp(email);
        await otpRepository.create(email, otp, expiresAt);

        // Send Email
        try {
            await sendEmail({
                email,
                subject: 'AskUrSenior Verification Code',
                html: `
                    <div style="background-color: #0b0a0f; color: #ffffff; padding: 40px; font-family: 'Inter', sans-serif; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid #1f1d2b;">
                        <h2 style="color: #8b5cf6; font-size: 24px; text-align: center; margin-bottom: 24px;">Verification Code</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Please use the following 6-digit security code to verify your email and sign in to AskUrSenior.</p>
                        <div style="background-color: #13121a; border: 1px solid #2c293e; border-radius: 12px; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 6px; color: #ffffff; margin: 30px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">This code is valid for the next 5 minutes. Do not share this code with anyone.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('Failed to send OTP email:', err);
            throw new Error('Failed to send verification email');
        }

        return { success: true };
    }

    /**
     * Verify OTP Handler
     */
    async verifyOtp(rawEmail, otp, traceId = 'internal', reqInfo = {}) {
        const email = normalizeEmail(rawEmail);
        console.log(`[V2 Service][${traceId}] verifyOtp checking email: "${email}"`);
        const otpRecord = await otpRepository.findValidOtp(email, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }

        // Delete OTP immediately
        await otpRepository.deleteOtp(email);

        let student = await studentAccountRepository.findByEmail(email, traceId);
        if (!student) {
            const legacyUser = await User.findOne({ email });
            if (legacyUser) {
                console.log(`[V2 Service][${traceId}] Legacy User Found for email: "${email}"`);
                student = legacyUser;
            }
        }

        if (student) {
            console.log(`[V2 Service][${traceId}] Found existing user account for email: "${email}"`);
            if (student.isDeleted || student.deletedAt) {
                throw new Error('This account has been deleted');
            }
            if (student.accountStatus === 'suspended' || student.isSuspended) {
                throw new Error('Your account has been suspended. Please contact support.');
            }

            const profileComplete = isProfileComplete(student);

            if (profileComplete) {
                console.log(`[V2 Service][${traceId}] Existing user profile is COMPLETE -> Normal login`);
                const accessToken = tokenUtil.signAccessToken(student);
                const refreshTokenStr = tokenUtil.signRefreshToken(student);

                await refreshTokenRepository.create({
                    userId: student._id,
                    userModel: 'StudentAccount',
                    token: refreshTokenStr,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });

                if (student.studentId) {
                    await studentAccountRepository.update(student._id, {
                        lastLogin: new Date(),
                        lastActive: new Date(),
                        emailVerified: true
                    }, traceId);
                } else {
                    await User.findByIdAndUpdate(student._id, {
                        lastActiveAt: new Date()
                    });
                }

                await this.logSessionHistory(student._id, 'login_email_otp', reqInfo);

                return {
                    registrationRequired: false,
                    accessToken,
                    refreshToken: refreshTokenStr,
                    student
                };
            } else {
                console.log(`[V2 Service][${traceId}] Existing user profile is INCOMPLETE -> registrationRequired = true`);
                const registrationToken = tokenUtil.signRegistrationToken(email, {
                    isExistingUser: true,
                    userId: student._id.toString(),
                    profilePicture: student.profilePicture || ''
                });

                const missingFields = getMissingProfileFields(student);

                return {
                    registrationRequired: true,
                    isExistingUser: true,
                    registrationToken,
                    prefilled: this.buildPrefilled(student, email, { profilePicture: student.profilePicture }),
                    missingFields
                };
            }
        } else {
            console.log(`[V2 Service][${traceId}] New user account -> registrationRequired = true`);
            const registrationToken = tokenUtil.signRegistrationToken(email, {
                isExistingUser: false
            });

            return {
                registrationRequired: true,
                isExistingUser: false,
                registrationToken,
                prefilled: {
                    email
                },
                missingFields: ['Name', 'USN', 'College', 'Branch', 'Scheme', 'Semester', 'DOB', 'Phone']
            };
        }
    }

    /**
     * Register User / Complete Profile Handler:
     * - Strictly normalizes & validates name (lowercase alphabetic + single spaces only)
     * - Strictly normalizes & validates USN
     * - Verified email extracted securely from registrationToken
     * - Preserves existing user data for incomplete accounts
     * - Seamlessly creates StudentAccount & User records
     */
    async registerUser({ registrationToken, name, usn, collegeName, branch, scheme, graduationYear, phone, dob, semester }, traceId = 'internal', reqInfo = {}) {
        let decoded;
        try {
            decoded = tokenUtil.verifyToken(registrationToken);
            if (decoded.type !== 'registration') {
                throw new Error('Invalid token type');
            }
        } catch (err) {
            throw new Error('Registration token is invalid or has expired. Please log in again.');
        }

        const email = normalizeEmail(decoded.email);
        if (!validateEmail(email)) {
            throw new Error('Invalid email associated with registration session');
        }

        // Strict name normalization & validation
        const cleanName = normalizeName(name);
        if (!validateName(cleanName)) {
            throw new Error('Name must contain only lowercase English letters and single spaces between words (2-50 characters)');
        }

        // Strict USN normalization & validation
        const cleanUsn = normalizeUsn(usn);
        if (!validateUsn(cleanUsn)) {
            throw new Error('Invalid USN format (e.g. 1SI23IS080)');
        }

        console.log(`[V2 Service][${traceId}] registerUser for email: "${email}", name: "${cleanName}", USN: "${cleanUsn}"`);

        // Check if USN is already used by a DIFFERENT account
        const existingStudentWithUsn = await studentAccountRepository.findByUsn(cleanUsn, traceId);
        if (existingStudentWithUsn && normalizeEmail(existingStudentWithUsn.email) !== email) {
            throw new Error('This USN is already linked to another account.');
        }

        const existingLegacyUserWithUsn = await User.findOne({ usn: cleanUsn, email: { $ne: email } });
        if (existingLegacyUserWithUsn) {
            throw new Error('This USN is already linked to another account.');
        }

        // Parse academic identity from USN parser
        const parsed = await usnParser.parseUsn(cleanUsn);
        const gradYearNum = graduationYear ? parseInt(graduationYear, 10) : (parsed?.graduationYear || (new Date().getFullYear() + 4));
        const admissionYearNum = parsed?.admissionYear || (gradYearNum - 4);
        const resolvedCollegeName = collegeName ? collegeName.trim() : (parsed?.collegeName || '');
        const validCollegeId = isValidObjectId(parsed?.collegeId) ? parsed.collegeId : undefined;

        let validBranchId = isValidObjectId(branch) ? branch : undefined;
        if (!validBranchId && branch && typeof branch === 'string') {
            const Branch = require('../../../models/Branch');
            const bDoc = await Branch.findOne({ shortName: new RegExp(`^${branch.trim()}$`, 'i') });
            if (bDoc) validBranchId = bDoc._id;
        }
        if (!validBranchId && isValidObjectId(parsed?.branchId)) {
            validBranchId = parsed.branchId;
        }

        let validSchemeId = undefined;
        const targetSchemeKey = (gradYearNum <= 2028) ? '2022' : '2025';
        const Scheme = require('../../../models/Scheme');
        let sDoc = await Scheme.findOne({ name: new RegExp(`^${targetSchemeKey}`, 'i') });
        if (!sDoc) sDoc = await Scheme.findOne({ name: targetSchemeKey });
        if (sDoc) validSchemeId = sDoc._id;

        if (!validSchemeId) {
            if (isValidObjectId(scheme)) {
                validSchemeId = scheme;
            } else if (scheme && typeof scheme === 'string') {
                const manualDoc = await Scheme.findOne({ name: new RegExp(scheme.trim(), 'i') });
                if (manualDoc) validSchemeId = manualDoc._id;
            } else if (isValidObjectId(parsed?.schemeId)) {
                validSchemeId = parsed.schemeId;
            }
        }

        // Check if student already exists in StudentAccount
        let student = await studentAccountRepository.findByEmail(email, traceId);
        let legacyUser = await User.findOne({ email });

        if (student) {
            console.log(`[V2 Service][${traceId}] Updating existing StudentAccount ID: ${student._id}`);
            const accountUpdates = {
                name: cleanName,
                usn: cleanUsn,
                collegeName: resolvedCollegeName || student.collegeName || '',
                admissionYear: admissionYearNum || student.admissionYear,
                graduationYear: gradYearNum || student.graduationYear,
                registrationStatus: 'completed',
                onboardingCompleted: true,
                profileCompletion: {
                    identity: true,
                    academic: true,
                    attendance: true
                },
                emailVerified: true,
                lastLogin: new Date(),
                lastActive: new Date()
            };
            if (validCollegeId) accountUpdates.college = validCollegeId;
            if (validBranchId) accountUpdates.branch = validBranchId;
            if (validSchemeId) accountUpdates.scheme = validSchemeId;
            if (phone) accountUpdates.phone = phone.trim();
            if (dob) accountUpdates.dob = new Date(dob);
            if (semester) accountUpdates.semester = parseInt(semester, 10);
            if (decoded.googleId && !student.googleId) {
                accountUpdates.googleId = decoded.googleId;
                accountUpdates.authProvider = 'google';
            }
            if (decoded.profilePicture && !student.profilePicture) {
                accountUpdates.profilePicture = decoded.profilePicture;
            }

            await studentAccountRepository.update(student._id, accountUpdates, traceId);
            student = await studentAccountRepository.findById(student._id, traceId);

            // Sync legacy User record if exists
            if (legacyUser) {
                try {
                    const legacyUpdate = {
                        name: cleanName,
                        usn: cleanUsn,
                        collegeName: resolvedCollegeName,
                        branch: parsed?.branchShort || legacyUser.branch || 'CS',
                        currentBranch: parsed?.branchShort || legacyUser.currentBranch || 'CS',
                        registrationComplete: true,
                        phone: phone ? phone.trim() : legacyUser.phone
                    };
                    if (dob) legacyUpdate.dob = new Date(dob);
                    await User.findByIdAndUpdate(legacyUser._id, legacyUpdate);
                } catch (uErr) {
                    console.warn(`[V2 Service][${traceId}] Non-fatal legacy user update warning: ${uErr.message}`);
                }
            }
        } else {
            console.log(`[V2 Service][${traceId}] Creating new StudentAccount for email: "${email}"`);
            const targetId = legacyUser ? legacyUser._id : undefined;
            const generatedStudentId = await this.generateStudentId(admissionYearNum);

            const studentPayload = {
                studentId: generatedStudentId,
                email,
                googleId: decoded.googleId || (legacyUser?.googleId || undefined),
                authProvider: decoded.googleId ? 'google' : 'email',
                name: cleanName,
                usn: cleanUsn,
                collegeName: resolvedCollegeName,
                admissionYear: admissionYearNum,
                graduationYear: gradYearNum,
                semester: semester ? parseInt(semester, 10) : 1,
                phone: phone ? phone.trim() : (legacyUser?.phone || ''),
                dob: dob ? new Date(dob) : undefined,
                profilePicture: decoded.profilePicture || (legacyUser?.profilePicture || ''),
                registrationStatus: 'completed',
                onboardingCompleted: true,
                profileCompletion: {
                    identity: true,
                    academic: true,
                    attendance: true
                },
                emailVerified: true,
                lastLogin: new Date(),
                lastActive: new Date()
            };
            if (targetId) studentPayload._id = targetId;
            if (validCollegeId) studentPayload.college = validCollegeId;
            if (validBranchId) studentPayload.branch = validBranchId;
            if (validSchemeId) studentPayload.scheme = validSchemeId;

            student = await studentAccountRepository.create(studentPayload, traceId);
            student = await studentAccountRepository.findById(student._id, traceId);

            // Create or update legacy User record for ecosystem consistency
            try {
                if (!legacyUser) {
                    const newUser = new User({
                        _id: student._id,
                        email,
                        name: cleanName,
                        usn: cleanUsn,
                        collegeName: resolvedCollegeName,
                        branch: parsed?.branchShort || 'CS',
                        currentBranch: parsed?.branchShort || 'CS',
                        registrationComplete: true,
                        role: 'student',
                        isAdmin: false,
                        phone: phone ? phone.trim() : ''
                    });
                    await newUser.save();
                } else {
                    await User.findByIdAndUpdate(legacyUser._id, {
                        name: cleanName,
                        usn: cleanUsn,
                        collegeName: resolvedCollegeName,
                        branch: parsed?.branchShort || legacyUser.branch || 'CS',
                        currentBranch: parsed?.branchShort || legacyUser.currentBranch || 'CS',
                        registrationComplete: true
                    });
                }
            } catch (uErr) {
                console.warn(`[V2 Service][${traceId}] Non-fatal legacy user save warning: ${uErr.message}`);
            }
        }

        const accessToken = tokenUtil.signAccessToken(student);
        const refreshTokenStr = tokenUtil.signRefreshToken(student);

        await refreshTokenRepository.create({
            userId: student._id,
            userModel: 'StudentAccount',
            token: refreshTokenStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await this.logSessionHistory(student._id, 'register_complete', reqInfo);

        return {
            accessToken,
            refreshToken: refreshTokenStr,
            student
        };
    }

    /**
     * Check USN availability and auto-detect academic metadata
     */
    async checkUsn(rawUsn) {
        const usn = normalizeUsn(rawUsn);
        if (!validateUsn(usn)) {
            throw new Error('Invalid USN format (e.g. 1SI23IS080)');
        }

        const existingStudent = await studentAccountRepository.findByUsn(usn);
        if (existingStudent) {
            return {
                available: false,
                message: 'This USN is already linked to an account.'
            };
        }

        const parsed = await usnParser.parseUsn(usn);
        if (!parsed) {
            throw new Error('Invalid USN format');
        }

        return {
            available: true,
            usn: parsed.usn,
            college: parsed.collegeName,
            branch: parsed.branchName,
            branchCode: parsed.branchShort,
            branchId: parsed.branchId ? parsed.branchId.toString() : null,
            scheme: parsed.schemeName,
            schemeId: parsed.schemeId ? parsed.schemeId.toString() : null,
            admissionYear: parsed.admissionYear,
            graduationYear: parsed.graduationYear
        };
    }

    async refreshSession(refreshTokenStr) {
        const record = await refreshTokenRepository.findByToken(refreshTokenStr);
        if (!record || record.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }

        // Revoke the old refresh token
        await refreshTokenRepository.revokeToken(refreshTokenStr);

        const student = await studentAccountRepository.findById(record.userId);
        if (!student) {
            throw new Error('Associated student account not found');
        }

        if (student.isDeleted || student.deletedAt) {
            throw new Error('This account has been deleted');
        }
        if (student.accountStatus === 'suspended') {
            throw new Error('Your account has been suspended. Please contact support.');
        }

        // Generate new rotated access/refresh tokens
        const newAccessToken = tokenUtil.signAccessToken(student);
        const newRefreshTokenStr = tokenUtil.signRefreshToken(student);

        await refreshTokenRepository.create({
            userId: student._id,
            userModel: 'StudentAccount',
            token: newRefreshTokenStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshTokenStr,
            student
        };
    }

    async logout(refreshTokenStr) {
        if (refreshTokenStr) {
            await refreshTokenRepository.revokeToken(refreshTokenStr);
        }
        return { success: true };
    }

    async recoverAccount(rawUsn) {
        const usn = normalizeUsn(rawUsn);
        const student = await studentAccountRepository.findByUsn(usn);
        if (!student) {
            throw new Error('This USN is not linked to any account.');
        }

        const email = student.email;
        
        // Obfuscate email
        const parts = email.split('@');
        const local = parts[0];
        const domain = parts[1];
        const obfuscatedLocal = local.length > 2 
            ? local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
            : local.charAt(0) + '*';
        const obfuscatedEmail = `${obfuscatedLocal}@${domain}`;

        // Create Recovery OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await otpRepository.deleteOtp(email);
        await otpRepository.create(email, otp, expiresAt);

        // Send Recovery Email
        try {
            await sendEmail({
                email,
                subject: 'AskUrSenior Account Recovery Code',
                html: `
                    <div style="background-color: #0b0a0f; color: #ffffff; padding: 40px; font-family: 'Inter', sans-serif; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid #1f1d2b;">
                        <h2 style="color: #ef4444; font-size: 24px; text-align: center; margin-bottom: 24px;">Account Recovery Request</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">A request was made to recover the AskUrSenior account linked to USN <strong>${usn}</strong>. If you made this request, please use the 6-digit OTP below to log in.</p>
                        <div style="background-color: #13121a; border: 1px solid #ef4444/30; border-radius: 12px; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 6px; color: #ffffff; margin: 30px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">This recovery code is valid for 5 minutes. If you did not request account recovery, please ignore this email.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('Failed to send recovery email:', err);
            throw new Error('Failed to send recovery verification email');
        }

        const recoveryToken = tokenUtil.signRecoveryToken(email);

        return {
            obfuscatedEmail,
            recoveryToken
        };
    }

    async verifyRecoveryOtp(recoveryToken, otp, reqInfo = {}) {
        let decoded;
        try {
            decoded = tokenUtil.verifyToken(recoveryToken);
            if (decoded.type !== 'recovery') {
                throw new Error('Invalid recovery token type');
            }
        } catch (err) {
            throw new Error('Recovery session has expired or is invalid');
        }

        const email = normalizeEmail(decoded.email);

        const otpRecord = await otpRepository.findValidOtp(email, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired recovery code');
        }

        await otpRepository.deleteOtp(email);

        const student = await studentAccountRepository.findByEmail(email);
        if (!student) {
            throw new Error('No account found for this recovery session');
        }

        if (student.isDeleted || student.deletedAt) {
            throw new Error('This account has been deleted');
        }
        if (student.accountStatus === 'suspended') {
            throw new Error('Your account has been suspended. Please contact support.');
        }

        const accessToken = tokenUtil.signAccessToken(student);
        const refreshTokenStr = tokenUtil.signRefreshToken(student);

        await refreshTokenRepository.create({
            userId: student._id,
            userModel: 'StudentAccount',
            token: refreshTokenStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await studentAccountRepository.update(student._id, {
            lastLogin: new Date(),
            lastActive: new Date()
        });

        await this.logSessionHistory(student._id, 'recover_account_otp', reqInfo);

        return {
            accessToken,
            refreshToken: refreshTokenStr,
            student
        };
    }

    async updateProfile(userId, data) {
        const student = await studentAccountRepository.findById(userId);
        if (!student) {
            throw new Error('Student account not found');
        }

        const accountUpdates = {};
        if (data.name !== undefined) {
            const cleanName = normalizeName(data.name);
            if (!validateName(cleanName)) {
                throw new Error('Name must contain only lowercase English letters and single spaces between words (2-50 characters)');
            }
            accountUpdates.name = cleanName;
        }
        if (data.phone !== undefined) accountUpdates.phone = data.phone.trim();
        if (data.bio !== undefined) accountUpdates.bio = data.bio.trim();
        if (data.profilePicture !== undefined) accountUpdates.profilePicture = data.profilePicture.trim();

        if (data.username !== undefined) {
            const trimmedUsername = data.username.toLowerCase().trim();
            if (trimmedUsername !== student.username) {
                const StudentAccount = require('../../../models/StudentAccount');
                const existing = await StudentAccount.findOne({ username: trimmedUsername, isDeleted: false });
                if (existing) {
                    throw new Error('This username is already taken');
                }
                accountUpdates.username = trimmedUsername;
            }
        }

        if (data.usn !== undefined && data.usn.trim() !== '') {
            const cleanUsn = normalizeUsn(data.usn);
            if (!validateUsn(cleanUsn)) {
                throw new Error('Invalid USN format (e.g. 1SI23IS080)');
            }
            if (cleanUsn !== student.usn) {
                const StudentAccount = require('../../../models/StudentAccount');
                const existingUsn = await StudentAccount.findOne({ usn: cleanUsn, isDeleted: false });
                if (existingUsn) {
                    throw new Error('This USN is already linked to another account');
                }
                accountUpdates.usn = cleanUsn;
            }
        }

        if (data.branch !== undefined) accountUpdates.branch = data.branch;
        if (data.scheme !== undefined) accountUpdates.scheme = data.scheme;
        if (data.graduationYear !== undefined) accountUpdates.graduationYear = parseInt(data.graduationYear, 10);
        if (data.semester !== undefined) {
            const semVal = parseInt(data.semester, 10);
            if (!isNaN(semVal) && semVal >= 1 && semVal <= 8) {
                accountUpdates.semester = semVal;
            }
        }

        if (data.socialLinks !== undefined) {
            const links = student.socialLinks || {};
            accountUpdates.socialLinks = {
                github: data.socialLinks.github !== undefined ? data.socialLinks.github.trim() : (links.github || ''),
                linkedin: data.socialLinks.linkedin !== undefined ? data.socialLinks.linkedin.trim() : (links.linkedin || ''),
                portfolio: data.socialLinks.portfolio !== undefined ? data.socialLinks.portfolio.trim() : (links.portfolio || ''),
                instagram: data.socialLinks.instagram !== undefined ? data.socialLinks.instagram.trim() : (links.instagram || ''),
                leetcode: data.socialLinks.leetcode !== undefined ? data.socialLinks.leetcode.trim() : (links.leetcode || ''),
                x: data.socialLinks.x !== undefined ? data.socialLinks.x.trim() : (links.x || '')
            };
        }

        const academicUpdates = {};
        let hasAcademicUpdates = false;

        if (data.cgpa !== undefined) {
            const cgpaVal = data.cgpa === '' || data.cgpa === null ? null : parseFloat(data.cgpa);
            if (cgpaVal !== null && (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10)) {
                throw new Error('CGPA must be a number between 0.0 and 10.0');
            }
            academicUpdates.cgpa = cgpaVal;
            hasAcademicUpdates = true;
        }

        if (data.creditsEarned !== undefined) {
            const creditsVal = data.creditsEarned === '' || data.creditsEarned === null ? null : parseInt(data.creditsEarned, 10);
            if (creditsVal !== null && (isNaN(creditsVal) || creditsVal < 0)) {
                throw new Error('Credits earned must be a non-negative number');
            }
            academicUpdates.creditsEarned = creditsVal;
            hasAcademicUpdates = true;
        }

        if (data.backlogs !== undefined) {
            const backlogsVal = data.backlogs === '' || data.backlogs === null ? null : parseInt(data.backlogs, 10);
            if (backlogsVal !== null && (isNaN(backlogsVal) || backlogsVal < 0)) {
                throw new Error('Backlogs must be a non-negative number');
            }
            academicUpdates.backlogs = backlogsVal;
            hasAcademicUpdates = true;
        }

        if (hasAcademicUpdates) {
            const academicProfileRepository = require('../repositories/academicProfile.repository');
            await academicProfileRepository.upsert(student._id, academicUpdates);
        }

        const currentProfile = await studentAccountRepository.findById(userId);
        const academicProfile = currentProfile.academicProfile || {};

        const hasCgpa = academicProfile.cgpa !== null && academicProfile.cgpa !== undefined;
        const hasCredits = academicProfile.creditsEarned !== null && academicProfile.creditsEarned !== undefined;
        const hasBacklogs = academicProfile.backlogs !== null && academicProfile.backlogs !== undefined;

        const isIdentityComplete = isProfileComplete(currentProfile);
        const isAcademicComplete = (hasCgpa && hasCredits && hasBacklogs);

        accountUpdates.profileCompletion = {
            identity: isIdentityComplete,
            academic: isAcademicComplete,
            attendance: student.profileCompletion?.attendance || false
        };

        if (isAcademicComplete && currentProfile.registrationStatus === 'identity_completed') {
            accountUpdates.registrationStatus = 'academic_completed';
        }

        const updatedStudent = await studentAccountRepository.update(userId, accountUpdates);
        return updatedStudent;
    }

    /**
     * Request OTP for changing USN
     * Dispatches OTP to target college domain email: [new_usn]@[college_domain]
     */
    async requestUsnChangeOtp(userId, rawNewUsn) {
        const student = await studentAccountRepository.findById(userId);
        if (!student) {
            throw new Error('Student account not found');
        }

        const cleanUsn = normalizeUsn(rawNewUsn);
        if (!validateUsn(cleanUsn)) {
            throw new Error('Invalid USN format (e.g. 1SI23IS080)');
        }

        if (cleanUsn === student.usn) {
            throw new Error('The new USN is identical to your current USN');
        }

        // Check 60-day cooldown
        const COOLDOWN_DAYS = 60;
        if (student.usnLastChangedAt) {
            const diffDays = Math.floor((Date.now() - new Date(student.usnLastChangedAt).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < COOLDOWN_DAYS) {
                const remaining = COOLDOWN_DAYS - diffDays;
                throw new Error(`You recently updated your USN. You can change it again in ${remaining} days.`);
            }
        }

        // Check uniqueness across other active student accounts
        const existingUsn = await StudentAccount.findOne({ usn: cleanUsn, isDeleted: false });
        if (existingUsn && existingUsn._id.toString() !== student._id.toString()) {
            throw new Error('This USN is already linked to another registered account.');
        }

        const targetEmail = usnParser.getCollegeEmailForUsn ? usnParser.getCollegeEmailForUsn(cleanUsn) : `${cleanUsn.toLowerCase()}@sit.ac.in`;
        if (!targetEmail) {
            throw new Error('Unable to resolve college domain email for the provided USN.');
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const otpKey = `usn_change_${student._id}_${cleanUsn}`;
        await otpRepository.deleteOtp(otpKey);
        await otpRepository.create(otpKey, otp, expiresAt);

        // Send Email
        try {
            await sendEmail({
                email: targetEmail,
                subject: 'AskUrSenior USN Verification Code',
                html: `
                    <div style="background-color: #0b0a0f; color: #ffffff; padding: 40px; font-family: 'Inter', sans-serif; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid #1f1d2b;">
                        <h2 style="color: #8b5cf6; font-size: 24px; text-align: center; margin-bottom: 24px;">USN Verification Code</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">A request was made to link USN <strong>${cleanUsn}</strong> to your AskUrSenior profile. Please use the 6-digit code below to verify ownership:</p>
                        <div style="background-color: #13121a; border: 1px solid #2c293e; border-radius: 12px; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 6px; color: #ffffff; margin: 30px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">This code is valid for 10 minutes. If you did not request this, please disregard this email.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('Failed to send USN OTP email:', err);
        }

        return {
            success: true,
            message: `Verification code sent to ${targetEmail}`,
            targetEmail,
            newUsn: cleanUsn
        };
    }

    /**
     * Verify OTP and apply USN change with history tracking and cooldown
     */
    async verifyUsnChangeOtp(userId, rawNewUsn, otp) {
        const student = await studentAccountRepository.findById(userId);
        if (!student) {
            throw new Error('Student account not found');
        }

        const cleanUsn = normalizeUsn(rawNewUsn);
        if (!validateUsn(cleanUsn)) {
            throw new Error('Invalid USN format (e.g. 1SI23IS080)');
        }

        const otpKey = `usn_change_${student._id}_${cleanUsn}`;
        const otpRecord = await otpRepository.findValidOtp(otpKey, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP verification code');
        }

        await otpRepository.deleteOtp(otpKey);

        const targetEmail = usnParser.getCollegeEmailForUsn ? usnParser.getCollegeEmailForUsn(cleanUsn) : `${cleanUsn.toLowerCase()}@sit.ac.in`;

        // Archive previous USN into usnHistory array
        const historyEntry = {
            usn: student.usn || '',
            changedAt: new Date(),
            verifiedEmail: targetEmail,
            method: 'college_email_otp'
        };

        const updates = {
            usn: cleanUsn,
            usnLastChangedAt: new Date(),
            $push: { usnHistory: historyEntry }
        };

        // Parse academic metadata for new USN
        const parsed = await usnParser.parseUsn(cleanUsn);
        if (parsed) {
            if (parsed.collegeName) updates.collegeName = parsed.collegeName;
            if (parsed.branchId) updates.branch = parsed.branchId;
            if (parsed.schemeId) updates.scheme = parsed.schemeId;
            if (parsed.graduationYear) updates.graduationYear = parsed.graduationYear;
            if (parsed.admissionYear) updates.admissionYear = parsed.admissionYear;
        }

        await StudentAccount.findByIdAndUpdate(student._id, updates);
        const updatedStudent = await studentAccountRepository.findById(student._id);

        return updatedStudent;
    }
}

module.exports = new AuthV2Service();
