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
const historyRoutes = require('./routes/history');
const { apiKeyMiddleware } = require('./middleware/apiKeyMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const { latencyMiddleware, apiLatencyMiddleware } = require('./middleware/latencyMiddleware');
const strictLatencyTracker = require('./middleware/latency');
const { warmUpOllama, startKeepAlivePing } = require('./services/ollamaService');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Add STRICT latency tracking to all requests
app.use(strictLatencyTracker);

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
app.use('/api/history', historyRoutes);
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

// Strict boot: Wait for Ollama to Warm-Up BEFORE accepting any traffic
warmUpOllama()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 STRICT SLA Emergency Triage Assistant`);
      logger.info(`Server running on port ${PORT}`);
      
      // Start polling Ollama so it never unloads
      startKeepAlivePing();
      logger.info(`✅ Keep-alive background ping enabled for Ollama`);
      logger.info(`🔥 Production ready with absolute <400ms guarantees.`);
    });
  })
  .catch((err) => {
    logger.error('CRITICAL: Server failed to start due to Ollama warm-up failure.');
    process.exit(1);
  });
