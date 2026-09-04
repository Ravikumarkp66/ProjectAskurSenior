const Subject = require('../models/Subject');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicMaterial = require('../models/AcademicMaterial');
const Branch = require('../models/Branch');

// GET /api/cms/subjects
// Student-facing: fetches published/available subjects
const getPublicSubjects = async (req, res) => {
    try {
        const { search, branch, year } = req.query;

        const academicFilter = { status: 'Published' };

        if (year) {
            academicFilter.year = year;
        }

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            academicFilter.$or = [
                { name: regex },
                { code: regex }
            ];
        }

        let branchDoc = null;
        if (branch) {
            const branchUpper = branch.toString().trim().toUpperCase();
            const branchMap = {
                CS: 'CSE', CSE: 'CSE',
                IS: 'ISE', ISE: 'ISE',
                EC: 'ECE', ECE: 'ECE',
                ME: 'MECH', MECH: 'MECH',
                CV: 'CIVIL', CIVIL: 'CIVIL',
                EE: 'EEE', EEE: 'EEE',
                CI: 'AIML', AIML: 'AIML',
                ET: 'ETC', ETC: 'ETC',
                EI: 'EIE', EIE: 'EIE'
            };
            const targetShortName = branchMap[branchUpper] || branchUpper;
            branchDoc = await Branch.findOne({ shortName: targetShortName }).select('_id').lean();
        }

        // Fetch from AcademicSubject
        let subjects = await AcademicSubject.find(academicFilter)
            .populate('branch', 'name shortName')
            .sort({ year: 1, name: 1 })
            .lean();

        // If branch filter specified, filter non-1st-year subjects by branch
        if (branchDoc) {
            subjects = subjects.filter(s => {
                // First Year subjects are common across all branches
                if (s.year === '1st Year' || !s.year) return true;
                if (!s.branch) return true;
                return s.branch._id?.toString() === branchDoc._id?.toString() || s.branch.shortName === 'Common';
            });
        }

        // Return AcademicSubject list if found
        if (subjects && subjects.length > 0) {
            return res.status(200).json(subjects);
        }

        // Fallback to legacy Subject model
        const legacyFilter = {};
        if (branch) {
            const branchUpper = branch.toString().trim().toUpperCase();
            const branchMap = {
                CSE: 'CS', ISE: 'IS', ECE: 'EC', MECH: 'ME', CIVIL: 'CV', EEE: 'EE', AIML: 'CI', ETC: 'ET', EIE: 'EI'
            };
            const mappedBranch = branchMap[branchUpper] || branchUpper;
            legacyFilter.$or = [
                { branch: mappedBranch },
                { branch: branchUpper },
                { branch: 'ALL' },
                { branch: 'Common' },
                { branch: 'COMMON' }
            ];
        }

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const searchOr = [{ name: regex }, { code: regex }];
            if (legacyFilter.$or) {
                legacyFilter.$and = [{ $or: legacyFilter.$or }, { $or: searchOr }];
                delete legacyFilter.$or;
            } else {
                legacyFilter.$or = searchOr;
            }
        }

        const legacySubjects = await Subject.find(legacyFilter).lean();
        res.status(200).json(legacySubjects);
    } catch (error) {
        console.error('getPublicSubjects error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/cms/subjects/:slug/materials
// Student-facing: fetches published materials for a subject by slug
const getSubjectMaterials = async (req, res) => {
    try {
        const subject = await AcademicSubject.findOne({ slug: req.params.slug, status: 'Published' }).lean();

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const materials = await AcademicMaterial.find({
            subject: subject._id,
            status: 'Published'
        })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Adapt schema to the old CMS Material shape for student website backwards compatibility
        const adaptedMaterials = materials.map(m => ({
            _id: m._id,
            title: m.title,
            tags: m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            visibility: m.status,
            createdAt: m.createdAt,
            downloadCount: m.downloadCount,
            materialType: {
                name: m.materialType === 'SEE' ? 'PYQ' : m.materialType, // Frontend filters/groups by 'Notes' and 'PYQ'
                label: m.materialType === 'SEE' ? 'PYQ' : m.materialType
            },
            attachments: [{
                fileUrl: m.fileUrl,
                fileName: m.title || m.originalFileName,
                fileSize: m.fileSize,
                fileExtension: m.fileType
            }]
        }));

        res.status(200).json({ subject, materials: adaptedMaterials });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/cms/materials/:id/download
// Increments download count and returns the material details
const trackDownload = async (req, res) => {
    try {
        const material = await AcademicMaterial.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        ).lean();

        if (!material) {
            return res.status(404).json({ error: 'Material not found' });
        }

        const attachments = [{
            fileUrl: material.fileUrl,
            fileName: material.originalFileName || material.title,
            fileSize: material.fileSize,
            fileExtension: material.fileType
        }];

        res.status(200).json({ attachments, downloadCount: material.downloadCount });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { getPublicSubjects, getSubjectMaterials, trackDownload };
