const express = require("express");
const router = express.Router();

/**
 * GET /api/download
 * Generate a signed URL for downloading a file from S3
 * Query params:
 *   - key: The path/key of the file in the S3 bucket (e.g., "Projectresume.pdf" or "notes/cse/sem5/dbms/unit1.pdf")
 */
router.get("/", async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: "File key required" });
    }

    const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${key}`;
    res.redirect(fileUrl);
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
