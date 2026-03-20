# 🚀 400ms Performance Optimization Guide

## Overview

This system enforces a **strict 400ms end-to-end latency budget** across all layers of the Emergency Triage System.

## Time Budget Allocation

| Component | Budget | Purpose |
|-----------|--------|---------|
| FAISS Vector Retrieval | 40ms | Semantic search |
| Embedding Generation | 30ms | Query vectorization |
| Ollama phi3:mini Inference | 250ms | LLM response |
| Node.js Route Handling | 20ms | Request processing |
| FastAPI Route Handling | 20ms | Request processing |
| Network Round Trip | 30ms | Frontend ↔ Backend |
| Safety Buffer | 30ms | Unexpected overhead |
| **TOTAL** | **400ms** | **Hard limit** |

## Ollama Configuration (MANDATORY)

Every Ollama API call must use these exact parameters:

```javascript
{
  model: "phi3:mini",
  prompt: "<|system|>\n{system}<|end|>\n<|user|>\n{user}<|end|>\n<|assistant|>",
  stream: false,
  options: {
    temperature: 0.1,
    num_predict: 120,        // NEVER exceed this
    top_k: 10,
    top_p: 0.5,
    repeat_penalty: 1.1
  }
}
```

## RAG Pipeline Configuration

```python
CHUNK_SIZE = 150              # tokens
CHUNK_OVERLAP = 20            # tokens
TOP_K = 2                     # maximum chunks
SIMILARITY_THRESHOLD = 0.75   # minimum cosine similarity
MAX_CONTEXT_TOKENS = 400      # total context limit
```

## Cache Configuration

- **TTL**: 120 seconds
- **Lookup Time**: <2ms
- **Key Format**: `md5(patient_id:normalized_question)`
- **Storage**: In-memory (Map/Dict)

## Timeout Enforcement

### Ollama Timeout
- **Hard Timeout**: 350ms
- **Fallback Response**: Pre-written message
- **Triage Fallback**: "Unable to complete AI analysis within the required time. Please assess the patient manually using the displayed vital thresholds."
- **RAG Fallback**: "Unable to retrieve information within the required time. Please consult medical records manually."

### Frontend Timeout
- **Request Timeout**: 400ms (axios)
- **Behavior**: Cancel request, show fallback, log to console

## File Structure

### FastAPI Backend
```
fastapi-backend/
├── app/
│   ├── middleware/
│   │   └── latency_middleware.py       # 400ms enforcement
│   ├── services/
│   │   ├── ollama_service.py           # 350ms timeout + fallback
│   │   ├── rag_pipeline.py             # Optimized RAG
│   │   └── cache_service.py            # 120s TTL cache
│   └── main_optimized.py               # Updated main with warmup
```

### Node.js Backend
```
backend/
├── middleware/
│   └── latencyMiddleware.js            # 400ms enforcement
├── services/
│   ├── ollamaService.js                # 350ms timeout + fallback
│   └── cacheService.js                 # 120s TTL cache
├── emergencyProtocolEngine.js          # <5ms protocol detection
└── server_optimized.js                 # Updated server with warmup
```

### React Frontend
```
frontend/src/
├── components/
│   └── LatencyDashboard.jsx            # Ctrl+Shift+L dashboard
└── utils/
    └── axiosConfig.js                  # 400ms timeout config
```

## Running the Optimized System

### 1. Start Ollama (CRITICAL)
```bash
# Pre-load model into memory
ollama run phi3:mini
# Type /bye to exit but keep model loaded
```

### 2. Start FastAPI Backend
```bash
cd fastapi-backend
python -m uvicorn app.main_optimized:app --reload --port 8000
```

Expected output:
```
🚀 Starting FastAPI backend...
Running Ollama warmup...
✓ Ollama warmup completed in 245.32ms
✓ FastAPI backend ready
```

### 3. Start Node.js Backend
```bash
cd backend
node server_optimized.js
```

Expected output:
```
🚀 Starting Node.js backend...
Running Ollama warmup...
✓ Ollama warmup completed in 238.45ms
✓ Node.js backend ready on port 5000
```

### 4. Start React Frontend
```bash
cd frontend
npm run dev
```

## Using the Latency Dashboard

### Toggle Dashboard
Press **Ctrl+Shift+L** to show/hide the latency monitor

### Color Indicators
- 🟢 **Green** (<300ms): Excellent performance
- 🟡 **Yellow** (300-380ms): Warning - approaching limit
- 🔴 **Red** (380-400ms): Critical - near violation
- 🔴 **Bright Red** (≥400ms): VIOLATION - exceeds limit

### Dashboard Features
- Shows last 10 requests
- Route name and timestamp
- Exact latency in milliseconds
- Status label (OK/WARNING/CRITICAL/VIOLATION)
- Fixed bottom-right position

## Latency Monitoring

### Console Logging

**Green (OK)**: <300ms
```
Route: /triage | Latency: 287.45ms
```

**Yellow (Warning)**: 300-380ms
```
⚠️ Route: /triage | Latency: 342.12ms
```

**Red (Critical)**: 380-400ms
```
⚠️  WARNING: Near Limit ⚠️
Route: /triage | Patient ID: P12345 | Latency: 389.67ms
```

**Red (Violation)**: ≥400ms
```
🚨 CRITICAL VIOLATION 🚨
Route: /triage
Patient ID: P12345
Total Latency: 423.89ms (EXCEEDS 400ms LIMIT)
Breakdown:
  - Cache Lookup: 1.23ms
  - Protocol Detection: 3.45ms
  - LLM: 387.21ms
  - Other: 32.00ms
```

## Startup Validation

Both backends run a warmup test on startup:

### Success (Warmup <350ms)
```
✓ Ollama warmup completed in 245.32ms
```

### Warning (Warmup >350ms)
```
============================================================
⚠️  PERFORMANCE WARNING ⚠️
Ollama warmup: 412.56ms (exceeds 350ms)
System may not meet 400ms latency requirement.
Run: ollama run phi3:mini
============================================================
```

## Troubleshooting

### Issue: Requests timing out
**Solution**: Ensure Ollama model is pre-loaded
```bash
ollama run phi3:mini
# Wait for model to load, then type /bye
```

### Issue: High latency (>350ms)
**Causes**:
1. Model not pre-loaded in memory
2. CPU throttling
3. Other processes consuming resources

**Solutions**:
1. Pre-load model: `ollama run phi3:mini`
2. Close unnecessary applications
3. Check CPU usage: `top` or Task Manager

### Issue: Cache not working
**Check**:
```bash
# Node.js
curl http://localhost:5000/health

# FastAPI
curl http://localhost:8000/health
```

Response should include:
```json
{
  "status": "healthy",
  "cache_stats": {
    "total_entries": 5,
    "ttl_seconds": 120
  }
}
```

### Issue: Frontend timeout errors
**Check**:
1. Open browser console (F12)
2. Look for: `❌ Request timeout: /triage exceeded 400ms`
3. Check backend logs for latency breakdown

## Performance Testing

### Test Single Request
```bash
# Node.js backend
time curl -X POST http://localhost:5000/triage \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"P001","vitals":{"pulse_rate":75}}'

# FastAPI backend
time curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is sepsis?","patient_id":"P001"}'
```

### Test Cache Performance
```bash
# First request (cache miss)
curl -X POST http://localhost:5000/triage -d '{"patient_id":"P001",...}'

# Second request (cache hit - should be <5ms)
curl -X POST http://localhost:5000/triage -d '{"patient_id":"P001",...}'
```

### Clear Cache
```bash
# Node.js
curl -X POST http://localhost:5000/cache/clear

# FastAPI
curl -X POST http://localhost:8000/cache/clear
```

## API Response Format

All responses include latency metadata:

```json
{
  "assessment": "...",
  "emergency_protocols": [...],
  "fallback_used": false,
  "cached": false,
  "_latency_ms": 287.45,
  "_timings": {
    "protocol_ms": 3.21,
    "llm_ms": 245.67,
    "cache_ms": 0.89
  }
}
```

## Production Checklist

- [ ] Ollama model pre-loaded: `ollama run phi3:mini`
- [ ] Both backends show warmup <350ms
- [ ] Latency dashboard accessible (Ctrl+Shift+L)
- [ ] Test request completes <400ms
- [ ] Cache working (check /health endpoint)
- [ ] Console shows color-coded latency logs
- [ ] Frontend timeout set to 400ms
- [ ] Emergency protocol engine integrated

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Total Latency | <300ms | <400ms |
| Cache Hit | <2ms | <5ms |
| Protocol Detection | <5ms | <10ms |
| Ollama Response | <250ms | <350ms |
| FAISS Retrieval | <40ms | <60ms |
| Embedding | <30ms | <50ms |

## Support

If latency consistently exceeds 400ms:
1. Check Ollama model is loaded: `ollama list`
2. Verify CPU is not throttled
3. Reduce `num_predict` to 100 (from 120)
4. Increase `SIMILARITY_THRESHOLD` to 0.80 (from 0.75)
5. Reduce `TOP_K` to 1 (from 2)

---

**Remember**: 400ms is a HARD LIMIT. No exceptions.
