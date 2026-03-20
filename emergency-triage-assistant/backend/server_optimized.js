/**
 * Node.js Express Server with Latency Enforcement
 * Includes warmup validation, cache integration, and 400ms hard limit
 */

const express = require('express');
const cors = require('cors');
const { latencyMiddleware, trackTiming } = require('./middleware/latencyMiddleware');
const { cache } = require('./services/cacheService');
const { ollamaService } = require('./services/ollamaService');
const { detectEmergencyProtocols } = require('./emergencyProtocolEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(latencyMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    cache_stats: cache.stats()
  });
});

// Triage endpoint with emergency protocol detection
app.post('/triage', async (req, res) => {
  const patientData = req.body;
  const patientId = patientData.patient_id;

  // Check cache first
  const cacheKey = JSON.stringify(patientData);
  const cachedResponse = cache.get(cacheKey, patientId);
  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  // Run emergency protocol detection (<5ms)
  const protocolStart = performance.now();
  const protocols = detectEmergencyProtocols(patientData);
  const protocolTime = performance.now() - protocolStart;
  trackTiming(req, 'protocol', protocolTime);

  // Build prompt with protocol context
  const systemPrompt = 'You are an emergency triage assistant. Provide concise clinical assessment.';
  
  let userPrompt = `Patient Data: ${JSON.stringify(patientData)}\n\n`;
  
  if (protocols.length > 0) {
    userPrompt += `EMERGENCY PROTOCOLS DETECTED: ${protocols.length}\n`;
    protocols.forEach(p => {
      userPrompt += `- ${p.protocol_name}: ${p.trigger_reason}\n`;
    });
    userPrompt += '\n';
  }
  
  userPrompt += 'Provide brief triage assessment:';

  // Call Ollama with 350ms timeout
  const llmStart = performance.now();
  const llmResult = await ollamaService.generate(systemPrompt, userPrompt, 'triage');
  const llmTime = performance.now() - llmStart;
  trackTiming(req, 'llm', llmTime);

  const response = {
    assessment: llmResult.response,
    emergency_protocols: protocols,
    fallback_used: llmResult.fallback_used,
    cached: false,
    timings: {
      protocol_ms: protocolTime,
      llm_ms: llmTime
    }
  };

  // Cache the response
  cache.set(cacheKey, response, patientId);

  res.json(response);
});

// Cache management
app.post('/cache/clear', (req, res) => {
  cache.clearAll();
  res.json({ status: 'cache cleared' });
});

// Startup with warmup validation
async function startServer() {
  console.log('🚀 Starting Node.js backend...');
  
  const warmupTime = await ollamaService.warmup();
  
  if (warmupTime > 350) {
    console.warn(
      '\n' + '='.repeat(60) + '\n' +
      '⚠️  PERFORMANCE WARNING ⚠️\n' +
      `Ollama warmup: ${warmupTime.toFixed(2)}ms (exceeds 350ms)\n` +
      'System may not meet 400ms latency requirement.\n' +
      'Run: ollama run phi3:mini\n' +
      '='.repeat(60) + '\n'
    );
  }

  app.listen(PORT, () => {
    console.log(`✓ Node.js backend ready on port ${PORT}`);
  });
}

startServer();

module.exports = app;
