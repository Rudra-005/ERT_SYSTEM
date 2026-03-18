import pickle
import time
from pathlib import Path
from typing import List, Dict, Literal
import re

class RetrievalService:
    def __init__(self, index_dir: str = "./data/faiss_indexes"):
        self.index_dir = Path(index_dir)
        
        # In-memory cache for loaded indexes (now just text chunks)
        self.index_cache: Dict[str, Dict] = {}
        
        # Optimized mode configurations
        self.mode_config = {
            "emergency": {"top_k": 3},
            "deep": {"top_k": 5}
        }
        
        print(f"✓ Lightweight keyword retrieval service initialized")
    
    def load_index(self, patient_id: str) -> Dict:
        """Load text chunks metadata (cached)."""
        if patient_id in self.index_cache:
            return self.index_cache[patient_id]
        
        metadata_path = self.index_dir / f"patient_{patient_id}_metadata.pkl"
        
        if not metadata_path.exists():
            raise FileNotFoundError(f"Documents not found for patient: {patient_id}")
        
        # Load metadata
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
        
        # Cache for future use
        self.index_cache[patient_id] = {
            "chunks": metadata["chunks"]
        }
        
        print(f"✓ Loaded text chunks for patient_{patient_id} (cached)")
        return self.index_cache[patient_id]
    
    async def retrieve(
        self, 
        patient_id: str, 
        query: str, 
        mode: Literal["emergency", "deep"] = "emergency"
    ) -> Dict:
        """
        Retrieve most relevant chunks using lightweight keyword overlapping.
        Because we bypassed sentence-transformers/faiss to avoid Windows DLL crashes.
        """
        start_time = time.time()
        
        top_k = self.mode_config[mode]["top_k"]
        
        index_data = self.load_index(patient_id)
        chunks = index_data["chunks"]
        
        query_terms = set(re.findall(r'\w+', query.lower()))
        
        scored_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_terms = set(re.findall(r'\w+', chunk.lower()))
            # Simple Jaccard-like overlap
            overlap = len(query_terms.intersection(chunk_terms))
            score = overlap / (len(query_terms) + 0.001)
            scored_chunks.append((i, chunk, score))
            
        # Sort by score descending
        scored_chunks.sort(key=lambda x: x[2], reverse=True)
        
        results = []
        for i, chunk, score in scored_chunks[:top_k]:
            results.append({
                "chunk_id": int(i),
                "text": chunk,
                "similarity_score": score,
                "distance": 1.0 - score
            })
        
        total_time = (time.time() - start_time) * 1000
        
        print(f"⚡ Retrieval (Keyword): {round(total_time, 2)}ms")
        
        return {
            "chunks": results,
            "mode": mode,
            "top_k": top_k,
            "retrieval_time_ms": round(total_time, 2),
            "breakdown": {
                "load_ms": 0,
                "embedding_ms": 0,
                "search_ms": round(total_time, 2)
            }
        }

# Global instance
retrieval_service = RetrievalService()
