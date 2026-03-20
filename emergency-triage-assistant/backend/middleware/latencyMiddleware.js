/**
 * Latency Middleware for Express
 * Enforces 400ms hard limit with detailed breakdown logging
 */

const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const RESET = '\x1b[0m';

const latencyMiddleware = (req, res, next) => {
  const startTime = performance.now();
  
  // Store timing data on request object
  req.timings = {};
  req.startTime = startTime;
  
  // Override res.json to capture response time
  const originalJson = res.json.bind(res);
  
  res.json = function(body) {
    const endTime = performance.now();
    const latencyMs = endTime - startTime;
    
    // Add latency header
    res.setHeader('X-Latency-Ms', latencyMs.toFixed(2));
    
    // Extract route and patient info
    const route = req.route ? req.route.path : req.path;
    const patientId = req.body?.patient_id || req.query?.patient_id || 'N/A';
    
    // Log based on latency thresholds
    if (latencyMs >= 400) {
      console.error(
        `${RED}🚨 CRITICAL VIOLATION 🚨${RESET}\n` +
        `Route: ${route}\n` +
        `Patient ID: ${patientId}\n` +
        `Total Latency: ${latencyMs.toFixed(2)}ms (EXCEEDS 400ms LIMIT)\n` +
        `Breakdown:\n` +
        `  - Cache Lookup: ${(req.timings.cache || 0).toFixed(2)}ms\n` +
        `  - Protocol Detection: ${(req.timings.protocol || 0).toFixed(2)}ms\n` +
        `  - LLM: ${(req.timings.llm || 0).toFixed(2)}ms\n` +
        `  - Other: ${(latencyMs - Object.values(req.timings).reduce((a, b) => a + b, 0)).toFixed(2)}ms`
      );
    } else if (latencyMs >= 380) {
      console.warn(
        `${RED}⚠️  WARNING: Near Limit ⚠️${RESET}\n` +
        `Route: ${route} | Patient ID: ${patientId} | Latency: ${latencyMs.toFixed(2)}ms`
      );
    } else if (latencyMs >= 300) {
      console.log(
        `${YELLOW}Route: ${route} | Latency: ${latencyMs.toFixed(2)}ms${RESET}`
      );
    } else {
      console.log(`Route: ${route} | Latency: ${latencyMs.toFixed(2)}ms`);
    }
    
    // Add timing data to response for frontend dashboard
    if (body && typeof body === 'object') {
      body._latency_ms = latencyMs;
      body._timings = req.timings;
    }
    
    return originalJson(body);
  };
  
  next();
};

/**
 * Helper to track individual component timings
 */
const trackTiming = (req, component, durationMs) => {
  if (req.timings) {
    req.timings[component] = durationMs;
  }
};

module.exports = { latencyMiddleware, trackTiming };
