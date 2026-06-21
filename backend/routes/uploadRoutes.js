const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const AdmZip = require("adm-zip");
const { upload } = require("../utils/multer");
const { uploadToS3 } = require("../utils/uploadToS3");
const { deleteFromS3 } = require("../utils/deleteFromS3");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const Subject = require("../models/Subject");
const { createContentNotification } = require("../controllers/notificationController");
const cacheInvalidator = require("../utils/cacheInvalidator");

const router = express.Router();

const VALID_CONTENT_TYPES = ["notes", "pyqs", "questionBanks", "syllabus", "resources"];

const cleanFileTitle = (filename) => {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return withoutExt.replace(/_/g, " ").trim();
};

const isZipFile = (file) => {
  if (!file) return false;
  const name = String(file.originalname || "").toLowerCase();
  const type = String(file.mimetype || "").toLowerCase();
  return name.endsWith(".zip") || type === "application/zip" || type === "application/x-zip-compressed";
};

/**
 * POST /api/upload
 * Upload files to S3
 * Body: form-data with key "files"
 */
router.post("/", upload.array("files", 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploads = [];

    for (const file of req.files) {
      const s3Key = await uploadToS3(file, "notes");
      uploads.push({
        fileName: file.originalname,
        s3Key
      });
    }

    res.json({
      success: true,
      uploads
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * DELETE /api/upload/content/:subjectId/:contentType/:contentId
 * Admin deletes a subject-level content item
 */
router.delete(
  "/content/:subjectId/:contentType/:contentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { subjectId, contentType, contentId } = req.params;

      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const contentIndex = subject[contentType].findIndex(
        (c) => c._id.toString() === contentId
      );
      if (contentIndex === -1) {
        return res.status(404).json({ error: "Content not found" });
      }

      const fileKey = subject[contentType][contentIndex].fileKey;
      await deleteFromS3(fileKey);

      subject[contentType].splice(contentIndex, 1);
      await subject.save();

      // Invalidate Cache
      cacheInvalidator.emit('NOTE_DELETED', { subjectId });

      res.json({ success: true, message: "Content deleted successfully" });
    } catch (err) {
      console.error("Error deleting content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * DELETE /api/upload/module-content/:subjectId/:moduleNumber/:contentType/:contentId
 * Admin deletes a module-level content item (legacy)
 */
router.delete(
  "/module-content/:subjectId/:moduleNumber/:contentType/:contentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { subjectId, moduleNumber, contentType, contentId } = req.params;

      if (!["notes", "pyqs", "questionBanks"].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const moduleIndex = subject.modules.findIndex(
        (m) => m.moduleNumber === parseInt(moduleNumber)
      );
      if (moduleIndex === -1) {
        return res.status(404).json({ error: "Module not found" });
      }

      const contentIndex = subject.modules[moduleIndex][contentType].findIndex(
        (c) => c._id.toString() === contentId
      );
      if (contentIndex === -1) {
        return res.status(404).json({ error: "Content not found" });
      }

      const fileKey = subject.modules[moduleIndex][contentType][contentIndex].fileKey;
      await deleteFromS3(fileKey);

      subject.modules[moduleIndex][contentType].splice(contentIndex, 1);
      await subject.save();

      res.json({ success: true, message: "Content deleted successfully" });
    } catch (err) {
      console.error("Error deleting module content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * POST /api/upload/bulk/content/:subjectCode/:contentType
 * Admin uploads subject-level content to ALL subjects with the same code
 * Body: form-data with key "files"
 */
router.post(
  "/bulk/content/:subjectCode/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.fields([{ name: 'files', maxCount: 100 }, { name: 'thumbnails', maxCount: 100 }]),
  async (req, res) => {
    try {
      const { subjectCode, contentType } = req.params;

      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      if (!req.files || !req.files.files || req.files.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      const uploads = [];

      for (let i = 0; i < req.files.files.length; i++) {
        const file = req.files.files[i];
        const thumbnailFile = req.files.thumbnails && req.files.thumbnails[i] && req.files.thumbnails[i].size > 0 ? req.files.thumbnails[i] : null;
        const pageCount = req.body.pageCounts && req.body.pageCounts[i] ? parseInt(req.body.pageCounts[i]) : null;

        const folder = `${contentType}/shared/${subjectCode.toUpperCase()}`;
        const s3Key = await uploadToS3(file, folder);
        
        let thumbnailKey = null;
        let thumbnailUrl = null;
        if (thumbnailFile) {
            thumbnailKey = await uploadToS3(thumbnailFile, folder + '/thumbnails');
            thumbnailUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${thumbnailKey}`;
        }

        const title = cleanFileTitle(file.originalname);

        const contentItem = {
          title,
          description: "",
          fileKey: s3Key,
          fileType: file.mimetype.includes("pdf") ? "pdf" : "other",
          thumbnailKey,
          thumbnailUrl,
          thumbnailGenerated: !!thumbnailKey,
          pageCount,
          uploadedBy: req.userId,
          uploadedAt: new Date(),
          tags: [subjectCode.toUpperCase(), contentType],
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
        uploads.push(contentItem);

        await createContentNotification({
          contentType,
          contentTitle: title,
          subjectId: subjects[0]._id,
          subjectName: subjects[0].name,
          subjectCode: subjectCode.toUpperCase(),
          branch: "ALL",
          cycle: "ALL",
          createdBy: req.userId
        });
      }

      res.json({
        success: true,
        message: `${contentType} uploaded to ${subjects.length} subjects successfully`,
        uploads,
        affectedSubjects: subjects.map((s) => ({ id: s._id, branch: s.branch, cycle: s.cycle }))
      });

      // Invalidate Cache for affected subjects
      subjects.forEach(subject => {
        cacheInvalidator.emit('NOTE_UPLOADED', { subjectId: subject._id });
      });
    } catch (err) {
      console.error("Error uploading bulk content:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

/**
 * DELETE /api/upload/bulk/content/:subjectCode/:contentType/:title
 * Admin deletes subject-level content from ALL subjects with the same code by matching title
 */
router.delete(
  "/bulk/content/:subjectCode/:contentType/:title",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { subjectCode, contentType, title } = req.params;

      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      const decodedTitle = decodeURIComponent(title);
      const firstMatch = subjects.reduce((match, subject) => {
        if (match) return match;
        return subject[contentType].find((item) => item.title === decodedTitle);
      }, null);

      if (!firstMatch) {
        return res.status(404).json({ error: "Content not found" });
      }

      await deleteFromS3(firstMatch.fileKey);

      let deletedCount = 0;

      const updatePromises = subjects.map(async (subject) => {
        const contentIndex = subject[contentType].findIndex(
          (c) => c.title === decodedTitle
        );
        if (contentIndex !== -1) {
          subject[contentType].splice(contentIndex, 1);
          deletedCount++;
          return subject.save();
        }
      });
      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: `Content deleted from ${deletedCount} subjects successfully`
      });

      // Invalidate Cache for affected subjects
      subjects.forEach(subject => {
        cacheInvalidator.emit('NOTE_DELETED', { subjectId: subject._id });
      });
    } catch (err) {
      console.error("Error deleting bulk content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * POST /api/upload/zip/:subjectId
 * Admin uploads a ZIP file and maps content folders to subject content
 * Body: form-data with key "file"
 */
router.post(
  "/zip/:subjectId",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    let tempRoot = "";
    try {
      const { subjectId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No ZIP file uploaded" });
      }

      if (!isZipFile(req.file)) {
        return res.status(400).json({ error: "Only ZIP files are supported" });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "askursenior-zip-"));
      const zip = new AdmZip(req.file.path);
      const entries = zip.getEntries();
      const uploads = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }

        const normalizedEntry = entry.entryName.replace(/\\/g, "/");
        const parts = normalizedEntry.split("/").filter(Boolean);
        if (parts.length < 2) {
          continue;
        }

        const folderName = parts[0];
        if (!VALID_CONTENT_TYPES.includes(folderName)) {
          continue;
        }

        const fileName = parts[parts.length - 1];
        if (!fileName.toLowerCase().endsWith(".pdf")) {
          continue;
        }

        const safeFileName = path.basename(fileName);
        const localDir = path.join(tempRoot, folderName);
        await fs.promises.mkdir(localDir, { recursive: true });
        const localPath = path.join(localDir, safeFileName);

        const fileBuffer = entry.getData();
        await fs.promises.writeFile(localPath, fileBuffer);

        const fileForUpload = {
          path: localPath,
          originalname: safeFileName,
          mimetype: "application/pdf"
        };

        const folder = `${folderName}/${subject.branch}/${subject.code}`;
        const s3Key = await uploadToS3(fileForUpload, folder);
        const title = cleanFileTitle(safeFileName);

        const contentItem = {
          title,
          description: "",
          fileKey: s3Key,
          fileType: "pdf",
          uploadedBy: req.userId,
          uploadedAt: new Date(),
          tags: [subject.code, folderName],
          status: "approved"
        };

        if (!subject[folderName]) {
          subject[folderName] = [];
        }

        subject[folderName].push(contentItem);
        uploads.push({ ...contentItem, contentType: folderName });
      }

      if (uploads.length === 0) {
        return res.status(400).json({ error: "No valid PDF files found in ZIP" });
      }

      await subject.save();

      for (const item of uploads) {
        await createContentNotification({
          contentType: item.contentType,
          contentTitle: item.title,
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code,
          branch: subject.branch,
          cycle: subject.cycle,
          createdBy: req.userId
        });
      }

      res.json({
        success: true,
        message: "ZIP processed successfully",
        uploads,
        subject: subject.name
      });

      // Invalidate Cache
      cacheInvalidator.emit('NOTE_UPLOADED', { subjectId });
    } catch (err) {
      console.error("Error processing ZIP upload:", err.message, err.stack);
      res.status(500).json({ error: err.message || "ZIP upload failed" });
    } finally {
      if (tempRoot) {
        try {
          await fs.promises.rm(tempRoot, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp ZIP directory:", cleanupError.message);
        }
      }

      if (req.file?.path) {
        try {
          await fs.promises.access(req.file.path);
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          // File already removed or inaccessible
        }
      }
    }
  }
);

/**
 * POST /api/upload/:subjectId/:contentType
 * Admin uploads content at subject level
 * Body: form-data with key "files"
 */
router.post(
  "/:subjectId/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.fields([{ name: 'files', maxCount: 100 }, { name: 'thumbnails', maxCount: 100 }]),
  async (req, res) => {
    try {
      const { subjectId, contentType } = req.params;

      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      if (!req.files || !req.files.files || req.files.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      if (!subject[contentType]) {
        subject[contentType] = [];
      }

      const uploads = [];

      for (let i = 0; i < req.files.files.length; i++) {
        const file = req.files.files[i];
        const thumbnailFile = req.files.thumbnails && req.files.thumbnails[i] && req.files.thumbnails[i].size > 0 ? req.files.thumbnails[i] : null;
        const pageCount = req.body.pageCounts && req.body.pageCounts[i] ? parseInt(req.body.pageCounts[i]) : null;

        const folder = `${contentType}/${subject.branch}/${subject.code}`;
        const s3Key = await uploadToS3(file, folder);

        let thumbnailKey = null;
        let thumbnailUrl = null;
        if (thumbnailFile) {
            thumbnailKey = await uploadToS3(thumbnailFile, folder + '/thumbnails');
            thumbnailUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${thumbnailKey}`;
        }

        const title = cleanFileTitle(file.originalname);

        const contentItem = {
          title,
          description: "",
          fileKey: s3Key,
          fileType: file.mimetype.includes("pdf") ? "pdf" : "other",
          thumbnailKey,
          thumbnailUrl,
          thumbnailGenerated: !!thumbnailKey,
          pageCount,
          uploadedBy: req.userId,
          uploadedAt: new Date(),
          tags: [subject.code, contentType],
          status: "approved"
        };

        subject[contentType].push(contentItem);
        uploads.push(contentItem);
      }

      await subject.save();

      for (const item of uploads) {
        await createContentNotification({
          contentType,
          contentTitle: item.title,
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code,
          branch: subject.branch,
          cycle: subject.cycle,
          createdBy: req.userId
        });
      }

      res.json({
        success: true,
        message: `${contentType} uploaded successfully`,
        uploads,
        subject: subject.name
      });

      // Invalidate Cache
      cacheInvalidator.emit('NOTE_UPLOADED', { subjectId });
    } catch (err) {
      console.error("Error uploading content:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

module.exports = router;
