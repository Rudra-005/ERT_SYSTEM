@echo off
echo ========================================
echo   Ollama Migration Test Suite
echo ========================================
echo.

REM Check if Ollama is running
echo [1/3] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not running!
    echo.
    echo Please start Ollama first:
    echo   ollama serve
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama is running
echo.

REM Test Node.js backend
echo [2/3] Testing Node.js Backend...
echo ----------------------------------------
cd backend
call node test-ollama-node.js
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tests failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Test FastAPI backend
echo [3/3] Testing FastAPI Backend...
echo ----------------------------------------
cd fastapi-backend
call python test_ollama_fastapi.py
if %errorlevel% neq 0 (
    echo [ERROR] FastAPI tests failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo   All Tests Passed!
echo ========================================
echo.
echo Migration to Ollama is complete and working.
echo Both backends are ready for production.
echo.
pause
