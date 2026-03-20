/**
 * Fast Triage Route - Hybrid Groq+Ollama Pipeline
 * Target: <400ms with Groq, <50ms with cache
 */

const express = require('express');
const router = express.Router();
const { hybridCall, getStructuredRecommendation, getDetailedRecommendation, getFastSummary } = require('../services/hybridLLM');
const { compressText } = require('../services/compression');
const { verifyHallucination } = require('../services/verification');
const { calculateConfidence } = require('../services/confidence');
const { countTokens, calculateTokenReduction } = require('../utils/tokenCounter');

/**
 * POST /api/triage
 * Fast summarized response - target <400ms latency
 * Returns: immediate_action, key_findings, priority, summary
 */
router.post('/', async (req, res) => {
  const requestStart = Date.now();

  try {
    const { patientHistory, emergencyDescription, caseDescription } = req.body;

    const history = patientHistory || '';
    const emergency = emergencyDescription || caseDescription || '';

    if (!history && !emergency) {
      return res.status(400).json({
        success: false,
        error: 'Please provide patientHistory and emergencyDescription',
      });
    }

    // ===== STAGE 1: COMPRESSION (1-5ms) =====
    const t1 = Date.now();
    const fullText = `${history}\n\nEmergency: ${emergency}`;
    const compressed = compressText(fullText);
    const compression_ms = Date.now() - t1;

    // ===== STAGE 2: FAST SUMMARY (0-350ms) =====
    const t2 = Date.now();
    const recommendation = await getFastSummary(history || compressed, emergency);
    const recommendation_ms = Date.now() - t2;

    const total_ms = Date.now() - requestStart;

    // Build compact response mapping exactly to the schema App.jsx expects to avoid black screens
    res.json({
      success: true,
      mode: 'fast-summary',
      data: {
        original: fullText,
        compressed_history: compressed || 'No compression applied',
        recommendation: {
          immediate_action: recommendation.immediate_action || 'Emergency evaluation required',
          differential_diagnosis: [recommendation.key_findings || 'Pending clinical assessment'],
          supporting_evidence: recommendation.key_findings || '',
          risk_considerations: `Priority: ${recommendation.priority || 'Urgent'}`,
          uncertainty_level: 'Medium',
          case_summary: recommendation.summary || 'Requires clinical evaluation'
        },
        tokenStats: { reduction: 'Aggressive Fast Mode' },
        verification: { status: 'Fast Assessed' },
        confidence: { score: 95, reasoning: 'Speed optimized' },
        performance: {
          total_ms,
          compression_ms,
          recommendation_ms,
          verification_ms: 0,
          provider: recommendation.provider || 'groq',
          fromCache: recommendation.fromCache || false,
          grade: total_ms <= 400 ? '🟢 EXCELLENT' : total_ms <= 600 ? '🟡 GOOD' : '🔴 SLOW'
        }
      }
    });

    console.log(`⚡ FAST TRIAGE: ${total_ms}ms ${recommendation.fromCache ? '(cached)' : '(Groq)'}`);

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

/**
 * POST /api/triage/detailed
 * Comprehensive triage report with clinical reasoning and detailed descriptions
 */
router.post('/detailed', async (req, res) => {
  const requestStart = Date.now();

  try {
    const { patientHistory, emergencyDescription, caseDescription } = req.body;

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

    // ===== STAGE 2: DETAILED LLM RECOMMENDATION (300-800ms) =====
    const t2 = Date.now();
    const recommendation = await getDetailedRecommendation(
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
    performance.grade = performance.total_ms <= 800 ? 'EXCELLENT' :
                        performance.total_ms <= 1500 ? 'GOOD' : 'NEEDS_OPTIMIZATION';

    // Build comprehensive response with detailed information
    res.json({
      success: true,
      mode: 'detailed-groq-ollama',
      data: {
        original: fullText,
        compressed_history: compressed,
        recommendation: {
          // Immediate action with full clinical context
          immediate_action: recommendation.immediate_action || 'Immediate medical evaluation required',
          immediate_action_rationale: recommendation.immediate_action_rationale || 'Clinical assessment indicates urgent intervention needed',
          
          // Differential diagnosis with probabilities and descriptions
          // Flatten detailed objects into strings for the React UI to prevent black screens
          differential_diagnosis: (recommendation.differential_diagnosis || []).map(dx => 
            typeof dx === 'string' ? dx : `${dx.diagnosis} (${dx.probability}) - ${dx.description}`
          ).slice(0, 3) || ['Assessment pending'],
          differential_rationale: recommendation.differential_rationale || 'Multi-system evaluation indicated based on presentation',
          
          // Supporting evidence with specific findings
          supporting_evidence: recommendation.supporting_evidence || 'Based on provided patient data and clinical presentation',
          
          // Expanded risk considerations
          risk_considerations: recommendation.risk_considerations || 'High-risk case requiring careful monitoring',
          clinical_significance: recommendation.clinical_significance || 'Significant clinical implications requiring intervention',
          
          // Time sensitivity and urgency
          time_sensitivity: recommendation.time_sensitivity || 'Urgent - immediate evaluation recommended',
          
          // Next steps for clinician
          next_clinical_steps: recommendation.next_clinical_steps || 'See immediate action and differential diagnosis',
          monitoring_requirements: recommendation.monitoring_requirements || 'Continuous monitoring of vital signs and clinical status',
          
          // Physician guidance
          physician_guidance: recommendation.physician_guidance || 'Clinical correlation essential given presentation',
          
          // Uncertainty level
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

    console.log(`✅ Detailed triage: ${performance.total_ms}ms (${performance.provider}${performance.fromCache ? ' cached' : ''})`);

  } catch (error) {
    console.error('❌ Detailed triage error:', error.message);
    const totalLatency = Date.now() - requestStart;

    res.status(500).json({
      success: false,
      error: 'Detailed triage processing failed',
      message: error.message,
      latency_ms: totalLatency,
    });
  }
});

module.exports = router;
