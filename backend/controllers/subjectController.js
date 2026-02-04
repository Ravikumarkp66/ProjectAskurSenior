const Subject = require('../models/Subject');
const Progress = require('../models/Progress');
const { generateSignedUrl } = require('../utils/getSignedUrl');
const { getCache, setCache, cacheKeys, CACHE_TTL } = require('../utils/redisClient');

const getSubjectsByBranch = async (req, res) => {
    try {
        const { branch } = req.params;
        const { cycle } = req.query;

        // Check cache first
        const cacheKey = cacheKeys.subjectsByBranch(branch, cycle);
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const query = { branch };
        if (cycle === 'P' || cycle === 'C') query.cycle = cycle;

        const subjects = await Subject.find(query)
            .sort({ credits: -1, code: 1 })
            .select('-__v')
            .lean(); // Use lean() for faster queries

        // Cache the result
        await setCache(cacheKey, subjects, CACHE_TTL.SUBJECTS_BY_BRANCH);

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Check cache first
        const cacheKey = cacheKeys.subjectDetail(subjectId);
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const subject = await Subject.findById(subjectId).lean();
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Cache the result
        await setCache(cacheKey, subject, CACHE_TTL.SUBJECT_DETAIL);

        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markQuestionCompleted = async (req, res) => {
    try {
        const { subjectId, moduleNumber, questionId } = req.body;

        // Find subject and update question
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const module = subject.modules.find((m) => m.moduleNumber === moduleNumber);
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const question = module.questions.find((q) => q._id.toString() === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Toggle completion status
        question.completed = !question.completed;
        await subject.save();

        // Invalidate cache for this subject
        const { deleteCache, cacheKeys } = require('../utils/redisClient');
        await deleteCache(cacheKeys.subjectDetail(subjectId));
        await deleteCache(cacheKeys.subjectsByBranch(subject.branch, subject.cycle));

        // Update progress
        const progress = await Progress.findOne({ userId: req.userId });
        if (progress) {
            calculateAndUpdateProgress(progress, req.userId, subject);
        }

        res.json({ message: 'Question updated', question });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const calculateAndUpdateProgress = async (progress, userId, subject) => {
    try {
        // Find or create subject progress entry
        let subjectProgressEntry = progress.subjectProgress.find(
            (sp) => sp.subjectId.toString() === subject._id.toString()
        );

        if (!subjectProgressEntry) {
            subjectProgressEntry = {
                subjectId: subject._id,
                subjectName: subject.name,
                totalQuestions: 0,
                completedQuestions: 0,
                modules: []
            };
            progress.subjectProgress.push(subjectProgressEntry);
        }

        // Calculate totals
        let totalQuestions = 0;
        let completedQuestions = 0;

        subject.modules.forEach((module) => {
            const moduleTotal = module.questions.length;
            const moduleCompleted = module.questions.filter((q) => q.completed).length;

            totalQuestions += moduleTotal;
            completedQuestions += moduleCompleted;

            // Update module progress
            let moduleProgress = subjectProgressEntry.modules.find(
                (m) => m.moduleNumber === module.moduleNumber
            );
            if (!moduleProgress) {
                moduleProgress = {
                    moduleId: module._id,
                    moduleNumber: module.moduleNumber,
                    totalQuestions: moduleTotal,
                    completedQuestions: moduleCompleted
                };
                subjectProgressEntry.modules.push(moduleProgress);
            } else {
                moduleProgress.totalQuestions = moduleTotal;
                moduleProgress.completedQuestions = moduleCompleted;
            }
        });

        subjectProgressEntry.totalQuestions = totalQuestions;
        subjectProgressEntry.completedQuestions = completedQuestions;

        // Calculate overall progress
        progress.calculateProgress();
        await progress.save();
    } catch (error) {
        console.error('Error updating progress:', error);
    }
};

/**
 * Get signed URL for module notes (PDF preview)
 */
const getModuleNotes = async (req, res) => {
    try {
        const { subjectId, moduleNumber } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const module = subject.modules.find(
            (m) => m.moduleNumber === parseInt(moduleNumber)
        );
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        if (!module.notesKey) {
            return res.status(404).json({ error: 'No notes available for this module' });
        }

        // Generate signed URL for PDF preview (valid for 1 hour)
        const signedUrl = await generateSignedUrl(module.notesKey);

        res.json({
            success: true,
            url: signedUrl,
            moduleName: module.title,
            subjectName: subject.name
        });
    } catch (error) {
        console.error('Error getting module notes:', error);
        res.status(500).json({ error: 'Failed to get notes' });
    }
};

/**
 * Get signed URL for any content item (notes, pyqs, questionBanks, syllabus, resources)
 */
const getContentUrl = async (req, res) => {
    try {
        const { subjectId, contentType, contentId, moduleNumber } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        let contentItem;
        let contextName = subject.name;

        // Subject-level content (syllabus, resources)
        if (['syllabus', 'resources'].includes(contentType)) {
            contentItem = subject[contentType]?.find(c => c._id.toString() === contentId);
        } 
        // Module-level content (notes, pyqs, questionBanks)
        else if (['notes', 'pyqs', 'questionBanks'].includes(contentType) && moduleNumber) {
            const module = subject.modules.find(m => m.moduleNumber === parseInt(moduleNumber));
            if (!module) {
                return res.status(404).json({ error: 'Module not found' });
            }
            contentItem = module[contentType]?.find(c => c._id.toString() === contentId);
            contextName = `${subject.name} - ${module.title}`;
        } else {
            return res.status(400).json({ error: 'Invalid content type or missing module number' });
        }

        if (!contentItem) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Generate signed URL
        const signedUrl = await generateSignedUrl(contentItem.fileKey);

        res.json({
            success: true,
            url: signedUrl,
            title: contentItem.title,
            description: contentItem.description,
            contextName
        });
    } catch (error) {
        console.error('Error getting content URL:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
};

/**
 * Get all content for a subject (organized by type)
 */
const getSubjectContent = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId).lean();
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Organize content by type
        const content = {
            subjectInfo: {
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                credits: subject.credits,
                branch: subject.branch,
                cycle: subject.cycle
            },
            syllabus: subject.syllabus || [],
            resources: subject.resources || [],
            modules: subject.modules.map(m => ({
                moduleNumber: m.moduleNumber,
                title: m.title,
                notesKey: m.notesKey, // Legacy support
                notes: m.notes || [],
                pyqs: m.pyqs || [],
                questionBanks: m.questionBanks || [],
                questionsCount: m.questions?.length || 0
            }))
        };

        res.json(content);
    } catch (error) {
        console.error('Error getting subject content:', error);
        res.status(500).json({ error: 'Failed to get subject content' });
    }
};

module.exports = {
    getSubjectsByBranch,
    getSubjectById,
    markQuestionCompleted,
    calculateAndUpdateProgress,
    getModuleNotes,
    getContentUrl,
    getSubjectContent
};
