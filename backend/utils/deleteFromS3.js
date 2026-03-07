const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("./s3Client");

/**
 * Deletes a file from AWS S3
 * @param {string} fileKey - The S3 object key to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (fileKey) => {
    if (!fileKey) return;

    try {
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey
        };

        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);
        console.log(`Successfully deleted ${fileKey} from S3`);
    } catch (error) {
        console.error(`S3 Deletion Error for ${fileKey}:`, error);
        // We don't throw here to allow DB cleanup even if S3 fails, 
        // but we log it.
    }
};

module.exports = deleteFromS3;
