# 🔧 Detailed Analysis Debugging Guide

## ✅ What I Fixed

1. **Mode-based routing** - The app now uses different endpoints for each mode:
   - **Optimized Mode**: Uses `/api/triage` (fast, <400ms)
   - **Detailed Mode**: Uses `/api/triage/detailed` (comprehensive, <800ms)
   - **A/B Compare Mode**: Uses `/api/compare` endpoint

2. **Comprehensive Logging** - Added logging at every stage:
   - Frontend: Shows all API requests and responses in console
   - Backend: Shows when requests arrive and when responses are sent

3. **Error Boundary** - Catches any rendering errors and displays them safely

## 🧪 How to Test

### Step 1: Open Developer Tools
Press **F12** in your browser to open the Developer Tools

### Step 2: Go to Console Tab
Click on the **Console** tab to see logs

### Step 3: Fill in Patient Data
- Load Cardiac Sample (click the red heart button)
- Or manually fill in the fields

### Step 4: Select Analysis Mode
- **Optimized** ⚡ - Fastest response (<400ms)
- **Detailed** 📋 - Complete analysis (<800ms)  
- **A/B Compare** ⚖️ - Compare approaches

### Step 5: Click "🚀 Analyze Case"

### Step 6: Watch the Console
You should see logs like:
```
📤 Request: POST http://localhost:5000/api/triage/detailed
🔄 Detailed triage request received at: [timestamp]
📝 Processing case...
✅ Detailed analysis complete: 523ms
📥 Response (523ms): 200 from http://localhost:5000/api/triage/detailed
✅ Analysis response: {data object}
📊 Processed detailed result: {formatted object}
```

## 🔴 If You See Errors

### Error: "Cannot read property 'X' of undefined"
- **Cause**: API response format doesn't match expected structure
- **Solution**: Check the "✅ Analysis response" log to see actual response structure

### Error: "Request timeout"
- **Cause**: Backend not responding within time limit
- **Solution**: Check if Groq API key is set: Check backend logs
  - On Windows: Look in terminal where backend is running
  - Look for "GROQ_API_KEY" error messages

### Error: "Network request failed"
- **Cause**: Backend server not running or wrong URL
- **Solution**: 
  - Check if backend is running on http://localhost:5000
  - Verify backend logs show "Server running on port 5000"

## 🔍 Reading the Console Logs

**Frontend logs** (browser console):
- `📤 Request:` - API request being made  
- `✅ Analysis response:` - Raw response from backend
- `📊 Processed result:` - Formatted data ready for UI

**Backend logs** (terminal where backend is running):
- `🔄 Request received` - Backend got the request
- `✅ Analysis complete` - Analysis finished with timing
- `📤 Sending response` - Response being sent back

## ✨ Expected Output

When **Detailed Mode** works properly, you should see:

**In Browser Console**:
```json
✅ Analysis response: {
  success: true,
  mode: "detailed-groq-ollama",
  data: {
    recommendation: {
      immediate_action: "...",
      differential_diagnosis: [...],
      supporting_evidence: "...",
      ...
    },
    performance: {
      total_ms: 523,
      compression_ms: 2,
      recommendation_ms: 450,
      verification_ms: 8
    }
  }
}
```

**On Screen**:
- 4 metric cards showing: Total Latency, Compression, Recommendation, Verification
- Circular progress chart with token reduction
- LatencyBarGraph showing performance breakdown
- Confidence Gauge
- Alert box with immediate action in red/yellow/green
- Differential Diagnosis section
- Supporting Evidence & Risks section

## 🚀 Next Steps

1. **Click "Analyze Case"** with pre-filled patient data
2. **Check browser console** (F12) for the logs
3. **Share the first error message** you see - that will tell me what's wrong
4. **Or share the console logs** if it works but nothing appears on screen

The logs will show me exactly where the flow is breaking!
