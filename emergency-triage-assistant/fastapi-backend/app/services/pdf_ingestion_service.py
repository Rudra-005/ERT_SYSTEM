import fitz  # PyMuPDF
import time
import json
import pickle
from pathlib import Path
from typing import List, Dict
from app.config import get_settings

settings = get_settings()

class PDFIngestionService:
    def __init__(self):
        self.index_dir = Path(settings.faiss_index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.chunk_size = settings.chunk_size  # 150 tokens (optimized)
        self.chunk_overlap = settings.chunk_overlap  # 25 tokens
        print(f"✓ PDF Extraction initialized without torch/FAISS dependencies")
        print(f"✓ Optimized chunk size: {self.chunk_size} tokens")
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF using PyMuPDF."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into optimized chunks (150 tokens with 25 token overlap).
        """
        words = text.split()
        chunks = []
        
        step_size = self.chunk_size - self.chunk_overlap
        
        for i in range(0, len(words), step_size):
            chunk = " ".join(words[i:i + self.chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    def save_index(self, patient_id: str, chunks: List[str]):
        """Save metadata (original chunks) for Groq context ingestion."""
        metadata_path = self.index_dir / f"patient_{patient_id}_metadata.pkl"
        
        # Save metadata (original chunks)
        with open(metadata_path, 'wb') as f:
            pickle.dump({"chunks": chunks}, f)
    
    async def process_pdf(self, patient_id: str, pdf_bytes: bytes) -> Dict:
        """
        Complete PDF ingestion pipeline, bypassing FAISS/torch embeddings.
        Groq pipeline only needs text extraction.
        """
        start_time = time.time()
        
        # Extract text
        t1 = time.time()
        text = self.extract_text_from_pdf(pdf_bytes)
        extract_time = (time.time() - t1) * 1000
        
        # Chunk text
        t2 = time.time()
        chunks = self.chunk_text(text)
        chunk_time = (time.time() - t2) * 1000
        
        # Save index and metadata
        t5 = time.time()
        self.save_index(patient_id, chunks)
        save_time = (time.time() - t5) * 1000
        
        indexing_time_ms = round((time.time() - start_time) * 1000, 2)
        
        print(f"✓ Extracted patient_{patient_id}: {len(chunks)} chunks in {indexing_time_ms}ms")
        print(f"  Breakdown: extract={extract_time:.0f}ms, chunk={chunk_time:.0f}ms, save={save_time:.0f}ms")
        
        return {
            "total_chunks": len(chunks),
            "indexing_time_ms": indexing_time_ms,
            "chunk_size": self.chunk_size
        }

# Global instance
pdf_service = PDFIngestionService()
