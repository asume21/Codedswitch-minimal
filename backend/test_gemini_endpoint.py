import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test the Gemini API directly
print("Testing Gemini API directly...")
gemini_key = os.getenv('GEMINI_API_KEY')
print(f"Gemini API Key: {gemini_key[:20]}..." if gemini_key else "NOT SET")

if gemini_key:
    # Test with Google's Gemini API directly
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": gemini_key
    }
    data = {
        "contents": [{
            "parts": [{
                "text": "Hello world"
            }]
        }]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Direct API Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Gemini API key is working!")
            print(f"Response: {result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No text')}")
        else:
            print(f"❌ Gemini API failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
else:
    print("❌ Gemini API key not found in environment variables") 