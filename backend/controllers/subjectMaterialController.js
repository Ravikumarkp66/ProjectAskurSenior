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
            subjectDoc = await AcademicSubject.findById(subjectId).populate('branch', 'name shortName').lean()
                || await Subject.findById(subjectId).lean();
        } else {
            const rawId = decodeURIComponent(subjectId).trim();
            subjectDoc = await AcademicSubject.findOne({ slug: rawId.toLowerCase() }).populate('branch', 'name shortName').lean()
                || await AcademicSubject.findOne({ code: rawId.toUpperCase() }).populate('branch', 'name shortName').lean()
                || await AcademicSubject.findOne({ name: new RegExp('^' + rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).populate('branch', 'name shortName').lean()
                || await Subject.findOne({ code: rawId.toUpperCase() }).lean() 
                || await Subject.findOne({ slug: rawId.toLowerCase() }).lean();
        }

        if (!subjectDoc) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Collect all related subject IDs & names (across both AcademicSubject & Subject)
        const subjectIds = [subjectDoc._id];
        const matchingNames = [subjectDoc.name];

        // Find matches in Subject collection
        const legacyMatches = await Subject.find({
            $or: [
                { code: subjectDoc.code },
                { name: new RegExp('^' + subjectDoc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            ]
        }).select('_id').lean();
        legacyMatches.forEach(m => subjectIds.push(m._id));

        // Find matches in AcademicSubject collection
        const acadMatches = await AcademicSubject.find({
            $or: [
                { code: subjectDoc.code },
                { name: new RegExp('^' + subjectDoc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            ]
        }).select('_id').lean();
        acadMatches.forEach(m => subjectIds.push(m._id));

        // Fetch Published materials from AcademicMaterial collection
        const dbMaterials = await AcademicMaterial.find({
            $or: [
                { subject: { $in: subjectIds } },
                { legacySubjectName: { $in: matchingNames } }
            ],
            status: 'Published',
            deletedAt: null
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

        // Populate from Subject document embedded fields if available
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

        // Add from AcademicMaterial collection (deduplicating by _id)
        const seenIds = new Set();
        const addMaterial = (targetArray, m) => {
            const idStr = m._id.toString();
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                targetArray.push(m);
            }
        };

        dbMaterials.forEach(m => {
            const type = m.materialType;
            if (type === 'Notes') addMaterial(grouped.notes, m);
            else if (type === 'SEE') addMaterial(grouped.see, m);
            else if (type === 'Internals') addMaterial(grouped.internals, m);
            else addMaterial(grouped.others, m);
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
