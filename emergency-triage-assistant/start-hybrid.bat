@echo off
echo ========================================
echo   HYBRID TRIAGE SYSTEM - ^<400ms
echo   Groq + Ollama + Cache
echo ========================================
echo.

cd backend
echo Starting hybrid backend...
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
echo   NEW HYBRID ENDPOINT:
echo   POST /api/hybrid/ultra-fast
echo.
echo   Performance:
echo   - Cache hit: 0-50ms
echo   - Groq call: 150-400ms
echo   - Ollama fallback: 2-5s
echo ========================================
echo.
echo Press any key to run hybrid test...
pause >nul

cd ..
node test-hybrid-system.js

pause
