const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';

const DEFAULT_OPTIONS = {
  temperature: 0.1,
  num_predict: 80,
  top_k: 10,
  top_p: 0.5
};

/**
 * Core Ollama API call with latency logging
 */
async function callOllama(prompt, options = {}) {
  const startTime = Date.now();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: mergedOptions
      },
      { timeout: 30000 }
    );

    const latency = Date.now() - startTime;
    console.log(`🔥 Ollama API call completed in ${latency}ms`);

    return {
      response: response.data.response,
      latency_ms: latency,
      model: OLLAMA_MODEL
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Ollama API error after ${latency}ms:`, error.message);
    throw new Error(`Ollama service unavailable: ${error.message}`);
  }
}

/**
 * Emergency triage query function
 */
async function triageQuery(input) {
  const startTime = Date.now();
  
  try {
    const { TRIAGE_PROMPT } = require('./prompts');
    const prompt = TRIAGE_PROMPT.replace('{input}', input);
    
    const result = await callOllama(prompt, {
      temperature: 0.1,
      num_predict: 200,
      top_k: 10,
      top_p: 0.5
    });

    const totalLatency = Date.now() - startTime;
    console.log(`🚨 Triage query completed in ${totalLatency}ms`);

    return {
      ...result,
      total_latency_ms: totalLatency,
      query_type: 'triage'
    };
  } catch (error) {
    console.error('Triage query error:', error.message);
    throw error;
  }
}

/**
 * Multi-turn chat query function
 */
async function chatQuery(messages) {
  const startTime = Date.now();
  
  try {
    const { CHAT_PROMPT } = require('./prompts');
    
    // Format messages for phi3:mini
    const conversationHistory = messages.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const prompt = CHAT_PROMPT.replace('{conversation}', conversationHistory);
    
    const result = await callOllama(prompt, {
      temperature: 0.3,
      num_predict: 300,
      top_k: 15,
      top_p: 0.7
    });

    const totalLatency = Date.now() - startTime;
    console.log(`💬 Chat query completed in ${totalLatency}ms`);

    return {
      ...result,
      total_latency_ms: totalLatency,
      query_type: 'chat'
    };
  } catch (error) {
    console.error('Chat query error:', error.message);
    throw error;
  }
}

/**
 * RAG query function for document-based queries
 */
async function ragQuery(context, query, mode = 'emergency') {
  const startTime = Date.now();
  
  try {
    const { RAG_PROMPT } = require('./prompts');
    const prompt = RAG_PROMPT
      .replace('{mode}', mode)
      .replace('{context}', context)
      .replace('{query}', query);
    
    const options = mode === 'emergency' ? {
      temperature: 0.1,
      num_predict: 400,
      top_k: 10,
      top_p: 0.5
    } : {
      temperature: 0.3,
      num_predict: 800,
      top_k: 15,
      top_p: 0.7
    };
    
    const result = await callOllama(prompt, options);

    const totalLatency = Date.now() - startTime;
    console.log(`📚 RAG query (${mode}) completed in ${totalLatency}ms`);

    return {
      ...result,
      total_latency_ms: totalLatency,
      query_type: 'rag',
      mode
    };
  } catch (error) {
    console.error('RAG query error:', error.message);
    throw error;
  }
}

/**
 * Health check function to verify Ollama is running
 */
async function healthCheck() {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    
    const latency = Date.now() - startTime;
    console.log(`✅ Ollama health check passed in ${latency}ms`);
    
    const models = response.data.models || [];
    const hasModel = models.some(model => model.name.includes(OLLAMA_MODEL.split(':')[0]));
    
    return {
      status: 'healthy',
      latency_ms: latency,
      base_url: OLLAMA_BASE_URL,
      model: OLLAMA_MODEL,
      model_available: hasModel,
      available_models: models.map(m => m.name)
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Ollama health check failed after ${latency}ms:`, error.message);
    
    return {
      status: 'unhealthy',
      latency_ms: latency,
      base_url: OLLAMA_BASE_URL,
      model: OLLAMA_MODEL,
      error: error.message,
      model_available: false
    };
  }
}

/**
 * Structured recommendation function for complex triage
 */
async function getStructuredRecommendation(compressedHistory, emergencyDescription) {
  const startTime = Date.now();
  
  try {
    const systemMessage = 'You are an emergency triage AI assistant. Provide structured medical recommendations in JSON format.';
    
    const userMessage = `Analyze this case and provide a structured response.

Emergency: ${emergencyDescription}

Relevant Medical History:
${compressedHistory}

Provide your response in this exact JSON format:
{
  "immediate_action": "What to do right now",
  "differential_diagnosis": ["Diagnosis 1", "Diagnosis 2", "Diagnosis 3"],
  "supporting_evidence": "Evidence from the case that supports your assessment",
  "risk_considerations": "Key risks and red flags",
  "uncertainty_level": "Low/Medium/High"
}`;

    const prompt = formatPhi3Prompt(systemMessage, userMessage);
    
    const result = await callOllama(prompt, { 
      num_predict: 400,
      temperature: 0.1 
    });

    const totalLatency = Date.now() - startTime;
    console.log(`🏥 Structured recommendation completed in ${totalLatency}ms`);
    
    // Try to parse JSON response
    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      const parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : parseUnstructured(result.response);
      
      return {
        ...parsedResponse,
        latency_ms: totalLatency,
        model: OLLAMA_MODEL
      };
    } catch (parseError) {
      return parseUnstructured(result.response);
    }
  } catch (error) {
    console.error('Structured recommendation error:', error.message);
    return {
      immediate_action: "AI service temporarily unavailable. Please consult emergency medical services immediately for this case.",
      differential_diagnosis: ["Service unavailable - manual assessment required"],
      supporting_evidence: "Unable to process due to service interruption",
      risk_considerations: "Immediate medical evaluation recommended",
      uncertainty_level: "High",
      error: error.message
    };
  }
}

/**
 * Format prompt for phi3:mini model
 */
function formatPhi3Prompt(systemMessage, userMessage) {
  return `<|system|>\n${systemMessage}<|end|>\n<|user|>\n${userMessage}<|end|>\n<|assistant|>\n`;
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

module.exports = {
  triageQuery,
  chatQuery,
  ragQuery,
  healthCheck,
  getStructuredRecommendation,
  callOllama,
  formatPhi3Prompt
};