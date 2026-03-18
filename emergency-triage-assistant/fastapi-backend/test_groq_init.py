import asyncio
from app.config import get_settings
from app.services.groq_llm_service import GroqLLMService

async def main():
    try:
        settings = get_settings()
        print("API Key parsed length:", len(settings.groq_api_key))
        
        service = GroqLLMService(api_key=settings.groq_api_key)
        print("Service initialized!")
        
        res = await service.generate("Patient has a headache.", "What to do?", "emergency")
        print("Response:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
