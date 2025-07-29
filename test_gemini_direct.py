import sys
import os
sys.path.append('backend')

from gemini_service import GeminiService

print("Testing Gemini service directly...")

try:
    # Initialize Gemini service
    gemini = GeminiService()
    print("✅ Gemini service initialized successfully")
    
    # Test text generation
    result = gemini.generate_text("Hello world", temperature=0.7)
    print(f"Generation result: {result}")
    
    if result.get('success'):
        print("✅ Gemini API is working with your key!")
        print(f"Generated text: {result.get('text', '')[:100]}...")
    else:
        print("❌ Gemini API failed:")
        print(f"Error: {result.get('error', 'Unknown error')}")
        
except Exception as e:
    print(f"❌ Error initializing Gemini service: {e}") 