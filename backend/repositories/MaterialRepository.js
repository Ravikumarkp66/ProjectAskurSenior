const BaseRepository = require('./BaseRepository');
const AcademicMaterial = require('../models/AcademicMaterial');
const Material = require('../models/Material');

class MaterialRepository extends BaseRepository {
    constructor() {
        super(AcademicMaterial);
        this.legacyMaterialModel = Material;
    }

    async findBySubjectId(subjectId) {
        return this.find({ subjectId });
    }

    async findByBranchAndSubject(branch, subjectCode) {
        return this.find({ branch: branch.toUpperCase(), subjectCode });
    }
}

module.exports = new MaterialRepository();
