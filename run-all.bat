@echo off
title Grounded Launcher
set BROWSER=none
echo ===================================================
echo   Launching Grounded Clinical AI Assistant
echo   1. ASP.NET Core Backend (http://localhost:5000)
echo   2. Angular Frontend (http://localhost:4200)
echo ===================================================

echo Stopping any previous Grounded.Api process...
taskkill /F /IM Grounded.Api.exe >nul 2>&1
timeout /t 2 /nobreak >nul

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm"

start "Grounded - Backend (.NET)" cmd /k "cd /d %~dp0Grounded.Api && echo [BACKEND] Starting ASP.NET Core API... && dotnet run --launch-profile http"

timeout /t 3 /nobreak >nul

start "Grounded - Frontend (Angular)" cmd /k "set BROWSER=none&& set PATH=%PATH%;C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm && cd /d %~dp0angular-client && echo [FRONTEND] Starting Angular Client... && npm start"

echo.
echo Both servers are starting in separate windows.
echo Open http://localhost:4200 yourself when you want the UI.
echo.
pause
