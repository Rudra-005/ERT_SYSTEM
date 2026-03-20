"""
Ollama Service with 350ms timeout and fallback
Enforces phi3:mini native prompt format and strict parameters
"""
import httpx
import time
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_TIMEOUT = 0.35  # 350ms hard timeout

# Fallback responses
FALLBACK_TRIAGE = "Unable to complete AI analysis within the required time. Please assess the patient manually using the displayed vital thresholds."
FALLBACK_RAG = "Unable to retrieve information within the required time. Please consult medical records manually."

class OllamaService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=OLLAMA_TIMEOUT)
        self.model = "phi3:mini"
    
    async def generate(
        self, 
        system_prompt: str, 
        user_prompt: str,
        fallback_type: str = "triage"
    ) -> Dict[str, Any]:
        """
        Generate response with strict 350ms timeout
        Uses phi3:mini native format: <|system|>...<|end|><|user|>...<|end|><|assistant|>
        """
        start_time = time.perf_counter()
        
        # Build phi3:mini native format prompt
        formatted_prompt = (
            f"<|system|>\n{system_prompt}<|end|>\n"
            f"<|user|>\n{user_prompt}<|end|>\n"
            f"<|assistant|>"
        )
        
        payload = {
            "model": self.model,
            "prompt": formatted_prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 120,
                "top_k": 10,
                "top_p": 0.5,
                "repeat_penalty": 1.1
            }
        }
        
        try:
            response = await self.client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload
            )
            
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "response": result.get("response", "").strip(),
                    "latency_ms": elapsed_ms,
                    "fallback_used": False
                }
            else:
                logger.error(f"Ollama returned status {response.status_code}")
                return self._get_fallback(fallback_type, elapsed_ms)
                
        except httpx.TimeoutException:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            logger.warning(f"Ollama timeout after {elapsed_ms:.2f}ms")
            return self._get_fallback(fallback_type, elapsed_ms)
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Ollama error: {str(e)}")
            return self._get_fallback(fallback_type, elapsed_ms)
    
    def _get_fallback(self, fallback_type: str, elapsed_ms: float) -> Dict[str, Any]:
        """Return appropriate fallback response"""
        fallback_text = FALLBACK_TRIAGE if fallback_type == "triage" else FALLBACK_RAG
        return {
            "response": fallback_text,
            "latency_ms": elapsed_ms,
            "fallback_used": True
        }
    
    async def warmup(self) -> float:
        """
        Warmup request to ensure model is loaded
        Returns response time in milliseconds
        """
        logger.info("Running Ollama warmup...")
        start_time = time.perf_counter()
        
        try:
            result = await self.generate(
                system_prompt="You are a test assistant.",
                user_prompt="Respond with OK.",
                fallback_type="triage"
            )
            warmup_time = result["latency_ms"]
            
            if warmup_time > 350:
                logger.warning(
                    f"\n⚠️  WARNING: Ollama warmup took {warmup_time:.2f}ms (>350ms)\n"
                    f"System may not meet 400ms latency requirement.\n"
                    f"Recommendation: Run 'ollama run phi3:mini' manually to load model into memory.\n"
                )
            else:
                logger.info(f"✓ Ollama warmup completed in {warmup_time:.2f}ms")
            
            return warmup_time
        except Exception as e:
            logger.error(f"Warmup failed: {str(e)}")
            return 999.0
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Singleton instance
ollama_service = OllamaService()
