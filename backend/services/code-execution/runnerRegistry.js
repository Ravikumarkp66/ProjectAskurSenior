const CRunner = require('./runners/CRunner');
const CppRunner = require('./runners/CppRunner');
const JavaRunner = require('./runners/JavaRunner');
const PythonRunner = require('./runners/PythonRunner');

/**
 * Runner Registry & Resolver
 * 
 * Central catalog of language runners.
 * Milestone 10: Registers 'c', 'cpp', 'java', and 'python' runners.
 */
class RunnerRegistry {
    constructor() {
        this.runners = new Map();
        this.registerDefaultRunners();
    }

    registerDefaultRunners() {
        // Milestone 10: Register C, C++, Java, and Python runners
        const cRunner = new CRunner();
        const cppRunner = new CppRunner();
        const javaRunner = new JavaRunner();
        const pythonRunner = new PythonRunner();
        this.register(cRunner.languageSlug, cRunner);
        this.register(cppRunner.languageSlug, cppRunner);
        this.register(javaRunner.languageSlug, javaRunner);
        this.register(pythonRunner.languageSlug, pythonRunner);
    }

    /**
     * Register a language runner
     * @param {string} languageSlug 
     * @param {import('./runners/BaseRunner')} runner 
     */
    register(languageSlug, runner) {
        if (!languageSlug) {
            throw new Error('Language slug is required for registration');
        }
        this.runners.set(languageSlug.toLowerCase().trim(), runner);
    }

    /**
     * Resolve a runner for a given language
     * @param {string} languageSlug 
     * @returns {import('./runners/BaseRunner')|null}
     */
    getRunner(languageSlug) {
        if (!languageSlug) return null;
        return this.runners.get(languageSlug.toLowerCase().trim()) || null;
    }

    /**
     * Check if a language is supported for execution
     * @param {string} languageSlug 
     * @returns {boolean}
     */
    isSupported(languageSlug) {
        if (!languageSlug) return false;
        return this.runners.has(languageSlug.toLowerCase().trim());
    }

    /**
     * Get list of currently supported language slugs
     * @returns {string[]}
     */
    getSupportedLanguages() {
        return Array.from(this.runners.keys());
    }
}

const runnerRegistry = new RunnerRegistry();
module.exports = runnerRegistry;
