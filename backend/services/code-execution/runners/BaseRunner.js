/**
 * Abstract Base Runner Contract for Language Execution Runners
 */
class BaseRunner {
    constructor(languageSlug, languageName) {
        if (!languageSlug) {
            throw new Error('BaseRunner requires a languageSlug');
        }
        this.languageSlug = languageSlug.toLowerCase().trim();
        this.languageName = languageName || languageSlug;
    }

    /**
     * Standardized language execution contract
     * 
     * @param {Object} params
     * @param {string} params.code - Untrusted student source code
     * @param {string} [params.input=''] - Stdin stream input
     * @returns {Promise<{ status: string, stdout: string, stderr: string, exitCode: number|null, runtimeMs: number }>}
     */
    async execute({ code, input = '' }) {
        throw new Error(`execute() must be implemented by ${this.constructor.name}`);
    }
}

module.exports = BaseRunner;
