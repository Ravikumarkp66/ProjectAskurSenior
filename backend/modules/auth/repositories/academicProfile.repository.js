const AcademicProfile = require('../../../models/AcademicProfile');

class AcademicProfileRepository {
    async findByStudentId(studentId) {
        return await AcademicProfile.findOne({ student: studentId });
    }

    async upsert(studentId, data) {
        return await AcademicProfile.findOneAndUpdate(
            { student: studentId },
            { $set: data },
            { new: true, upsert: true }
        );
    }
}

module.exports = new AcademicProfileRepository();
