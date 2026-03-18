const axios = require('axios');

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
        timeout: 5000 // 5 second timeout
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
          temperature: options.temperature || 0.1,
          num_predict: options.maxTokens || 300,
          top_k: 10,
          top_p: 0.5
        }
      },
      { timeout: 10000 }
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

  // Step 2: Try Groq first (150-300ms)
  try {
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
    
    const result = await callGroq(messages, options.temperature, options.maxTokens);
    
    // Save to cache for next time
    saveToCache(input, result);
    
    return {
      ...result,
      latency_ms: Date.now() - totalStart,
      fromCache: false
    };
  } catch (groqError) {
    console.warn('⚠️  Groq failed, falling back to Ollama...');
    
    // Step 3: Fallback to Ollama (2-5 seconds)
    try {
      const prompt = `${options.systemPrompt || 'You are an emergency triage AI.'}\n\n${input}`;
      const result = await callOllama(prompt, options);
      
      // Save to cache
      saveToCache(input, result);
      
      return {
        ...result,
        latency_ms: Date.now() - totalStart,
        fromCache: false,
        fallback: true
      };
    } catch (ollamaError) {
      throw new Error(`Both Groq and Ollama failed: ${groqError.message} | ${ollamaError.message}`);
    }
  }
}

/**
 * Ultra-fast triage recommendation with aggressive caching
 */
async function getStructuredRecommendation(compressedHistory, emergencyDescription) {
  const startTime = Date.now();
  
  const input = `Emergency: ${emergencyDescription}\n\nMedical History:\n${compressedHistory}\n\nRespond with JSON:\n{\n  "immediate_action": "action",\n  "differential_diagnosis": ["dx1", "dx2", "dx3"],\n  "supporting_evidence": "evidence",\n  "risk_considerations": "risks",\n  "uncertainty_level": "Low/Medium/High"\n}`;

  try {
    const result = await hybridCall(input, {
      systemPrompt: 'You are an emergency triage AI. Respond ONLY with valid JSON. No markdown, no explanations.',
      temperature: 0.1,
      maxTokens: 400
    });

    const totalLatency = Date.now() - startTime;

    // Parse JSON with fallback
    let parsed;
    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : parseUnstructured(result.response);
    } catch {
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
 * Clear cache (for testing)
 */
function clearCache() {
  responseCache.clear();
  console.log('🗑️  Cache cleared');
}

module.exports = {
  hybridCall,
  getStructuredRecommendation,
  getLLMRecommendation,
  callGroq,
  callOllama,
  getStats,
  clearCache
};
