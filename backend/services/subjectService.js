const subjectRepository = require('../repositories/SubjectRepository');
const materialRepository = require('../repositories/MaterialRepository');

/**
 * SubjectService
 * Handles core business logic for Academic Subjects and Material operations.
 */
class SubjectService {
    async getSubjectsByBranch(branch, cycle) {
        const query = { branch: branch.toUpperCase() };
        if (cycle === 'P' || cycle === 'C') query.cycle = cycle;

        return subjectRepository.find(query, '-__v', { sort: { credits: -1, code: 1 }, lean: true });
    }

    async getAllUniqueSubjects(year, semester, branch, cycle) {
        let query = {};
        if (cycle) query.cycle = cycle;
        if (branch) query.branch = branch.toUpperCase();
        if (year === '1' && !cycle) query.cycle = { $in: ['P', 'C'] };

        const subjects = await subjectRepository.find(query, 'name code cycle color modules credits branch', { sort: { name: 1 }, lean: true });

        const uniqueSubjects = [];
        const seenCodes = new Set();
        
        for (const sub of subjects) {
            const key = sub.code || sub.name;
            if (key && !seenCodes.has(key)) {
                seenCodes.add(key);
                uniqueSubjects.push(sub);
            }
        }

        return uniqueSubjects;
    }

    async getSubjectById(subjectId) {
        // Try AcademicSubject first with populated relationships
        let subject = await subjectRepository.academicSubjectModel.findById(subjectId)
            .populate('branch', 'name shortName displayOrder status')
            .populate('scheme', 'name status')
            .lean();

        if (!subject) {
            subject = await subjectRepository.findById(subjectId, null, { lean: true });
        }
        return subject;
    }

    async getSubjectsByCode(code) {
        return subjectRepository.find({ code: code.toUpperCase() }, '-__v', { sort: { branch: 1, cycle: 1 }, lean: true });
    }

    async getAcademicSubjects(filter, skip = 0, limit = 20) {
        return subjectRepository.academicSubjectModel.find(filter)
            .populate('branch', 'name shortName displayOrder status')
            .populate('scheme', 'name status')
            .sort({ year: 1, name: 1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
    }

    async countAcademicSubjects(filter) {
        return subjectRepository.academicSubjectModel.countDocuments(filter);
    }

    // Aliases used by admin CMS controllers
    async getSubjects(filter, skip = 0, limit = 20) {
        return this.getAcademicSubjects(filter, skip, limit);
    }

    async countSubjects(filter) {
        return this.countAcademicSubjects(filter);
    }
}

module.exports = new SubjectService();
