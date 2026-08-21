const subjectService = require('../services/subjectService');
const Subject = require('../models/Subject');
const Progress = require('../models/Progress');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicMaterial = require('../models/AcademicMaterial');
const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../utils/s3Client");

const getSubjectsByBranch = async (req, res) => {
    try {
        const { branch } = req.params;
        const { cycle } = req.query;

        const subjects = await subjectService.getSubjectsByBranch(branch, cycle);
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllSubjects = async (req, res) => {
    try {
        const { year, semester, branch, cycle } = req.query;

        const uniqueSubjects = await subjectService.getAllUniqueSubjects(year, semester, branch, cycle);
        res.json(uniqueSubjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await subjectService.getSubjectById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSubjectsByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const subjects = await subjectService.getSubjectsByCode(code);
        res.json(subjects);
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

        let totalQuestions = 0;
        let completedQuestions = 0;

        subject.modules.forEach((module) => {
            const moduleTotal = module.questions.length;
            const moduleCompleted = module.questions.filter((q) => q.completed).length;

            totalQuestions += moduleTotal;
            completedQuestions += moduleCompleted;

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

        try {
            const headCmd = new HeadObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME || 'askursenior-notes-storage',
                Key: module.notesKey
            });
            await s3.send(headCmd);
        } catch (s3Err) {
            if (s3Err.name === 'NotFound' || s3Err.$metadata?.httpStatusCode === 404) {
                return res.status(404).json({ error: "File no longer exists in storage (it may have been deleted)." });
            }
            throw s3Err;
        }

        const encodedKey = module.notesKey.split('/').map(encodeURIComponent).join('/');
        const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${encodedKey}`;

        res.json({
            success: true,
            url: fileUrl,
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

        if (['notes', 'pyqs', 'questionBanks', 'syllabus', 'resources'].includes(contentType)) {
            contentItem = subject[contentType]?.find(c => c._id.toString() === contentId);
        }

        if (!contentItem && moduleNumber) {
            const module = subject.modules.find(m => m.moduleNumber === parseInt(moduleNumber));
            if (module && module[contentType]) {
                contentItem = module[contentType]?.find(c => c._id.toString() === contentId);
                contextName = `${subject.name} - ${module.title}`;
            }
        }

        if (!contentItem) {
            return res.status(404).json({ error: 'Content not found' });
        }

        try {
            const headCmd = new HeadObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME || 'askursenior-notes-storage',
                Key: contentItem.fileKey
            });
            await s3.send(headCmd);
        } catch (s3Err) {
            if (s3Err.name === 'NotFound' || s3Err.$metadata?.httpStatusCode === 404) {
                return res.status(404).json({ error: "File no longer exists in storage (it may have been deleted)." });
            }
            throw s3Err;
        }

        const encodedKey = contentItem.fileKey.split('/').map(encodeURIComponent).join('/');
        const fileUrl = `https://d2mh2rnmjqdkgx.cloudfront.net/${encodedKey}`;

        res.json({
            success: true,
            url: fileUrl,
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

        const subject = await subjectService.getSubjectById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const content = {
            subjectInfo: {
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                credits: subject.credits,
                branch: subject.branch,
                cycle: subject.cycle
            },
            notes: subject.notes || [],
            pyqs: subject.pyqs || [],
            questionBanks: subject.questionBanks || [],
            syllabus: subject.syllabus || [],
            resources: subject.resources || [],
            modules: subject.modules.map(m => ({
                moduleNumber: m.moduleNumber,
                title: m.title,
                notesKey: m.notesKey,
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

const computeYearStatsHelper = async (yearName) => {
    const cmsSubjects = await AcademicSubject.find({ year: yearName }).select('_id name').lean();
    const cmsSubjectIds = cmsSubjects.map(s => s._id);

    const topSubjects = cmsSubjects.slice(0, 3).map(s => s.name);

    const [notesCount, pyqsCount, qbanksCount, othersCount] = await Promise.all([
        AcademicMaterial.countDocuments({ subject: { $in: cmsSubjectIds }, materialType: 'Notes', status: 'Published', deletedAt: null }),
        AcademicMaterial.countDocuments({ subject: { $in: cmsSubjectIds }, materialType: 'SEE', status: 'Published', deletedAt: null }),
        AcademicMaterial.countDocuments({ subject: { $in: cmsSubjectIds }, materialType: 'Internals', status: 'Published', deletedAt: null }),
        AcademicMaterial.countDocuments({ subject: { $in: cmsSubjectIds }, materialType: 'Others', status: 'Published', deletedAt: null }),
    ]);

    const totalMaterials = notesCount + pyqsCount + qbanksCount + othersCount;

    return {
        subjectsCount: cmsSubjects.length,
        materialsCount: totalMaterials,
        topSubjects,
        breakdown: {
            notes: notesCount,
            pyqs: pyqsCount,
            qbanks: qbanksCount,
            others: othersCount
        }
    };
};

const getFirstYearStats = async (req, res) => {
    try {
        const stats = await computeYearStatsHelper('1st Year');
        res.json(stats);
    } catch (error) {
        console.error('Error getting first year stats:', error);
        res.status(500).json({ error: 'Failed to get first year stats' });
    }
};

const getYearStats = async (req, res) => {
    try {
        const VALID_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        const rawYear = decodeURIComponent(req.params.year || '');
        const year = rawYear.replace(/-/g, ' ');

        if (!VALID_YEARS.includes(year)) {
            return res.status(400).json({ error: `Invalid year. Must be one of: ${VALID_YEARS.join(', ')}` });
        }

        const stats = await computeYearStatsHelper(year);
        res.json({ year, ...stats });
    } catch (error) {
        console.error('Error getting year stats:', error);
        res.status(500).json({ error: 'Failed to get year stats' });
    }
};

module.exports = {
    getAllSubjects,
    getSubjectsByBranch,
    getSubjectById,
    getSubjectsByCode,
    markQuestionCompleted,
    calculateAndUpdateProgress,
    getModuleNotes,
    getContentUrl,
    getSubjectContent,
    getFirstYearStats,
    getYearStats
};
