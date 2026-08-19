@echo off
title Grounded - Angular Frontend
color 0A
set "PATH=C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm;%PATH%"
cd /d "%~dp0angular-client"
echo ===================================================
echo   Starting Angular Frontend on http://localhost:4200
echo ===================================================
call "C:\Program Files\nodejs\npm.cmd" start
pause
