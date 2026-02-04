const { S3Client } = require("@aws-sdk/client-s3");

// Ensure AWS region is available, fallback to ap-south-1 if not set
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS credentials are missing! Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set");
}

console.log(`Initializing S3 client with region: ${AWS_REGION}`);

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

module.exports = { s3 };
