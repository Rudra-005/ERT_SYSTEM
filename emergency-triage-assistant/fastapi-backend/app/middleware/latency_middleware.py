"""
Latency Middleware for FastAPI
Enforces 400ms hard limit with detailed breakdown logging
"""
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

# Configure colored logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LatencyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.RED = '\033[91m'
        self.YELLOW = '\033[93m'
        self.RESET = '\033[0m'

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Store start time in request state for sub-component tracking
        request.state.start_time = start_time
        request.state.timings = {}
        
        response = await call_next(request)
        
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        
        # Extract timing breakdown if available
        timings = getattr(request.state, 'timings', {})
        
        # Add latency header
        response.headers['X-Latency-Ms'] = str(round(latency_ms, 2))
        
        # Get route info
        route = request.url.path
        patient_id = request.query_params.get('patient_id', 'N/A')
        
        # Log based on latency thresholds
        if latency_ms >= 400:
            logger.error(
                f"{self.RED}🚨 CRITICAL VIOLATION 🚨{self.RESET}\n"
                f"Route: {route}\n"
                f"Patient ID: {patient_id}\n"
                f"Total Latency: {latency_ms:.2f}ms (EXCEEDS 400ms LIMIT)\n"
                f"Breakdown:\n"
                f"  - Embedding: {timings.get('embedding', 0):.2f}ms\n"
                f"  - Retrieval: {timings.get('retrieval', 0):.2f}ms\n"
                f"  - LLM: {timings.get('llm', 0):.2f}ms\n"
                f"  - Other: {latency_ms - sum(timings.values()):.2f}ms"
            )
        elif latency_ms >= 380:
            logger.warning(
                f"{self.RED}⚠️  WARNING: Near Limit ⚠️{self.RESET}\n"
                f"Route: {route} | Patient ID: {patient_id} | "
                f"Latency: {latency_ms:.2f}ms"
            )
        elif latency_ms >= 300:
            logger.info(
                f"{self.YELLOW}Route: {route} | Latency: {latency_ms:.2f}ms{self.RESET}"
            )
        else:
            logger.info(f"Route: {route} | Latency: {latency_ms:.2f}ms")
        
        return response


def track_timing(request: Request, component: str, duration_ms: float):
    """Helper to track individual component timings"""
    if hasattr(request.state, 'timings'):
        request.state.timings[component] = duration_ms
