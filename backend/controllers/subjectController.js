const Subject = require('../models/Subject');
const Progress = require('../models/Progress');

const getSubjectsByBranch = async (req, res) => {
    try {
        const { branch } = req.params;
        const { cycle } = req.query;

        const query = { branch };
        if (cycle === 'P' || cycle === 'C') query.cycle = cycle;

        const subjects = await Subject.find(query)
            .sort({ credits: -1, code: 1 })
            .select('-__v');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

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

module.exports = {
    getSubjectsByBranch,
    getSubjectById,
    markQuestionCompleted,
    calculateAndUpdateProgress
};
