const { ragQuery } = require('../../ollamaService');

async function queryOllamaLLM(context, query, mode = 'emergency') {
  try {
    const result = await ragQuery(context, query, mode);
    
    return {
      answer: result.response,
      model: result.model,
      latency_ms: result.total_latency_ms,
      tokens_used: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    throw new Error(`Ollama RAG query error: ${error.message}`);
  }
}

// Keep the old function name for backward compatibility
const queryGroqLLM = queryOllamaLLM;

module.exports = { queryOllamaLLM, queryGroqLLM };
