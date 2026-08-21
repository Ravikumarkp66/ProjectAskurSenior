const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../../../models/User');
const studentAccountRepository = require('../repositories/studentAccount.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const otpRepository = require('../repositories/otp.repository');
const tokenUtil = require('../utils/token');
const usnParser = require('../utils/usnParser');
const sendEmail = require('../../../utils/sendEmail');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

class AuthV2Service {
    // Session Audit logging helper placeholder
    async logSessionHistory(userId, action, reqInfo = {}) {
        // TODO: Create LoginHistory entry after successful authentication
        // console.log(`[Audit] User ${userId} performed ${action} from IP: ${reqInfo.ip}`);
    }

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

        const email = payload.email.toLowerCase().trim();
        const googleId = payload.sub;

        console.log(`[V2 Service][${traceId}] loginGoogle verified email: "${email}"`);
        const student = await studentAccountRepository.findByEmail(email, traceId);

        if (student) {
            console.log(`[V2 Service][${traceId}] StudentAccount Found: studentId: ${student.studentId}, returning registrationRequired = false`);
            // Check suspension/soft deletion
            if (student.isDeleted || student.deletedAt) {
                throw new Error('This account has been deleted');
            }
            if (student.accountStatus === 'suspended') {
                throw new Error('Your account has been suspended. Please contact support.');
            }

            // Create tokens
            const accessToken = tokenUtil.signAccessToken(student);
            const refreshTokenStr = tokenUtil.signRefreshToken(student);
            
            // Save Refresh Token
            await refreshTokenRepository.create({
                userId: student._id,
                userModel: 'StudentAccount',
                token: refreshTokenStr,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Update lastLogin metadata
            const isGoogleEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
            const updates = {
                lastLogin: new Date(),
                lastActive: new Date()
            };
            if (isGoogleEmailVerified) {
                updates.emailVerified = true;
            }
            if (!student.googleId) {
                updates.googleId = googleId;
                updates.authProvider = 'google';
                student.googleId = googleId;
                student.authProvider = 'google';
            }
            await studentAccountRepository.update(student._id, updates, traceId);

            // Session logging
            await this.logSessionHistory(student._id, 'login_google', reqInfo);

            return {
                registrationRequired: false,
                accessToken,
                refreshToken: refreshTokenStr,
                student
            };
        } else {
            console.log(`[V2 Service][${traceId}] StudentAccount is NULL, returning registrationRequired = true`);
            // Create 10-minute registration token
            const registrationToken = tokenUtil.signRegistrationToken(email, {
                name: payload.name || '',
                googleId,
                profilePicture: payload.picture || ''
            });

            return {
                registrationRequired: true,
                registrationToken,
                prefilled: {
                    name: payload.name || '',
                    email,
                    profilePicture: payload.picture || ''
                }
            };
        }
    }

    async loginEmail(email) {
        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await otpRepository.deleteOtp(email);
        await otpRepository.create(email, otp, expiresAt);

        // Send Email
        try {
            await sendEmail({
                email,
                subject: 'AskUrSenior V2 Verification Code',
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

    async verifyOtp(email, otp, traceId = 'internal', reqInfo = {}) {
        console.log(`[V2 Service][${traceId}] verifyOtp checking email: "${email}"`);
        const otpRecord = await otpRepository.findValidOtp(email, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }

        // Delete OTP immediately
        await otpRepository.deleteOtp(email);

        let student = await studentAccountRepository.findByEmail(email, traceId);

        if (!student) {
            const legacyUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (legacyUser) {
                console.log(`[V2 Service][${traceId}] Legacy User Found for email: "${email}"`);
                student = legacyUser;
            }
        }

        if (student) {
            console.log(`[V2 Service][${traceId}] StudentAccount Found: studentId: ${student.studentId}, returning registrationRequired = false`);
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
                lastActive: new Date(),
                emailVerified: true
            }, traceId);

            await this.logSessionHistory(student._id, 'login_email_otp', reqInfo);

            return {
                registrationRequired: false,
                accessToken,
                refreshToken: refreshTokenStr,
                student
            };
        } else {
            console.log(`[V2 Service][${traceId}] StudentAccount is NULL, returning registrationRequired = true`);
            // New V2 user — issue 10-minute registrationToken
            const registrationToken = tokenUtil.signRegistrationToken(email);

            return {
                registrationRequired: true,
                registrationToken,
                prefilled: {
                    email
                }
            };
        }
    }

    async registerUser({ registrationToken, name, usn, collegeName, branch, scheme, graduationYear, phone }, traceId = 'internal', reqInfo = {}) {
        console.log(`[V2 Service][${traceId}] registerUser initiated for USN: "${usn}"`);
        let decoded;
        try {
            decoded = tokenUtil.verifyToken(registrationToken);
            if (decoded.type !== 'registration') {
                throw new Error('Invalid token type');
            }
        } catch (err) {
            throw new Error('Registration token is invalid or has expired');
        }

        const email = decoded.email.toLowerCase().trim();

        // Unique USN Check
        const existingUsn = await studentAccountRepository.findByUsn(usn, traceId);
        if (existingUsn) {
            throw new Error('This USN is already linked to an account.');
        }

        // Inferred academic identity from USN parser
        const parsed = await usnParser.parseUsn(usn);

        const gradYearNum = parseInt(graduationYear, 10);
        const admissionYear = gradYearNum - 4;

        console.log(`[V2 Service][${traceId}] Creating StudentAccount only (no User legacy table sync) for USN: "${usn}"`);
        const student = await studentAccountRepository.create({
            email,
            googleId: decoded.googleId || undefined,
            authProvider: decoded.googleId ? 'google' : 'email',
            name,
            usn: usn.toUpperCase().trim(),
            college: parsed?.collegeId || undefined,
            collegeName: collegeName ? collegeName.trim() : (parsed?.collegeName || ''),
            branch: branch || parsed?.branchId,
            scheme: scheme || parsed?.schemeId,
            admissionYear: admissionYear,
            graduationYear: gradYearNum,
            phone: phone ? phone.trim() : '',
            profilePicture: decoded.profilePicture || '',
            registrationStatus: 'identity_completed',
            profileCompletion: {
                identity: true,
                academic: false,
                attendance: false
            },
            emailVerified: true,
            lastLogin: new Date(),
            lastActive: new Date()
        }, traceId);

        // Resolve relations
        const populatedStudent = await studentAccountRepository.findById(student._id, traceId);

        const accessToken = tokenUtil.signAccessToken(populatedStudent);
        const refreshTokenStr = tokenUtil.signRefreshToken(populatedStudent);

        await refreshTokenRepository.create({
            userId: populatedStudent._id,
            userModel: 'StudentAccount',
            token: refreshTokenStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await this.logSessionHistory(populatedStudent._id, 'register_complete', reqInfo);

        return {
            accessToken,
            refreshToken: refreshTokenStr,
            student: populatedStudent
        };
    }

    async checkUsn(usn) {
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

    async recoverAccount(usn) {
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
                subject: 'AskUrSenior V2 Account Recovery Code',
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

        // Secure recoveryToken containing the email, expiring in 10 minutes
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

        const email = decoded.email;

        // Verify OTP
        const otpRecord = await otpRepository.findValidOtp(email, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired recovery code');
        }

        // Delete OTP immediately
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

        // Recovered successfully -> Issue Access & Refresh Tokens
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
        if (data.name !== undefined) accountUpdates.name = data.name.trim();
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
            const trimmedUsn = data.usn.trim().toUpperCase();
            if (trimmedUsn !== student.usn) {
                const StudentAccount = require('../../../models/StudentAccount');
                const existingUsn = await StudentAccount.findOne({ usn: trimmedUsn, isDeleted: false });
                if (existingUsn) {
                    throw new Error('This USN is already linked to another account');
                }
                accountUpdates.usn = trimmedUsn;
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

        const hasPhoto = !!currentProfile.profilePicture;
        const hasCgpa = academicProfile.cgpa !== null && academicProfile.cgpa !== undefined;
        const hasCredits = academicProfile.creditsEarned !== null && academicProfile.creditsEarned !== undefined;
        const hasBacklogs = academicProfile.backlogs !== null && academicProfile.backlogs !== undefined;

        const isIdentityComplete = true;
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
}

module.exports = new AuthV2Service();
