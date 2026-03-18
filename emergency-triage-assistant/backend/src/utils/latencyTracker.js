const fs = require('fs').promises;
const path = require('path');

class LatencyTracker {
  constructor() {
    this.recentLatencies = [];
    this.maxRecentEntries = 10;
    this.logFile = path.join(__dirname, '../../logs/latency.log');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  /**
   * Record a new latency measurement
   */
  recordLatency(endpoint, method, latencyMs, status = 'success') {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      endpoint,
      method,
      latency_ms: latencyMs,
      status
    };

    // Add to recent latencies (keep only last 10)
    this.recentLatencies.push(entry);
    if (this.recentLatencies.length > this.maxRecentEntries) {
      this.recentLatencies.shift();
    }

    // Log to file asynchronously
    this.logToFile(entry).catch(error => {
      console.error('Failed to log latency:', error);
    });
  }

  /**
   * Get average latency of recent requests
   */
  getAverageLatency() {
    if (this.recentLatencies.length === 0) return 0;
    
    const successfulEntries = this.recentLatencies.filter(entry => entry.status === 'success');
    if (successfulEntries.length === 0) return 0;
    
    const totalLatency = successfulEntries.reduce((sum, entry) => sum + entry.latency_ms, 0);
    return Math.round(totalLatency / successfulEntries.length);
  }

  /**
   * Get recent latency statistics
   */
  getLatencyStats() {
    const successfulEntries = this.recentLatencies.filter(entry => entry.status === 'success');
    
    if (successfulEntries.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        recent_entries: 0
      };
    }

    const latencies = successfulEntries.map(entry => entry.latency_ms);
    
    return {
      count: successfulEntries.length,
      average: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      recent_entries: this.recentLatencies.length
    };
  }

  /**
   * Log entry to file
   */
  async logToFile(entry) {
    try {
      const logLine = `${entry.timestamp} | ${entry.method} ${entry.endpoint} | ${entry.latency_ms}ms | ${entry.status}\n`;
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  /**
   * Get recent log entries
   */
  async getRecentLogs(lines = 50) {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      const logLines = data.trim().split('\n');
      return logLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    try {
      await fs.writeFile(this.logFile, '');
      this.recentLatencies = [];
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// Singleton instance
const latencyTracker = new LatencyTracker();

module.exports = latencyTracker;