import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.latency_tracker import latency_tracker

class LatencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Store start time on request
        request.state.start_time = start_time
        
        try:
            response = await call_next(request)
            
            # Calculate latency
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            # Determine status
            status = "error" if response.status_code >= 400 else "success"
            
            # Record latency
            await latency_tracker.record_latency(
                endpoint=str(request.url.path),
                method=request.method,
                latency_ms=latency_ms,
                status=status
            )
            
            # Add latency header for debugging
            response.headers["X-Response-Time"] = f"{latency_ms:.1f}ms"
            
            return response
            
        except Exception as e:
            # Calculate latency even for exceptions
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            # Record error latency
            await latency_tracker.record_latency(
                endpoint=str(request.url.path),
                method=request.method,
                latency_ms=latency_ms,
                status="error",
                details={"error": str(e)}
            )
            
            # Re-raise the exception
            raise e