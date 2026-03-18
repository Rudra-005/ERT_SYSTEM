from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
import time
from app.services.fast_retrieval_service import retrieval_service
from app.services.ollama_llm_service import ollama_service

router = APIRouter(tags=["query"])

class QueryRequest(BaseModel):
    patient_id: str
    query: str
    mode: Literal["emergency", "deep"] = "emergency"

async def _process_query(request: QueryRequest):
    """
    Core RAG pipeline logic with latency logging.
    
    Target: <350ms total latency
    """
    pipeline_start = time.time()
    
    try:
        print(f"\n{'='*60}")
        print(f"🔍 RAG Query: patient={request.patient_id}, mode={request.mode}")
        print(f"{'='*60}")
        
        # Step 1: Retrieve relevant chunks
        retrieval_start = time.time()
        retrieval_result = await retrieval_service.retrieve(
            patient_id=request.patient_id,
            query=request.query,
            mode=request.mode
        )
        retrieval_time = (time.time() - retrieval_start) * 1000
        
        # Step 2: Build context from chunks (minimal overhead)
        context_start = time.time()
        context = "\n\n".join([
            f"[Segment {i+1}] {chunk['text']}"
            for i, chunk in enumerate(retrieval_result["chunks"])
        ])
        context_time = (time.time() - context_start) * 1000
        
        # Step 3: Generate LLM response using Ollama
        llm_start = time.time()
        llm_result = await ollama_service.generate(
            context=context,
            query=request.query,
            mode=request.mode
        )
        llm_time = (time.time() - llm_start) * 1000
        
        # Calculate total latency
        total_latency = (time.time() - pipeline_start) * 1000
        
        # Log comprehensive latency breakdown
        print(f"\n📊 Latency Breakdown:")
        print(f"   Retrieval:  {retrieval_result['retrieval_time_ms']:>6.2f}ms")
        print(f"   Context:    {context_time:>6.2f}ms")
        print(f"   LLM:        {llm_result['llm_latency_ms']:>6.2f}ms")
        print(f"   {'─'*30}")
        print(f"   TOTAL:      {total_latency:>6.2f}ms")
        
        # Performance indicator
        if total_latency < 350:
            print(f"   ✅ Target met (<350ms)")
        else:
            print(f"   ⚠️  Exceeded target (>{total_latency:.0f}ms)")
        print(f"{'='*60}\n")
        
        return {
            "answer": llm_result["answer"],
            "cited_segments": [
                {
                    "segment_id": i + 1,
                    "text": chunk["text"][:200] + "...",
                    "similarity": chunk["similarity_score"]
                }
                for i, chunk in enumerate(retrieval_result["chunks"])
            ],
            "latency": {
                "retrieval_ms": retrieval_result["retrieval_time_ms"],
                "llm_ms": llm_result["llm_latency_ms"],
                "total_ms": round(total_latency, 2)
            },
            "performance": {
                "target_met": total_latency < 350,
                "chunks_retrieved": len(retrieval_result["chunks"]),
                "mode": request.mode
            }
        }
    
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    
    except Exception as e:
        print(f"❌ Query failed: {str(e)}")
        raise HTTPException(500, f"Query failed: {str(e)}")

@router.post("/query")
async def query(request: QueryRequest):
    """
    Complete RAG pipeline: Retrieve + LLM generation.
    
    Optimized for <350ms latency:
    - CHUNK_SIZE: 150 tokens
    - TOP_K: 2 chunks
    - LLM: Ollama phi3:mini (local)
    - Caching: 60s TTL
    
    Modes:
    🔴 Emergency: top_k=2, num_predict=50, fast response
    🔵 Deep: top_k=2, num_predict=100, detailed analysis
    """
    return await _process_query(request)

@router.post("/chat")
async def chat(request: QueryRequest):
    """
    Chat endpoint with optimized RAG pipeline.
    
    Target: <350ms total latency
    
    Flow:
    1. Load patient FAISS index (cached)
    2. Retrieve 2 most relevant chunks
    3. Send context to Ollama LLM (local, cached)
    4. Return answer + cited chunks + latency
    """
    return await _process_query(request)

@router.post("/clear-cache")
async def clear_cache():
    """Clear LLM response cache."""
    ollama_service.clear_cache()
    return {
        "status": "success",
        "message": "Response cache cleared"
    }
