# AskUrSenior — Standalone Render Execution Runner (Experimental Microservice)

This directory contains an experimental standalone Docker-based C execution microservice designed to evaluate whether compilation and execution of untrusted code can be hosted on a Render Docker Web Service.

> **Status**: Experimental Evaluation (Step 1 → Step 3)  
> **Target**: Single-service C compilation & execution via GCC 14 with process-level controls.  
> **Local Local Production Docker**: The production multi-language sandboxes remain in `code-execution/` and `backend/services/code-execution/` unchanged.

---

## 1. Microservice Architecture

```text
HTTP Client (Render API / Test Suite)
                  │
                  ▼ POST /execute (with Bearer Token)
  ┌──────────────────────────────────────────────┐
  │  Render Docker Web Service (Port 5050/env)   │
  │                                              │
  │  Node.js 20 Express Service (User: runner)   │
  │  ├── Temporary Dir: /tmp/runner-c-XXXXX/    │
  │  ├── GCC 14: gcc -O2 main.c -o main.out -lm  │
  │  ├── Subprocess Execution (spawn)            │
  │  │   ├── Timeout Guard (4000ms)              │
  │  │   ├── Output Buffer Limit (1MB)           │
  │  │   └── Stdin/Stdout/Stderr Capture         │
  │  └── Cleanup: rm -rf /tmp/runner-c-XXXXX/    │
  └──────────────────────────────────────────────┘
```

---

## 2. Local Docker Build & Execution

### Build Docker Image
```bash
cd render-execution-runner
docker build -t askursenior-render-runner .
```

### Run Container Locally
```bash
docker run --rm -p 5050:5050 -e EXECUTION_SERVICE_TOKEN="test-token-123" askursenior-render-runner
```

---

## 3. API Endpoints

### 1. Health Check (Public)
```bash
curl -X GET http://localhost:5050/health
```

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "service": "askursenior-render-execution-runner",
  "timestamp": "2026-08-25T11:30:00.000Z"
}
```

### 2. Execute C Program (Authenticated)
```bash
curl -X POST http://localhost:5050/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-123" \
  -d '{
    "language": "c",
    "code": "#include <stdio.h>\nint main() { printf(\"Hello World!\\n\"); return 0; }",
    "input": ""
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "status": "success",
  "stdout": "Hello World!\n",
  "stderr": "",
  "exitCode": 0,
  "runtimeMs": 42
}
```

---

## 4. Render Web Service Deployment Configuration

When deploying this service on [Render](https://render.com):

1. **Service Type**: **Web Service**
2. **Environment**: **Docker**
3. **Root Directory**: `render-execution-runner` (or point Dockerfile Path to `render-execution-runner/Dockerfile`)
4. **Plan**: Free or Starter (Linux 512MB/1GB)
5. **Environment Variables**:
   - `PORT`: `5050` (or leave default; Render automatically injects `PORT`)
   - `EXECUTION_SERVICE_TOKEN`: `<Generate-A-Secure-Secret-Key>`
   - `TIMEOUT_MS`: `4000`
   - `OUTPUT_LIMIT_BYTES`: `1048576`
6. **Health Check Path**: `/health`

---

## 5. Security & Isolation Analysis (Step 3 Findings)

| Control | Mechanism | Isolation Level | Finding / Risk |
|---|---|---|---|
| **Execution Timeout** | `setTimeout` & `child.kill('SIGKILL')` | **Effective** | Infinite loops terminated cleanly at 4000ms. |
| **Output Limit** | Stream chunk accumulator | **Effective** | Halts output and kills runaway prints at 1MB. |
| **Temp File Cleanup** | Recursive directory removal in `finally` | **Effective** | Temporary directories cleaned up after execution. |
| **Filesystem Access** | Non-root `runner` Linux user | **Partial** | Cannot modify `/app/server.js` or read `/etc/shadow`, but `/tmp`, `/etc/hosts`, and public binaries remain readable. |
| **Network Isolation** | Process network namespace | **None (Exposed)** | Outbound sockets are reachable unless restricted by host firewall. |
| **Process / Fork Limits** | Kernel `fork()` / Process tree | **None (Exposed)** | Untrusted code can spawn child processes unless `prlimit` or cgroups are enforced. |
| **Memory Isolation** | Heap allocation via `malloc()` | **None (Shared)** | Untrusted code shares host RAM up to the Render container limit (512MB/1GB). |
