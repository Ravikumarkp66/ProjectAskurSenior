const { exec } = require('child_process');

/**
 * Check Docker binary availability and daemon connectivity on the local host.
 * 
 * Safe for server logs and diagnostic endpoints without exposing secrets.
 * 
 * @returns {Promise<{ available: boolean, daemonRunning: boolean, mode: string, version: string|null, error: string|null, details: Object }>}
 */
async function checkDockerAvailability() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        console.log('[DockerDiagnostic] Checking local Docker binary and daemon status...');

        exec('docker --version', { timeout: 5000 }, (verErr, verStdout, verStderr) => {
            const durationMs = Date.now() - startTime;

            if (verErr) {
                const errorInfo = {
                    available: false,
                    daemonRunning: false,
                    mode: 'local_docker',
                    version: null,
                    error: `Docker CLI unavailable: ${verErr.code || 'UNKNOWN'} - ${verErr.message}`,
                    details: {
                        code: verErr.code || null,
                        signal: verErr.signal || null,
                        durationMs,
                        stderr: verStderr ? verStderr.trim() : null
                    }
                };
                console.error('[DockerDiagnostic] ❌ Docker CLI check failed:', JSON.stringify(errorInfo, null, 2));
                return resolve(errorInfo);
            }

            const dockerVersion = (verStdout || '').trim();
            console.log(`[DockerDiagnostic] ✓ Docker CLI detected: "${dockerVersion}" (${durationMs}ms)`);

            // Check if Docker daemon is reachable
            exec('docker info --format "{{.ServerVersion}}"', { timeout: 6000 }, (infoErr, infoStdout, infoStderr) => {
                const totalDurationMs = Date.now() - startTime;

                if (infoErr) {
                    const daemonInfo = {
                        available: true,
                        daemonRunning: false,
                        mode: 'local_docker',
                        version: dockerVersion,
                        error: `Docker daemon unreachable: ${infoErr.code || 'UNKNOWN'} - ${infoErr.message}`,
                        details: {
                            code: infoErr.code || null,
                            signal: infoErr.signal || null,
                            totalDurationMs,
                            stderr: infoStderr ? infoStderr.trim() : null
                        }
                    };
                    console.error('[DockerDiagnostic] ⚠️ Docker CLI is installed, but daemon is unreachable:', JSON.stringify(daemonInfo, null, 2));
                    return resolve(daemonInfo);
                }

                const serverVersion = (infoStdout || '').trim();
                const successInfo = {
                    available: true,
                    daemonRunning: true,
                    mode: 'local_docker',
                    version: dockerVersion,
                    serverVersion: serverVersion || 'unknown',
                    error: null,
                    details: {
                        totalDurationMs
                    }
                };
                console.log(`[DockerDiagnostic] ✓ Docker daemon connected (Server Version: ${serverVersion || 'OK'}, ${totalDurationMs}ms)`);
                return resolve(successInfo);
            });
        });
    });
}

module.exports = {
    checkDockerAvailability
};
