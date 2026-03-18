# 🚀 Emergency Triage Assistant - Windows Management Scripts

Complete Windows batch scripts for managing your Emergency Triage Assistant project.

## 📁 Script Overview

| Script | Purpose | Description |
|--------|---------|-------------|
| `start-all.bat` | 🟢 Start All Services | Comprehensive startup with health checks |
| `stop-all.bat` | 🔴 Stop All Services | Clean shutdown of all services |
| `status.bat` | 📊 Check Status | Quick health check of all services |
| `view-logs.bat` | 📋 View Logs | Interactive log viewer and manager |

## 🎯 Quick Start

### Start Everything
```cmd
start-all.bat
```

### Check Status
```cmd
status.bat
```

### Stop Everything
```cmd
stop-all.bat
```

## 🔧 start-all.bat Features

### ✅ What It Does:
1. **Ollama Management**
   - Checks if Ollama is running on port 11434
   - Starts Ollama service if not running
   - Waits up to 30 seconds for startup
   - Verifies phi3:mini model availability
   - Downloads phi3:mini if missing

2. **Backend Services**
   - Starts Node.js backend (port 5000) in new terminal
   - Activates Python virtual environment
   - Starts FastAPI backend (port 8000) in new terminal
   - Starts React frontend (port 5173) in new terminal

3. **Health Monitoring**
   - Performs health checks on all services
   - Shows colored status (GREEN/RED/YELLOW)
   - Opens browser to http://localhost:5173
   - Comprehensive logging to timestamped files

4. **Error Handling**
   - Validates all directories exist
   - Checks for required files (package.json, main.py)
   - Graceful failure with detailed error messages
   - Rollback on critical failures

### 📊 Output Example:
```
========================================
  Emergency Triage Assistant Startup   
========================================

[1/7] Checking Ollama service...
✓ Ollama is already running
✓ phi3:mini model is available

[2/7] Starting Node.js backend...
✓ Node.js backend started on port 5000

[3/7] Starting FastAPI backend...
✓ FastAPI backend started on port 8000

[4/7] Starting React frontend...
✓ React frontend started on port 5173

[5/7] Performing final health checks...
✓ Ollama: Healthy
✓ Node.js Backend: Healthy
✓ FastAPI Backend: Healthy
✓ React Frontend: Healthy

[6/7] Opening application in browser...

========================================
✓ ALL SERVICES STARTED SUCCESSFULLY
========================================
```

## 🛑 stop-all.bat Features

### ✅ What It Does:
1. **Process Management**
   - Finds processes by port (5000, 8000, 5173)
   - Kills Node.js, Python, and frontend processes
   - Closes service terminal windows
   - Optional Ollama shutdown

2. **Verification**
   - Confirms all ports are freed
   - Shows remaining processes if any
   - Detailed shutdown logging

3. **Safety Features**
   - Asks before stopping Ollama
   - Graceful process termination
   - Fallback to force kill if needed

### 📊 Output Example:
```
========================================
  Emergency Triage Assistant Shutdown  
========================================

[1/5] Stopping Node.js backend...
✓ Node.js process stopped

[2/5] Stopping FastAPI backend...
✓ FastAPI backend stopped

[3/5] Stopping React frontend...
✓ React frontend stopped

[4/5] Checking Ollama service...
  Ollama left running

[5/5] Closing service terminal windows...
✓ Terminal windows closed

========================================
✓ ALL SERVICES STOPPED SUCCESSFULLY
========================================
```

## 📊 status.bat Features

Quick health check showing:
- ✅ Service status (Running/Not running)
- 🔍 Port usage details
- 📦 Model availability (phi3:mini)
- 🌐 Service URLs

## 📋 view-logs.bat Features

Interactive log management:
- 📄 List all available log files
- 👀 View individual logs
- 📊 View all latest logs
- 🗑️ Clear all logs
- 🔍 Timestamped log files

## 📁 Log Files Generated

All logs are saved to `logs/` directory with timestamps:

```
logs/
├── startup_2024-01-15_14-30-25.log     # Main startup log
├── ollama_2024-01-15_14-30-25.log      # Ollama service log
├── nodejs_2024-01-15_14-30-25.log      # Node.js backend log
├── fastapi_2024-01-15_14-30-25.log     # FastAPI backend log
├── frontend_2024-01-15_14-30-25.log    # React frontend log
└── shutdown_2024-01-15_16-45-10.log    # Shutdown log
```

## 🔧 Prerequisites

### Required Software:
- **Node.js** (for backend and frontend)
- **Python** with virtual environment at `../.venv`
- **Ollama** installed and accessible
- **curl** (usually included with Windows 10+)

### Required Project Structure:
```
emergency-triage-assistant/
├── backend/
│   └── package.json
├── fastapi-backend/
│   └── app/main.py
├── frontend/
│   └── package.json
├── ../.venv/              # Python virtual environment
├── start-all.bat
├── stop-all.bat
├── status.bat
└── view-logs.bat
```

## 🚨 Troubleshooting

### Common Issues:

#### "Virtual environment not found"
```cmd
# Create virtual environment
cd ..
python -m venv .venv
cd emergency-triage-assistant
```

#### "phi3:mini model missing"
```cmd
ollama pull phi3:mini
```

#### "Port already in use"
```cmd
# Check what's using the port
netstat -ano | findstr ":5000"
# Kill the process
taskkill /pid <PID> /f
```

#### "Node.js/Python not found"
- Ensure Node.js and Python are in your PATH
- Restart command prompt after installation

### Debug Mode:
Add `echo on` at the top of any .bat file to see detailed execution.

## 🎯 Service URLs

Once started, access your services at:

- **🌐 Main Application**: http://localhost:5173
- **🔧 Node.js API**: http://localhost:5000
- **⚡ FastAPI Backend**: http://localhost:8000
- **🤖 Ollama**: http://localhost:11434

### Health Endpoints:
- Node.js: http://localhost:5000/api/health
- FastAPI: http://localhost:8000/health
- Ollama: http://localhost:11434/api/tags

## 🔄 Development Workflow

### Daily Development:
```cmd
# Start everything
start-all.bat

# Check status anytime
status.bat

# View logs if issues
view-logs.bat

# Stop when done
stop-all.bat
```

### Debugging Issues:
```cmd
# Check what's running
status.bat

# View recent logs
view-logs.bat

# Clean restart
stop-all.bat
start-all.bat
```

## 🎉 Features Summary

- ✅ **Automated startup** with dependency checking
- 🔍 **Health monitoring** with colored output
- 📊 **Comprehensive logging** with timestamps
- 🛡️ **Error handling** and graceful failures
- 🔄 **Clean shutdown** with process verification
- 📋 **Status checking** and log management
- 🎨 **Colored output** for easy reading
- ⏱️ **Timeout handling** for service startup
- 🌐 **Automatic browser opening**
- 📁 **Organized log management**

Your Emergency Triage Assistant is now fully manageable with these Windows batch scripts! 🚀