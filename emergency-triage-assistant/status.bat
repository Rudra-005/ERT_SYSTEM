@echo off
setlocal enabledelayedexpansion

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo %BLUE%========================================%RESET%
echo %BLUE%  Emergency Triage Assistant Status    %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Check Ollama
echo %YELLOW%Checking Ollama (port 11434)...%RESET%
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Ollama: Running%RESET%
    
    :: Check phi3:mini model
    ollama list | findstr "phi3:mini" >nul 2>&1
    if %errorlevel% equ 0 (
        echo %GREEN%  ✓ phi3:mini model: Available%RESET%
    ) else (
        echo %RED%  ✗ phi3:mini model: Missing%RESET%
    )
) else (
    echo %RED%✗ Ollama: Not running%RESET%
)

:: Check Node.js Backend
echo.
echo %YELLOW%Checking Node.js Backend (port 5000)...%RESET%
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Node.js Backend: Running%RESET%
    
    :: Get health details
    for /f "delims=" %%i in ('curl -s http://localhost:5000/api/health 2^>nul') do set "node_health=%%i"
    if defined node_health (
        echo   Health check: Available
    )
) else (
    echo %RED%✗ Node.js Backend: Not running%RESET%
)

:: Check FastAPI Backend
echo.
echo %YELLOW%Checking FastAPI Backend (port 8000)...%RESET%
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ FastAPI Backend: Running%RESET%
) else (
    echo %RED%✗ FastAPI Backend: Not running%RESET%
)

:: Check React Frontend
echo.
echo %YELLOW%Checking React Frontend (port 5173)...%RESET%
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ React Frontend: Running%RESET%
) else (
    echo %RED%✗ React Frontend: Not running%RESET%
)

:: Show port usage
echo.
echo %BLUE%Port Usage:%RESET%
netstat -ano | findstr ":5000\|:5173\|:8000\|:11434" 2>nul
if %errorlevel% neq 0 (
    echo   No processes found on monitored ports
)

:: Show service URLs
echo.
echo %BLUE%Service URLs:%RESET%
echo   • Main App: %BLUE%http://localhost:5173%RESET%
echo   • Node.js API: %BLUE%http://localhost:5000%RESET%
echo   • FastAPI: %BLUE%http://localhost:8000%RESET%
echo   • Ollama: %BLUE%http://localhost:11434%RESET%

echo.
echo %YELLOW%Press any key to exit...%RESET%
pause >nul