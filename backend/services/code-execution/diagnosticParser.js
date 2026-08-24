/**
 * Compiler & Runtime Error Diagnostic Parser
 * 
 * Extracts structured diagnostics (line, column, severity, message, source)
 * from compiler/interpreter stderr for C (GCC), C++ (G++), Java (Javac), and Python.
 */

/**
 * Parse diagnostics from compiler or runtime stderr
 * 
 * @param {Object} params
 * @param {string} params.stderr - Standard error output from compiler/runner
 * @param {string} params.language - Language slug ('c', 'cpp', 'java', 'python')
 * @param {string} [params.status] - Execution status ('compilation_error', 'runtime_error')
 * @returns {Array<{ line: number, column: number, endLine: number, endColumn: number, severity: string, message: string, source: string }>}
 */
function parseDiagnostics({ stderr, language = 'c', status = '' }) {
    if (!stderr || typeof stderr !== 'string') {
        return [];
    }

    const lang = (language || '').toLowerCase().trim();
    const diagnostics = [];
    const seenKeys = new Set();

    const addDiagnostic = (diag) => {
        const key = `${diag.line}:${diag.column}:${diag.severity}:${diag.message}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            diagnostics.push(diag);
        }
    };

    // 1. GCC / G++ (C & C++)
    // Format: /app/main.c:12:10: error: expected ';' before '}'
    // Format: main.c:12:10: fatal error: stdio.h: No such file or directory
    // Format: /app/main.cpp:15:5: warning: unused variable 'x' [-Wunused-variable]
    if (lang === 'c' || lang === 'cpp') {
        const gccRegex = /(?:^|\n)(?:(?:\/app\/)?[a-zA-Z0-9_.-]+):(\d+)(?::(\d+))?:\s*(error|fatal error|warning|note):\s*(.+)/gi;
        let match;
        while ((match = gccRegex.exec(stderr)) !== null) {
            const line = parseInt(match[1], 10);
            const column = match[2] ? parseInt(match[2], 10) : 1;
            const typeStr = match[3].toLowerCase();
            const message = match[4].trim();

            const severity = (typeStr === 'warning') ? 'warning' : (typeStr === 'note' ? 'info' : 'error');

            if (!isNaN(line) && line > 0) {
                addDiagnostic({
                    line,
                    column,
                    endLine: line,
                    endColumn: column + 1,
                    severity,
                    message,
                    source: lang === 'cpp' ? 'g++' : 'gcc'
                });
            }
        }
    }

    // 2. Java (Javac Compiler & JVM Runtime)
    // Format: /app/Main.java:14: error: cannot find symbol
    // Format: Main.java:14: error: ';' expected
    // Format: Exception in thread "main" java.lang.ArithmeticException: / by zero at Main.main(Main.java:6)
    if (lang === 'java') {
        // Javac compilation errors
        const javacRegex = /(?:^|\n)(?:(?:\/app\/)?[a-zA-Z0-9_.-]+\.java):(\d+):\s*(error|warning):\s*(.+)/gi;
        let match;
        while ((match = javacRegex.exec(stderr)) !== null) {
            const line = parseInt(match[1], 10);
            const typeStr = match[2].toLowerCase();
            const message = match[3].trim();
            const severity = typeStr === 'warning' ? 'warning' : 'error';

            if (!isNaN(line) && line > 0) {
                addDiagnostic({
                    line,
                    column: 1,
                    endLine: line,
                    endColumn: 80,
                    severity,
                    message,
                    source: 'javac'
                });
            }
        }

        // JVM Runtime stack trace
        if (diagnostics.length === 0) {
            const jvmStackRegex = /at\s+(?:[a-zA-Z0-9_$.]+\.)+[a-zA-Z0-9_$]+\(([a-zA-Z0-9_.-]+\.java):(\d+)\)/gi;
            let stackMatch;
            while ((stackMatch = jvmStackRegex.exec(stderr)) !== null) {
                const line = parseInt(stackMatch[2], 10);
                const excMatch = stderr.match(/Exception in thread "[^"]+"\s+([a-zA-Z0-9_$.]+(?::\s*[^\n]+)?)/i);
                const message = excMatch ? excMatch[1].trim() : 'Runtime Exception';

                if (!isNaN(line) && line > 0) {
                    addDiagnostic({
                        line,
                        column: 1,
                        endLine: line,
                        endColumn: 80,
                        severity: 'error',
                        message,
                        source: 'jvm'
                    });
                    break;
                }
            }
        }
    }

    // 3. Python (SyntaxError & Traceback)
    // Format: File "/app/main.py", line 12\n    print("hello"\n                 ^\nSyntaxError: '(' was never closed
    // Format: File "/app/main.py", line 15, in <module>\n    x = 1 / 0\nZeroDivisionError: division by zero
    if (lang === 'python') {
        const pyFileRegex = /File\s+"(?:[^\"]+)",\s+line\s+(\d+)(?:,\s+in\s+([^\n]+))?/gi;
        const matches = [];
        let m;
        while ((m = pyFileRegex.exec(stderr)) !== null) {
            matches.push({
                line: parseInt(m[1], 10),
                index: m.index
            });
        }

        if (matches.length > 0) {
            const targetFrame = matches[matches.length - 1];
            const line = targetFrame.line;

            const errorTypeMatch = stderr.match(/([a-zA-Z0-9_]+Error:\s*[^\n]+)/g);
            let message = errorTypeMatch ? errorTypeMatch[errorTypeMatch.length - 1].trim() : 'Python Exception';

            let column = 1;
            const caretMatch = stderr.match(/\n\s*(\^+)\s*\n/);
            if (caretMatch && caretMatch.index > targetFrame.index) {
                const linesBeforeCaret = stderr.substring(targetFrame.index, caretMatch.index).split('\n');
                const lastLineBefore = linesBeforeCaret[linesBeforeCaret.length - 1] || '';
                column = Math.max(1, lastLineBefore.indexOf('^') + 1);
            }

            if (!isNaN(line) && line > 0) {
                addDiagnostic({
                    line,
                    column,
                    endLine: line,
                    endColumn: column > 1 ? column + 5 : 80,
                    severity: 'error',
                    message,
                    source: 'python'
                });
            }
        }
    }

    return diagnostics;
}

module.exports = {
    parseDiagnostics
};
