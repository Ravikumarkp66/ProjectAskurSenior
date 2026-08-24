const runnerRegistry = require('./runnerRegistry');
const CONFIG = require('./config');
const { parseDiagnostics } = require('./diagnosticParser');

/**
 * Generic Language-Independent Execution Service & Evaluator
 * 
 * Contains NO compiler commands, GCC/G++ references, or Docker image names.
 * Delegates execution to the appropriate runner resolved by runnerRegistry.
 */

/**
 * Normalize and compare actual output against expected output
 * 
 * @param {string} actual - Actual program stdout
 * @param {string} expected - Expected output from database
 * @returns {boolean} Whether normalized outputs match
 */
function compareOutputs(actual, expected) {
    if (typeof actual !== 'string' || typeof expected !== 'string') {
        return false;
    }
    // Normalize Windows/Linux line endings and trim surrounding whitespace
    const normActual = actual.replace(/\r\n/g, '\n').trim();
    const normExpected = expected.replace(/\r\n/g, '\n').trim();
    return normActual === normExpected;
}

/**
 * Execute code using the resolved language runner
 * 
 * @param {Object} params
 * @param {string} params.language - Language slug (e.g. 'c')
 * @param {string} params.code - Source code
 * @param {string} [params.input=''] - Stdin stream input
 * @returns {Promise<Object>} Standardized execution response
 */
async function executeCode({ language, code, input = '' }) {
    if (!language) {
        const err = new Error('Language is required for execution');
        err.statusCode = 400;
        throw err;
    }

    const runner = runnerRegistry.getRunner(language);
    if (!runner) {
        const supported = runnerRegistry.getSupportedLanguages();
        const err = new Error(`Unsupported language '${language}'. Supported languages: [${supported.join(', ')}].`);
        err.statusCode = 400;
        throw err;
    }

    const execRes = await runner.execute({ code, input });
    const diagnostics = parseDiagnostics({
        stderr: execRes.stderr,
        language,
        status: execRes.status
    });

    return {
        ...execRes,
        diagnostics
    };
}

/**
 * Language-agnostic test case evaluator
 * 
 * Evaluates student code against an array of test cases from MongoDB
 * using the resolved language runner.
 * 
 * @param {Object} params
 * @param {string} params.language - Language slug
 * @param {string} params.code - Student source code
 * @param {Array} params.testCases - Array of PlaygroundTestCase objects from MongoDB
 * @returns {Promise<Object>} Standardized evaluation summary and per-case results
 */
async function evaluateProblemTestCases({ language, code, testCases = [] }) {
    if (!language) {
        const err = new Error('Language is required for evaluation');
        err.statusCode = 400;
        throw err;
    }

    const runner = runnerRegistry.getRunner(language);
    if (!runner) {
        const supported = runnerRegistry.getSupportedLanguages();
        const err = new Error(`Unsupported language '${language}'. Supported languages: [${supported.join(', ')}].`);
        err.statusCode = 400;
        throw err;
    }

    if (!testCases || testCases.length === 0) {
        return {
            status: 'no_test_cases',
            diagnostics: [],
            summary: { total: 0, passed: 0, failed: 0, executed: 0 },
            testCases: []
        };
    }

    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const caseNumber = i + 1;
        const testCaseId = tc._id ? tc._id.toString() : (tc.id || `tc-${caseNumber}`);

        // Execute against resolved language runner
        const execRes = await runner.execute({
            code,
            input: tc.input || ''
        });

        // Check for compilation failure (compilation failed before any test case could run)
        if (execRes.status === 'compilation_error') {
            const diagnostics = parseDiagnostics({
                stderr: execRes.stderr,
                language,
                status: 'compilation_error'
            });

            return {
                status: 'compilation_error',
                stderr: execRes.stderr,
                diagnostics,
                summary: {
                    total: testCases.length,
                    passed: 0,
                    failed: 0,
                    executed: 0
                },
                testCases: []
            };
        }

        // Evaluate output if execution completed
        let caseStatus = execRes.status; // 'success' | 'runtime_error' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'output_limit_exceeded'

        if (execRes.status === 'success') {
            const isMatch = compareOutputs(execRes.stdout, tc.expectedOutput);
            if (isMatch) {
                caseStatus = 'passed';
                passedCount++;
            } else {
                caseStatus = 'wrong_answer';
                failedCount++;
            }
        } else {
            failedCount++;
        }

        results.push({
            testCaseId,
            caseNumber,
            name: `Case ${caseNumber}`,
            status: caseStatus,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: execRes.stdout || '',
            stderr: execRes.stderr || '',
            runtimeMs: execRes.runtimeMs || 0
        });
    }

    // Check for runtime error diagnostics if any test case threw a runtime exception
    let diagnostics = [];
    const firstRuntimeErr = results.find(r => r.status === 'runtime_error');
    if (firstRuntimeErr && firstRuntimeErr.stderr) {
        diagnostics = parseDiagnostics({
            stderr: firstRuntimeErr.stderr,
            language,
            status: 'runtime_error'
        });
    }

    return {
        status: 'evaluated',
        stderr: '',
        diagnostics,
        summary: {
            total: testCases.length,
            passed: passedCount,
            failed: failedCount,
            executed: results.length
        },
        testCases: results
    };
}

module.exports = {
    executeCode,
    evaluateProblemTestCases,
    compareOutputs,
    runnerRegistry,
    parseDiagnostics,
    CONFIG
};
