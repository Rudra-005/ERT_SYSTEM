@echo off
echo ========================================
echo   GROQ-POWERED TRIAGE ASSISTANT
echo   10-50x FASTER than Ollama!
echo ========================================
echo.

cd backend
echo Starting backend with Groq API...
start cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

cd ../frontend
echo Starting frontend...
start cmd /k "npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo   Expected Speed: 0.5-1.5 seconds
echo   (was 6-20 seconds with Ollama)
echo ========================================
echo.
echo Press any key to run speed test...
pause >nul

cd ..
node test-groq-speed.js

pause
