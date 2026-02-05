const express = require("express");
const { upload } = require("../utils/multer");
const { uploadToS3 } = require("../utils/uploadToS3");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const Subject = require("../models/Subject");
const { createContentNotification } = require("../controllers/notificationController");

const router = express.Router();

// Valid content types for upload
const VALID_CONTENT_TYPES = ['notes', 'pyqs', 'questionBanks', 'syllabus', 'resources'];

/**
 * POST /api/upload
 * Upload a file to S3
 * Body: form-data with key "file"
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const s3Key = await uploadToS3(req.file, "notes");

    res.json({
      success: true,
      s3Key
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * POST /api/upload/notes/:subjectId/:moduleNumber
 * Admin uploads notes PDF for a specific module (legacy route - backward compatible)
 * Body: form-data with key "file"
 */
router.post(
  "/notes/:subjectId/:moduleNumber",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectId, moduleNumber } = req.params;
      console.log("Upload request received:", { subjectId, moduleNumber, file: req.file?.originalname });

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Find the subject
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        console.log("Subject not found:", subjectId);
        return res.status(404).json({ error: "Subject not found" });
      }

      // Find the module
      const module = subject.modules.find(
        (m) => m.moduleNumber === parseInt(moduleNumber)
      );
      if (!module) {
        console.log("Module not found:", moduleNumber);
        return res.status(404).json({ error: "Module not found" });
      }

      // Upload to S3 with organized folder structure
      const folder = `notes/${subject.branch}/${subject.code}/module${moduleNumber}`;
      console.log("Uploading to S3 folder:", folder);
      const s3Key = await uploadToS3(req.file, folder);
      console.log("Upload successful, S3 key:", s3Key);

      // Save S3 key to the module using updateOne for subdocument
      const result = await Subject.updateOne(
        { _id: subjectId, "modules.moduleNumber": parseInt(moduleNumber) },
        { $set: { "modules.$.notesKey": s3Key } }
      );
      console.log("MongoDB update result:", JSON.stringify(result));

      // Invalidate cache so fresh data is fetched
      
      

      res.json({
        success: true,
        message: "Notes uploaded successfully",
        s3Key,
        subject: subject.name,
        module: module.title
      });
    } catch (err) {
      console.error("Error uploading notes:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

/**
 * POST /api/upload/content/:subjectId/:contentType
 * Admin uploads content (syllabus, resources) at subject level
 * Body: form-data with key "file", "title" (required), "description" (optional)
 */
router.post(
  "/content/:subjectId/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectId, contentType } = req.params;
      const { title, description } = req.body;

      // Validate content type (only subject-level content types)
      if (!['syllabus', 'resources'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type. Use 'syllabus' or 'resources'" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      // Upload to S3
      const folder = `${contentType}/${subject.branch}/${subject.code}`;
      const s3Key = await uploadToS3(req.file, folder);

      // Create content item
      const contentItem = {
        title,
        description: description || '',
        fileKey: s3Key,
        fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'other',
        uploadedBy: req.userId
      };

      // Add to subject's content array
      subject[contentType].push(contentItem);
      await subject.save();

      // Invalidate cache
      
      

      // Create notification for this upload
      await createContentNotification({
        contentType,
        contentTitle: title,
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        branch: subject.branch,
        cycle: subject.cycle,
        createdBy: req.userId
      });

      res.json({
        success: true,
        message: `${contentType} uploaded successfully`,
        contentItem,
        subject: subject.name
      });
    } catch (err) {
      console.error("Error uploading content:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

/**
 * POST /api/upload/module-content/:subjectId/:moduleNumber/:contentType
 * Admin uploads content (notes, pyqs, questionBanks) for a specific module
 * Body: form-data with key "file", "title" (required), "description" (optional)
 */
router.post(
  "/module-content/:subjectId/:moduleNumber/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectId, moduleNumber, contentType } = req.params;
      const { title, description } = req.body;

      // Validate content type (only module-level content types)
      if (!['notes', 'pyqs', 'questionBanks'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type. Use 'notes', 'pyqs', or 'questionBanks'" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
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

      // Upload to S3
      const folder = `${contentType}/${subject.branch}/${subject.code}/module${moduleNumber}`;
      const s3Key = await uploadToS3(req.file, folder);

      // Create content item
      const contentItem = {
        title,
        description: description || '',
        fileKey: s3Key,
        fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'other',
        uploadedBy: req.userId
      };

      // Add to module's content array
      subject.modules[moduleIndex][contentType].push(contentItem);
      await subject.save();

      // Invalidate cache
      
      

      // Create notification for this upload
      await createContentNotification({
        contentType,
        contentTitle: title,
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        moduleNumber: parseInt(moduleNumber),
        moduleName: subject.modules[moduleIndex].title,
        branch: subject.branch,
        cycle: subject.cycle,
        createdBy: req.userId
      });

      res.json({
        success: true,
        message: `${contentType} uploaded successfully`,
        contentItem,
        subject: subject.name,
        module: subject.modules[moduleIndex].title
      });
    } catch (err) {
      console.error("Error uploading module content:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

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

      if (!['syllabus', 'resources'].includes(contentType)) {
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

      subject[contentType].splice(contentIndex, 1);
      await subject.save();

      // Invalidate cache
      
      

      res.json({ success: true, message: "Content deleted successfully" });
    } catch (err) {
      console.error("Error deleting content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * DELETE /api/upload/module-content/:subjectId/:moduleNumber/:contentType/:contentId
 * Admin deletes a module-level content item
 */
router.delete(
  "/module-content/:subjectId/:moduleNumber/:contentType/:contentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { subjectId, moduleNumber, contentType, contentId } = req.params;

      if (!['notes', 'pyqs', 'questionBanks'].includes(contentType)) {
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

      subject.modules[moduleIndex][contentType].splice(contentIndex, 1);
      await subject.save();

      // Invalidate cache
      
      

      res.json({ success: true, message: "Content deleted successfully" });
    } catch (err) {
      console.error("Error deleting module content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * POST /api/upload/bulk/content/:subjectCode/:contentType
 * Admin uploads subject-level content (syllabus, resources) to ALL subjects with the same code
 * This enables content sharing across all branches/cycles
 * Body: form-data with key "file", "title" (required), "description" (optional)
 */
router.post(
  "/bulk/content/:subjectCode/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectCode, contentType } = req.params;
      const { title, description } = req.body;

      // Validate content type (only subject-level content types)
      if (!['syllabus', 'resources'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type. Use 'syllabus' or 'resources'" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Find ALL subjects with this code
      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      // Upload to S3 once (shared across all)
      const folder = `${contentType}/shared/${subjectCode.toUpperCase()}`;
      const s3Key = await uploadToS3(req.file, folder);

      // Create content item
      const contentItem = {
        title,
        description: description || '',
        fileKey: s3Key,
        fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'other',
        uploadedBy: req.userId
      };

      // Add to ALL subjects with this code
      const updatePromises = subjects.map(subject => {
        subject[contentType].push({ ...contentItem });
        return subject.save();
      });
      await Promise.all(updatePromises);

      // Create notification (one notification for all branches)
      await createContentNotification({
        contentType,
        contentTitle: title,
        subjectId: subjects[0]._id,
        subjectName: subjects[0].name,
        subjectCode: subjectCode.toUpperCase(),
        branch: 'ALL', // Indicates all branches
        cycle: 'ALL',
        createdBy: req.userId
      });

      res.json({
        success: true,
        message: `${contentType} uploaded to ${subjects.length} subjects successfully`,
        contentItem,
        affectedSubjects: subjects.map(s => ({ id: s._id, branch: s.branch, cycle: s.cycle }))
      });
    } catch (err) {
      console.error("Error uploading bulk content:", err.message, err.stack);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  }
);

/**
 * POST /api/upload/bulk/module-content/:subjectCode/:moduleNumber/:contentType
 * Admin uploads module-level content (notes, pyqs, questionBanks) to ALL subjects with the same code
 * Body: form-data with key "file", "title" (required), "description" (optional)
 */
router.post(
  "/bulk/module-content/:subjectCode/:moduleNumber/:contentType",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { subjectCode, moduleNumber, contentType } = req.params;
      const { title, description } = req.body;

      // Validate content type (only module-level content types)
      if (!['notes', 'pyqs', 'questionBanks'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type. Use 'notes', 'pyqs', or 'questionBanks'" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Find ALL subjects with this code
      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      // Verify module exists in at least one subject
      const moduleExists = subjects.some(s => 
        s.modules.some(m => m.moduleNumber === parseInt(moduleNumber))
      );
      if (!moduleExists) {
        return res.status(404).json({ error: "Module not found in any subject with this code" });
      }

      // Upload to S3 once (shared across all)
      const folder = `${contentType}/shared/${subjectCode.toUpperCase()}/module${moduleNumber}`;
      const s3Key = await uploadToS3(req.file, folder);

      // Create content item
      const contentItem = {
        title,
        description: description || '',
        fileKey: s3Key,
        fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'other',
        uploadedBy: req.userId
      };

      let moduleName = '';
      let updatedCount = 0;

      // Add to ALL subjects with this code that have this module
      const updatePromises = subjects.map(async (subject) => {
        const moduleIndex = subject.modules.findIndex(
          (m) => m.moduleNumber === parseInt(moduleNumber)
        );
        if (moduleIndex !== -1) {
          subject.modules[moduleIndex][contentType].push({ ...contentItem });
          if (!moduleName) {
            moduleName = subject.modules[moduleIndex].title;
          }
          updatedCount++;
          return subject.save();
        }
      });
      await Promise.all(updatePromises);

      // Create notification
      await createContentNotification({
        contentType,
        contentTitle: title,
        subjectId: subjects[0]._id,
        subjectName: subjects[0].name,
        subjectCode: subjectCode.toUpperCase(),
        moduleNumber: parseInt(moduleNumber),
        moduleName,
        branch: 'ALL',
        cycle: 'ALL',
        createdBy: req.userId
      });

      res.json({
        success: true,
        message: `${contentType} uploaded to ${updatedCount} subjects successfully`,
        contentItem,
        module: moduleName,
        affectedSubjects: subjects
          .filter(s => s.modules.some(m => m.moduleNumber === parseInt(moduleNumber)))
          .map(s => ({ id: s._id, branch: s.branch, cycle: s.cycle }))
      });
    } catch (err) {
      console.error("Error uploading bulk module content:", err.message, err.stack);
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

      if (!['syllabus', 'resources'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      // Find ALL subjects with this code
      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      let deletedCount = 0;

      // Remove content from all subjects
      const updatePromises = subjects.map(async (subject) => {
        const contentIndex = subject[contentType].findIndex(
          (c) => c.title === decodeURIComponent(title)
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
    } catch (err) {
      console.error("Error deleting bulk content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

/**
 * DELETE /api/upload/bulk/module-content/:subjectCode/:moduleNumber/:contentType/:title
 * Admin deletes module-level content from ALL subjects with the same code by matching title
 */
router.delete(
  "/bulk/module-content/:subjectCode/:moduleNumber/:contentType/:title",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { subjectCode, moduleNumber, contentType, title } = req.params;

      if (!['notes', 'pyqs', 'questionBanks'].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }

      // Find ALL subjects with this code
      const subjects = await Subject.find({ code: subjectCode.toUpperCase() });
      if (subjects.length === 0) {
        return res.status(404).json({ error: "No subjects found with this code" });
      }

      let deletedCount = 0;

      // Remove content from all subjects
      const updatePromises = subjects.map(async (subject) => {
        const moduleIndex = subject.modules.findIndex(
          (m) => m.moduleNumber === parseInt(moduleNumber)
        );
        if (moduleIndex !== -1) {
          const contentIndex = subject.modules[moduleIndex][contentType].findIndex(
            (c) => c.title === decodeURIComponent(title)
          );
          if (contentIndex !== -1) {
            subject.modules[moduleIndex][contentType].splice(contentIndex, 1);
            deletedCount++;
            return subject.save();
          }
        }
      });
      await Promise.all(updatePromises);

      res.json({ 
        success: true, 
        message: `Content deleted from ${deletedCount} subjects successfully` 
      });
    } catch (err) {
      console.error("Error deleting bulk module content:", err.message);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  }
);

module.exports = router;
