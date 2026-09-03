const { getCloudFrontUrl } = require('../../../utils/s3');

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

        return {
            _id: studentIdStr,
            id: studentIdStr,
            studentId: student.studentId,
            name: student.name,
            username: student.username || '',
            usn: student.usn || '',
            email: student.email,
            role: student.role || 'student',
            isAdmin: student.role === 'admin',
            registrationComplete: isRegComplete,
            subscription: 'free',
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
            usnHistory: student.usnHistory || [],
            usnLastChangedAt: student.usnLastChangedAt || null,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
        };
    }
}

module.exports = new AuthV2Dto();
