const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});


/**
 * Generates a presigned URL for an S3 object URL or Key
 * @param {string} urlOrKey - The full S3 URL or the Object Key
 * @returns {Promise<string>} - The presigned URL
 */
const getPresignedUrl = async (urlOrKey) => {
    if (!urlOrKey) return '';

    // If it's already a presigned URL (has query params like 'X-Amz-Signature'), return it
    if (urlOrKey.includes('X-Amz-Signature')) return urlOrKey;

    let key = urlOrKey;

    // If it's a full S3 URL, extract the key
    // Format: https://bucket.s3.region.amazonaws.com/key
    // OR: https://s3.region.amazonaws.com/bucket/key
    if (urlOrKey.startsWith('http')) {
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (urlOrKey.includes(bucketName)) {
            // Simple extraction strategy: part after bucket name
            // This assumes standard S3 URL formats
            try {
                const urlObj = new URL(urlOrKey);
                // pathname is like /key or /bucket/key
                // If path starts with /, remove it
                let path = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

                // If path includes bucket name at start (path style), remove it
                // But multer-s3 usually returns virtual-hosted style: https://bucket.s3.../key
                key = path;
            } catch (e) {
                console.warn('Failed to parse URL for signing:', urlOrKey);
                return urlOrKey; // Fallback
            }
        }
    }

    try {
        // Construct the permanent CloudFront URL
        return `https://d2mh2rnmjqdkgx.cloudfront.net/${key}`;
    } catch (error) {
        console.error('Error generating CloudFront URL:', error);
        return urlOrKey; // Fallback to original
    }
};

module.exports = { s3, getPresignedUrl };
