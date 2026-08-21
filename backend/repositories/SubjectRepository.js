const BaseRepository = require('./BaseRepository');
const Subject = require('../models/Subject');
const AcademicSubject = require('../models/AcademicSubject');

class SubjectRepository extends BaseRepository {
    constructor() {
        super(Subject);
        this.academicSubjectModel = AcademicSubject;
    }

    async findByBranch(branch) {
        return this.find({ branch: branch.toUpperCase() });
    }

    async findByCode(code) {
        return this.findOne({ code: code.toUpperCase() });
    }

    async findAcademicSubjectsByBranch(branch) {
        return this.academicSubjectModel.find({ branch: branch.toUpperCase() });
    }

    async findAcademicSubjectById(id) {
        return this.academicSubjectModel.findById(id);
    }
}

module.exports = new SubjectRepository();
