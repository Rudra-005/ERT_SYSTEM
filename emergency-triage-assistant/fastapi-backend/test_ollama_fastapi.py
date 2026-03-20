"""
Test script for FastAPI Ollama Inference Service

Tests:
1. Health check
2. RAG response generation (emergency mode)
3. RAG response generation (deep mode)
4. Naive response generation

Run: python test_ollama_fastapi.py
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from services.ollama_inference_service import OllamaInferenceService

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

async def run_tests():
    print(f"{Colors.BOLD}{Colors.CYAN}=== Ollama FastAPI Service Test ==={Colors.RESET}\n")
    
    # Initialize service
    service = OllamaInferenceService()
    print(f"Base URL: {service.base_url}")
    print(f"Model: {service.model}\n")
    
    # Test 1: Health Check
    print(f"{Colors.BOLD}Test 1: Health Check{Colors.RESET}")
    try:
        health = await service.health_check()
        if health["healthy"]:
            print(f"{Colors.GREEN}✓ PASS{Colors.RESET} - {health['message']}")
        else:
            print(f"{Colors.RED}✗ FAIL{Colors.RESET} - {health['message']}")
            print(f"{Colors.YELLOW}⚠ Remaining tests may fail if Ollama is not running{Colors.RESET}\n")
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {str(e)}")
    print()
    
    # Test 2: Emergency Mode RAG Response
    print(f"{Colors.BOLD}Test 2: RAG Response (Emergency Mode){Colors.RESET}")
    context = """Patient: John Doe, Age 45, Male
Chief Complaint: Chest pain
Vitals: BP 160/100, Pulse 110, Temp 98.6°F, SpO2 94%
History: Hypertension, smoker
Current Medications: Lisinopril 10mg daily
Allergies: Penicillin"""
    
    query = "What is the triage severity and immediate actions needed?"
    
    print(f"Query: {query}")
    
    try:
        result = await service.generate_rag_response(context, query, mode="emergency")
        
        if "error" in result:
            print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {result['error']}")
            print(f"Message: {result['answer']}")
        else:
            print(f"{Colors.GREEN}✓ PASS{Colors.RESET}")
            print(f"Answer: {result['answer'][:200]}...")
        
        print(f"{Colors.CYAN}Response Time: {result['llm_latency_ms']}ms{Colors.RESET}")
        
        if result['llm_latency_ms'] < 400:
            print(f"{Colors.GREEN}✓ Under 400ms target{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠ Exceeded 400ms target{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {str(e)}")
    print()
    
    # Test 3: Deep Mode RAG Response
    print(f"{Colors.BOLD}Test 3: RAG Response (Deep Mode){Colors.RESET}")
    context = """Medical Record - Patient ID: P12345
Date: 2024-01-15
Diagnosis: Type 2 Diabetes Mellitus
Treatment Plan:
- Metformin 500mg twice daily
- Diet modification: Low carb, high fiber
- Exercise: 30 minutes daily walking
- Blood glucose monitoring: Fasting and post-meal
Follow-up: 3 months
Lab Results: HbA1c 7.2%, Fasting glucose 145 mg/dL"""
    
    query = "What medications were prescribed and what is the follow-up schedule?"
    
    print(f"Query: {query}")
    
    try:
        result = await service.generate_rag_response(context, query, mode="deep")
        
        if "error" in result:
            print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {result['error']}")
        else:
            print(f"{Colors.GREEN}✓ PASS{Colors.RESET}")
            print(f"Answer: {result['answer']}")
        
        print(f"{Colors.CYAN}Response Time: {result['llm_latency_ms']}ms{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {str(e)}")
    print()
    
    # Test 4: Naive Response
    print(f"{Colors.BOLD}Test 4: Naive Response (Full Context){Colors.RESET}")
    full_context = """Complete Patient History:
Patient: Jane Smith, 62F
Chief Complaint: Persistent cough for 2 weeks
Medical History: COPD, former smoker (quit 5 years ago)
Current Medications: Albuterol inhaler PRN, Spiriva daily
Vitals: BP 130/85, Pulse 88, Temp 99.1°F, SpO2 92% on room air
Physical Exam: Wheezing bilaterally, prolonged expiration
Recent Labs: WBC 11,000, CXR shows hyperinflation
Assessment: COPD exacerbation"""
    
    query = "What is the likely diagnosis and treatment approach?"
    
    print(f"Query: {query}")
    
    try:
        result = await service.generate_naive_response(full_context, query)
        
        if "error" in result:
            print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {result['error']}")
        else:
            print(f"{Colors.GREEN}✓ PASS{Colors.RESET}")
            print(f"Answer: {result['answer'][:200]}...")
        
        print(f"{Colors.CYAN}Response Time: {result['llm_latency_ms']}ms{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR{Colors.RESET} - {str(e)}")
    print()
    
    print(f"{Colors.BOLD}{Colors.CYAN}=== Test Complete ==={Colors.RESET}")

if __name__ == "__main__":
    try:
        asyncio.run(run_tests())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}Fatal error: {str(e)}{Colors.RESET}")
        sys.exit(1)
