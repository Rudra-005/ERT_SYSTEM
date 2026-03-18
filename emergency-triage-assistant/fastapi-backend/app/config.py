from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "AI Clinical Intelligence System"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "phi3:mini"
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 150  # Reduced from 300 for faster processing
    chunk_overlap: int = 25  # Proportionally reduced
    top_k: int = 2  # Reduced from 5 for faster retrieval
    faiss_index_dir: str = "./data/faiss_indexes"
    pdf_storage_dir: str = "./data/pdfs"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    cache_ttl_seconds: int = 60  # Response cache TTL
    groq_api_key: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
