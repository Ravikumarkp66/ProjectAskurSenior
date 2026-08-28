/**
 * Code Execution Service (Milestone 7 - Multi-Language Runner Abstraction)
 * 
 * Re-exports the modular, language-independent execution service.
 */

const {
    executeCode,
    evaluateProblemTestCases,
    compareOutputs,
    checkDockerAvailability,
    runnerRegistry,
    CONFIG
} = require('./code-execution/executionService');

module.exports = {
    executeCode,
    evaluateProblemTestCases,
    compareOutputs,
    checkDockerAvailability,
    runnerRegistry,
    CONFIG
};
