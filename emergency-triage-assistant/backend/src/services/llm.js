const { getLLMRecommendation } = require('./hybridLLM');

async function getLLMRecommendationWrapper(compressedText, apiKey = null) {
  return await getLLMRecommendation(compressedText, apiKey);
}

module.exports = { getLLMRecommendation: getLLMRecommendationWrapper };
