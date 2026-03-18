@echo off
REM Emergency Triage Assistant - Complete Startup Script
REM This script starts all components: Ollama, Node.js Backend, FastAPI Backend, and Frontend

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo  Emergency Triage Assistant - STARTUP
echo ========================================
echo.

REM Get the project root and parent directory
set "PROJECT_ROOT=%cd%"
set "PARENT_DIR=%PROJECT_ROOT%\.."
set "VENV=%PARENT_DIR%\.venv"

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo [*] Starting Ollama Service...
echo [*] Port: 11434
start "Ollama" cmd /k "title Ollama Service && ollama serve"
timeout /t 3 /nobreak >nul

echo [*] Starting Node.js Backend...
echo [*] Port: 5000
start "Node.js Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo [*] Starting FastAPI Backend...
echo [*] Port: 8000
start "FastAPI Backend" cmd /k "cd fastapi-backend && %VENV%\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

echo [*] Starting Frontend...
echo [*] Port: 3000
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  All services starting...
echo ========================================
echo.
echo Frontend Dashboard: http://localhost:3000
echo Node.js API:      http://localhost:5000
echo FastAPI Backend:  http://localhost:8000
echo Ollama Service:   http://localhost:11434
echo.
echo Note: Check the individual terminal windows for service status
echo Press Ctrl+C in each window to stop individual services
echo.
timeout /t 5 /nobreak
