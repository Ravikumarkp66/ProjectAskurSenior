const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');
const BaseRunner = require('./BaseRunner');
const CONFIG = require('../config');

/**
 * C++ Language Execution Runner (G++ 14)
 * 
 * Executes student C++ source code inside askursenior-cpp-runner Docker container
 * with full security sandbox constraints and comprehensive server-side logging.
 */
class CppRunner extends BaseRunner {
    constructor() {
        super('cpp', 'C++ (G++ 14)');
        this.imageName = CONFIG.IMAGES.cpp || 'askursenior-cpp-runner:latest';
    }

    /**
     * Force kill a Docker container by name asynchronously
     * @param {string} containerName 
     */
    forceKillContainer(containerName) {
        if (!containerName) return;
        console.log(`[CppRunner] Issuing emergency docker kill for container: "${containerName}"`);
        exec(`docker kill ${containerName}`, (killErr) => {
            if (killErr) {
                console.log(`[CppRunner] Container kill cleanup note (${containerName}): ${killErr.message}`);
            } else {
                console.log(`[CppRunner] Container "${containerName}" killed successfully`);
            }
        });
    }

    /**
     * Execute C++ source code inside the hardened Docker sandbox
     * 
     * @param {Object} params
     * @param {string} params.code - Untrusted student C++ source code
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
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askursenior-cpp-'));
        const mainFilePath = path.join(tempDir, 'main.cpp');

        // 2. Write student source code to main.cpp
        fs.writeFileSync(mainFilePath, code, 'utf8');

        // 3. Format path for cross-platform Docker mount
        const dockerMountPath = mainFilePath.replace(/\\/g, '/');

        // 4. Generate unique container name for lifecycle tracking & emergency kill
        const containerName = `askursenior-cpp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const startTime = Date.now();

        console.log(`[CppRunner] Preparing execution: Container="${containerName}", Image="${this.imageName}", Mount="${dockerMountPath}", CodeBytes=${Buffer.byteLength(code, 'utf8')}, InputBytes=${Buffer.byteLength(input, 'utf8')}`);

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
                    console.error('[CppRunner] Failed to clean up temporary execution directory:', cleanupErr);
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
                '-v', `${dockerMountPath}:/app/main.cpp:ro`,
                this.imageName
            ];

            console.log(`[CppRunner] Spawning Docker process: command="docker", args=[${dockerArgs.join(' ')}]`);

            let child;
            try {
                child = spawn('docker', dockerArgs);
            } catch (spawnSyncErr) {
                console.error(`[CppRunner] ❌ Synchronous spawn error for container "${containerName}":`, {
                    code: spawnSyncErr.code,
                    message: spawnSyncErr.message,
                    stack: spawnSyncErr.stack
                });
                cleanupTempDir();
                return resolve({
                    status: 'runtime_error',
                    stdout: '',
                    stderr: 'Execution service initialization failed',
                    exitCode: 1,
                    runtimeMs: Date.now() - startTime
                });
            }

            if (child.pid) {
                console.log(`[CppRunner] Docker process spawned: PID=${child.pid}, Container="${containerName}"`);
            }

            // 6. Hard Execution Timeout Management
            const timer = setTimeout(() => {
                isTimedOut = true;
                console.warn(`[CppRunner] ⏱️ Execution TIMEOUT (${CONFIG.TIMEOUT_MS}ms) for container "${containerName}"`);
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
                        console.warn(`[CppRunner] ⚠️ Output limit exceeded (${CONFIG.OUTPUT_LIMIT_BYTES} bytes) for container "${containerName}"`);
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
                        console.warn(`[CppRunner] ⚠️ Output limit exceeded (${CONFIG.OUTPUT_LIMIT_BYTES} bytes) for container "${containerName}"`);
                        this.forceKillContainer(containerName);
                        try {
                            child.kill('SIGKILL');
                        } catch (e) {}
                    }
                    return;
                }
                stderrData += chunk.toString();
            });

            // 9. Error Handler (e.g. docker binary not in PATH / spawn failure)
            child.on('error', (err) => {
                clearTimeout(timer);
                cleanupTempDir();
                this.forceKillContainer(containerName);

                console.error(`[CppRunner] ❌ Process spawn error for container "${containerName}":`, {
                    code: err.code || null,
                    errno: err.errno || null,
                    syscall: err.syscall || null,
                    message: err.message || 'Unknown spawn error',
                    stack: err.stack || null
                });

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

            // 10. Process Close Handler
            child.on('close', (exitCode, signal) => {
                clearTimeout(timer);
                cleanupTempDir();
                if (isTimedOut || isOutputExceeded) {
                    this.forceKillContainer(containerName);
                }

                if (isResolved) return;
                isResolved = true;

                const runtimeMs = Date.now() - startTime;
                const actualCode = exitCode !== null ? exitCode : (signal ? 1 : 0);

                console.log(`[CppRunner] Process closed: Container="${containerName}", ExitCode=${exitCode}, Signal=${signal || 'none'}, Duration=${runtimeMs}ms, StderrBytes=${Buffer.byteLength(stderrData, 'utf8')}, StdoutBytes=${Buffer.byteLength(stdoutData, 'utf8')}`);

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
                    const isCompilationError = stderrData.includes('error:') || 
                                              stderrData.includes('fatal error:') ||
                                              stderrData.includes('undefined reference');
                    if (isCompilationError) {
                        status = 'compilation_error';
                    } else {
                        status = 'runtime_error';
                    }
                }

                // Sanitize Stderr to remove any leaked host directories
                const sanitizedStderr = stderrData.replace(new RegExp(tempDir.replace(/\\/g, '[\\\\/]'), 'g'), '/app');

                console.log(`[CppRunner] Completed: Container="${containerName}", FinalStatus="${status}", Runtime=${runtimeMs}ms`);

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

module.exports = CppRunner;
