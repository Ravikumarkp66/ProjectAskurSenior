const AcademicSubject = require('../models/AcademicSubject');
const PlaygroundLanguage = require('../models/PlaygroundLanguage');
const PlaygroundLab = require('../models/PlaygroundLab');
const PlaygroundProblem = require('../models/PlaygroundProblem');
const PlaygroundProblemLanguage = require('../models/PlaygroundProblemLanguage');
const PlaygroundTestCase = require('../models/PlaygroundTestCase');
const PlaygroundEditorial = require('../models/PlaygroundEditorial');
const PlaygroundSubmission = require('../models/PlaygroundSubmission');
const PlaygroundDiscussion = require('../models/PlaygroundDiscussion');
const StudentAccount = require('../models/StudentAccount');
const codeExecutionService = require('../services/codeExecutionService');

// In-flight active submission locks to prevent double-click submissions
const activeSubmissions = new Set();

function normalizeExecutableLanguage(langInput) {
    if (!langInput) return 'c';
    const str = langInput.toString().toLowerCase().trim();
    if (str === 'python' || str === 'py' || str === 'plc6' || str.includes('python')) return 'python';
    if (str === 'cpp' || str === 'c++') return 'cpp';
    if (str === 'java') return 'java';
    return 'c'; // Default to C for pscl5 or any C subjects
}


/**
 * GET /api/playground/tree
 * Returns curriculum tree for 1st Year lab subjects: PSCL5, PLC5, PLC6
 */
exports.getPlaygroundTree = async (req, res) => {
    try {
        const studentId = req.userId;

        // Fetch active language tracks, labs, problems
        const [languages, labs, problems] = await Promise.all([
            PlaygroundLanguage.find({ isActive: true }).sort({ displayOrder: 1 }),
            PlaygroundLab.find({ isActive: true }).sort({ displayOrder: 1 }),
            PlaygroundProblem.find({ isActive: true }).sort({ displayOrder: 1 })
        ]);

        // Get solved problem IDs for authenticated student
        let solvedProblemIds = new Set();
        if (studentId) {
            const acceptedSubmissions = await PlaygroundSubmission.find({
                studentId,
                status: 'Accepted'
            }).distinct('problemId');
            solvedProblemIds = new Set(acceptedSubmissions.map(id => id.toString()));
        }

        // Build problem list indexed by labId
        const problemMapByLab = {};
        for (const prob of problems) {
            const labKey = prob.labId.toString();
            if (!problemMapByLab[labKey]) {
                problemMapByLab[labKey] = [];
            }
            problemMapByLab[labKey].push({
                id: prob._id,
                title: prob.title,
                slug: prob.slug,
                programNumber: prob.programNumber,
                shortObjective: prob.shortObjective,
                difficulty: prob.difficulty,
                concepts: prob.concepts,
                isCompleted: solvedProblemIds.has(prob._id.toString())
            });
        }

        // Map labs under each specific subject track (by courseCode / subjectId)
        const treeLanguages = languages.map(track => {
            const trackLabs = labs
                .filter(lab => {
                    if (track.courseCode && lab.courseCode) {
                        return lab.courseCode.toUpperCase() === track.courseCode.toUpperCase();
                    }
                    if (track.subjectId && lab.subjectId) {
                        return lab.subjectId.toString() === track.subjectId.toString();
                    }
                    return false;
                })
                .map(lab => ({
                    id: lab._id,
                    labNumber: lab.labNumber,
                    title: lab.title,
                    slug: lab.slug,
                    description: lab.description,
                    courseCode: lab.courseCode,
                    programs: problemMapByLab[lab._id.toString()] || []
                }))
                .filter(lab => lab.programs.length > 0);

            const effectiveLang = (track.languageSlug === 'python' || track.slug === 'plc6' || track.courseCode === 'PLC6' || track.name?.toLowerCase().includes('python')) ? 'python' : 'c';

            return {
                id: track._id,
                name: track.name,
                slug: track.slug,
                languageSlug: effectiveLang,
                fullName: track.fullName || track.name,
                identifier: track.identifier || effectiveLang,
                version: track.version || (effectiveLang === 'python' ? 'Python 3.11' : 'GCC 12.2'),
                fileExtension: track.fileExtension || (effectiveLang === 'python' ? '.py' : '.c'),
                accentColor: track.accentColor || (effectiveLang === 'python' ? '#FACC15' : '#38BDF8'),
                borderColor: track.borderColor || 'rgba(56, 189, 248, 0.4)',
                bgGlow: track.bgGlow || 'rgba(56, 189, 248, 0.08)',
                badge: track.badge || track.courseCode,
                courseCode: track.courseCode,
                subjectId: track.subjectId,
                labs: trackLabs
            };
        });

        // Compute total and completed counts
        const totalProblems = problems.length;
        const completedProblems = solvedProblemIds.size;

        res.json({
            success: true,
            languages: treeLanguages,
            stats: {
                totalProblems,
                completedProblems,
                percent: totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching playground tree:', error);
        res.status(500).json({ error: 'Failed to load playground curriculum tree' });
    }
};

/**
 * GET /api/playground/problems/:slugOrId
 * Returns problem details and language configuration
 */
exports.getProblemDetails = async (req, res) => {
    try {
        const { slugOrId } = req.params;
        const requestedLang = req.query.language?.toLowerCase();

        // Query by slug or Mongo ObjectId
        const query = slugOrId.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: slugOrId, isActive: true }
            : { slug: slugOrId, isActive: true };

        const problem = await PlaygroundProblem.findOne(query).populate('labId');
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found in curriculum database' });
        }

        // Fetch available language configs for this problem
        const configs = await PlaygroundProblemLanguage.find({
            problemId: problem._id,
            isActive: true
        });

        const availableLanguages = configs.map(c => c.languageSlug);

        // Find specific config for requested language (or first available)
        let selectedConfig = null;
        if (requestedLang) {
            selectedConfig = configs.find(c => c.languageSlug === requestedLang);
        }
        if (!selectedConfig && configs.length > 0) {
            selectedConfig = configs[0];
        }

        res.json({
            success: true,
            problem: {
                id: problem._id,
                title: problem.title,
                slug: problem.slug,
                programNumber: problem.programNumber,
                shortObjective: problem.shortObjective,
                description: problem.description,
                inputFormat: problem.inputFormat,
                outputFormat: problem.outputFormat,
                constraints: problem.constraints,
                examples: problem.examples,
                quiz: problem.quiz,
                difficulty: problem.difficulty,
                concepts: problem.concepts,
                hints: problem.hints,
                lab: problem.labId ? {
                    id: problem.labId._id,
                    labNumber: problem.labId.labNumber,
                    title: problem.labId.title,
                    slug: problem.labId.slug
                } : null,
                availableLanguages,
                languageConfig: selectedConfig ? {
                    languageSlug: selectedConfig.languageSlug,
                    starterCode: selectedConfig.starterCode,
                    functionSignature: selectedConfig.functionSignature
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching problem details:', error);
        res.status(500).json({ error: 'Failed to load problem details' });
    }
};

/**
 * GET /api/playground/problems/:slugOrId/testcases
 * Returns all test cases for the problem for the college lab playground
 */
exports.getProblemTestCases = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Return ALL test cases for college playground transparency
        const testCases = await PlaygroundTestCase.find({
            problemId: problem._id
        }).sort({ displayOrder: 1 });

        res.json({
            success: true,
            testCases: testCases.map((tc, idx) => ({
                id: tc._id,
                name: `Case ${idx + 1}`,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                displayOrder: tc.displayOrder || (idx + 1)
            }))
        });
    } catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ error: 'Failed to load test cases' });
    }
};

/**
 * GET /api/playground/problems/:slugOrId/editorial
 * Returns editorial if published, otherwise returns honest empty state
 */
exports.getProblemEditorial = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const editorial = await PlaygroundEditorial.findOne({
            problemId: problem._id,
            isPublished: true
        });

        if (!editorial) {
            return res.json({
                success: true,
                isAvailable: false,
                message: 'Editorial is not available yet.'
            });
        }

        res.json({
            success: true,
            isAvailable: true,
            editorial: {
                approach: editorial.approach,
                timeComplexity: editorial.timeComplexity,
                spaceComplexity: editorial.spaceComplexity,
                stepByStep: editorial.stepByStep,
                vivaQuestions: editorial.vivaQuestions
            }
        });
    } catch (error) {
        console.error('Error fetching editorial:', error);
        res.status(500).json({ error: 'Failed to load editorial' });
    }
};

/**
 * GET /api/playground/problems/:slugOrId/discussions
 * Returns discussions from database
 */
exports.getProblemDiscussions = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const discussions = await PlaygroundDiscussion.find({
            problemId: problem._id
        }).sort({ createdAt: -1 });

        const currentUserId = req.userId ? req.userId.toString() : null;

        const formatted = discussions.map(d => ({
            id: d._id,
            authorName: d.authorName,
            authorRole: d.authorRole,
            content: d.content,
            upvotes: d.upvoteCount || 0,
            hasUpvoted: currentUserId ? d.upvotes.some(uid => uid.toString() === currentUserId) : false,
            createdAt: d.createdAt
        }));

        res.json({
            success: true,
            discussions: formatted
        });
    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ error: 'Failed to load discussions' });
    }
};

/**
 * POST /api/playground/problems/:slugOrId/discussions
 * Create a new student discussion
 */
exports.postDiscussion = async (req, res) => {
    try {
        const { slugOrId } = req.params;
        const { content } = req.body;
        const studentId = req.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Discussion content cannot be empty' });
        }

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Fetch student name
        let studentName = 'Student';
        const student = await StudentAccount.findById(studentId);
        if (student) {
            studentName = student.name || student.email?.split('@')[0] || 'Student';
        }

        const newDiscussion = await PlaygroundDiscussion.create({
            problemId: problem._id,
            studentId,
            authorName: studentName,
            authorRole: 'Student',
            content: content.trim(),
            upvotes: [],
            upvoteCount: 0
        });

        res.status(201).json({
            success: true,
            discussion: {
                id: newDiscussion._id,
                authorName: newDiscussion.authorName,
                authorRole: newDiscussion.authorRole,
                content: newDiscussion.content,
                upvotes: 0,
                hasUpvoted: false,
                createdAt: newDiscussion.createdAt
            }
        });
    } catch (error) {
        console.error('Error posting discussion:', error);
        res.status(500).json({ error: 'Failed to post discussion' });
    }
};

/**
 * POST /api/playground/discussions/:id/upvote
 * Toggle upvote on a discussion
 */
exports.toggleUpvoteDiscussion = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.userId;

        const discussion = await PlaygroundDiscussion.findById(id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        const index = discussion.upvotes.findIndex(uid => uid.toString() === studentId.toString());
        let hasUpvoted = false;

        if (index === -1) {
            discussion.upvotes.push(studentId);
            hasUpvoted = true;
        } else {
            discussion.upvotes.splice(index, 1);
            hasUpvoted = false;
        }

        discussion.upvoteCount = discussion.upvotes.length;
        await discussion.save();

        res.json({
            success: true,
            hasUpvoted,
            upvotes: discussion.upvoteCount
        });
    } catch (error) {
        console.error('Error upvoting discussion:', error);
        res.status(500).json({ error: 'Failed to update upvote' });
    }
};

/**
 * GET /api/playground/problems/:slugOrId/submissions
 * Get student's submission history for a problem
 */
exports.getProblemSubmissions = async (req, res) => {
    try {
        const { slugOrId } = req.params;
        const studentId = req.userId;

        if (!studentId) {
            return res.json({ success: true, submissions: [] });
        }

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const submissions = await PlaygroundSubmission.find({
            studentId,
            problemId: problem._id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            submissions: submissions.map(s => ({
                id: s._id,
                status: s.status,
                languageSlug: s.languageSlug,
                code: s.code,
                runtime: s.runtime,
                memory: s.memory,
                passedTestCases: s.passedTestCases,
                totalTestCases: s.totalTestCases,
                testCaseResults: s.testCaseResults || [],
                stderr: s.stderr || '',
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to load submissions' });
    }
};

/**
 * POST /api/playground/problems/:slugOrId/submit
 * Evaluates student code against all MongoDB test cases and records a real submission
 */
exports.submitProblem = async (req, res) => {
    const studentId = req.userId;
    if (!studentId) {
        return res.status(401).json({ error: 'Authentication required to submit code' });
    }

    const { slugOrId } = req.params;
    const { languageSlug, code } = req.body;

    if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Code cannot be empty' });
    }

    const lang = normalizeExecutableLanguage(languageSlug || req.body.language);
const submissionLockKey = `${studentId}_${slugOrId}`;
    if (activeSubmissions.has(submissionLockKey)) {
        return res.status(429).json({ error: 'Submission already in progress. Please wait.' });
    }

    activeSubmissions.add(submissionLockKey);

    try {
        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Fetch all test cases for this problem from MongoDB
        const testCases = await PlaygroundTestCase.find({ problemId: problem._id }).sort({ displayOrder: 1 });

        if (!testCases || testCases.length === 0) {
            return res.status(400).json({ error: 'No test cases available to evaluate this problem.' });
        }

        // Execute code against test cases using the language-agnostic evaluation service
        const evaluation = await codeExecutionService.evaluateProblemTestCases({
            language: lang,
            code,
            testCases
        });

        // Determine final submission status
        let finalStatus = 'Accepted';

        if (evaluation.status === 'compilation_error') {
            finalStatus = 'Compilation Error';
        } else if (evaluation.summary.passed === evaluation.summary.total) {
            finalStatus = 'Accepted';
        } else {
            // Find first failing test case to classify status
            const firstFail = evaluation.testCases.find(tc => tc.status !== 'passed');
            if (firstFail) {
                if (firstFail.status === 'time_limit_exceeded') {
                    finalStatus = 'Time Limit Exceeded';
                } else if (firstFail.status === 'memory_limit_exceeded') {
                    finalStatus = 'Memory Limit Exceeded';
                } else if (firstFail.status === 'output_limit_exceeded') {
                    finalStatus = 'Output Limit Exceeded';
                } else if (firstFail.status === 'runtime_error') {
                    finalStatus = 'Runtime Error';
                } else if (firstFail.status === 'compilation_error') {
                    finalStatus = 'Compilation Error';
                } else {
                    finalStatus = 'Wrong Answer';
                }
            } else {
                finalStatus = 'Wrong Answer';
            }
        }

        // Calculate total runtime across executed cases
        const totalRuntimeMs = (evaluation.testCases || []).reduce((sum, tc) => sum + (tc.runtimeMs || 0), 0);

        // Record exactly ONE PlaygroundSubmission in MongoDB (memory is null when not measured)
        const submission = await PlaygroundSubmission.create({
            studentId,
            problemId: problem._id,
            languageSlug: lang,
            code,
            status: finalStatus,
            runtime: `${totalRuntimeMs}ms`,
            memory: null,
            passedTestCases: evaluation.summary.passed,
            totalTestCases: evaluation.summary.total,
            testCaseResults: evaluation.testCases || [],
            stderr: evaluation.stderr || ''
        });

        return res.status(201).json({
            success: true,
            submission: {
                id: submission._id,
                status: submission.status,
                languageSlug: submission.languageSlug,
                code: submission.code,
                runtime: submission.runtime,
                memory: submission.memory,
                passedTestCases: submission.passedTestCases,
                totalTestCases: submission.totalTestCases,
                testCaseResults: submission.testCaseResults,
                stderr: submission.stderr,
                createdAt: submission.createdAt
            },
            evaluation
        });
    } catch (error) {
        console.error('Error submitting code:', error);
        return res.status(500).json({ error: error.message || 'Failed to evaluate and save submission' });
    } finally {
        activeSubmissions.delete(submissionLockKey);
    }
};

/**
 * GET /api/playground/progress
 * Get student overall solved counts & progress from database
 */
exports.getStudentProgress = async (req, res) => {
    try {
        const studentId = req.userId;

        const totalProblems = await PlaygroundProblem.countDocuments({ isActive: true });

        let completedProblems = 0;
        if (studentId) {
            const solved = await PlaygroundSubmission.find({
                studentId,
                status: 'Accepted'
            }).distinct('problemId');
            completedProblems = solved.length;
        }

        res.json({
            success: true,
            stats: {
                totalProblems,
                completedProblems,
                percent: totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({ error: 'Failed to load progress' });
    }
};

/**
 * POST /api/playground/execute
 * Execute student code inside Docker sandbox container
 */
exports.executeCode = async (req, res) => {
    try {
        const { language, code, input } = req.body;

        const lang = normalizeExecutableLanguage(language);
if (code === undefined || code === null) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const result = await codeExecutionService.executeCode({
            language: lang,
            code,
            input: typeof input === 'string' ? input : (input ? String(input) : '')
        });

        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Code execution error:', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Execution service failed'
        });
    }
};

/**
 * POST /api/playground/problems/:slugOrId/evaluate
 * Evaluates student code against all MongoDB test cases for the problem
 */
exports.evaluateProblem = async (req, res) => {
    try {
        const { slugOrId } = req.params;
        const { language, languageSlug, code } = req.body;
        const lang = normalizeExecutableLanguage(languageSlug || language);
if (code === undefined || code === null) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const problem = await PlaygroundProblem.findOne(
            slugOrId.match(/^[0-9a-fA-F]{24}$/) ? { _id: slugOrId } : { slug: slugOrId }
        );

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Fetch ALL test cases for this problem from MongoDB
        const testCases = await PlaygroundTestCase.find({
            problemId: problem._id
        }).sort({ displayOrder: 1 });

        if (!testCases || testCases.length === 0) {
            return res.json({
                success: true,
                status: 'no_test_cases',
                problemId: problem._id,
                problemTitle: problem.title,
                language: lang,
                summary: { total: 0, passed: 0, failed: 0 },
                testCases: []
            });
        }

        const evaluation = await codeExecutionService.evaluateProblemTestCases({
            language: lang,
            code,
            testCases
        });

        return res.json({
            success: true,
            problemId: problem._id,
            problemTitle: problem.title,
            language: lang,
            ...evaluation
        });
    } catch (error) {
        console.error('Problem evaluation error:', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Problem evaluation failed'
        });
    }
};


