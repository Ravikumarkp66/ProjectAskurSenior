const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("./s3Client");

/**
 * Generate a signed URL for downloading a file from S3
 * @param {string} key - The path/key of the file in the S3 bucket
 * @returns {Promise<string>} - The signed URL (expires in 5 minutes)
 */
const generateSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 5 // 5 minutes
  });

  return url;
};

module.exports = { generateSignedUrl };
