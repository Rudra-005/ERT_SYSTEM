import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint."""
    print("\n" + "="*60)
    print("🏥 Testing Health Endpoint")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Status: {data['status']}")
        print(f"✅ LLM Backend: {data['llm_backend']}")
        print(f"✅ Ollama Model: {data['ollama_model']}")
        print(f"✅ Chunk Size: {data['chunk_size']}")
        print(f"✅ Top K: {data['top_k']}")
    else:
        print(f"❌ Health check failed: {response.status_code}")

def test_optimized_query():
    """Test optimized RAG query with latency tracking."""
    print("\n" + "="*60)
    print("🚀 Testing Optimized RAG Query (Emergency Mode)")
    print("="*60)
    
    payload = {
        "patient_id": "patient_001",
        "query": "What are the patient's current medications?",
        "mode": "emergency"
    }
    
    # First request (no cache)
    print("\n📊 Request 1 (No Cache):")
    start = time.time()
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    request_time = (time.time() - start) * 1000
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ HTTP Status: {response.status_code}")
        print(f"✅ Answer: {data['answer'][:100]}...")
        print(f"\n⚡ Latency Breakdown:")
        print(f"   Retrieval:  {data['latency']['retrieval_ms']:>6.2f}ms")
        print(f"   LLM:        {data['latency']['llm_ms']:>6.2f}ms")
        print(f"   Total:      {data['latency']['total_ms']:>6.2f}ms")
        print(f"   HTTP:       {request_time:>6.2f}ms")
        
        if data['latency']['total_ms'] < 350:
            print(f"\n✅ TARGET MET: <350ms")
        else:
            print(f"\n⚠️  TARGET MISSED: {data['latency']['total_ms']:.0f}ms")
        
        print(f"\n📚 Chunks Retrieved: {len(data['cited_segments'])}")
        
        # Second request (should hit cache)
        print("\n📊 Request 2 (Cache Hit Expected):")
        time.sleep(1)  # Small delay
        start = time.time()
        response2 = requests.post(f"{BASE_URL}/chat", json=payload)
        request_time2 = (time.time() - start) * 1000
        
        if response2.status_code == 200:
            data2 = response2.json()
            print(f"✅ HTTP Status: {response2.status_code}")
            print(f"\n⚡ Latency Breakdown:")
            print(f"   Retrieval:  {data2['latency']['retrieval_ms']:>6.2f}ms")
            print(f"   LLM:        {data2['latency']['llm_ms']:>6.2f}ms (cached)")
            print(f"   Total:      {data2['latency']['total_ms']:>6.2f}ms")
            print(f"   HTTP:       {request_time2:>6.2f}ms")
            
            speedup = data['latency']['total_ms'] / data2['latency']['total_ms']
            print(f"\n🚀 Cache Speedup: {speedup:.2f}x faster")
    else:
        print(f"❌ Query failed: {response.status_code}")
        print(f"Error: {response.text}")

def test_deep_mode():
    """Test deep analysis mode."""
    print("\n" + "="*60)
    print("🔵 Testing Deep Analysis Mode")
    print("="*60)
    
    payload = {
        "patient_id": "patient_001",
        "query": "Provide comprehensive analysis of patient history",
        "mode": "deep"
    }
    
    start = time.time()
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    request_time = (time.time() - start) * 1000
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ HTTP Status: {response.status_code}")
        print(f"✅ Answer: {data['answer'][:150]}...")
        print(f"\n⚡ Latency Breakdown:")
        print(f"   Retrieval:  {data['latency']['retrieval_ms']:>6.2f}ms")
        print(f"   LLM:        {data['latency']['llm_ms']:>6.2f}ms")
        print(f"   Total:      {data['latency']['total_ms']:>6.2f}ms")
        print(f"   HTTP:       {request_time:>6.2f}ms")
    else:
        print(f"❌ Query failed: {response.status_code}")

def test_cache_clear():
    """Test cache clearing."""
    print("\n" + "="*60)
    print("🗑️  Testing Cache Clear")
    print("="*60)
    
    response = requests.post(f"{BASE_URL}/clear-cache")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['message']}")
    else:
        print(f"❌ Cache clear failed: {response.status_code}")

def run_all_tests():
    """Run complete test suite."""
    print("\n" + "="*60)
    print("OPTIMIZED RAG PIPELINE TEST SUITE")
    print("="*60)
    print("Target: <350ms total latency")
    print("Optimizations:")
    print("  - CHUNK_SIZE: 150 tokens")
    print("  - TOP_K: 2 chunks")
    print("  - LLM: Ollama phi3:mini (local)")
    print("  - Cache: 60s TTL")
    print("="*60)
    
    try:
        test_health()
        test_optimized_query()
        test_deep_mode()
        test_cache_clear()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to FastAPI backend")
        print("Make sure the server is running:")
        print("  cd fastapi-backend")
        print("  python -m uvicorn app.main:app --reload --port 8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    run_all_tests()
