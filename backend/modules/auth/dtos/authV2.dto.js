const { getCloudFrontUrl } = require('../../../utils/s3');
const { getAccessPayload } = require('../../../services/plusAccessService');

class AuthV2Dto {
    toStudentResponseDto(student) {
        if (!student) return null;
        const academic = student.academicProfile || {};
        
        // Calculate semester dynamically
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        let semesterEstimate = null;
        if (student.admissionYear) {
            const yearsDiff = currentYear - student.admissionYear;
            if (currentMonth >= 7 || currentMonth === 0) {
                semesterEstimate = yearsDiff * 2 + 1;
            } else {
                semesterEstimate = yearsDiff * 2;
            }
            semesterEstimate = Math.max(1, Math.min(8, semesterEstimate));
        }

        const studentIdStr = student._id ? student._id.toString() : (student.id ? student.id.toString() : '');
        const isRegComplete = student.registrationStatus === 'completed' || student.registrationStatus === 'identity_completed' || student.registrationStatus === 'academic_completed';
        const accessPayload = getAccessPayload(student);

        return {
            _id: studentIdStr,
            id: studentIdStr,
            studentId: student.studentId,
            name: student.name,
            username: student.username || '',
            usn: student.usn || '',
            email: student.email,
            role: (student.email && student.email.toLowerCase() === 'mreducator4566@gmail.com') || student.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (student.role || 'student'),
            isAdmin: (student.email && student.email.toLowerCase() === 'mreducator4566@gmail.com') || student.role === 'SUPER_ADMIN' || student.role === 'admin',
            isSuperAdmin: (student.email && student.email.toLowerCase() === 'mreducator4566@gmail.com') || student.role === 'SUPER_ADMIN',
            canEditAnytime: (student.email && student.email.toLowerCase() === 'mreducator4566@gmail.com') || student.role === 'SUPER_ADMIN',
            isTestUser: !!student.isTestUser,
            access: {
                plan: accessPayload.plan,
                source: accessPayload.source
            },
            registrationComplete: isRegComplete,
            subscription: accessPayload.plan === 'PLUS' ? 'plus' : 'free',
            profilePicture: student.profilePicture ? getCloudFrontUrl(student.profilePicture) : '',
            phone: student.phone || '',
            bio: student.bio || '',
            semester: student.semester || semesterEstimate,
            cgpa: student.cgpa ?? null,
            socialLinks: {
                github: student.socialLinks?.github || '',
                linkedin: student.socialLinks?.linkedin || '',
                portfolio: student.socialLinks?.portfolio || '',
                instagram: student.socialLinks?.instagram || '',
                leetcode: student.socialLinks?.leetcode || '',
                x: student.socialLinks?.x || ''
            },
            academicProfile: {
                cgpa: academic.cgpa ?? null,
                creditsEarned: academic.creditsEarned ?? null,
                backlogs: academic.backlogs ?? null,
                updatedAt: academic.updatedAt ?? null
            },
            registrationStatus: student.registrationStatus,
            onboardingCompleted: student.onboardingCompleted || false,
            profileCompletion: student.profileCompletion || { identity: false, academic: false, attendance: false },
            accountStatus: student.accountStatus,
            branch: student.branch ? {
                id: student.branch._id,
                name: student.branch.name,
                shortName: student.branch.shortName
            } : null,
            scheme: student.scheme ? {
                id: student.scheme._id,
                name: student.scheme.name
            } : null,
            college: student.collegeName || (student.college && typeof student.college === 'object' ? student.college.name : null) || student.college || 'Siddaganga Institute of Technology',
            admissionYear: student.admissionYear,
            graduationYear: student.graduationYear,
            dob: student.dob || null,
            usnType: student.usnType || 'TEMPORARY',
            usnVerified: !!student.usnVerified,
            usnVerifiedAt: student.usnVerifiedAt || null,
            usnLocked: !!student.usnLocked,
            academicSemester: student.academicSemester ? (student.academicSemester._id ? { id: student.academicSemester._id, semesterNumber: student.academicSemester.semesterNumber, name: student.academicSemester.name } : student.academicSemester) : null,
            section: (typeof student.academicSection === 'object' && student.academicSection?.name)
                ? student.academicSection.name
                : (student.section || ''),
            academicSection: student.academicSection ? (student.academicSection._id ? { id: student.academicSection._id, name: student.academicSection.name } : (student.academicSection.name ? { id: student.academicSection, name: student.academicSection.name } : student.academicSection)) : null,
            sectionLocked: !!student.sectionLocked,
            labBatch: student.labBatch || null,
            labBatchLocked: !!student.labBatchLocked,
            academicProfileComplete: !!student.academicProfileComplete,
            academicProfileCompletion: student.academicProfileCompletion || 0,
            usnHistory: student.usnHistory || [],
            usnLastChangedAt: student.usnLastChangedAt || null,
            usnOtpDailyRequests: student.usnOtpDailyRequests || { date: '', count: 0 },
            remainingDailyOtpRequests: (student.usnOtpDailyRequests?.date === new Date().toISOString().slice(0, 10))
                ? Math.max(0, 3 - (student.usnOtpDailyRequests?.count || 0))
                : 3,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
        };
    }
}

module.exports = new AuthV2Dto();
