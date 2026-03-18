const { getStructuredRecommendation } = require('../services/hybridLLM');
const { verifyRecommendation } = require('../services/structuredVerification');
const { calculateStructuredConfidence } = require('../services/structuredConfidence');
const { compressText } = require('../services/compression');
const { countTokens } = require('../utils/tokenCounter');
const logger = require('../utils/logger');

async function compareApproaches(req, res) {
  const startTime = Date.now();

  try {
    const { patientHistory, emergencyDescription } = req.body;

    if (!patientHistory || !emergencyDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing patientHistory or emergencyDescription'
      });
    }

    // Run naive and optimized in parallel using hybrid Groq+Ollama
    const [naive, optimized] = await Promise.all([
      processNaive(patientHistory, emergencyDescription),
      processOptimized(patientHistory, emergencyDescription)
    ]);

    logger.info(`A/B comparison completed in ${Date.now() - startTime}ms`);

    res.json({
      success: true,
      data: { naive, optimized }
    });
  } catch (error) {
    logger.error(`Comparison error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      message: error.message
    });
  }
}

async function processNaive(patientHistory, emergencyDescription) {
  const start = Date.now();
  const fullText = `${emergencyDescription}\n${patientHistory}`;
  const tokens = countTokens(fullText);

  const recommendation = await getStructuredRecommendation(patientHistory, emergencyDescription);
  const verification = verifyRecommendation(patientHistory, emergencyDescription, recommendation);
  const confidence = calculateStructuredConfidence(verification, recommendation, 0);

  return {
    tokens,
    recommendation,
    verification,
    confidence,
    latency_ms: Date.now() - start,
    estimated_cost: (tokens / 1000 * 0.0015).toFixed(4)
  };
}

async function processOptimized(patientHistory, emergencyDescription) {
  const start = Date.now();

  // Compress using local rule-based compression
  const fullText = `${patientHistory}\n\nEmergency: ${emergencyDescription}`;
  const compressed = compressText(fullText);
  const originalTokens = countTokens(fullText);
  const compressedTokens = countTokens(compressed);
  const reductionPercent = ((originalTokens - compressedTokens) / originalTokens * 100).toFixed(2);

  const recommendation = await getStructuredRecommendation(compressed, emergencyDescription);
  const verification = verifyRecommendation(compressed, emergencyDescription, recommendation);
  const confidence = calculateStructuredConfidence(verification, recommendation, parseFloat(reductionPercent));

  return {
    tokens: compressedTokens,
    original_tokens: originalTokens,
    reduction_percent: parseFloat(reductionPercent),
    recommendation,
    verification,
    confidence,
    latency_ms: Date.now() - start,
    estimated_cost: (compressedTokens / 1000 * 0.0015).toFixed(4)
  };
}

module.exports = { compareApproaches };
