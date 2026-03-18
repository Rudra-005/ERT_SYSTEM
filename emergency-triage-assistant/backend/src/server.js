const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const triageRoutes = require('./routes/triage');
const compressionRoutes = require('./routes/compression');
const pipelineRoutes = require('./routes/pipeline');
const keyRoutes = require('./routes/keys');
const comparisonRoutes = require('./routes/comparison');
const logsRoutes = require('./routes/logs');
const ragRoutes = require('./routes/rag');
const healthRoutes = require('./routes/health');
const ultraFastRoutes = require('./routes/ultraFast');
const fastTriageOptimizedRoutes = require('./routes/fastTriageOptimized');
const hybridTriageRoutes = require('./routes/hybridTriage');
const { apiKeyMiddleware } = require('./middleware/apiKeyMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const { latencyMiddleware, apiLatencyMiddleware } = require('./middleware/latencyMiddleware');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Add latency tracking to all requests
app.use(latencyMiddleware);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0.0-ultra-fast'
  });
});

app.use('/api/keys', keyRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/hybrid', hybridTriageRoutes); // NEW: Hybrid Groq+Ollama with cache
app.use('/api/ultra-fast', ultraFastRoutes);
app.use('/api/triage', fastTriageOptimizedRoutes);
app.use('/api/rag', apiKeyMiddleware, apiLatencyMiddleware, ragRoutes);
app.use('/api/triage-v2', apiKeyMiddleware, apiLatencyMiddleware, pipelineRoutes);
app.use('/api/compare', comparisonRoutes);
app.use('/api/triage-legacy', apiKeyMiddleware, apiLatencyMiddleware, triageRoutes);
app.use('/api/compress', apiKeyMiddleware, apiLatencyMiddleware, compressionRoutes);

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 HYBRID Emergency Triage Assistant v4.0`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(``);
  logger.info(`🔥 NEW HYBRID ENDPOINT (Groq + Ollama + Cache):`);
  logger.info(`   POST /api/hybrid/ultra-fast - <400ms target`);
  logger.info(`   GET  /api/hybrid/stats - Performance stats`);
  logger.info(`   POST /api/hybrid/clear-cache - Clear cache`);
  logger.info(``);
  logger.info(`⚡ Other Endpoints:`);
  logger.info(`   POST /api/triage/optimized - Full pipeline`);
  logger.info(`   POST /api/triage/naive - Direct LLM`);
  logger.info(`   POST /api/triage/fast - Optimized fast`);
  logger.info(``);
  logger.info(`🎯 Performance Targets:`);
  logger.info(`   Cache hit: 0-50ms`);
  logger.info(`   Groq call: 150-400ms`);
  logger.info(`   Ollama fallback: 2-5s`);
  logger.info(``);
  logger.info(`✅ Hybrid Mode: Groq (fast) + Ollama (fallback) + Cache (instant)`);
  logger.info(`🔥 Production ready with <400ms latency!`);
});
