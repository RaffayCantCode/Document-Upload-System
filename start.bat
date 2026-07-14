@echo off
echo ========================================
echo   Document Upload System - Quick Start
echo ========================================
echo.
echo Starting Backend (http://localhost:5000)...
start "Backend" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul
echo Starting Frontend (http://localhost:3000)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ========================================
echo   Open http://localhost:3000 in browser
echo   Close both terminal windows to stop
echo ========================================
echo.
pause
