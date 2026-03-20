import time
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int, ttl_seconds: int):
        self.cache = OrderedDict()
        self.capacity = capacity
        self.ttl = ttl_seconds

    def get(self, key: str):
        if key not in self.cache:
            return None
        
        value, timestamp = self.cache[key]
        if time.time() - timestamp > self.ttl:
            del self.cache[key]
            return None
            
        # Move to end to show it was recently used
        self.cache.move_to_end(key)
        print("[CACHE HIT] - saved ~250ms")
        return value

    def set(self, key: str, value: str):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = (value, time.time())
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Global singleton with 200 items max and 120s TTL
global_cache = LRUCache(200, 120)
