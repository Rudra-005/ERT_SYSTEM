/**
 * Fast Triage Route - Hybrid Groq+Ollama Pipeline
 * Target: <400ms with Groq, <50ms with cache
 */

const express = require('express');
const router = express.Router();
const { hybridCall, getStructuredRecommendation } = require('../services/hybridLLM');
const { compressText } = require('../services/compression');
const { verifyHallucination } = require('../services/verification');
const { calculateConfidence } = require('../services/confidence');
const { countTokens, calculateTokenReduction } = require('../utils/tokenCounter');

/**
 * POST /api/triage
 * Accepts { patientHistory, emergencyDescription } from frontend
 * Uses hybrid Groq (fast) + Ollama (fallback) + Cache (instant)
 */
router.post('/', async (req, res) => {
  const requestStart = Date.now();

  try {
    const { patientHistory, emergencyDescription, caseDescription } = req.body;

    // Support both old format (caseDescription) and new format (patientHistory + emergencyDescription)
    const history = patientHistory || '';
    const emergency = emergencyDescription || caseDescription || '';

    if (!history && !emergency) {
      return res.status(400).json({
        success: false,
        error: 'Please provide patientHistory and emergencyDescription',
      });
    }

    const performance = {};

    // ===== STAGE 1: COMPRESSION (1-5ms) =====
    const t1 = Date.now();
    const fullText = `${history}\n\nEmergency: ${emergency}`;
    const compressed = compressText(fullText);
    performance.compression_ms = Date.now() - t1;

    const tokenStats = calculateTokenReduction(fullText, compressed);

    // ===== STAGE 2: HYBRID LLM RECOMMENDATION (0-400ms) =====
    const t2 = Date.now();
    const recommendation = await getStructuredRecommendation(
      history || compressed,
      emergency
    );
    performance.recommendation_ms = Date.now() - t2;
    performance.provider = recommendation.provider || 'groq';
    performance.fromCache = recommendation.fromCache || false;

    // ===== STAGE 3: VERIFICATION (5-15ms) =====
    const t3 = Date.now();
    const verification = verifyHallucination(fullText, JSON.stringify(recommendation));
    performance.verification_ms = Date.now() - t3;

    // ===== STAGE 4: CONFIDENCE (1-3ms) =====
    const t4 = Date.now();
    const confidence = calculateConfidence(verification.score, tokenStats.reduction);
    performance.confidence_ms = Date.now() - t4;

    performance.total_ms = Date.now() - requestStart;
    performance.grade = performance.total_ms <= 400 ? 'EXCELLENT' :
                        performance.total_ms <= 1000 ? 'GOOD' : 'NEEDS_OPTIMIZATION';

    // Build response matching frontend expectations
    res.json({
      success: true,
      mode: 'hybrid-groq-ollama',
      data: {
        original: fullText,
        compressed_history: compressed,
        recommendation: {
          immediate_action: recommendation.immediate_action || 'Immediate medical evaluation required',
          differential_diagnosis: recommendation.differential_diagnosis || ['Assessment pending'],
          supporting_evidence: recommendation.supporting_evidence || 'Based on provided patient data',
          risk_considerations: recommendation.risk_considerations || 'Further evaluation recommended',
          uncertainty_level: recommendation.uncertainty_level || 'Medium'
        },
        tokenStats,
        verification: {
          status: verification.verified ? 'Verified' :
                  verification.score > 50 ? 'Mostly Verified' : 'Needs Review',
          score: verification.score,
          verified: verification.verified
        },
        confidence: {
          score: confidence.score || confidence,
          reasoning: confidence.reasoning || `Confidence based on verification and compression analysis`,
          level: confidence.level || (parseFloat(confidence.score || confidence) >= 70 ? 'High' : 'Medium')
        },
        performance
      }
    });

    console.log(`✅ Hybrid triage: ${performance.total_ms}ms (${performance.provider}${performance.fromCache ? ' cached' : ''})`);

  } catch (error) {
    console.error('❌ Triage error:', error.message);
    const totalLatency = Date.now() - requestStart;

    res.status(500).json({
      success: false,
      error: 'Triage processing failed',
      message: error.message,
      latency_ms: totalLatency,
    });
  }
});

/**
 * POST /api/triage/optimized
 * Legacy endpoint - redirects to the same hybrid pipeline
 */
router.post('/optimized', async (req, res) => {
  // Reuse the main handler by forwarding
  req.url = '/';
  router.handle(req, res);
});

/**
 * POST /api/triage/naive
 * Comparison endpoint - runs without compression
 */
router.post('/naive', async (req, res) => {
  const requestStart = Date.now();

  try {
    const { patientHistory, emergencyDescription, caseDescription } = req.body;
    const history = patientHistory || '';
    const emergency = emergencyDescription || caseDescription || '';

    if (!history && !emergency) {
      return res.status(400).json({ success: false, error: 'Missing input' });
    }

    const fullText = `${history}\n\nEmergency: ${emergency}`;

    const t1 = Date.now();
    const recommendation = await getStructuredRecommendation(fullText, emergency);
    const llmMs = Date.now() - t1;

    const tokenStats = {
      originalTokens: countTokens(fullText),
      compressedTokens: countTokens(fullText),
      reduction: '0.00'
    };

    res.json({
      success: true,
      mode: 'naive',
      data: {
        original: fullText,
        recommendation: {
          immediate_action: recommendation.immediate_action || 'Immediate evaluation required',
          differential_diagnosis: recommendation.differential_diagnosis || [],
          supporting_evidence: recommendation.supporting_evidence || '',
          risk_considerations: recommendation.risk_considerations || '',
          uncertainty_level: recommendation.uncertainty_level || 'Medium'
        },
        tokenStats,
        latency: { llm: llmMs, total: Date.now() - requestStart }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
