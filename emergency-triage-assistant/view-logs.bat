@echo off
setlocal enabledelayedexpansion

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

set "LOGS_DIR=%~dp0logs"

echo %BLUE%========================================%RESET%
echo %BLUE%     Emergency Triage Assistant Logs    %RESET%
echo %BLUE%========================================%RESET%
echo.

if not exist "%LOGS_DIR%" (
    echo %RED%✗ Logs directory not found: %LOGS_DIR%%RESET%
    echo.
    echo %YELLOW%Run start-all.bat first to generate logs.%RESET%
    goto end
)

:: List available log files
echo %YELLOW%Available log files:%RESET%
echo.

set /a "count=0"
for %%f in ("%LOGS_DIR%\*.log") do (
    set /a "count+=1"
    echo   !count!. %%~nxf
    set "file!count!=%%f"
)

if %count% equ 0 (
    echo %RED%  No log files found%RESET%
    goto end
)

echo.
echo %YELLOW%Options:%RESET%
echo   A. View all logs (latest)
echo   C. Clear all logs
echo   Q. Quit
echo.

:menu
set /p "choice=Select option (1-%count%/A/C/Q): "

if /i "%choice%"=="Q" goto end
if /i "%choice%"=="A" goto view_all
if /i "%choice%"=="C" goto clear_logs

:: Check if it's a number
set "selected_file="
if "%choice%" geq "1" if "%choice%" leq "%count%" (
    call set "selected_file=%%file%choice%%%"
    goto view_file
)

echo %RED%Invalid choice. Please try again.%RESET%
goto menu

:view_file
echo.
echo %BLUE%Viewing: %selected_file%%RESET%
echo %BLUE%========================================%RESET%
type "%selected_file%"
echo.
echo %BLUE%========================================%RESET%
echo %YELLOW%Press any key to return to menu...%RESET%
pause >nul
echo.
goto menu

:view_all
echo.
echo %BLUE%Viewing all latest logs:%RESET%
echo %BLUE%========================================%RESET%

:: Find and display the latest startup log
for /f "delims=" %%f in ('dir "%LOGS_DIR%\startup_*.log" /b /o-d 2^>nul') do (
    echo.
    echo %YELLOW%=== Latest Startup Log: %%f ===%RESET%
    type "%LOGS_DIR%\%%f" | findstr /n "^" | more
    goto next_log
)

:next_log
:: Find and display the latest Node.js log
for /f "delims=" %%f in ('dir "%LOGS_DIR%\nodejs_*.log" /b /o-d 2^>nul') do (
    echo.
    echo %YELLOW%=== Latest Node.js Log: %%f ===%RESET%
    type "%LOGS_DIR%\%%f" | findstr /n "^" | more
    goto next_log2
)

:next_log2
:: Find and display the latest FastAPI log
for /f "delims=" %%f in ('dir "%LOGS_DIR%\fastapi_*.log" /b /o-d 2^>nul') do (
    echo.
    echo %YELLOW%=== Latest FastAPI Log: %%f ===%RESET%
    type "%LOGS_DIR%\%%f" | findstr /n "^" | more
    goto logs_done
)

:logs_done
echo.
echo %BLUE%========================================%RESET%
echo %YELLOW%Press any key to return to menu...%RESET%
pause >nul
echo.
goto menu

:clear_logs
echo.
echo %RED%Are you sure you want to delete all log files? (y/N)%RESET%
set /p "confirm=  "
if /i "%confirm%"=="y" (
    del "%LOGS_DIR%\*.log" >nul 2>&1
    echo %GREEN%✓ All log files deleted%RESET%
) else (
    echo %YELLOW%Operation cancelled%RESET%
)
echo.
goto menu

:end
echo %YELLOW%Press any key to exit...%RESET%
pause >nul