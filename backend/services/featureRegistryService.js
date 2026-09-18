/**
 * AskUrSenior Feature Registry Service (STEP-04)
 *
 * Centralized Single Source of Truth for Feature Access Configuration:
 *
 *                     FEATURE REGISTRY
 *                           ¦
 *        +------------------+------------------+
 *        ¦                  ¦                  ¦
 *        ?                  ?                  ?
 *      FREE               PLUS             DISABLED
 *   (Open to all)     (Requires Plus)   (Access blocked)
 *
 * Configurable dynamically from Admin Panel with previewEnabled toggle.
 */

const Feature = require('../models/Feature');
const AdminLog = require('../models/AdminLog');
const { resolvePlusAccess } = require('./plusAccessService');

const INITIAL_FEATURE_REGISTRY = [
    // Academic Features
    {
        key: 'attendance_tracker',
        name: 'Attendance Tracker',
        description: 'Track lectures, labs, bunk safety thresholds, and maintain 85% attendance criteria',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/home/attendance',
        order: 1
    },
    {
        key: 'cie_analyzer',
        name: 'CIE Marks Analyzer',
        description: 'Internal assessments analyzer, required SEE score calculations, and credit safety',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/home/cie',
        order: 2
    },
    {
        key: 'timetable',
        name: 'Dynamic Timetable',
        description: 'Weekly timetable schedule, class timings, room allocations, and daily agendas',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/home/timetable',
        order: 3
    },
    {
        key: 'sgpa_calculator',
        name: 'SGPA Calculator',
        description: 'Semester grade point average calculator following SIT autonomous credit policies',
        category: 'ACADEMIC',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/home/sgpa-calculator',
        order: 4
    },
    {
        key: 'cgpa_calculator',
        name: 'CGPA Calculator',
        description: 'Cumulative grade point average projection and degree classification',
        category: 'ACADEMIC',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/home/cgpa-calculator',
        order: 5
    },
    {
        key: 'academic_summary',
        name: 'Academic Summary',
        description: 'Semester credit progress, performance trends, and academic scorecard',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/home/academic-summary',
        order: 6
    },
    {
        key: 'my_subjects',
        name: 'My Subjects & Syllabus',
        description: 'Enrolled subjects tracker, course credits, and syllabus module breakdown',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/my-subjects',
        order: 7
    },
    {
        key: 'academic_calendar',
        name: 'Academic Calendar',
        description: 'Autonomous calendar of events, test schedules, holidays, and examination milestones',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/academic-calendar',
        order: 8
    },
    {
        key: 'year_back_predictor',
        name: 'Year Back Risk Predictor',
        description: 'Autonomous credit regulation validator to detect and avoid year-back conditions',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/year-back-predictor',
        order: 9
    },
    {
        key: 'branch_change_predictor',
        name: 'Branch Change Predictor',
        description: 'Cutoff projections and eligibility predictor for SIT branch changes',
        category: 'ACADEMIC',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/branch-change-predictor',
        order: 10
    },

    // Content Features
    {
        key: 'materials',
        name: 'Study Materials & Notes',
        description: 'Verified handwritten notes, lab manuals, and previous year exam question papers',
        category: 'CONTENT',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/materials',
        order: 11
    },
    {
        key: 'quizzes',
        name: 'Practice Quizzes',
        description: 'Subject-wise interactive quizzes and self-assessment test banks',
        category: 'CONTENT',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/quiz',
        order: 12
    },
    {
        key: 'blogs',
        name: 'Guides & Articles',
        description: 'Engineering survival guides, exam tips, and student articles',
        category: 'CONTENT',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/blog',
        order: 13
    },

    // Career Features
    {
        key: 'interview_experiences',
        name: 'Interview Experiences',
        description: 'Real on-campus and off-campus recruitment logs from placed seniors',
        category: 'CAREER',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/interview',
        order: 14
    },
    {
        key: 'roadmaps',
        name: 'Placement Roadmaps',
        description: 'Curated learning paths for software development, cloud, AI, and core engineering',
        category: 'CAREER',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/roadmaps',
        order: 15
    },

    // Tools
    {
        key: 'coding_playground',
        name: 'Coding Playground',
        description: 'In-browser multi-language code runner and lab assignment simulator',
        category: 'TOOLS',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/playground',
        order: 16
    },

    // Community
    {
        key: 'campus_hub',
        name: 'Campus Hub & Map',
        description: 'Interactive 2D/3D SIT campus map, department locator, and building directory',
        category: 'COMMUNITY',
        access: 'FREE',
        enabled: true,
        previewEnabled: false,
        route: '/campus-hub',
        order: 17
    },
    {
        key: 'sessions',
        name: 'Senior Mentorship Sessions',
        description: 'Live webinars and interactive Q&A sessions hosted by senior students and alumni',
        category: 'COMMUNITY',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/sessions',
        order: 18
    },
    {
        key: 'announcements',
        name: 'Campus Announcements',
        description: 'Official college circulars, placement notifications, and event alerts',
        category: 'COMMUNITY',
        access: 'PLUS',
        enabled: true,
        previewEnabled: true,
        route: '/plus/announcements',
        order: 19
    }
];

class FeatureRegistryService {
    /**
     * Seeds the initial feature registry if empty or adds newly registered features.
     * Uses findOneAndUpdate with $setOnInsert to guarantee idempotency and avoid
     * overwriting any existing administrator customizations.
     */
    async seedFeaturesIfEmpty() {
        try {
            for (const item of INITIAL_FEATURE_REGISTRY) {
                await Feature.findOneAndUpdate(
                    { key: item.key },
                    { $setOnInsert: item },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
            console.log('? Feature Registry synchronized successfully');
        } catch (error) {
            console.error('? Error synchronizing Feature Registry:', error.message);
        }
    }

    /**
     * Retrieves all features with optional category, access, and search filters.
     *
     * @param {Object} [filterOptions]
     * @param {string} [filterOptions.category]
     * @param {string} [filterOptions.access]
     * @param {string} [filterOptions.search]
     * @returns {Promise<Array<Object>>}
     */
    async getAllFeatures({ category, access, search } = {}) {
        const query = {};

        if (category && category !== 'ALL') {
            query.category = String(category).toUpperCase().trim();
        }

        if (access && access !== 'ALL') {
            query.access = String(access).toUpperCase().trim();
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { key: regex },
                { description: regex }
            ];
        }

        return Feature.find(query).sort({ category: 1, order: 1, name: 1 }).lean();
    }

    /**
     * Computes summary metrics across all features in the registry.
     *
     * @returns {Promise<{ total: number, plusCount: number, freeCount: number, disabledCount: number, previewEnabledCount: number }>}
     */
    async getFeatureSummary() {
        const features = await Feature.find({}).lean();
        const total = features.length;
        let plusCount = 0;
        let freeCount = 0;
        let disabledCount = 0;
        let previewEnabledCount = 0;

        for (const f of features) {
            if (!f.enabled || f.access === 'DISABLED') {
                disabledCount++;
            } else if (f.access === 'PLUS') {
                plusCount++;
            } else if (f.access === 'FREE') {
                freeCount++;
            }

            if (f.previewEnabled && f.enabled && f.access !== 'DISABLED') {
                previewEnabledCount++;
            }
        }

        return {
            total,
            plusCount,
            freeCount,
            disabledCount,
            previewEnabledCount
        };
    }

    /**
     * Retrieves a single feature by its unique key.
     *
     * @param {string} key
     * @returns {Promise<Object|null>}
     */
    async getFeatureByKey(key) {
        if (!key) return null;
        const normalizedKey = String(key).toLowerCase().trim();
        return Feature.findOne({ key: normalizedKey });
    }

    /**
     * Updates configuration for an existing feature and creates an audit log entry.
     *
     * @param {string} key
     * @param {Object} updates
     * @param {Object} [adminUser]
     * @returns {Promise<Object>}
     */
    async updateFeature(key, updates = {}, adminUser = null) {
        const normalizedKey = String(key).toLowerCase().trim();
        const feature = await Feature.findOne({ key: normalizedKey });
        if (!feature) {
            const err = new Error(`Feature with key '${key}' not found`);
            err.statusCode = 404;
            throw err;
        }

        const allowedAccess = ['FREE', 'PLUS', 'DISABLED'];
        if (updates.access !== undefined) {
            const upperAccess = String(updates.access).toUpperCase().trim();
            if (!allowedAccess.includes(upperAccess)) {
                const err = new Error(`Invalid access tier: '${updates.access}'. Allowed: ${allowedAccess.join(', ')}`);
                err.statusCode = 400;
                throw err;
            }
            updates.access = upperAccess;
        }

        if (updates.previewEnabled !== undefined && typeof updates.previewEnabled !== 'boolean') {
            const err = new Error('previewEnabled must be a boolean');
            err.statusCode = 400;
            throw err;
        }

        if (updates.enabled !== undefined && typeof updates.enabled !== 'boolean') {
            const err = new Error('enabled must be a boolean');
            err.statusCode = 400;
            throw err;
        }

        // Snapshot previous state for audit logging
        const previousState = {
            access: feature.access,
            enabled: feature.enabled,
            previewEnabled: feature.previewEnabled,
            name: feature.name,
            description: feature.description
        };

        // Apply permitted mutations
        if (updates.access !== undefined) feature.access = updates.access;
        if (updates.previewEnabled !== undefined) feature.previewEnabled = updates.previewEnabled;
        if (updates.enabled !== undefined) feature.enabled = updates.enabled;
        if (updates.name !== undefined && typeof updates.name === 'string') feature.name = updates.name.trim();
        if (updates.description !== undefined && typeof updates.description === 'string') feature.description = updates.description.trim();
        if (updates.route !== undefined && typeof updates.route === 'string') feature.route = updates.route.trim();

        await feature.save();

        // Write audit log entry
        try {
            await AdminLog.create({
                adminId: adminUser?._id || adminUser?.id,
                action: 'FEATURE_UPDATED',
                details: {
                    featureKey: feature.key,
                    featureName: feature.name,
                    adminName: adminUser?.name || 'Administrator',
                    adminEmail: adminUser?.email,
                    previousState,
                    newState: {
                        access: feature.access,
                        enabled: feature.enabled,
                        previewEnabled: feature.previewEnabled
                    }
                }
            });
        } catch (logErr) {
            console.error('Failed to log feature update to AdminLog:', logErr.message);
        }

        return feature;
    }

    /**
     * Evaluates access permissions for a given user against a feature key.
     *
     * Evaluation Logic:
     * 1. DISABLED (or enabled === false): Blocked for everyone (reason: FEATURE_DISABLED)
     * 2. FREE: Accessible to everyone, including unauthenticated users (reason: FREE_FEATURE)
     * 3. PLUS: Checked against centralized plusAccessService:
     *    - ADMIN -> Access granted (reason: ADMIN)
     *    - TEST_USER -> Access granted (reason: TEST_USER)
     *    - NORMAL -> Access blocked (reason: REQUIRES_PLUS, with previewEnabled flag)
     *
     * @param {Object|null|undefined} user
     * @param {string} featureKey
     * @returns {Promise<{ allowed: boolean, key: string, reason: string, access: string, previewEnabled: boolean, plan?: string }>}
     */
    async canAccessFeature(user, featureKey) {
        if (!featureKey) {
            return {
                allowed: false,
                key: '',
                reason: 'MISSING_FEATURE_KEY',
                access: 'DISABLED',
                previewEnabled: false
            };
        }

        const normalizedKey = String(featureKey).toLowerCase().trim();
        const feature = await Feature.findOne({ key: normalizedKey }).lean();

        // If feature does not exist in registry, default to safe open/fallback
        if (!feature) {
            return {
                allowed: true,
                key: normalizedKey,
                reason: 'NOT_REGISTERED',
                access: 'FREE',
                previewEnabled: false
            };
        }

        // 1. Check feature kill switch and DISABLED tier
        if (!feature.enabled || feature.access === 'DISABLED') {
            return {
                allowed: false,
                key: feature.key,
                name: feature.name,
                reason: 'FEATURE_DISABLED',
                access: 'DISABLED',
                previewEnabled: false
            };
        }

        // 2. FREE features are accessible to any user
        if (feature.access === 'FREE') {
            return {
                allowed: true,
                key: feature.key,
                name: feature.name,
                reason: 'FREE_FEATURE',
                access: 'FREE',
                plan: 'FREE',
                previewEnabled: Boolean(feature.previewEnabled)
            };
        }

        // 3. PLUS features require Plus entitlement
        if (feature.access === 'PLUS') {
            const userAccess = resolvePlusAccess(user);
            if (userAccess.hasPlusAccess) {
                return {
                    allowed: true,
                    key: feature.key,
                    name: feature.name,
                    reason: userAccess.source, // 'ADMIN' | 'TEST_USER' | 'SUBSCRIPTION'
                    access: 'PLUS',
                    plan: 'PLUS',
                    previewEnabled: Boolean(feature.previewEnabled)
                };
            }

            return {
                allowed: false,
                key: feature.key,
                name: feature.name,
                reason: 'REQUIRES_PLUS',
                access: 'PLUS',
                plan: 'FREE',
                previewEnabled: Boolean(feature.previewEnabled)
            };
        }

        return {
            allowed: false,
            key: feature.key,
            name: feature.name,
            reason: 'UNKNOWN_ACCESS_TIER',
            access: feature.access,
            previewEnabled: false
        };
    }

    /**
     * Returns a public-safe list of active features and their tier configuration.
     *
     * @returns {Promise<Array<Object>>}
     */
    async getPublicFeatureDirectory() {
        return Feature.find({ enabled: true })
            .select('key name description category access previewEnabled route order')
            .sort({ category: 1, order: 1, name: 1 })
            .lean();
    }
}

const featureRegistryService = new FeatureRegistryService();
featureRegistryService.INITIAL_FEATURE_REGISTRY = INITIAL_FEATURE_REGISTRY;

module.exports = featureRegistryService;
