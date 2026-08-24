/**
 * Centralized Sandbox Resource & Security Configuration
 * 
 * Resource Policy:
 * 1. Network Isolation: `--network none` (Prevents all outbound/inbound socket traffic)
 * 2. CPU Controls: `--cpus=1` (Strict single-core compute allocation)
 * 3. Memory Controls: `--memory=128m --memory-swap=128m` (Prevents RAM and Swap exhaustion)
 * 4. Process/PID Controls: `--pids-limit=64` (Protects against fork bombs and uncontrolled thread creation)
 * 5. Capability Dropping: `--cap-drop=ALL` (Revokes all Linux kernel capabilities)
 * 6. Privilege Restrictions: `--security-opt=no-new-privileges` (Blocks privilege escalation)
 * 7. Non-Root Execution: Runs as unprivileged `runner` user inside `/app`
 * 8. Stream Limit: Caps stdout/stderr stream buffering (default: 1MB)
 * 9. Hard Timeout: 2000ms execution cap with SIGKILL + `docker kill`
 */

const CONFIG = {
    TIMEOUT_MS: parseInt(process.env.CODE_EXECUTION_TIMEOUT_MS, 10) || 4000,
    MEMORY_LIMIT: process.env.CODE_EXECUTION_MEMORY_LIMIT || '128m',
    CPU_LIMIT: process.env.CODE_EXECUTION_CPU_LIMIT || '1',
    PIDS_LIMIT: parseInt(process.env.CODE_EXECUTION_PIDS_LIMIT, 10) || 64,
    OUTPUT_LIMIT_BYTES: parseInt(process.env.CODE_EXECUTION_OUTPUT_LIMIT_BYTES, 10) || 1048576, // 1 MB
    CPP_STANDARD: 'c++17',
    JAVA_VERSION: '21',
    PYTHON_VERSION: '3.12',
    IMAGES: {
        c: process.env.CODE_EXECUTION_C_IMAGE || 'askursenior-c-runner:latest',
        cpp: process.env.CODE_EXECUTION_CPP_IMAGE || 'askursenior-cpp-runner:latest',
        java: process.env.CODE_EXECUTION_JAVA_IMAGE || 'askursenior-java-runner:latest',
        python: process.env.CODE_EXECUTION_PYTHON_IMAGE || 'askursenior-python-runner:latest'
    }
};

module.exports = CONFIG;
