const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("./s3Client");

/**
 * Generate a permanent CloudFront URL for a file
 * @param {string} key - The path/key of the file
 * @returns {Promise<string>} - The CloudFront URL
 */
const generateSignedUrl = async (key) => {
  // Construct the CloudFront URL
  const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${key}`;
  return fileUrl;
};

module.exports = { generateSignedUrl };
