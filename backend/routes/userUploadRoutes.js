const express = require("express");
const { upload } = require("../utils/multer");
const { uploadToS3 } = require("../utils/uploadToS3");
const { deleteFromS3 } = require("../utils/deleteFromS3");
const { generateSignedUrl } = require("../utils/getSignedUrl");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const UserUpload = require("../models/UserUpload");
const Subject = require("../models/Subject");
const { createContentNotification } = require("../controllers/notificationController");
const cacheInvalidator = require("../utils/cacheInvalidator");

const router = express.Router();

const USER_CONTENT_TYPES = ["notes", "pyqs", "questionBanks", "syllabus", "resources"];

const cleanFileTitle = (filename) => {
    const withoutExt = filename.replace(/\.[^/.]+$/, "");
    return withoutExt.replace(/_/g, " ").trim();
};

router.post(
    "/",
    authMiddleware,
    upload.array("files", 100),
    async (req, res) => {
        try {
            const { contentType, subjectCode } = req.body;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "No files uploaded" });
            }

            if (!subjectCode || !contentType) {
                return res.status(400).json({ error: "Subject code and content type are required" });
            }

            if (!USER_CONTENT_TYPES.includes(contentType)) {
                return res.status(400).json({ error: "Invalid content type" });
            }

            const normalizedSubjectCode = subjectCode.toUpperCase();
            const uploadFolder = `user-uploads/pending/${normalizedSubjectCode}/${contentType}`;

            const createdItems = [];

            for (const file of req.files) {
                const s3Key = await uploadToS3(file, uploadFolder);
                const title = cleanFileTitle(file.originalname);

                const userUpload = await UserUpload.create({
                    title,
                    description: "",
                    subjectCode: normalizedSubjectCode,
                    contentType,
                    fileKey: s3Key,
                    fileType: file.mimetype.includes("pdf") ? "pdf" : "other",
                    tags: [normalizedSubjectCode, contentType],
                    originalFileName: file.originalname,
                    uploadedBy: req.userId,
                    status: "pending",
                    uploadedAt: new Date()
                });

                createdItems.push(userUpload);
            }

            res.json({
                success: true,
                message: "Upload submitted for admin review",
                items: createdItems
            });
        } catch (err) {
            console.error("Error creating user upload:", err.message);
            res.status(500).json({ error: err.message || "Upload failed" });
        }
    }
);

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const status = req.query.status || "pending";
        const items = await UserUpload.find({ status })
            .sort({ createdAt: -1 })
            .populate("uploadedBy", "name usn email");

        res.json({ items });
    } catch (err) {
        console.error("Error loading user uploads:", err.message);
        res.status(500).json({ error: "Failed to load user uploads" });
    }
});

router.get("/:uploadId/url", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const uploadItem = await UserUpload.findById(req.params.uploadId);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found" });
        }

        const url = await generateSignedUrl(uploadItem.fileKey);
        res.json({ url });
    } catch (err) {
        console.error("Error generating upload preview URL:", err.message);
        res.status(500).json({ error: "Failed to generate preview URL" });
    }
});

router.post("/:uploadId/approve", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const uploadItem = await UserUpload.findById(req.params.uploadId);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found" });
        }

        if (uploadItem.status !== "pending") {
            return res.status(400).json({ error: "Upload already processed" });
        }

        const contentType = uploadItem.contentType;
        const subjects = await Subject.find({ code: uploadItem.subjectCode });

        if (subjects.length === 0) {
            return res.status(404).json({ error: "No subjects found with this code" });
        }

        const contentItem = {
            title: uploadItem.title,
            description: uploadItem.description || "",
            fileKey: uploadItem.fileKey,
            fileType: uploadItem.fileType,
            uploadedBy: uploadItem.uploadedBy,
            uploadedAt: new Date(),
            tags: uploadItem.tags || [uploadItem.subjectCode, contentType],
            status: "approved"
        };

        const updatePromises = subjects.map((subject) => {
            if (!subject[contentType]) {
                subject[contentType] = [];
            }
            subject[contentType].push({ ...contentItem });
            return subject.save();
        });
        await Promise.all(updatePromises);

        uploadItem.status = "approved";
        uploadItem.approvedBy = req.userId;
        uploadItem.approvedAt = new Date();
        await uploadItem.save();

        await createContentNotification({
            contentType,
            contentTitle: uploadItem.title,
            subjectId: subjects[0]._id,
            subjectName: subjects[0].name,
            subjectCode: uploadItem.subjectCode,
            branch: "ALL",
            cycle: "ALL",
            createdBy: req.userId
        });

        res.json({
            success: true,
            message: "Upload approved and added to study materials"
        });

        // Invalidate Cache
        if (subjects.length > 0) {
            cacheInvalidator.emit('USER_UPLOAD_APPROVED', { subjectId: subjects[0]._id });
        }
    } catch (err) {
        console.error("Error approving user upload:", err.message);
        res.status(500).json({ error: err.message || "Approval failed" });
    }
});

router.delete("/:uploadId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const uploadItem = await UserUpload.findById(req.params.uploadId);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found" });
        }

        await deleteFromS3(uploadItem.fileKey);
        await uploadItem.deleteOne();

        res.json({ success: true, message: "Upload deleted" });
    } catch (err) {
        console.error("Error deleting user upload:", err.message);
        res.status(500).json({ error: err.message || "Delete failed" });
    }
});

module.exports = router;
