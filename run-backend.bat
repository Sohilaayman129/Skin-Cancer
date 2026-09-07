@echo off
title Grounded - ASP.NET Core Backend
color 0B
taskkill /F /IM Grounded.Api.exe >nul 2>&1
cd /d "%~dp0Grounded.Api"
echo ===================================================
echo   Starting ASP.NET Core API on http://localhost:5000
echo ===================================================
dotnet run --launch-profile http
pause
