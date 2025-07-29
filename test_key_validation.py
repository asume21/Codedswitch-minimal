import sys
import os
sys.path.append('backend')

from api_keys import api_key_manager

# Test if the god key exists
god_key = "cs_god_QAGecKrkKdLgrO9l9ifL_0wWsR0jZaOMCfGR_VJymIk"

print("Testing API key validation...")
print(f"God key: {god_key}")

# Check if key exists
is_valid, key_info = api_key_manager.validate_key(god_key)
print(f"Key valid: {is_valid}")
print(f"Key info: {key_info}")

# Check usage limits
can_use, usage_info = api_key_manager.check_usage_limit(god_key, "gemini_text")
print(f"Can use gemini_text: {can_use}")
print(f"Usage info: {usage_info}")

# List all keys
print(f"All keys: {list(api_key_manager.keys['keys'].keys())}") 