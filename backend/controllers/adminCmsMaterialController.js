const AcademicMaterial = require('../models/AcademicMaterial');
const AcademicSubject = require('../models/AcademicSubject');
const User = require('../models/User');
const { uploadToS3 } = require('../utils/uploadToS3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { detectDuplicates, normalizeName } = require('../services/duplicateService');
const { matchSubject, detectMaterialType } = require('../services/subjectMatcher');
const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../utils/s3');

const CLOUDFRONT_BASE = 'https://d2mh2rnmjqdkgx.cloudfront.net';

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

// Helper to generate file hash via streaming
const getFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
};

// Promise pool helper for concurrency-limited S3 uploads
const uploadPool = async (files, concurrencyLimit = 5) => {
    const results = [];
    const executing = new Set();
    for (const file of files) {
        const p = Promise.resolve().then(async () => {
            const s3Key = await uploadToS3(file, 'materials');
            const fileUrl = `${CLOUDFRONT_BASE}/${s3Key}`;
            const fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();
            return {
                fileUrl,
                storedFileName: s3Key,
                originalFileName: file.originalname,
                fileType: fileExtension,
                mimeType: file.mimetype,
                fileSize: file.size,
                fileHash: file.fileHash
            };
        });
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        if (executing.size >= concurrencyLimit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
};

// GET /api/admin/materials/stats
const getStats = async (req, res) => {
    try {
        const [total, published, hidden, draft, needsReview, trashCount, typeStats, dupGroups] = await Promise.all([
            AcademicMaterial.countDocuments({ deletedAt: null }),
            AcademicMaterial.countDocuments({ status: 'Published', deletedAt: null }),
            AcademicMaterial.countDocuments({ status: 'Hidden', deletedAt: null }),
            AcademicMaterial.countDocuments({ status: 'Draft', deletedAt: null }),
            AcademicMaterial.countDocuments({ migrationStatus: 'Needs Review', deletedAt: null }),
            AcademicMaterial.countDocuments({ deletedAt: { $ne: null } }),
            AcademicMaterial.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: '$materialType', count: { $sum: 1 } } }
            ]),
            detectDuplicates()
        ]);

        const possibleDuplicates = dupGroups.reduce((acc, g) => acc + g.materials.length, 0);

        const types = typeStats.reduce((acc, { _id, count }) => {
            acc[_id || 'Others'] = count;
            return acc;
        }, { Notes: 0, PYQs: 0, 'Question Banks': 0, Syllabus: 0, 'Lab Manuals': 0, Textbooks: 0, Others: 0 });

        res.status(200).json({
            total,
            published,
            hidden,
            draft,
            needsReview,
            possibleDuplicates,
            trashCount,
            types
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/materials/health-stats
const getHealthStats = async (req, res) => {
    try {
        const [totalMaterials, orphanMaterials, hiddenFiles, trashCount, needsReview, storageResult] = await Promise.all([
            AcademicMaterial.countDocuments({ deletedAt: null }),
            AcademicMaterial.countDocuments({ subject: null, deletedAt: null }),
            AcademicMaterial.countDocuments({ status: 'Hidden', deletedAt: null }),
            AcademicMaterial.countDocuments({ deletedAt: { $ne: null } }),
            AcademicMaterial.countDocuments({ migrationStatus: 'Needs Review', deletedAt: null }),
            AcademicMaterial.aggregate([
                { $group: { _id: null, total: { $sum: '$fileSize' } } }
            ])
        ]);

        const dupGroups = await detectDuplicates();
        const possibleDuplicates = dupGroups.reduce((acc, g) => acc + g.materials.length, 0);
        const totalStorage = storageResult[0]?.total || 0;

        res.status(200).json({
            totalMaterials,
            possibleDuplicates,
            orphanMaterials,
            hiddenFiles,
            trashCount,
            needsReview,
            totalStorage
        });
    } catch (error) {
        console.error('getHealthStats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/admin/materials/duplicates
const getDuplicatesList = async (req, res) => {
    try {
        const dupGroups = await detectDuplicates();
        res.status(200).json(dupGroups);
    } catch (error) {
        console.error('getDuplicatesList error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/admin/materials
const getMaterials = async (req, res) => {
    try {
        const {
            search,
            subjectId,
            branchId,
            schemeId,
            year,
            materialType,
            status,
            migrationStatus,
            duplicateStatus,
            trash,
            sortBy,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // Construct sorting option
        let sortOption = { createdAt: -1 }; // default newest
        if (sortBy === 'fileSizeAsc') {
            sortOption = { fileSize: 1 };
        } else if (sortBy === 'fileSizeDesc') {
            sortOption = { fileSize: -1 };
        } else if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        // Default: exclude soft-deleted/trash materials
        if (trash === 'true') {
            filter.deletedAt = { $ne: null };
        } else {
            filter.deletedAt = null;
        }

        if (status) filter.status = status;
        if (materialType) filter.materialType = materialType;
        if (migrationStatus) filter.migrationStatus = migrationStatus;

        // Duplicate status dynamic filtering (not stored permanently in DB)
        if (duplicateStatus) {
            const dupGroups = await detectDuplicates();
            const duplicateIds = dupGroups.flatMap(g => g.materials.map(m => m._id.toString()));
            if (duplicateStatus === 'Possible Duplicate') {
                filter._id = { $in: duplicateIds };
            } else if (duplicateStatus === 'Normal') {
                filter._id = { $nin: duplicateIds };
            }
        }

        // Perform lookups on AcademicSubject to filter by branch, scheme, year or subjectId
        const subjectFilters = {};
        if (subjectId) subjectFilters._id = subjectId;
        if (branchId) subjectFilters.branch = branchId;
        if (schemeId) subjectFilters.scheme = schemeId;
        if (year) subjectFilters.year = year;

        // If any subject-related filter is provided, resolve matching subject IDs first
        if (Object.keys(subjectFilters).length > 0) {
            const matchingSubjects = await AcademicSubject.find(subjectFilters).select('_id');
            const subjectIds = matchingSubjects.map(s => s._id);
            filter.subject = { $in: subjectIds };
        }

        // Search logic (matches title, originalFileName, storedFileName, legacySubjectName, or populated subject name/code)
        if (search) {
            const regex = new RegExp(escapeRegExp(search), 'i');
            
            // First, find subjects matching name or code
            const matchingSubjects = await AcademicSubject.find({
                $or: [
                    { name: regex },
                    { code: regex }
                ]
            }).select('_id');
            const subjectIds = matchingSubjects.map(s => s._id);

            filter.$or = [
                { title: regex },
                { originalFileName: regex },
                { storedFileName: regex },
                { legacySubjectName: regex },
                { subject: { $in: subjectIds } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [materials, total] = await Promise.all([
            AcademicMaterial.find(filter)
                .populate({
                    path: 'subject',
                    select: 'name code year credits status',
                    populate: [
                        { path: 'branch', select: 'name shortName displayOrder status' },
                        { path: 'scheme', select: 'name status' }
                    ]
                })
                .populate('uploadedBy', 'name email')
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            AcademicMaterial.countDocuments(filter)
        ]);

        res.status(200).json({
            materials,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/materials/:id
const getMaterialById = async (req, res) => {
    try {
        const material = await AcademicMaterial.findById(req.params.id)
            .populate({
                path: 'subject',
                select: 'name code year credits status',
                populate: [
                    { path: 'branch', select: 'name shortName displayOrder status' },
                    { path: 'scheme', select: 'name status' }
                ]
            })
            .populate('uploadedBy', 'name email');

        if (!material) return res.status(404).json({ error: 'Material not found' });
        res.status(200).json(material);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/preview-match
const previewMatch = async (req, res) => {
    try {
        const { filenames } = req.body;
        if (!Array.isArray(filenames) || filenames.length === 0) {
            return res.status(400).json({ error: 'filenames array is required' });
        }

        const allSubjects = await AcademicSubject.find({ status: 'Published' })
            .select('name code year branch')
            .populate('branch', 'shortName name')
            .lean();

        const matches = filenames.map(filename => {
            const matched = matchSubject(filename, allSubjects);
            const detectedType = detectMaterialType(filename);
            return {
                filename,
                subject: matched ? {
                    _id: matched.subject._id,
                    name: matched.subject.name,
                    code: matched.subject.code,
                    year: matched.subject.year
                } : null,
                materialType: detectedType,
                migrationStatus: matched ? 'Auto Matched' : 'Needs Review'
            };
        });

        res.status(200).json({ matches });
    } catch (error) {
        console.error('previewMatch error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials (Supports Bulk Drag & Drop Upload with Auto Subject Matching)
const createMaterial = async (req, res) => {
    try {
        const { subject: defaultSubject, materialType: defaultType, status, metadata } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        let parsedMetadata = [];
        if (metadata) {
            try {
                parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (e) {
                parsedMetadata = [];
            }
        }

        const allSubjects = await AcademicSubject.find({ status: 'Published' })
            .select('name code year')
            .lean();

        const override = req.query.override === 'true';
        const uniqueFiles = [];
        const duplicates = [];

        // 1. Determine subject, materialType, and check duplicates for each file
        for (const file of req.files) {
            const hash = await getFileHash(file.path);
            file.fileHash = hash;

            const clientMeta = parsedMetadata.find(
                m => m.filename === file.originalname || m.originalName === file.originalname
            );

            // Determine Subject
            let assignedSubjectId = null;
            let fileMigrationStatus = 'Needs Review';

            if (clientMeta?.subjectId) {
                assignedSubjectId = clientMeta.subjectId;
                fileMigrationStatus = clientMeta.migrationStatus || 'Manually Assigned';
            } else if (defaultSubject && defaultSubject !== 'auto' && defaultSubject !== '') {
                assignedSubjectId = defaultSubject;
                fileMigrationStatus = 'Manually Assigned';
            } else {
                const matched = matchSubject(file.originalname, allSubjects);
                if (matched) {
                    assignedSubjectId = matched.subject._id;
                    fileMigrationStatus = 'Auto Matched';
                } else {
                    assignedSubjectId = null;
                    fileMigrationStatus = 'Needs Review';
                }
            }

            // Determine Material Type
            let assignedType = 'Notes';
            if (clientMeta?.materialType) {
                assignedType = clientMeta.materialType;
            } else if (defaultType && defaultType !== 'auto' && defaultType !== '') {
                assignedType = defaultType;
            } else {
                assignedType = detectMaterialType(file.originalname);
            }

            file.resolvedSubjectId = assignedSubjectId;
            file.resolvedMigrationStatus = fileMigrationStatus;
            file.resolvedMaterialType = assignedType;

            // Check duplicates if not override
            if (!override) {
                let existing = await AcademicMaterial.findOne({
                    fileHash: hash,
                    status: { $ne: 'Hidden' },
                    ignoredDuplicate: { $ne: true }
                }).lean();

                if (!existing && assignedSubjectId) {
                    const normName = normalizeName(file.originalname);
                    const metaMatches = await AcademicMaterial.find({
                        subject: assignedSubjectId,
                        materialType: assignedType,
                        status: { $ne: 'Hidden' },
                        ignoredDuplicate: { $ne: true },
                        fileSize: file.size
                    }).lean();

                    existing = metaMatches.find(m => normalizeName(m.originalFileName || m.title) === normName);
                }

                if (existing) {
                    duplicates.push({
                        originalname: file.originalname,
                        path: file.path,
                        size: file.size,
                        existing: {
                            _id: existing._id,
                            title: existing.title,
                            uploadedAt: existing.createdAt
                        }
                    });
                    continue;
                }
            }

            uniqueFiles.push(file);
        }

        // If duplicate warnings are detected and no override is passed,
        // upload only the unique files immediately, and return duplicate warnings for the rest
        if (duplicates.length > 0 && !override && uniqueFiles.length === 0) {
            return res.status(200).json({
                duplicate: true,
                uploadedCount: 0,
                duplicateCount: duplicates.length,
                duplicates,
                materials: []
            });
        }

        const filesToUpload = override ? req.files : uniqueFiles;
        if (filesToUpload.length === 0) {
            return res.status(400).json({ error: 'No files to upload' });
        }

        const uploadedFiles = await uploadPool(filesToUpload, 5);
        const uploader = await User.findById(req.userId).select('email').lean();

        const materialsData = uploadedFiles.map((uploaded, idx) => {
            const orig = filesToUpload[idx];
            return {
                title:             orig.originalFileName || orig.originalname,
                subject:           orig.resolvedSubjectId || null,
                materialType:      orig.resolvedMaterialType || 'Notes',
                fileUrl:           uploaded.fileUrl,
                storedFileName:    uploaded.storedFileName,
                originalFileName:  uploaded.originalFileName,
                fileType:          uploaded.fileType,
                mimeType:          uploaded.mimeType,
                fileSize:          uploaded.fileSize,
                fileHash:          uploaded.fileHash,
                uploadedBy:        req.userId,
                uploaderEmail:    uploader?.email || null,
                status:            status || 'Published',
                migrationStatus:   orig.resolvedMigrationStatus
            };
        });

        const createdMaterials = await AcademicMaterial.insertMany(materialsData);

        // Bulk increment subject materialCount for each subject
        const subjectCountIncrements = {};
        for (const m of createdMaterials) {
            if (m.subject) {
                const subStr = m.subject.toString();
                subjectCountIncrements[subStr] = (subjectCountIncrements[subStr] || 0) + 1;
            }
        }
        for (const [subId, inc] of Object.entries(subjectCountIncrements)) {
            await AcademicSubject.findByIdAndUpdate(subId, { $inc: { materialCount: inc } });
        }

        res.status(201).json({
            message: `${createdMaterials.length} materials uploaded successfully`,
            uploadedCount: createdMaterials.length,
            duplicateCount: duplicates.length,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            materials: createdMaterials
        });
    } catch (error) {
        console.error('createMaterial error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// PUT /api/admin/materials/:id
const updateMaterial = async (req, res) => {
    try {
        const { title, subject, materialType, status } = req.body;

        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        const updateData = {};
        if (title) updateData.title = title;
        if (status) updateData.status = status;
        if (materialType) updateData.materialType = materialType;

        // Manage subject change and academic subject materialCount updates
        if (subject !== undefined) {
            const oldSubjectId = material.subject ? material.subject.toString() : null;
            const newSubjectId = subject || null;

            updateData.subject = newSubjectId;

            if (newSubjectId) {
                updateData.migrationStatus = 'Manually Assigned';
            }

            if (newSubjectId && oldSubjectId !== newSubjectId) {
                if (oldSubjectId) {
                    await AcademicSubject.findByIdAndUpdate(oldSubjectId, { $inc: { materialCount: -1 } });
                }
                await AcademicSubject.findByIdAndUpdate(newSubjectId, { $inc: { materialCount: 1 } });
            }
        }

        const updated = await AcademicMaterial.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate({
                path: 'subject',
                select: 'name code year credits status',
                populate: [
                    { path: 'branch', select: 'name shortName displayOrder status' },
                    { path: 'scheme', select: 'name status' }
                ]
            })
            .populate('uploadedBy', 'name email');

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// DELETE /api/admin/materials/:id
const deleteMaterial = async (req, res) => {
    try {
        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        const isPermanent = req.query.permanent === 'true';

        if (isPermanent) {
            // Permanent delete
            await AcademicMaterial.findByIdAndDelete(req.params.id);

            // Decrement subject materialCount
            if (material.subject) {
                await AcademicSubject.findByIdAndUpdate(material.subject, {
                    $inc: { materialCount: -1 }
                });
            }

            res.status(200).json({ message: 'Material permanently deleted successfully' });
        } else {
            // Soft delete (Move to Trash)
            material.status = 'Hidden';
            material.deletedAt = new Date();
            await material.save();

            res.status(200).json({ message: 'Material moved to Trash successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/bulk-delete
const bulkDeleteMaterials = async (req, res) => {
    try {
        const { ids, permanent } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No material IDs provided' });
        }

        const isPermanent = permanent === true;

        if (isPermanent) {
            // Fetch subject IDs to decrement counts correctly
            const materials = await AcademicMaterial.find({ _id: { $in: ids } }).select('subject');
            const subjectCounts = {};
            materials.forEach(m => {
                if (m.subject) {
                    const subId = m.subject.toString();
                    subjectCounts[subId] = (subjectCounts[subId] || 0) + 1;
                }
            });

            for (const subId of Object.keys(subjectCounts)) {
                await AcademicSubject.findByIdAndUpdate(subId, {
                    $inc: { materialCount: -subjectCounts[subId] }
                });
            }

            await AcademicMaterial.deleteMany({ _id: { $in: ids } });
            res.status(200).json({ message: 'Selected materials permanently deleted successfully' });
        } else {
            // Soft delete
            await AcademicMaterial.updateMany(
                { _id: { $in: ids } },
                { $set: { status: 'Hidden', deletedAt: new Date() } }
            );
            res.status(200).json({ message: 'Selected materials moved to Trash successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/:id/restore
const restoreMaterial = async (req, res) => {
    try {
        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        material.status = 'Published';
        material.deletedAt = null;
        await material.save();

        res.status(200).json({ message: 'Material restored successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/:id/ignore-duplicate
const ignoreDuplicate = async (req, res) => {
    try {
        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        material.ignoredDuplicate = true;
        await material.save();

        res.status(200).json({ message: 'Duplicate warning ignored successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/bulk-reassign
const bulkReassignMaterials = async (req, res) => {
    try {
        const { ids, newSubjectId } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No material IDs provided' });
        }
        if (!newSubjectId) {
            return res.status(400).json({ error: 'newSubjectId is required' });
        }

        const newSubject = await AcademicSubject.findById(newSubjectId);
        if (!newSubject) {
            return res.status(404).json({ error: 'Target subject not found' });
        }

        const materials = await AcademicMaterial.find({ _id: { $in: ids } }).select('subject');

        const oldSubjectCounts = {};
        materials.forEach(m => {
            if (m.subject && m.subject.toString() !== newSubjectId) {
                const oldId = m.subject.toString();
                oldSubjectCounts[oldId] = (oldSubjectCounts[oldId] || 0) + 1;
            }
        });

        for (const [subId, count] of Object.entries(oldSubjectCounts)) {
            await AcademicSubject.findByIdAndUpdate(subId, { $inc: { materialCount: -count } });
        }

        await AcademicSubject.findByIdAndUpdate(newSubjectId, { $inc: { materialCount: ids.length } });

        await AcademicMaterial.updateMany(
            { _id: { $in: ids } },
            { $set: { subject: newSubjectId, migrationStatus: 'Manually Assigned' } }
        );

        res.status(200).json({
            message: `Successfully reassigned ${ids.length} materials to ${newSubject.code} - ${newSubject.name}`
        });
    } catch (error) {
        console.error('bulkReassignMaterials error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/materials/bulk-status
const bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No material IDs provided' });
        }
        if (!status || !['Published', 'Hidden', 'Draft'].includes(status)) {
            return res.status(400).json({ error: 'Valid status (Published, Hidden, Draft) is required' });
        }

        await AcademicMaterial.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );

        res.status(200).json({
            message: `Successfully updated status to "${status}" for ${ids.length} materials`
        });
    } catch (error) {
        console.error('bulkUpdateStatus error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/materials/:id/file
// Generates a secure, temporary pre-signed GET URL for a material
const getMaterialFileUrl = async (req, res) => {
    try {
        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ error: 'Material not found' });
        }

        // Resolve S3 Key (fallback to fileUrl for migrated documents where storedFileName is not the S3 key)
        let key = material.storedFileName;
        if (!key || !(key.startsWith('materials/') || key.startsWith('pyqs/'))) {
            const fileUrl = material.fileUrl || '';
            if (fileUrl.includes('d2mh2rnmjqdkgx.cloudfront.net/')) {
                key = fileUrl.split('d2mh2rnmjqdkgx.cloudfront.net/')[1];
            } else if (fileUrl.includes('.amazonaws.com/')) {
                key = fileUrl.split('.amazonaws.com/')[1];
            } else {
                key = fileUrl; // For migrated documents where fileUrl is already the S3 key path
            }
        }

        if (!key) {
            return res.status(400).json({ error: 'Stored file path is missing' });
        }

        // 1. Verify that the file exists in S3 using HeadObject
        try {
            const headCommand = new HeadObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            });
            await s3.send(headCommand);
        } catch (s3Err) {
            if (s3Err.name === 'NotFound' || s3Err.$metadata?.httpStatusCode === 404) {
                return res.status(404).json({ error: 'File not found.' });
            }
            console.error('S3 HeadObject error:', s3Err);
            return res.status(500).json({ error: 'Unable to open file.' });
        }

        // 2. Generate pre-signed URL (expires in 3600 seconds)
        let url;
        const expiresIn = 3600;
        try {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            };
            if (req.query.download === 'true') {
                const filename = material.originalFileName || material.title;
                // Clean filename from any problematic characters
                const safeFilename = filename.replace(/"/g, '\\"');
                params.ResponseContentDisposition = `attachment; filename="${safeFilename}"`;
            }
            const getCommand = new GetObjectCommand(params);
            url = await getSignedUrl(s3, getCommand, { expiresIn });
        } catch (signErr) {
            console.error('S3 getSignedUrl error:', signErr);
            return res.status(500).json({ error: 'Unable to open file.' });
        }

        // 3. Increment downloadCount and update lastDownloadedAt only if download is requested
        if (req.query.download === 'true') {
            material.downloadCount = (material.downloadCount || 0) + 1;
            material.lastDownloadedAt = new Date();
            await material.save();
        }

        res.status(200).json({
            url,
            expiresIn
        });
    } catch (error) {
        console.error('getMaterialFileUrl error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getStats,
    getHealthStats,
    getDuplicatesList,
    getMaterials,
    getMaterialById,
    previewMatch,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    bulkDeleteMaterials,
    bulkReassignMaterials,
    bulkUpdateStatus,
    restoreMaterial,
    ignoreDuplicate,
    getMaterialFileUrl
};
