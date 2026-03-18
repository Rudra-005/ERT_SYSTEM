from groq import AsyncGroq
import time
from typing import Dict, Literal

class GroqLLMService:
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"
        self.temperature = 0.2
        
        # Mode configurations
        self.modes = {
            "emergency": {
                "max_tokens": 150,
                "system_prompt": (
                    "You are an emergency clinical decision assistant. "
                    "Respond in under 120 words. "
                    "Provide only critical actionable recommendation. "
                    "Avoid hallucination. "
                    "Base reasoning strictly on provided medical context."
                )
            },
            "deep": {
                "max_tokens": 400,
                "system_prompt": (
                    "You are an intelligent document analysis assistant. "
                    "Answer the user's question directly and concisely using only information from the document. "
                    "Do NOT provide a full clinical assessment or summarize the document unless explicitly asked. "
                    "Always cite specific parts of the document when referencing information."
                )
            }
        }
        
        print(f"✓ Groq LLM service initialized: {self.model}")
    
    async def generate(
        self,
        context: str,
        query: str,
        mode: Literal["emergency", "deep"] = "emergency"
    ) -> Dict:
        """
        Generate LLM response based on mode.
        
        Args:
            context: Medical context from retrieved chunks
            query: User query
            mode: "emergency" or "deep"
        
        Returns:
            Dict with answer and llm_latency_ms
        """
        start_time = time.time()
        
        # Get mode configuration
        config = self.modes[mode]
        
        # Build user prompt
        user_prompt = f"""Medical Context:
{context}

Query: {query}

Please answer the query directly using only the provided context."""
        
        # Call Groq API
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": config["system_prompt"]},
                {"role": "user", "content": user_prompt}
            ],
            temperature=self.temperature,
            max_tokens=config["max_tokens"]
        )
        
        llm_latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "answer": response.choices[0].message.content,
            "llm_latency_ms": llm_latency_ms
        }
    
    async def generate_naive(
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
            Dict with answer and llm_latency_ms
        """
        start_time = time.time()
        
        user_prompt = f"""Full Patient History:
{full_context}

Query: {query}

Provide your clinical assessment."""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a clinical AI assistant. Analyze the patient history and answer the query."},
                {"role": "user", "content": user_prompt}
            ],
            temperature=self.temperature,
            max_tokens=400
        )
        
        llm_latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "answer": response.choices[0].message.content,
            "llm_latency_ms": llm_latency_ms
        }

# Global instance (initialized in main.py)
groq_service = None
