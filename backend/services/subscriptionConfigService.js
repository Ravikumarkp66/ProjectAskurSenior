const SubscriptionConfig = require('../models/SubscriptionConfig');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionFeature = require('../models/SubscriptionFeature');
const DiscountCoupon = require('../models/DiscountCoupon');

const initialPlans = [
    {
        code: 'SEM_1',
        name: 'AskUrSenior Plus',
        tagline: 'Complete Academic Companion for SIT Students',
        price: 199,
        originalPrice: 399,
        currency: 'INR',
        duration: 1,
        durationUnit: 'semester',
        badge: 'Recommended',
        isPopular: true,
        order: 1,
        features: [
            'Personalized Student Dashboard',
            'SIT Attendance Tracker & Timetable',
            'Ask+ AI Assistant (RAG on SIT Syllabus)',
            'Interactive Academic Roadmaps & Heatmap',
            'Advanced CIE & Year Back Predictors',
            'Leaderboards, Streaks & Daily To-do',
            'Senior Mentorship & Community Support',
            'Priority Download Bandwidth'
        ]
    }
];

const initialCoupons = [
    {
        code: 'SITFIRSTYEAR',
        title: 'First Year Freshers Special',
        discountType: 'percentage',
        discountValue: 20,
        applicablePlans: ['SEM_1'],
        isActive: true
    },
    {
        code: 'LAUNCH50',
        title: 'V3 Platform Launch Offer',
        discountType: 'flat',
        discountValue: 50,
        applicablePlans: ['SEM_1'],
        isActive: true
    },
    {
        code: 'AMBASSADOR',
        title: 'Campus Ambassador Pass',
        discountType: 'percentage',
        discountValue: 15,
        applicablePlans: ['SEM_1'],
        isActive: true
    }
];

const initialFeatures = [
    {
        code: 'study_materials',
        title: 'Study Materials & PYQs',
        category: 'Academics',
        tier: 'free',
        shortDescription: 'Notes, SEE papers, and lab manuals.',
        problem: 'Notes are scattered across WhatsApp groups and drive links.',
        solution: 'Centralized repository sorted by branch, scheme, and semester.',
        benefit: 'Save hours searching for verified exam preparation notes.',
        icon: 'BookOpen',
        order: 1
    },
    {
        code: 'interview_experiences',
        title: 'Interview Experiences',
        category: 'Placements',
        tier: 'free',
        shortDescription: 'Seniors placement interview logs.',
        problem: 'Juniors lack clarity on real SIT placement rounds and coding patterns.',
        solution: 'Verified interview logs from placed seniors at SIT.',
        benefit: 'Prepare precisely for campus recruitment drives.',
        icon: 'Briefcase',
        order: 2
    },
    {
        code: 'faculty_ratings',
        title: 'Faculty Ratings',
        category: 'Campus',
        tier: 'free',
        shortDescription: 'Anonymous teaching insights.',
        problem: 'Students pick electives without knowing faculty teaching styles.',
        solution: 'Student-driven insights on faculty evaluation methods.',
        benefit: 'Make informed choices for open & professional electives.',
        icon: 'Star',
        order: 3
    },
    {
        code: 'campus_explorer',
        title: 'Campus Explorer',
        category: 'Tools',
        tier: 'free',
        shortDescription: 'Interactive 2D/3D campus map.',
        problem: 'Freshers get lost finding departments, auditoriums, and labs.',
        solution: 'Interactive campus map of all SIT blocks.',
        benefit: 'Navigate the campus effortlessly.',
        icon: 'MapPin',
        order: 4
    },
    {
        code: 'cgpa_calculator',
        title: 'CGPA & SGPA Calculator',
        category: 'Tools',
        tier: 'free',
        shortDescription: 'SIT credit policy calculator.',
        problem: 'Standard grade calculators do not follow SIT choice-based credit policies.',
        solution: 'Calibrated calculator built natively for SIT grading.',
        benefit: 'Accurate SGPA/CGPA projection in seconds.',
        icon: 'Calculator',
        order: 5
    },
    {
        code: 'personalized_dashboard',
        title: 'Personalized Dashboard',
        category: 'Productivity',
        tier: 'plus',
        shortDescription: 'Centralized academic command center.',
        problem: 'Students lose track of daily schedules, assignments, and test dates.',
        solution: 'A unified dashboard showing today’s classes, tasks, and alerts.',
        benefit: 'Stay disciplined and organized every single day.',
        icon: 'LayoutDashboard',
        order: 6
    },
    {
        code: 'attendance_tracker',
        title: 'Attendance Tracker',
        category: 'Productivity',
        tier: 'plus',
        shortDescription: 'Smart SIT 85% attendance tracker.',
        problem: 'Falling below 85% attendance leads to N-Co (Not Eligible) warnings.',
        solution: 'Track attendance per subject with safe bunk count calculations.',
        benefit: 'Maintain 85%+ attendance without exam eligibility anxiety.',
        icon: 'UserCheck',
        order: 7
    },
    {
        code: 'ask_ai',
        title: 'Ask+ AI Assistant',
        category: 'AI Assistant',
        tier: 'plus',
        shortDescription: 'RAG AI trained on SIT syllabus.',
        problem: 'General AI tools give irrelevant or generic answers to SIT course questions.',
        solution: 'Retrieval-Augmented Generation trained on SIT modules and past papers.',
        benefit: 'Get instant, context-aware academic guidance 24/7.',
        icon: 'Sparkles',
        order: 8
    },
    {
        code: 'academic_roadmaps',
        title: 'Academic Roadmaps & Heatmap',
        category: 'Guidance',
        tier: 'plus',
        shortDescription: 'Visual study progress tracker.',
        problem: 'Hard to visualize overall syllabus completion before SEE exams.',
        solution: 'Visual branch roadmaps and contribution heatmaps.',
        benefit: 'Build consistent study habits and track exam readiness.',
        icon: 'Compass',
        order: 9
    },
    {
        code: 'cie_analyzer',
        title: 'CIE Analyzer & Year Back Predictor',
        category: 'Tools',
        tier: 'plus',
        shortDescription: 'Predict required SEE marks & credit safety.',
        problem: 'Uncertainty over required SEE marks after internal test scores.',
        solution: 'Analytics tool computing exact SEE marks needed to pass.',
        benefit: 'Eliminate exam stress with precise target scores.',
        icon: 'BarChart3',
        order: 10
    },
    {
        code: 'senior_mentorship',
        title: 'Senior Mentorship & Sessions',
        category: 'Community',
        tier: 'plus',
        shortDescription: 'Direct guidance from placed seniors.',
        problem: 'Finding senior guidance for competitive exams & placements is hard.',
        solution: 'Exclusive weekly sessions and mentorship access.',
        benefit: 'Learn directly from seniors who have achieved what you aspire to.',
        icon: 'Users',
        order: 11
    }
];

const initialSections = [
    {
        key: 'hero',
        isVisible: true,
        order: 1,
        title: 'Invest in Your College Journey.',
        subtitle: 'AskUrSenior Plus is designed for students who want a smarter, more organized and personalized academic experience throughout their engineering journey.',
        content: {
            primaryCtaText: 'Unlock AskUrSenior Plus',
            secondaryCtaText: 'Compare Free vs Plus'
        }
    },
    {
        key: 'promise',
        isVisible: true,
        order: 2,
        title: 'Our Promise Will Never Change',
        subtitle: 'Every student deserves access to essential academic resources.',
        content: {
            missionStatement: 'We believe core academic resources should remain accessible to every student at Siddaganga Institute of Technology.',
            alwaysFreeItems: [
                'Study Materials', 'Interview Experiences', 'Faculty Ratings',
                'Campus Explorer', 'Marketplace', 'Lost & Found',
                'CGPA Calculator', 'SGPA Calculator', 'Blogs'
            ],
            closingStatement: 'These core academic resources will always remain free for every student.'
        }
    },
    {
        key: 'why_plus',
        isVisible: true,
        order: 3,
        title: 'Why Introduce AskUrSenior Plus?',
        subtitle: 'Building a sustainable student platform.',
        content: {
            pillars: [
                'Continuous platform development',
                'Server infrastructure & hosting',
                'AI services & API costs',
                'Resource verification & QA',
                'Weekly sessions & mentorship',
                'Community management & maintenance'
            ],
            closingStatement: 'We introduced Plus not to lock learning. We introduced it so we can sustainably build better tools for students.'
        }
    },
    {
        key: 'comparison',
        isVisible: true,
        order: 4,
        title: 'Free vs AskUrSenior Plus',
        subtitle: 'Choose the level of academic support that fits your needs.',
        content: {
            freeTitle: 'AskUrSenior Free',
            freeAudience: 'Perfect for students who need essential academic resources.',
            plusTitle: 'AskUrSenior Plus',
            plusAudience: 'Perfect for students who want a complete academic companion.'
        }
    },
    {
        key: 'features_showcase',
        isVisible: true,
        order: 5,
        title: 'Why Each Feature Exists',
        subtitle: 'We build features to solve real engineering student problems.',
        content: {}
    },
    {
        key: 'transparency',
        isVisible: true,
        order: 6,
        title: 'What You’re Paying For',
        subtitle: 'Absolute transparency about what you receive immediately upon subscription.',
        content: {
            guarantee: 'Every premium feature shown on this page already exists, works, has been built, and is available immediately after purchase. We never charge students for unreleased features.',
            included: ['Existing Premium Features', 'Bug Fixes', 'Performance Improvements', 'Stability Updates'],
            notIncluded: ['Future Major Versions', 'Future Premium Modules', 'Unbuilt Features']
        }
    },
    {
        key: 'version_policy',
        isVisible: true,
        order: 7,
        title: 'Our Version Commitment',
        subtitle: 'Pay for software that exists today.',
        content: {
            statement: 'When students subscribe, they purchase access to the premium features available in the current version (V3). Future major versions (V4, V5) may introduce entirely new capabilities and updated pricing. We believe students should pay for software that already exists—not promises.'
        }
    },
    {
        key: 'semester_philosophy',
        isVisible: true,
        order: 8,
        title: 'Why Don’t We Offer Lifetime Plans?',
        subtitle: 'Engineering is a semester-based journey.',
        content: {
            statement: 'Engineering is a semester-based journey where academic needs evolve every semester. Rather than selling expensive lifetime plans that students may never use after graduation, we provide affordable semester-wise plans. You only pay for the period in which you genuinely benefit.'
        }
    },
    {
        key: 'future_plans',
        isVisible: true,
        order: 9,
        title: 'Could Longer Plans Be Introduced?',
        subtitle: 'Honesty over unrealistic promises.',
        content: {
            statement: 'Possibly. If AskUrSenior grows into a sustainable platform with long-term support, we may introduce four-year academic passes. Until then, we prefer honesty over unrealistic promises.'
        }
    },
    {
        key: 'plans',
        isVisible: true,
        order: 10,
        title: 'Subscription Plans',
        subtitle: 'Simple, transparent, affordable pricing for SIT students.',
        content: {}
    },
    {
        key: 'discounts',
        isVisible: true,
        order: 11,
        title: 'Student Discounts & Coupons',
        subtitle: 'Launch, ambassador, and referral offers for SIT engineering students.',
        content: {
            description: 'Eligible students can apply coupon codes during checkout to unlock instant discounts.'
        }
    },
    {
        key: 'founder_note',
        isVisible: true,
        order: 12,
        title: 'A Note From the Founder',
        subtitle: 'Why AskUrSenior was created.',
        content: {
            storyMarkdown: `Hi, I'm **Ravikumar KP**, an Information Science and Engineering student at Siddaganga Institute of Technology.

The platform was built to solve the exact problems I personally faced during engineering—scattered study notes, unclear exam requirements, and lack of senior guidance.

For two years, the platform has remained free. **The essentials will always remain free.**

AskUrSenior Plus exists to help us continue building better tools while staying completely transparent about what students receive. Every feature you pay for already exists. Every promise we make is one we keep.`,
            founderName: 'Ravikumar KP',
            founderTitle: 'Founder • AskUrSenior',
            avatarUrl: 'https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg'
        }
    },
    {
        key: 'testimonials',
        isVisible: true,
        order: 13,
        title: 'What SIT Students Say',
        subtitle: 'Real reviews from engineering students at Siddaganga Institute of Technology.',
        content: {}
    },
    {
        key: 'faqs',
        isVisible: true,
        order: 14,
        title: 'Subscription FAQs',
        subtitle: 'Answers to common questions about AskUrSenior Plus.',
        content: {}
    },
    {
        key: 'final_cta',
        isVisible: true,
        order: 15,
        title: 'Ready to Make Your College Journey Smarter?',
        subtitle: 'Join students who want a smarter, more organized and personalized academic journey.',
        content: {
            buttonText: 'Unlock AskUrSenior Plus'
        }
    }
];

class SubscriptionConfigService {
    /**
     * Seeds initial records across all collections if empty.
     */
    async seedAllIfEmpty() {
        try {
            // Seed Config
            const configCount = await SubscriptionConfig.countDocuments();
            if (configCount === 0) {
                console.log('🌱 Seeding SubscriptionConfig...');
                await SubscriptionConfig.create({
                    version: 'v3',
                    pageTitle: 'AskUrSenior Plus — Invest in Your College Journey',
                    sections: initialSections
                });
            }

            // Seed Plans
            const plansCount = await SubscriptionPlan.countDocuments();
            if (plansCount === 0) {
                console.log('🌱 Seeding SubscriptionPlan...');
                await SubscriptionPlan.insertMany(initialPlans);
            }

            // Seed Features
            const featuresCount = await SubscriptionFeature.countDocuments();
            if (featuresCount === 0) {
                console.log('🌱 Seeding SubscriptionFeature...');
                await SubscriptionFeature.insertMany(initialFeatures);
            }

            // Seed Coupons
            const couponsCount = await DiscountCoupon.countDocuments();
            if (couponsCount === 0) {
                console.log('🌱 Seeding DiscountCoupon...');
                await DiscountCoupon.insertMany(initialCoupons);
            }
        } catch (error) {
            console.error('❌ Error seeding Subscription ecosystem:', error.message);
        }
    }

    /**
     * Get orchestrated public payload for subscription page.
     */
    async getOrchestratedConfig() {
        await this.seedAllIfEmpty();

        const configDoc = await SubscriptionConfig.findOne({ isActive: true }).lean();
        const activePlans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 }).lean();
        const activeFeatures = await SubscriptionFeature.find().sort({ order: 1 }).lean();
        const activeCoupons = await DiscountCoupon.find({ isActive: true }).select('code title discountType discountValue').lean();

        // Sort sections by order
        const sections = (configDoc?.sections || []).sort((a, b) => (a.order || 0) - (b.order || 0));

        return {
            pageTitle: configDoc?.pageTitle || 'AskUrSenior Plus — Invest in Your College Journey',
            metaDescription: configDoc?.metaDescription || 'Smarter academic experience for SIT students.',
            sections,
            plans: activePlans,
            features: activeFeatures,
            coupons: activeCoupons
        };
    }
}

module.exports = new SubscriptionConfigService();
