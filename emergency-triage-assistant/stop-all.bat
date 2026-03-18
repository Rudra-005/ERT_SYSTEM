@echo off
setlocal enabledelayedexpansion

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

:: Set project paths
set "PROJECT_ROOT=%~dp0"
set "LOGS_DIR=%PROJECT_ROOT%logs"

:: Create logs directory if it doesn't exist
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Set log file with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
set "SHUTDOWN_LOG=%LOGS_DIR%\shutdown_%TIMESTAMP%.log"

echo %BLUE%========================================%RESET%
echo %BLUE%  Emergency Triage Assistant Shutdown  %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Log shutdown start
echo [%date% %time%] Starting Emergency Triage Assistant shutdown >> "%SHUTDOWN_LOG%"

:: Step 1: Kill Node.js processes
echo %YELLOW%[1/5] Stopping Node.js backend...%RESET%
echo [%date% %time%] Stopping Node.js backend >> "%SHUTDOWN_LOG%"

:: Find and kill Node.js processes on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do (
    set "pid=%%a"
    if not "!pid!"=="0" (
        tasklist /fi "pid eq !pid!" | findstr "node.exe" >nul 2>&1
        if !errorlevel! equ 0 (
            echo   Killing Node.js process PID: !pid!
            echo [%date% %time%] Killing Node.js process PID: !pid! >> "%SHUTDOWN_LOG%"
            taskkill /pid !pid! /f >nul 2>&1
            if !errorlevel! equ 0 (
                echo %GREEN%✓ Node.js process stopped%RESET%
            ) else (
                echo %RED%✗ Failed to stop Node.js process%RESET%
            )
        )
    )
)

:: Also kill any remaining node.exe processes that might be related
tasklist | findstr "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo   Stopping remaining Node.js processes...
    taskkill /im node.exe /f >nul 2>&1
    echo %GREEN%✓ All Node.js processes stopped%RESET%
    echo [%date% %time%] All Node.js processes stopped >> "%SHUTDOWN_LOG%"
) else (
    echo %GREEN%✓ No Node.js processes found%RESET%
    echo [%date% %time%] No Node.js processes found >> "%SHUTDOWN_LOG%"
)

:: Step 2: Kill Python/FastAPI processes
echo.
echo %YELLOW%[2/5] Stopping FastAPI backend...%RESET%
echo [%date% %time%] Stopping FastAPI backend >> "%SHUTDOWN_LOG%"

:: Find and kill Python processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    set "pid=%%a"
    if not "!pid!"=="0" (
        tasklist /fi "pid eq !pid!" | findstr "python.exe" >nul 2>&1
        if !errorlevel! equ 0 (
            echo   Killing Python process PID: !pid!
            echo [%date% %time%] Killing Python process PID: !pid! >> "%SHUTDOWN_LOG%"
            taskkill /pid !pid! /f >nul 2>&1
            if !errorlevel! equ 0 (
                echo %GREEN%✓ FastAPI process stopped%RESET%
            ) else (
                echo %RED%✗ Failed to stop FastAPI process%RESET%
            )
        )
    )
)

:: Also kill uvicorn processes
tasklist | findstr "uvicorn" >nul 2>&1
if %errorlevel% equ 0 (
    echo   Stopping uvicorn processes...
    taskkill /im python.exe /fi "windowtitle eq *uvicorn*" /f >nul 2>&1
)

echo %GREEN%✓ FastAPI backend stopped%RESET%
echo [%date% %time%] FastAPI backend stopped >> "%SHUTDOWN_LOG%"

:: Step 3: Kill React/Vite processes
echo.
echo %YELLOW%[3/5] Stopping React frontend...%RESET%
echo [%date% %time%] Stopping React frontend >> "%SHUTDOWN_LOG%"

:: Find and kill processes on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    set "pid=%%a"
    if not "!pid!"=="0" (
        echo   Killing frontend process PID: !pid!
        echo [%date% %time%] Killing frontend process PID: !pid! >> "%SHUTDOWN_LOG%"
        taskkill /pid !pid! /f >nul 2>&1
        if !errorlevel! equ 0 (
            echo %GREEN%✓ Frontend process stopped%RESET%
        ) else (
            echo %RED%✗ Failed to stop frontend process%RESET%
        )
    )
)

echo %GREEN%✓ React frontend stopped%RESET%
echo [%date% %time%] React frontend stopped >> "%SHUTDOWN_LOG%"

:: Step 4: Stop Ollama (optional)
echo.
echo %YELLOW%[4/5] Checking Ollama service...%RESET%
echo [%date% %time%] Checking Ollama service >> "%SHUTDOWN_LOG%"

:: Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo %YELLOW%  Ollama is running. Do you want to stop it? (y/N)%RESET%
    set /p "stop_ollama=  "
    if /i "!stop_ollama!"=="y" (
        echo   Stopping Ollama...
        echo [%date% %time%] Stopping Ollama >> "%SHUTDOWN_LOG%"
        
        :: Find and kill Ollama processes
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":11434 "') do (
            set "pid=%%a"
            if not "!pid!"=="0" (
                echo   Killing Ollama process PID: !pid!
                taskkill /pid !pid! /f >nul 2>&1
            )
        )
        
        :: Also kill ollama.exe processes
        tasklist | findstr "ollama.exe" >nul 2>&1
        if !errorlevel! equ 0 (
            taskkill /im ollama.exe /f >nul 2>&1
        )
        
        echo %GREEN%✓ Ollama stopped%RESET%
        echo [%date% %time%] Ollama stopped >> "%SHUTDOWN_LOG%"
    ) else (
        echo %BLUE%  Ollama left running%RESET%
        echo [%date% %time%] Ollama left running >> "%SHUTDOWN_LOG%"
    )
) else (
    echo %GREEN%✓ Ollama is not running%RESET%
    echo [%date% %time%] Ollama is not running >> "%SHUTDOWN_LOG%"
)

:: Step 5: Close terminal windows
echo.
echo %YELLOW%[5/5] Closing service terminal windows...%RESET%
echo [%date% %time%] Closing service terminal windows >> "%SHUTDOWN_LOG%"

:: Close windows by title
taskkill /fi "windowtitle eq Node.js Backend*" /f >nul 2>&1
taskkill /fi "windowtitle eq FastAPI Backend*" /f >nul 2>&1
taskkill /fi "windowtitle eq React Frontend*" /f >nul 2>&1
taskkill /fi "windowtitle eq Ollama Service*" /f >nul 2>&1

echo %GREEN%✓ Terminal windows closed%RESET%
echo [%date% %time%] Terminal windows closed >> "%SHUTDOWN_LOG%"

:: Final verification
echo.
echo %YELLOW%Verifying services are stopped...%RESET%
echo [%date% %time%] Verifying services are stopped >> "%SHUTDOWN_LOG%"

set "all_stopped=true"

:: Check port 5000 (Node.js)
netstat -an | findstr ":5000 " >nul 2>&1
if %errorlevel% equ 0 (
    echo %RED%✗ Port 5000 still in use%RESET%
    set "all_stopped=false"
) else (
    echo %GREEN%✓ Port 5000 free%RESET%
)

:: Check port 8000 (FastAPI)
netstat -an | findstr ":8000 " >nul 2>&1
if %errorlevel% equ 0 (
    echo %RED%✗ Port 8000 still in use%RESET%
    set "all_stopped=false"
) else (
    echo %GREEN%✓ Port 8000 free%RESET%
)

:: Check port 5173 (React)
netstat -an | findstr ":5173 " >nul 2>&1
if %errorlevel% equ 0 (
    echo %RED%✗ Port 5173 still in use%RESET%
    set "all_stopped=false"
) else (
    echo %GREEN%✓ Port 5173 free%RESET%
)

:: Final status
echo.
echo %BLUE%========================================%RESET%
if "%all_stopped%"=="true" (
    echo %GREEN%✓ ALL SERVICES STOPPED SUCCESSFULLY%RESET%
    echo [%date% %time%] All services stopped successfully >> "%SHUTDOWN_LOG%"
) else (
    echo %YELLOW%⚠ SOME SERVICES MAY STILL BE RUNNING%RESET%
    echo [%date% %time%] Some services may still be running >> "%SHUTDOWN_LOG%"
    echo.
    echo %YELLOW%If services are still running, you may need to:%RESET%
    echo   • Restart your computer
    echo   • Manually kill processes in Task Manager
    echo   • Check for processes using: netstat -ano
)
echo %BLUE%========================================%RESET%
echo.
echo %BLUE%Shutdown log saved to:%RESET%
echo   %SHUTDOWN_LOG%
echo.

:: Show running processes on our ports (for debugging)
echo %BLUE%Current port usage:%RESET%
netstat -ano | findstr ":5000\|:5173\|:8000\|:11434" 2>nul
if %errorlevel% neq 0 (
    echo   No processes found on monitored ports
)

echo.
echo [%date% %time%] Shutdown script completed >> "%SHUTDOWN_LOG%"
echo %YELLOW%Press any key to exit...%RESET%
pause >nul
exit /b 0