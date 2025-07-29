import requests
import json

# Test the Gemini API with the god key
print("Testing Gemini API with god key...")
data = {"prompt": "Hello world", "temperature": 0.7}
headers = {"X-API-Key": "cs_god_QAGecKrkKdLgrO9l9ifL_0wWsR0jZaOMCfGR_VJymIk"}
response = requests.post("http://localhost:5000/api/gemini/generate", json=data, headers=headers)
print(f"Gemini Generation Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

if response.status_code == 200:
    print("✅ Gemini API is working with your API key!")
else:
    print("❌ Gemini API still has issues") 