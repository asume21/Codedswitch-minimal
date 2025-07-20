import os
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

class APIKeyManager:
    """Production-ready API key management system"""
    
    def __init__(self):
        self.keys_file = 'api_keys.json'
        self.load_keys()
    
    def load_keys(self):
        """Load API keys from file or create default structure"""
        try:
            with open(self.keys_file, 'r') as f:
                self.keys = json.load(f)
        except FileNotFoundError:
            # Initialize with default structure
            self.keys = {
                "keys": {},
                "usage": {},
                "plans": {
                    "free": {
                        "lyric_generations": 5,
                        "music_generations": 2,
                        "code_translations": 10,
                        "vulnerability_scans": 3,
                        "codebeat_generations": 2,
                        "reset_period_days": 30
                    },
                    "pro": {
                        "lyric_generations": 100,
                        "music_generations": 25,
                        "code_translations": 500,
                        "vulnerability_scans": 50,
                        "codebeat_generations": 25,
                        "reset_period_days": 30
                    },
                    "premium": {
                        "lyric_generations": -1,  # -1 = unlimited
                        "music_generations": -1,
                        "code_translations": -1,
                        "vulnerability_scans": -1,
                        "codebeat_generations": -1,
                        "reset_period_days": 30
                    },
                    "god": {
                        "lyric_generations": -1,
                        "music_generations": -1,
                        "code_translations": -1,
                        "vulnerability_scans": -1,
                        "codebeat_generations": -1,
                        "reset_period_days": -1,  # Never resets
                        "admin_access": True,
                        "bypass_all_limits": True
                    }
                }
            }
            self.save_keys()
    
    def save_keys(self):
        """Save keys to file"""
        with open(self.keys_file, 'w') as f:
            json.dump(self.keys, f, indent=2, default=str)
    
    def generate_key(self, plan: str = "free", user_id: str = None, description: str = "") -> str:
        """Generate a new API key"""
        # Generate secure random key
        key = f"cs_{plan}_{secrets.token_urlsafe(32)}"
        
        # Store key info
        self.keys["keys"][key] = {
            "plan": plan,
            "user_id": user_id or f"user_{len(self.keys['keys'])}",
            "description": description,
            "created_at": datetime.now().isoformat(),
            "active": True,
            "last_used": None
        }
        
        # Initialize usage tracking
        self.keys["usage"][key] = {
            "lyric_generations": 0,
            "music_generations": 0,
            "code_translations": 0,
            "vulnerability_scans": 0,
            "codebeat_generations": 0,
            "last_reset": datetime.now().isoformat()
        }
        
        self.save_keys()
        return key
    
    def validate_key(self, api_key: str) -> Tuple[bool, Optional[Dict]]:
        """Validate API key and return key info"""
        if not api_key or api_key not in self.keys["keys"]:
            return False, None
        
        key_info = self.keys["keys"][api_key]
        
        # Check if key is active
        if not key_info.get("active", True):
            return False, None
        
        # Update last used
        key_info["last_used"] = datetime.now().isoformat()
        self.save_keys()
        
        return True, key_info
    
    def check_usage_limit(self, api_key: str, feature: str) -> Tuple[bool, Dict]:
        """Check if user can use a feature based on their plan limits"""
        is_valid, key_info = self.validate_key(api_key)
        
        if not is_valid:
            return False, {"error": "Invalid API key"}
        
        plan = key_info["plan"]
        plan_limits = self.keys["plans"].get(plan, self.keys["plans"]["free"])
        
        # God mode bypasses everything
        if plan_limits.get("bypass_all_limits", False):
            return True, {"status": "god_mode", "unlimited": True}
        
        # Check if feature limit is unlimited
        feature_limit = plan_limits.get(feature, 0)
        if feature_limit == -1:
            return True, {"status": "unlimited", "plan": plan}
        
        # Check current usage
        usage = self.keys["usage"].get(api_key, {})
        current_usage = usage.get(feature, 0)
        
        # Check if usage period needs reset
        self._check_usage_reset(api_key, plan_limits)
        
        if current_usage >= feature_limit:
            return False, {
                "error": "Usage limit exceeded",
                "current_usage": current_usage,
                "limit": feature_limit,
                "plan": plan
            }
        
        return True, {
            "status": "allowed",
            "current_usage": current_usage,
            "limit": feature_limit,
            "plan": plan
        }
    
    def increment_usage(self, api_key: str, feature: str):
        """Increment usage counter for a feature"""
        if api_key not in self.keys["usage"]:
            self.keys["usage"][api_key] = {}
        
        self.keys["usage"][api_key][feature] = self.keys["usage"][api_key].get(feature, 0) + 1
        self.save_keys()
    
    def _check_usage_reset(self, api_key: str, plan_limits: Dict):
        """Check if usage should be reset based on plan period"""
        reset_period_days = plan_limits.get("reset_period_days", 30)
        
        if reset_period_days == -1:  # Never reset (God mode)
            return
        
        usage = self.keys["usage"].get(api_key, {})
        last_reset = usage.get("last_reset")
        
        if not last_reset:
            return
        
        last_reset_date = datetime.fromisoformat(last_reset)
        if datetime.now() - last_reset_date > timedelta(days=reset_period_days):
            # Reset usage
            self.keys["usage"][api_key] = {
                "lyric_generations": 0,
                "music_generations": 0,
                "code_translations": 0,
                "vulnerability_scans": 0,
                "codebeat_generations": 0,
                "last_reset": datetime.now().isoformat()
            }
            self.save_keys()
    
    def get_user_stats(self, api_key: str) -> Dict:
        """Get comprehensive user statistics"""
        is_valid, key_info = self.validate_key(api_key)
        
        if not is_valid:
            return {"error": "Invalid API key"}
        
        plan = key_info["plan"]
        plan_limits = self.keys["plans"][plan]
        usage = self.keys["usage"].get(api_key, {})
        
        stats = {
            "api_key": api_key[:10] + "...",  # Masked for security
            "plan": plan,
            "user_id": key_info["user_id"],
            "created_at": key_info["created_at"],
            "last_used": key_info["last_used"],
            "usage": {},
            "limits": {}
        }
        
        # Add usage and limits for each feature
        features = ["lyric_generations", "music_generations", "code_translations", 
                   "vulnerability_scans", "codebeat_generations"]
        
        for feature in features:
            stats["usage"][feature] = usage.get(feature, 0)
            limit = plan_limits.get(feature, 0)
            stats["limits"][feature] = "unlimited" if limit == -1 else limit
        
        return stats
    
    def deactivate_key(self, api_key: str) -> bool:
        """Deactivate an API key"""
        if api_key in self.keys["keys"]:
            self.keys["keys"][api_key]["active"] = False
            self.save_keys()
            return True
        return False
    
    def upgrade_plan(self, api_key: str, new_plan: str) -> bool:
        """Upgrade user's plan"""
        if api_key in self.keys["keys"] and new_plan in self.keys["plans"]:
            self.keys["keys"][api_key]["plan"] = new_plan
            self.save_keys()
            return True
        return False

# Global instance
api_key_manager = APIKeyManager()

def create_god_key() -> str:
    """Create the ultimate God mode key"""
    god_key = api_key_manager.generate_key(
        plan="god",
        user_id="creator",
        description="God mode key - unlimited everything"
    )
    return god_key

# Authentication decorator
def require_api_key(feature: str):
    """Decorator to require API key for endpoints"""
    def decorator(f):
        from functools import wraps
        from flask import request, jsonify
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get API key from header or request body
            api_key = request.headers.get('X-API-Key') or request.json.get('apiKey') if request.json else None
            
            if not api_key:
                return jsonify({"error": "API key required"}), 401
            
            # Check usage limits
            can_use, usage_info = api_key_manager.check_usage_limit(api_key, feature)
            
            if not can_use:
                return jsonify(usage_info), 429  # Too Many Requests
            
            # Increment usage (unless unlimited)
            if usage_info.get("status") != "unlimited" and not usage_info.get("unlimited"):
                api_key_manager.increment_usage(api_key, feature)
            
            # Add usage info to request context
            request.api_key = api_key
            request.usage_info = usage_info
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
