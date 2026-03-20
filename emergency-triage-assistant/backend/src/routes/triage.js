const express = require('express');
const router = express.Router();
const { processOptimized, processNaive } = require('../controllers/triageController');
const { analyzeWithOllama } = require('../services/ollamaService');

router.post('/optimized', processOptimized);
router.post('/naive', processNaive);

// AI-powered triage analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { patientContext, currentVisit } = req.body;

    if (!patientContext || !currentVisit) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const analysisResults = await analyzeWithOllama(patientContext, currentVisit);
    res.json(analysisResults);
  } catch (error) {
    console.error('Triage analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

module.exports = router;
