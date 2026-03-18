const latencyTracker = require('../utils/latencyTracker');

/**
 * Middleware to track request latency
 */
function latencyMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Store start time on request object
  req.startTime = startTime;
  
  // Override res.end to capture when response is sent
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    // Determine status based on response code
    const status = res.statusCode >= 400 ? 'error' : 'success';
    
    // Record latency
    latencyTracker.recordLatency(
      req.originalUrl || req.url,
      req.method,
      latency,
      status
    );
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Enhanced middleware for API routes that need detailed tracking
 */
function apiLatencyMiddleware(req, res, next) {
  const startTime = Date.now();
  req.startTime = startTime;
  
  // Add timing helper to request
  req.addTiming = function(label, timeMs) {
    if (!req.timings) req.timings = {};
    req.timings[label] = timeMs;
  };
  
  // Override json method to capture response details
  const originalJson = res.json;
  
  res.json = function(data) {
    const endTime = Date.now();
    const totalLatency = endTime - startTime;
    
    // Add latency info to response if it's a success response
    if (res.statusCode < 400 && data && typeof data === 'object') {
      if (!data.latency) {
        data.latency = {
          total_ms: totalLatency,
          ...(req.timings || {})
        };
      }
    }
    
    // Record latency
    const status = res.statusCode >= 400 ? 'error' : 'success';
    latencyTracker.recordLatency(
      req.originalUrl || req.url,
      req.method,
      totalLatency,
      status
    );
    
    // Call original json method
    originalJson.call(this, data);
  };
  
  next();
}

module.exports = {
  latencyMiddleware,
  apiLatencyMiddleware
};