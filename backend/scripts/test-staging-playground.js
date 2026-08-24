const mongoose = require('mongoose');
require('dotenv').config();

const { executeCode, evaluateProblemTestCases } = require('../services/codeExecutionService');
const PlaygroundProblem = require('../models/PlaygroundProblem');
const PlaygroundSubmission = require('../models/PlaygroundSubmission');
const PlaygroundTestCase = require('../models/PlaygroundTestCase');

const SAMPLE_PROGRAMS = {
    c: {
        code: `#include <stdio.h>

int main() {
    long long a, b, c;
    if (scanf("%lld %lld %lld", &a, &b, &c) != 3) return 0;
    long long largest = a;
    if (b >= largest) largest = b;
    if (c >= largest) largest = c;
    printf("Largest: %lld\\n", largest);
    return 0;
}`,
        input: '10 25 15',
        expected: 'Largest: 25'
    },
    cpp: {
        code: `#include <iostream>
using namespace std;

int main() {
    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;
    long long largest = a;
    if (b >= largest) largest = b;
    if (c >= largest) largest = c;
    cout << "Largest: " << largest << endl;
    return 0;
}`,
        input: '10 25 15',
        expected: 'Largest: 25'
    },
    java: {
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLong()) return;
        long a = sc.nextLong();
        long b = sc.nextLong();
        long c = sc.nextLong();
        long largest = a;
        if (b >= largest) largest = b;
        if (c >= largest) largest = c;
        System.out.println("Largest: " + largest);
    }
}`,
        input: '10 25 15',
        expected: 'Largest: 25'
    },
    python: {
        code: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 3:
        return
    a, b, c = map(int, tokens[:3])
    largest = max(a, b, c)
    print(f"Largest: {largest}")

if __name__ == '__main__':
    solve()`,
        input: '10 25 15',
        expected: 'Largest: 25'
    }
};

async function runStagingVerification() {
    console.log('================================================================');
    console.log('   ASKURSENIOR STAGING PIPELINE E2E EXECUTION & SANDBOX TEST    ');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    const assertTest = (name, condition, details = '') => {
        totalTests++;
        if (condition) {
            console.log(`  ✓ [PASS] ${name}`);
            passedTests++;
        } else {
            console.error(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
        }
    };

    // -------------------------------------------------------------
    // PART 1: 4 Language Runner Validations (C, C++, Java, Python)
    // -------------------------------------------------------------
    console.log('--- PART 1: Multi-Language Runner Validations ---');
    for (const [lang, sample] of Object.entries(SAMPLE_PROGRAMS)) {
        try {
            const res = await executeCode({
                language: lang,
                code: sample.code,
                input: sample.input
            });
            const output = (res.stdout || '').trim();
            assertTest(
                `${lang.toUpperCase()} Runner Execution (${lang})`,
                res.status === 'success' && output === sample.expected,
                `status=${res.status}, output="${output}", runtime=${res.runtimeMs}ms`
            );
        } catch (e) {
            assertTest(`${lang.toUpperCase()} Runner Execution`, false, e.message);
        }
    }

    // -------------------------------------------------------------
    // PART 2: Deliberate Sandbox Failure & Security Validations
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Deliberate Failure & Security Sandboxing ---');

    // 2.1 Compilation Error
    try {
        const res = await executeCode({
            language: 'c',
            code: `int main() { syntax_error_here }`,
            input: ''
        });
        assertTest('Compilation Error Detection (C)', res.status === 'compilation_error' && !!res.stderr);
    } catch (e) {
        assertTest('Compilation Error Detection (C)', false, e.message);
    }

    // 2.2 Runtime Error
    try {
        const res = await executeCode({
            language: 'python',
            code: `raise ValueError("Deliberate Runtime Exception")`,
            input: ''
        });
        assertTest('Runtime Error Detection (Python)', res.status === 'runtime_error' && res.stderr.includes('ValueError'));
    } catch (e) {
        assertTest('Runtime Error Detection (Python)', false, e.message);
    }

    // 2.3 Time Limit Exceeded (TLE)
    try {
        const res = await executeCode({
            language: 'python',
            code: `while True: pass`,
            input: ''
        });
        assertTest('Time Limit Exceeded (TLE) Sandboxing', res.status === 'time_limit_exceeded');
    } catch (e) {
        assertTest('Time Limit Exceeded (TLE) Sandboxing', false, e.message);
    }

    // 2.4 Output Limit Exceeded
    try {
        const res = await executeCode({
            language: 'python',
            code: `print("A" * 2000000)`, // 2MB string > 1MB limit
            input: ''
        });
        assertTest('Output Limit Exceeded Sandboxing', res.status === 'output_limit_exceeded' || (res.stdout && res.stdout.length <= 1048576));
    } catch (e) {
        assertTest('Output Limit Exceeded Sandboxing', false, e.message);
    }

    // 2.5 Network Isolation (--network none)
    try {
        const res = await executeCode({
            language: 'python',
            code: `import urllib.request\ntry:\n    urllib.request.urlopen("https://google.com", timeout=2)\n    print("NETWORK_ACCESSIBLE")\nexcept Exception as e:\n    print("NETWORK_BLOCKED")`,
            input: ''
        });
        assertTest('Network Isolation (--network none)', res.stdout.includes('NETWORK_BLOCKED'));
    } catch (e) {
        assertTest('Network Isolation (--network none)', false, e.message);
    }

    // 2.6 Filesystem Isolation (Read-Only Mount & Non-Root User)
    try {
        const res = await executeCode({
            language: 'python',
            code: `try:\n    with open("/app/main.py", "w") as f:\n        f.write("malicious")\n    print("WRITE_ALLOWED")\nexcept Exception:\n    print("WRITE_BLOCKED")`,
            input: ''
        });
        assertTest('Filesystem Isolation (Read-Only Code Mount)', res.stdout.includes('WRITE_BLOCKED'));
    } catch (e) {
        assertTest('Filesystem Isolation (Read-Only Code Mount)', false, e.message);
    }

    // -------------------------------------------------------------
    // PART 3: Database & Submission Pipeline Verification
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Database & Submission Pipeline ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior');
        const dbName = mongoose.connection.name;
        console.log(`  Connected MongoDB Database: "${dbName}"`);

        const problem = await PlaygroundProblem.findOne({ slug: 'plc6-distance-between-two-points' });
        if (problem) {
            const testCases = await PlaygroundTestCase.find({ problemId: problem._id });
            const evalRes = await evaluateProblemTestCases({
                language: 'python',
                code: `import math, sys\ntokens = sys.stdin.read().split()\nx1,y1,x2,y2 = map(float, tokens[:4])\nprint(f"Distance: {math.sqrt((x2-x1)**2 + (y2-y1)**2):.2f}")`,
                testCases
            });
            assertTest('Problem Evaluation Against DB Test Cases', evalRes.summary.passed === evalRes.summary.total && evalRes.summary.total > 0);
        } else {
            console.log('  ⚠️ Problem not found in current DB (ensure seed script has run).');
        }
    } catch (e) {
        assertTest('Database Connection & Test Cases Query', false, e.message);
    }

    console.log('\n================================================================');
    console.log(`STAGING E2E RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
}

runStagingVerification();
