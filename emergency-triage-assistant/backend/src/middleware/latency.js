/**
 * Express middleware to track per-layer latency and log strictly colored output
 */
const latencyTracker = (req, res, next) => {
  const start = Date.now();
  
  // Attach timers to track layers
  req.metrics = {
    cache: 0,
    embedding: 0,
    retrieval: 0,
    llm: 0,
    recordCache: (ms) => req.metrics.cache += ms,
    recordEmbedding: (ms) => req.metrics.embedding += ms,
    recordRetrieval: (ms) => req.metrics.retrieval += ms,
    recordLlm: (ms) => req.metrics.llm += ms
  };

  // Override res.json to calculate total time right before sending
  const originalJson = res.json;
  res.json = function (body) {
    const totalMs = Date.now() - start;
    
    let status = 'OK';
    let color = '\x1b[32m'; // Green
    
    if (totalMs > 400) {
      status = 'VIOLATION';
      color = '\x1b[31m'; // Red
    } else if (totalMs > 380) {
      status = 'WARNING';
      color = '\x1b[33m'; // Yellow
    }

    const logString = `${color}[LATENCY] ${req.path} | cache: ${req.metrics.cache}ms | embedding: ${req.metrics.embedding}ms | retrieval: ${req.metrics.retrieval}ms | llm: ${req.metrics.llm}ms | total: ${totalMs}ms | status: ${status}\x1b[0m`;
    
    console.log(logString);
    
    // Optionally inject metrics into body if it's an object
    if (typeof body === 'object' && body !== null && !body.latency_metrics) {
      body.latency_metrics = {
        total_ms: totalMs,
        status
      };
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = latencyTracker;
