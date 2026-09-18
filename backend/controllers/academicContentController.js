const {
    resolveAuthorizedSubject,
    getSubjectContentTree,
    getTopicEditorialContent
} = require('../services/academicContentResolver');

/**
 * GET /api/v2/academic-content/:subjectSlug
 * 
 * Returns the full content tree of an academic subject (modules + topics)
 * without heavy editorial content blocks.
 * 
 * Authorization Invariant:
 * Strictly checks that the student is allocated the requested subject
 * according to the authoritative studentSubjectResolver timetable projection.
 */
async function getContentTree(req, res) {
    try {
        const student = req.student || req.user;
        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { subjectSlug } = req.params;
        if (!subjectSlug || !subjectSlug.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Subject slug is required'
            });
        }

        // Verify student allocation
        const authResult = await resolveAuthorizedSubject(student, subjectSlug);
        if (!authResult || !authResult.authorized) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Subject not allocated to student'
            });
        }

        const contentTree = await getSubjectContentTree(
            authResult.subjectId,
            authResult.subjectMeta
        );

        return res.status(200).json({
            success: true,
            data: contentTree
        });
    } catch (error) {
        console.error('Error in getContentTree:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve academic content tree',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * GET /api/v2/academic-content/:subjectSlug/:moduleSlug/:topicSlug
 * 
 * Returns the complete editorial reading sheet for a specific topic,
 * including sections and semantic content blocks.
 * 
 * Authorization Invariant:
 * Strictly checks that the student is allocated the requested subject,
 * that the topic is Published, and that all relational invariants hold.
 */
async function getTopicEditorial(req, res) {
    try {
        const student = req.student || req.user;
        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { subjectSlug, moduleSlug, topicSlug } = req.params;
        if (!subjectSlug || !moduleSlug || !topicSlug) {
            return res.status(400).json({
                success: false,
                message: 'subjectSlug, moduleSlug, and topicSlug parameters are required'
            });
        }

        // Verify student allocation
        const authResult = await resolveAuthorizedSubject(student, subjectSlug);
        if (!authResult || !authResult.authorized) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Subject not allocated to student'
            });
        }

        const topicContent = await getTopicEditorialContent(
            authResult.subjectId,
            moduleSlug,
            topicSlug,
            authResult.subjectMeta
        );

        if (topicContent.error) {
            return res.status(404).json({
                success: false,
                message: topicContent.message
            });
        }

        return res.status(200).json({
            success: true,
            data: topicContent
        });
    } catch (error) {
        console.error('Error in getTopicEditorial:', error);
        if (error.message && error.message.includes('Data integrity violation')) {
            return res.status(500).json({
                success: false,
                message: 'Internal data integrity error'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve topic editorial content',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = {
    getContentTree,
    getTopicEditorial
};
