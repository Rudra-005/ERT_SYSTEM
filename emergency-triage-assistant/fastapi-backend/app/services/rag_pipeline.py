"""
Optimized RAG Pipeline with strict performance constraints
- Chunk size: 150 tokens
- Chunk overlap: 20 tokens
- Top-k: 2 chunks maximum
- Similarity threshold: 0.75 minimum
- Total context: 400 tokens maximum
"""
import time
import numpy as np
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import faiss
import logging
from fastapi import Request

logger = logging.getLogger(__name__)

# Performance-optimized configuration
CHUNK_SIZE = 150
CHUNK_OVERLAP = 20
TOP_K = 2
SIMILARITY_THRESHOLD = 0.75
MAX_CONTEXT_TOKENS = 400

class OptimizedRAGPipeline:
    def __init__(self):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index: Optional[faiss.Index] = None
        self.chunks: List[str] = []
        self.metadata: List[Dict] = []
    
    def create_chunks(self, text: str) -> List[str]:
        """Create 150-token chunks with 20-token overlap"""
        words = text.split()
        chunks = []
        
        i = 0
        while i < len(words):
            chunk = ' '.join(words[i:i + CHUNK_SIZE])
            chunks.append(chunk)
            i += (CHUNK_SIZE - CHUNK_OVERLAP)
        
        return chunks
    
    def index_document(self, text: str, metadata: Dict[str, Any]):
        """Index document with optimized chunking"""
        start_time = time.perf_counter()
        
        chunks = self.create_chunks(text)
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(chunks, show_progress_bar=False)
        
        # Create or update FAISS index
        if self.index is None:
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
            # Normalize for cosine similarity
            faiss.normalize_L2(embeddings)
        
        self.index.add(embeddings)
        self.chunks.extend(chunks)
        self.metadata.extend([metadata] * len(chunks))
        
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"Indexed {len(chunks)} chunks in {elapsed_ms:.2f}ms")
    
    async def retrieve(
        self, 
        query: str, 
        request: Optional[Request] = None
    ) -> Dict[str, Any]:
        """
        Retrieve top-2 chunks with 0.75 similarity threshold
        Embedding must complete in <30ms, retrieval in <40ms
        """
        if self.index is None or len(self.chunks) == 0:
            return {
                "chunks": [],
                "scores": [],
                "embedding_time_ms": 0,
                "retrieval_time_ms": 0
            }
        
        # Embedding generation (<30ms target)
        embed_start = time.perf_counter()
        query_embedding = self.embedding_model.encode([query], show_progress_bar=False)
        faiss.normalize_L2(query_embedding)
        embed_time_ms = (time.perf_counter() - embed_start) * 1000
        
        if request:
            from app.middleware.latency_middleware import track_timing
            track_timing(request, 'embedding', embed_time_ms)
        
        # FAISS retrieval (<40ms target)
        retrieval_start = time.perf_counter()
        scores, indices = self.index.search(query_embedding, TOP_K)
        retrieval_time_ms = (time.perf_counter() - retrieval_start) * 1000
        
        if request:
            from app.middleware.latency_middleware import track_timing
            track_timing(request, 'retrieval', retrieval_time_ms)
        
        # Filter by similarity threshold (0.75 minimum)
        valid_results = []
        valid_scores = []
        
        for score, idx in zip(scores[0], indices[0]):
            if score >= SIMILARITY_THRESHOLD and idx < len(self.chunks):
                valid_results.append(self.chunks[idx])
                valid_scores.append(float(score))
        
        logger.info(
            f"Retrieval: {len(valid_results)}/{TOP_K} chunks above {SIMILARITY_THRESHOLD} threshold | "
            f"Embed: {embed_time_ms:.2f}ms | Retrieval: {retrieval_time_ms:.2f}ms"
        )
        
        return {
            "chunks": valid_results,
            "scores": valid_scores,
            "embedding_time_ms": embed_time_ms,
            "retrieval_time_ms": retrieval_time_ms
        }
    
    def build_context(
        self, 
        chunks: List[str], 
        question: str, 
        system_prompt: str
    ) -> str:
        """
        Build context ensuring total tokens < 400
        Truncate chunks if necessary
        """
        # Rough token estimation (1 token ≈ 4 characters)
        def estimate_tokens(text: str) -> int:
            return len(text) // 4
        
        system_tokens = estimate_tokens(system_prompt)
        question_tokens = estimate_tokens(question)
        available_tokens = MAX_CONTEXT_TOKENS - system_tokens - question_tokens - 20  # 20 token buffer
        
        # Combine chunks within token budget
        context_parts = []
        current_tokens = 0
        
        for chunk in chunks:
            chunk_tokens = estimate_tokens(chunk)
            if current_tokens + chunk_tokens <= available_tokens:
                context_parts.append(chunk)
                current_tokens += chunk_tokens
            else:
                # Truncate chunk to fit
                remaining_tokens = available_tokens - current_tokens
                if remaining_tokens > 50:  # Only add if meaningful
                    truncated = chunk[:remaining_tokens * 4]
                    context_parts.append(truncated)
                break
        
        context = "\n\n".join(context_parts)
        total_tokens = system_tokens + question_tokens + estimate_tokens(context)
        
        logger.info(f"Context built: {total_tokens} tokens (limit: {MAX_CONTEXT_TOKENS})")
        
        return context


# Singleton instance
rag_pipeline = OptimizedRAGPipeline()
