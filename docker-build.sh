#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  Grounded Clinical AI Assistant - Docker Builder"
echo "==================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH!"
    exit 1
fi

echo "[1/2] Building Unified Docker Image (Angular + .NET Core 9)..."
docker build -t grounded-clinical-ai:latest -f Dockerfile .

echo ""
echo "[2/2] Running Docker Container on http://localhost:5000..."
echo "(Press Ctrl+C to stop the container)"
echo ""

docker run --rm -it -p 5000:8080 --name grounded_clinical_assistant grounded-clinical-ai:latest
