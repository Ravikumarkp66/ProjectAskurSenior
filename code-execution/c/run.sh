#!/bin/bash
set -e

# Compile /app/main.c with -O2 optimization and link math library (-lm)
gcc -O2 /app/main.c -o /app/a.out -lm

# Execute compiled binary forwarding stdin/stdout/stderr
exec /app/a.out
