const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');
const BaseRunner = require('./BaseRunner');
const CONFIG = require('../config');

/**
 * C Language Execution Runner (GCC 14)
 * 
 * Executes student C source code inside askursenior-c-runner Docker container
 * with full security sandbox constraints.
 */
class CRunner extends BaseRunner {
    constructor() {
        super('c', 'C (GCC 14)');
        this.imageName = CONFIG.IMAGES.c || 'askursenior-c-runner:latest';
    }

    /**
     * Force kill a Docker container by name asynchronously
     * @param {string} containerName 
     */
    forceKillContainer(containerName) {
        if (!containerName) return;
        exec(`docker kill ${containerName}`, () => {
            // Container might have already exited cleanly with --rm
        });
    }

    /**
     * Execute C source code inside the hardened Docker sandbox
     * 
     * @param {Object} params
     * @param {string} params.code - Untrusted student C source code
     * @param {string} [params.input=''] - Stdin piped to the program
     * @returns {Promise<{ status: string, stdout: string, stderr: string, exitCode: number|null, runtimeMs: number }>}
     */
    async execute({ code, input = '' }) {
        if (code === undefined || code === null) {
            const err = new Error('Code is required for execution');
            err.statusCode = 400;
            throw err;
        }

        // 1. Create a unique temporary directory for this execution
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askursenior-c-'));
        const mainFilePath = path.join(tempDir, 'main.c');

        // 2. Write student source code to main.c
        fs.writeFileSync(mainFilePath, code, 'utf8');

        // 3. Format path for cross-platform Docker mount
        const dockerMountPath = mainFilePath.replace(/\\/g, '/');

        // 4. Generate unique container name for lifecycle tracking & emergency kill
        const containerName = `askursenior-c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const startTime = Date.now();

        return new Promise((resolve) => {
            let stdoutData = '';
            let stderrData = '';
            let totalOutputBytes = 0;
            let isTimedOut = false;
            let isOutputExceeded = false;
            let isResolved = false;

            const cleanupTempDir = () => {
                try {
                    if (fs.existsSync(tempDir)) {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                    }
                } catch (cleanupErr) {
                    console.error('Failed to clean up temporary execution directory:', cleanupErr);
                }
            };

            // 5. Build hardened Docker execution arguments
            const dockerArgs = [
                'run',
                '--rm',
                '-i',
                '--name', containerName,
                '--network', 'none',
                '--cpus', String(CONFIG.CPU_LIMIT),
                '--memory', CONFIG.MEMORY_LIMIT,
                '--memory-swap', CONFIG.MEMORY_LIMIT,
                '--pids-limit', String(CONFIG.PIDS_LIMIT),
                '--cap-drop=ALL',
                '--security-opt=no-new-privileges',
                '-v', `${dockerMountPath}:/app/main.c:ro`,
                this.imageName
            ];

            const child = spawn('docker', dockerArgs);

            // 6. Hard Execution Timeout Management
            const timer = setTimeout(() => {
                isTimedOut = true;
                this.forceKillContainer(containerName);
                try {
                    child.kill('SIGKILL');
                } catch (e) {}
            }, CONFIG.TIMEOUT_MS);

            // 7. Pipe Stdin securely to student program
            if (child.stdin) {
                if (input) {
                    child.stdin.write(input);
                }
                child.stdin.end();
            }

            // 8. Stream & Output Size Limit Tracking
            child.stdout?.on('data', (chunk) => {
                totalOutputBytes += chunk.length;
                if (totalOutputBytes > CONFIG.OUTPUT_LIMIT_BYTES) {
                    if (!isOutputExceeded) {
                        isOutputExceeded = true;
                        this.forceKillContainer(containerName);
                        try {
                            child.kill('SIGKILL');
                        } catch (e) {}
                    }
                    return;
                }
                stdoutData += chunk.toString();
            });

            child.stderr?.on('data', (chunk) => {
                totalOutputBytes += chunk.length;
                if (totalOutputBytes > CONFIG.OUTPUT_LIMIT_BYTES) {
                    if (!isOutputExceeded) {
                        isOutputExceeded = true;
                        this.forceKillContainer(containerName);
                        try {
                            child.kill('SIGKILL');
                        } catch (e) {}
                    }
                    return;
                }
                stderrData += chunk.toString();
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                cleanupTempDir();
                this.forceKillContainer(containerName);

                if (isResolved) return;
                isResolved = true;

                const runtimeMs = Date.now() - startTime;
                resolve({
                    status: 'runtime_error',
                    stdout: stdoutData,
                    stderr: 'Execution process initialization error',
                    exitCode: 1,
                    runtimeMs
                });
            });

            child.on('close', (exitCode, signal) => {
                clearTimeout(timer);
                cleanupTempDir();
                this.forceKillContainer(containerName);

                if (isResolved) return;
                isResolved = true;

                const runtimeMs = Date.now() - startTime;

                // Handle Output Limit Exceeded
                if (isOutputExceeded) {
                    return resolve({
                        status: 'output_limit_exceeded',
                        stdout: stdoutData.slice(0, 500) + '\n\n[Output truncated: Exceeded 1MB limit]',
                        stderr: 'Output Limit Exceeded: Standard output/error exceeded allowed buffer limit.',
                        exitCode: null,
                        runtimeMs
                    });
                }

                // Handle Time Limit Exceeded
                if (isTimedOut) {
                    return resolve({
                        status: 'time_limit_exceeded',
                        stdout: stdoutData,
                        stderr: `Time Limit Exceeded: Execution exceeded ${CONFIG.TIMEOUT_MS}ms.`,
                        exitCode: null,
                        runtimeMs
                    });
                }

                const actualCode = exitCode !== null ? exitCode : (signal ? 1 : 0);

                // Handle Out-Of-Memory (OOM Kill = 137 / SIGKILL)
                if (actualCode === 137) {
                    return resolve({
                        status: 'memory_limit_exceeded',
                        stdout: stdoutData,
                        stderr: `Memory Limit Exceeded: Program exceeded ${CONFIG.MEMORY_LIMIT} RAM limit.`,
                        exitCode: 137,
                        runtimeMs
                    });
                }

                // Determine Status
                let status = 'success';

                if (actualCode !== 0) {
                    const isGccError = stderrData.includes('error:') || 
                                       stderrData.includes('/app/main.c:') || 
                                       stderrData.includes('gcc:');

                    if (isGccError) {
                        status = 'compilation_error';
                    } else {
                        status = 'runtime_error';
                    }
                }

                // Sanitize Stderr to remove any leaked host directories
                const sanitizedStderr = stderrData.replace(new RegExp(tempDir.replace(/\\/g, '[\\\\/]'), 'g'), '/app');

                resolve({
                    status,
                    stdout: stdoutData,
                    stderr: sanitizedStderr,
                    exitCode: actualCode,
                    runtimeMs
                });
            });
        });
    }
}

module.exports = CRunner;
