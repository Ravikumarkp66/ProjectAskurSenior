const mongoose = require('mongoose');
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const updateFileSize = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Document = mongoose.connection.db.collection('documents');
        const docs = await Document.find({ fileSize: 0 }).toArray();
        console.log(`Found ${docs.length} documents with 0 fileSize`);

        for (const doc of docs) {
            try {
                const command = new HeadObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: doc.fileName
                });
                const metadata = await s3.send(command);
                const size = metadata.ContentLength;

                await Document.updateOne(
                    { _id: doc._id },
                    { $set: { fileSize: size } }
                );
                console.log(`Updated ${doc.originalName}: ${size} bytes`);
            } catch (s3Error) {
                console.error(`Error fetching size for ${doc.fileName}:`, s3Error.message);
            }
        }

        console.log('Update complete');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
};

updateFileSize();
