import requests
import json

# Configuration
BACKEND_URL = "https://newnewwebsite.onrender.com"  # Your deployed backend URL
ADMIN_KEY = "codedswitch_admin_2025"  # Your admin key

def create_god_key():
    """Create a God mode API key"""
    print("🔥 Creating God Mode Key...")
    
    try:
        print(f"Sending request to: {BACKEND_URL}/api/keys/god")
        print(f"Using admin key: {ADMIN_KEY}")
        
        response = requests.post(
            f"{BACKEND_URL}/api/keys/god",
            json={"adminKey": ADMIN_KEY},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status code: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Full response: {json.dumps(result, indent=2)}")
            
            god_key = result.get('god_key')
            if not god_key:
                print("❌ Error: No 'god_key' in response")
                return None
                
            print(f"✅ Success! God Mode Key: {god_key}")
            print(f"🔗 Test it: {BACKEND_URL}/api/keys/validate?key={god_key}")
            return god_key
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"🚨 Exception: {str(e)}")
        return None

if __name__ == "__main__":
    key = create_god_key()
    if not key:
        print("❌ Failed to create God Mode key")