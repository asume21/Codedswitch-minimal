#!/usr/bin/env python3
"""
Test script to create and test your God Mode API key
Run this to get your ultimate power key!
"""

import requests
import json

# Configuration
BACKEND_URL = "http://localhost:5000"  # Change to your backend URL
ADMIN_KEY = "codedswitch_admin_2025"   # Your admin key

def create_god_key():
    """Create a God mode API key"""
    print("🔥 Creating God Mode Key...")
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/keys/god", 
            json={"adminKey": ADMIN_KEY},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n🎉 SUCCESS! God Key Created:")
            print(f"Key: {data['god_key']}")
            print(f"Plan: {data['plan']}")
            print(f"Message: {data['message']}")
            print("\n🚀 Powers:")
            for power in data['powers']:
                print(f"  • {power}")
            
            return data['god_key']
        else:
            print(f"❌ Failed: {response.json().get('error', 'Unknown error')}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_god_key(god_key):
    """Test the God key with various endpoints"""
    print(f"\n🧪 Testing God Key: {god_key[:20]}...")
    
    # Test lyric generation
    print("\n1. Testing Lyric Generation...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/generate",
            json={
                "prompt": "Test lyrics about coding",
                "apiKey": god_key
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Lyric generation: PASSED")
        else:
            print(f"❌ Lyric generation: FAILED - {response.status_code}")
    except Exception as e:
        print(f"❌ Lyric generation: ERROR - {e}")
    
    # Test key validation
    print("\n2. Testing Key Validation...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/keys/validate",
            json={"apiKey": god_key},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Key validation: PASSED - Plan: {data.get('plan')}")
        else:
            print(f"❌ Key validation: FAILED - {response.status_code}")
    except Exception as e:
        print(f"❌ Key validation: ERROR - {e}")
    
    # Test key stats
    print("\n3. Testing Key Statistics...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/keys/stats/{god_key}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Key stats: PASSED")
            print(f"  Plan: {data.get('plan')}")
            print(f"  User ID: {data.get('user_id')}")
            print("  Limits:")
            for feature, limit in data.get('limits', {}).items():
                print(f"    {feature}: {limit}")
        else:
            print(f"❌ Key stats: FAILED - {response.status_code}")
    except Exception as e:
        print(f"❌ Key stats: ERROR - {e}")

def main():
    print("🔥🔥🔥 CODEDSWITCH GOD MODE KEY CREATOR 🔥🔥🔥")
    print("=" * 50)
    
    # Create God key
    god_key = create_god_key()
    
    if god_key:
        # Test the key
        test_god_key(god_key)
        
        print("\n" + "=" * 50)
        print("🎯 YOUR GOD KEY IS READY!")
        print("=" * 50)
        print(f"Key: {god_key}")
        print("\n📋 How to use:")
        print("1. Add to API requests as 'apiKey' in JSON body")
        print("2. Or add as 'X-API-Key' header")
        print("3. Enjoy unlimited everything! 🚀")
        print("\n💾 Save this key somewhere safe!")
    else:
        print("\n❌ Failed to create God key. Check your backend is running!")

if __name__ == "__main__":
    main()
