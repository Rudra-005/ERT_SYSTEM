const LRUCache = class {
  constructor(maxSize, ttlStr) {
    this.maxSize = maxSize;
    this.ttl = ttlStr;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const entry = this.cache.get(key);
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to most recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    console.log(`[CACHE HIT] - saved ~250ms`);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }
};

// Global singleton cache instance with 200 entries and 120s TTL
const globalCache = new LRUCache(200, 120000);

module.exports = globalCache;
