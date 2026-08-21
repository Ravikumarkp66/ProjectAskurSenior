const Subject = require('../models/Subject');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicMaterial = require('../models/AcademicMaterial');
const mongoose = require('mongoose');

// GET /api/subjects/:subjectId/materials
const getSubjectMaterials = async (req, res) => {
    try {
        const { subjectId } = req.params;

        let subjectDoc;
        if (mongoose.Types.ObjectId.isValid(subjectId)) {
            subjectDoc = await Subject.findById(subjectId).lean();
        } else {
            subjectDoc = await Subject.findOne({ code: subjectId.toUpperCase() }).lean() 
                || await Subject.findOne({ slug: subjectId.toLowerCase() }).lean();
        }

        // Fallback to AcademicSubject
        if (!subjectDoc) {
            if (mongoose.Types.ObjectId.isValid(subjectId)) {
                subjectDoc = await AcademicSubject.findById(subjectId).populate('branch', 'name shortName').lean();
            } else {
                subjectDoc = await AcademicSubject.findOne({ slug: subjectId.toLowerCase() }).populate('branch', 'name shortName').lean();
            }
        }

        if (!subjectDoc) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Fetch Published materials from AcademicMaterial collection
        const dbMaterials = await AcademicMaterial.find({
            subject: subjectDoc._id
        })
            .sort({ createdAt: -1 })
            .select('_id title fileUrl fileType mimeType fileSize materialType createdAt downloadCount previewCount originalFileName legacySubjectName tags')
            .lean();

        // Group materials
        const grouped = {
            notes: [],
            see: [],
            internals: [],
            others: []
        };

        // Populate from Subject document fields if available
        if (Array.isArray(subjectDoc.notes)) {
            subjectDoc.notes.forEach(m => grouped.notes.push({ _id: m._id, title: m.title, fileUrl: m.fileKey, materialType: 'Notes', createdAt: m.uploadedAt }));
        }
        if (Array.isArray(subjectDoc.pyqs)) {
            subjectDoc.pyqs.forEach(m => grouped.see.push({ _id: m._id, title: m.title, fileUrl: m.fileKey, materialType: 'SEE', createdAt: m.uploadedAt }));
        }
        if (Array.isArray(subjectDoc.questionBanks)) {
            subjectDoc.questionBanks.forEach(m => grouped.internals.push({ _id: m._id, title: m.title, fileUrl: m.fileKey, materialType: 'Internals', createdAt: m.uploadedAt }));
        }
        if (Array.isArray(subjectDoc.resources)) {
            subjectDoc.resources.forEach(m => grouped.others.push({ _id: m._id, title: m.title, fileUrl: m.fileKey, materialType: 'Others', createdAt: m.uploadedAt }));
        }

        // Add from AcademicMaterial collection
        dbMaterials.forEach(m => {
            const type = m.materialType;
            if (type === 'Notes') grouped.notes.push(m);
            else if (type === 'SEE') grouped.see.push(m);
            else if (type === 'Internals') grouped.internals.push(m);
            else grouped.others.push(m);
        });

        res.status(200).json({
            subject: subjectDoc,
            ...grouped
        });
    } catch (error) {
        console.error('getSubjectMaterials error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getSubjectMaterials };
