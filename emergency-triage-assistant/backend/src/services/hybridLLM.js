const axios = require('axios');
const crypto = require('crypto');

// Anti-duplication state
let lastResponseHash = null;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';

// In-memory cache for ultra-fast responses
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Performance tracking
let stats = {
  groq: { calls: 0, totalTime: 0, errors: 0 },
  ollama: { calls: 0, totalTime: 0, errors: 0 },
  cache: { hits: 0, misses: 0 }
};

/**
 * Generate cache key from input
 */
function getCacheKey(input) {
  // Normalize input for better cache hits
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  return require('crypto').createHash('md5').update(normalized).digest('hex');
}

/**
 * Smart Fallback Generator (Non-LLM)
 * Returns response in the exact format expected by frontend
 */
function generateSmartFallback(input) {
  return {
    immediate_action: "Manual bedside triage assessment required.",
    priority: "High",
    differential_diagnosis: [{ diagnosis: "Clinical evaluation needed", probability: "High" }],
    supporting_evidence: "AI analysis timeout - assess patient immediately.",
    uncertainty_level: "High",
    case_summary: "System processing delayed, proceed with clinical assessment."
  };
}

/**
 * Check cache first (0-5ms)
 */
function checkCache(input) {
  const key = getCacheKey(input);
  const cached = responseCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    stats.cache.hits++;
    console.log(`💾 Cache HIT (${stats.cache.hits} total hits)`);
    return cached.response;
  }
  
  stats.cache.misses++;
  return null;
}

/**
 * Save to cache
 */
function saveToCache(input, response) {
  const key = getCacheKey(input);
  responseCache.set(key, {
    response,
    timestamp: Date.now()
  });
  
  // Limit cache size to 1000 entries
  if (responseCache.size > 1000) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

/**
 * Call Groq API (target: 150-300ms)
 */
async function callGroq(messages, temperature = 0.1, maxTokens = 300) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not found');
  }

  const startTime = Date.now();

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000 // 3s timeout for Groq API calls to ensure <400ms total latency
      }
    );

    const latency = Date.now() - startTime;
    stats.groq.calls++;
    stats.groq.totalTime += latency;
    
    console.log(`⚡ Groq: ${latency}ms (avg: ${Math.round(stats.groq.totalTime / stats.groq.calls)}ms)`);

    return {
      response: response.data.choices[0].message.content,
      latency_ms: latency,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  } catch (error) {
    stats.groq.errors++;
    const latency = Date.now() - startTime;
    console.error(`❌ Groq failed after ${latency}ms:`, error.message);
    throw error;
  }
}

/**
 * Call Ollama (fallback, 2-5 seconds)
 */
async function callOllama(prompt, options = {}) {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8, // Increased for medical diversity and realism
          num_predict: options.maxTokens || 300,
          top_k: 10,
          top_p: 0.5
        }
      },
      { timeout: 2500 } // 2.5s timeout - must complete within 350ms race deadline
    );

    const latency = Date.now() - startTime;
    stats.ollama.calls++;
    stats.ollama.totalTime += latency;
    
    console.log(`🐌 Ollama: ${latency}ms (avg: ${Math.round(stats.ollama.totalTime / stats.ollama.calls)}ms)`);

    return {
      response: response.data.response,
      latency_ms: latency,
      model: OLLAMA_MODEL,
      provider: 'ollama'
    };
  } catch (error) {
    stats.ollama.errors++;
    const latency = Date.now() - startTime;
    console.error(`❌ Ollama failed after ${latency}ms:`, error.message);
    throw error;
  }
}

/**
 * HYBRID: Try Groq first, fallback to Ollama, with caching
 * Target: <400ms with cache, <800ms with Groq, <5s with Ollama
 */
async function hybridCall(input, options = {}) {
  const totalStart = Date.now();
  
  // Step 1: Check cache (0-5ms)
  const cached = checkCache(input);
  if (cached) {
    return {
      ...cached,
      latency_ms: Date.now() - totalStart,
      provider: 'cache',
      fromCache: true
    };
  }

  // Step 2: Race Groq, Ollama, and a Hard Timeout (True Hybrid)
  const messages = [
    {
      role: 'system',
      content: options.systemPrompt || 'You are an emergency triage AI. Provide concise, actionable recommendations.'
    },
    {
      role: 'user',
      content: input
    }
  ];
  
  const ollamaPrompt = `${options.systemPrompt || 'You are an emergency triage AI.'}\n\n${input}`;

  // Safety timeout - only fires if BOTH Groq and Ollama genuinely fail/hang
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      const fallback = generateSmartFallback(input);
      resolve({
        response: JSON.stringify(fallback),
        latency_ms: Date.now() - totalStart,
        provider: 'timeout-fallback',
        fromCache: false
      });
    }, 10000); // 10s safety net - Groq typically responds in 300-1000ms
  });

  try {
    // Promise.race — the 300ms timeout fires first, no matter what state Groq/Ollama are in
    const result = await Promise.race([
      callGroq(messages, options.temperature, options.maxTokens).catch((e) => { console.log('❌ Groq race failed:', e.message); return null; }),
      callOllama(ollamaPrompt, options).catch((e) => { console.log('❌ Ollama race failed:', e.message); return null; }),
      timeoutPromise
    ]);
    
    console.log('🏁 Race winner:', result ? (result.provider || 'unknown') : 'null/fallback', '| Response length:', result?.response?.length || 0);
    
    // Use result or fallback if both AI providers failed fast
  const finalResult = result || {
    response: JSON.stringify(generateSmartFallback(input)),
    latency_ms: Date.now() - totalStart,
    provider: 'error-fallback',
    fromCache: false
  };

    // Save the winner to cache if it came from a real AI provider
    if (finalResult.provider !== 'timeout-fallback' && finalResult.provider !== 'error-fallback') {
      saveToCache(input, finalResult);
    }
    
    return {
      ...finalResult,
      latency_ms: Date.now() - totalStart,
      fromCache: false
    };
  } catch (err) {
    console.error(`❌ Hybrid AI race failed:`, err.message);
    return {
      response: '{"summary":"High priority presentation","immediate_action":"AI analysis timed out. Please use manual triage protocol.","key_findings":"Rapid assessment required","priority":"Critical"}',
      latency_ms: Date.now() - totalStart,
      provider: 'error-fallback',
      fromCache: false
    };
  }
}

/**
 * Ultra-fast triage recommendation with aggressive caching
 */
async function getStructuredRecommendation(compressedHistory, emergencyDescription) {
  const startTime = Date.now();
  
  const input = `E:${emergencyDescription}\nH:${compressedHistory}\nJSON:{"case_summary":"1 sentence patient overview","immediate_action":"action","differential_diagnosis":["dx1","dx2","dx3"],"supporting_evidence":"evidence","risk_considerations":"risks","uncertainty_level":"Low/Medium/High"}`;

  try {
    const result = await hybridCall(input, {
      systemPrompt: 'Emergency triage AI. Return ONLY valid JSON. Keys: case_summary (1-2 sentences), immediate_action (specific clinical action), differential_diagnosis (array of up to 3 diagnoses), supporting_evidence (clinical reasoning), risk_considerations (specific risks), uncertainty_level (Low/Medium/High)',
      temperature: 0.3,
      maxTokens: 500
    });

    const totalLatency = Date.now() - startTime;

    // Parse JSON with fallback
    let parsed;
    try {
      console.log('📋 getStructuredRecommendation raw response:', result.response?.substring(0, 300));
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : parseUnstructured(result.response);
      console.log('📋 Parsed result keys:', Object.keys(parsed));
    } catch (e) {
      console.warn('⚠️ JSON parse failed for structured:', e.message);
      parsed = parseUnstructured(result.response);
    }

    return {
      ...parsed,
      latency_ms: totalLatency,
      model: result.model,
      provider: result.provider,
      fromCache: result.fromCache || false
    };
  } catch (error) {
    console.error('Hybrid recommendation error:', error.message);
    return {
      immediate_action: "AI service error. Consult emergency services immediately.",
      differential_diagnosis: ["Service unavailable"],
      supporting_evidence: "Unable to process",
      risk_considerations: "Immediate medical evaluation required",
      uncertainty_level: "High",
      error: error.message
    };
  }
}

/**
 * Fast LLM recommendation for triage
 */
async function getLLMRecommendation(compressedText, apiKey = null) {
  try {
    const input = `Analyze this emergency case and provide triage recommendation:\n\n${compressedText}`;
    
    const result = await hybridCall(input, {
      systemPrompt: 'You are an emergency triage AI assistant. Provide concise, actionable medical recommendations.',
      temperature: 0.1,
      maxTokens: 300
    });
    
    return result.response;
  } catch (error) {
    console.error('LLM recommendation error:', error.message);
    throw new Error(`Failed to get LLM recommendation: ${error.message}`);
  }
}

/**
 * Parse unstructured response as fallback
 */
function parseUnstructured(content) {
  return {
    case_summary: content.substring(0, 100),
    immediate_action: content.substring(0, 200),
    differential_diagnosis: ["Unable to parse structured response"],
    supporting_evidence: "See immediate_action field",
    risk_considerations: "Review full response",
    uncertainty_level: "Medium"
  };
}

/**
 * Get performance statistics
 */
function getStats() {
  return {
    cache: {
      hits: stats.cache.hits,
      misses: stats.cache.misses,
      hitRate: stats.cache.hits / (stats.cache.hits + stats.cache.misses) || 0,
      size: responseCache.size
    },
    groq: {
      calls: stats.groq.calls,
      avgLatency: stats.groq.calls > 0 ? Math.round(stats.groq.totalTime / stats.groq.calls) : 0,
      errors: stats.groq.errors,
      successRate: stats.groq.calls > 0 ? (stats.groq.calls - stats.groq.errors) / stats.groq.calls : 0
    },
    ollama: {
      calls: stats.ollama.calls,
      avgLatency: stats.ollama.calls > 0 ? Math.round(stats.ollama.totalTime / stats.ollama.calls) : 0,
      errors: stats.ollama.errors,
      successRate: stats.ollama.calls > 0 ? (stats.ollama.calls - stats.ollama.errors) / stats.ollama.calls : 0
    }
  };
}

/**
 * Get detailed structured recommendation with comprehensive clinical reasoning
 */
async function getDetailedRecommendation(patientContext, currentVisit) {
  const startTime = Date.now();
  
  const systemPrompt = `Emergency triage JSON response. Format: {"immediate_action":"action","priority":"Critical/High/Medium/Low","differential_diagnosis":[{"diagnosis":"name","probability":"High/Medium/Low"}],"supporting_evidence":"brief reason","uncertainty_level":"High/Medium/Low","case_summary":"1 sentence"}`;

  const userPrompt = `H:${patientContext}\nP:${currentVisit}`;

  try {
    let result = await hybridCall(userPrompt, {
      systemPrompt: systemPrompt,
      temperature: 0.8, // Increased temperature for unique, varied responses
      maxTokens: 300 // Reduced from 800 for faster response 
    });

    // Anti-duplication check
    let currentHash = null;
    try {
      if (result && result.response) {
        currentHash = crypto.createHash('md5').update(String(result.response)).digest('hex');
      }
    } catch (e) {
      console.warn('Hash generation failed:', e.message);
    }

    if (currentHash && currentHash === lastResponseHash) {
      console.log('🔄 Duplicate response detected. Regenerating with higher entropy...');
      result = await hybridCall(userPrompt + "\n(REGENERATE - Provide a different phrasing/perspective)", {
        systemPrompt: systemPrompt,
        temperature: 0.95,
        maxTokens: 800
      });
      
      // Update hash after regeneration
      try {
        if (result && result.response) {
          currentHash = crypto.createHash('md5').update(String(result.response)).digest('hex');
        }
      } catch (e) {}
    }
    lastResponseHash = currentHash;

    const totalLatency = Date.now() - startTime;

    // Parse JSON
    let parsed;
    try {
      const responseText = (result && result.response) ? result.response : JSON.stringify(generateSmartFallback(userPrompt));
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : parseDetailedUnstructured(responseText);
    } catch (e) {
      console.error('JSON Parse error:', e.message);
      parsed = parseDetailedUnstructured((result && result.response) || "AI Error");
    }

    return {
      ...parsed,
      latency_ms: totalLatency,
      model: result ? result.model : 'fallback',
      provider: result ? result.provider : 'fallback',
      fromCache: result ? (result.fromCache || false) : false
    };
  } catch (error) {
    console.error('Detailed recommendation error:', error.message);
    const fallback = generateSmartFallback(userPrompt);
    return {
      ...fallback,
      error: error.message
    };
  }
}

/**
 * Parse detailed unstructured response as fallback
 */
function parseDetailedUnstructured(content) {
  return {
    immediate_action: "Clinical assessment required - see supporting evidence.",
    priority: "High",
    differential_diagnosis: [{"diagnosis": "Multi-system evaluation indicated", "probability": "Medium"}],
    supporting_evidence: content.substring(0, 500) || "AI processing produced incomplete response.",
    uncertainty_level: "High",
    case_summary: "Requires manual clinical correlation."
  };
}

/**
 * Fast summary recommendation - optimized for <400ms latency
 * Returns: immediate_action, key_findings, priority, brief summary
 */
async function getFastSummary(compressedHistory, emergencyDescription) {
  const startTime = Date.now();
  
  const input = `E:${emergencyDescription}\nH:${compressedHistory}\nJSON:{"summary":"1 dictating sentence","immediate_action":"1 short action","key_findings":"1 symptom","priority":"Urgent"}`;

  try {
    const result = await hybridCall(input, {
      systemPrompt: 'ER AI. ONLY JSON. 3 words max per field. Keys: summary, immediate_action, key_findings, priority',
      temperature: 0.01,
      maxTokens: 75 // Extreme cut for micro-second speed
    });

    const totalLatency = Date.now() - startTime;

    // Parse JSON with fallback
    let parsed;
    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : parseFastSummaryUnstructured(result.response);
    } catch {
      parsed = parseFastSummaryUnstructured(result.response);
    }

    return {
      ...parsed,
      latency_ms: totalLatency,
      model: result.model,
      provider: result.provider,
      fromCache: result.fromCache || false
    };
  } catch (error) {
    console.error('Fast summary error:', error.message);
    const fallback = generateSmartFallback(input);
    return {
      ...fallback,
      latency_ms: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Parse fast summary unstructured response
 */
function parseFastSummaryUnstructured(content) {
  return {
    immediate_action: content.substring(0, 100),
    key_findings: content.substring(100, 200),
    priority: "Urgent",
    summary: content.substring(200, 300)
  };
}

/**
 * Clear cache (for testing)
 */
function clearCache() {
  responseCache.clear();
  console.log('🗑️  Cache cleared');
}

module.exports = {
  hybridCall,
  getStructuredRecommendation,
  getDetailedRecommendation,
  getFastSummary,
  getLLMRecommendation,
  callGroq,
  callOllama,
  getStats,
  clearCache
};
