const runnerRegistry = require('./runnerRegistry');
const CONFIG = require('./config');
const { parseDiagnostics } = require('./diagnosticParser');
const { checkDockerAvailability } = require('./dockerHealth');

/**
 * Generic Language-Independent Execution Service & Evaluator
 * 
 * Direct Local Docker Execution Mode (EC2 Staging & Production):
 * Executes untrusted student code directly inside hardened local Docker containers
 * via runnerRegistry and specialized BaseRunner implementations.
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
 * Execute code directly using local Docker sandbox containers
 * 
 * @param {Object} params
 * @param {string} params.language - Language slug (e.g. 'c', 'cpp', 'java', 'python')
 * @param {string} params.code - Source code
 * @param {string} [params.input=''] - Stdin stream input
 * @returns {Promise<Object>} Standardized execution response
 */
async function executeCode({ language, code, input = '' }) {
    console.log(`[ExecutionService] executeCode called: language="${language}", codeBytes=${Buffer.byteLength(code || '', 'utf8')}, inputBytes=${Buffer.byteLength(input || '', 'utf8')}, mode="LOCAL_DOCKER"`);

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

    const startTime = Date.now();
    const execRes = await runner.execute({ code, input });
    const diagnostics = parseDiagnostics({
        stderr: execRes.stderr,
        language,
        status: execRes.status
    });

    const totalElapsed = Date.now() - startTime;
    console.log(`[ExecutionService] Docker execution completed: language="${language}", status="${execRes.status}", exitCode=${execRes.exitCode}, runtimeMs=${execRes.runtimeMs}ms, totalElapsed=${totalElapsed}ms`);

    return {
        ...execRes,
        diagnostics
    };
}

/**
 * Language-agnostic test case evaluator
 * 
 * Evaluates student code against an array of test cases from MongoDB
 * using the active execution pipeline (remote EC2 or local Docker).
 * 
 * @param {Object} params
 * @param {string} params.language - Language slug
 * @param {string} params.code - Student source code
 * @param {Array} params.testCases - Array of PlaygroundTestCase objects from MongoDB
 * @returns {Promise<Object>} Standardized evaluation summary and per-case results
 */
async function evaluateProblemTestCases({ language, code, testCases = [] }) {
    console.log(`[ExecutionService] evaluateProblemTestCases called: language="${language}", testCasesCount=${testCases.length}, codeBytes=${Buffer.byteLength(code || '', 'utf8')}`);

    if (!language) {
        const err = new Error('Language is required for evaluation');
        err.statusCode = 400;
        throw err;
    }

    if (!testCases || testCases.length === 0) {
        console.warn(`[ExecutionService] No test cases provided for evaluation.`);
        return {
            status: 'no_test_cases',
            diagnostics: [],
            summary: { total: 0, passed: 0, failed: 0, executed: 0 },
            testCases: []
        };
    }

    const startTime = Date.now();
    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const caseNumber = i + 1;
        const testCaseId = tc._id ? tc._id.toString() : (tc.id || `tc-${caseNumber}`);

        console.log(`[ExecutionService] Evaluating testcase ${caseNumber}/${testCases.length} (ID: ${testCaseId}, isSample: ${!!tc.isSample})...`);

        // Execute against active pipeline (remote EC2 or local Docker)
        const execRes = await executeCode({
            language,
            code,
            input: tc.input || ''
        });

        // Check for compilation failure (compilation failed before any test case could run)
        if (execRes.status === 'compilation_error') {
            console.warn(`[ExecutionService] Compilation error detected on testcase ${caseNumber}: ${execRes.stderr.slice(0, 200)}`);
            const diagnostics = execRes.diagnostics || parseDiagnostics({
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

        console.log(`[ExecutionService] Testcase ${caseNumber}/${testCases.length} result: Status="${caseStatus}", ExitCode=${execRes.exitCode}, Runtime=${execRes.runtimeMs}ms`);

        // Push test case result
        results.push({
            caseNumber,
            testCaseId,
            name: tc.name || `Case ${caseNumber}`,
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            actualOutput: execRes.stdout || '',
            stderr: execRes.stderr || '',
            status: caseStatus,
            exitCode: execRes.exitCode,
            runtimeMs: execRes.runtimeMs,
            isSample: !!tc.isSample
        });
    }

    const totalElapsed = Date.now() - startTime;
    const finalEvaluationStatus = failedCount === 0 ? 'accepted' : 'rejected';

    console.log(`[ExecutionService] Problem evaluation finished: TotalCases=${testCases.length}, Passed=${passedCount}, Failed=${failedCount}, Status="${finalEvaluationStatus}", TotalElapsed=${totalElapsed}ms`);

    return {
        status: finalEvaluationStatus,
        diagnostics: [],
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
    checkDockerAvailability,
    runnerRegistry,
    CONFIG
};
