"""
In-memory cache with 120 second TTL
Cache lookup must complete in <2ms
"""
import time
from typing import Optional, Dict, Any
import hashlib
import logging

logger = logging.getLogger(__name__)

class FastCache:
    def __init__(self, ttl_seconds: int = 120):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds
    
    def _normalize_key(self, question: str, patient_id: Optional[str] = None) -> str:
        """Create normalized cache key"""
        normalized = question.lower().strip()
        if patient_id:
            normalized = f"{patient_id}:{normalized}"
        # Hash for consistent key length
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def get(self, question: str, patient_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get cached response if exists and not expired
        Must complete in <2ms
        """
        start_time = time.perf_counter()
        
        key = self._normalize_key(question, patient_id)
        
        if key in self.cache:
            entry = self.cache[key]
            age = time.time() - entry['timestamp']
            
            if age < self.ttl_seconds:
                lookup_time_ms = (time.perf_counter() - start_time) * 1000
                logger.info(f"Cache HIT (age: {age:.1f}s, lookup: {lookup_time_ms:.3f}ms)")
                return entry['data']
            else:
                # Expired, remove
                del self.cache[key]
                logger.info(f"Cache EXPIRED (age: {age:.1f}s)")
        
        lookup_time_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"Cache MISS (lookup: {lookup_time_ms:.3f}ms)")
        return None
    
    def set(self, question: str, data: Dict[str, Any], patient_id: Optional[str] = None):
        """Store response in cache"""
        key = self._normalize_key(question, patient_id)
        self.cache[key] = {
            'data': data,
            'timestamp': time.time()
        }
        logger.info(f"Cache SET (total entries: {len(self.cache)})")
    
    def clear_expired(self):
        """Remove expired entries (run periodically)"""
        now = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now - entry['timestamp'] >= self.ttl_seconds
        ]
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")
    
    def clear_all(self):
        """Clear entire cache"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "total_entries": len(self.cache),
            "ttl_seconds": self.ttl_seconds
        }


# Singleton instance
cache = FastCache(ttl_seconds=120)
