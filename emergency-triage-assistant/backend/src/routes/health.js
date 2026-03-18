const express = require('express');
const router = express.Router();
const { healthCheck } = require('../ollamaService');
const latencyTracker = require('../utils/latencyTracker');

router.get('/', async (req, res) => {
  try {
    const health = await healthCheck();
    const latencyStats = latencyTracker.getLatencyStats();
    
    if (health.status === 'healthy') {
      res.json({
        status: 'ok',
        ollama: 'connected',
        model: health.model || 'phi3:mini',
        avg_latency_ms: latencyStats.average,
        latency_stats: {
          recent_requests: latencyStats.count,
          min_ms: latencyStats.min,
          max_ms: latencyStats.max,
          avg_ms: latencyStats.average
        },
        ollama_latency_ms: health.latency_ms,
        model_available: health.model_available,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'degraded',
        ollama: 'disconnected',
        model: health.model || 'phi3:mini',
        avg_latency_ms: latencyStats.average,
        error: health.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const latencyStats = latencyTracker.getLatencyStats();
    res.status(500).json({
      status: 'error',
      ollama: 'disconnected',
      model: 'phi3:mini',
      avg_latency_ms: latencyStats.average,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Additional endpoint for detailed latency info
router.get('/latency', async (req, res) => {
  try {
    const stats = latencyTracker.getLatencyStats();
    const recentLogs = await latencyTracker.getRecentLogs(20);
    
    res.json({
      success: true,
      latency_stats: stats,
      recent_logs: recentLogs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;