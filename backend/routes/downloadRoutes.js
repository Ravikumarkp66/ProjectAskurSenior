const express = require("express");
const { generateSignedUrl } = require("../utils/getSignedUrl");

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

    const signedUrl = await generateSignedUrl(key);

    // Redirect user directly to S3 for automatic download
    res.redirect(signedUrl);
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
