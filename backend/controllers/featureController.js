const featureRegistryService = require('../services/featureRegistryService');

/**
 * GET /api/admin/features
 * Retrieve all features with summary metrics for admin management.
 */
exports.getAdminFeatures = async (req, res) => {
    try {
        const { category, access, search } = req.query;

        const [features, summary] = await Promise.all([
            featureRegistryService.getAllFeatures({ category, access, search }),
            featureRegistryService.getFeatureSummary()
        ]);

        res.json({
            success: true,
            features,
            summary
        });
    } catch (err) {
        console.error('Error fetching admin features:', err);
        res.status(500).json({ error: 'Failed to retrieve features list' });
    }
};

/**
 * GET /api/admin/features/:key
 * Retrieve single feature details.
 */
exports.getAdminFeatureByKey = async (req, res) => {
    try {
        const feature = await featureRegistryService.getFeatureByKey(req.params.key);
        if (!feature) {
            return res.status(404).json({ error: `Feature '${req.params.key}' not found` });
        }

        res.json({
            success: true,
            feature
        });
    } catch (err) {
        console.error('Error fetching admin feature by key:', err);
        res.status(500).json({ error: 'Failed to retrieve feature' });
    }
};

/**
 * PATCH /api/admin/features/:key
 * Update feature access tier, previewEnabled, or enabled kill switch.
 */
exports.updateAdminFeature = async (req, res) => {
    try {
        const adminUser = req.admin || req.user;
        const updatedFeature = await featureRegistryService.updateFeature(
            req.params.key,
            req.body,
            adminUser
        );

        res.json({
            success: true,
            message: `Feature '${updatedFeature.name}' updated successfully`,
            feature: updatedFeature
        });
    } catch (err) {
        console.error('Error updating admin feature:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Failed to update feature' });
    }
};

/**
 * GET /api/features
 * Public directory of features and their access tiers.
 */
exports.getPublicFeatures = async (req, res) => {
    try {
        const features = await featureRegistryService.getPublicFeatureDirectory();
        res.json({
            success: true,
            features
        });
    } catch (err) {
        console.error('Error fetching public features:', err);
        res.status(500).json({ error: 'Failed to retrieve features directory' });
    }
};

/**
 * GET /api/features/:key/access
 * Evaluate feature access for current user.
 */
exports.checkFeatureAccess = async (req, res) => {
    try {
        const user = req.user || req.student || null;
        const result = await featureRegistryService.canAccessFeature(user, req.params.key);
        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error checking feature access:', err);
        res.status(500).json({ error: 'Failed to evaluate feature access' });
    }
};