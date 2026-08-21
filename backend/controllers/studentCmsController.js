const Subject = require('../models/Subject');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicMaterial = require('../models/AcademicMaterial');
const Branch = require('../models/Branch');

// GET /api/cms/subjects
// Student-facing: fetches published/available subjects
const getPublicSubjects = async (req, res) => {
    try {
        const { search, branch } = req.query;

        const filter = {};

        if (branch) {
            const branchUpper = branch.toString().trim().toUpperCase();
            const branchMap = {
                CSE: 'CS',
                ISE: 'IS',
                ECE: 'EC',
                MECH: 'ME',
                CIVIL: 'CV',
                EEE: 'EE',
                AIML: 'CI',
                ETC: 'ET',
                EIE: 'EI'
            };
            const mappedBranch = branchMap[branchUpper] || branchUpper;

            filter.$or = [
                { branch: mappedBranch },
                { branch: branchUpper },
                { branch: 'ALL' },
                { branch: 'Common' },
                { branch: 'COMMON' }
            ];
        }

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const searchOr = [
                { name: regex },
                { code: regex }
            ];
            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchOr }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchOr;
            }
        }

        // Fetch subjects from Subject model (primary database collection with 198 records)
        let subjects = await Subject.find(filter).lean();
        
        // Fallback to AcademicSubject if Subject collection is empty
        if (!subjects || subjects.length === 0) {
            subjects = await AcademicSubject.find().populate('branch', 'name shortName').lean();
        }

        res.status(200).json(subjects);
    } catch (error) {
        console.error('getPublicSubjects error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/cms/subjects/:slug/materials
// Student-facing: fetches published materials for a subject by slug
const getSubjectMaterials = async (req, res) => {
    try {
        const subject = await subjectService.findOneSubject({ slug: req.params.slug, status: 'Published' });

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
