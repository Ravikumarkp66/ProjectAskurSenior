require('dotenv').config({ path: __dirname + '/../.env' });
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const corsConfig = {
    CORSConfiguration: {
        CORSRules: [
            {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3000
            }
        ]
    }
};

const run = async () => {
    try {
        const command = new PutBucketCorsCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            CORSConfiguration: corsConfig.CORSConfiguration
        });
        const response = await s3.send(command);
        console.log('Successfully updated CORS configuration. Bucket is now ready for direct uploads.');
    } catch (err) {
        console.error('Error updating CORS:', err);
    }
};

run();
