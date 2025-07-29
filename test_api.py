import requests
import json

# Test the health endpoint
print("Testing health endpoint...")
response = requests.get("http://localhost:5000/api/health")
print(f"Health Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test the music generation endpoint
print("Testing music generation endpoint...")
data = {"prompt": "electronic dance music", "duration": 10}
response = requests.post("http://localhost:5000/api/generate-music", json=data)
print(f"Music Generation Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test the Gemini text generation endpoint (without API key for now)
print("Testing Gemini text generation endpoint...")
data = {"prompt": "Hello world", "temperature": 0.7}
response = requests.post("http://localhost:5000/api/gemini/generate", json=data)
print(f"Gemini Generation Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

print("API testing complete!") 