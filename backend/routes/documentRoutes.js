const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const SubjectMetadata = require('../models/SubjectMetadata');
const PaperType = require('../models/PaperType');
const Subject = require('../models/Subject');
const { uploadToS3 } = require('../utils/uploadToS3');
const deleteFromS3 = require('../utils/deleteFromS3');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for ZIPs
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.zip', '.rar', '.7z'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and ZIP/Archive files are allowed.'));
        }
    }
});

// Get subjects metadata
router.get('/subjects', async (req, res) => {
    try {
        // Get all subjects with their names, codes, and credits
        const rawSubjects = await Subject.find({}, 'name code credits').lean();
        
        if (!rawSubjects) {
            return res.json([]);
        }

        // Normalize names for Physics, Chemistry, and Maths
        const subjectsMap = new Map();
        
        rawSubjects.forEach(s => {
            const lower = s.name.toLowerCase().replace(/-/g, ' ');
            let normalizedName = s.name;
            let defaultCode = s.code;
            let credits = s.credits || 0;
            
            // Physics: Match "physics" but not "physical" unless it's "physical science"
            if (lower.includes('physics') || lower.includes('aps')) {
                normalizedName = 'Physics';
                defaultCode = 'PHY';
            }
            // Chemistry: Match "chemistry" or "acy"
            else if (lower.includes('chemistry') || lower.includes('acy')) {
                normalizedName = 'Chemistry';
                defaultCode = 'CHEM';
            }
            // Mathematics: Match "mathematics" or "math" or "acm"
            else if (lower.includes('math') || lower.includes('acm')) {
                normalizedName = 'Mathematics';
                defaultCode = 'MATH';
            }
            // CAED: Match "caed" or "engineering drawing"
            else if (lower.includes('caed') || lower.includes('engineering drawing') || lower.includes('computer aided')) {
                normalizedName = 'CAED';
                defaultCode = 'CAED';
            }
            
            if (!subjectsMap.has(normalizedName)) {
                subjectsMap.set(normalizedName, { code: defaultCode, credits });
            } else {
                const existing = subjectsMap.get(normalizedName);
                if (credits > existing.credits) {
                    existing.credits = credits;
                }
            }
        });

        const uniqueSubjects = Array.from(subjectsMap.entries())
            .map(([name, data]) => ({ name, code: data.code, credits: data.credits }))
            .sort((a, b) => {
                if (b.credits !== a.credits) return b.credits - a.credits;
                return a.name.localeCompare(b.name);
            });
        
        res.json(uniqueSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// Get paper types metadata
router.get('/paper-types', async (req, res) => {
    try {
        const paperTypes = await PaperType.find({ isActive: true }).sort({ name: 1 });
        res.json(paperTypes);
    } catch (error) {
        console.error('Error fetching paper types:', error);
        res.status(500).json({ error: 'Failed to fetch paper types' });
    }
});

// Get autocomplete suggestions based on documents actually present
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ subjects: [], papers: [], notes: [] });
        }

        const query = q.toLowerCase();
        const regex = new RegExp(query, 'i');

        // Only search approved documents
        const approvedCriteria = { isApproved: true };

        // Get unique subjects that match the query
        const subjects = await Document.aggregate([
            { $match: { 
                $and: [
                    approvedCriteria,
                    { $or: [
                        { subjectName: regex },
                        { subjectCode: regex }
                    ]}
                ]
            }},
            { $group: { 
                _id: { name: "$subjectName", code: "$subjectCode" }
            }},
            { $limit: 5 },
            { $project: { _id: 0, name: "$_id.name", code: "$_id.code" } }
        ]);

        // Get matching document titles for papers (filtered by documentType: 'see' or 'internals')
        const papers = await Document.find({
            ...approvedCriteria,
            documentType: { $in: ['see', 'internals'] },
            $or: [
                { originalName: regex },
                { subjectName: regex },
                { subjectCode: regex }
            ]
        })
        .select('originalName subjectName subjectCode documentType')
        .limit(4)
        .lean();

        // Get matching document titles for notes (filtered by documentType: 'notes')
        const notes = await Document.find({
            ...approvedCriteria,
            documentType: 'notes',
            $or: [
                { originalName: regex },
                { subjectName: regex },
                { subjectCode: regex },
                { tags: regex }
            ]
        })
        .select('originalName subjectName subjectCode moduleInfo')
        .limit(4)
        .lean();

        res.json({
            subjects,
            papers: papers.map(p => ({ 
                name: p.originalName, 
                code: p.subjectCode,
                type: p.documentType 
            })),
            notes: notes.map(n => ({ 
                name: n.originalName, 
                code: n.subjectCode,
                module: n.moduleInfo 
            }))
        });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// Search documents
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
            sortBy = 'newest',
        } = req.query;

        // Build search criteria
        const searchCriteria = {};

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            const codeRegex = new RegExp(`^${query}`, 'i');
            const wordStartRegex = new RegExp(`\\b${query}`, 'i');
            
            // For short queries, we match originalName only if it's a whole word to avoid "mat" matching "material"
            const filenameRegex = query.length < 4 
                ? new RegExp(`\\b${query}\\b`, 'i')  // Only exact word "MAT" matches in filename
                : wordStartRegex;                     // Partial starts allowed for longer queries
            
            searchCriteria.$or = [
                { subjectCode: codeRegex },             // Starts with code (MAT)
                { subjectName: wordStartRegex },       // Starts with word (Mathematics)
                { originalName: filenameRegex },       // Only whole-word for short queries
                { tags: wordStartRegex }               
            ];
        }

        if (subject) {
            searchCriteria.subjectName = new RegExp(`^${subject}$`, 'i');
        }
        if (paperType) {
            searchCriteria.paperType = new RegExp(`^${paperType}$`, 'i');
        }
        if (semester) {
            searchCriteria.semester = new RegExp(`^${semester}$`, 'i');
        }
        // yearLevel maps to semester ranges since yearLevel is NOT stored in Document —
        // only semester is stored (e.g. "3rd Sem", "4th Sem", "1st Year")
        if (yearLevel && !semester) {
            const yl = yearLevel.toLowerCase().trim();
            const semesterMap = {
                '1st year':  ['1st Year', '1st Sem', '2nd Sem'],
                '2nd year':  ['3rd Sem', '4th Sem'],
                '3rd year':  ['5th Sem', '6th Sem'],
                '4th year':  ['7th Sem', '8th Sem'],
            };
            const semValues = semesterMap[yl];
            if (semValues) {
                // Case-insensitive $in match
                searchCriteria.semester = { $in: semValues.map(s => new RegExp(`^${s}$`, 'i')) };
            }
        }
        // Branch Filter Logic
        if (branch) {
            const b = branch.toLowerCase().trim();
            const isCommonSearch = b === 'all' || b === 'common' || b === 'common to all';
            
            const branchQuery = isCommonSearch 
                ? { branch: { $in: [/^all$/i, /^common$/i, /^common to all$/i] } }
                : { 
                    $or: [
                        { branch: new RegExp(`^${b}$`, 'i') }, 
                        { branch: /^all$/i }, 
                        { branch: /^common$/i },
                        { branch: /^common to all$/i },
                        { branch: { $in: [null, ''] } }
                    ]
                };

            if (searchCriteria.$or) {
                // searchQuery already using $or, wrap it with $and
                const existingOr = searchCriteria.$or;
                delete searchCriteria.$or;
                searchCriteria.$and = [
                    { $or: existingOr },
                    branchQuery
                ];
            } else {
                // Merge branchQuery directly if it's not a complex $or
                if (branchQuery.$or) {
                    searchCriteria.$or = branchQuery.$or;
                } else {
                    Object.assign(searchCriteria, branchQuery);
                }
            }
        }

        if (documentType) {
            searchCriteria.documentType = new RegExp(`^${documentType}$`, 'i');
        }

        // Bookmark Logic
        if (req.query.bookmarksOnly === 'true') {
            try {
                const token = req.headers.authorization?.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const User = require('../models/User');
                    const user = await User.findById(decoded.userId);
                    if (user && user.bookmarks.length > 0) {
                        searchCriteria._id = { $in: user.bookmarks };
                    } else if (user) {
                        // User has no bookmarks, return empty
                        searchCriteria._id = { $in: [] };
                    }
                }
            } catch (e) {
                // Not logged in or invalid token
            }
        }

        // Approval Logic: Guests and regular users only see approved materials.
        // Admins can see "pending" materials to review them.
        let verifiedAdmin = false;
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                verifiedAdmin = !!decoded.isAdmin;
            }
        } catch (e) {
            // Ignore token errors for public search
        }

        const isAdminView = req.query.adminView === 'true' && verifiedAdmin;
        if (!isAdminView) {
            searchCriteria.isApproved = true;
            searchCriteria.isDeleted = { $ne: true };
        } else {
            // Admin is viewing, they can filter by status if they want
            if (req.query.status === 'pending') {
                searchCriteria.isApproved = false;
                searchCriteria.isDeleted = { $ne: true };
            } else if (req.query.status === 'approved') {
                searchCriteria.isApproved = true;
                searchCriteria.isDeleted = { $ne: true };
            } else if (req.query.status === 'deleted') {
                searchCriteria.isDeleted = true;
            } else {
                // Default admin view: everything not in recycle bin
                searchCriteria.isDeleted = { $ne: true };
            }
        }

        // Sorting logic
        let sortOption = { createdAt: -1 };
        if (sortBy === 'most-downloaded') sortOption = { downloadCount: -1, previewCount: -1 };
        if (sortBy === 'recently-updated') sortOption = { updatedAt: -1 };
        if (sortBy === 'size-asc') sortOption = { fileSize: 1 };
        if (sortBy === 'size-desc') sortOption = { fileSize: -1 };
        
        let documents;
        if (sortBy === 'most-liked') {
            documents = await Document.aggregate([
                { $match: searchCriteria },
                { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } } } },
                { $sort: { likeCount: -1, createdAt: -1 } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'uploadedBy',
                        foreignField: '_id',
                        as: 'uploadedBy'
                    }
                },
                { $unwind: { path: '$uploadedBy', preserveNullAndEmptyArrays: true } },
                { $project: { 'uploadedBy.password': 0, 'uploadedBy.tokenVersion': 0 } }
            ]);
        } else {
            documents = await Document.find(searchCriteria)
                .populate('uploadedBy', 'name email')
                .sort(sortOption);
        }

        const total = await Document.countDocuments(searchCriteria);

        // Get breakdown by type for the current search criteria
        const breakdown = await Document.aggregate([
            { $match: searchCriteria },
            { $group: { _id: "$documentType", count: { $sum: 1 } } }
        ]);

        const summary = {
            total,
            notes: breakdown.find(b => b._id === 'notes')?.count || 0,
            see: breakdown.find(b => b._id === 'see')?.count || 0,
            internals: breakdown.find(b => b._id === 'internals')?.count || 0,
            others: breakdown.find(b => b._id === 'others')?.count || 0
        };

        res.json({
            documents,
            summary
        });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ error: 'Failed to search documents' });
    }
});

// Upload document (Multiple Files Support)
router.post('/upload', authMiddleware, upload.fields([{ name: 'files', maxCount: 100 }, { name: 'thumbnails', maxCount: 100 }]), async (req, res) => {
    try {
        if (!req.files || !req.files.files || req.files.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const {
            subjectName,
            subjectCode,
            semester,
            year,
            branch,
            documentType,
            paperType,
            tags,
            moduleInfo,
            pageCount,
            // Contributor fields
            showContributorName,
            contributorName,
            contributorYear,
            contributorBranch,
            usn
        } = req.body;

        // Update user USN if not already set
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        let updatedUser = null;
        if (currentUser && !currentUser.usn && usn) {
            // Check if USN is already taken
            const existingUSN = await User.findOne({ usn: usn.toUpperCase() });
            if (!existingUSN) {
                currentUser.usn = usn.toUpperCase();
                updatedUser = await currentUser.save();
            }
        }

        // Validate required fields
        if (!subjectName || !documentType) {
            // Clean up uploaded files if validation fails
            if (req.files && req.files.files) {
                req.files.files.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            if (req.files && req.files.thumbnails) {
                req.files.thumbnails.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            return res.status(400).json({ error: 'Missing required fields: subjectName, documentType' });
        }

        const isApproved = req.isAdmin; // Auto-approve if uploaded by admin
        const uploadedDocuments = [];

        // Process each file
        for (let i = 0; i < req.files.files.length; i++) {
            const file = req.files.files[i];
            const thumbnailFile = req.files.thumbnails && req.files.thumbnails[i] && req.files.thumbnails[i].size > 0 ? req.files.thumbnails[i] : null;
            const singlePageCount = req.body.pageCounts && req.body.pageCounts[i] ? parseInt(req.body.pageCounts[i]) : pageCount;

            // Upload to S3
            const s3Key = await uploadToS3(file, 'materials');
            
            let thumbnailKey = null;
            let thumbnailUrl = null;
            if (thumbnailFile) {
                thumbnailKey = await uploadToS3(thumbnailFile, 'materials/thumbnails');
                thumbnailUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${thumbnailKey}`;
            }

            // Create document record
            const document = new Document({
                fileName: s3Key,
                originalName: file.originalname,
                fileUrl: s3Key,
                fileSize: file.size,
                mimeType: file.mimetype,
                thumbnailKey,
                thumbnailUrl,
                thumbnailGenerated: !!thumbnailKey,
                pageCount: singlePageCount,
                subjectName,
                subjectCode,
                semester,
                year,
                branch: branch || contributorBranch,
                documentType,
                paperType,
                tags,
                moduleInfo,
                uploadedBy: req.userId,
                isApproved,
                contributor: {
                    showName: showContributorName === 'true' || showContributorName === true,
                    name: contributorName,
                    year: contributorYear,
                    branch: contributorBranch
                }
            });

            await document.save();
            uploadedDocuments.push(document);
        }

        // Update or create subject metadata if it doesn't exist
        await SubjectMetadata.findOneAndUpdate(
            { name: subjectName },
            {
                name: subjectName,
                code: subjectCode,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );


        // Update or create paper type metadata if provided
        if (paperType) {
            await PaperType.findOneAndUpdate(
                { name: paperType },
                {
                    name: paperType,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        if (!isApproved) {
            // Trigger Contribution Submitted email asynchronously
            try {
                const uploader = await User.findById(req.userId);
                if (uploader && uploader.email) {
                    const { sendContributionSubmittedEmail } = require('../utils/emailService');
                    sendContributionSubmittedEmail(uploader.email, uploader.name || uploader.username || 'Contributor', {
                        resourceName: uploadedDocuments.map(item => item.originalName || item.fileName).join(", "),
                        subjectName: subjectName,
                        subjectCode: subjectCode || 'N/A',
                        documentType: documentType,
                        semester: semester || 'N/A'
                    }).catch(err => console.error('Error sending contribution submitted email:', err));
                }
            } catch (emailErr) {
                console.error('Failed to trigger contribution submitted email:', emailErr);
            }
        }

        res.status(201).json({
            message: `${uploadedDocuments.length} document(s) uploaded successfully`,
            documents: uploadedDocuments,
            updatedUser: updatedUser
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        
        // Clean up uploaded files if local path exists
        if (req.files) {
            req.files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        res.status(500).json({ error: 'Failed to upload documents' });
    }
});

// Download document (S3 Signed URL)
router.get('/:documentId/download', async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const fileKey = document.fileUrl;
        const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${fileKey}`;

        // Update download statistics
        await Document.findByIdAndUpdate(req.params.documentId, {
            $inc: { downloadCount: 1 },
            lastDownloadedAt: new Date()
        });

        res.json({ downloadUrl: fileUrl });
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to generate download link' });
    }
});

// Preview document (S3 Signed URL + increment previewCount)
router.get('/:documentId/preview-url', async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const fileKey = document.fileUrl;
        const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${fileKey}`;

        // Update preview statistics
        await Document.findByIdAndUpdate(req.params.documentId, {
            $inc: { previewCount: 1 }
        });

        res.json({ previewUrl: fileUrl });
    } catch (error) {
        console.error('Error previewing document:', error);
        res.status(500).json({ error: 'Failed to generate preview link' });
    }
});

// Get document details
router.get('/:documentId', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId)
            .populate('uploadedBy', 'name email');

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// Like/Unlike document
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const userId = req.userId;
        const likeIndex = document.likes.indexOf(userId);

        if (likeIndex === -1) {
            // Like
            document.likes.push(userId);
        } else {
            // Unlike
            document.likes.splice(likeIndex, 1);
        }

        await document.save();
        res.json({ 
            success: true, 
            likes: document.likes.length,
            isLiked: document.likes.includes(userId)
        });
    } catch (error) {
        console.error('Error liking document:', error);
        res.status(500).json({ error: 'Failed to update like status' });
    }
});

// Delete/Recycle document (Admin only - default to Soft Delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Soft delete: set brand new deletedAt timestamp
        document.isDeleted = true;
        document.deletedAt = new Date();
        await document.save();

        res.json({ success: true, message: 'Document moved to Recycle Bin' });
    } catch (error) {
        console.error('Error recycling document:', error);
        res.status(500).json({ error: 'Failed to recycle document' });
    }
});

// Restore document (Admin only)
router.post('/:id/restore', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        document.isDeleted = false;
        document.deletedAt = null;
        await document.save();

        res.json({ success: true, message: 'Document restored successfully', document });
    } catch (error) {
        console.error('Error restoring document:', error);
        res.status(500).json({ error: 'Failed to restore document' });
    }
});

// Permanent Delete document (Admin only)
router.delete('/:id/permanent', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from S3 only if it's a permanent delete
        if (document.fileName) {
            try { await deleteFromS3(document.fileName); } catch (e) { console.error('S3 delete fail', e); }
        }

        // Delete from database
        await Document.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Document permanently deleted' });
    } catch (error) {
        console.error('Error permanently deleting document:', error);
        res.status(500).json({ error: 'Failed to permanently delete document' });
    }
});

// Approve document (Admin only)
router.post('/:id/approve', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (!document.isApproved) {
            document.isApproved = true;
            await document.save();

            // Increment user's score and uploads count only if the uploader is NOT an admin
            const User = require('../models/User');
            const uploader = await User.findById(document.uploadedBy);
            if (uploader && !uploader.isAdmin) {
                uploader.uploads += 1;
                uploader.score += 10;
                await uploader.save();

                // Send Contribution Approved email asynchronously
                const { sendContributionApprovedEmail } = require('../utils/emailService');
                sendContributionApprovedEmail(uploader.email, uploader.name || uploader.username || 'Contributor', 10, {
                    resourceName: document.originalName || document.fileName,
                    subjectName: document.subjectName,
                    subjectCode: document.subjectCode || 'N/A',
                    documentType: document.documentType,
                    semester: document.semester || 'N/A'
                }).catch(err => console.error('Error sending contribution approved email:', err));
            }
        }

        res.json({ success: true, message: 'Document approved successfully', document });
    } catch (error) {
        console.error('Error approving document:', error);
        res.status(500).json({ error: 'Failed to approve document' });
    }
});

// Update document metadata (Admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { originalName, subjectName, subjectCode, semester, moduleInfo, pageCount, tags, documentType } = req.body;
        
        const updateData = {};
        if (originalName) updateData.originalName = originalName;
        if (subjectName) updateData.subjectName = subjectName;
        if (subjectCode !== undefined) updateData.subjectCode = subjectCode;
        if (semester) updateData.semester = semester;
        if (moduleInfo !== undefined) updateData.moduleInfo = moduleInfo;
        if (pageCount !== undefined) updateData.pageCount = pageCount;
        if (tags !== undefined) updateData.tags = tags;
        if (documentType) updateData.documentType = documentType;

        const document = await Document.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// Admin routes for managing metadata
router.post('/subjects', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, code, department, description } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }

        const subject = new SubjectMetadata({
            name,
            code,
            department,
            description
        });

        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

router.post('/paper-types', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const paperType = new PaperType({
            name,
            description
        });

        await paperType.save();
        res.status(201).json(paperType);
    } catch (error) {
        console.error('Error creating paper type:', error);
        res.status(500).json({ error: 'Failed to create paper type' });
    }
});

// Toggle Bookmark
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
    try {
        const User = require('../models/User'); // Import here if not already imported
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

module.exports = router;
