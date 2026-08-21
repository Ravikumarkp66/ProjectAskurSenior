const LandingPage = require('../models/LandingPage');
const Testimonial = require('../models/Testimonial');

const getDefaultLandingPageData = () => {
    return {
        version: '3.0.0',
        status: 'published',
        lastUpdated: new Date(),
        hero: {
            isVisible: true,
            badge: '✨ AskUrSenior V3 is Live',
            heading: 'The Ultimate Academic & Campus Hub for SIT Students',
            brandStatement: 'Built exclusively for Siddaganga Institute of Technology',
            description: 'Access notes, PYQs, analyze your CGPA, get placement interview insights from real seniors, and navigate campus life effortlessly.',
            primaryButton: { text: 'Explore Materials', link: '/cms' },
            secondaryButton: { text: 'Calculate CGPA', link: '/calculator' },
            previewCards: [
                { title: 'Ask+ AI Assistant', image: '/assets/previews/ask_ai.png', route: '/ask-finder' },
                { title: 'Interactive Campus Map', image: '/assets/previews/campus_map.png', route: '/campus-map' },
                { title: 'Smart CGPA & CIE Calculator', image: '/assets/previews/calculator.png', route: '/calculator' },
                { title: 'Organized PYQs & Notes', image: '/assets/previews/materials.png', route: '/cms' }
            ],
            background: 'gradient-dark',
            theme: 'dark'
        },
        platformFeatures: {
            isVisible: true,
            sectionTitle: 'Everything You Need in One Platform',
            sectionSubtitle: 'Discover features built specifically for SIT academic curriculum and campus ecosystem.',
            featureCategories: [
                {
                    title: 'Academics',
                    slug: 'academics',
                    description: 'Comprehensive study resources and curriculum insights.',
                    icon: 'BookOpen',
                    order: 1,
                    features: [
                        { title: 'Study Materials', slug: 'study-materials', shortDescription: 'Curated subject notes uploaded by toppers and seniors.', icon: 'FileText', route: '/cms', badge: 'Popular', isPremium: false, isComingSoon: false, displayOrder: 1 },
                        { title: 'PYQs', slug: 'pyqs', shortDescription: 'Previous years semester question papers sorted by scheme.', icon: 'HelpCircle', route: '/cms', badge: 'Essential', isPremium: false, isComingSoon: false, displayOrder: 2 },
                        { title: 'SEE Papers', slug: 'see-papers', shortDescription: 'Semester End Examination past papers with answer guides.', icon: 'Award', route: '/cms', displayOrder: 3 },
                        { title: 'Internal Papers', slug: 'internal-papers', shortDescription: 'Test 1, Test 2, and Test 3 internal exam question archives.', icon: 'Edit3', route: '/cms', displayOrder: 4 },
                        { title: 'Question Banks', slug: 'question-banks', shortDescription: 'Module-wise important questions compiled by faculty.', icon: 'Layers', route: '/cms', displayOrder: 5 },
                        { title: 'Faculty Ratings', slug: 'faculty-ratings', shortDescription: 'Anonymous teaching style insights and guidance.', icon: 'Star', route: '/campus-hub', displayOrder: 6 },
                        { title: 'Department Ratings', slug: 'department-ratings', shortDescription: 'Departmental lab facilities and course difficulty insights.', icon: 'Building', route: '/campus-hub', displayOrder: 7 }
                    ]
                },
                {
                    title: 'Tools',
                    slug: 'tools',
                    description: 'Academic calculators, predictors, and trackers.',
                    icon: 'Calculator',
                    order: 2,
                    features: [
                        { title: 'CGPA Calculator', slug: 'cgpa-calculator', shortDescription: 'Instant accurate CGPA calculation according to SIT credit policy.', icon: 'Calculator', route: '/calculator', badge: 'Tool', isPremium: false, isComingSoon: false, displayOrder: 1 },
                        { title: 'SGPA Calculator', slug: 'sgpa-calculator', shortDescription: 'Calculate SGPA per semester with custom credit inputs.', icon: 'TrendingUp', route: '/calculator', displayOrder: 2 },
                        { title: 'CIE Analyzer', slug: 'cie-analyzer', shortDescription: 'Analyze required SEE marks based on your internal test marks.', icon: 'PieChart', route: '/calculator', displayOrder: 3 },
                        { title: 'Eligibility Checker', slug: 'eligibility-checker', shortDescription: 'Check placement cutoff and credit eligibility criteria.', icon: 'CheckSquare', route: '/calculator', displayOrder: 4 },
                        { title: 'Year Back Predictor', slug: 'year-back-predictor', shortDescription: 'Credit check tool to avoid academic year back risks.', icon: 'AlertTriangle', route: '/calculator', displayOrder: 5 },
                        { title: 'Branch Change Predictor', slug: 'branch-change-predictor', shortDescription: 'Analyze historical cutoff trends for 1st-year branch change.', icon: 'GitBranch', route: '/calculator', displayOrder: 6 },
                        { title: 'Attendance Tracker', slug: 'attendance-tracker', shortDescription: 'Track subject attendance percentages and safe bunk margin.', icon: 'CheckCircle', route: '/dashboard', displayOrder: 7 }
                    ]
                },
                {
                    title: 'Placements',
                    slug: 'placements',
                    description: 'Career preparation tools and verified placement experiences.',
                    icon: 'Briefcase',
                    order: 3,
                    features: [
                        { title: 'Interview Experiences', slug: 'interview-experiences', shortDescription: 'Real interview questions and rounds shared by placed seniors.', icon: 'UserCheck', route: '/interview', badge: 'Verified', isPremium: false, isComingSoon: false, displayOrder: 1 },
                        { title: 'Company Cutoffs', slug: 'company-cutoffs', shortDescription: 'CGPA and branch eligibility cutoffs for visiting campus recruiters.', icon: 'CheckSquare', route: '/interview', displayOrder: 2 }
                    ]
                },
                {
                    title: 'Campus',
                    slug: 'campus',
                    description: 'Explore SIT campus buildings, services, and student listings.',
                    icon: 'Building',
                    order: 4,
                    features: [
                        { title: 'Campus Map', slug: 'campus-map', shortDescription: 'Interactive map of blocks, canteens, hostels, and auditoriums.', icon: 'MapPin', route: '/campus-map', badge: '3D Interactive', isPremium: false, isComingSoon: false, displayOrder: 1 },
                        { title: 'Lost & Found', slug: 'lost-and-found', shortDescription: 'Campus-wide portal to report and locate missing belongings.', icon: 'Search', route: '/campus-hub', displayOrder: 2 },
                        { title: 'Marketplace', slug: 'marketplace', shortDescription: 'Buy, sell, or exchange used textbooks, drafters, and equipment.', icon: 'ShoppingBag', route: '/campus-hub', displayOrder: 3 },
                        { title: 'Blogs', slug: 'blogs', shortDescription: 'Student articles, campus news, and academic survival guides.', icon: 'BookMarked', route: '/blog', displayOrder: 4 }
                    ]
                },
                {
                    title: 'AI',
                    slug: 'ai',
                    description: 'Custom AI assistant trained specifically on SIT academic data.',
                    icon: 'Sparkles',
                    order: 5,
                    features: [
                        { title: 'Ask+ Chatbot (RAG)', slug: 'ask-plus-chatbot', shortDescription: 'Instant answers to academic syllabus and SIT query questions.', icon: 'Cpu', route: '/ask-finder', badge: 'AI Assistant', isPremium: false, isComingSoon: false, displayOrder: 1 }
                    ]
                },
                {
                    title: 'Productivity',
                    slug: 'productivity',
                    description: 'Personalized dashboard to keep track of goals and progress.',
                    icon: 'Activity',
                    order: 6,
                    features: [
                        { title: 'Personalized Dashboard', slug: 'personalized-dashboard', shortDescription: 'Single dashboard showing enrolled courses, schedule, and notes.', icon: 'Layout', route: '/dashboard', displayOrder: 1 },
                        { title: '4-Year Academic Journey', slug: '4-year-academic-journey', shortDescription: 'Visual milestone roadmap from 1st sem to graduation.', icon: 'Flag', route: '/dashboard', displayOrder: 2 },
                        { title: 'Streak System', slug: 'streak-system', shortDescription: 'Build daily study habits with active revision streaks.', icon: 'Zap', route: '/dashboard', displayOrder: 3 },
                        { title: 'To-do List', slug: 'to-do-list', shortDescription: 'Prioritize assignments, lab submissions, and exam prep tasks.', icon: 'List', route: '/dashboard', displayOrder: 4 },
                        { title: 'Leaderboard', slug: 'leaderboard', shortDescription: 'Gamified student rank based on academic contributions.', icon: 'Trophy', route: '/leaderboard', displayOrder: 5 }
                    ]
                },
                {
                    title: 'Community',
                    slug: 'community',
                    description: 'Connect with peers, seniors, and dedicated support channels.',
                    icon: 'Users',
                    order: 7,
                    features: [
                        { title: 'WhatsApp Community', slug: 'whatsapp-community', shortDescription: 'Official year-wise WhatsApp groups for verified updates.', icon: 'MessageCircle', route: '/whatsapp', badge: 'Active', displayOrder: 1 },
                        { title: 'Student Support', slug: 'student-support', shortDescription: 'Direct chat assistance for academic and technical queries.', icon: 'Headphones', route: '/support', displayOrder: 2 }
                    ]
                }
            ]
        },
        comparison: {
            isVisible: true,
            title: 'Without AskUrSenior vs With AskUrSenior',
            subtitle: 'Why thousands of SIT students switch to AskUrSenior every semester',
            items: [
                { without: 'Searching WhatsApp groups for notes', with: 'Search organized study materials instantly', icon: 'Search', order: 1 },
                { without: 'Asking seniors individually', with: 'Verified interview experiences from real seniors', icon: 'UserCheck', order: 2 },
                { without: 'Using multiple academic websites', with: 'Everything in one platform', icon: 'Grid', order: 3 },
                { without: 'Manual CGPA calculations', with: 'Instant CGPA, SGPA and CIE analysis', icon: 'Calculator', order: 4 },
                { without: 'No campus navigation', with: 'Interactive Campus Explorer', icon: 'MapPin', order: 5 },
                { without: 'No faculty insights', with: 'Faculty and Department Ratings', icon: 'Star', order: 6 },
                { without: 'Generic AI answers', with: 'Ask+ trained on SIT-specific resources', icon: 'Cpu', order: 7 },
                { without: 'No study tracking', with: 'Personal Dashboard with Streaks & Progress', icon: 'TrendingUp', order: 8 },
                { without: 'Scattered PDFs and Google Drive links', with: 'Organized Notes, PYQs, SEE Papers & Question Banks', icon: 'Folder', order: 9 },
                { without: 'No structured placement preparation', with: 'Company Cutoffs, Roadmaps & Interview Experiences', icon: 'Briefcase', order: 10 },
                { without: 'No student marketplace', with: 'Buy, Sell & Exchange within campus', icon: 'ShoppingBag', order: 11 },
                { without: 'No centralized Lost & Found', with: 'Dedicated Lost & Found Portal', icon: 'Shield', order: 12 }
            ]
        },
        testimonials: {
            isVisible: true,
            sectionTitle: 'What Students Say',
            subtitle: 'Real feedback from SITians',
            testimonials: [] // Holds Array of Testimonial ObjectIDs
        },
        faqs: {
            isVisible: true,
            sectionTitle: 'Frequently Asked Questions',
            subtitle: 'Have questions? We have answers.',
            faqs: [
                { question: 'What is AskUrSenior?', answer: 'AskUrSenior is an all-in-one academic and campus utility platform built specifically for Siddaganga Institute of Technology (SIT) students.' },
                { question: 'Are the study materials free to access?', answer: 'Yes! Notes, PYQs, SEE papers, and calculators are accessible to all verified SIT students.' },
                { question: 'How accurate is the CGPA / CIE Analyzer?', answer: 'The calculator is updated to strictly adhere to SIT choice-based credit system rules, grade points, and CIE attendance/test requirements.' },
                { question: 'How can I contribute notes or interview experiences?', answer: 'You can upload materials via the student portal or reach out through our WhatsApp community leads.' }
            ]
        },
        communityContributors: {
            isVisible: true,
            sectionTitle: 'Community Contributors',
            subtitle: 'The students who helped strengthen the AskUrSenior community by supporting juniors, sharing resources, and contributing valuable information.'
        },
        cta: {
            isVisible: true,
            title: 'Ready to Level Up Your Academic Journey at SIT?',
            description: 'Get instant access to notes, PYQs, CGPA tools, and campus utilities designed for SIT students.',
            primaryButton: { text: 'Get Started Free', link: '/cms' },
            secondaryButton: { text: 'Calculate CGPA', link: '/calculator' },
            backgroundImage: ''
        },
        seo: {
            pageTitle: 'AskUrSenior V3 - Official SIT Student Platform',
            metaDescription: 'Access SIT notes, PYQs, CGPA calculator, campus map, placement experiences, and AI assistant.',
            keywords: 'SIT, AskUrSenior, Tumkur, Study Materials, PYQ, CGPA Calculator, Placement Experiences',
            openGraphImage: '/assets/og_image.png'
        }
    };
};

class LandingPageService {
    /**
     * Get published landing page configuration.
     * Populates testimonials array with ALL published Testimonial ObjectIDs from the testimonials collection.
     */
    async getLandingPage() {
        let landingPage = await LandingPage.findOne({ status: 'published' }).sort({ createdAt: -1 });

        if (!landingPage) {
            landingPage = await LandingPage.findOne().sort({ createdAt: -1 });
        }

        const defaultData = getDefaultLandingPageData();

        if (!landingPage) {
            console.log('🌱 Seeding initial LandingPage document...');
            landingPage = await LandingPage.create(defaultData);
            console.log('✅ LandingPage document seeded successfully.');
        } else {
            // Update platformFeatures to ensure latest category updates
            landingPage.platformFeatures = defaultData.platformFeatures;
        }

        // Link ALL published Testimonial ObjectIDs into landingPage.testimonials.testimonials if empty or out of sync
        if (!landingPage.testimonials?.testimonials || landingPage.testimonials.testimonials.length === 0) {
            const allPublishedTestimonials = await Testimonial.find({ isPublished: true }).select('_id');
            const testimonialIds = allPublishedTestimonials.map(t => t._id);

            if (!landingPage.testimonials) {
                landingPage.testimonials = defaultData.testimonials;
            }

            if (testimonialIds.length > 0) {
                console.log(`🔗 Linking ALL ${testimonialIds.length} Testimonial ObjectIDs into LandingPage collection...`);
                landingPage.testimonials.testimonials = testimonialIds;
                await landingPage.save();
            }
        }

        // Return populated document with Testimonial ObjectIDs populated
        landingPage = await LandingPage.findById(landingPage._id).populate('testimonials.testimonials');

        return landingPage;
    }
}

module.exports = new LandingPageService();
