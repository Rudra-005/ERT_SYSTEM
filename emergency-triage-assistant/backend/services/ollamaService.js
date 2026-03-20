/**
 * Ollama Service with 350ms timeout and fallback
 * Enforces phi3:mini native prompt format and strict parameters
 */

const axios = require('axios');

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_TIMEOUT = 350; // 350ms hard timeout

// Fallback responses
const FALLBACK_TRIAGE = 'Unable to complete AI analysis within the required time. Please assess the patient manually using the displayed vital thresholds.';
const FALLBACK_RAG = 'Unable to retrieve information within the required time. Please consult medical records manually.';

class OllamaService {
  constructor() {
    this.model = 'phi3:mini';
  }

  async generate(systemPrompt, userPrompt, fallbackType = 'triage') {
    const startTime = performance.now();

    // Build phi3:mini native format prompt
    const formattedPrompt = 
      `<|system|>\n${systemPrompt}<|end|>\n` +
      `<|user|>\n${userPrompt}<|end|>\n` +
      `<|assistant|>`;

    const payload = {
      model: this.model,
      prompt: formattedPrompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 120,
        top_k: 10,
        top_p: 0.5,
        repeat_penalty: 1.1
      }
    };

    try {
      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        payload,
        { timeout: OLLAMA_TIMEOUT }
      );

      const elapsedMs = performance.now() - startTime;

      if (response.status === 200 && response.data) {
        return {
          response: (response.data.response || '').trim(),
          latency_ms: elapsedMs,
          fallback_used: false
        };
      } else {
        console.error(`Ollama returned status ${response.status}`);
        return this._getFallback(fallbackType, elapsedMs);
      }
    } catch (error) {
      const elapsedMs = performance.now() - startTime;

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn(`Ollama timeout after ${elapsedMs.toFixed(2)}ms`);
      } else {
        console.error(`Ollama error: ${error.message}`);
      }

      return this._getFallback(fallbackType, elapsedMs);
    }
  }

  _getFallback(fallbackType, elapsedMs) {
    const fallbackText = fallbackType === 'triage' ? FALLBACK_TRIAGE : FALLBACK_RAG;
    return {
      response: fallbackText,
      latency_ms: elapsedMs,
      fallback_used: true
    };
  }

  async warmup() {
    console.log('Running Ollama warmup...');
    const startTime = performance.now();

    try {
      const result = await this.generate(
        'You are a test assistant.',
        'Respond with OK.',
        'triage'
      );

      const warmupTime = result.latency_ms;

      if (warmupTime > 350) {
        console.warn(
          '\n' + '='.repeat(60) + '\n' +
          '⚠️  WARNING: Ollama warmup took ' + warmupTime.toFixed(2) + 'ms (>350ms)\n' +
          'System may not meet 400ms latency requirement.\n' +
          'Recommendation: Run \'ollama run phi3:mini\' manually to load model into memory.\n' +
          '='.repeat(60) + '\n'
        );
      } else {
        console.log(`✓ Ollama warmup completed in ${warmupTime.toFixed(2)}ms`);
      }

      return warmupTime;
    } catch (error) {
      console.error(`Warmup failed: ${error.message}`);
      return 999.0;
    }
  }
}

// Singleton instance
const ollamaService = new OllamaService();

module.exports = { ollamaService };
