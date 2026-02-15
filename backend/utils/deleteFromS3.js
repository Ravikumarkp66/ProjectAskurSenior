const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("./s3Client");

const deleteFromS3 = async (key) => {
  if (!key) {
    throw new Error("S3 delete failed: missing key");
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  });

  await s3.send(command);
};

module.exports = { deleteFromS3 };
