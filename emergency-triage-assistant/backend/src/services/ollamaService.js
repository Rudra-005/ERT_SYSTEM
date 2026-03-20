const axios = require('axios');
const cache = require('./cache');

// Hardcoded unchangeable constants requested by Senior AI/Infra Engineer
const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'phi3:mini';

const STRICT_OLLAMA_PARAMS = Object.freeze({
  num_predict: 80,
  temperature: 0.1,
  top_k: 10,
  top_p: 0.5,
  repeat_penalty: 1.1,
  stream: false
});

/**
 * Ensures prompt does not exceed 300 token physical limit.
 * Rough estimate: 4 chars per token. 300 tokens = 1200 chars.
 * If too long, truncates context but preserves system and question.
 */
function enforcePromptLimit(prompt) {
  const MAX_CHARS = 1200; // 300 tokens * 4
  if (prompt.length <= MAX_CHARS) return prompt;
  
  // Basic truncation: take first MAX_CHARS.
  // In a real prompt template you'd surgically slice the context. 
  // We'll just slice the middle out to keep the start (system) and end (question)
  const half = Math.floor(MAX_CHARS / 2) - 20;
  return prompt.substring(0, half) + "\n...[TRUNCATED_FOR_SPEED]...\n" + prompt.substring(prompt.length - half);
}

/**
 * Wakes up Ollama on startup. Must block queue until successful.
 */
async function warmUpOllama() {
  console.log('Initiating strict Ollama model warm-up sequence...');
  try {
    await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: "ready",
      stream: false,
      options: { num_predict: 1 }
    }, { timeout: 60000 }); // Can take a while on raw startup (increased to 60s)
    
    console.log('\x1b[32mOllama model warm and ready\x1b[0m');
    return true;
  } catch (error) {
    console.error('Failed to warm up Ollama. The model might not be running.', error.message);
    throw error; // Prevents server from starting effectively if not caught
  }
}

/**
 * Keep-alive ping executed every 4 minutes.
 */
function startKeepAlivePing() {
  setInterval(async () => {
    try {
      await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: "ping",
        stream: false,
        options: { num_predict: 1 }
      }, { timeout: 5000 });
      // Silent success
    } catch (e) {
      console.error('Ollama keep-alive ping failed', e.message);
    }
  }, 240000); // 4 minutes
}

/**
 * Core generation function with hard 300ms SLA and strict caching.
 */
async function generateResponse(prompt, patientId = 'unknown') {
  const startTime = Date.now();
  
  // 1. Strict input limiting
  const strictlyLimitedPrompt = enforcePromptLimit(prompt);
  
  // 2. Cache Check (LRU)
  const cacheKey = strictlyLimitedPrompt.toLowerCase().trim() + '_' + patientId;
  const cachedHit = cache.get(cacheKey);
  
  if (cachedHit) {
    return {
      response: cachedHit,
      latency: Date.now() - startTime,
      source: 'cache'
    };
  }

  // 3. Strict 300ms Race with hard aborts
  const ollamaPromise = axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt: strictlyLimitedPrompt,
    stream: STRICT_OLLAMA_PARAMS.stream,
    options: {
      num_predict: STRICT_OLLAMA_PARAMS.num_predict,
      temperature: STRICT_OLLAMA_PARAMS.temperature,
      top_k: STRICT_OLLAMA_PARAMS.top_k,
      top_p: STRICT_OLLAMA_PARAMS.top_p,
      repeat_penalty: STRICT_OLLAMA_PARAMS.repeat_penalty
    } // Ignoring ANY user passed options
  }, { 
    timeout: 300 // HARD HTTTP TIMEOUT - kills connection to save resources
  }).then(res => res.data.response);

  const fallbackPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve("AI analysis timed out. Please use manual triage protocol.");
    }, 300); // 300ms hard race
  });

  try {
    const finalResponse = await Promise.race([ollamaPromise, fallbackPromise]);
    
    // 4. Update Cache (only if it wasn't the fallback timeout string)
    if (finalResponse !== "AI analysis timed out. Please use manual triage protocol.") {
      cache.set(cacheKey, finalResponse);
    }

    return {
      response: finalResponse,
      latency: Date.now() - startTime,
      source: finalResponse.includes("timed out") ? 'timeout_fallback' : 'ollama'
    };
  } catch (err) {
    // If the Axios 300ms timeout throws before the timeoutPromise resolves
    return {
      response: "AI analysis timed out. Please use manual triage protocol.",
      latency: Date.now() - startTime,
      source: 'error_fallback'
    };
  }
}

module.exports = {
  STRICT_OLLAMA_PARAMS,
  enforcePromptLimit,
  warmUpOllama,
  startKeepAlivePing,
  generateResponse
};
