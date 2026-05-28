require('dotenv').config({ path: '../backend/.env' });
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../backend/utils/s3Client');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function testS3() {
    try {
        console.log("Checking bucket: ", process.env.AWS_BUCKET_NAME || 'askursenior-notes-storage');
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME || 'askursenior-notes-storage',
            Key: 'test-file-that-does-not-exist.pdf'
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        console.log("Signed URL generated:", url);
        
        // Let's try to actually fetch it using axios
        const axios = require('axios');
        try {
            const response = await axios.get(url);
            console.log("Response status:", response.status);
        } catch (error) {
            console.log("Axios error status:", error.response?.status);
            console.log("Axios error data:", error.response?.data);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testS3();
