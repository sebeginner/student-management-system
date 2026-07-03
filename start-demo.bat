@echo off
echo ============================================================
echo  Student Management System - Demo Launcher
echo  Backend:  http://localhost:3000/api/v1
echo  Frontend: http://127.0.0.1:5173
echo ============================================================
echo.

set ROOT=%~dp0

echo [1/2] Starting backend...
start "Backend - NestJS" /d "%ROOT%backend" cmd /k npm run start

timeout /t 3 /nobreak > nul

echo [2/2] Starting frontend...
start "Frontend - Vite" /d "%ROOT%frontend" cmd /k npm run dev -- --host 127.0.0.1 --port 5173

echo.
echo Both windows opened. Wait ~10s for backend to initialize.
echo Then open: http://127.0.0.1:5173
echo.
pause
