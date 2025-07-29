import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

print("Testing environment variables...")
print(f"GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY', 'NOT SET')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
print(f"SECRET_KEY: {os.getenv('SECRET_KEY', 'NOT SET')}")

# Test if the key is valid (should be 39 characters)
gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key and len(gemini_key) > 30:
    print("✅ Gemini API key appears to be valid")
else:
    print("❌ Gemini API key is missing or invalid") 