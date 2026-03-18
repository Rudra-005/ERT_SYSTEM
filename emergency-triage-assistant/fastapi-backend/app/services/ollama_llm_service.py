import httpx
import time
import hashlib
from typing import Dict, Literal, Optional
from datetime import datetime, timedelta
import os

class ResponseCache:
    """Simple in-memory cache with TTL."""
    def __init__(self, ttl_seconds: int = 60):
        self.cache = {}
        self.ttl_seconds = ttl_seconds
    
    def _get_key(self, context: str, query: str, mode: str) -> str:
        """Generate cache key from inputs."""
        combined = f"{context}|{query}|{mode}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, context: str, query: str, mode: str) -> Optional[Dict]:
        """Get cached response if not expired."""
        key = self._get_key(context, query, mode)
        if key in self.cache:
            cached_data, timestamp = self.cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                print(f"✓ Cache HIT - returning cached response (age: {(datetime.now() - timestamp).total_seconds():.1f}s)")
                return cached_data
            else:
                # Expired, remove from cache
                del self.cache[key]
                print(f"✗ Cache EXPIRED - generating new response")
        return None
    
    def set(self, context: str, query: str, mode: str, response: Dict):
        """Store response in cache."""
        key = self._get_key(context, query, mode)
        self.cache[key] = (response, datetime.now())
        print(f"✓ Cache SET - stored response for future use")
    
    def clear(self):
        """Clear all cached responses."""
        self.cache.clear()

class OllamaLLMService:
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'phi3:mini')
        self.cache_ttl = int(os.getenv('CACHE_TTL_SECONDS', '60'))
        self.cache = ResponseCache(ttl_seconds=self.cache_ttl)
        
        # Optimized settings for <350ms target
        self.temperature = 0.1
        self.num_predict = 50  # 2 sentences max
        self.top_k = 10
        
        print(f"✓ Ollama LLM service initialized: {self.model} (Local)")
        print(f"✓ Response cache enabled: {self.cache_ttl}s TTL")
    
    def format_rag_prompt(self, context: str, query: str) -> str:
        """Format prompt using phi3:mini native format for RAG."""
        system_message = "You are a medical triage assistant.\nUse ONLY the context provided. 2 sentences max. No preamble."
        user_message = f"Context: {context}\nQuestion: {query}"
        
        return f"<|system|>\n{system_message}<|end|>\n<|user|>\n{user_message}<|end|>\n<|assistant|>\n"
    
    def format_general_prompt(self, system_message: str, user_message: str) -> str:
        """Format general prompt using phi3:mini native format."""
        return f"<|system|>\n{system_message}<|end|>\n<|user|>\n{user_message}<|end|>\n<|assistant|>\n"
    
    async def generate(
        self,
        context: str,
        query: str,
        mode: Literal["emergency", "deep"] = "emergency"
    ) -> Dict:
        """
        Generate LLM response using local Ollama with caching.
        
        Target latency: <200ms for LLM inference
        """
        # Check cache first
        cached_response = self.cache.get(context, query, mode)
        if cached_response:
            return cached_response
        
        start_time = time.time()
        
        # Use optimized RAG prompt template
        prompt = self.format_rag_prompt(context, query)
        
        # Adjust num_predict based on mode
        num_predict = 50 if mode == "emergency" else 100
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                llm_start = time.time()
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": self.temperature,
                            "num_predict": num_predict,
                            "top_k": self.top_k,
                            "top_p": 0.9,
                            "repeat_penalty": 1.1
                        }
                    }
                )
                
                llm_latency_ms = round((time.time() - llm_start) * 1000, 2)
                
                if response.status_code != 200:
                    raise Exception(f"Ollama API error: {response.status_code}")
                
                result = response.json()
                answer = result.get("response", "").strip()
                
                # Log latency
                print(f"⚡ LLM inference: {llm_latency_ms}ms (mode: {mode})")
                
                response_data = {
                    "answer": answer,
                    "llm_latency_ms": llm_latency_ms
                }
                
                # Cache the response
                self.cache.set(context, query, mode, response_data)
                
                return response_data
        
        except Exception as e:
            print(f"❌ Ollama error: {str(e)}")
            # Fallback response
            return {
                "answer": "AI service temporarily unavailable. Please ensure Ollama is running on localhost:11434.",
                "llm_latency_ms": round((time.time() - start_time) * 1000, 2)
            }
    
    async def generate_naive(
        self,
        full_context: str,
        query: str
    ) -> Dict:
        """
        Naive approach: Send full patient history without retrieval optimization.
        No caching for naive approach (used for benchmarking).
        """
        start_time = time.time()
        
        system_message = "You are a clinical AI assistant. Analyze the patient history and answer the query."
        user_message = f"""Full Patient History:
{full_context}

Query: {query}

Provide your clinical assessment."""
        
        prompt = self.format_general_prompt(system_message, user_message)
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": self.temperature,
                            "num_predict": 200,
                            "top_k": self.top_k
                        }
                    }
                )
                
                result = response.json()
                llm_latency_ms = round((time.time() - start_time) * 1000, 2)
                
                print(f"⚡ LLM inference (naive): {llm_latency_ms}ms")
                
                return {
                    "answer": result.get("response", ""),
                    "llm_latency_ms": llm_latency_ms
                }
        
        except Exception as e:
            print(f"❌ Ollama error: {str(e)}")
            return {
                "answer": "AI service temporarily unavailable.",
                "llm_latency_ms": round((time.time() - start_time) * 1000, 2)
            }
    
    def clear_cache(self):
        """Clear response cache."""
        self.cache.clear()
        print("✓ Response cache cleared")

# Global instance (initialized in main.py)
ollama_service = None
