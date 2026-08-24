# AskUrSenior Code Execution — Multi-Language Runner Infrastructure (Milestone 11)

This directory contains the production-ready Dockerfiles, execution scripts, and CI/CD configurations for compiling and executing student code in isolated sandboxes across four languages: **C, C++, Java, and Python**.

---

## 1. Directory Structure

```text
code-execution/
│
├── c/
│   ├── Dockerfile          # GCC 14 (Bookworm) with non-root runner user
│   ├── main.c              # Default sample starter
│   └── run.sh              # Compilation (-O2 -lm) & execution script
│
├── cpp/
│   ├── Dockerfile          # G++ 14 (Bookworm) with non-root runner user
│   ├── main.cpp            # Default sample starter
│   └── run.sh              # C++17 compilation (-O2) & execution script
│
├── java/
│   ├── Dockerfile          # Eclipse Temurin OpenJDK 21
│   ├── Main.java           # Default sample starter
│   └── run.sh              # Javac & Java runtime execution script
│
└── python/
    ├── Dockerfile          # Python 3.12 (Slim Bookworm)
    ├── main.py             # Default sample starter
    └── run.sh              # Python 3 execution script
```

---

## 2. Security & Sandbox Constraints

Every container is spawned on-demand by the Node.js backend using local Docker Engine execution with strict security enforcement:

1. **Network Isolation (`--network none`)**: Blocks all outbound and inbound socket connections (no external network access).
2. **Compute Limits (`--cpus 1`, `--memory 128m --memory-swap 128m`)**: Restricts CPU and RAM usage to prevent host starvation.
3. **PID Controls (`--pids-limit 64`)**: Prevents fork bombs and unbounded thread creation.
4. **Kernel Hardening (`--cap-drop=ALL --security-opt=no-new-privileges`)**: Strips all Linux root capabilities and prevents privilege escalation.
5. **Filesystem Read-Only Mount (`-v /tmp/.../main.ext:/app/main.ext:ro`)**: Student code is mounted strictly read-only into `/app`.
6. **Non-Root Execution (`USER runner`)**: The sandbox runs under an unprivileged user (`runner`).
7. **Timeout Safeguards**: Host Node.js process monitors execution duration and issues `SIGKILL` + `docker kill` if elapsed time exceeds timeout (default 4000ms).

---

## 3. Environment & Runner Image Configuration

Runner image names are configurable via environment variables in `.env`:

| Environment Variable | Default Image | Description |
|---|---|---|
| `CODE_EXECUTION_C_IMAGE` | `askursenior-c-runner:latest` | C compiler sandbox image |
| `CODE_EXECUTION_CPP_IMAGE` | `askursenior-cpp-runner:latest` | C++ compiler sandbox image |
| `CODE_EXECUTION_JAVA_IMAGE` | `askursenior-java-runner:latest` | Java OpenJDK 21 sandbox image |
| `CODE_EXECUTION_PYTHON_IMAGE` | `askursenior-python-runner:latest` | Python 3.12 sandbox image |
| `CODE_EXECUTION_TIMEOUT_MS` | `4000` | Hard execution timeout in milliseconds |
| `CODE_EXECUTION_MEMORY_LIMIT` | `128m` | Maximum RAM allocated per container |
| `CODE_EXECUTION_CPU_LIMIT` | `1` | CPU core allocation |
| `CODE_EXECUTION_PIDS_LIMIT` | `64` | Maximum allowable processes / threads |

---

## 4. Staging Deployment Workflow

### Step 1: CI/CD Builds & Publishes to GHCR
When changes are pushed to `code-execution/**`, GitHub Actions automatically builds and pushes the 4 images to GitHub Container Registry (`ghcr.io`):
- `ghcr.io/<owner>/askursenior-c-runner:1.0.0` (and `:latest`)
- `ghcr.io/<owner>/askursenior-cpp-runner:1.0.0` (and `:latest`)
- `ghcr.io/<owner>/askursenior-java-runner:1.0.0` (and `:latest`)
- `ghcr.io/<owner>/askursenior-python-runner:1.0.0` (and `:latest`)

### Step 2: Staging Server Pulls Images
On the Staging server (where Docker Engine is installed and backend runs):
```bash
# Pull versioned runner images from registry
docker pull ghcr.io/<owner>/askursenior-c-runner:1.0.0
docker pull ghcr.io/<owner>/askursenior-cpp-runner:1.0.0
docker pull ghcr.io/<owner>/askursenior-java-runner:1.0.0
docker pull ghcr.io/<owner>/askursenior-python-runner:1.0.0

# Tag locally if using standard aliases
docker tag ghcr.io/<owner>/askursenior-c-runner:1.0.0 askursenior-c-runner:latest
docker tag ghcr.io/<owner>/askursenior-cpp-runner:1.0.0 askursenior-cpp-runner:latest
docker tag ghcr.io/<owner>/askursenior-java-runner:1.0.0 askursenior-java-runner:latest
docker tag ghcr.io/<owner>/askursenior-python-runner:1.0.0 askursenior-python-runner:latest
```

### Step 3: Run Staging E2E Test Suite
Execute the staging test suite to verify all 4 languages and security assertions against Staging DB:
```bash
node backend/scripts/test-staging-playground.js
```
