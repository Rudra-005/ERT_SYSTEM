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
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FASTAPI_DIR=%PROJECT_ROOT%fastapi-backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "VENV_DIR=%PROJECT_ROOT%..\.venv"
set "LOGS_DIR=%PROJECT_ROOT%logs"

:: Create logs directory
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Set log files with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
set "MAIN_LOG=%LOGS_DIR%\startup_%TIMESTAMP%.log"
set "OLLAMA_LOG=%LOGS_DIR%\ollama_%TIMESTAMP%.log"
set "NODE_LOG=%LOGS_DIR%\nodejs_%TIMESTAMP%.log"
set "FASTAPI_LOG=%LOGS_DIR%\fastapi_%TIMESTAMP%.log"
set "FRONTEND_LOG=%LOGS_DIR%\frontend_%TIMESTAMP%.log"

echo %BLUE%========================================%RESET%
echo %BLUE%  Emergency Triage Assistant Startup   %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Log startup
echo [%date% %time%] Starting Emergency Triage Assistant >> "%MAIN_LOG%"

:: Step 1: Check and start Ollama
echo %YELLOW%[1/7] Checking Ollama service...%RESET%
echo [%date% %time%] Checking Ollama service >> "%MAIN_LOG%"

:: Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Ollama is already running%RESET%
    echo [%date% %time%] Ollama is already running >> "%MAIN_LOG%"
) else (
    echo %YELLOW%  Starting Ollama...%RESET%
    echo [%date% %time%] Starting Ollama >> "%MAIN_LOG%"
    
    :: Start Ollama in background
    start "Ollama Service" /min cmd /c "ollama serve > \"%OLLAMA_LOG%\" 2>&1"
    
    :: Wait for Ollama to start (max 30 seconds)
    set /a "counter=0"
    :wait_ollama
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% equ 0 (
        echo %GREEN%✓ Ollama started successfully%RESET%
        echo [%date% %time%] Ollama started successfully >> "%MAIN_LOG%"
        goto ollama_ready
    )
    set /a "counter+=1"
    if %counter% lss 15 goto wait_ollama
    
    echo %RED%✗ Failed to start Ollama after 30 seconds%RESET%
    echo [%date% %time%] ERROR: Failed to start Ollama >> "%MAIN_LOG%"
    goto error_exit
)

:ollama_ready

:: Step 2: Check and pull phi3:mini model
echo.
echo %YELLOW%[2/7] Checking phi3:mini model...%RESET%
echo [%date% %time%] Checking phi3:mini model >> "%MAIN_LOG%"

:: Check if phi3:mini model exists
ollama list | findstr "phi3:mini" >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ phi3:mini model is available%RESET%
    echo [%date% %time%] phi3:mini model is available >> "%MAIN_LOG%"
) else (
    echo %YELLOW%  Pulling phi3:mini model (this may take a few minutes)...%RESET%
    echo [%date% %time%] Pulling phi3:mini model >> "%MAIN_LOG%"
    
    ollama pull phi3:mini
    if %errorlevel% equ 0 (
        echo %GREEN%✓ phi3:mini model downloaded successfully%RESET%
        echo [%date% %time%] phi3:mini model downloaded successfully >> "%MAIN_LOG%"
    ) else (
        echo %RED%✗ Failed to download phi3:mini model%RESET%
        echo [%date% %time%] ERROR: Failed to download phi3:mini model >> "%MAIN_LOG%"
        goto error_exit
    )
)

:: Step 3: Start Node.js Backend
echo.
echo %YELLOW%[3/7] Starting Node.js backend...%RESET%
echo [%date% %time%] Starting Node.js backend >> "%MAIN_LOG%"

if not exist "%BACKEND_DIR%" (
    echo %RED%✗ Backend directory not found: %BACKEND_DIR%%RESET%
    echo [%date% %time%] ERROR: Backend directory not found >> "%MAIN_LOG%"
    goto error_exit
)

if not exist "%BACKEND_DIR%\package.json" (
    echo %RED%✗ package.json not found in backend directory%RESET%
    echo [%date% %time%] ERROR: package.json not found in backend >> "%MAIN_LOG%"
    goto error_exit
)

:: Start Node.js backend in new terminal
start "Node.js Backend (Port 5000)" cmd /k "cd /d \"%BACKEND_DIR%\" && echo Starting Node.js backend... && npm run dev > \"%NODE_LOG%\" 2>&1"

:: Wait and check if Node.js started
timeout /t 3 /nobreak >nul
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Node.js backend started on port 5000%RESET%
    echo [%date% %time%] Node.js backend started successfully >> "%MAIN_LOG%"
) else (
    echo %YELLOW%⚠ Node.js backend starting (may take a moment)%RESET%
    echo [%date% %time%] Node.js backend starting >> "%MAIN_LOG%"
)

:: Step 4: Start FastAPI Backend
echo.
echo %YELLOW%[4/7] Starting FastAPI backend...%RESET%
echo [%date% %time%] Starting FastAPI backend >> "%MAIN_LOG%"

if not exist "%FASTAPI_DIR%" (
    echo %RED%✗ FastAPI directory not found: %FASTAPI_DIR%%RESET%
    echo [%date% %time%] ERROR: FastAPI directory not found >> "%MAIN_LOG%"
    goto error_exit
)

if not exist "%VENV_DIR%" (
    echo %RED%✗ Virtual environment not found: %VENV_DIR%%RESET%
    echo [%date% %time%] ERROR: Virtual environment not found >> "%MAIN_LOG%"
    goto error_exit
)

if not exist "%FASTAPI_DIR%\app\main.py" (
    echo %RED%✗ FastAPI main.py not found%RESET%
    echo [%date% %time%] ERROR: FastAPI main.py not found >> "%MAIN_LOG%"
    goto error_exit
)

:: Start FastAPI backend in new terminal with virtual environment
start "FastAPI Backend (Port 8000)" cmd /k "cd /d \"%FASTAPI_DIR%\" && echo Activating virtual environment... && call \"%VENV_DIR%\Scripts\activate.bat\" && echo Starting FastAPI backend... && python -m uvicorn app.main:app --reload --port 8000 > \"%FASTAPI_LOG%\" 2>&1"

:: Wait and check if FastAPI started
timeout /t 5 /nobreak >nul
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ FastAPI backend started on port 8000%RESET%
    echo [%date% %time%] FastAPI backend started successfully >> "%MAIN_LOG%"
) else (
    echo %YELLOW%⚠ FastAPI backend starting (may take a moment)%RESET%
    echo [%date% %time%] FastAPI backend starting >> "%MAIN_LOG%"
)

:: Step 5: Start React Frontend
echo.
echo %YELLOW%[5/7] Starting React frontend...%RESET%
echo [%date% %time%] Starting React frontend >> "%MAIN_LOG%"

if not exist "%FRONTEND_DIR%" (
    echo %RED%✗ Frontend directory not found: %FRONTEND_DIR%%RESET%
    echo [%date% %time%] ERROR: Frontend directory not found >> "%MAIN_LOG%"
    goto error_exit
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo %RED%✗ package.json not found in frontend directory%RESET%
    echo [%date% %time%] ERROR: package.json not found in frontend >> "%MAIN_LOG%"
    goto error_exit
)

:: Start React frontend in new terminal
start "React Frontend (Port 5173)" cmd /k "cd /d \"%FRONTEND_DIR%\" && echo Starting React frontend... && npm run dev > \"%FRONTEND_LOG%\" 2>&1"

:: Wait for frontend to start
timeout /t 3 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ React frontend started on port 5173%RESET%
    echo [%date% %time%] React frontend started successfully >> "%MAIN_LOG%"
) else (
    echo %YELLOW%⚠ React frontend starting (may take a moment)%RESET%
    echo [%date% %time%] React frontend starting >> "%MAIN_LOG%"
)

:: Step 6: Final health checks
echo.
echo %YELLOW%[6/7] Performing final health checks...%RESET%
echo [%date% %time%] Performing final health checks >> "%MAIN_LOG%"

timeout /t 5 /nobreak >nul

set "all_healthy=true"

:: Check Ollama
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Ollama: Healthy%RESET%
) else (
    echo %RED%✗ Ollama: Not responding%RESET%
    set "all_healthy=false"
)

:: Check Node.js
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Node.js Backend: Healthy%RESET%
) else (
    echo %RED%✗ Node.js Backend: Not responding%RESET%
    set "all_healthy=false"
)

:: Check FastAPI
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ FastAPI Backend: Healthy%RESET%
) else (
    echo %RED%✗ FastAPI Backend: Not responding%RESET%
    set "all_healthy=false"
)

:: Check React
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ React Frontend: Healthy%RESET%
) else (
    echo %RED%✗ React Frontend: Not responding%RESET%
    set "all_healthy=false"
)

:: Step 7: Open browser
echo.
echo %YELLOW%[7/7] Opening application in browser...%RESET%
echo [%date% %time%] Opening browser >> "%MAIN_LOG%"

timeout /t 2 /nobreak >nul
start http://localhost:5173

:: Final status
echo.
echo %BLUE%========================================%RESET%
if "%all_healthy%"=="true" (
    echo %GREEN%✓ ALL SERVICES STARTED SUCCESSFULLY%RESET%
    echo [%date% %time%] All services started successfully >> "%MAIN_LOG%"
) else (
    echo %YELLOW%⚠ SOME SERVICES MAY STILL BE STARTING%RESET%
    echo [%date% %time%] Some services may still be starting >> "%MAIN_LOG%"
)
echo %BLUE%========================================%RESET%
echo.
echo %BLUE%Service URLs:%RESET%
echo   • Main App: %BLUE%http://localhost:5173%RESET%
echo   • Node.js API: %BLUE%http://localhost:5000%RESET%
echo   • FastAPI: %BLUE%http://localhost:8000%RESET%
echo   • Ollama: %BLUE%http://localhost:11434%RESET%
echo.
echo %BLUE%Logs saved to:%RESET%
echo   • Main: %LOGS_DIR%\startup_%TIMESTAMP%.log
echo   • Ollama: %LOGS_DIR%\ollama_%TIMESTAMP%.log
echo   • Node.js: %LOGS_DIR%\nodejs_%TIMESTAMP%.log
echo   • FastAPI: %LOGS_DIR%\fastapi_%TIMESTAMP%.log
echo   • Frontend: %LOGS_DIR%\frontend_%TIMESTAMP%.log
echo.
echo %YELLOW%Press any key to exit (services will continue running)...%RESET%
pause >nul
goto end

:error_exit
echo.
echo %RED%========================================%RESET%
echo %RED%✗ STARTUP FAILED%RESET%
echo %RED%========================================%RESET%
echo [%date% %time%] Startup failed >> "%MAIN_LOG%"
echo.
echo %YELLOW%Check the logs for more details:%RESET%
echo   %MAIN_LOG%
echo.
echo %YELLOW%Press any key to exit...%RESET%
pause >nul
exit /b 1

:end
echo [%date% %time%] Startup script completed >> "%MAIN_LOG%"
exit /b 0