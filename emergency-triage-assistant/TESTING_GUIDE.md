# Quick Start - Testing Unique Results Fix

## 🚀 Start the System

### 1. Start Backend
```bash
cd c:\users\rudra\INTEL_PROJECT\emergency-triage-assistant\backend
npm start
```

Expected output:
```
Server running on port 5000
✅ Groq API configured
```

### 2. Start Frontend
```bash
cd c:\users\rudra\INTEL_PROJECT\emergency-triage-assistant\frontend
npm run dev
```

Expected output:
```
Local: http://localhost:5173
```

## 🧪 Test Unique Results

### Option 1: Automated Test Script
```bash
cd c:\users\rudra\INTEL_PROJECT\emergency-triage-assistant\backend
node test-unique-results.js
```

This will:
- Send 3 identical requests
- Compare results
- Verify uniqueness
- Check for NaN/0ms issues

### Option 2: Manual UI Test

1. Open browser: `http://localhost:5173`
2. Login to the system
3. Go to Patients view
4. Select a patient
5. Click "Run Triage"
6. Fill in symptoms and vitals
7. Click "⚡ Analyze Patient"
8. Note the results (confidence, latency, diagnosis)
9. Click "Analyze Patient" again with SAME data
10. Verify results are DIFFERENT

## ✅ What to Verify

### Each Analysis Should Show:

1. **Unique Case ID**
   - Format: `CASE_1234567890_abc123xyz`
   - Different every time

2. **Real Latency**
   - NOT 0ms
   - Typically 200-800ms
   - Varies each time

3. **Valid Confidence**
   - NOT always 85%
   - Range: 40-95%
   - Changes based on latency

4. **Token Reduction**
   - NOT NaN%
   - Shows real percentage (e.g., "23.5%")

5. **Different Diagnosis**
   - Varies between runs
   - Context-specific

6. **Different Priority**
   - Can be High/Medium/Low
   - Based on symptoms

## 🔍 Debug Logs

### Backend Console Should Show:
```
📝 [CASE_xxx] New case request: { symptoms: 'Chest pain...', age: 45 }
🔄 [CASE_xxx] Calling LLM with temperature=0.8 for unique results...
✅ [CASE_xxx] Got unique recommendation in 345ms (total: 367ms): High
📤 [CASE_xxx] Sending unique response with confidence=82, latency=367ms
```

### Frontend Console Should Show:
```
🔄 Starting NEW analysis - clearing old state...
📤 Calling backend /analyze-case with NEW data: { symptomsText: 'Chest pain...' }
✅ Got UNIQUE response from backend: { caseId: 'CASE_xxx', confidence: 82, latency: 367 }
```

## 🐛 Troubleshooting

### Issue: Still Getting Same Results

**Check:**
1. Backend is running (port 5000)
2. Frontend is calling correct URL
3. No browser cache (hard refresh: Ctrl+Shift+R)
4. Check backend logs for unique case IDs

**Fix:**
```bash
# Clear backend cache
cd backend
node -e "require('./src/services/hybridLLM').clearCache()"
```

### Issue: Latency Always 0ms

**Check:**
1. Backend is actually being called
2. Check network tab in browser DevTools
3. Verify API endpoint is correct

### Issue: Token Reduction Shows NaN

**Check:**
1. Backend tokenCounter is working
2. Symptoms are being sent properly
3. Check backend logs for token counts

### Issue: "undefined" Diagnosis

**Check:**
1. Groq API key is set in backend `.env`
2. LLM is responding properly
3. Check backend logs for LLM errors

## 📊 Expected Performance

| Metric | Expected Value | Issue if... |
|--------|---------------|-------------|
| Latency | 200-800ms | Always 0ms or always same |
| Confidence | 40-95% | Always 85% |
| Token Reduction | 10-60% | Shows NaN |
| Priority | High/Medium/Low | Always "undefined" |
| Case ID | Unique each time | Same ID repeated |
| From Cache | false | true |

## 🎯 Success Criteria

✅ **PASS** if:
- Each request has unique Case ID
- Latency > 0ms and varies
- Confidence varies (not always 85)
- Token Reduction shows percentage (not NaN)
- Diagnosis text is different
- Console logs show "fromCache: false"

❌ **FAIL** if:
- Same results for identical inputs
- Latency is 0ms
- Confidence always 85
- Token Reduction is NaN
- Diagnosis is "undefined"

## 📝 Test Cases

### Test Case 1: Cardiac Emergency
```json
{
  "symptoms": "Chest pain, shortness of breath, sweating",
  "age": 45,
  "vitals": "BP: 160/95, Pulse: 110, SpO2: 94%, Pain: 8/10"
}
```
Expected: High priority, varied confidence

### Test Case 2: Minor Complaint
```json
{
  "symptoms": "Mild headache, no other symptoms",
  "age": 30,
  "vitals": "BP: 120/80, Pulse: 72, SpO2: 98%, Pain: 2/10"
}
```
Expected: Low priority, varied confidence

### Test Case 3: Respiratory Issue
```json
{
  "symptoms": "Difficulty breathing, wheezing, cough",
  "age": 60,
  "vitals": "BP: 140/85, Pulse: 95, SpO2: 91%, Pain: 5/10"
}
```
Expected: High/Medium priority, varied confidence

## 🔧 Configuration

### Backend `.env` (Required)
```env
GROQ_API_KEY=gsk_your_key_here
PORT=5000
OLLAMA_BASE_URL=http://localhost:11434
```

### Frontend `.env` (Optional)
```env
VITE_API_URL=http://localhost:5000
```

## 📞 Support

If issues persist:
1. Check `AI_TRIAGE_FIX_SUMMARY.md` for detailed fix documentation
2. Review backend logs for errors
3. Verify Groq API key is valid
4. Ensure Ollama is running (optional fallback)
