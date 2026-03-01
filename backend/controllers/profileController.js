const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { s3, getPresignedUrl } = require('../utils/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// Configure Multer for S3 Storage
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profiles/' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Same as before)
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Update Profile (Bio, Social Links)
const updateProfile = async (req, res) => {
    try {
        const { bio, socialLinks, usn } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields if provided
        if (bio !== undefined) user.bio = bio;

        if (usn !== undefined && usn.toUpperCase() !== user.usn) {
            // Check if new USN is already taken
            const existingUser = await User.findOne({ usn: usn.toUpperCase() });
            if (existingUser) {
                return res.status(400).json({ error: 'This USN is already registered by another user' });
            }
            user.usn = usn.toUpperCase();
        }

        if (socialLinks) {
            user.socialLinks = {
                ...user.socialLinks,
                ...socialLinks
            };
        }

        await user.save();

        // Generate signed URL for profile picture
        const signedProfilePicture = user.profilePicture ? await getPresignedUrl(user.profilePicture) : '';

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: signedProfilePicture || user.profilePicture, // Return signed URL
                bio: user.bio,
                socialLinks: user.socialLinks
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upload Profile Picture
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Optional: Delete old profile picture from S3 if it exists and is an S3 URL
        // Check if old PP contains the bucket name
        if (user.profilePicture && user.profilePicture.includes(process.env.AWS_BUCKET_NAME)) {
            try {
                // Extract key from URL
                // URL format: https://bucket-name.s3.region.amazonaws.com/profiles/filename.jpg
                const urlParts = user.profilePicture.split('/');
                const filename = urlParts[urlParts.length - 1];
                const key = 'profiles/' + filename;

                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key
                }));
            } catch (err) {
                console.error('Failed to delete old image from S3', err);
                // Continue even if delete fails
            }
        }

        // Save new S3 URL
        // req.file.location is the S3 URL provided by multer-s3
        user.profilePicture = req.file.location;

        await user.save();

        // Generate signed URL for immediate display
        const signedUrl = await getPresignedUrl(user.profilePicture);

        res.json({
            message: 'Profile picture uploaded successfully',
            profilePicture: signedUrl || user.profilePicture
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Please provide both current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Update password (hashing handled by User model pre-save hook)
        user.password = newPassword;

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

module.exports = {
    updateProfile,
    uploadProfilePicture,
    changePassword,
    upload
};
