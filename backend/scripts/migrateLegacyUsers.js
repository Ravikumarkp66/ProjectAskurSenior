/**
 * Legacy User -> StudentAccount Migration Script
 * 
 * Production-ready, idempotent, batch-processed migration script.
 * Migrates all legacy User records into StudentAccount documents without data loss.
 * 
 * Usage:
 *   node scripts/migrateLegacyUsers.js [--dry-run] [--batch-size=100] [--verbose]
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '..');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));

const User = require(path.join(backendDir, 'models/User'));
const StudentAccount = require(path.join(backendDir, 'models/StudentAccount'));
const Branch = require(path.join(backendDir, 'models/Branch'));
const Scheme = require(path.join(backendDir, 'models/Scheme'));

// Parse Command Line Arguments
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const IS_VERBOSE = args.includes('--verbose');
const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) || 100 : 100;

// Memory Caches for ultra-fast performance
let branchMapCache = null;
let schemeMapCache = null;
let currentSeq = 1;

const collegeCodeMap = {
    'SI': 'Siddaganga Institute of Technology',
    'RV': 'R.V. College of Engineering',
    'MS': 'Ramaiah Institute of Technology',
    'BM': 'B.M.S. College of Engineering',
    'PE': 'PES College of Engineering, Mandya',
    'DS': 'Dayananda Sagar College of Engineering',
    'JS': 'JSS Academy of Technical Education',
    'SJ': 'Sri Jayachamarajendra College of Engineering',
    'NH': 'New Horizon College of Engineering',
    'MV': 'Sir M. Visvesvaraya Institute of Technology',
    'BI': 'Bangalore Institute of Technology',
    'ME': 'Malnad College of Engineering',
    'NI': 'The National Institute of Engineering'
};

const branchShortMap = {
    'CS': 'CSE',
    'IS': 'ISE',
    'EC': 'ECE',
    'EE': 'EEE',
    'ME': 'MECH',
    'CV': 'CIVIL',
    'AI': 'AIML',
    'AM': 'AIML',
    'DS': 'DS',
    'CB': 'CSBS',
    'BT': 'BT',
    'IT': 'IT',
    'CH': 'CH',
    'ET': 'ET',
    'EI': 'EI'
};

/**
 * Pre-cache Branches, Schemes, and highest Student ID sequence from DB
 */
async function initializeCaches() {
    const branches = await Branch.find({}).lean();
    branchMapCache = new Map();
    branches.forEach(b => {
        if (b.shortName) branchMapCache.set(b.shortName.toUpperCase(), b._id);
        if (b.code) branchMapCache.set(b.code.toUpperCase(), b._id);
    });

    const schemes = await Scheme.find({}).lean();
    schemeMapCache = schemes;

    // Find highest studentId in DB
    const lastAccount = await StudentAccount.findOne({ studentId: /^ASK\d+$/ }).sort({ studentId: -1 }).lean();
    if (lastAccount && lastAccount.studentId) {
        const numPart = parseInt(lastAccount.studentId.replace('ASK', ''), 10);
        if (!isNaN(numPart)) {
            currentSeq = numPart + 1;
        }
    }
}

/**
 * Fast V2 Branch ID resolver
 */
function resolveV2BranchId(legacyCode) {
    if (!legacyCode) return null;
    const code = legacyCode.toUpperCase().trim();
    const mapped = branchShortMap[code] || code;
    return branchMapCache.get(mapped) || branchMapCache.get(code) || null;
}

/**
 * Fast USN Parser using memory caches
 */
function fastParseUsn(usn) {
    if (!usn) return null;
    const cleanUsn = usn.trim().toUpperCase();
    const vtuRegex = /^([1-4])([A-Z]{2})([0-9]{2})([A-Z]{2,3})([0-9]{3})$/;
    const match = cleanUsn.match(vtuRegex);
    if (!match) return null;

    const [_, regionDigit, collegeCode, yearCode, branchCode, rollCode] = match;

    const admissionYear = 2000 + parseInt(yearCode, 10);
    const graduationYear = admissionYear + 4;
    const collegeName = collegeCodeMap[collegeCode] || `VTU College (${collegeCode})`;
    const branchShort = branchShortMap[branchCode] || branchCode;
    const branchId = branchMapCache.get(branchShort) || branchMapCache.get(branchCode) || null;

    // Resolve scheme
    let schemeNameStr = admissionYear === 2021 ? '2021' : (admissionYear >= 2018 && admissionYear <= 2020 ? '2018' : '2022');
    const matchedScheme = schemeMapCache.find(s => s.name && s.name.includes(schemeNameStr));
    const schemeId = matchedScheme ? matchedScheme._id : null;

    // Estimate semester
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const yearsDiff = currentYear - admissionYear;
    let semesterEstimate = (currentMonth >= 7 || currentMonth === 0) ? (yearsDiff * 2 + 1) : (yearsDiff * 2);
    semesterEstimate = Math.max(1, Math.min(8, semesterEstimate));

    return {
        usn: cleanUsn,
        collegeName,
        branchShort,
        branchId,
        schemeId,
        admissionYear,
        graduationYear,
        currentSemesterEstimate: semesterEstimate
    };
}

/**
 * Main Migration Function
 */
async function runMigration() {
    console.log('====================================================');
    console.log('🚀 Starting Legacy User -> StudentAccount Migration');
    console.log(`- Mode: ${IS_DRY_RUN ? 'DRY-RUN (No database writes)' : 'LIVE MIGRATION'}`);
    console.log(`- Batch Size: ${BATCH_SIZE}`);
    console.log('====================================================\n');

    const metrics = {
        totalLegacyUsers: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        skippedRecords: [],
        failedRecords: []
    };

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('Connected to MongoDB successfully.');

        await initializeCaches();
        console.log('Loaded Branch, Scheme, and StudentId caches into memory.\n');

        // Pre-fetch all existing StudentAccount identifiers to avoid N database queries!
        const existingStudents = await StudentAccount.find({}, { _id: 1, email: 1, usn: 1 }).lean();
        const existingIds = new Set(existingStudents.map(s => s._id.toString()));
        const existingEmails = new Set(existingStudents.filter(s => s.email).map(s => s.email.toLowerCase().trim()));
        const existingUsns = new Set(existingStudents.filter(s => s.usn).map(s => s.usn.toUpperCase().trim()));

        console.log(`Pre-loaded ${existingStudents.length} existing StudentAccount records for fast duplicate detection.`);

        // Get total count of legacy users
        metrics.totalLegacyUsers = await User.countDocuments({});
        console.log(`Total legacy User records found: ${metrics.totalLegacyUsers}\n`);

        let offset = 0;
        let batchNumber = 1;

        while (offset < metrics.totalLegacyUsers) {
            const legacyUsers = await User.find({}).sort({ _id: 1 }).skip(offset).limit(BATCH_SIZE).lean();
            let batchMigratedCount = 0;

            for (const user of legacyUsers) {
                try {
                    const normalizedEmail = user.email ? user.email.toLowerCase().trim() : null;
                    const normalizedUsn = user.usn ? user.usn.toUpperCase().trim() : null;
                    const userIdStr = user._id.toString();

                    // 1. Check for Duplicate StudentAccount
                    let duplicateReason = null;
                    if (existingIds.has(userIdStr)) {
                        duplicateReason = 'StudentAccount with same _id already exists';
                    } else if (normalizedEmail && existingEmails.has(normalizedEmail)) {
                        duplicateReason = `StudentAccount already exists for email (${normalizedEmail})`;
                    } else if (normalizedUsn && existingUsns.has(normalizedUsn)) {
                        duplicateReason = `StudentAccount already exists for USN (${normalizedUsn})`;
                    }

                    if (duplicateReason) {
                        metrics.skipped++;
                        metrics.skippedRecords.push({
                            userId: user._id,
                            email: user.email,
                            usn: user.usn,
                            reason: duplicateReason
                        });
                        if (IS_VERBOSE) console.log(`[SKIP] User ${user._id}: ${duplicateReason}`);
                        continue;
                    }

                    // 2. Fast Parse USN and resolve Branch / Scheme / College details
                    const parsedUsn = fastParseUsn(normalizedUsn);
                    const v2BranchId = resolveV2BranchId(user.branch || user.currentBranch) || parsedUsn?.branchId || null;
                    const schemeId = parsedUsn?.schemeId || null;
                    const collegeId = parsedUsn?.collegeId || null;

                    const admissionYear = parsedUsn?.admissionYear || (user.createdAt ? new Date(user.createdAt).getFullYear() : null);
                    const graduationYear = parsedUsn?.graduationYear || (admissionYear ? admissionYear + 4 : null);
                    const semester = user.semester || parsedUsn?.currentSemesterEstimate || null;

                    // 3. Determine Registration & Profile Completion Status
                    const isProfileComplete = !!(normalizedUsn && v2BranchId && schemeId && admissionYear && graduationYear);
                    const registrationStatus = isProfileComplete ? 'completed' : 'pending';
                    const onboardingCompleted = isProfileComplete;
                    const profileCompletion = {
                        identity: !!(user.name || user.username || normalizedEmail),
                        academic: !!(v2BranchId && schemeId),
                        attendance: false
                    };

                    // Auto-generate studentId
                    const yearCode = (admissionYear || new Date().getFullYear()).toString().slice(-2);
                    const generatedStudentId = `ASK${yearCode}${currentSeq.toString().padStart(5, '0')}`;
                    currentSeq++;

                    // 4. Construct StudentAccount Payload
                    const studentData = {
                        _id: user._id, // Preserve exact ObjectId
                        studentId: generatedStudentId,
                        email: normalizedEmail,
                        authProvider: user.googleId ? 'google' : 'email',
                        googleId: user.googleId || undefined,
                        password: user.password || undefined, // Copy hashed password directly
                        emailVerified: user.isVerified !== undefined ? user.isVerified : true,
                        name: user.name || user.username || normalizedEmail.split('@')[0],
                        username: user.username ? user.username.toLowerCase().trim() : undefined,
                        usn: normalizedUsn || undefined,
                        college: collegeId || undefined,
                        collegeName: user.collegeName || parsedUsn?.collegeName || '',
                        branch: v2BranchId || undefined,
                        scheme: schemeId || undefined,
                        admissionYear: admissionYear || undefined,
                        graduationYear: graduationYear || undefined,
                        semester: semester || undefined,
                        section: 'A',
                        profilePicture: user.profilePicture || undefined,
                        registrationStatus,
                        onboardingCompleted,
                        profileCompletion,
                        accountType: 'student',
                        role: user.isAdmin ? 'admin' : (user.role === 'admin' ? 'admin' : 'student'),
                        accountStatus: user.isSuspended ? 'suspended' : 'active',
                        isDeleted: false,
                        phone: user.phone || user.phoneNumber || '',
                        bio: user.bio || '',
                        socialLinks: {
                            github: user.socialLinks?.github || '',
                            linkedin: user.socialLinks?.linkedin || '',
                            portfolio: user.socialLinks?.website || '',
                            instagram: user.socialLinks?.instagram || '',
                            leetcode: user.socialLinks?.leetcode || '',
                            x: ''
                        },
                        lastLogin: user.lastLogin || undefined,
                        lastActive: user.lastActiveAt || user.lastActive || undefined,
                        createdAt: user.createdAt || new Date(),
                        updatedAt: user.updatedAt || new Date()
                    };

                    // Clean undefined & null keys so MongoDB BSON driver omits them entirely
                    Object.keys(studentData).forEach(key => {
                        if (studentData[key] === undefined || studentData[key] === null) {
                            delete studentData[key];
                        }
                    });

                    if (!IS_DRY_RUN) {
                        const studentDoc = new StudentAccount(studentData);
                        await studentDoc.save();
                    }

                    metrics.migrated++;
                    batchMigratedCount++;

                    // Update memory sets so subsequent batch duplicates are caught
                    existingIds.add(userIdStr);
                    if (normalizedEmail) existingEmails.add(normalizedEmail);
                    if (normalizedUsn) existingUsns.add(normalizedUsn);

                    if (IS_VERBOSE) {
                        console.log(`[MIGRATED] ${user._id} -> ${generatedStudentId}`);
                    }

                } catch (userErr) {
                    metrics.failed++;
                    metrics.failedRecords.push({
                        userId: user._id,
                        email: user.email,
                        usn: user.usn,
                        reason: userErr.message
                    });
                    console.error(`[ERROR] Failed to migrate user ${user._id} (${user.email}):`, userErr.message);
                }
            }

            console.log(`Batch ${batchNumber} complete: ${batchMigratedCount} users migrated.`);
            offset += BATCH_SIZE;
            batchNumber++;
        }

        console.log('\n====================================================');
        console.log('📊 MIGRATION SUMMARY REPORT');
        console.log('====================================================');
        console.log(`Total Legacy Users Analyzed: ${metrics.totalLegacyUsers}`);
        console.log(`Successfully Migrated:      ${metrics.migrated}`);
        console.log(`Skipped (Duplicates):        ${metrics.skipped}`);
        console.log(`Failed:                     ${metrics.failed}`);
        console.log('====================================================');

        if (metrics.skippedRecords.length > 0) {
            console.log(`\nSkipped Records Sample (First 5):`);
            console.log(JSON.stringify(metrics.skippedRecords.slice(0, 5), null, 2));
        }

        if (metrics.failedRecords.length > 0) {
            console.log(`\nFailed Records Details:`);
            console.log(JSON.stringify(metrics.failedRecords, null, 2));
        }

        await mongoose.disconnect();
        console.log('\nMigration task finished successfully.');
    } catch (err) {
        console.error('Fatal error during migration:', err);
        process.exit(1);
    }
}

runMigration();
