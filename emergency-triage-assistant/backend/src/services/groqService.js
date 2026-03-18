const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

async function callGroq(messages, temperature = 0.1, maxTokens = 500) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not found in environment');
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
        timeout: 10000
      }
    );

    const latency = Date.now() - startTime;
    console.log(`⚡ Groq API call completed in ${latency}ms`);

    return {
      response: response.data.choices[0].message.content,
      latency_ms: latency,
      model: GROQ_MODEL,
      usage: response.data.usage
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Groq API error after ${latency}ms:`, error.response?.data || error.message);
    throw new Error(`Groq API failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function getStructuredRecommendation(compressedHistory, emergencyDescription) {
  const startTime = Date.now();
  
  const messages = [
    {
      role: 'system',
      content: 'You are an emergency triage AI. Respond ONLY with valid JSON. No markdown, no explanations.'
    },
    {
      role: 'user',
      content: `Emergency: ${emergencyDescription}\n\nMedical History:\n${compressedHistory}\n\nRespond with JSON:\n{\n  "immediate_action": "action",\n  "differential_diagnosis": ["dx1", "dx2", "dx3"],\n  "supporting_evidence": "evidence",\n  "risk_considerations": "risks",\n  "uncertainty_level": "Low/Medium/High"\n}`
    }
  ];

  try {
    const result = await callGroq(messages, 0.1, 400);
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
      model: GROQ_MODEL
    };
  } catch (error) {
    console.error('Structured recommendation error:', error.message);
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
  callGroq,
  getStructuredRecommendation
};
