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

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype
  });

  await s3.send(command);

  // Cleanup local file after upload
  fs.unlinkSync(file.path);

  return key; // Return only the S3 key
};

module.exports = { uploadToS3 };
