const landingPageService = require('../services/landingPageService');

const getLandingPage = async (req, res) => {
    try {
        const landingPage = await landingPageService.getLandingPage();
        return res.status(200).json({
            success: true,
            message: 'Landing page loaded successfully.',
            data: landingPage
        });
    } catch (error) {
        console.error('Error fetching landing page:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load landing page content.',
            error: error.message
        });
    }
};

module.exports = {
    getLandingPage
};
