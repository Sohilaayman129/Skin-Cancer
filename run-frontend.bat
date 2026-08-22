@echo off
title Grounded - Angular Frontend
color 0A
set BROWSER=none
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm"
cd /d "%~dp0angular-client"
echo ===================================================
echo   Starting Angular Frontend on http://localhost:4200
echo ===================================================
call npm start
pause
