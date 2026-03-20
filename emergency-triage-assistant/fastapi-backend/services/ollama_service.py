import httpx
import asyncio
import time
from .cache import global_cache

# Hardcoded strict constraints
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "phi3:mini"

STRICT_OLLAMA_PARAMS = {
    "num_predict": 80,
    "temperature": 0.1,
    "top_k": 10,
    "top_p": 0.5,
    "repeat_penalty": 1.1,
    "stream": False
}

def enforcePromptLimit(prompt: str) -> str:
    """Limits prompt to exactly 300 tokens (approx 1200 chars)."""
    MAX_CHARS = 1200
    if len(prompt) <= MAX_CHARS:
        return prompt
        
    half = int((MAX_CHARS // 2) - 20)
    return prompt[:half] + "\n...[TRUNCATED_FOR_SPEED]...\n" + prompt[-half:]

async def warm_up_ollama():
    """Wakes up Ollama on boot to avoid 2-10 second cold start penalty."""
    print("Initiating strict Ollama model warm-up sequence...")
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": "ready",
                    "stream": False,
                    "options": {"num_predict": 1}
                },
                timeout=15.0
            )
            print("\033[92mOllama model warm and ready\033[0m")
            return True
        except Exception as e:
            print(f"Failed to warm up Ollama: {e}")
            raise e

async def start_keep_alive_ping():
    """Fires every 4 minutes to ensure Ollama never maps out of GPU/RAM."""
    async with httpx.AsyncClient() as client:
        while True:
            await asyncio.sleep(240) # 4 minutes
            try:
                await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": "ping",
                        "stream": False,
                        "options": {"num_predict": 1}
                    },
                    timeout=5.0
                )
            except Exception as e:
                print(f"Ollama keep-alive ping failed: {e}")

async def generate_response(prompt: str, patient_id: str = "unknown") -> dict:
    start_time = time.time()
    
    # 1. Strict Limiting
    strictly_limited_prompt = enforcePromptLimit(prompt)
    
    # 2. Cache Check
    cache_key = f"{strictly_limited_prompt.lower().strip()}_{patient_id}"
    cached_hit = global_cache.get(cache_key)
    
    if cached_hit:
        return {
            "response": cached_hit,
            "latency": int((time.time() - start_time) * 1000),
            "source": "cache"
        }

    # 3. Axios strictly timed out call inside asyncio wait_for
    async def make_call():
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": strictly_limited_prompt,
                    "stream": STRICT_OLLAMA_PARAMS["stream"],
                    "options": {
                        "num_predict": STRICT_OLLAMA_PARAMS["num_predict"],
                        "temperature": STRICT_OLLAMA_PARAMS["temperature"],
                        "top_k": STRICT_OLLAMA_PARAMS["top_k"],
                        "top_p": STRICT_OLLAMA_PARAMS["top_p"],
                        "repeat_penalty": STRICT_OLLAMA_PARAMS["repeat_penalty"]
                    }
                },
                timeout=0.3 # HARD 300ms HTTP connection timeout
            )
            return res.json()["response"]

    try:
        # Race against 300ms max async execution barrier
        final_response = await asyncio.wait_for(make_call(), timeout=0.3)
        global_cache.set(cache_key, final_response)
        source = "ollama"
    except (asyncio.TimeoutError, httpx.TimeoutException, Exception):
        # Guaranteed clinical fallback message within 300ms if failed
        final_response = "AI analysis timed out. Please use manual triage protocol."
        source = "timeout_fallback"

    return {
        "response": final_response,
        "latency": int((time.time() - start_time) * 1000),
        "source": source
    }
