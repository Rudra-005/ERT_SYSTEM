"""
FastAPI Main Application
Includes latency middleware, warmup validation, and cache integration
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.middleware.latency_middleware import LatencyMiddleware
from app.services.ollama_service import ollama_service
from app.services.rag_pipeline import rag_pipeline
from app.services.cache_service import cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Run warmup validation
    logger.info("🚀 Starting FastAPI backend...")
    warmup_time = await ollama_service.warmup()
    
    if warmup_time > 350:
        logger.warning(
            f"\n{'='*60}\n"
            f"⚠️  PERFORMANCE WARNING ⚠️\n"
            f"Ollama warmup: {warmup_time:.2f}ms (exceeds 350ms)\n"
            f"System may not meet 400ms latency requirement.\n"
            f"Run: ollama run phi3:mini\n"
            f"{'='*60}\n"
        )
    
    logger.info("✓ FastAPI backend ready")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI backend...")
    await ollama_service.close()

app = FastAPI(
    title="Emergency Triage RAG API",
    version="1.0.0",
    lifespan=lifespan
)

# Add latency middleware
app.add_middleware(LatencyMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "cache_stats": cache.stats()
    }

@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    RAG chat endpoint with caching and strict latency enforcement
    """
    import time
    from app.middleware.latency_middleware import track_timing
    
    body = await request.json()
    question = body.get("question", "")
    patient_id = body.get("patient_id")
    
    # Check cache first (<2ms)
    cached_response = cache.get(question, patient_id)
    if cached_response:
        return cached_response
    
    # Retrieve relevant chunks
    retrieval_result = await rag_pipeline.retrieve(question, request)
    chunks = retrieval_result["chunks"]
    
    if not chunks:
        response = {
            "answer": "No relevant medical context found",
            "sources": [],
            "cached": False
        }
        cache.set(question, response, patient_id)
        return response
    
    # Build context within 400 token limit
    system_prompt = "You are a medical assistant. Answer based on the provided context."
    context = rag_pipeline.build_context(chunks, question, system_prompt)
    
    user_prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    
    # Call Ollama with 350ms timeout
    llm_start = time.perf_counter()
    llm_result = await ollama_service.generate(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        fallback_type="rag"
    )
    llm_time_ms = (time.perf_counter() - llm_start) * 1000
    
    track_timing(request, 'llm', llm_time_ms)
    
    response = {
        "answer": llm_result["response"],
        "sources": chunks,
        "scores": retrieval_result["scores"],
        "fallback_used": llm_result["fallback_used"],
        "cached": False,
        "timings": {
            "embedding_ms": retrieval_result["embedding_time_ms"],
            "retrieval_ms": retrieval_result["retrieval_time_ms"],
            "llm_ms": llm_time_ms
        }
    }
    
    # Cache the response
    cache.set(question, response, patient_id)
    
    return response

@app.post("/upload-pdf")
async def upload_pdf(request: Request):
    """Upload and index PDF document"""
    import time
    
    body = await request.json()
    text = body.get("text", "")
    patient_id = body.get("patient_id", "unknown")
    
    start_time = time.perf_counter()
    
    rag_pipeline.index_document(text, {"patient_id": patient_id})
    
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    
    return {
        "status": "success",
        "patient_id": patient_id,
        "indexing_time_ms": elapsed_ms
    }

@app.post("/cache/clear")
async def clear_cache():
    """Clear cache endpoint"""
    cache.clear_all()
    return {"status": "cache cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
