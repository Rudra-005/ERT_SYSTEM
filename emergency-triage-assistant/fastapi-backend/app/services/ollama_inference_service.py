import httpx
import time
import os
from typing import Dict, Literal, Optional

class OllamaInferenceService:
    """
    Async Ollama inference service for FastAPI backend.
    Uses httpx for non-blocking HTTP calls.
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "phi3:mini")
        self.generate_url = f"{self.base_url}/api/generate"
        self.tags_url = f"{self.base_url}/api/tags"
        
        # Standard inference parameters
        self.inference_params = {
            "temperature": 0.1,
            "num_predict": 150,
            "top_k": 10,
            "top_p": 0.5
        }
        
        print(f"✓ Ollama Inference Service initialized: {self.model} at {self.base_url}")
    
    def _build_phi3_prompt(self, system_prompt: str, user_prompt: str) -> str:
        """
        Build phi3:mini native chat template format.
        
        Args:
            system_prompt: System instructions
            user_prompt: User query
            
        Returns:
            Formatted prompt with phi3 tags
        """
        return f"""<|system|>
{system_prompt}
<|end|>

<|user|>
{user_prompt}
<|end|>

<|assistant|>"""
    
    async def health_check(self) -> Dict:
        """
        Verify Ollama is reachable and model is loaded.
        
        Returns:
            Dict with healthy (bool), message (str), model (str)
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.tags_url)
                
                if response.status_code != 200:
                    return {
                        "healthy": False,
                        "message": f"Ollama returned status {response.status_code}",
                        "model": self.model
                    }
                
                data = response.json()
                
                if "models" not in data:
                    return {
                        "healthy": False,
                        "message": "Ollama responded but no models found",
                        "model": self.model
                    }
                
                # Check if our model exists
                model_exists = any(self.model in m.get("name", "") for m in data["models"])
                
                if not model_exists:
                    available = [m.get("name") for m in data["models"]]
                    return {
                        "healthy": False,
                        "message": f"Model {self.model} not found. Available: {', '.join(available)}",
                        "model": self.model
                    }
                
                return {
                    "healthy": True,
                    "message": f"Ollama ready with {self.model}",
                    "model": self.model
                }
                
        except httpx.ConnectError:
            return {
                "healthy": False,
                "message": f"Ollama unreachable at {self.base_url}. Is Ollama running?",
                "model": self.model
            }
        except Exception as e:
            return {
                "healthy": False,
                "message": f"Health check failed: {str(e)}",
                "model": self.model
            }
    
    async def generate_rag_response(
        self,
        context: str,
        query: str,
        mode: Literal["emergency", "deep"] = "emergency"
    ) -> Dict:
        """
        Generate RAG response based on retrieved context.
        
        Args:
            context: Retrieved medical context from vector search
            query: User query
            mode: "emergency" (fast, <150 tokens) or "deep" (detailed, <150 tokens)
            
        Returns:
            Dict with answer, llm_latency_ms, and optional error
        """
        start_time = time.time()
        
        try:
            # Mode-specific system prompts
            if mode == "emergency":
                system_prompt = """You are an emergency clinical decision assistant.
Respond in under 120 words.
Provide only critical actionable recommendation.
Avoid hallucination.
Base reasoning strictly on provided medical context."""
            else:  # deep mode
                system_prompt = """You are an intelligent document analysis assistant.
Answer the user's question directly and concisely using only information from the document.
Do NOT provide a full clinical assessment or summarize the document unless explicitly asked.
Always cite specific parts of the document when referencing information."""
            
            user_prompt = f"""Medical Context:
{context}

Query: {query}

Please answer the query directly using only the provided context."""
            
            prompt = self._build_phi3_prompt(system_prompt, user_prompt)
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.generate_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": self.inference_params
                    }
                )
                
                llm_latency_ms = round((time.time() - start_time) * 1000, 2)
                
                if response.status_code != 200:
                    return {
                        "answer": "Unable to generate response. Ollama returned an error.",
                        "llm_latency_ms": llm_latency_ms,
                        "error": f"HTTP {response.status_code}"
                    }
                
                data = response.json()
                
                if "response" not in data:
                    return {
                        "answer": "Unable to generate response. Ollama returned malformed data.",
                        "llm_latency_ms": llm_latency_ms,
                        "error": "MALFORMED_RESPONSE"
                    }
                
                return {
                    "answer": data["response"].strip(),
                    "llm_latency_ms": llm_latency_ms
                }
                
        except httpx.ConnectError:
            llm_latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": "AI service is currently unavailable. Ollama is not reachable. Please ensure Ollama is running.",
                "llm_latency_ms": llm_latency_ms,
                "error": "OLLAMA_UNREACHABLE"
            }
        except httpx.TimeoutException:
            llm_latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": "Request timed out. The AI model took too long to respond.",
                "llm_latency_ms": llm_latency_ms,
                "error": "TIMEOUT"
            }
        except Exception as e:
            llm_latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": f"An unexpected error occurred: {str(e)}",
                "llm_latency_ms": llm_latency_ms,
                "error": "INFERENCE_FAILED"
            }
    
    async def generate_naive_response(
        self,
        full_context: str,
        query: str
    ) -> Dict:
        """
        Naive approach: Send full patient history without retrieval optimization.
        Used for comparison benchmarking.
        
        Args:
            full_context: Complete unfiltered patient history
            query: User query
            
        Returns:
            Dict with answer, llm_latency_ms, and optional error
        """
        start_time = time.time()
        
        try:
            system_prompt = "You are a clinical AI assistant. Analyze the patient history and answer the query."
            
            user_prompt = f"""Full Patient History:
{full_context}

Query: {query}

Provide your clinical assessment."""
            
            prompt = self._build_phi3_prompt(system_prompt, user_prompt)
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    self.generate_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": self.inference_params
                    }
                )
                
                llm_latency_ms = round((time.time() - start_time) * 1000, 2)
                
                if response.status_code != 200:
                    return {
                        "answer": "Unable to generate response.",
                        "llm_latency_ms": llm_latency_ms,
                        "error": f"HTTP {response.status_code}"
                    }
                
                data = response.json()
                
                if "response" not in data:
                    return {
                        "answer": "Malformed response from Ollama.",
                        "llm_latency_ms": llm_latency_ms,
                        "error": "MALFORMED_RESPONSE"
                    }
                
                return {
                    "answer": data["response"].strip(),
                    "llm_latency_ms": llm_latency_ms
                }
                
        except httpx.ConnectError:
            llm_latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": "Ollama service unreachable.",
                "llm_latency_ms": llm_latency_ms,
                "error": "OLLAMA_UNREACHABLE"
            }
        except Exception as e:
            llm_latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": f"Error: {str(e)}",
                "llm_latency_ms": llm_latency_ms,
                "error": "INFERENCE_FAILED"
            }

# Global instance (initialized in main.py)
ollama_service: Optional[OllamaInferenceService] = None
