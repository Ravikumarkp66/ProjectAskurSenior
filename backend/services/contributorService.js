const Contributor = require('../models/Contributor');

const initialContributors = [
    {
        name: 'Ravikumar KP',
        usn: '1SI23IS001',
        branch: 'Information Science & Engineering',
        role: 'Founder & Developer',
        avatar: null,
        order: 1,
        isVisible: true
    },
    {
        name: 'Shubham Patil',
        usn: '1SI23CS001',
        branch: 'Computer Science & Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 2,
        isVisible: true
    },
    {
        name: 'Gajendra',
        usn: '1SI23ME001',
        branch: 'Mechanical Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 3,
        isVisible: true
    },
    {
        name: 'Kalpana',
        usn: '1SI23IS001',
        branch: 'Information Science & Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 4,
        isVisible: true
    },
    {
        name: 'Ananya',
        usn: '1SI23AD001',
        branch: 'Artificial Intelligence & Data Science',
        role: 'Community Contributor',
        avatar: null,
        order: 5,
        isVisible: true
    }
];

class ContributorService {
    /**
     * Seed contributors if collection is empty.
     */
    async seedContributorsIfEmpty() {
        try {
            const count = await Contributor.countDocuments();
            if (count === 0) {
                console.log(`🌱 Seeding ${initialContributors.length} contributors into MongoDB...`);
                await Contributor.insertMany(initialContributors);
                console.log('✅ Contributors seeded successfully.');
            }
        } catch (error) {
            console.error('❌ Error seeding contributors:', error.message);
        }
    }

    /**
     * Get visible contributors sorted by display order.
     */
    async getVisibleContributors() {
        await this.seedContributorsIfEmpty();
        return await Contributor.find({ isVisible: true }).sort({ order: 1 });
    }
}

module.exports = new ContributorService();
