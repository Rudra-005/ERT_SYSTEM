/**
 * In-memory cache with 120 second TTL
 * Cache lookup must complete in <2ms
 */

const crypto = require('crypto');

class FastCache {
  constructor(ttlSeconds = 120) {
    this.cache = new Map();
    this.ttlSeconds = ttlSeconds;
  }

  _normalizeKey(question, patientId = null) {
    let normalized = question.toLowerCase().trim();
    if (patientId) {
      normalized = `${patientId}:${normalized}`;
    }
    // Hash for consistent key length
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  get(question, patientId = null) {
    const startTime = performance.now();
    const key = this._normalizeKey(question, patientId);

    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      const age = (Date.now() - entry.timestamp) / 1000;

      if (age < this.ttlSeconds) {
        const lookupTimeMs = performance.now() - startTime;
        console.log(`Cache HIT (age: ${age.toFixed(1)}s, lookup: ${lookupTimeMs.toFixed(3)}ms)`);
        return entry.data;
      } else {
        // Expired, remove
        this.cache.delete(key);
        console.log(`Cache EXPIRED (age: ${age.toFixed(1)}s)`);
      }
    }

    const lookupTimeMs = performance.now() - startTime;
    console.log(`Cache MISS (lookup: ${lookupTimeMs.toFixed(3)}ms)`);
    return null;
  }

  set(question, data, patientId = null) {
    const key = this._normalizeKey(question, patientId);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`Cache SET (total entries: ${this.cache.size})`);
  }

  clearExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = (now - entry.timestamp) / 1000;
      if (age >= this.ttlSeconds) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  clearAll() {
    this.cache.clear();
    console.log('Cache cleared');
  }

  stats() {
    return {
      total_entries: this.cache.size,
      ttl_seconds: this.ttlSeconds
    };
  }
}

// Singleton instance
const cache = new FastCache(120);

// Periodic cleanup every 60 seconds
setInterval(() => {
  cache.clearExpired();
}, 60000);

module.exports = { cache };
