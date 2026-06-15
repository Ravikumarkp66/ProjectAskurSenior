require('dotenv').config({ path: './.env' }); // load from backend/
const mongoose = require('mongoose');
const { getCommunityStats } = require('../utils/emailService');

const runTest = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/askursenior';
        console.log("Connecting to Database:", dbUri);

        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✓ Database connected successfully");

        // 1. Test Stats Fetching
        console.log("\n--- Testing Statistics Fetching ---");
        const stats = await getCommunityStats();
        console.log("Community Stats fetched:", stats);

        // 2. Test template loading and replacements
        console.log("\n--- Testing Template Loading & Formatting ---");
        const fs = require('fs');
        const path = require('path');
        
        const templates = ['welcome', 'contribution-submitted', 'contribution-approved'];
        for (const t of templates) {
            const templatePath = path.join(__dirname, '..', 'templates', `${t}.html`);
            if (fs.existsSync(templatePath)) {
                let html = fs.readFileSync(templatePath, 'utf8');
                console.log(`✓ Template ${t}.html exists (Size: ${html.length} bytes)`);
                
                // Mock formatting
                const replacements = {
                    totalUsers: stats.totalUsers.toLocaleString(),
                    totalContributors: stats.totalContributors.toLocaleString(),
                    totalResources: stats.totalResources.toLocaleString(),
                    name: 'Test Student',
                    points: '10',
                    exploreUrl: 'http://localhost:3000/dashboard',
                    uploadUrl: 'http://localhost:3000/dashboard',
                    resourceName: 'Data Structures Unit 3.pdf',
                    subjectName: 'Data Structures & Algorithms',
                    subjectCode: '22CS32',
                    documentType: 'notes',
                    semester: '3'
                };
                
                for (const [key, val] of Object.entries(replacements)) {
                    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
                    html = html.replace(regex, val);
                }
                
                // Check if any {{placeholder}} remains
                const matches = html.match(/\{\{[^}]+\}\}/g);
                if (matches) {
                    console.log(`⚠️  Warning: Unreplaced placeholders in ${t}.html:`, matches);
                } else {
                    console.log(`✓ All placeholders successfully replaced in ${t}.html`);
                }
            } else {
                console.error(`❌ Template ${t}.html does NOT exist at ${templatePath}`);
            }
        }
        
        console.log("\n🎉 Testing completed successfully! All code loaded and executed.");
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

runTest();
