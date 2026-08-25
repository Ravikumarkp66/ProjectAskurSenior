const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = parseInt(process.env.PORT, 10) || 5050;
const HOST = '0.0.0.0';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS, 10) || 4000;
const OUTPUT_LIMIT_BYTES = parseInt(process.env.OUTPUT_LIMIT_BYTES, 10) || 1048576; // 1 MB
const EXECUTION_SERVICE_TOKEN = process.env.EXECUTION_SERVICE_TOKEN || '';

/**
 * Authentication Middleware: Protects /execute if EXECUTION_SERVICE_TOKEN is set
 */
function authMiddleware(req, res, next) {
    if (!EXECUTION_SERVICE_TOKEN) {
        // In local development/test if token not set, allow request
        return next();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token || token !== EXECUTION_SERVICE_TOKEN) {
        console.warn(`[RenderRunner] Unauthorized execution request received from ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing execution token'
        });
    }

    next();
}

/**
 * GET /health
 * Public health check for Render container orchestration
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'askursenior-render-execution-runner',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /execute
 * Compiles and executes C programs directly within the runner container
 */
app.post('/execute', authMiddleware, async (req, res) => {
    const { language, code, input = '' } = req.body;
    const reqStartTime = Date.now();

    // 1. Language validation: Strictly C for this experiment
    if (!language || language.toLowerCase().trim() !== 'c') {
        return res.status(400).json({
            success: false,
            error: "Unsupported language. Only 'c' is supported in this experimental runner."
        });
    }

    if (code === undefined || code === null || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Code string is required for execution.'
        });
    }

    const inputStr = typeof input === 'string' ? input : (input !== undefined && input !== null ? String(input) : '');

    // 2. Create isolated temporary working directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-c-'));
    const sourceFilePath = path.join(tempDir, 'main.c');
    const binaryFilePath = path.join(tempDir, 'main.out');

    const cleanup = () => {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (cleanupErr) {
            console.error('[RenderRunner] Failed to clean up tempDir:', cleanupErr.message);
        }
    };

    try {
        // 3. Write student source code
        fs.writeFileSync(sourceFilePath, code, 'utf8');

        // 4. Compile with GCC
        const compileResult = await new Promise((resolve) => {
            const compileArgs = ['-O2', sourceFilePath, '-o', binaryFilePath, '-lm'];
            const compileStart = Date.now();

            execFile('gcc', compileArgs, { timeout: 6000, maxBuffer: 1048576 }, (err, stdout, stderr) => {
                const compileDuration = Date.now() - compileStart;
                if (err) {
                    return resolve({
                        success: false,
                        stderr: (stderr || err.message || '').toString(),
                        compileDuration
                    });
                }
                resolve({ success: true, compileDuration });
            });
        });

        // Handle compilation failure
        if (!compileResult.success) {
            cleanup();
            const sanitizedStderr = compileResult.stderr.replace(new RegExp(tempDir.replace(/\\/g, '[\\\\/]'), 'g'), '/workspace');
            return res.json({
                success: true,
                status: 'compilation_error',
                stdout: '',
                stderr: sanitizedStderr,
                exitCode: 1,
                runtimeMs: compileResult.compileDuration
            });
        }

        // 5. Execute compiled binary
        const execResult = await new Promise((resolve) => {
            const execStart = Date.now();
            let stdoutData = '';
            let stderrData = '';
            let totalBytes = 0;
            let isTimedOut = false;
            let isOutputExceeded = false;
            let isResolved = false;

            const child = spawn(binaryFilePath, [], {
                cwd: tempDir
            });

            // Hard timeout kill
            const timer = setTimeout(() => {
                isTimedOut = true;
                try {
                    child.kill('SIGKILL');
                } catch (e) {}
            }, TIMEOUT_MS);

            // Pipe stdin
            if (child.stdin) {
                if (inputStr) {
                    child.stdin.write(inputStr);
                }
                child.stdin.end();
            }

            child.stdout?.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > OUTPUT_LIMIT_BYTES) {
                    if (!isOutputExceeded) {
                        isOutputExceeded = true;
                        try {
                            child.kill('SIGKILL');
                        } catch (e) {}
                    }
                    return;
                }
                stdoutData += chunk.toString();
            });

            child.stderr?.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > OUTPUT_LIMIT_BYTES) {
                    if (!isOutputExceeded) {
                        isOutputExceeded = true;
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
                if (isResolved) return;
                isResolved = true;

                resolve({
                    status: 'runtime_error',
                    stdout: stdoutData,
                    stderr: `Execution error: ${err.message}`,
                    exitCode: 1,
                    runtimeMs: Date.now() - execStart
                });
            });

            child.on('close', (exitCode, signal) => {
                clearTimeout(timer);
                if (isResolved) return;
                isResolved = true;

                const runtimeMs = Date.now() - execStart;

                if (isOutputExceeded) {
                    return resolve({
                        status: 'output_limit_exceeded',
                        stdout: stdoutData.slice(0, 500) + '\n\n[Output truncated: Exceeded 1MB limit]',
                        stderr: 'Output Limit Exceeded: Standard output exceeded buffer limit.',
                        exitCode: null,
                        runtimeMs
                    });
                }

                if (isTimedOut) {
                    return resolve({
                        status: 'time_limit_exceeded',
                        stdout: stdoutData,
                        stderr: `Time Limit Exceeded: Program exceeded ${TIMEOUT_MS}ms limit.`,
                        exitCode: null,
                        runtimeMs
                    });
                }

                const actualExitCode = exitCode !== null ? exitCode : (signal ? 1 : 0);
                const status = actualExitCode === 0 ? 'success' : 'runtime_error';

                const sanitizedStderr = stderrData.replace(new RegExp(tempDir.replace(/\\/g, '[\\\\/]'), 'g'), '/workspace');

                resolve({
                    status,
                    stdout: stdoutData,
                    stderr: sanitizedStderr,
                    exitCode: actualExitCode,
                    runtimeMs
                });
            });
        });

        cleanup();

        return res.json({
            success: true,
            ...execResult
        });

    } catch (err) {
        cleanup();
        console.error('[RenderRunner] Unexpected error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal execution runner error',
            status: 'runtime_error',
            stdout: '',
            stderr: err.message || '',
            exitCode: 1,
            runtimeMs: Date.now() - reqStartTime
        });
    }
});

// Start Server
app.listen(PORT, HOST, () => {
    console.log(`🚀 AskUrSenior Render Execution Runner listening on http://${HOST}:${PORT}`);
    console.log(`🔒 Execution Timeout: ${TIMEOUT_MS}ms | Output Limit: ${OUTPUT_LIMIT_BYTES} bytes`);
    console.log(`🔑 Auth Required: ${EXECUTION_SERVICE_TOKEN ? 'YES (Bearer token configured)' : 'NO (open local dev)'}`);
});

module.exports = app;
