@echo off
title Grounded - ASP.NET Core Backend
color 0B
cd /d "%~dp0Grounded.Api"
echo ===================================================
echo   Starting ASP.NET Core API on http://localhost:5000
echo ===================================================
dotnet run --launch-profile http
pause
