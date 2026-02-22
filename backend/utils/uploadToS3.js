const fs = require("fs");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("./s3Client");

/**
 * Upload a file to S3
 * @param {Object} file - The file object from multer
 * @param {string} folder - The folder path in S3 bucket (default: "notes")
 * @returns {Promise<string>} - The S3 key of the uploaded file
 */
const uploadToS3 = async (file, folder = "notes") => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'askursenior-notes-storage',
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype
    });

    await s3.send(command);
    console.log(`Successfully uploaded file to S3: ${key}`);

    // Cleanup local file after successful upload
    try {
      await fs.promises.access(file.path);
      await fs.promises.unlink(file.path);
    } catch {
      // File already removed or inaccessible
    }

    return key; // Return only the S3 key
  } catch (error) {
    // Cleanup local file even if upload fails
    try {
      await fs.promises.access(file.path);
      await fs.promises.unlink(file.path);
    } catch {
      // File already removed or inaccessible
    }

    console.error("Error uploading to S3:", error.message);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

module.exports = { uploadToS3 };
