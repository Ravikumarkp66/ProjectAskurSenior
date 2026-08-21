const AcademicMaterial = require('../models/AcademicMaterial');
const AcademicSubject  = require('../models/AcademicSubject');
const { uploadToS3 }   = require('../utils/uploadToS3');

// ─── GET /api/admin/academic-materials ───────────────────────────────────────
const getMaterials = async (req, res) => {
    try {
        const {
            page    = 1,
            limit   = 20,
            status,
            subject,
            materialType,
            migrationStatus,
            search,
        } = req.query;

        const filter = {};

        if (status)          filter.status          = status;
        if (subject)         filter.subject         = subject;
        if (materialType)    filter.materialType    = materialType;
        if (migrationStatus) filter.migrationStatus = migrationStatus;

        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { title: regex },
                { legacySubjectName: regex },
                { uploaderEmail: regex },
            ];
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await AcademicMaterial.countDocuments(filter);

        const materials = await AcademicMaterial.find(filter)
            .populate('subject', 'name code year branch')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({
            materials,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('getMaterials error:', err);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
};

// ─── GET /api/admin/academic-materials/stats ──────────────────────────────────
const getStats = async (req, res) => {
    try {
        const [total, byStatus, byType, byMigration] = await Promise.all([
            AcademicMaterial.countDocuments(),
            AcademicMaterial.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            AcademicMaterial.aggregate([
                { $group: { _id: '$materialType', count: { $sum: 1 } } }
            ]),
            AcademicMaterial.aggregate([
                { $group: { _id: '$migrationStatus', count: { $sum: 1 } } }
            ]),
        ]);

        const toMap = arr => arr.reduce((acc, { _id, count }) => {
            acc[_id || 'null'] = count;
            return acc;
        }, {});

        res.json({
            total,
            byStatus:      toMap(byStatus),
            byType:        toMap(byType),
            byMigration:   toMap(byMigration),
        });
    } catch (err) {
        console.error('getStats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// ─── POST /api/admin/academic-materials ──────────────────────────────────────
// Future upload endpoint — file must be sent as multipart/form-data
const createMaterial = async (req, res) => {
    try {
        const {
            title,
            subjectId,
            materialType,
            status = 'Published',
        } = req.body;

        if (!title || !req.file) {
            return res.status(400).json({ error: 'title and file are required' });
        }

        // Upload to S3
        const s3Key = await uploadToS3(req.file, 'academic-materials');

        // Fetch uploader email
        const User = require('../models/User');
        const uploader = await User.findById(req.userId).select('email').lean();

        const material = await AcademicMaterial.create({
            title,
            subject:          subjectId || null,
            materialType:     materialType || 'Others',
            fileUrl:          s3Key,
            storedFileName:   s3Key,
            originalFileName: req.file.originalname,
            fileType:         req.file.originalname.split('.').pop()?.toLowerCase(),
            mimeType:         req.file.mimetype,
            fileSize:         req.file.size,
            uploadedBy:       req.userId,
            uploaderEmail:    uploader?.email || null,
            status,
            // Not a migrated record — no legacy fields
        });

        // Increment materialCount on the linked subject
        if (subjectId) {
            await AcademicSubject.findByIdAndUpdate(subjectId, { $inc: { materialCount: 1 } });
        }

        res.status(201).json({ material });
    } catch (err) {
        console.error('createMaterial error:', err);
        res.status(500).json({ error: 'Failed to create material' });
    }
};

// ─── PUT /api/admin/academic-materials/:id ────────────────────────────────────
const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, status, materialType } = req.body;

        const current = await AcademicMaterial.findById(id);
        if (!current) return res.status(404).json({ error: 'Material not found' });

        const updateData = {};
        if (title)        updateData.title        = title;
        if (status)       updateData.status       = status;
        if (materialType) updateData.materialType = materialType;

        // Subject assignment — track as Manually Assigned
        if (subject !== undefined) {
            const oldSubjectId = current.subject?.toString();
            const newSubjectId = subject || null;

            updateData.subject = newSubjectId;

            if (newSubjectId) {
                updateData.migrationStatus = 'Manually Assigned';
            }

            // Adjust materialCounts if subject changed
            if (newSubjectId && oldSubjectId !== newSubjectId) {
                if (oldSubjectId) {
                    await AcademicSubject.findByIdAndUpdate(oldSubjectId, { $inc: { materialCount: -1 } });
                }
                await AcademicSubject.findByIdAndUpdate(newSubjectId, { $inc: { materialCount: 1 } });
            }
        }

        const updated = await AcademicMaterial.findByIdAndUpdate(id, updateData, { new: true })
            .populate('subject', 'name code year');

        res.json({ material: updated });
    } catch (err) {
        console.error('updateMaterial error:', err);
        res.status(500).json({ error: 'Failed to update material' });
    }
};

// ─── DELETE /api/admin/academic-materials/:id (soft delete → Hidden) ──────────
const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await AcademicMaterial.findById(id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        material.status = 'Hidden';
        await material.save();

        // Decrement materialCount on linked subject
        if (material.subject) {
            await AcademicSubject.findByIdAndUpdate(material.subject, {
                $inc: { materialCount: -1 }
            });
        }

        res.json({ message: 'Material hidden successfully' });
    } catch (err) {
        console.error('deleteMaterial error:', err);
        res.status(500).json({ error: 'Failed to hide material' });
    }
};

module.exports = {
    getMaterials,
    getStats,
    createMaterial,
    updateMaterial,
    deleteMaterial,
};
