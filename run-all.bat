@echo off
title Grounded Launcher
echo ===================================================
echo   Launching Grounded Clinical AI Assistant
echo   1. ASP.NET Core Backend (http://localhost:5000)
echo   2. Angular Frontend (http://localhost:4200)
echo ===================================================

start "Grounded - Backend (.NET)" cmd /k "cd /d %~dp0Grounded.Api && echo [BACKEND] Starting ASP.NET Core API... && dotnet run --launch-profile http"

timeout /t 3 /nobreak >nul

start "Grounded - Frontend (Angular)" cmd /k "set PATH=C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm;%%PATH%% && cd /d %~dp0angular-client && echo [FRONTEND] Starting Angular Client... && call npm.cmd start"

echo.
echo Both servers are starting in separate windows!
echo Open your browser at: http://localhost:4200
echo.
pause
