@echo off
title Grounded Docker Launcher
echo ===================================================
echo   Grounded Clinical AI Assistant - Docker Builder
echo ===================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/2] Building Unified Docker Image (Angular + .NET Core 9)...
docker build -t grounded-clinical-ai:latest -f Dockerfile .

if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Running Docker Container on http://localhost:5000...
echo (Press Ctrl+C to stop the container)
echo.

docker run --rm -it -p 5000:8080 --name grounded_clinical_assistant grounded-clinical-ai:latest
