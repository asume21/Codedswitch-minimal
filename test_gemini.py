import requests
import json

# Test the Gemini API with the new key
print("Testing Gemini API with your key...")
data = {"prompt": "Hello world", "temperature": 0.7}
response = requests.post("http://localhost:5000/api/gemini/generate", json=data)
print(f"Gemini Generation Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

if response.status_code == 200:
    print("✅ Gemini API is working!")
else:
    print("❌ Gemini API needs API key configuration") 