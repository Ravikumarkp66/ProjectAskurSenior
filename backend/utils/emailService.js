const fs = require('fs');
const path = require('path');
const sendEmail = require('./sendEmail');
const User = require('../models/User');
const Document = require('../models/Document');
const Subject = require('../models/Subject');

/**
 * Get real-time community statistics for global stats block
 */
const getCommunityStats = async () => {
    try {
        const [totalUsers, totalContributors, documentFilesCount, subjectStats] = await Promise.all([
            User.countDocuments().lean(),
            User.countDocuments({ uploads: { $gt: 0 } }).lean(),
            Document.countDocuments({ isApproved: true, isDeleted: false }).lean(),
            Subject.aggregate([
                {
                    $project: {
                        totalFiles: {
                            $add: [
                                { $size: { $ifNull: ["$notes", []] } },
                                { $size: { $ifNull: ["$pyqs", []] } },
                                { $size: { $ifNull: ["$questionBanks", []] } },
                                { $size: { $ifNull: ["$syllabus", []] } },
                                { $size: { $ifNull: ["$resources", []] } }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: "$totalFiles" }
                    }
                }
            ]).exec()
        ]);

        const subjectFilesCount = subjectStats.length > 0 ? subjectStats[0].totalFiles : 0;
        const totalResources = subjectFilesCount + documentFilesCount;

        return {
            totalUsers: totalUsers || 0,
            totalContributors: totalContributors || 0,
            totalResources: totalResources || 0
        };
    } catch (error) {
        console.error("Error calculating email community stats:", error);
        // Resilient fallback
        return {
            totalUsers: 1200,
            totalContributors: 80,
            totalResources: 450
        };
    }
};

/**
 * Load HTML template, populate stats and custom variables
 */
const getTemplate = async (templateName, replacements = {}) => {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    let html = fs.readFileSync(templatePath, 'utf8');

    // Get and replace global community statistics
    const stats = await getCommunityStats();
    const allReplacements = {
        totalUsers: stats.totalUsers.toLocaleString(),
        totalContributors: stats.totalContributors.toLocaleString(),
        totalResources: stats.totalResources.toLocaleString(),
        ...replacements
    };

    // Apply all replacements
    for (const [key, val] of Object.entries(allReplacements)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        html = html.replace(regex, val);
    }

    return html;
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const exploreUrl = `${frontendUrl}/dashboard`;
        
        const html = await getTemplate('welcome', {
            name: name || 'Student',
            exploreUrl
        });

        await sendEmail({
            email,
            subject: "Welcome to AskUrSenior 🚀 Let's Build Something Bigger Together",
            html
        });
    } catch (error) {
        console.error(`Failed to send Welcome Email to ${email}:`, error);
    }
};

/**
 * Send Contribution Submitted Email
 */
const sendContributionSubmittedEmail = async (email, name, resourceDetails = {}) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const uploadUrl = `${frontendUrl}/dashboard`;
        
        const html = await getTemplate('contribution-submitted', {
            name: name || 'Contributor',
            uploadUrl,
            resourceName: resourceDetails.resourceName || 'Study Material',
            subjectName: resourceDetails.subjectName || 'All Subjects',
            subjectCode: resourceDetails.subjectCode || 'N/A',
            documentType: resourceDetails.documentType || 'Resource',
            semester: resourceDetails.semester || 'N/A'
        });

        await sendEmail({
            email,
            subject: "Thank You for Contributing ❤️",
            html
        });
    } catch (error) {
        console.error(`Failed to send Contribution Submitted Email to ${email}:`, error);
    }
};

/**
 * Send Contribution Approved Email
 */
const sendContributionApprovedEmail = async (email, name, points = 10, resourceDetails = {}) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const uploadUrl = `${frontendUrl}/dashboard`;

        const html = await getTemplate('contribution-approved', {
            name: name || 'Contributor',
            points: points.toString(),
            uploadUrl,
            resourceName: resourceDetails.resourceName || 'Study Material',
            subjectName: resourceDetails.subjectName || 'All Subjects',
            subjectCode: resourceDetails.subjectCode || 'N/A',
            documentType: resourceDetails.documentType || 'Resource',
            semester: resourceDetails.semester || 'N/A'
        });

        await sendEmail({
            email,
            subject: "Your Contribution Has Been Approved 🎉",
            html
        });
    } catch (error) {
        console.error(`Failed to send Contribution Approved Email to ${email}:`, error);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendContributionSubmittedEmail,
    sendContributionApprovedEmail,
    getCommunityStats
};
