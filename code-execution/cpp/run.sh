#!/bin/bash
set -e

# Compile /app/main.cpp with C++17 and -O2 optimization
g++ -std=c++17 -O2 /app/main.cpp -o /app/a.out

# Execute compiled binary forwarding stdin/stdout/stderr
exec /app/a.out
