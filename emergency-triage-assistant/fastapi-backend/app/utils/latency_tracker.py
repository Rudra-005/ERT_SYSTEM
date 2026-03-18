import time
import asyncio
from typing import List, Dict, Any
from collections import deque
import json
from datetime import datetime
import aiofiles
import os

class FastAPILatencyTracker:
    def __init__(self, max_recent_entries: int = 10):
        self.recent_latencies = deque(maxlen=max_recent_entries)
        self.log_file = "logs/fastapi_latency.log"
        self.ensure_log_directory()
    
    def ensure_log_directory(self):
        """Ensure logs directory exists"""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    async def record_latency(self, endpoint: str, method: str, latency_ms: float, status: str = "success", details: Dict = None):
        """Record a new latency measurement"""
        timestamp = datetime.utcnow().isoformat()
        entry = {
            "timestamp": timestamp,
            "endpoint": endpoint,
            "method": method,
            "latency_ms": latency_ms,
            "status": status,
            "details": details or {}
        }
        
        # Add to recent latencies
        self.recent_latencies.append(entry)
        
        # Log to file asynchronously
        try:
            await self._log_to_file(entry)
        except Exception as e:
            print(f"Failed to log latency: {e}")
    
    def get_average_latency(self) -> float:
        """Get average latency of recent successful requests"""
        if not self.recent_latencies:
            return 0.0
        
        successful_entries = [entry for entry in self.recent_latencies if entry["status"] == "success"]
        if not successful_entries:
            return 0.0
        
        total_latency = sum(entry["latency_ms"] for entry in successful_entries)
        return round(total_latency / len(successful_entries), 1)
    
    def get_latency_stats(self) -> Dict[str, Any]:
        """Get comprehensive latency statistics"""
        if not self.recent_latencies:
            return {
                "count": 0,
                "average": 0.0,
                "min": 0.0,
                "max": 0.0,
                "recent_entries": 0
            }
        
        successful_entries = [entry for entry in self.recent_latencies if entry["status"] == "success"]
        if not successful_entries:
            return {
                "count": 0,
                "average": 0.0,
                "min": 0.0,
                "max": 0.0,
                "recent_entries": len(self.recent_latencies)
            }
        
        latencies = [entry["latency_ms"] for entry in successful_entries]
        
        return {
            "count": len(successful_entries),
            "average": round(sum(latencies) / len(latencies), 1),
            "min": round(min(latencies), 1),
            "max": round(max(latencies), 1),
            "recent_entries": len(self.recent_latencies)
        }
    
    async def _log_to_file(self, entry: Dict):
        """Log entry to file"""
        try:
            log_line = f"{entry['timestamp']} | {entry['method']} {entry['endpoint']} | {entry['latency_ms']:.1f}ms | {entry['status']}\n"
            async with aiofiles.open(self.log_file, mode='a') as f:
                await f.write(log_line)
        except Exception:
            # Silently fail to avoid infinite loops
            pass
    
    async def get_recent_logs(self, lines: int = 50) -> List[str]:
        """Get recent log entries"""
        try:
            async with aiofiles.open(self.log_file, mode='r') as f:
                content = await f.read()
                log_lines = content.strip().split('\n')
                return log_lines[-lines:] if log_lines else []
        except Exception:
            return []
    
    async def clear_logs(self):
        """Clear all logs"""
        try:
            async with aiofiles.open(self.log_file, mode='w') as f:
                await f.write('')
            self.recent_latencies.clear()
        except Exception as e:
            print(f"Failed to clear logs: {e}")

# Global instance
latency_tracker = FastAPILatencyTracker()