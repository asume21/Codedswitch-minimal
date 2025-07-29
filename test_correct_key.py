import os
import requests
import json

# Test with the correct key you provided
correct_key = "AIzaSyDqfUf2NWRNLlUpI4HogKT3uTjD3AXM348"
print(f"Testing with correct key: {correct_key[:20]}...")

# Test with Google's Gemini API directly
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": correct_key
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
    print(f"API Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("✅ Your Gemini API key is working!")
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No text')
        print(f"Generated text: {text}")
    else:
        print(f"❌ API failed: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}") 