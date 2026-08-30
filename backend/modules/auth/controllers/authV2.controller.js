const authV2Service = require('../services/authV2.service');
const studentAccountRepository = require('../repositories/studentAccount.repository');
const studentDto = require('../dtos/authV2.dto');
const StudentSemester = require('../../../models/StudentSemester');
const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
const StudentTimetable = require('../../../models/StudentTimetable');
const AcademicSubjectCms = require('../../../models/AcademicSubject');
const CmsSubject = require('../../../models/CmsSubject');
const StudentRegisteredSubject = require('../../../models/StudentRegisteredSubject');
const StudentAttendanceRecord = require('../../../models/StudentAttendanceRecord');
const StudentAttendanceSummary = require('../../../models/StudentAttendanceSummary');
const StudentCieRecord = require('../../../models/StudentCieRecord');
const StudentSemesterResult = require('../../../models/StudentSemesterResult');
const cieRulesEngine = require('../../../services/cieRulesEngine');
const sgpaRulesEngine = require('../../../services/sgpaRulesEngine');
const timetableGeneratorService = require('../../academic/services/timetableGenerator.service');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const getRefreshTokenFromRequest = (req) => {
    let token = req.body.refreshToken;
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                acc[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
            return acc;
        }, {});
        token = cookies['v2_refresh_token'];
    }
    return token;
};

class AuthV2Controller {
    async loginGoogle(req, res) {
        const traceId = Math.random().toString(36).substring(2, 8);
        try {
            const { token } = req.body;
            console.log(`[V2 Controller][${traceId}] POST /login/google`);
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Google token is required',
                    data: null,
                    errors: { token: 'Google token is required' }
                });
            }

            const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
            const result = await authV2Service.loginGoogle(token, traceId, reqInfo);

            if (result.registrationRequired) {
                console.log(`[V2 Controller][${traceId}] Response: registrationRequired = true`);
                return res.status(200).json({
                    success: true,
                    message: 'Registration required for this Google account',
                    data: {
                        registrationRequired: true,
                        registrationToken: result.registrationToken,
                        prefilled: result.prefilled
                    },
                    errors: null
                });
            }

            res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);

            console.log(`[V2 Controller][${traceId}] Response: registrationRequired = false, Student ID: ${result.student.studentId}`);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken: result.accessToken,
                    student: studentDto.toStudentResponseDto(result.student)
                },
                errors: null
            });
        } catch (error) {
            console.error(`[V2 Controller][${traceId}] Error: ${error.message}`);
            return res.status(400).json({
                success: false,
                message: error.message || 'Google authentication failed',
                data: null,
                errors: null
            });
        }
    }

    async loginEmail(req, res) {
        const traceId = Math.random().toString(36).substring(2, 8);
        try {
            const { email } = req.body;
            console.log(`[V2 Controller][${traceId}] POST /login/email for email: "${email}"`);
            await authV2Service.loginEmail(email);
            return res.status(200).json({
                success: true,
                message: 'OTP verification code sent to your email',
                data: null,
                errors: null
            });
        } catch (error) {
            console.error(`[V2 Controller][${traceId}] Error: ${error.message}`);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to send OTP code',
                data: null,
                errors: null
            });
        }
    }

    async verifyOtp(req, res) {
        const traceId = Math.random().toString(36).substring(2, 8);
        try {
            const { email, otp } = req.body;
            console.log(`[V2 Controller][${traceId}] POST /verify-otp for email: "${email}"`);
            const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
            const result = await authV2Service.verifyOtp(email, otp, traceId, reqInfo);

            if (result.registrationRequired) {
                console.log(`[V2 Controller][${traceId}] Response: registrationRequired = true`);
                return res.status(200).json({
                    success: true,
                    message: 'OTP verified. Registration required.',
                    data: {
                        registrationRequired: true,
                        registrationToken: result.registrationToken,
                        prefilled: result.prefilled
                    },
                    errors: null
                });
            }

            res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);

            console.log(`[V2 Controller][${traceId}] Response: registrationRequired = false, Student ID: ${result.student.studentId}`);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken: result.accessToken,
                    student: studentDto.toStudentResponseDto(result.student)
                },
                errors: null
            });
        } catch (error) {
            console.error(`[V2 Controller][${traceId}] Error: ${error.message}`);
            return res.status(400).json({
                success: false,
                message: error.message || 'OTP verification failed',
                data: null,
                errors: null
            });
        }
    }

    async register(req, res) {
        const traceId = Math.random().toString(36).substring(2, 8);
        try {
            const { registrationToken, name, usn, collegeName, branch, scheme, graduationYear, phone } = req.body;
            console.log(`[V2 Controller][${traceId}] POST /register for USN: "${usn}"`);
            const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
            const result = await authV2Service.registerUser({ registrationToken, name, usn, collegeName, branch, scheme, graduationYear, phone }, traceId, reqInfo);

            res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);

            console.log(`[V2 Controller][${traceId}] Response: registration success, Student ID: ${result.student.studentId}`);
            return res.status(201).json({
                success: true,
                message: 'Student account registered successfully',
                data: {
                    accessToken: result.accessToken,
                    student: studentDto.toStudentResponseDto(result.student)
                },
                errors: null
            });
        } catch (error) {
            console.error(`[V2 Controller][${traceId}] Error: ${error.message}`);
            return res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
                data: null,
                errors: null
            });
        }
    }

    async checkUsn(req, res) {
        try {
            const { usn } = req.body;
            const result = await authV2Service.checkUsn(usn);
            return res.status(200).json({
                success: true,
                message: result.available ? 'USN is available' : result.message,
                data: result,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'USN check failed',
                data: null,
                errors: null
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const oldRefreshToken = getRefreshTokenFromRequest(req);
            if (!oldRefreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                    data: null,
                    errors: null
                });
            }

            const result = await authV2Service.refreshSession(oldRefreshToken);

            res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);

            return res.status(200).json({
                success: true,
                message: 'Access token refreshed successfully',
                data: {
                    accessToken: result.accessToken
                },
                errors: null
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message || 'Refresh session failed',
                data: null,
                errors: null
            });
        }
    }

    async logout(req, res) {
        try {
            const token = getRefreshTokenFromRequest(req);
            await authV2Service.logout(token);
            res.clearCookie('v2_refresh_token', cookieOptions);
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
                data: null,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Logout failed',
                data: null,
                errors: null
            });
        }
    }

    async getSession(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                try {
                    const decoded = require('../utils/token').verifyToken(token);
                    const student = await this.studentAccountRepository.findById(decoded.userId);
                    if (student && !student.isDeleted && student.accountStatus === 'active') {
                        return res.status(200).json({
                            success: true,
                            message: 'Session is valid',
                            data: {
                                isAuthenticated: true,
                                student: studentDto.toStudentResponseDto(student)
                            },
                            errors: null
                        });
                    } else {
                        // Student account was deleted, suspended, or deactivated
                        const refreshTokenRepository = require('../repositories/refreshToken.repository');
                        await refreshTokenRepository.revokeAllForUser(decoded.userId);
                        res.clearCookie('v2_refresh_token', cookieOptions);
                        return res.status(401).json({
                            success: false,
                            message: 'Student account not found or suspended',
                            data: null,
                            errors: null
                        });
                    }
                } catch (jwtErr) {
                    // Access token is expired/invalid, try silent rotation via refresh token
                }
            }

            const refreshToken = getRefreshTokenFromRequest(req);
            if (refreshToken) {
                try {
                    const result = await authV2Service.refreshSession(refreshToken);
                    res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);
                    return res.status(200).json({
                        success: true,
                        message: 'Session restored via refresh token',
                        data: {
                            isAuthenticated: true,
                            accessToken: result.accessToken,
                            student: studentDto.toStudentResponseDto(result.student)
                        },
                        errors: null
                    });
                } catch (refreshErr) {
                    // Refresh token is invalid, expired, or revoked
                    res.clearCookie('v2_refresh_token', cookieOptions);
                    return res.status(401).json({
                        success: false,
                        message: refreshErr.message || 'Session expired',
                        data: null,
                        errors: null
                    });
                }
            }

            res.clearCookie('v2_refresh_token', cookieOptions);
            return res.status(401).json({
                success: false,
                message: 'No active session found',
                data: null,
                errors: null
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Session check failed',
                data: null,
                errors: [error.message]
            });
        }
    }

    async getMe(req, res) {
        const traceId = Math.random().toString(36).substring(2, 8);
        console.log(`[V2 /me][${traceId}] JWT Student ID: "${req.userId}"`);
        console.log(`[V2 /me][${traceId}] Returned Student ID: "${req.student.studentId}", Name: "${req.student.name}", Collection: student_accounts`);
        return res.status(200).json({
            success: true,
            message: 'Authenticated profile retrieved successfully',
            data: {
                student: studentDto.toStudentResponseDto(req.student)
            },
            errors: null
        });
    }

    async recoverAccount(req, res) {
        try {
            const { usn } = req.body;
            const result = await authV2Service.recoverAccount(usn);
            return res.status(200).json({
                success: true,
                message: 'Recovery verification code sent to registered email',
                data: result,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Account recovery failed',
                data: null,
                errors: null
            });
        }
    }

    async verifyRecoveryOtp(req, res) {
        try {
            const { recoveryToken, otp } = req.body;
            const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
            const result = await authV2Service.verifyRecoveryOtp(recoveryToken, otp, reqInfo);

            res.cookie('v2_refresh_token', result.refreshToken, cookieOptions);

            return res.status(200).json({
                success: true,
                message: 'Recovery successful. Logged in.',
                data: {
                    accessToken: result.accessToken,
                    student: studentDto.toStudentResponseDto(result.student)
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Recovery code verification failed',
                data: null,
                errors: null
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const studentId = req.student._id;
            const updated = await authV2Service.updateProfile(studentId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    student: studentDto.toStudentResponseDto(updated)
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Profile update failed',
                data: null,
                errors: null
            });
        }
    }

    async uploadProfilePicture(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded', data: null, errors: null });
            }

            const studentId = req.student._id;
            const updated = await authV2Service.updateProfile(studentId, { profilePicture: req.file.location });

            return res.status(200).json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: {
                    student: studentDto.toStudentResponseDto(updated)
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Profile picture upload failed',
                data: null,
                errors: null
            });
        }
    }

    async removeProfilePicture(req, res) {
        try {
            const studentId = req.student._id;
            const student = req.student;

            // Delete from AWS S3 if it exists and matches our bucket
            if (student.profilePicture && student.profilePicture.includes(process.env.AWS_BUCKET_NAME)) {
                try {
                    const { s3 } = require('../../../utils/s3');
                    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
                    const urlParts = student.profilePicture.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const key = 'profiles/' + filename;

                    await s3.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key
                    }));
                } catch (err) {
                    console.error('Failed to delete profile picture from S3:', err);
                }
            }

            const updated = await authV2Service.updateProfile(studentId, { profilePicture: '' });

            return res.status(200).json({
                success: true,
                message: 'Profile picture removed successfully',
                data: {
                    student: studentDto.toStudentResponseDto(updated)
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Profile picture removal failed',
                data: null,
                errors: null
            });
        }
    }

    async getSemesters(req, res) {
        try {
            const studentId = req.student._id;
            const records = await StudentSemester.find({ student: studentId }).sort({ semester: 1 });
            return res.status(200).json({
                success: true,
                message: 'Semester records fetched successfully',
                data: records,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch semester records',
                data: null,
                errors: null
            });
        }
    }

    async updateSemesters(req, res) {
        try {
            const studentId = req.student._id;
            const student = req.student;
            const currentSemester = student.semester || 1;
            const { semesters } = req.body;

            if (!Array.isArray(semesters)) {
                return res.status(400).json({ success: false, message: 'Invalid payload: semesters must be an array', data: null, errors: null });
            }

            // 1. Validation
            const parsedRecords = [];
            const semestersSeen = new Set();

            for (const item of semesters) {
                const semNum = parseInt(item.semester, 10);
                if (isNaN(semNum) || semNum < 1) {
                    return res.status(400).json({ success: false, message: 'Semester must be a number greater than or equal to 1', data: null, errors: null });
                }

                if (semestersSeen.has(semNum)) {
                    return res.status(400).json({ success: false, message: `Duplicate entry for Semester ${semNum}`, data: null, errors: null });
                }
                semestersSeen.add(semNum);

                // If SGPA is supplied, validate it
                let sgpaVal = null;
                if (item.sgpa !== null && item.sgpa !== undefined && item.sgpa !== '') {
                    sgpaVal = parseFloat(item.sgpa);
                    if (isNaN(sgpaVal) || sgpaVal < 0 || sgpaVal > 10) {
                        return res.status(400).json({ success: false, message: 'SGPA must be a number between 0.00 and 10.00', data: null, errors: null });
                    }
                    // Round to 2 decimal places
                    sgpaVal = Math.round(sgpaVal * 100) / 100;
                }

                let creditsVal = 20;
                if (item.credits !== null && item.credits !== undefined && item.credits !== '') {
                    creditsVal = parseInt(item.credits, 10);
                    if (isNaN(creditsVal) || creditsVal < 0) {
                        return res.status(400).json({ success: false, message: 'Credits must be a positive number', data: null, errors: null });
                    }
                }

                parsedRecords.push({
                    semester: semNum,
                    sgpa: sgpaVal,
                    credits: creditsVal,
                    academicYear: item.academicYear || '',
                    startDate: item.startDate || null,
                    endDate: item.endDate || null,
                    status: item.status || (semNum === currentSemester ? 'current' : 'completed')
                });
            }

            // Sort parsed records to check for skips/continuity
            parsedRecords.sort((a, b) => a.semester - b.semester);

            // Verify continuity among recorded SGPAs without requiring start at Sem 1
            const activeSemestersMap = new Map();
            const existingInDb = await StudentSemester.find({ student: studentId });
            for (const rec of existingInDb) {
                if (rec.sgpa !== null && rec.sgpa !== undefined) {
                    activeSemestersMap.set(rec.semester, rec.sgpa);
                }
            }

            for (const item of parsedRecords) {
                if (item.sgpa === null || item.sgpa === undefined) {
                    // Only track if record has explicit sgpa
                } else {
                    activeSemestersMap.set(item.semester, item.sgpa);
                }
            }

            const activeSems = Array.from(activeSemestersMap.keys()).sort((a, b) => a - b);
            if (activeSems.length > 1) {
                const minSem = activeSems[0];
                const maxSem = activeSems[activeSems.length - 1];
                for (let i = minSem; i <= maxSem; i++) {
                    if (!activeSemestersMap.has(i)) {
                        return res.status(400).json({
                            success: false,
                            message: `Semesters must be continuous between Semester ${minSem} and ${maxSem}. Please fill Semester ${i} before adding higher semesters.`,
                            data: null,
                            errors: null
                        });
                    }
                }
            }

            // 2. Perform updates/deletes in database
            for (const item of parsedRecords) {
                const updateData = {
                    credits: item.credits,
                    academicYear: item.academicYear,
                    status: item.status
                };
                if (item.sgpa !== undefined) {
                    updateData.sgpa = item.sgpa;
                }
                if (item.startDate !== undefined) {
                    updateData.startDate = item.startDate;
                }
                if (item.endDate !== undefined) {
                    updateData.endDate = item.endDate;
                }

                await StudentSemester.findOneAndUpdate(
                    { student: studentId, semester: item.semester },
                    updateData,
                    { upsert: true, new: true }
                );
            }

            // 3. Recalculate CGPA (Credit-weighted average of all recorded SGPAs)
            const remainingRecords = await StudentSemester.find({ student: studentId });
            const validRecords = remainingRecords.filter(r => r.sgpa !== null && r.sgpa !== undefined);
            
            let calculatedCgpa = null;
            if (validRecords.length > 0) {
                const totalWeightedSgpa = validRecords.reduce((acc, curr) => acc + (curr.sgpa * (curr.credits || 0)), 0);
                const totalCredits = validRecords.reduce((acc, curr) => acc + (curr.credits || 0), 0);
                if (totalCredits > 0) {
                    calculatedCgpa = Math.round((totalWeightedSgpa / totalCredits) * 100) / 100;
                }
            }

            // 4. Cache calculated CGPA in StudentAccount
            const StudentAccount = require('../../../models/StudentAccount');
            const updatedStudent = await StudentAccount.findByIdAndUpdate(
                studentId,
                { cgpa: calculatedCgpa },
                { new: true }
            ).populate('branch').populate('scheme');

            const allSemesters = await StudentSemester.find({ student: studentId }).sort({ semester: 1 });

            return res.status(200).json({
                success: true,
                message: 'Semester SGPA and CGPA updated successfully',
                data: {
                    student: studentDto.toStudentResponseDto(updatedStudent),
                    semesters: allSemesters
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update semester records',
                data: null,
                errors: null
            });
        }
    }

    async getTimetableConfig(req, res) {
        try {
            const studentId = req.student._id;
            const semester = Number(req.query.semester) || req.student.semester || 1;
            let config = await StudentTimetableConfiguration.findOne({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
            if (!config) {
                const start = new Date();
                const end = new Date();
                end.setMonth(end.getMonth() + 4);
                
                config = new StudentTimetableConfiguration({
                    student: studentId,
                    semester,
                    semesterStartDate: start,
                    lastWorkingDate: end,
                    collegeStartMinute: 480, // 08:00 AM
                    collegeEndMinute: 1020, // 05:00 PM
                    classDuration: 50,
                    labDuration: 100,
                    attendanceThreshold: 85,
                    personalAttendanceTarget: 85,
                    workingDays: new Map([
                        ['1', 'Full Day'],
                        ['2', 'Full Day'],
                        ['3', 'Full Day'],
                        ['4', 'Full Day'],
                        ['5', 'Full Day'],
                        ['6', 'Half Day'],
                        ['7', 'Holiday']
                    ]),
                    breaks: []
                });
                await config.save();
            } else if (config.semester === undefined) {
                config.semester = semester;
                await config.save();
            }
            const StudentTimetableBackup = require('../../../models/StudentTimetableBackup');
            const hasBackup = await StudentTimetableBackup.exists({ student: studentId, semester });

            const configObj = config.toObject ? config.toObject({ flattenMaps: true }) : config;
            configObj.hasBackup = !!hasBackup;
            if (configObj.labDuration === undefined) {
                configObj.labDuration = 100;
            }

            return res.status(200).json({
                success: true,
                message: 'Timetable configuration retrieved successfully',
                data: configObj,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve configuration',
                data: null,
                errors: null
            });
        }
    }

    async saveTimetableConfig(req, res) {
        try {
            const studentId = req.student._id;
            const semester = Number(req.body.semester) || req.student.semester || 1;
            const { 
                semesterStartDate, 
                lastWorkingDate, 
                collegeStartMinute, 
                collegeEndMinute, 
                classDuration, 
                labDuration,
                workingDays, 
                breaks,
                migrateSubjects 
            } = req.body;

            let config = await StudentTimetableConfiguration.findOne({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
            if (!config) {
                config = new StudentTimetableConfiguration({ student: studentId, semester });
            }

            config.semesterStartDate = semesterStartDate ? new Date(semesterStartDate) : config.semesterStartDate;
            config.lastWorkingDate = lastWorkingDate ? new Date(lastWorkingDate) : config.lastWorkingDate;
            if (collegeStartMinute !== undefined) config.collegeStartMinute = collegeStartMinute;
            if (collegeEndMinute !== undefined) config.collegeEndMinute = collegeEndMinute;
            if (classDuration !== undefined) config.classDuration = classDuration;
            if (labDuration !== undefined) config.labDuration = labDuration;
            if (req.body.personalAttendanceTarget !== undefined) config.personalAttendanceTarget = req.body.personalAttendanceTarget;
            if (req.body.attendanceThreshold !== undefined) config.attendanceThreshold = req.body.attendanceThreshold;
            if (workingDays !== undefined) {
                config.workingDays = new Map(Object.entries(workingDays));
            }
            if (breaks !== undefined) config.breaks = breaks;
            config.semester = semester;
            config.version = (config.version || 1) + 1;

            await config.save();

            const oldSlots = await StudentTimetable.find({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
            let newSlots = timetableGeneratorService.generateSlots(studentId, config);

            if (migrateSubjects) {
                newSlots = timetableGeneratorService.migrateAssignments(oldSlots, newSlots);
            }

            // Map slots to semester
            const mappedSlots = newSlots.map(s => {
                const sObj = s.toObject ? s.toObject() : s;
                return { ...sObj, semester };
            });

            await StudentTimetable.deleteMany({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
            const savedSlots = await StudentTimetable.insertMany(mappedSlots);

            // Clean up attendance entries outside of the new semester date range
            const formatDateStr = (dateObj) => {
                const d = new Date(dateObj);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            const startStr = formatDateStr(config.semesterStartDate);
            const endStr = formatDateStr(config.lastWorkingDate);
            
            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            await StudentAttendanceEntry.deleteMany({
                student: studentId,
                semester,
                $or: [
                    { date: { $lt: startStr } },
                    { date: { $gt: endStr } }
                ]
            });

            // Clear cached schedule to force recalculation with new duration
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            await StudentExpectedSchedule.deleteOne({ student: studentId, semester });

            // Re-calculate attendance metrics dynamically
            await controllerInstance.recalculateAllStudentAttendance(studentId);

            const configObj = config.toObject ? config.toObject({ flattenMaps: true }) : config;

            return res.status(200).json({
                success: true,
                message: 'Timetable configuration saved and slots generated successfully',
                data: {
                    config: configObj,
                    slots: savedSlots
                },
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save timetable configuration',
                data: null,
                errors: null
            });
        }
    }

    async generatePreview(req, res) {
        try {
            const studentId = req.student._id;
            const { 
                semesterStartDate, 
                lastWorkingDate, 
                collegeStartMinute, 
                collegeEndMinute, 
                classDuration, 
                labDuration,
                workingDays, 
                breaks 
            } = req.body;

            const tempConfig = {
                semesterStartDate: new Date(semesterStartDate),
                lastWorkingDate: new Date(lastWorkingDate),
                collegeStartMinute,
                collegeEndMinute,
                classDuration,
                labDuration: labDuration || 100,
                workingDays: new Map(Object.entries(workingDays || {})),
                breaks: breaks || []
            };

            const slots = timetableGeneratorService.generateSlots(studentId, tempConfig);
            return res.status(200).json({
                success: true,
                message: 'Preview generated successfully',
                data: slots,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to generate preview',
                data: null,
                errors: null
            });
        }
    }

    async getTimetableSlots(req, res) {
        try {
            const studentId = req.student._id;
            const semester = Number(req.query.semester) || req.student.semester || 1;
            const slots = await StudentTimetable.find({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            })
                .sort({ dayOfWeek: 1, startMinute: 1 })
                .populate('subject');
            return res.status(200).json({
                success: true,
                message: 'Timetable slots fetched successfully',
                data: slots,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch timetable slots',
                data: null,
                errors: null
            });
        }
    }

    async updateTimetableSlots(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.student.semester || 1;
            const { slots } = req.body;

            if (!Array.isArray(slots)) {
                return res.status(400).json({ success: false, message: 'Invalid payload: slots must be an array', data: null, errors: null });
            }

            for (const item of slots) {
                if (!item._id) {
                    return res.status(400).json({ success: false, message: 'Missing slot identification _id', data: null, errors: null });
                }
                
                await StudentTimetable.findOneAndUpdate(
                    { _id: item._id, student: studentId },
                    {
                        subject: item.subject || null,
                        room: item.room || '',
                        faculty: item.faculty || '',
                        lectureType: item.lectureType || 'Lecture',
                        status: item.status || 'Scheduled',
                        sessionGroupId: item.sessionGroupId || null,
                        semester
                    }
                );
            }

            const updatedSlots = await StudentTimetable.find({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            })
                .sort({ dayOfWeek: 1, startMinute: 1 })
                .populate('subject');

            // Re-calculate attendance metrics dynamically
            await controllerInstance.recalculateAllStudentAttendance(studentId);

            return res.status(200).json({
                success: true,
                message: 'Timetable slots updated successfully',
                data: updatedSlots,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save slots assignments',
                data: null,
                errors: null
            });
        }
    }

    async getAcademicSubjects(req, res) {
        try {
            const student = req.student;
            const targetSemester = req.query.semester ? Number(req.query.semester) : (student.semester || 1);
            const studyYearVal = Math.max(1, Math.min(4, Math.ceil(targetSemester / 2)));
            
            let yearStr = '1st Year';
            if (studyYearVal === 2) yearStr = '2nd Year';
            else if (studyYearVal === 3) yearStr = '3rd Year';
            else if (studyYearVal === 4) yearStr = '4th Year';

            const query = {
                year: yearStr,
                $or: [{ status: 'Published' }, { status: { $exists: false } }]
            };

            // First Year subjects are common across branches. Second Year+ filter by student's branch/scheme if available.
            if (yearStr !== '1st Year' && student.branch) {
                query.branch = student.branch;
                if (student.scheme) {
                    query.scheme = student.scheme;
                }
            }

            let subjects = await AcademicSubjectCms.find(query).sort({ name: 1 });

            // Fallback 1: Try without scheme if no subjects found
            if ((!subjects || subjects.length === 0) && query.scheme) {
                delete query.scheme;
                subjects = await AcademicSubjectCms.find(query).sort({ name: 1 });
            }

            // Fallback 2: Try with year alone if still empty
            if (!subjects || subjects.length === 0) {
                subjects = await AcademicSubjectCms.find({ year: yearStr }).sort({ name: 1 });
            }

            // Fallback 3: Check CmsSubject collection if AcademicSubjectCms collection returned no results
            if (!subjects || subjects.length === 0) {
                subjects = await CmsSubject.find({ year: yearStr }).sort({ name: 1 });
            }

            return res.status(200).json({
                success: true,
                message: 'Academic subjects retrieved successfully',
                data: subjects,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch academic subjects',
                data: null,
                errors: null
            });
        }
    }

    async getRegisteredSubjects(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.query.semester ? Number(req.query.semester) : (req.student.semester || 1);
            const registered = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            }).populate('subject');

            return res.status(200).json({
                success: true,
                message: 'Registered subjects retrieved successfully',
                data: registered,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch registered subjects',
                data: null,
                errors: null
            });
        }
    }

    async saveRegisteredSubjects(req, res) {
        try {
            const student = req.student;
            const studentId = student._id;
            const semester = req.body.semester ? Number(req.body.semester) : (student.semester || 1);
            
            // Support both req.body.subjectIds (array of string IDs) and req.body.subjects (array of objects/IDs)
            const rawSubjects = req.body.subjectIds || req.body.subjects;

            if (!Array.isArray(rawSubjects)) {
                return res.status(400).json({
                    success: false,
                    message: 'subjectIds or subjects must be an array',
                    data: null,
                    errors: null
                });
            }

            const studyYearVal = Math.ceil(semester / 2);
            let yearStr = '1st Year';
            if (studyYearVal === 2) yearStr = '2nd Year';
            else if (studyYearVal === 3) yearStr = '3rd Year';
            else if (studyYearVal === 4) yearStr = '4th Year';

            const activeSubjectIds = [];
            const parsedSubjectPayloads = [];

            // 1. Resolve & validate subject IDs against AcademicSubjectCms
            for (const item of rawSubjects) {
                const targetId = typeof item === 'string' ? item : (item.subjectId || item._id);
                const category = item.category || 'Theory';
                const defaultTheory = category === 'Lab Only' ? 0 : 4;
                const defaultLab = (category === 'Theory + Lab' || category === 'Lab Only') ? 1 : 0;
                const weeklyPlan = {
                    theory: { required: item.weeklyPlan?.theory?.required !== undefined ? Number(item.weeklyPlan.theory.required) : defaultTheory },
                    lab: { required: item.weeklyPlan?.lab?.required !== undefined ? Number(item.weeklyPlan.lab.required) : defaultLab }
                };

                if (targetId) {
                    const dbSubject = await AcademicSubjectCms.findById(targetId);
                    if (dbSubject) {
                        activeSubjectIds.push(dbSubject._id);
                        parsedSubjectPayloads.push({
                            subjectId: dbSubject._id,
                            credits: dbSubject.credits || 0, // Server-side authoritative credit resolution!
                            category: item.category || dbSubject.category || (dbSubject.name?.toLowerCase().includes('lab') ? 'Lab Only' : 'Theory'),
                            weeklyPlan,
                            registrationType: 'REGULAR'
                        });
                    }
                } else if (typeof item === 'object' && item.customName) {
                    // Custom subject handling
                    const dummyCode = item.customCode || `CUST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                    const newCurricSubj = new AcademicSubjectCms({
                        name: item.customName,
                        code: dummyCode,
                        credits: item.credits ?? 3,
                        year: yearStr,
                        branch: student.branch,
                        scheme: student.scheme,
                        status: 'Hidden',
                        slug: `custom-${studentId}-${dummyCode.toLowerCase()}-${Date.now()}`
                    });
                    await newCurricSubj.save();
                    activeSubjectIds.push(newCurricSubj._id);
                    parsedSubjectPayloads.push({
                        subjectId: newCurricSubj._id,
                        credits: newCurricSubj.credits,
                        category: item.category || 'Theory',
                        weeklyPlan,
                        customName: item.customName,
                        customCode: dummyCode,
                        registrationType: 'REGULAR'
                    });
                }
            }

            // 2. Identify existing registered subjects to remove
            const existing = await StudentRegisteredSubject.find({ 
                student: studentId, 
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            });
            const activeIdsStrings = activeSubjectIds.map(id => id.toString());
            const toRemove = existing.filter(e => !e.subject || !activeIdsStrings.includes(e.subject.toString()));

            if (toRemove.length > 0) {
                const toRemoveIds = toRemove.map(r => r._id);
                const toRemoveSubjectIds = toRemove.map(r => r.subject).filter(Boolean);

                if (toRemoveSubjectIds.length > 0) {
                    await StudentTimetable.updateMany(
                        { 
                            student: studentId, 
                            $or: [ { semester }, { semester: { $exists: false } } ], 
                            subject: { $in: toRemoveSubjectIds } 
                        },
                        { $set: { subject: null } }
                    );
                    await AcademicSubjectCms.deleteMany({
                        _id: { $in: toRemoveSubjectIds },
                        status: 'Hidden'
                    });
                }
                await StudentRegisteredSubject.deleteMany({ _id: { $in: toRemoveIds } });
            }

            // 3. Upsert registered subjects with server-validated credits and weeklyPlan
            for (const item of parsedSubjectPayloads) {
                await StudentRegisteredSubject.findOneAndUpdate(
                    { student: studentId, subject: item.subjectId },
                    {
                        registeredCredits: item.credits ?? 0,
                        category: item.category || 'Theory',
                        weeklyPlan: item.weeklyPlan || {
                            theory: { required: 4 },
                            lab: { required: 0 }
                        },
                        customName: item.customName || '',
                        customCode: item.customCode || '',
                        registrationType: item.registrationType || 'REGULAR',
                        isActive: true,
                        semester
                    },
                    { upsert: true, new: true }
                );
            }

            // Fetch the updated populated list
            const updated = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            }).populate('subject');

            // Re-calculate attendance metrics dynamically
            await controllerInstance.recalculateAllStudentAttendance(studentId);

            return res.status(200).json({
                success: true,
                message: 'Registered subjects saved successfully',
                data: updated,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save registered subjects',
                data: null,
                errors: null
            });
        }
    }

    async updateWeeklyPlan(req, res) {
        try {
            const studentId = req.student._id;
            const plans = req.body.plans || req.body.subjects || [];

            if (!Array.isArray(plans)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plans must be an array',
                    data: null,
                    errors: null
                });
            }

            for (const item of plans) {
                const targetId = item.registeredSubjectId || item.regSubjectId || item._id || item.subjectId;
                if (targetId) {
                    const theoryVal = item.theoryClassesPerWeek ?? item.theoryRequired ?? item.theory ?? 3;
                    const labVal = item.labSessionsPerWeek ?? item.labRequired ?? item.lab ?? 0;
                    await StudentRegisteredSubject.updateOne(
                        { _id: targetId, student: studentId },
                        {
                            $set: {
                                'weeklyPlan.theory.required': Math.max(0, Number(theoryVal)),
                                'weeklyPlan.lab.required': Math.max(0, Number(labVal))
                            }
                        }
                    );
                }
            }

            await controllerInstance.recalculateAllStudentAttendance(studentId);

            return res.status(200).json({
                success: true,
                message: 'Weekly class plans updated successfully',
                data: null,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update weekly class plans',
                data: null,
                errors: null
            });
        }
    }

    async recalculateSubjectAttendance(studentId, subjectId) {
        const records = await StudentAttendanceRecord.find({
            student: studentId,
            subject: subjectId
        });

        const classesTaken = records.filter(r => r.status !== 'Cancelled').length;
        const classesAttended = records.filter(r => 
            r.status === 'Present' || r.status === 'Medical Leave' || r.status === 'On Duty'
        ).length;

        const attendancePercentage = classesTaken > 0 
            ? parseFloat(((classesAttended / classesTaken) * 100).toFixed(2))
            : 100.00;

        const sortedRecords = records
            .filter(r => r.status !== 'Cancelled')
            .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return (a.timeSlot || '').localeCompare(b.timeSlot || '');
            });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (const r of sortedRecords) {
            if (r.status === 'Present') {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else {
                tempStreak = 0;
            }
        }

        for (let i = sortedRecords.length - 1; i >= 0; i--) {
            if (sortedRecords[i].status === 'Present') {
                currentStreak++;
            } else {
                break;
            }
        }

        let canMiss = 0;
        let needToAttend = 0;
        const threshold = 85;

        if (classesTaken > 0) {
            if (attendancePercentage >= threshold) {
                canMiss = Math.floor((classesAttended - (threshold / 100) * classesTaken) / (threshold / 100));
                if (canMiss < 0) canMiss = 0;
            } else {
                needToAttend = Math.ceil(((threshold / 100) * classesTaken - classesAttended) / (1 - (threshold / 100)));
                if (needToAttend < 0) needToAttend = 0;
            }
        }

        return await StudentAttendanceSummary.findOneAndUpdate(
            { student: studentId, subject: subjectId },
            {
                classesTaken,
                classesAttended,
                attendancePercentage,
                currentStreak,
                longestStreak,
                canMiss,
                needToAttend,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
    }

    async getSubjectProgress(req, res) {
        try {
            const studentId = req.student._id;
            const registered = await StudentRegisteredSubject.find({
                student: studentId,
                isActive: true
            }).populate('subject');

            const progressData = [];

            for (const reg of registered) {
                const subjectId = reg.subject?._id || reg.subject;
                if (!subjectId) continue;

                const name = reg.customName || reg.subject?.name || 'Unknown';
                const code = reg.customCode || reg.subject?.code || '';

                // Try to find pre-computed summary
                let summary = await StudentAttendanceSummary.findOne({
                    student: studentId,
                    subject: subjectId
                });

                // Recalculate if no summary exists yet
                if (!summary) {
                    summary = await controllerInstance.recalculateSubjectAttendance(studentId, subjectId);
                }

                let status = 'Green';
                if (summary.attendancePercentage < 85) {
                    status = 'Red';
                } else if (summary.attendancePercentage < 90) {
                    status = 'Yellow';
                }

                progressData.push({
                    subjectId,
                    name,
                    code,
                    credits: reg.registeredCredits || 0,
                    category: reg.category || 'Theory',
                    attendancePercentage: summary.attendancePercentage,
                    attendedClasses: summary.classesAttended,
                    totalClasses: summary.classesTaken,
                    currentStreak: summary.currentStreak,
                    longestStreak: summary.longestStreak,
                    canMiss: summary.canMiss,
                    needToAttend: summary.needToAttend,
                    status,
                    lastUpdated: summary.lastUpdated
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Subject progress metrics retrieved successfully',
                data: progressData,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch subject progress metrics',
                data: null,
                errors: null
            });
        }
    }

    async getAttendanceHistory(req, res) {
        try {
            const studentId = req.student._id;
            const { subjectId } = req.params;

            const records = await StudentAttendanceRecord.find({
                student: studentId,
                subject: subjectId
            }).sort({ date: 1, timeSlot: 1 });

            return res.status(200).json({
                success: true,
                message: 'Attendance history retrieved successfully',
                data: records,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch attendance history',
                data: null,
                errors: null
            });
        }
    }

    async updateAttendanceHistory(req, res) {
        try {
            const studentId = req.student._id;
            const { attendanceId } = req.params;
            const { status, remarks } = req.body;

            const record = await StudentAttendanceRecord.findOne({
                _id: attendanceId,
                student: studentId
            });

            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance record not found',
                    data: null,
                    errors: null
                });
            }

            if (status) record.status = status;
            if (remarks !== undefined) record.remarks = remarks;

            await record.save();

            // Re-compute metrics cache
            await controllerInstance.recalculateSubjectAttendance(studentId, record.subject);

            return res.status(200).json({
                success: true,
                message: 'Attendance record updated successfully',
                data: record,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update attendance record',
                data: null,
                errors: null
            });
        }
    }

    async addExtraClass(req, res) {
        try {
            const studentId = req.student._id;
            const { subjectId, date, time, status, remarks, lectureType } = req.body;

            if (!subjectId || !date || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: subjectId, date, status',
                    data: null,
                    errors: null
                });
            }

            const record = new StudentAttendanceRecord({
                student: studentId,
                subject: subjectId,
                date,
                timeSlot: time || '',
                status,
                remarks: remarks || '',
                isExtraClass: req.body.isExtraClass !== undefined ? req.body.isExtraClass : true,
                createdBy: req.body.createdBy || 'student',
                lectureType: lectureType || 'Lecture'
            });

            await record.save();

            // Re-compute metrics cache
            await controllerInstance.recalculateSubjectAttendance(studentId, subjectId);

            return res.status(200).json({
                success: true,
                message: 'Extra class attendance record created successfully',
                data: record,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to add extra class record',
                data: null,
                errors: null
            });
        }
    }

    async deleteExtraClass(req, res) {
        try {
            const studentId = req.student._id;
            const { attendanceId } = req.params;

            const record = await StudentAttendanceRecord.findOne({
                _id: attendanceId,
                student: studentId
            });

            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance record not found',
                    data: null,
                    errors: null
                });
            }

            if (!record.isExtraClass) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete system-generated timetable classes',
                    data: null,
                    errors: null
                });
            }

            const subjectId = record.subject;
            await StudentAttendanceRecord.deleteOne({ _id: attendanceId });

            // Re-compute metrics cache
            await controllerInstance.recalculateSubjectAttendance(studentId, subjectId);

            return res.status(200).json({
                success: true,
                message: 'Extra class deleted successfully',
                data: null,
                errors: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete extra class record',
                data: null,
                errors: null
            });
        }
    }

    // ==========================================
    // ATTENDANCE ENGINE (PHASE 5.2)
    // ==========================================

    async getSemesterScheduleAndEntries(studentId, semester, currentSemester) {
        const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
        const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
        const SemesterSnapshot = require('../../../models/SemesterSnapshot');
        const StudentTimetable = require('../../../models/StudentTimetable');
        const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
        const StudentRegisteredSubject = require('../../../models/StudentRegisteredSubject');

        const isArchived = semester < currentSemester;
        let configuration = null;
        let expectedClasses = [];
        let subjects = [];

        if (isArchived) {
            const snapshot = await SemesterSnapshot.findOne({ student: studentId, semester });
            if (snapshot) {
                configuration = snapshot.configuration;
                expectedClasses = snapshot.expectedClasses || [];
                subjects = snapshot.subjects || [];
            }
        } else {
            let cachedSchedule = await StudentExpectedSchedule.findOne({ student: studentId, semester });
            if (!cachedSchedule || !cachedSchedule.classes || cachedSchedule.classes.length === 0) {
                const { generateAndCacheExpectedSchedule } = require('../../../services/expectedClassGenerator');
                const classes = await generateAndCacheExpectedSchedule(studentId, semester);
                cachedSchedule = { classes };
            }
            expectedClasses = cachedSchedule.classes || [];
            subjects = await StudentRegisteredSubject.find({ 
                student: studentId, 
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            }).populate('subject');
            configuration = await StudentTimetableConfiguration.findOne({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
        }

        const entries = await StudentAttendanceEntry.find({ student: studentId, semester });
        return {
            isArchived,
            configuration,
            expectedClasses,
            subjects,
            entries
        };
    }

    compileTimeline(expectedClasses, entries, subjectIdFilter = null) {
        const timeline = [];
        const entryMap = new Map();
        const extraEntries = [];

        for (const entry of entries) {
            if (entry.isExtraClass) {
                extraEntries.push(entry);
            } else {
                const key = `${entry.subject.toString()}_${entry.date}_${entry.timeSlot || ''}`;
                entryMap.set(key, entry);
            }
        }

        for (const exp of expectedClasses) {
            const subjectIdStr = exp.subject.toString();
            if (subjectIdFilter && subjectIdStr !== subjectIdFilter.toString()) {
                continue;
            }

            const key = `${subjectIdStr}_${exp.date}_${exp.timeSlot}`;
            const matchedEntry = entryMap.get(key);

            if (matchedEntry) {
                timeline.push({
                    _id: matchedEntry._id,
                    date: exp.date,
                    timeSlot: exp.timeSlot,
                    subject: exp.subject,
                    lectureType: exp.lectureType || 'Lecture',
                    status: matchedEntry.status,
                    isExtraClass: false,
                    remarks: matchedEntry.remarks || '',
                    createdBy: matchedEntry.createdBy || 'Student'
                });
            } else {
                timeline.push({
                    _id: null,
                    date: exp.date,
                    timeSlot: exp.timeSlot,
                    subject: exp.subject,
                    lectureType: exp.lectureType || 'Lecture',
                    status: 'Yet To Be Taken',
                    isExtraClass: false,
                    remarks: '',
                    createdBy: 'System'
                });
            }
        }

        for (const extra of extraEntries) {
            const subjectIdStr = extra.subject.toString();
            if (subjectIdFilter && subjectIdStr !== subjectIdFilter.toString()) {
                continue;
            }

            timeline.push({
                _id: extra._id,
                date: extra.date,
                timeSlot: extra.timeSlot || '',
                subject: extra.subject,
                lectureType: extra.lectureType || 'Lecture',
                status: extra.status,
                isExtraClass: true,
                remarks: extra.remarks || '',
                createdBy: extra.createdBy || 'Student'
            });
        }

        timeline.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

        return timeline;
    }

    computeSubjectAnalytics(timeline, todayStr) {
        const conductedRecords = timeline.filter(t => t.date <= todayStr && t.status !== 'Cancelled' && t.status !== 'Yet To Be Taken');
        const conducted = conductedRecords.length;
        const present = conductedRecords.filter(t => t.status === 'Present' || t.status === 'On Duty').length;
        const absent = conductedRecords.filter(t => t.status === 'Absent').length;
        const medicalLeave = conductedRecords.filter(t => t.status === 'Medical Leave').length;
        const onDuty = conductedRecords.filter(t => t.status === 'On Duty').length;
        const expected = timeline.filter(t => t.status !== 'Cancelled').length;

        // Streaks (ascending order)
        const sorted = [...conductedRecords].sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (const r of sorted) {
            if (r.status === 'Present' || r.status === 'On Duty') {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        }

        for (let i = sorted.length - 1; i >= 0; i--) {
            const r = sorted[i];
            if (r.status === 'Present' || r.status === 'On Duty') {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            conducted,
            present,
            absent,
            medicalLeave,
            onDuty,
            expected,
            streak: {
                current: currentStreak,
                longest: longestStreak
            }
        };
    }

    async getAttendanceDashboardV2(req, res) {
        try {
            const studentId = req.student._id;
            const requestedSemester = parseInt(req.query.semester) || req.student.semester;
            const { compileSemesterAnalytics } = require('../../../services/attendanceEngine');
            const analytics = await compileSemesterAnalytics(studentId, requestedSemester);

            return res.status(200).json({
                success: true,
                message: 'Attendance dashboard retrieved successfully',
                data: {
                    overall: analytics.overall || {},
                    subjects: (analytics.subjects || []).map(s => ({
                        subjectId: s.subjectId,
                        name: s.name,
                        code: s.code,
                        credits: s.credits,
                        category: s.category,
                        classesPerWeek: s.classesPerWeek,
                        labSessionsPerWeek: s.labSessionsPerWeek,
                        collegeThreshold: s.collegeThreshold,
                        userThreshold: s.userThreshold,
                        attendancePercentage: s.attendancePercentage,
                        analytics: s.analytics || {},
                        streak: s.analytics?.streak || { current: 0, longest: 0 },
                        canMiss: s.analytics?.canMiss || 0,
                        needToAttend: s.analytics?.needToAttend || 0
                    })),
                    groupedTimeline: analytics.groupedTimeline || [],
                    isArchived: requestedSemester < req.student.semester,
                    readOnly: requestedSemester < req.student.semester
                }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch dashboard'
            });
        }
    }

    async getAttendanceAnalyticsV2(req, res) {
        try {
            const studentId = req.student._id;
            const requestedSemester = parseInt(req.query.semester) || req.student.semester;
            const { compileSemesterAnalytics } = require('../../../services/attendanceEngine');
            const analytics = await compileSemesterAnalytics(studentId, requestedSemester);

            const isArchived = requestedSemester < req.student.semester;

            return res.status(200).json({
                success: true,
                message: 'Analytics retrieved successfully',
                data: {
                    overall: analytics.overall,
                    subjects: analytics.subjects,
                    isArchived,
                    readOnly: isArchived
                }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch analytics'
            });
        }
    }

    async updateAttendanceTarget(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.body.semester ? parseInt(req.body.semester, 10) : (req.student.semester || 1);
            const { targetPercentage } = req.body;

            const { getCollegeAcademicRules } = require('../../../services/collegeAcademicRules');
            const rules = getCollegeAcademicRules(req.student.collegeName || 'SIT');
            const collegeThreshold = rules.attendance?.minimumPercentage || 85;

            const target = parseFloat(targetPercentage);
            if (isNaN(target) || target < collegeThreshold || target > 100) {
                return res.status(400).json({
                    success: false,
                    message: `Your threshold cannot be below the college minimum of ${collegeThreshold}%.`
                });
            }

            let config = await StudentTimetableConfiguration.findOne({
                student: studentId,
                $or: [{ semester }, { semester: { $exists: false } }]
            });
            if (!config) {
                config = new StudentTimetableConfiguration({
                    student: studentId,
                    semester,
                    semesterStartDate: new Date(),
                    lastWorkingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                });
            }

            if (req.body.subjectId) {
                const StudentRegisteredSubject = require('../../../models/StudentRegisteredSubject');
                await StudentRegisteredSubject.findOneAndUpdate(
                    {
                        student: studentId,
                        semester,
                        $or: [{ _id: req.body.subjectId }, { subject: req.body.subjectId }]
                    },
                    { $set: { userThreshold: target } }
                );
            }

            config.attendanceThreshold = target;
            config.semester = semester;
            await config.save();

            return res.status(200).json({
                success: true,
                message: 'Attendance target updated successfully',
                data: {
                    collegeThreshold,
                    userThreshold: target
                }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update attendance target'
            });
        }
    }

    async getSubjectAttendanceDetailV2(req, res) {
        try {
            const studentId = req.student._id;
            const requestedSemester = parseInt(req.query.semester) || req.student.semester;
            const { subjectId } = req.params;
            const requestedCategory = req.query.category || 'Theory';

            const { compileSemesterAnalytics } = require('../../../services/attendanceEngine');
            const analytics = await compileSemesterAnalytics(studentId, requestedSemester, { subjectId, category: requestedCategory });

            const s = analytics.subjects.find(sub => 
                sub.subjectId.toString() === subjectId && 
                sub.category.toLowerCase() === requestedCategory.toLowerCase()
            );
            if (!s) {
                return res.status(404).json({ success: false, message: 'Subject not registered' });
            }

            const finalIfMissNext = (s.analytics?.conducted || 0) + 1 > 0
                ? parseFloat((((s.analytics?.present || 0) / ((s.analytics?.conducted || 0) + 1)) * 100).toFixed(1))
                : 0.0;
            const finalIfAttendNext8 = (s.analytics?.conducted || 0) + 8 > 0
                ? parseFloat(((((s.analytics?.present || 0) + 8) / ((s.analytics?.conducted || 0) + 8)) * 100).toFixed(1))
                : 100.0;

            return res.status(200).json({
                success: true,
                message: 'Subject details retrieved successfully',
                data: {
                    subject: s,
                    history: analytics.timeline,
                    forecast: {
                        finalIfMissNext,
                        finalIfAttendNext8,
                        needConsecutive: s.analytics.needToAttend
                    }
                }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch subject details'
            });
        }
    }

    async getTodayAttendance(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.query.semester ? Number(req.query.semester) : (req.student.semester || 1);
            
            const now = new Date();
            const nowYear = now.getFullYear();
            const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
            const nowDay = String(now.getDate()).padStart(2, '0');
            const nowStr = `${nowYear}-${nowMonth}-${nowDay}`;

            let todayStr = nowStr;
            if (req.query.date) {
                todayStr = req.query.date;
            }

            const dateObj = new Date(todayStr + 'T12:00:00');
            const jsDay = dateObj.getDay();
            const dayOfWeek = jsDay === 0 ? 7 : jsDay;
            const currentMinute = now.getHours() * 60 + now.getMinutes();

            // Parallelize fetching configuration, today occurrences, and weekday timetable slots
            const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
            const ClassOccurrence = require('../../../models/ClassOccurrence');
            const StudentTimetable = require('../../../models/StudentTimetable');
            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');

            const [config, rawOccurrences, rawSlots] = await Promise.all([
                StudentTimetableConfiguration.findOne({
                    student: studentId,
                    $or: [ { semester }, { semester: { $exists: false } } ]
                }).sort({ updatedAt: -1 }).lean(),
                ClassOccurrence.find({
                    student: studentId,
                    semester,
                    date: todayStr
                }).populate('actualSubject scheduledSubject').lean(),
                StudentTimetable.find({
                    student: studentId,
                    $or: [ { semester }, { semester: { $exists: false } } ],
                    dayOfWeek
                }).populate('subject').lean()
            ]);

            let entries = rawOccurrences || [];
            if (!entries || entries.length === 0) {
                entries = await StudentAttendanceEntry.find({
                    student: studentId,
                    semester,
                    date: todayStr
                }).populate('subject scheduledSubject').lean();
            }

            let semStartStr = null;
            let semEndStr = null;
            if (config?.semesterStartDate) {
                const s = new Date(config.semesterStartDate);
                semStartStr = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
            }
            if (config?.lastWorkingDate) {
                const e = new Date(config.lastWorkingDate);
                semEndStr = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`;
            }

            const isBeforeStart = semStartStr && todayStr < semStartStr;
            const isAfterEnd = semEndStr && todayStr > semEndStr;

            // If date is outside semester bounds and no manual entries exist, return empty classes list
            if ((isBeforeStart || isAfterEnd) && (!entries || entries.length === 0)) {
                return res.status(200).json({
                    success: true,
                    message: isBeforeStart 
                        ? `Semester starts on ${semStartStr}. No classes scheduled before semester start.`
                        : `Semester ended on ${semEndStr}. No classes scheduled after semester end.`,
                    data: [],
                    isOutsideSemester: true,
                    semesterStartDate: semStartStr,
                    lastWorkingDate: semEndStr
                });
            }

            const slots = (!isBeforeStart && !isAfterEnd) ? (rawSlots || []) : [];

            // Map slots to entries strictly by scheduledSubject and timeSlot
            const entryMap = new Map();
            for (const entry of entries) {
                const schedSubjId = entry.scheduledSubject 
                    ? (entry.scheduledSubject._id ? entry.scheduledSubject._id.toString() : entry.scheduledSubject.toString())
                    : (entry.subject ? (entry.subject._id ? entry.subject._id.toString() : entry.subject.toString()) : (entry.actualSubject ? (entry.actualSubject._id ? entry.actualSubject._id.toString() : entry.actualSubject.toString()) : ''));
                
                const keyWithSubj = `${schedSubjId}_${entry.timeSlot || ''}`;
                entryMap.set(keyWithSubj, entry);
            }

            // Filter to only keep allotted slots with a valid registered subject
            const allottedSlots = slots.filter(slot => slot.subject !== null && slot.subject !== undefined);

            const formattedSlots = allottedSlots.map(slot => {
                const hrsStart = Math.floor(slot.startMinute / 60);
                const minsStart = slot.startMinute % 60;
                const timeStartStr = `${String(hrsStart).padStart(2, '0')}:${String(minsStart).padStart(2, '0')}`;
                
                const hrsEnd = Math.floor(slot.endMinute / 60);
                const minsEnd = slot.endMinute % 60;
                const timeEndStr = `${String(hrsEnd).padStart(2, '0')}:${String(minsEnd).padStart(2, '0')}`;

                const timeSlotStr = `${timeStartStr}-${timeEndStr}`;

                const keyWithSubj = `${slot.subject?._id?.toString()}_${timeSlotStr}`;
                let matchedEntry = entryMap.get(keyWithSubj);

                // Range matching fallback (e.g. entry covers multiple slots like 08:00-10:00)
                if (!matchedEntry) {
                    matchedEntry = entries.find(e => {
                        if (!e.timeSlot || !e.timeSlot.includes('-')) return false;
                        const [eStartStr, eEndStr] = e.timeSlot.split('-');
                        const [eStartH, eStartM] = (eStartStr || '').split(':').map(Number);
                        const [eEndH, eEndM] = (eEndStr || '').split(':').map(Number);
                        if (isNaN(eStartH) || isNaN(eEndH)) return false;
                        const eStartMin = eStartH * 60 + (eStartM || 0);
                        const eEndMin = eEndH * 60 + (eEndM || 0);

                        const eSubjId = e.scheduledSubject?._id?.toString() || e.scheduledSubject?.toString() || e.actualSubject?._id?.toString() || e.actualSubject?.toString() || e.subject?._id?.toString() || e.subject?.toString();
                        const slotSubjId = slot.subject?._id?.toString() || slot.subject?.toString();
                        const isSubjectMatch = !eSubjId || eSubjId === slotSubjId;
                        const isTimeCovered = eStartMin <= slot.startMinute && slot.endMinute <= eEndMin;
                        return isSubjectMatch && isTimeCovered;
                    });
                }

                let isFuture = false;
                if (todayStr > nowStr) {
                    isFuture = true;
                } else if (todayStr === nowStr) {
                    isFuture = slot.startMinute > currentMinute;
                } else {
                    isFuture = false;
                }

                const scheduledSubjectId = slot.subject?._id;
                const scheduledSubjectName = slot.subject?.name || slot.customName || 'Lecture';
                const scheduledSubjectCode = slot.subject?.code || '';

                const actualSubjDoc = matchedEntry ? (matchedEntry.actualSubject || matchedEntry.subject) : null;
                const actualSubjectId = actualSubjDoc ? (actualSubjDoc._id || actualSubjDoc) : scheduledSubjectId;
                const actualSubjectName = actualSubjDoc?.name || scheduledSubjectName;
                const actualSubjectCode = actualSubjDoc?.code || scheduledSubjectCode;

                const isSubjectChanged = matchedEntry ? (actualSubjectId?.toString() !== scheduledSubjectId?.toString()) : false;

                return {
                    _id: slot._id,
                    scheduledSubjectId,
                    scheduledSubjectName,
                    scheduledSubjectCode,
                    subjectId: actualSubjectId,
                    subjectName: actualSubjectName,
                    subjectCode: actualSubjectCode,
                    isSubjectChanged,
                    credits: slot.subject?.credits || 0,
                    startMinute: slot.startMinute,
                    endMinute: slot.endMinute,
                    lectureType: slot.lectureType || 'Theory',
                    room: slot.room || '',
                    timeSlot: timeSlotStr,
                    isFuture,
                    status: matchedEntry ? matchedEntry.status : 'Yet To Be Taken',
                    entryId: matchedEntry ? matchedEntry._id : null
                };
            });

            // Sort ascending by startMinute
            formattedSlots.sort((a, b) => a.startMinute - b.startMinute);

            // Merge consecutive lab slots of the same subject
            const mergedSlots = [];
            for (const slot of formattedSlots) {
                if (mergedSlots.length === 0) {
                    mergedSlots.push({
                        ...slot,
                        subSlots: [ { _id: slot._id, timeSlot: slot.timeSlot, status: slot.status } ]
                    });
                    continue;
                }

                const prev = mergedSlots[mergedSlots.length - 1];

                const isConsecutiveLab = 
                    prev.lectureType === 'Lab' && 
                    slot.lectureType === 'Lab' &&
                    prev.subjectId && slot.subjectId &&
                    prev.subjectId.toString() === slot.subjectId.toString() &&
                    prev.endMinute === slot.startMinute;

                if (isConsecutiveLab) {
                    prev.endMinute = slot.endMinute;
                    
                    const prevStart = prev.timeSlot.split('-')[0];
                    const currentEnd = slot.timeSlot.split('-')[1];
                    prev.timeSlot = `${prevStart}-${currentEnd}`;
                    
                    prev.subSlots.push({ _id: slot._id, timeSlot: slot.timeSlot, status: slot.status });

                    const statuses = prev.subSlots.map(s => s.status).filter(Boolean);
                    const nonPending = statuses.filter(s => s !== 'Yet To Be Taken' && s !== 'NOT_MARKED' && s !== 'PENDING');
                    if (nonPending.length > 0) {
                        prev.status = nonPending[0];
                    } else {
                        prev.status = 'Yet To Be Taken';
                    }
                } else {
                    mergedSlots.push({
                        ...slot,
                        subSlots: [ { _id: slot._id, timeSlot: slot.timeSlot, status: slot.status } ]
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Today attendance fetched successfully',
                data: mergedSlots
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch today attendance'
            });
        }
    }

    async updateAttendanceHistoryV2(req, res) {
        try {
            const studentId = req.student._id;
            const { subjectId, scheduledSubjectId, date, timeSlot, status, remarks } = req.body;
            const semester = req.student.semester;

            // Check locks
            const SemesterSnapshot = require('../../../models/SemesterSnapshot');
            const snapshotExists = await SemesterSnapshot.findOne({ student: studentId, semester });
            if (snapshotExists) {
                return res.status(400).json({ success: false, message: 'Semester archived. Attendance is read-only.' });
            }

            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            const ClassOccurrence = require('../../../models/ClassOccurrence');
            const { validateStatusTransition, normalizeStatus } = require('../../../services/occurrenceEngine');

            // Support Bulk Confirm All Past Classes as Present
            if (req.body.markAllPast) {
                const now = new Date();
                const nowYear = now.getFullYear();
                const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
                const nowDay = String(now.getDate()).padStart(2, '0');
                const today = `${nowYear}-${nowMonth}-${nowDay}`;

                const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
                let cachedSchedule = await StudentExpectedSchedule.findOne({ student: studentId, semester });
                if (!cachedSchedule || !cachedSchedule.classes || cachedSchedule.classes.length === 0) {
                    const { generateAndCacheExpectedSchedule } = require('../../../services/expectedClassGenerator');
                    const classes = await generateAndCacheExpectedSchedule(studentId, semester);
                    cachedSchedule = { classes };
                }
                const pastClasses = (cachedSchedule.classes || []).filter(c => c.date < today);
                
                if (pastClasses.length > 0) {
                    const ops = pastClasses.map(c => ({
                        updateOne: {
                            filter: { student: studentId, semester, date: c.date, timeSlot: c.timeSlot },
                            update: {
                                $setOnInsert: {
                                    student: studentId,
                                    semester,
                                    scheduledSubject: c.subject,
                                    subject: c.subject,
                                    date: c.date,
                                    timeSlot: c.timeSlot,
                                    status: 'Present',
                                    createdBy: 'Student'
                                }
                            },
                            upsert: true
                        }
                    }));
                    await StudentAttendanceEntry.bulkWrite(ops);
                }
                await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
                return res.status(200).json({
                    success: true,
                    message: 'All past classes confirmed as Present',
                    data: null
                });
            }

            // Support Resetting entire date or single slot to original state
            if (req.body.resetDay || timeSlot === 'ALL') {
                await StudentAttendanceEntry.deleteMany({
                    student: studentId,
                    semester,
                    date
                });
                await ClassOccurrence.deleteMany({
                    student: studentId,
                    semester,
                    date
                });
                const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
                await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
                return res.status(200).json({
                    success: true,
                    message: 'Day attendance reset to original state',
                    data: null
                });
            }

            const slotsToUpdate = Array.isArray(req.body.constituentSlots) && req.body.constituentSlots.length > 0
                ? req.body.constituentSlots
                : [timeSlot || ''];

            if (status === 'RESET' || status === 'NOT_MARKED' || status === null) {
                for (const slot of slotsToUpdate) {
                    await StudentAttendanceEntry.deleteMany({
                        student: studentId,
                        semester,
                        date,
                        timeSlot: slot
                    });
                    await ClassOccurrence.deleteMany({
                        student: studentId,
                        semester,
                        date,
                        timeSlot: slot
                    });
                }
                const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
                await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
                return res.status(200).json({
                    success: true,
                    message: 'Attendance entry reset to original state',
                    data: null
                });
            }

            // Validate transition & future protection
            const validatedStatus = validateStatusTransition('PENDING', status, date);
            const schedSubj = scheduledSubjectId || subjectId;
            const actSubj = subjectId;

            let entry = null;
            for (const slot of slotsToUpdate) {
                // Compute numeric minutes from timeSlot
                let startMinute = 0;
                let endMinute = 0;
                if (slot && slot.includes('-')) {
                    const [sStr, eStr] = slot.split('-');
                    const [sH, sM] = (sStr || '').split(':').map(Number);
                    const [eH, eM] = (eStr || '').split(':').map(Number);
                    if (!isNaN(sH)) startMinute = sH * 60 + (sM || 0);
                    if (!isNaN(eH)) endMinute = eH * 60 + (eM || 0);
                }

                const isSubjectSwap = schedSubj.toString() !== actSubj.toString();
                const occurrenceType = req.body.isExtraClass 
                    ? 'EXTRA' 
                    : (isSubjectSwap ? 'SWAPPED' : (validatedStatus === 'SUSPENDED' ? 'SUSPENDED' : 'REGULAR'));

                // Update legacy entry for backward compatibility
                const queryFilter = { student: studentId, semester, date, timeSlot: slot };
                entry = await StudentAttendanceEntry.findOneAndUpdate(
                    queryFilter,
                    {
                        student: studentId,
                        semester,
                        scheduledSubject: schedSubj,
                        subject: actSubj,
                        date,
                        timeSlot: slot,
                        status: status === 'Present' || status === 'PRESENT' ? 'Present' : (status === 'Absent' || status === 'ABSENT' ? 'Absent' : status),
                        remarks: remarks || '',
                        createdBy: 'Student'
                    },
                    { upsert: true, new: true }
                );

                // Update ClassOccurrence event with structured audit log
                const existingOccurrence = await ClassOccurrence.findOne({
                    student: studentId,
                    semester,
                    date,
                    timeSlot: slot
                });

                const auditHistory = existingOccurrence?.auditHistory || [];
                if (existingOccurrence && existingOccurrence.status !== validatedStatus) {
                    auditHistory.push({
                        changedAt: new Date(),
                        changedBy: 'STUDENT',
                        action: 'STATUS_CHANGED',
                        field: 'status',
                        from: existingOccurrence.status,
                        to: validatedStatus,
                        previous: { status: existingOccurrence.status },
                        next: { status: validatedStatus }
                    });
                }
                if (existingOccurrence && existingOccurrence.actualSubject?.toString() !== actSubj.toString()) {
                    auditHistory.push({
                        changedAt: new Date(),
                        changedBy: 'STUDENT',
                        action: 'SUBJECT_SWAPPED',
                        field: 'actualSubject',
                        from: existingOccurrence.actualSubject,
                        to: actSubj,
                        previous: { actualSubject: existingOccurrence.actualSubject },
                        next: { actualSubject: actSubj }
                    });
                }

                await ClassOccurrence.findOneAndUpdate(
                    { student: studentId, semester, date, timeSlot: slot, scheduledSubject: schedSubj },
                    {
                        student: studentId,
                        semester,
                        date,
                        startMinute,
                        endMinute,
                        timeSlot: slot,
                        scheduledSubject: schedSubj,
                        actualSubject: actSubj,
                        occurrenceType,
                        status: validatedStatus,
                        isExtraClass: Boolean(req.body.isExtraClass),
                        remarks: remarks || '',
                        markedAt: new Date(),
                        markedBy: 'STUDENT',
                        auditHistory
                    },
                    { upsert: true, new: true }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance entry logged successfully',
                data: entry
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update attendance entry'
            });
        }
    }

    async saveBaselineAttendance(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.body.semester ? Number(req.body.semester) : (req.student.semester || 1);
            const baselines = req.body.baselines;

            if (!Array.isArray(baselines)) {
                return res.status(400).json({ success: false, message: 'baselines must be an array' });
            }

            const StudentRegisteredSubject = require('../../../models/StudentRegisteredSubject');
            for (const item of baselines) {
                if (item.registeredSubjectId) {
                    await StudentRegisteredSubject.findOneAndUpdate(
                        { _id: item.registeredSubjectId, student: studentId },
                        {
                            $set: {
                                'baseline.present': Math.max(0, parseInt(item.present, 10) || 0),
                                'baseline.conducted': Math.max(0, parseInt(item.conducted, 10) || 0)
                            }
                        }
                    );
                }
            }

            const { compileSemesterAnalytics } = require('../../../services/attendanceEngine');
            const analytics = await compileSemesterAnalytics(studentId, semester);

            return res.status(200).json({
                success: true,
                message: 'Baseline attendance saved successfully',
                data: analytics
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save baseline attendance'
            });
        }
    }

    async getCieDashboard(req, res) {
        try {
            const studentId = req.student._id;
            const currentStudentSem = req.student.semester || 1;
            const targetSem = req.query.semester ? Number(req.query.semester) : currentStudentSem;

            const registered = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [{ semester: targetSem }, { semester: { $exists: false } }] },
                    { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
                ]
            }).populate('subject');

            const allRegistrations = await StudentRegisteredSubject.find({ student: studentId });
            const semSet = new Set();
            allRegistrations.forEach(r => {
                if (r.semester) semSet.add(r.semester);
            });
            if (currentStudentSem) semSet.add(currentStudentSem);
            const availableSemesters = Array.from(semSet).sort((a, b) => a - b);

            const existingRecords = await StudentCieRecord.find({
                student: studentId,
                semester: targetSem
            });

            const recordMap = new Map();
            existingRecords.forEach(rec => {
                recordMap.set(rec.registeredSubject.toString(), rec);
            });

            const subjectCalculations = [];
            let totalSubjects = registered.length;
            let completedCount = 0;
            let eligibleCount = 0;
            let needsAttentionCount = 0;

            for (const reg of registered) {
                const regIdStr = reg._id.toString();
                const existingRec = recordMap.get(regIdStr);
                const rawMarks = existingRec?.rawMarks || {};
                const evalTypeOverride = existingRec?.evaluationType || reg.evaluationType || null;

                const calc = cieRulesEngine.calculateSubjectCie({
                    registeredSubject: reg,
                    rawMarks,
                    evaluationTypeOverride: evalTypeOverride
                });

                const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : null;

                const itemData = {
                    registeredSubjectId: reg._id,
                    subjectId: subjObj?._id || reg.subject || reg._id,
                    subjectCode: subjObj?.code || reg.customCode || 'SUBJ',
                    subjectName: reg.customName || subjObj?.name || 'Subject',
                    credits: reg.registeredCredits || subjObj?.credits || 0,
                    category: reg.category || 'Theory',
                    evaluationType: calc.evaluationType,
                    evalConfig: calc.evalConfig,
                    rawMarks,
                    contributions: calc.contributions,
                    rawTotals: calc.rawTotals,
                    totalCie: calc.totalCie,
                    maxCie: calc.maxCie,
                    isEligible: calc.isEligible,
                    status: calc.status,
                    failedRequirements: calc.failedRequirements,
                    totalEnteredCount: calc.totalEnteredCount,
                    totalPossibleSubcomponents: calc.totalPossibleSubcomponents,
                    updatedAt: existingRec?.updatedAt || null
                };

                if (calc.status === 'ELIGIBLE') {
                    completedCount++;
                    eligibleCount++;
                } else if (calc.status === 'NOT_ELIGIBLE') {
                    completedCount++;
                    needsAttentionCount++;
                } else if (calc.status === 'PARTIAL') {
                    if (!calc.isEligible) {
                        needsAttentionCount++;
                    }
                }

                subjectCalculations.push(itemData);
            }

            return res.status(200).json({
                success: true,
                message: 'CIE dashboard data retrieved successfully',
                data: {
                    semester: targetSem,
                    currentStudentSemester: currentStudentSem,
                    availableSemesters,
                    summaryStats: {
                        totalSubjects,
                        completedCount,
                        eligibleCount,
                        needsAttentionCount
                    },
                    subjects: subjectCalculations
                }
            });
        } catch (error) {
            console.error('Error in getCieDashboard:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch CIE dashboard data'
            });
        }
    }

    async saveCieRecord(req, res) {
        try {
            const studentId = req.student._id;
            const { registeredSubjectId, semester, rawMarks, evaluationType } = req.body;

            if (!registeredSubjectId) {
                return res.status(400).json({
                    success: false,
                    message: 'registeredSubjectId is required'
                });
            }

            const targetSem = semester ? Number(semester) : (req.student.semester || 1);

            const regSubject = await StudentRegisteredSubject.findOne({
                _id: registeredSubjectId,
                student: studentId
            }).populate('subject');

            if (!regSubject) {
                return res.status(404).json({
                    success: false,
                    message: 'Registered subject not found'
                });
            }

            const calc = cieRulesEngine.calculateSubjectCie({
                registeredSubject: regSubject,
                rawMarks: rawMarks || {},
                evaluationTypeOverride: evaluationType || null
            });

            const updatedRecord = await StudentCieRecord.findOneAndUpdate(
                {
                    student: studentId,
                    semester: targetSem,
                    registeredSubject: registeredSubjectId
                },
                {
                    $set: {
                        subject: regSubject.subject?._id || null,
                        evaluationType: calc.evaluationType,
                        rawMarks: rawMarks || {},
                        calculatedResult: {
                            contributions: calc.contributions,
                            totalCie: calc.totalCie,
                            maxCie: calc.maxCie,
                            isEligible: calc.isEligible,
                            status: calc.status,
                            failedRequirements: calc.failedRequirements,
                            lastCalculatedAt: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );

            const subjObj = regSubject.subject && typeof regSubject.subject === 'object' ? regSubject.subject : null;

            return res.status(200).json({
                success: true,
                message: 'CIE marks saved and recalculated successfully',
                data: {
                    registeredSubjectId,
                    subjectId: subjObj?._id || regSubject.subject || regSubject._id,
                    subjectCode: subjObj?.code || regSubject.customCode || 'SUBJ',
                    subjectName: regSubject.customName || subjObj?.name || 'Subject',
                    credits: regSubject.registeredCredits || subjObj?.credits || 0,
                    category: regSubject.category || 'Theory',
                    evaluationType: calc.evaluationType,
                    evalConfig: calc.evalConfig,
                    rawMarks: updatedRecord.rawMarks,
                    contributions: calc.contributions,
                    rawTotals: calc.rawTotals,
                    totalCie: calc.totalCie,
                    maxCie: calc.maxCie,
                    isEligible: calc.isEligible,
                    status: calc.status,
                    failedRequirements: calc.failedRequirements,
                    totalEnteredCount: calc.totalEnteredCount,
                    totalPossibleSubcomponents: calc.totalPossibleSubcomponents,
                    updatedAt: updatedRecord.updatedAt
                }
            });
        } catch (error) {
            console.error('Error in saveCieRecord:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save CIE record'
            });
        }
    }

    async getSgpaDashboard(req, res) {
        try {
            const studentId = req.student._id;
            const requestedSem = req.query.semester ? Number(req.query.semester) : null;
            const currentStudentSem = req.student.semester || 1;
            const targetSem = requestedSem || currentStudentSem;

            const allRegistrations = await StudentRegisteredSubject.find({ student: studentId });
            const semSet = new Set();
            allRegistrations.forEach(r => {
                if (r.semester) semSet.add(r.semester);
            });
            if (currentStudentSem) semSet.add(currentStudentSem);
            const availableSemesters = Array.from(semSet).sort((a, b) => a - b).map(s => ({
                semester: s,
                isCurrent: s === currentStudentSem,
                label: `Semester ${s}`
            }));

            const registeredSubjects = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [{ semester: targetSem }, { semester: { $exists: false } }] },
                    { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
                ]
            }).populate('subject').sort({ 'subject.code': 1, createdAt: 1 });

            const cieRecords = await StudentCieRecord.find({
                student: studentId,
                $or: [{ semester: targetSem }, { semester: { $exists: false } }]
            });
            const cieMap = new Map();
            cieRecords.forEach(c => {
                if (c.registeredSubject) {
                    const regId = typeof c.registeredSubject === 'object' ? c.registeredSubject._id?.toString() : c.registeredSubject.toString();
                    if (regId) cieMap.set(regId, c);
                }
                if (c.subject) {
                    const subjId = typeof c.subject === 'object' ? c.subject._id?.toString() : c.subject.toString();
                    if (subjId) cieMap.set(subjId, c);
                }
            });

            const savedSemesterResult = await StudentSemesterResult.findOne({
                student: studentId,
                semester: targetSem
            });
            const savedSubjectMap = new Map();
            if (savedSemesterResult && savedSemesterResult.subjects) {
                savedSemesterResult.subjects.forEach(s => {
                    if (s.registeredSubject) {
                        const regId = typeof s.registeredSubject === 'object' ? s.registeredSubject._id?.toString() : s.registeredSubject.toString();
                        if (regId) savedSubjectMap.set(regId, s);
                    }
                });
            }

            const subjectCalculations = [];
            for (const regSub of registeredSubjects) {
                const regIdStr = regSub._id.toString();
                const subjIdStr = regSub.subject && typeof regSub.subject === 'object' ? regSub.subject._id?.toString() : (regSub.subject?.toString() || null);
                const cieRec = cieMap.get(regIdStr) || (subjIdStr ? cieMap.get(subjIdStr) : null);
                const savedResult = savedSubjectMap.get(regIdStr);

                // Dynamically compute CIE from rules engine to ensure 100% accuracy
                const rawMarks = cieRec?.rawMarks || {};
                const evalTypeOverride = cieRec?.evaluationType || regSub.evaluationType || null;
                const cieCalc = cieRulesEngine.calculateSubjectCie({
                    registeredSubject: regSub,
                    rawMarks,
                    evaluationTypeOverride: evalTypeOverride
                });

                let cieData = null;
                if (cieRec || cieCalc.totalEnteredCount > 0) {
                    cieData = {
                        totalCie: cieCalc.totalCie,
                        isEligible: cieCalc.isEligible,
                        status: cieCalc.status
                    };
                }

                const seeRawMarks = savedResult?.seeRawMarks !== undefined && savedResult?.seeRawMarks !== null
                    ? savedResult.seeRawMarks
                    : null;
                const seeRawMaximum = savedResult?.seeRawMaximum || 100;

                const calc = sgpaRulesEngine.calculateSubjectSgpaResult({
                    registeredSubject: regSub,
                    cieData,
                    seeRawMarks,
                    seeRawMaximum
                });

                const subjObj = regSub.subject && typeof regSub.subject === 'object' ? regSub.subject : null;

                subjectCalculations.push({
                    registeredSubjectId: regSub._id,
                    subjectId: subjObj?._id || regSub.subject || regSub._id,
                    subjectCode: subjObj?.code || regSub.customCode || 'SUBJ',
                    subjectName: regSub.customName || subjObj?.name || 'Subject',
                    credits: regSub.registeredCredits || subjObj?.credits || 0,
                    category: regSub.category || 'Theory',

                    cieMarks: calc.cieMarks,
                    cieMax: calc.cieMax,
                    cieStatus: calc.cieStatus,
                    hasCie: calc.cieMarks !== null,

                    seeRawMarks: calc.seeRawMarks,
                    seeRawMaximum: calc.seeRawMaximum,
                    seeScaledMarks: calc.seeScaledMarks,
                    seeScaledMaximum: calc.seeScaledMaximum,

                    totalMarks: calc.totalMarks,
                    totalMaxMarks: 100,
                    grade: calc.grade,
                    gradePoint: calc.gradePoint,
                    creditPoints: calc.creditPoints,
                    status: calc.status,
                    failureReason: calc.failureReason || null
                });
            }

            const overallResult = sgpaRulesEngine.calculateSemesterSgpa(subjectCalculations);

            return res.status(200).json({
                success: true,
                message: 'SGPA dashboard data retrieved successfully',
                data: {
                    semester: targetSem,
                    currentStudentSemester: currentStudentSem,
                    availableSemesters,
                    summaryStats: overallResult,
                    subjects: subjectCalculations
                }
            });
        } catch (error) {
            console.error('Error in getSgpaDashboard:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch SGPA dashboard data'
            });
        }
    }

    async saveSgpaRecord(req, res) {
        try {
            const studentId = req.student._id;
            const { registeredSubjectId, semester, seeRawMarks, seeRawMaximum } = req.body;

            const targetSem = semester ? Number(semester) : (req.student.semester || 1);

            const allRegSubjects = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [{ semester: targetSem }, { semester: { $exists: false } }] },
                    { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
                ]
            }).populate('subject').sort({ 'subject.code': 1, createdAt: 1 });

            const cieRecords = await StudentCieRecord.find({
                student: studentId,
                $or: [{ semester: targetSem }, { semester: { $exists: false } }]
            });
            const cieMap = new Map();
            cieRecords.forEach(c => {
                if (c.registeredSubject) {
                    const regId = typeof c.registeredSubject === 'object' ? c.registeredSubject._id?.toString() : c.registeredSubject.toString();
                    if (regId) cieMap.set(regId, c);
                }
                if (c.subject) {
                    const subjId = typeof c.subject === 'object' ? c.subject._id?.toString() : c.subject.toString();
                    if (subjId) cieMap.set(subjId, c);
                }
            });

            let semResultDoc = await StudentSemesterResult.findOne({
                student: studentId,
                semester: targetSem
            });

            if (!semResultDoc) {
                semResultDoc = new StudentSemesterResult({
                    student: studentId,
                    semester: targetSem,
                    subjects: []
                });
            }

            const existingSubjectMap = new Map();
            if (semResultDoc.subjects) {
                semResultDoc.subjects.forEach(s => {
                    if (s.registeredSubject) {
                        const regId = typeof s.registeredSubject === 'object' ? s.registeredSubject._id?.toString() : s.registeredSubject.toString();
                        if (regId) existingSubjectMap.set(regId, s);
                    }
                });
            }

            const targetRawMax = Number(seeRawMaximum) === 50 ? 50 : 100;
            let targetRawVal = seeRawMarks !== undefined && seeRawMarks !== null && seeRawMarks !== '' && !isNaN(Number(seeRawMarks))
                ? Number(seeRawMarks)
                : null;

            if (targetRawVal !== null) {
                if (targetRawVal < 0) targetRawVal = 0;
                if (targetRawVal > targetRawMax) targetRawVal = targetRawMax;
            }

            if (registeredSubjectId) {
                existingSubjectMap.set(registeredSubjectId.toString(), {
                    registeredSubject: registeredSubjectId,
                    seeRawMarks: targetRawVal,
                    seeRawMaximum: targetRawMax
                });
            }

            const updatedSubjectDocs = [];
            const subjectCalculations = [];

            for (const regSub of allRegSubjects) {
                const regIdStr = regSub._id.toString();
                const subjIdStr = regSub.subject && typeof regSub.subject === 'object' ? regSub.subject._id?.toString() : (regSub.subject?.toString() || null);
                const cieRec = cieMap.get(regIdStr) || (subjIdStr ? cieMap.get(subjIdStr) : null);
                const existingSub = existingSubjectMap.get(regIdStr);

                // Dynamically compute CIE from rules engine to ensure 100% accuracy
                const rawMarks = cieRec?.rawMarks || {};
                const evalTypeOverride = cieRec?.evaluationType || regSub.evaluationType || null;
                const cieCalc = cieRulesEngine.calculateSubjectCie({
                    registeredSubject: regSub,
                    rawMarks,
                    evaluationTypeOverride: evalTypeOverride
                });

                let cieData = null;
                if (cieRec || cieCalc.totalEnteredCount > 0) {
                    cieData = {
                        totalCie: cieCalc.totalCie,
                        isEligible: cieCalc.isEligible,
                        status: cieCalc.status
                    };
                }

                const seeRaw = existingSub?.seeRawMarks !== undefined ? existingSub.seeRawMarks : null;
                const seeRawMax = existingSub?.seeRawMaximum || 100;

                const calc = sgpaRulesEngine.calculateSubjectSgpaResult({
                    registeredSubject: regSub,
                    cieData,
                    seeRawMarks: seeRaw,
                    seeRawMaximum: seeRawMax
                });

                const subjObj = regSub.subject && typeof regSub.subject === 'object' ? regSub.subject : null;

                updatedSubjectDocs.push({
                    registeredSubject: regSub._id,
                    subject: subjObj?._id || regSub.subject || null,
                    subjectCode: subjObj?.code || regSub.customCode || 'SUBJ',
                    subjectName: regSub.customName || subjObj?.name || 'Subject',
                    credits: regSub.registeredCredits || subjObj?.credits || 0,
                    cieRecord: cieRec?._id || null,
                    cieMarks: calc.cieMarks,
                    cieMax: calc.cieMax,
                    cieStatus: calc.cieStatus,
                    seeRawMarks: calc.seeRawMarks,
                    seeRawMaximum: calc.seeRawMaximum,
                    seeScaledMarks: calc.seeScaledMarks,
                    seeScaledMaximum: calc.seeScaledMaximum,
                    totalMarks: calc.totalMarks,
                    totalMaxMarks: 100,
                    grade: calc.grade,
                    gradePoint: calc.gradePoint,
                    creditPoints: calc.creditPoints,
                    status: calc.status,
                    failureReason: calc.failureReason || null
                });

                subjectCalculations.push(calc);
            }

            const overallResult = sgpaRulesEngine.calculateSemesterSgpa(subjectCalculations);

            semResultDoc.subjects = updatedSubjectDocs;
            semResultDoc.totalCredits = overallResult.totalCredits;
            semResultDoc.totalCreditPoints = overallResult.totalCreditPoints;
            semResultDoc.sgpa = overallResult.sgpa;
            semResultDoc.status = overallResult.hasPending ? 'PENDING' : 'COMPLETED';

            await semResultDoc.save();

            if (overallResult.sgpa !== null) {
                await StudentSemester.findOneAndUpdate(
                    { student: studentId, semester: targetSem },
                    {
                        $set: {
                            sgpa: overallResult.sgpa,
                            credits: overallResult.totalCredits,
                            status: 'completed'
                        }
                    },
                    { upsert: true }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'SEE marks saved and SGPA recalculated successfully',
                data: {
                    registeredSubjectId,
                    semester: targetSem,
                    summaryStats: overallResult,
                    subjects: subjectCalculations
                }
            });
        } catch (error) {
            console.error('Error in saveSgpaRecord:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to save SEE marks'
            });
        }
    }

    async getAcademicSummary(req, res) {
        try {
            const studentId = req.student._id;
            const currentStudentSem = req.student.semester || 1;
            const requestedSem = req.query.semester ? Number(req.query.semester) : currentStudentSem;

            const student = await StudentAccount.findById(studentId).populate('branch');

            const studentInfo = {
                name: student?.name || 'Student',
                usn: student?.usn || 'N/A',
                branch: student?.branch?.name || (typeof student?.branch === 'string' ? student.branch : 'Information Science and Engineering'),
                graduationYear: student?.graduationYear || (new Date().getFullYear() + 2),
                currentSemester: currentStudentSem
            };

            const allRegistered = await StudentRegisteredSubject.find({
                student: studentId,
                $and: [
                    { $or: [{ semester: requestedSem }, { semester: { $exists: false } }] },
                    { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
                ]
            }).populate('subject');

            const allRegistrations = await StudentRegisteredSubject.find({ student: studentId });
            const availableSemSet = new Set();
            allRegistrations.forEach(r => { if (r.semester) availableSemSet.add(r.semester); });
            availableSemSet.add(currentStudentSem);
            const availableSemesters = Array.from(availableSemSet).sort((a, b) => a - b).map(s => ({
                semester: s,
                isCurrent: s === currentStudentSem,
                label: `Semester ${s}`
            }));

            const semesterResults = await StudentSemesterResult.find({ student: studentId }).sort({ semester: 1 });

            let totalWeightedGp = 0;
            let totalEarnedCredits = 0;
            let highestSgpa = null;
            let lowestSgpa = null;
            const semesterResultMap = new Map();
            const semesterTrend = [];

            semesterResults.forEach(sr => {
                semesterResultMap.set(sr.semester, sr);
                if (sr.sgpa !== null && sr.sgpa !== undefined) {
                    if (highestSgpa === null || sr.sgpa > highestSgpa) highestSgpa = sr.sgpa;
                    if (lowestSgpa === null || sr.sgpa < lowestSgpa) lowestSgpa = sr.sgpa;
                    totalWeightedGp += (sr.sgpa * (sr.totalCredits || 0));
                    totalEarnedCredits += (sr.totalCredits || 0);

                    semesterTrend.push({
                        semester: sr.semester,
                        sgpa: sr.sgpa,
                        credits: sr.totalCredits,
                        status: sr.status
                    });
                }
            });

            const currentCgpa = totalEarnedCredits > 0 ? Number((totalWeightedGp / totalEarnedCredits).toFixed(2)) : (student?.cgpa || null);
            const selectedSemResult = semesterResultMap.get(requestedSem);
            const currentSgpa = selectedSemResult?.sgpa || null;

            const totalDegreeCredits = 160;
            const degreeProgress = {
                creditsEarned: totalEarnedCredits,
                totalDegreeCredits,
                remainingCredits: Math.max(0, totalDegreeCredits - totalEarnedCredits),
                percentage: Math.min(100, Number(((totalEarnedCredits / totalDegreeCredits) * 100).toFixed(1)))
            };

            const cieRecords = await StudentCieRecord.find({
                student: studentId,
                $or: [{ semester: requestedSem }, { semester: { $exists: false } }]
            });

            let cieSum = 0;
            let cieCount = 0;
            let cieNeCount = 0;

            cieRecords.forEach(c => {
                const totalCie = c.calculatedResult?.totalCie;
                if (totalCie !== undefined && totalCie !== null) {
                    cieSum += totalCie;
                    cieCount++;
                    if (totalCie < 20 || c.calculatedResult?.status === 'NOT_ELIGIBLE') {
                        cieNeCount++;
                    }
                }
            });

            const cieAverage = cieCount > 0 ? Number((cieSum / cieCount).toFixed(1)) : null;

            const academicRisks = [];
            if (cieNeCount > 0) {
                academicRisks.push({
                    type: 'CIE_NE',
                    severity: 'HIGH',
                    title: `${cieNeCount} Subject(s) CIE Not Eligible`,
                    message: `CIE score is below minimum threshold requirement.`,
                    actionText: 'View CIE',
                    actionUrl: '/home/cie'
                });
            }

            if (selectedSemResult && selectedSemResult.subjects) {
                selectedSemResult.subjects.forEach(s => {
                    if (s.grade === 'F') {
                        academicRisks.push({
                            type: 'FAILED_SUBJECT',
                            severity: 'HIGH',
                            title: `${s.subjectCode} Failed`,
                            message: `Failed in SEE examination`,
                            actionText: 'View SGPA',
                            actionUrl: '/home/sgpa'
                        });
                    }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Academic summary retrieved successfully',
                data: {
                    studentInfo,
                    requestedSemester: requestedSem,
                    availableSemesters,
                    heroStats: {
                        cgpa: currentCgpa,
                        sgpa: currentSgpa,
                        creditsEarned: totalEarnedCredits,
                        totalDegreeCredits,
                        currentSemester: currentStudentSem
                    },
                    semesterTrend: {
                        history: semesterTrend,
                        highestSgpa,
                        lowestSgpa,
                        currentCgpa
                    },
                    selectedSemesterResult: selectedSemResult,
                    semesterHistory: semesterResults,
                    academicHealth: {
                        cieAverage,
                        cieNeCount,
                        cieCount
                    },
                    degreeProgress,
                    academicRisks
                }
            });
        } catch (error) {
            console.error('Error in getAcademicSummary:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch academic summary'
            });
        }
    }

    async addExtraClassV2(req, res) {
        try {
            const studentId = req.student._id;
            const { subjectId, date, time, status, remarks, lectureType } = req.body;
            const semester = req.student.semester;

            // Check locks
            const SemesterSnapshot = require('../../../models/SemesterSnapshot');
            const snapshotExists = await SemesterSnapshot.findOne({ student: studentId, semester });
            if (snapshotExists) {
                return res.status(400).json({ success: false, message: 'Semester archived. Attendance is read-only.' });
            }

            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            const entry = new StudentAttendanceEntry({
                student: studentId,
                semester,
                subject: subjectId,
                date,
                timeSlot: time || '',
                status,
                remarks: remarks || '',
                lectureType: lectureType || 'Lecture',
                isExtraClass: true,
                createdBy: 'Student'
            });
            await entry.save();

            return res.status(200).json({
                success: true,
                message: 'Extra class logged successfully',
                data: entry
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to log extra class'
            });
        }
    }

    async deleteExtraClassV2(req, res) {
        try {
            const studentId = req.student._id;
            const { historyId } = req.params;
            const semester = req.student.semester;

            // Check locks
            const SemesterSnapshot = require('../../../models/SemesterSnapshot');
            const snapshotExists = await SemesterSnapshot.findOne({ student: studentId, semester });
            if (snapshotExists) {
                return res.status(400).json({ success: false, message: 'Semester archived. Attendance is read-only.' });
            }

            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            const entry = await StudentAttendanceEntry.findOne({ _id: historyId, student: studentId });
            if (!entry) {
                return res.status(404).json({ success: false, message: 'Attendance entry not found' });
            }

            if (!entry.isExtraClass) {
                return res.status(400).json({ success: false, message: 'Cannot delete regular expected classes' });
            }

            await StudentAttendanceEntry.deleteOne({ _id: historyId });

            return res.status(200).json({
                success: true,
                message: 'Extra class deleted successfully'
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete extra class'
            });
        }
    }

    async resetTimetable(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.student.semester || 1;

            const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
            const StudentTimetable = require('../../../models/StudentTimetable');
            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            const StudentTimetableBackup = require('../../../models/StudentTimetableBackup');

            // 1. Fetch current data
            const config = await StudentTimetableConfiguration.findOne({ student: studentId, semester });
            const slots = await StudentTimetable.find({ student: studentId, semester });
            const attendanceEntries = await StudentAttendanceEntry.find({ student: studentId, semester });

            // 2. Create backup (TTL will expire in 24 hours)
            await StudentTimetableBackup.deleteOne({ student: studentId, semester });
            const backup = new StudentTimetableBackup({
                student: studentId,
                semester,
                configuration: config ? config.toObject({ flattenMaps: true }) : null,
                slots: slots.map(s => s.toObject({ flattenMaps: true })),
                attendanceEntries: attendanceEntries.map(e => e.toObject({ flattenMaps: true }))
            });
            await backup.save();

            // 3. Clear current data
            if (config) await StudentTimetableConfiguration.deleteOne({ _id: config._id });
            await StudentTimetable.deleteMany({ student: studentId, semester });
            await StudentAttendanceEntry.deleteMany({ student: studentId, semester });
            await StudentExpectedSchedule.deleteOne({ student: studentId, semester });

            return res.status(200).json({
                success: true,
                message: 'Timetable reset successfully. You can undo this action within 24 hours.',
                data: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to reset timetable'
            });
        }
    }

    async undoResetTimetable(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.student.semester || 1;

            const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
            const StudentTimetable = require('../../../models/StudentTimetable');
            const StudentAttendanceEntry = require('../../../models/StudentAttendanceEntry');
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            const StudentTimetableBackup = require('../../../models/StudentTimetableBackup');

            // 1. Find backup
            const backup = await StudentTimetableBackup.findOne({ student: studentId, semester });
            if (!backup) {
                return res.status(400).json({
                    success: false,
                    message: 'No backup found or undo window (24 hours) has expired.'
                });
            }

            // 2. Restore data
            if (backup.configuration) {
                const configData = { ...backup.configuration };
                delete configData._id;
                await StudentTimetableConfiguration.findOneAndUpdate(
                    { student: studentId, semester },
                    configData,
                    { upsert: true, new: true }
                );
            }

            if (backup.slots && backup.slots.length > 0) {
                await StudentTimetable.deleteMany({ student: studentId, semester });
                const slotsToInsert = backup.slots.map(s => {
                    const sData = { ...s };
                    delete sData._id;
                    return sData;
                });
                await StudentTimetable.insertMany(slotsToInsert);
            }

            if (backup.attendanceEntries && backup.attendanceEntries.length > 0) {
                await StudentAttendanceEntry.deleteMany({ student: studentId, semester });
                const entriesToInsert = backup.attendanceEntries.map(e => {
                    const eData = { ...e };
                    delete eData._id;
                    return eData;
                });
                await StudentAttendanceEntry.insertMany(entriesToInsert);
            }

            // 3. Clear expected schedule cache
            await StudentExpectedSchedule.deleteOne({ student: studentId, semester });

            // 4. Recalculate expected schedule cache
            const { generateAndCacheExpectedSchedule } = require('../../../services/expectedClassGenerator');
            await generateAndCacheExpectedSchedule(studentId, semester);

            // 5. Delete backup
            await StudentTimetableBackup.deleteOne({ _id: backup._id });

            return res.status(200).json({
                success: true,
                message: 'Timetable undo reset completed successfully. All configurations and attendance logs restored.',
                data: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to undo reset'
            });
        }
    }

    async promoteSemesterV2(req, res) {
        try {
            const studentId = req.student._id;
            const StudentAccount = require('../../../models/StudentAccount');
            const student = await StudentAccount.findById(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student account not found' });
            }

            const semester = student.semester || 1;

            const StudentTimetableConfiguration = require('../../../models/StudentTimetableConfiguration');
            const StudentTimetable = require('../../../models/StudentTimetable');
            const StudentRegisteredSubject = require('../../../models/StudentRegisteredSubject');
            const AcademicCalendarEvent = require('../../academic/AcademicCalendarEvent');
            const AcademicEvent = require('../../academic/AcademicEvent');
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            const SemesterSnapshot = require('../../../models/SemesterSnapshot');

            const configuration = await StudentTimetableConfiguration.findOne({ student: studentId, semester });
            const timetable = await StudentTimetable.find({ student: studentId, semester, isActive: true });
            const subjects = await StudentRegisteredSubject.find({ student: studentId, semester, isActive: true }).populate('subject');

            let startDate = new Date();
            let endDate = new Date();
            if (configuration) {
                startDate = new Date(configuration.semesterStartDate);
                endDate = new Date(configuration.lastWorkingDate);
            }

            const events = await AcademicEvent.find({
                student: studentId,
                date: { $gte: formatDate(startDate), $lte: formatDate(endDate) }
            });

            const holidays = await AcademicCalendarEvent.find({
                date: { $gte: formatDate(startDate), $lte: formatDate(endDate) },
                category: 'holiday'
            });

            const cachedSchedule = await StudentExpectedSchedule.findOne({ student: studentId, semester });
            const expectedClasses = cachedSchedule ? cachedSchedule.classes : [];

            // Save Snapshot
            await SemesterSnapshot.findOneAndUpdate(
                { student: studentId, semester },
                {
                    student: studentId,
                    semester,
                    configuration: configuration ? configuration.toObject({ flattenMaps: true }) : null,
                    timetable,
                    subjects,
                    events,
                    workingDays: configuration ? (configuration.workingDays instanceof Map ? Object.fromEntries(configuration.workingDays) : configuration.workingDays) : {},
                    holidays,
                    expectedClasses
                },
                { upsert: true, new: true }
            );

            // Deactivate active sets
            await StudentTimetable.updateMany({ student: studentId, semester }, { isActive: false });
            await StudentRegisteredSubject.updateMany({ student: studentId, semester }, { isActive: false });

            // Increment
            student.semester = semester + 1;
            await student.save();

            // Set up config for next semester
            const nextStart = new Date();
            const nextEnd = new Date();
            nextEnd.setMonth(nextEnd.getMonth() + 4);

            await StudentTimetableConfiguration.findOneAndUpdate(
                { student: studentId, semester: student.semester },
                {
                    student: studentId,
                    semester: student.semester,
                    semesterStartDate: nextStart,
                    lastWorkingDate: nextEnd,
                    version: 1
                },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: `Successfully promoted to semester ${student.semester}`,
                data: { currentSemester: student.semester }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to promote semester'
            });
        }
    }

    async exportSemesterReportV2(req, res) {
        try {
            const studentId = req.student._id;
            const requestedSemester = parseInt(req.query.semester) || req.student.semester;
            const format = req.query.format || 'csv';

            // Gather filters
            const filters = {};
            if (req.query.subjectId) filters.subjectId = req.query.subjectId;
            if (req.query.month) filters.month = req.query.month;
            if (req.query.startDate) filters.startDate = req.query.startDate;
            if (req.query.endDate) filters.endDate = req.query.endDate;
            if (req.query.status) filters.status = req.query.status;
            if (req.query.lectureType) filters.lectureType = req.query.lectureType;

            const { compileSemesterAnalytics, formatDate } = require('../../../services/attendanceEngine');
            const analytics = await compileSemesterAnalytics(studentId, requestedSemester, filters);

            if (format === 'pdf') {
                const AttendanceReportBuilder = require('../../../services/attendanceReportBuilder');
                const builder = new AttendanceReportBuilder(analytics);
                const pdfBuffer = await builder.build();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=semester-${requestedSemester}-attendance-report.pdf`);
                return res.status(200).send(pdfBuffer);
            } else {
                // ZIP structure CSV export
                const overall = analytics.overall;
                const semesterCsv = [
                    ['Semester', 'Attendance %', 'Expected', 'Conducted', 'Present', 'Absent', 'Medical', 'Cancelled', 'Streak', 'Can Miss', 'Need To Attend'],
                    [requestedSemester, `${overall.attendance}%`, overall.expected, overall.conducted, overall.present, overall.absent, overall.medicalLeave, overall.cancelled, overall.streak.current, overall.canMiss, overall.needToAttend]
                ].map(r => r.join(',')).join('\n');

                const monthlyHeaders = ['Month', 'Expected', 'Conducted', 'Present', 'Attendance %'];
                const monthlyRows = analytics.monthlyAnalytics.map(m => [
                    `"${m.month}"`, m.expected, m.conducted, m.present, `${m.attendancePercentage}%`
                ]);
                const monthlyCsv = [monthlyHeaders, ...monthlyRows].map(r => r.join(',')).join('\n');

                const subjHeaders = ['Subject', 'Code', 'Expected', 'Conducted', 'Present', 'Absent', 'Attendance %', 'Current Streak', 'Longest Streak', 'Can Miss', 'Need To Attend', 'Status'];
                const subjRows = analytics.subjects.map(s => [
                    `"${s.name}"`, `"${s.code}"`, s.analytics.expected, s.analytics.conducted, s.analytics.present, s.analytics.absent, `${s.attendancePercentage}%`, s.analytics.streak.current, s.analytics.streak.longest, s.analytics.canMiss, s.analytics.needToAttend, `"${s.analytics.healthStatus}"`
                ]);
                const subjectsCsv = [subjHeaders, ...subjRows].map(r => r.join(',')).join('\n');

                const timelineHeaders = ['Date', 'Day', 'Subject', 'Subject Code', 'Start Time', 'End Time', 'Lecture Type', 'Status', 'Source', 'Remarks'];
                const timelineRows = analytics.timeline.map(t => {
                    const dayName = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
                    const subj = analytics.subjects.find(s => s.subjectId.toString() === t.subject.toString());
                    const name = subj ? subj.name : 'Unknown';
                    const code = subj ? subj.code : '';
                    const times = (t.timeSlot || '').split('-');
                    const start = times[0] || '';
                    const end = times[1] || '';
                    return [
                        t.date, dayName, `"${name}"`, `"${code}"`, `"${start}"`, `"${end}"`, `"${t.lectureType}"`, `"${t.status}"`, `"${t.createdBy}"`, `"${t.remarks || ''}"`
                    ];
                });
                const timelineCsv = [timelineHeaders, ...timelineRows].map(r => r.join(',')).join('\n');

                const eventsHeaders = ['Date', 'Event', 'Type', 'Holiday', 'Exam', 'Festival', 'Classes Suspended'];
                const eventsRows = [];
                analytics.holidaysList.forEach(h => {
                    eventsRows.push([
                        formatDate(h.date), `"${h.name}"`, '"Holiday"', '"Yes"', '"No"', '"No"', '"Yes"'
                    ]);
                });
                analytics.eventsList.forEach(e => {
                    const isExam = e.type === 'exam' || (e.title && e.title.toLowerCase().includes('cie'));
                    const isFestival = e.type === 'festival' || e.type === 'event';
                    const isSuspended = e.type === 'suspended' || 
                                       (e.metadata && (e.metadata.get('classesSuspended') === true || e.metadata.get('classesSuspended') === 'true')) ||
                                       (e.description && e.description.toLowerCase().includes('suspended'));
                    eventsRows.push([
                        formatDate(e.date), `"${e.title || e.description || 'Event'}"`, `"${e.type}"`, '"No"', isExam ? '"Yes"' : '"No"', isFestival ? '"Yes"' : '"No"', isSuspended ? '"Yes"' : '"No"'
                    ]);
                });
                const eventsCsv = [eventsHeaders, ...eventsRows].map(r => r.join(',')).join('\n');

                const reportMetadataJson = JSON.stringify({
                    reportVersion: analytics.metadata.reportVersion,
                    generatedAt: analytics.metadata.generatedOn,
                    semester: requestedSemester,
                    filters: analytics.metadata.filtersUsed,
                    student: {
                        id: analytics.student.id,
                        name: analytics.student.name,
                        usn: analytics.student.usn,
                        college: analytics.student.college,
                        branch: analytics.student.branch,
                        scheme: analytics.student.scheme
                    }
                }, null, 2);

                const AdmZip = require('adm-zip');
                const zip = new AdmZip();
                
                zip.addFile('Summary/Semester.csv', Buffer.from(semesterCsv));
                zip.addFile('Summary/Monthly.csv', Buffer.from(monthlyCsv));
                zip.addFile('Subjects/Subjects.csv', Buffer.from(subjectsCsv));
                zip.addFile('Timeline/Timeline.csv', Buffer.from(timelineCsv));
                zip.addFile('Events/Events.csv', Buffer.from(eventsCsv));
                zip.addFile('Metadata/Report.json', Buffer.from(reportMetadataJson));
                
                const zipBuffer = zip.toBuffer();

                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename=semester-${requestedSemester}-attendance-report.zip`);
                return res.status(200).send(zipBuffer);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to export report'
            });
        }
    }

    async recalculateAllAttendanceV2(req, res) {
        try {
            const studentId = req.student._id;
            const semester = req.student.semester;
            const { generateAndCacheExpectedSchedule } = require('../../../services/expectedClassGenerator');
            await generateAndCacheExpectedSchedule(studentId, semester);

            return res.status(200).json({
                success: true,
                message: 'Expected schedule and cache generated successfully'
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to generate cache'
            });
        }
    }

    async recalculateAllStudentAttendance(studentId) {
        try {
            const StudentAccount = require('../../../models/StudentAccount');
            const student = await StudentAccount.findById(studentId);
            if (!student) return [];

            const { generateAndCacheExpectedSchedule } = require('../../../services/expectedClassGenerator');
            await generateAndCacheExpectedSchedule(studentId, student.semester);
            return [];
        } catch (err) {
            console.error('Recalculate error:', err);
            return [];
        }
    }

    async getAcademicEvents(req, res) {
        try {
            const studentId = req.student._id;
            const StudentAcademicEvent = require('../../../models/StudentAcademicEvent');
            const events = await StudentAcademicEvent.find({ student: studentId }).sort({ startDate: 1 });
            return res.status(200).json({
                success: true,
                message: 'Academic events retrieved successfully',
                data: events
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to fetch academic events'
            });
        }
    }

    async createAcademicEvent(req, res) {
        try {
            const studentId = req.student._id;
            const { 
                title, eventType, scope, startDate, endDate, isAllDay,
                classesSuspended, suspensionType, suspensionStartMinute, suspensionEndMinute,
                affectedSubjects, description, repeat 
            } = req.body;

            let color = 'Green';
            if (eventType === 'Exam') color = 'Red';
            else if (eventType === 'CIE / Test') color = 'Orange';
            else if (eventType === 'Quiz') color = 'Purple';
            else if (eventType === 'Vacation') color = 'Teal';
            else if (eventType === 'Semester End') color = 'Rose';
            else if (eventType === 'Government Holiday') color = 'Yellow';
            else if (eventType === 'College Fest') color = 'Blue';

            const StudentAcademicEvent = require('../../../models/StudentAcademicEvent');
            const newEvent = new StudentAcademicEvent({
                student: studentId,
                title,
                eventType,
                scope: scope || 'personal',
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isAllDay: isAllDay ?? true,
                color,
                classesSuspended: classesSuspended ?? false,
                suspensionType: suspensionType || 'none',
                suspensionStartMinute: suspensionStartMinute ?? 0,
                suspensionEndMinute: suspensionEndMinute ?? 0,
                affectedSubjects: affectedSubjects || [],
                description: description || '',
                repeat: repeat || 'none'
            });

            await newEvent.save();

            // Dynamic cache invalidation: delete cached schedules so they regenerate on-demand
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            await StudentExpectedSchedule.deleteMany({ student: studentId });

            return res.status(201).json({
                success: true,
                message: 'Academic event created successfully',
                data: newEvent
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to create academic event'
            });
        }
    }

    async updateAcademicEvent(req, res) {
        try {
            const studentId = req.student._id;
            const { id } = req.params;
            const { 
                title, eventType, scope, startDate, endDate, isAllDay,
                classesSuspended, suspensionType, suspensionStartMinute, suspensionEndMinute,
                affectedSubjects, description, repeat 
            } = req.body;

            let color = 'Green';
            if (eventType === 'Exam') color = 'Red';
            else if (eventType === 'CIE / Test') color = 'Orange';
            else if (eventType === 'Quiz') color = 'Purple';
            else if (eventType === 'Vacation') color = 'Teal';
            else if (eventType === 'Semester End') color = 'Rose';
            else if (eventType === 'Government Holiday') color = 'Yellow';
            else if (eventType === 'College Fest') color = 'Blue';

            const StudentAcademicEvent = require('../../../models/StudentAcademicEvent');
            const updatedEvent = await StudentAcademicEvent.findOneAndUpdate(
                { _id: id, student: studentId },
                {
                    title,
                    eventType,
                    scope,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    isAllDay,
                    color,
                    classesSuspended,
                    suspensionType,
                    suspensionStartMinute,
                    suspensionEndMinute,
                    affectedSubjects: affectedSubjects || [],
                    description,
                    repeat
                },
                { new: true }
            );

            if (!updatedEvent) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            // Dynamic cache invalidation: delete cached schedules so they regenerate on-demand
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            await StudentExpectedSchedule.deleteMany({ student: studentId });

            return res.status(200).json({
                success: true,
                message: 'Academic event updated successfully',
                data: updatedEvent
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update academic event'
            });
        }
    }

    async deleteAcademicEvent(req, res) {
        try {
            const studentId = req.student._id;
            const { id } = req.params;

            const StudentAcademicEvent = require('../../../models/StudentAcademicEvent');
            const deleted = await StudentAcademicEvent.findOneAndDelete({ _id: id, student: studentId });
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            // Dynamic cache invalidation: delete cached schedules so they regenerate on-demand
            const StudentExpectedSchedule = require('../../../models/StudentExpectedSchedule');
            await StudentExpectedSchedule.deleteMany({ student: studentId });

            return res.status(200).json({
                success: true,
                message: 'Academic event deleted successfully',
                data: deleted
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete academic event'
            });
        }
    }
}

// Helpers
function calculateOverallStreak(timeline) {
    const todayStr = formatDate(new Date());
    const sorted = [...timeline]
        .filter(t => t.status !== 'Cancelled' && t.status !== 'Yet To Be Taken' && t.date <= todayStr)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

    let current = 0;
    let longest = 0;
    let temp = 0;

    for (const t of sorted) {
        if (t.status === 'Present' || t.status === 'On Duty') {
            temp++;
            if (temp > longest) longest = temp;
        } else {
            temp = 0;
        }
    }

    for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (t.status === 'Present' || t.status === 'On Duty') {
            current++;
        } else {
            break;
        }
    }

    return { current, longest };
}

function formatDate(date) {
    const d = new Date(date);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

async function generateAttendancePDF(studentName, semester, overallStats, subjectsData, timelineData) {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
        try {
            const chunks = [];
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                autoFirstPage: true
            });

            doc.on('data', c => chunks.push(c));
            doc.on('error', reject);
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            const C_PRIMARY = '#1e1b4b';
            const C_TEXT = '#1e293b';
            const C_MUTED = '#64748b';
            const C_ACCENT = '#7c3aed';
            const C_BORDER = '#cbd5e1';
            const C_BG_ROW = '#f8fafc';

            const hr = (y) => {
                doc.save().strokeColor(C_BORDER).lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke().restore();
            };

            // Page 1: Overall Summary
            doc.fillColor(C_PRIMARY).fontSize(24).font('Helvetica-Bold').text('AskUrSenior Academic Portal', 40, 50);
            doc.fillColor(C_MUTED).fontSize(10).font('Helvetica').text(`Report Generated On: ${new Date().toLocaleDateString('en-GB')}`, 40, 80);
            doc.text('Attendance Engine Version: 2.1.0', 40, 95);
            doc.text(`Semester Snapshot: Semester ${semester} Active`, 40, 110);

            doc.save().rect(40, 140, 515, 2).fill(C_ACCENT).restore();

            doc.fillColor(C_TEXT).fontSize(16).font('Helvetica-Bold').text('Semester Attendance Summary', 40, 160);

            const stats = [
                ['Semester', `Semester ${semester}`],
                ['Overall Attendance Rate', `${overallStats.attendance}%`],
                ['Total Expected Classes', String(overallStats.expected)],
                ['Total Conducted Classes', String(overallStats.conducted)],
                ['Classes Attended (Present)', String(overallStats.present)],
                ['Current Present Streak', `${overallStats.streak?.current || 0} classes`],
                ['Longest Present Streak', `${overallStats.streak?.longest || 0} classes`],
                ['Safe to Miss Classes', `${overallStats.canMiss || 0} classes`],
                ['Consecutive Classes Required', `${overallStats.needToAttend || 0} classes`]
            ];

            let curY = 190;
            stats.forEach(([label, value]) => {
                doc.fillColor(C_MUTED).fontSize(10).font('Helvetica').text(label, 60, curY);
                doc.fillColor(C_TEXT).fontSize(11).font('Helvetica-Bold').text(value, 320, curY);
                curY += 24;
                hr(curY - 6);
            });

            // Page 2: Subject Summary
            doc.addPage();
            doc.fillColor(C_PRIMARY).fontSize(18).font('Helvetica-Bold').text('Subject-wise Attendance Details', 40, 50);
            doc.save().rect(40, 75, 515, 1).fill(C_BORDER).restore();

            let subjY = 90;
            subjectsData.forEach((s) => {
                if (subjY > 700) {
                    doc.addPage();
                    subjY = 50;
                }

                doc.fillColor(C_TEXT).fontSize(12).font('Helvetica-Bold').text(s.name, 40, subjY);
                doc.fillColor(C_MUTED).fontSize(9).font('Helvetica').text(s.code || 'N/A', 40, subjY + 14);

                doc.save().rect(220, subjY + 4, 200, 8).fill('#e2e8f0').restore();
                const progressWidth = Math.min(200, (s.attendancePercentage / 100) * 200);
                const progressColor = s.attendancePercentage >= 90 ? '#10b981' : (s.attendancePercentage >= 85 ? '#fbbf24' : '#ef4444');
                doc.save().rect(220, subjY + 4, progressWidth, 8).fill(progressColor).restore();

                doc.fillColor(C_TEXT).fontSize(11).font('Helvetica-Bold').text(`${s.attendancePercentage}%`, 435, subjY + 2);
                doc.fillColor(C_MUTED).fontSize(9).font('Helvetica').text(`${s.analytics.present} / ${s.analytics.conducted} (${s.analytics.expected} exp)`, 480, subjY + 3);

                subjY += 36;
                hr(subjY - 8);
            });

            // Page 3: Monthly Analytics
            doc.addPage();
            doc.fillColor(C_PRIMARY).fontSize(18).font('Helvetica-Bold').text('Monthly Analytics & Trends', 40, 50);
            doc.save().rect(40, 75, 515, 1).fill(C_BORDER).restore();

            const monthsData = {};
            timelineData.forEach((t) => {
                if (t.status === 'Cancelled' || t.status === 'Yet To Be Taken') return;
                const d = new Date(t.date);
                const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                if (!monthsData[monthName]) {
                    monthsData[monthName] = { present: 0, conducted: 0 };
                }
                monthsData[monthName].conducted++;
                if (t.status === 'Present' || t.status === 'On Duty') {
                    monthsData[monthName].present++;
                }
            });

            let monthY = 90;
            Object.entries(monthsData).forEach(([mName, data]) => {
                const pct = data.conducted > 0 ? Math.round((data.present / data.conducted) * 100) : 100;
                doc.fillColor(C_TEXT).fontSize(11).font('Helvetica-Bold').text(mName, 50, monthY);
                doc.fillColor(C_MUTED).fontSize(10).font('Helvetica').text(`${data.present} present of ${data.conducted} conducted`, 250, monthY);
                doc.fillColor(C_TEXT).fontSize(11).font('Helvetica-Bold').text(`${pct}%`, 480, monthY);
                monthY += 30;
                hr(monthY - 8);
            });

            // Page 4+: Timeline
            doc.addPage();
            doc.fillColor(C_PRIMARY).fontSize(18).font('Helvetica-Bold').text('Chronological Attendance Timeline', 40, 50);
            doc.save().rect(40, 75, 515, 1).fill(C_BORDER).restore();

            let rowY = 90;
            doc.fillColor(C_PRIMARY).fontSize(9).font('Helvetica-Bold');
            doc.text('Date', 45, rowY);
            doc.text('Subject', 130, rowY);
            doc.text('Time', 250, rowY);
            doc.text('Type', 340, rowY);
            doc.text('Status', 410, rowY);
            doc.text('Remarks', 475, rowY);
            rowY += 18;
            hr(rowY - 4);

            timelineData.forEach((t, index) => {
                if (rowY > 730) {
                    doc.addPage();
                    rowY = 50;
                    doc.fillColor(C_PRIMARY).fontSize(9).font('Helvetica-Bold');
                    doc.text('Date', 45, rowY);
                    doc.text('Subject', 130, rowY);
                    doc.text('Time', 250, rowY);
                    doc.text('Type', 340, rowY);
                    doc.text('Status', 410, rowY);
                    doc.text('Remarks', 475, rowY);
                    rowY += 18;
                    hr(rowY - 4);
                }

                if (index % 2 === 0) {
                    doc.save().rect(40, rowY - 2, 515, 16).fill(C_BG_ROW).restore();
                }

                doc.fillColor(C_TEXT).fontSize(9).font('Helvetica');
                const formattedDate = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                doc.text(formattedDate, 45, rowY);

                const sName = subjectsData.find(s => s.subjectId.toString() === t.subject.toString())?.name || 'Unknown';
                doc.text(sName, 130, rowY, { width: 110, ellipsis: true });
                doc.text(t.timeSlot || 'Anytime', 250, rowY);
                doc.text(t.lectureType || 'Lecture', 340, rowY);

                const statusColor = t.status === 'Present' || t.status === 'On Duty' ? '#10b981' : (t.status === 'Absent' ? '#ef4444' : '#64748b');
                doc.save().fillColor(statusColor).font('Helvetica-Bold').text(t.status, 410, rowY).restore();

                doc.fillColor(C_MUTED).font('Helvetica').text(t.remarks || '-', 475, rowY, { width: 80, ellipsis: true });

                rowY += 18;
            });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

const controllerInstance = new AuthV2Controller();
controllerInstance.studentAccountRepository = studentAccountRepository;
controllerInstance.authV2Service = authV2Service;
module.exports = controllerInstance;
