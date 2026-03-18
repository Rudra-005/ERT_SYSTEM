const express = require('express');
const router = express.Router();
const { hybridCall, getStats, clearCache } = require('../services/hybridLLM');
const { compressText } = require('../services/compression');
const { verifyHallucination } = require('../services/verification');
const { calculateConfidence } = require('../services/confidence');
const { countTokens, calculateTokenReduction } = require('../utils/tokenCounter');

/**
 * Ultra-fast hybrid endpoint
 * Target: <400ms with cache, <800ms with Groq
 */
router.post('/ultra-fast', async (req, res) => {
  const startTime = Date.now();
  const { caseDescription, apiKey } = req.body;

  if (!caseDescription) {
    return res.status(400).json({ error: 'Missing caseDescription' });
  }

  try {
    const latency = {};
    
    // Step 1: Compress (5-10ms)
    const t1 = Date.now();
    const compressed = compressText(caseDescription);
    latency.compression = Date.now() - t1;

    const tokenStats = calculateTokenReduction(caseDescription, compressed);

    // Step 2: Hybrid LLM call (0-5ms cache, 150-300ms Groq, 2-5s Ollama)
    const t2 = Date.now();
    const input = `Analyze this emergency case and provide triage recommendation:\n\n${compressed}`;
    
    const result = await hybridCall(input, {
      systemPrompt: 'You are an emergency triage AI. Provide concise, actionable medical recommendations in 2-3 sentences.',
      temperature: 0.1,
      maxTokens: 200 // Reduced for speed
    });
    
    latency.llm = Date.now() - t2;
    latency.llmProvider = result.provider;
    latency.fromCache = result.fromCache;

    // Step 3: Quick verification (10-15ms)
    const t3 = Date.now();
    const verification = verifyHallucination(caseDescription, result.response);
    latency.verification = Date.now() - t3;

    // Step 4: Confidence (5-10ms)
    const t4 = Date.now();
    const confidence = calculateConfidence(verification.score, tokenStats.reduction);
    latency.confidence = Date.now() - t4;

    latency.total = Date.now() - startTime;

    // Performance warning
    if (latency.total > 400 && result.fromCache === false && result.provider === 'groq') {
      console.warn(`⚠️  Slower than target: ${latency.total}ms (target: <400ms)`);
    }

    res.json({
      success: true,
      mode: 'ultra-fast-hybrid',
      data: {
        original: caseDescription,
        compressed,
        recommendation: result.response,
        tokenStats,
        verification,
        confidence,
        latency,
        performance: {
          target: '<400ms with cache, <800ms with Groq',
          actual: `${latency.total}ms`,
          metTarget: latency.total < (result.fromCache ? 400 : 800),
          provider: result.provider,
          fromCache: result.fromCache
        }
      }
    });

    console.log(`✅ Ultra-fast completed in ${latency.total}ms (${result.provider}${result.fromCache ? ' - cached' : ''})`);
  } catch (error) {
    console.error(`❌ Ultra-fast error: ${error.message}`);
    res.status(500).json({ error: 'Processing failed', message: error.message });
  }
});

/**
 * Get performance statistics
 */
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json({
    success: true,
    stats,
    recommendations: {
      cacheHitRate: `${(stats.cache.hitRate * 100).toFixed(1)}%`,
      avgGroqLatency: `${stats.groq.avgLatency}ms`,
      avgOllamaLatency: `${stats.ollama.avgLatency}ms`,
      groqSuccessRate: `${(stats.groq.successRate * 100).toFixed(1)}%`,
      ollamaSuccessRate: `${(stats.ollama.successRate * 100).toFixed(1)}%`
    }
  });
});

/**
 * Clear cache (for testing)
 */
router.post('/clear-cache', (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;
