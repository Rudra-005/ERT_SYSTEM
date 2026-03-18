const keyStore = require('../utils/keyStore');

function validateApiKey(key) {
  // Ollama doesn't require API keys, always return true
  return true;
}

function apiKeyMiddleware(req, res, next) {
  // Since Ollama runs locally without API keys, we just pass through
  // Keep the structure for backward compatibility
  req.apiKeys = { scaleDown: 'local', llm: 'local' };
  return next();
}

module.exports = { apiKeyMiddleware, validateApiKey };
