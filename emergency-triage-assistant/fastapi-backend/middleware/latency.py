import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class LatencyTrackerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Initialize metrics
        request.state.metrics = {
            "cache": 0.0,
            "embedding": 0.0,
            "retrieval": 0.0,
            "llm": 0.0
        }
        
        response = await call_next(request)
        
        # Calculate total latency
        total_ms = int((time.time() - start_time) * 1000)
        
        # Status determination
        status = "OK"
        # ANSI Escape Codes
        GREEN = "\033[92m"
        YELLOW = "\033[93m"
        RED = "\033[91m"
        RESET = "\033[0m"
        
        color = GREEN
        if total_ms > 400:
            status = "VIOLATION"
            color = RED
        elif total_ms > 380:
            status = "WARNING"
            color = YELLOW
            
        # Log exactly as requested
        cache_ms = int(request.state.metrics["cache"] * 1000)
        embedding_ms = int(request.state.metrics["embedding"] * 1000)
        retrieval_ms = int(request.state.metrics["retrieval"] * 1000)
        llm_ms = int(request.state.metrics["llm"] * 1000)
        
        log_string = f"{color}[LATENCY] {request.url.path} | cache: {cache_ms}ms | embedding: {embedding_ms}ms | retrieval: {retrieval_ms}ms | llm: {llm_ms}ms | total: {total_ms}ms | status: {status}{RESET}"
        
        print(log_string)
        
        return response
