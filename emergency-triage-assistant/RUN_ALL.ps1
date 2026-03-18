#!/usr/bin/env pwsh
# Emergency Triage Assistant - Complete Startup Script
# Run this with: .\RUN_ALL.ps1

Write-Host "`n" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Emergency Triage Assistant - STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Green

# Get paths
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ParentDir = Split-Path -Parent $ProjectRoot
$VenvPath = Join-Path $ParentDir ".venv"

Write-Host "[*] Project Root: $ProjectRoot" -ForegroundColor Yellow

# Create logs directory
$LogsDir = Join-Path $ProjectRoot "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

# Start services in separate windows
Write-Host "`n[*] Starting Ollama Service (Port 11434)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$ProjectRoot'; ollama serve`"" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "[*] Starting Node.js Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$($ProjectRoot)\backend'; npm start`"" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "[*] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Yellow
$PythonExe = Join-Path $VenvPath "Scripts\python.exe"
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$($ProjectRoot)\fastapi-backend'; & '$PythonExe' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`"" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "[*] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$($ProjectRoot)\frontend'; npm run dev`"" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host "`n" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n" -ForegroundColor Green

Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Node.js API:        http://localhost:5000" -ForegroundColor Cyan
Write-Host "FastAPI Backend:    http://localhost:8000" -ForegroundColor Cyan
Write-Host "Ollama Service:     http://localhost:11434" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Green

Write-Host "Note: Check the individual terminal windows for service status" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop individual services" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor Green
