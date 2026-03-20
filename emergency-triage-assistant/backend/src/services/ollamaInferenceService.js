const axios = require('axios');

// Load from environment variables with fallbacks
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`;
const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;

// Standard inference parameters for all requests
const INFERENCE_PARAMS = {
  temperature: 0.1,
  num_predict: 150,
  top_k: 10,
  top_p: 0.5
};

/**
 * Build phi3:mini native chat template prompt
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User query
 * @returns {string} Formatted prompt with phi3 tags
 */
const buildPhi3Prompt = (systemPrompt, userPrompt) => {
  return `<|system|>
${systemPrompt}
<|end|>

<|user|>
${userPrompt}
<|end|>

<|assistant|>`;
};

/**
 * Health check: Verify Ollama is reachable and phi3:mini model is loaded
 * @returns {Promise<{healthy: boolean, message: string, model: string}>}
 */
const healthCheck = async () => {
  try {
    // Check if Ollama server is reachable
    const response = await axios.get(OLLAMA_TAGS_URL, { timeout: 5000 });
    
    if (!response.data || !response.data.models) {
      return {
        healthy: false,
        message: 'Ollama server responded but no models found',
        model: OLLAMA_MODEL
      };
    }

    // Check if phi3:mini is available
    const modelExists = response.data.models.some(m => m.name.includes(OLLAMA_MODEL));
    
    if (!modelExists) {
      return {
        healthy: false,
        message: `Model ${OLLAMA_MODEL} not found. Available models: ${response.data.models.map(m => m.name).join(', ')}`,
        model: OLLAMA_MODEL
      };
    }

    return {
      healthy: true,
      message: `Ollama is ready with ${OLLAMA_MODEL}`,
      model: OLLAMA_MODEL
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Ollama unreachable at ${OLLAMA_BASE_URL}: ${error.message}`,
      model: OLLAMA_MODEL
    };
  }
};

/**
 * Emergency triage query: Analyze patient complaint and return structured severity assessment
 * @param {string} complaint - Patient chief complaint
 * @param {Object} vitals - Optional vitals object {bp, pulse, temp, spo2}
 * @returns {Promise<{severity: string, reason: string, actions: string[], responseTime: number}>}
 */
const emergencyTriageQuery = async (complaint, vitals = null) => {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are an Emergency Medicine AI Assistant.
Analyze the patient complaint and vitals to determine triage severity.
Respond in EXACTLY this format:

SEVERITY: [CRITICAL/HIGH/MEDIUM/LOW]
REASON: [One sentence why]
ACTIONS: [Action 1] | [Action 2] | [Action 3]

Be concise. No extra text.`;

    let userPrompt = `Patient Complaint: ${complaint}`;
    
    if (vitals) {
      userPrompt += `\n\nVitals:`;
      if (vitals.bp) userPrompt += `\n- BP: ${vitals.bp}`;
      if (vitals.pulse) userPrompt += `\n- Pulse: ${vitals.pulse} bpm`;
      if (vitals.temp) userPrompt += `\n- Temperature: ${vitals.temp}°F`;
      if (vitals.spo2) userPrompt += `\n- SpO2: ${vitals.spo2}%`;
    }

    userPrompt += `\n\nProvide triage assessment.`;

    const prompt = buildPhi3Prompt(systemPrompt, userPrompt);

    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: INFERENCE_PARAMS
    }, {
      timeout: 10000
    });

    const responseTime = Date.now() - startTime;

    if (!response.data || !response.data.response) {
      throw new Error('Ollama returned malformed response');
    }

    const text = response.data.response.trim();

    // Parse structured response
    const severityMatch = text.match(/SEVERITY:\s*(\w+)/i);
    const reasonMatch = text.match(/REASON:\s*(.+?)(?=\n|ACTIONS:|$)/is);
    const actionsMatch = text.match(/ACTIONS:\s*(.+?)$/is);

    const severity = severityMatch ? severityMatch[1].toUpperCase() : 'MEDIUM';
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Unable to determine';
    const actions = actionsMatch 
      ? actionsMatch[1].split('|').map(a => a.trim()).filter(a => a.length > 0)
      : ['Assess patient', 'Monitor vitals', 'Consult physician'];

    return {
      severity,
      reason,
      actions,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('unreachable')) {
      return {
        severity: 'UNKNOWN',
        reason: 'Ollama service is currently unavailable. Please ensure Ollama is running.',
        actions: ['Manual triage required', 'Check Ollama service status'],
        responseTime,
        error: 'OLLAMA_UNREACHABLE'
      };
    }

    return {
      severity: 'UNKNOWN',
      reason: `AI analysis failed: ${error.message}`,
      actions: ['Manual triage required', 'Review patient complaint directly'],
      responseTime,
      error: 'INFERENCE_FAILED'
    };
  }
};

/**
 * Multi-turn conversation for patient chatbot interface
 * @param {Array<{role: string, content: string}>} conversationHistory - Array of messages
 * @param {string} newMessage - New user message
 * @returns {Promise<{response: string, responseTime: number}>}
 */
const chatbotConversation = async (conversationHistory, newMessage) => {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are a helpful medical assistant chatbot for patients.
Provide clear, empathetic, and accurate information.
If asked about symptoms, suggest when to seek emergency care.
Never diagnose - always recommend consulting a healthcare provider for medical advice.
Keep responses under 100 words.`;

    // Build conversation context
    let contextStr = '';
    if (conversationHistory && conversationHistory.length > 0) {
      contextStr = 'Previous conversation:\n';
      conversationHistory.slice(-4).forEach(msg => {
        contextStr += `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}\n`;
      });
      contextStr += '\n';
    }

    const userPrompt = `${contextStr}Patient: ${newMessage}\n\nRespond helpfully and concisely.`;

    const prompt = buildPhi3Prompt(systemPrompt, userPrompt);

    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: INFERENCE_PARAMS
    }, {
      timeout: 10000
    });

    const responseTime = Date.now() - startTime;

    if (!response.data || !response.data.response) {
      throw new Error('Ollama returned malformed response');
    }

    return {
      response: response.data.response.trim(),
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('unreachable')) {
      return {
        response: 'I apologize, but I am currently unable to respond. The AI service is temporarily unavailable. Please try again in a moment or contact staff for assistance.',
        responseTime,
        error: 'OLLAMA_UNREACHABLE'
      };
    }

    return {
      response: 'I apologize, but I encountered an error processing your message. Please try rephrasing your question or contact staff for assistance.',
      responseTime,
      error: 'INFERENCE_FAILED'
    };
  }
};

module.exports = {
  healthCheck,
  emergencyTriageQuery,
  chatbotConversation,
  buildPhi3Prompt,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL
};
