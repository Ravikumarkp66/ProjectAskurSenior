#!/bin/bash
set -e

# Execute student Python code with unbuffered stream
exec python3 -u /app/main.py
