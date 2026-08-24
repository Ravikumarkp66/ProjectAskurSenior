import { apiClient } from '../../../services/api/apiClient';

/**
 * Fetch dynamic curriculum tree (Languages -> Labs -> Programs) with student progress
 */
export async function fetchPlaygroundTree() {
    const res = await apiClient.get('/playground/tree');
    return res.data;
}

/**
 * Fetch single problem details and language-specific starter code
 */
export async function fetchProblemDetails(slugOrId, languageSlug = '') {
    const url = languageSlug 
        ? `/playground/problems/${slugOrId}?language=${encodeURIComponent(languageSlug)}`
        : `/playground/problems/${slugOrId}`;
    const res = await apiClient.get(url);
    return res.data?.problem;
}

/**
 * Fetch public sample test cases for problem
 */
export async function fetchProblemTestCases(slugOrId) {
    const res = await apiClient.get(`/playground/problems/${slugOrId}/testcases`);
    return res.data?.testCases || [];
}

/**
 * Fetch problem editorial & viva voce Q&A
 */
export async function fetchProblemEditorial(slugOrId) {
    const res = await apiClient.get(`/playground/problems/${slugOrId}/editorial`);
    return res.data;
}

/**
 * Fetch peer discussions from database
 */
export async function fetchProblemDiscussions(slugOrId) {
    const res = await apiClient.get(`/playground/problems/${slugOrId}/discussions`);
    return res.data?.discussions || [];
}

/**
 * Post a new discussion comment
 */
export async function postProblemDiscussion(slugOrId, content) {
    const res = await apiClient.post(`/playground/problems/${slugOrId}/discussions`, { content });
    return res.data?.discussion;
}

/**
 * Toggle upvote on a discussion comment
 */
export async function toggleUpvoteDiscussion(discussionId) {
    const res = await apiClient.post(`/playground/discussions/${discussionId}/upvote`);
    return res.data;
}

/**
 * Fetch student submissions history for a problem
 */
export async function fetchProblemSubmissions(slugOrId) {
    const res = await apiClient.get(`/playground/problems/${slugOrId}/submissions`);
    return res.data?.submissions || [];
}

/**
 * Submit student solution code for evaluation
 */
export async function submitProblemCode(slugOrId, languageSlug, code) {
    const res = await apiClient.post(`/playground/problems/${slugOrId}/submit`, {
        languageSlug,
        code
    });
    return res.data;
}

/**
 * Fetch overall student progress stats from database
 */
export async function fetchStudentProgress() {
    const res = await apiClient.get('/playground/progress');
    return res.data?.stats;
}

/**
 * Execute student code against local Docker sandbox (Milestone 3)
 */
export async function executeCode(language, code, input = '') {
    const res = await apiClient.post('/playground/execute', {
        language,
        code,
        input
    });
    return res.data;
}

/**
 * Evaluate student code against all database test cases for a problem (Milestone 5)
 */
export async function evaluateProblemCode(slugOrId, language, code) {
    const res = await apiClient.post(`/playground/problems/${slugOrId}/evaluate`, {
        language: language || 'c',
        languageSlug: language || 'c',
        code
    });
    return res.data;
}


