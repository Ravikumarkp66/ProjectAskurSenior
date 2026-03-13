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
const { generateSignedUrl } = require('../utils/getSignedUrl');
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
        // Get all subjects with their names and codes
        const rawSubjects = await Subject.find({}, 'name code').lean();
        
        if (!rawSubjects) {
            return res.json([]);
        }

        // Normalize names for Physics, Chemistry, and Maths
        const subjectsMap = new Map();
        
        rawSubjects.forEach(s => {
            const lower = s.name.toLowerCase().replace(/-/g, ' ');
            let normalizedName = s.name;
            let defaultCode = s.code;
            
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
                subjectsMap.set(normalizedName, defaultCode);
            }
        });

        const uniqueSubjects = Array.from(subjectsMap.entries())
            .map(([name, code]) => ({ name, code }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
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
            documentType,
            sortBy = 'newest',
            page = 1,
            limit = 20
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
        } else {
            // Admin is viewing, they can filter by status if they want
            if (req.query.status === 'pending') {
                searchCriteria.isApproved = false;
            } else if (req.query.status === 'approved') {
                searchCriteria.isApproved = true;
            }
            // If they don't specify, they see all (both approved and pending) in 'Review Queue' context
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

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
                { $skip: skip },
                { $limit: parseInt(limit) },
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
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit));
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
            internals: breakdown.find(b => b._id === 'internals')?.count || 0
        };

        res.json({
            documents,
            summary,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ error: 'Failed to search documents' });
    }
});

// Upload document (Multiple Files Support)
router.post('/upload', authMiddleware, upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const {
            subjectName,
            subjectCode,
            semester,
            year,
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
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            return res.status(400).json({ error: 'Missing required fields: subjectName, documentType' });
        }

        const isApproved = req.isAdmin; // Auto-approve if uploaded by admin
        const uploadedDocuments = [];

        // Process each file
        for (const file of req.files) {
            // Upload to S3
            const s3Key = await uploadToS3(file, 'materials');

            // Create document record
            const document = new Document({
                fileName: s3Key,
                originalName: file.originalname,
                fileUrl: s3Key,
                fileSize: file.size,
                mimeType: file.mimetype,
                subjectName,
                subjectCode,
                semester,
                year,
                documentType,
                paperType,
                tags,
                moduleInfo,
                pageCount,
                uploadedBy: req.userId,
                isApproved,
                contributor: {
                    showName: showContributorName === 'true',
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
router.get('/:documentId/download', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const signedUrl = await generateSignedUrl(document.fileUrl);

        // Update download statistics
        await Document.findByIdAndUpdate(req.params.documentId, {
            $inc: { downloadCount: 1 },
            lastDownloadedAt: new Date()
        });

        res.json({ downloadUrl: signedUrl });
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to generate download link' });
    }
});

// Preview document (S3 Signed URL + increment previewCount)
router.get('/:documentId/preview-url', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const signedUrl = await generateSignedUrl(document.fileUrl);

        // Update preview statistics
        await Document.findByIdAndUpdate(req.params.documentId, {
            $inc: { previewCount: 1 }
        });

        res.json({ previewUrl: signedUrl });
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

// Delete document (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from S3 first
        if (document.fileName) {
            await deleteFromS3(document.fileName);
        }

        // Delete from database
        await Document.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
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
