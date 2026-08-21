const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/multer');
const { uploadToS3 } = require('../utils/uploadToS3');

const AcademicMaterial = require('../models/AcademicMaterial');
const AcademicSubject = require('../models/AcademicSubject');
const User = require('../models/User');
const BranchModel = require('../models/Branch');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../utils/s3');

const CLOUDFRONT_BASE = 'https://d2mh2rnmjqdkgx.cloudfront.net';

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

const SUBJECT_MAPPING = {
    // Mathematics
    'applied mathematics-i (cse stream)':    'Mathematics',
    'applied mathematics-ii (cse stream)':   'Mathematics',
    'applied mathematics-i (cv stream)':     'Mathematics',
    'applied mathematics-ii (cv stream)':    'Mathematics',
    'applied mathematics-i (eee stream)':    'Mathematics',
    'applied mathematics-ii (eee stream)':   'Mathematics',
    'applied mathematics-i (me stream)':     'Mathematics',
    'applied mathematics-ii (me stream)':    'Mathematics',
    'mathematics':                            'Mathematics',

    // Physics
    'physics of materials':                   'Physics',
    'physics for sustainable structural system': 'Physics',
    'quantum physics and applications':       'Physics',
    'quantum physics and electronics sensors':'Physics',
    'physics':                                'Physics',

    // Chemistry
    'applied chemistry for smart systems':    'Chemistry',
    'applied chemistry for emerging electronics and futuristic devices': 'Chemistry',
    'applied chemistry for sustainable structures and material design': 'Chemistry',
    'applied chemistry for advanced metal protection and sustainable energy systems': 'Chemistry',
    'chemistry':                              'Chemistry',

    // CAED
    'computer-aided engineering drawing (cse stream)': 'CAED',
    'computer-aided engineering drawing (cv stream)':  'CAED',
    'computer-aided engineering drawing (ece stream)': 'CAED',
    'computer-aided engineering drawing (eee stream)': 'CAED',
    'computer-aided engineering drawing (me stream)':  'CAED',
    'caed':                                   'CAED',

    // 1st Year Common subjects
    'balake kannada / samskruthika kannada':  'Balake Kannada / Samskruthika Kannada',
    'basics of electrical engineering':       'Basics of Electrical Engineering',
    'basic electrical laboratory':            'Basic Electrical Laboratory',
    'introduction to electrical engineering': 'Introduction to Electrical Engineering',
    'introduction to electronics & communication engineering': 'Introduction to Electronics & Communication Engineering',
    'introduction to electronics and communication engineering': 'Introduction to Electronics & Communication Engineering',
    'fundamentals of electronics and communication engineering': 'Fundamentals of Electronics & Communication Engineering',
    'fundamentals of electronics & communication engineering': 'Fundamentals of Electronics & Communication Engineering',
    'fundamentals of electronics & communication engineering lab': 'Fundamentals of Electronics & Communication Engineering Lab',
    'elements of mechanical engineering':     'Elements of Mechanical Engineering',
    'elements of mechanical engineering lab': 'Elements of Mechanical Engineering Lab',
    'elements of biotechnology and biomimetics': 'Elements of Biotechnology and Biomimetics',
    'elements of biotechnology lab':          'Elements of Biotechnology Lab',
    'innovation and design thinking lab':     'Innovation and Design Thinking Lab',
    'interdisciplinary project-based learning': 'Interdisciplinary Project-Based Learning',
    'indian constitution and engineering ethics': 'Indian Constitution and Engineering Ethics',
    'python programming':                     'Python Programming',
    'structured programming in c':            'Structured Programming in C',
    'introduction to ai and applications':    'Introduction to AI and Applications',
    'introduction to c programming':          'Introduction to C Programming',
    'c programming lab':                      'C Programming Lab',
    'essentials of information technology':   'Essentials of Information Technology',
    'communication skills':                   'Communication Skills',
    'soft skills':                            'Soft Skills',
    'applied mechanics':                      'Applied Mechanics',
    'electrical engineering materials':       'Electrical Engineering Materials',
    'building materials and concrete technology': 'Building Materials and Concrete Technology',
    'building materials lab':                 'Building Materials Lab',
    'problem solving through programming':    'Structured Programming in C',

    // 2nd Year ISE subjects (auto-matched)
    'operating system':                       'Operating System',
    'design and analysis of algorithms':      'Design and Analysis of Algorithms',
    'arm processor and microcontroller':      'ARM Processor and Microcontroller',
    'discrete mathematical structures':       'Discrete Mathematical Structures',
    'biology for engineers':                  'Biology for Engineers',
    'data structures':                        'Data Structures',
    'data structures laboratory':             'Data Structures Laboratory',
    'mobile application development':         'Mobile Application Development',
    'object oriented programming with java':  'Object Oriented Programming with Java',
    'advanced web technology and internet applications': 'Advanced Web Technology and Internet Applications',
    'digital circuits and computer organization': 'Digital Circuits and Computer Organization',
    'statistics and probability':             'Statistics and Probability',
    'unix and shell programming':             'Unix and Shell Programming',
    'data visualization laboratory':         'Data Visualization Laboratory',
};

// GET /api/documents/subjects
// Get canonical subjects metadata (for dynamic filters)
router.get('/subjects', async (req, res) => {
    try {
        const rawSubjects = await AcademicSubject.find({ status: 'Published' })
            .populate('branch', 'shortName')
            .populate('scheme', 'name')
            .lean();

        // Map to legacy metadata shape so uploader/search pages don't crash
        const subjectsMap = new Map();
        rawSubjects.forEach(s => {
            const normalizedName = s.name.trim();
            if (!subjectsMap.has(normalizedName)) {
                subjectsMap.set(normalizedName, {
                    code: s.code,
                    credits: s.credits,
                    branch: s.branch?.shortName || 'Common',
                    year: s.year || '3rd Year',
                    semester: s.year === '1st Year' ? '1st Year' : (s.year === '2nd Year' ? '3rd sem' : (s.year === '3rd Year' ? '5th sem' : '7th sem'))
                });
            }
        });

        // Convert Map to array of objects
        const formattedSubjects = Array.from(subjectsMap.entries()).map(([name, meta]) => ({
            name,
            code: meta.code,
            credits: meta.credits,
            branch: meta.branch,
            semester: meta.semester,
            year: meta.year
        }));

        res.json(formattedSubjects);
    } catch (error) {
        console.error('Error fetching subjects metadata:', error);
        res.status(500).json({ error: 'Failed to fetch subjects metadata' });
    }
});


// GET /api/documents/materials-overview
router.get('/materials-overview', async (req, res) => {
    try {
        const [notesCount, seeCount, internalsCount, othersCount] = await Promise.all([
            AcademicMaterial.countDocuments({ status: 'Published', materialType: 'Notes' }),
            AcademicMaterial.countDocuments({ status: 'Published', materialType: 'SEE' }),
            AcademicMaterial.countDocuments({ status: 'Published', materialType: 'Internals' }),
            AcademicMaterial.countDocuments({ status: 'Published', materialType: 'Others' })
        ]);

        res.json({
            notes: notesCount,
            pyqs: seeCount + internalsCount,
            others: othersCount
        });
    } catch (error) {
        console.error('Error fetching materials overview:', error);
        res.status(500).json({ error: 'Failed to fetch materials overview' });
    }
});

// GET /api/documents/search
// Unified search across academic_materials only
router.get('/search', async (req, res) => {
    try {
        const {
            q: searchQuery,
            subject,
            paperType,
            semester,
            yearLevel,
            branch,
            documentType,
            year,
            sortBy = 'newest',
        } = req.query;

        const searchCriteria = {};

        // Resolve subject and branch/year filters in parallel
        const promises = [];
        if (subject) {
            promises.push(
                AcademicSubject.findOne({
                    name: new RegExp(`^${escapeRegExp(subject.trim())}$`, 'i')
                }).select('_id').lean()
            );
        } else {
            promises.push(Promise.resolve(null));
        }

        if (branch) {
            const cleanBranch = branch.toUpperCase().trim();
            const branchAliases = {
                CS: 'CSE', CSE: 'CSE', IS: 'ISE', ISE: 'ISE',
                EC: 'ECE', ECE: 'ECE', EE: 'EEE', EEE: 'EEE',
                ME: 'MECH', MECH: 'MECH', CV: 'CIVIL', CIVIL: 'CIVIL',
                CI: 'AIML', AIML: 'AIML', DS: 'DS'
            };
            const targetBranch = branchAliases[cleanBranch] || cleanBranch;
            promises.push(BranchModel.findOne({ shortName: targetBranch }).select('_id').lean());
        } else {
            promises.push(Promise.resolve(null));
        }

        const [subjectDoc, branchDoc] = await Promise.all(promises);

        if (subject && !subjectDoc) {
            return res.json({ documents: [], summary: { total: 0, notes: 0, see: 0, internals: 0, others: 0 } });
        }
        if (subjectDoc) {
            searchCriteria.subject = subjectDoc._id;
        }

        const subjectFilters = {};
        if (branchDoc) {
            subjectFilters.branch = branchDoc._id;
        }
        if (yearLevel) {
            const yl = yearLevel.toLowerCase().trim();
            const yearMap = {
                '1st year': '1st Year',
                '2nd year': '2nd Year',
                '3rd year': '3rd Year',
                '4th year': '4th Year'
            };
            const targetYear = yearMap[yl];
            if (targetYear) {
                subjectFilters.year = targetYear;
            }
        }

        if (Object.keys(subjectFilters).length > 0) {
            const matchingSubjects = await AcademicSubject.find(subjectFilters).select('_id').lean();
            const subjectIds = matchingSubjects.map(s => s._id);
            if (searchCriteria.subject) {
                const currentId = searchCriteria.subject.toString();
                if (!subjectIds.some(id => id.toString() === currentId)) {
                    return res.json({ documents: [], summary: { total: 0, notes: 0, see: 0, internals: 0, others: 0 } });
                }
            } else {
                searchCriteria.subject = { $in: subjectIds };
            }
        }

        // Document type filter
        if (documentType) {
            const t = documentType.toLowerCase().trim();
            const mappedType = t === 'notes' ? 'Notes'
                : t === 'see' ? 'SEE'
                : t === 'internals' ? 'Internals'
                : 'Others';
            searchCriteria.materialType = mappedType;
        }

        // Text / Keyword search
        if (searchQuery) {
            const regex = new RegExp(escapeRegExp(searchQuery.trim()), 'i');
            
            const matchingSubjects = await AcademicSubject.find({
                $or: [
                    { name: regex },
                    { code: regex }
                ]
            }).select('_id');
            const subjectIds = matchingSubjects.map(s => s._id);

            searchCriteria.$or = [
                { title: regex },
                { originalFileName: regex },
                { storedFileName: regex },
                { legacySubjectName: regex },
                { subject: { $in: subjectIds } }
            ];
        }

        // Bookmarks filter
        if (req.query.bookmarksOnly === 'true') {
            try {
                const token = req.headers.authorization?.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.userId);
                    if (user && user.bookmarks.length > 0) {
                        searchCriteria._id = { $in: user.bookmarks };
                    } else if (user) {
                        searchCriteria._id = { $in: [] };
                    }
                }
            } catch (e) {}
        }

        // Admin check: non-admins only see Published
        let verifiedAdmin = false;
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                verifiedAdmin = !!decoded.isAdmin;
            }
        } catch (e) {}
        const isAdminView = req.query.adminView === 'true' && verifiedAdmin;

        if (!isAdminView) {
            searchCriteria.status = 'Published';
        } else {
            if (req.query.status === 'pending') {
                searchCriteria.status = 'Draft';
            } else if (req.query.status === 'approved') {
                searchCriteria.status = 'Published';
            } else if (req.query.status === 'deleted') {
                searchCriteria.status = 'Hidden';
            }
        }

        // Sorting & Pagination
        let sortOption = { createdAt: -1 };
        if (sortBy === 'most-downloaded') sortOption = { downloadCount: -1 };
        if (sortBy === 'recently-updated') sortOption = { updatedAt: -1 };

        const limitNum = req.query.limit ? parseInt(req.query.limit, 10) : 0;
        const pageNum = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : 1;
        const skipNum = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

        let query = AcademicMaterial.find(searchCriteria)
            .populate({
                path: 'subject',
                select: 'name code year credits status',
                populate: [
                    { path: 'branch', select: 'shortName name' }
                ]
            })
            .populate('uploadedBy', 'name email')
            .sort(sortOption);

        if (limitNum > 0) {
            query = query.skip(skipNum).limit(limitNum);
        }

        const rawMaterials = await query.lean();

        const docTypeMap = {
            'Notes': 'notes',
            'SEE': 'see',
            'Internals': 'internals',
            'Others': 'others'
        };

        const documents = rawMaterials.map(m => ({
            _id: m._id,
            fileName: m.storedFileName || m.title,
            originalName: m.originalFileName || m.title,
            fileUrl: m.fileUrl,
            fileSize: m.fileSize || 0,
            mimeType: m.mimeType || 'application/pdf',
            thumbnailUrl: null,
            subjectName: m.subject?.name || m.legacySubjectName || 'General',
            subjectCode: m.subject?.code || '—',
            semester: m.subject?.year || 'N/A',
            yearLevel: m.subject?.year || 'N/A',
            branch: m.subject?.branch?.shortName || 'Common',
            documentType: docTypeMap[m.materialType] || 'others',
            paperType: m.description || 'regular',
            tags: m.tags || '',
            uploadedBy: m.uploadedBy,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            downloadCount: m.downloadCount || 0,
            previewCount: m.previewCount || 0,
            isApproved: m.status === 'Published',
            likes: [],
            contributor: {
                showName: false,
                name: m.uploadedBy?.name || 'Anonymous User',
                year: m.subject?.year || 'N/A',
                branch: m.subject?.branch?.shortName || 'Common'
            }
        }));

        const total = documents.length;
        const breakdown = { notes: 0, see: 0, internals: 0, others: 0 };
        documents.forEach(d => {
            if (breakdown[d.documentType] !== undefined) breakdown[d.documentType]++;
            else breakdown.others++;
        });

        res.json({
            documents,
            summary: { total, ...breakdown }
        });

    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ error: 'Failed to search documents' });
    }
});

// POST /api/documents/upload
// Writes ONLY to academic_materials, never to documents or cms_materials
router.post('/upload', authMiddleware, upload.fields([{ name: 'files', maxCount: 100 }, { name: 'thumbnails', maxCount: 100 }]), async (req, res) => {
    try {
        if (!req.files || !req.files.files || req.files.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const {
            subjectName,
            subjectCode,
            documentType,
            usn
        } = req.body;

        // Update user USN if not already set
        const currentUser = await User.findById(req.userId);
        let updatedUser = null;
        if (currentUser && !currentUser.usn && usn) {
            const StudentAccount = require('../models/StudentAccount');
            const existingUSN = await StudentAccount.findOne({ usn: usn.toUpperCase(), isDeleted: false });
            if (!existingUSN) {
                currentUser.usn = usn.toUpperCase();
                updatedUser = await currentUser.save();
            }
        }

        if (!subjectName || !documentType) {
            if (req.files && req.files.files) {
                req.files.files.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            return res.status(400).json({ error: 'Missing required fields: subjectName, documentType' });
        }

        // Resolve subject
        const rawName = subjectName.trim().toLowerCase();
        const mappedName = SUBJECT_MAPPING[rawName] || subjectName;

        const subjectDoc = await AcademicSubject.findOne({
            $or: [
                { name: new RegExp(`^${escapeRegExp(mappedName)}$`, 'i') },
                { code: new RegExp(`^${escapeRegExp(subjectCode || '')}$`, 'i') }
            ]
        });

        const isApproved = req.isAdmin || true; // Auto-approve
        const uploadedDocuments = [];

        const docTypeMap = {
            notes: 'Notes',
            see: 'SEE',
            internals: 'Internals',
            others: 'Others'
        };
        const mappedMaterialType = docTypeMap[documentType.toLowerCase()] || 'Others';

        for (let i = 0; i < req.files.files.length; i++) {
            const file = req.files.files[i];

            // Upload S3
            const s3Key = await uploadToS3(file, 'materials');
            const fileUrl = `${CLOUDFRONT_BASE}/${s3Key}`;
            const fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();

            // Create AcademicMaterial record
            const material = await AcademicMaterial.create({
                title:             file.originalname,
                subject:           subjectDoc ? subjectDoc._id : null,
                legacySubjectName: subjectName,
                materialType:      mappedMaterialType,
                fileUrl,
                storedFileName:    s3Key,
                originalFileName:  file.originalname,
                fileType:          fileExtension,
                mimeType:          file.mimetype,
                fileSize:          file.size,
                uploadedBy:        req.userId,
                uploaderEmail:    currentUser?.email || null,
                status:            isApproved ? 'Published' : 'Draft',
                migrationStatus:   subjectDoc ? 'Auto Matched' : 'Needs Review'
            });

            // Increment subject counter if subject resolved
            if (subjectDoc) {
                await AcademicSubject.findByIdAndUpdate(subjectDoc._id, { $inc: { materialCount: 1 } });
            }

            uploadedDocuments.push({
                _id: material._id,
                fileName: material.storedFileName,
                originalName: material.originalFileName,
                fileUrl: material.fileUrl,
                fileSize: material.fileSize,
                mimeType: material.mimeType,
                subjectName: subjectName,
                subjectCode: subjectCode || '—',
                documentType: documentType
            });
        }

        res.status(201).json({
            message: `${uploadedDocuments.length} document(s) uploaded successfully`,
            documents: uploadedDocuments,
            updatedUser: updatedUser
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        if (req.files && req.files.files) {
            req.files.files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ error: 'Failed to upload documents' });
    }
});

// GET /api/documents/:documentId/download
// Download document (CloudFront URL) and increment downloadCount
router.get('/:documentId/download', async (req, res) => {
    try {
        const document = await AcademicMaterial.findById(req.params.documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Resolve S3 Key
        let key = document.storedFileName;
        if (!key || !(key.startsWith('materials/') || key.startsWith('pyqs/'))) {
            const fileUrl = document.fileUrl || '';
            if (fileUrl.includes('d2mh2rnmjqdkgx.cloudfront.net/')) {
                key = fileUrl.split('d2mh2rnmjqdkgx.cloudfront.net/')[1];
            } else if (fileUrl.includes('.amazonaws.com/')) {
                key = fileUrl.split('.amazonaws.com/')[1];
            } else {
                key = fileUrl;
            }
        }

        if (!key) {
            return res.status(400).json({ error: 'File path not found' });
        }

        // Generate S3 presigned URL forcing attachment download with custom filename
        const filename = document.originalFileName || document.title;
        const safeFilename = filename.replace(/"/g, '\\"');
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${safeFilename}"`
        };
        const getCommand = new GetObjectCommand(params);
        const downloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

        await AcademicMaterial.findByIdAndUpdate(req.params.documentId, {
            $inc: { downloadCount: 1 },
            lastDownloadedAt: new Date()
        });

        res.json({ downloadUrl });
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to generate download link' });
    }
});

// GET /api/documents/:documentId/preview-url
// Preview document and increment previewCount
router.get('/:documentId/preview-url', async (req, res) => {
    try {
        const document = await AcademicMaterial.findById(req.params.documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Resolve S3 Key
        let key = document.storedFileName;
        if (!key || !(key.startsWith('materials/') || key.startsWith('pyqs/'))) {
            const fileUrl = document.fileUrl || '';
            if (fileUrl.includes('d2mh2rnmjqdkgx.cloudfront.net/')) {
                key = fileUrl.split('d2mh2rnmjqdkgx.cloudfront.net/')[1];
            } else if (fileUrl.includes('.amazonaws.com/')) {
                key = fileUrl.split('.amazonaws.com/')[1];
            } else {
                key = fileUrl;
            }
        }

        if (!key) {
            return res.status(400).json({ error: 'File path not found' });
        }

        // Generate S3 presigned URL for inline display
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };
        const getCommand = new GetObjectCommand(params);
        const previewUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

        await AcademicMaterial.findByIdAndUpdate(req.params.documentId, {
            $inc: { previewCount: 1 }
        });

        res.json({ previewUrl });
    } catch (error) {
        console.error('Error previewing document:', error);
        res.status(500).json({ error: 'Failed to generate preview link' });
    }
});

// GET /api/documents/:documentId
// Get material details
router.get('/:documentId', authMiddleware, async (req, res) => {
    try {
        const document = await AcademicMaterial.findById(req.params.documentId)
            .populate('uploadedBy', 'name email');

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Map AcademicMaterial shape to legacy document details format
        const responseData = {
            _id: document._id,
            fileName: document.storedFileName || document.title,
            originalName: document.originalFileName || document.title,
            fileUrl: document.fileUrl,
            fileSize: document.fileSize || 0,
            mimeType: document.mimeType,
            subjectName: document.legacySubjectName || 'General',
            uploadedBy: document.uploadedBy,
            createdAt: document.createdAt,
            downloadCount: document.downloadCount,
            previewCount: document.previewCount
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching document details:', error);
        res.status(500).json({ error: 'Failed to fetch document details' });
    }
});

// POST /api/documents/:id/like
// Mock likes since AcademicMaterial collection doesn't use it, maintaining route compatibility
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const document = await AcademicMaterial.findById(req.params.id);
        if (!document) return res.status(404).json({ error: 'Document not found' });

        res.json({ 
            success: true, 
            likes: 0,
            isLiked: false
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update like status' });
    }
});

// POST /api/documents/:id/bookmark
// Toggle bookmark for user
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const docId = req.params.id;
        const index = user.bookmarks.indexOf(docId);
        
        if (index > -1) {
            user.bookmarks.splice(index, 1);
        } else {
            user.bookmarks.push(docId);
        }
        
        await user.save();
        res.json({ bookmarks: user.bookmarks });
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
});

// DELETE /api/documents/:id (Admin soft delete/hide)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        material.status = 'Hidden';
        await material.save();

        res.json({ success: true, message: 'Material hidden successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete/hide material' });
    }
});

// POST /api/documents/:id/approve (Admin approve)
router.post('/:id/approve', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const material = await AcademicMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        if (material.status !== 'Published') {
            material.status = 'Published';
            await material.save();

            // Increment subject counter
            if (material.subject) {
                await AcademicSubject.findByIdAndUpdate(material.subject, { $inc: { materialCount: 1 } });
            }

            // Award uploader points
            const uploader = await User.findById(material.uploadedBy);
            if (uploader && !uploader.isAdmin) {
                uploader.uploads += 1;
                uploader.score += 10;
                await uploader.save();
            }
        }

        res.json({ success: true, message: 'Material approved successfully', document: material });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve material' });
    }
});

module.exports = router;
