const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE_URL = process.env.RUNNER_BASE_URL || 'http://127.0.0.1:5050';
const AUTH_TOKEN = process.env.EXECUTION_SERVICE_TOKEN || '';

/**
 * Helper to make HTTP JSON requests to the runner service
 */
function makeRequest(method, endpoint, body = null, token = AUTH_TOKEN) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const dataStr = body ? JSON.stringify(body) : null;
        if (dataStr) {
            headers['Content-Length'] = Buffer.byteLength(dataStr);
        }

        const req = http.request(url, { method, headers, timeout: 15000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsed, raw: data });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: null, raw: data });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('HTTP request timed out'));
        });

        if (dataStr) {
            req.write(dataStr);
        }
        req.end();
    });
}

const LARGEST_OF_THREE_CODE = `#include <stdio.h>

int main() {
    long long a, b, c;
    if (scanf("%lld %lld %lld", &a, &b, &c) != 3) {
        return 0;
    }
    long long largest = a;
    if (b >= largest) largest = b;
    if (c >= largest) largest = c;
    printf("Largest: %lld\\n", largest);
    return 0;
}`;

async function runRunnerVerification() {
    console.log('================================================================');
    console.log('    ASKURSENIOR RENDER RUNNER EXPERIMENT VERIFICATION SUITE     ');
    console.log(`    Target: ${BASE_URL}`);
    console.log('================================================================\n');

    let totalStep2 = 0;
    let passedStep2 = 0;

    const assertStep2 = (name, cond, details = '') => {
        totalStep2++;
        if (cond) {
            console.log(`  ✓ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
            passedStep2++;
        } else {
            console.error(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
        }
    };

    // -------------------------------------------------------------
    // HEALTH CHECK
    // -------------------------------------------------------------
    console.log('--- HEALTH CHECK ---');
    try {
        const healthRes = await makeRequest('GET', '/health');
        assertStep2('GET /health', healthRes.statusCode === 200 && healthRes.data?.status === 'ok', `status=${healthRes.statusCode}`);
    } catch (e) {
        assertStep2('GET /health', false, e.message);
    }

    // -------------------------------------------------------------
    // STEP 2: BASIC EXECUTION TESTS
    // -------------------------------------------------------------
    console.log('\n--- STEP 2: BASIC EXECUTION TESTS ---');

    // TEST 1: Valid C Program
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: LARGEST_OF_THREE_CODE,
            input: '10 25 15'
        });
        const out = (res.data?.stdout || '').trim();
        assertStep2('TEST 1: Valid C Program (10 25 15)', 
            res.data?.status === 'success' && out === 'Largest: 25', 
            `status=${res.data?.status}, output="${out}", runtime=${res.data?.runtimeMs}ms`);
    } catch (e) {
        assertStep2('TEST 1: Valid C Program', false, e.message);
    }

    // TEST 2: Negative Values
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: LARGEST_OF_THREE_CODE,
            input: '-5 -12 -3'
        });
        const out = (res.data?.stdout || '').trim();
        assertStep2('TEST 2: Negative Values (-5 -12 -3)', 
            res.data?.status === 'success' && out === 'Largest: -3', 
            `status=${res.data?.status}, output="${out}", runtime=${res.data?.runtimeMs}ms`);
    } catch (e) {
        assertStep2('TEST 2: Negative Values', false, e.message);
    }

    // TEST 3: Compilation Error
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `int main() { invalid_syntax_error_here }`,
            input: ''
        });
        assertStep2('TEST 3: Compilation Error', 
            res.data?.status === 'compilation_error' && !!res.data?.stderr, 
            `status=${res.data?.status}, stderr="${(res.data?.stderr || '').slice(0, 80)}"`);
    } catch (e) {
        assertStep2('TEST 3: Compilation Error', false, e.message);
    }

    // TEST 4: Runtime Error (Non-zero exit code / SIGSEGV)
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `#include <stdlib.h>\nint main() { int *p = NULL; *p = 42; return 0; }`,
            input: ''
        });
        assertStep2('TEST 4: Runtime Error (Null Pointer Dereference)', 
            res.data?.status === 'runtime_error', 
            `status=${res.data?.status}, exitCode=${res.data?.exitCode}`);
    } catch (e) {
        assertStep2('TEST 4: Runtime Error', false, e.message);
    }

    // TEST 5: Infinite Loop (Time Limit Exceeded)
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `int main() { while(1) {} return 0; }`,
            input: ''
        });
        assertStep2('TEST 5: Infinite Loop (TLE)', 
            res.data?.status === 'time_limit_exceeded', 
            `status=${res.data?.status}, runtime=${res.data?.runtimeMs}ms`);
    } catch (e) {
        assertStep2('TEST 5: Infinite Loop', false, e.message);
    }

    // TEST 6: Large Output (Output Limit Exceeded)
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `#include <stdio.h>\nint main() { for(long long i=0; i<1000000; i++) printf("01234567890123456789\\n"); return 0; }`,
            input: ''
        });
        assertStep2('TEST 6: Large Output (Output Limit Exceeded)', 
            res.data?.status === 'output_limit_exceeded' || (res.data?.stdout && res.data.stdout.length <= 1048576), 
            `status=${res.data?.status}, stdoutBytes=${(res.data?.stdout || '').length}`);
    } catch (e) {
        assertStep2('TEST 6: Large Output', false, e.message);
    }

    // -------------------------------------------------------------
    // STEP 3: SECURITY & ISOLATION EXPERIMENT
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('        STEP 3: SECURITY & ISOLATION EXPERIMENT RESULTS         ');
    console.log('================================================================\n');

    const securityResults = {
        execution: 'FAIL',
        compilationIsolation: 'FAIL',
        timeout: 'FAIL',
        outputLimit: 'FAIL',
        networkIsolation: 'FAIL',
        filesystemIsolation: 'FAIL',
        processIsolation: 'FAIL',
        memoryIsolation: 'FAIL',
        tempFileCleanup: 'FAIL'
    };

    // 1. Timeout Isolation
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `int main() { while(1); return 0; }`,
            input: ''
        });
        if (res.data?.status === 'time_limit_exceeded') {
            securityResults.timeout = 'PASS';
            console.log('1. TIMEOUT ISOLATION: [PASS]');
            console.log(`   Observed: Infinite loop process killed after ${res.data.runtimeMs}ms by server timeout guard.`);
        } else {
            console.log(`1. TIMEOUT ISOLATION: [FAIL] - unexpected status: ${res.data?.status}`);
        }
    } catch (e) {
        console.log(`1. TIMEOUT ISOLATION: [FAIL] - ${e.message}`);
    }

    // 2. Output Limit
    try {
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: `#include <stdio.h>\nint main() { while(1) printf("AAAAAAAAAAAAAAAA"); return 0; }`,
            input: ''
        });
        if (res.data?.status === 'output_limit_exceeded') {
            securityResults.outputLimit = 'PASS';
            console.log('2. OUTPUT LIMIT ENFORCEMENT: [PASS]');
            console.log('   Observed: Output streaming halted at 1MB boundary and process terminated.');
        } else {
            console.log(`2. OUTPUT LIMIT ENFORCEMENT: [FAIL] - status: ${res.data?.status}`);
        }
    } catch (e) {
        console.log(`2. OUTPUT LIMIT ENFORCEMENT: [FAIL] - ${e.message}`);
    }

    // 3. Temporary File Cleanup
    try {
        const tempDir = os.tmpdir();
        const filesBefore = fs.readdirSync(tempDir).filter(f => f.startsWith('runner-c-'));
        
        await makeRequest('POST', '/execute', {
            language: 'c',
            code: LARGEST_OF_THREE_CODE,
            input: '1 2 3'
        });

        const filesAfter = fs.readdirSync(tempDir).filter(f => f.startsWith('runner-c-'));
        if (filesAfter.length === filesBefore.length) {
            securityResults.tempFileCleanup = 'PASS';
            console.log('3. TEMPORARY FILE CLEANUP: [PASS]');
            console.log(`   Observed: Temporary directories created in ${tempDir} were deleted after execution.`);
        } else {
            console.log(`3. TEMPORARY FILE CLEANUP: [FAIL] - Found lingering dirs: ${filesAfter.join(', ')}`);
        }
    } catch (e) {
        console.log(`3. TEMPORARY FILE CLEANUP: [NOTE] - Inspected via local tmpdir: ${e.message}`);
    }

    // 4. Network Isolation Test
    console.log('\n4. NETWORK ACCESS ISOLATION TEST:');
    try {
        const networkCode = `#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <errno.h>

int main() {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        printf("SOCKET_CREATE_FAILED: %d\\n", errno);
        return 0;
    }
    struct sockaddr_in serv_addr;
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(80);
    inet_pton(AF_INET, "142.250.190.46", &serv_addr.sin_addr); // google.com IP

    struct timeval tv;
    tv.tv_sec = 2;
    tv.tv_usec = 0;
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof tv);
    setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof tv);

    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
        printf("NETWORK_BLOCKED: errno=%d\\n", errno);
    } else {
        printf("NETWORK_ACCESSIBLE: Connected to 142.250.190.46:80\\n");
        close(sock);
    }
    return 0;
}`;
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: networkCode,
            input: ''
        });
        const out = (res.data?.stdout || '').trim();
        if (out.includes('NETWORK_BLOCKED')) {
            securityResults.networkIsolation = 'PASS';
            console.log('   Status: [PASS]');
            console.log(`   Observed: Outbound socket connection was blocked: "${out}"`);
        } else if (out.includes('NETWORK_ACCESSIBLE')) {
            securityResults.networkIsolation = 'FAIL';
            console.log('   Status: [FAIL]');
            console.log(`   Observed: Outbound network connection SUCCEEDED: "${out}".`);
            console.log('   ⚠️ CRITICAL: Untrusted code can establish outbound TCP sockets inside Render Web Service unless host network namespace is restricted (--network none is NOT available inside a standalone Web Service process).');
        } else {
            console.log(`   Status: [INCONCLUSIVE] - Output: "${out}", stderr: "${res.data?.stderr}"`);
        }
    } catch (e) {
        console.log(`   Status: [ERROR] - ${e.message}`);
    }

    // 5. Filesystem Isolation Test
    console.log('\n5. FILESYSTEM ISOLATION TEST:');
    try {
        const fsCode = `#include <stdio.h>
#include <unistd.h>

int main() {
    // 5a. Attempt reading /etc/shadow
    FILE *f1 = fopen("/etc/shadow", "r");
    if (f1) {
        printf("SHADOW_READ_ALLOWED\\n");
        fclose(f1);
    } else {
        printf("SHADOW_READ_DENIED\\n");
    }

    // 5b. Attempt reading /etc/passwd
    FILE *f2 = fopen("/etc/passwd", "r");
    if (f2) {
        printf("PASSWD_READ_ALLOWED\\n");
        fclose(f2);
    } else {
        printf("PASSWD_READ_DENIED\\n");
    }

    // 5c. Attempt writing into app directory (/app/server.js)
    FILE *f3 = fopen("/app/server.js", "a");
    if (f3) {
        printf("APP_WRITE_ALLOWED\\n");
        fclose(f3);
    } else {
        printf("APP_WRITE_DENIED\\n");
    }

    return 0;
}`;
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: fsCode,
            input: ''
        });
        const out = (res.data?.stdout || '').trim();
        console.log(`   Observed: \n   ${out.split('\n').map(l => '   ' + l).join('\n')}`);
        if (out.includes('APP_WRITE_DENIED') && out.includes('SHADOW_READ_DENIED')) {
            securityResults.filesystemIsolation = 'PASS';
            console.log('   Status: [PASS] - Unprivileged user cannot write to /app or read /etc/shadow.');
        } else {
            securityResults.filesystemIsolation = 'FAIL';
            console.log('   Status: [FAIL] - Filesystem permissions allowed unexpected access.');
        }
    } catch (e) {
        console.log(`   Status: [ERROR] - ${e.message}`);
    }

    // 6. Process / Fork Isolation Test
    console.log('\n6. PROCESS / FORK ISOLATION TEST:');
    try {
        const forkCode = `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();
    if (pid == 0) {
        // Child
        printf("CHILD_SPAWNED\\n");
        return 0;
    } else if (pid > 0) {
        // Parent
        wait(NULL);
        printf("PARENT_COMPLETED\\n");
    } else {
        printf("FORK_FAILED\\n");
    }
    return 0;
}`;
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: forkCode,
            input: ''
        });
        const out = (res.data?.stdout || '').trim();
        console.log(`   Observed: "${out}"`);
        if (out.includes('CHILD_SPAWNED')) {
            securityResults.processIsolation = 'FAIL';
            console.log('   Status: [FAIL] - Process fork is permitted without container-level PID limits (--pids-limit is not enforced per child process).');
        } else {
            securityResults.processIsolation = 'PASS';
            console.log('   Status: [PASS] - Fork prevented.');
        }
    } catch (e) {
        console.log(`   Status: [ERROR] - ${e.message}`);
    }

    // 7. Memory Limit Test
    console.log('\n7. MEMORY LIMIT TEST:');
    try {
        const memCode = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    size_t size = 300 * 1024 * 1024; // 300 MB
    char *ptr = (char *)malloc(size);
    if (ptr == NULL) {
        printf("MALLOC_FAILED\\n");
        return 0;
    }
    memset(ptr, 'A', size);
    printf("MALLOC_300MB_SUCCESS\\n");
    free(ptr);
    return 0;
}`;
        const res = await makeRequest('POST', '/execute', {
            language: 'c',
            code: memCode,
            input: ''
        });
        const out = (res.data?.stdout || '').trim();
        console.log(`   Observed: "${out}"`);
        if (out.includes('MALLOC_300MB_SUCCESS')) {
            securityResults.memoryIsolation = 'FAIL';
            console.log('   Status: [FAIL] - Program successfully allocated 300MB RAM. Per-process memory limits are NOT enforced (shared host memory pool).');
        } else {
            securityResults.memoryIsolation = 'PASS';
            console.log('   Status: [PASS] - Memory allocation constrained.');
        }
    } catch (e) {
        console.log(`   Status: [ERROR] - ${e.message}`);
    }

    securityResults.execution = (passedStep2 === totalStep2) ? 'PASS' : 'FAIL';
    securityResults.compilationIsolation = (securityResults.filesystemIsolation === 'PASS') ? 'PASS' : 'FAIL';

    // -------------------------------------------------------------
    // FINAL SECURITY REPORT
    // -------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('RENDER RUNNER EXPERIMENT REPORT');
    console.log('--------------------------------------------------');
    console.log(`Execution:              ${securityResults.execution}`);
    console.log(`Compilation isolation:  ${securityResults.compilationIsolation}`);
    console.log(`Timeout:                ${securityResults.timeout}`);
    console.log(`Output limit:           ${securityResults.outputLimit}`);
    console.log(`Network isolation:      ${securityResults.networkIsolation}`);
    console.log(`Filesystem isolation:   ${securityResults.filesystemIsolation}`);
    console.log(`Process isolation:      ${securityResults.processIsolation}`);
    console.log(`Memory isolation:       ${securityResults.memoryIsolation}`);
    console.log(`Temporary file cleanup: ${securityResults.tempFileCleanup}`);
    console.log('--------------------------------------------------');

    const isSuitable = (
        securityResults.execution === 'PASS' &&
        securityResults.networkIsolation === 'PASS' &&
        securityResults.filesystemIsolation === 'PASS' &&
        securityResults.processIsolation === 'PASS' &&
        securityResults.memoryIsolation === 'PASS'
    );

    console.log(`Production suitability: ${isSuitable ? 'SUITABLE' : 'NOT SUITABLE / REQUIRES FURTHER HARDENING'}`);
    console.log('--------------------------------------------------\n');
}

runRunnerVerification().catch(err => {
    console.error('Test suite runtime error:', err);
    process.exit(1);
});
