/**
 * Profile Feature Data Mapper
 * Transforms backend API DTO responses into UI-friendly props.
 */
export const profileMapper = {
    /**
     * Map backend user profile response to UI shape
     */
    toUserProfile: (dto) => ({
        id: dto._id || dto.id,
        name: dto.name || '',
        email: dto.email || '',
        usn: dto.usn || '',
        branch: dto.currentBranch || dto.branch || '',
        semester: dto.semester || 1,
        avatar: dto.avatar || dto.profilePicture || '',
        isAdmin: !!dto.isAdmin,
        subscription: dto.subscription || 'free'
    }),

    /**
     * Map backend attendance summary to UI shape
     */
    toAttendanceSummary: (dto) => ({
        overallPercentage: dto?.overallPercentage ? Math.round(dto.overallPercentage) : 0,
        totalAttended: dto?.totalAttended || 0,
        totalConducted: dto?.totalConducted || 0,
        subjects: Array.isArray(dto?.subjects) ? dto.subjects : []
    })
};

export default profileMapper;
