#!/bin/bash
set -e

# Compile /app/Main.java with fast C1 client tier
javac -J-XX:TieredStopAtLevel=1 -J-Xms32m -J-Xmx64m /app/Main.java -d /app

# Execute compiled class with low startup latency and memory ergonomics
exec java -XX:TieredStopAtLevel=1 -Xms32m -Xmx96m -XX:+UseSerialGC -cp /app Main
