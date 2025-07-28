#!/usr/bin/env python3
"""
Environment variable validation script for CodedSwitch.
Ensures all required environment variables are set before starting the application.
"""
import os
import sys
from dotenv import load_dotenv

def validate_environment():
    """Validate that all required environment variables are set."""
    # Required variables for both dev and prod
    required_vars = {
        'SECRET_KEY': 'Secret key for session management',
        'DATABASE_URL': 'Database connection URL',
        'REDIS_URL': 'Redis connection URL',
        'VITE_BACKEND_URL': 'Frontend backend URL',
    }
    
    # Production-specific required variables
    if os.getenv('FLASK_ENV') == 'production':
        required_vars.update({
            'MAIL_SERVER': 'Mail server for sending emails',
            'MAIL_USERNAME': 'Email username',
            'MAIL_PASSWORD': 'Email password',
        })
    
    missing_vars = []
    for var, description in required_vars.items():
        if not os.getenv(var):
            missing_vars.append((var, description))
    
    if missing_vars:
        print("Error: The following required environment variables are not set:")
        for var, description in missing_vars:
            print(f"- {var}: {description}")
        print("\nPlease update your .env file and try again.")
        print("Refer to .env.example for required configuration.")
        return False
    
    return True

def check_redis_connection():
    """Check if Redis is accessible."""
    try:
        import redis
        r = redis.from_url(os.getenv('REDIS_URL'))
        r.ping()
        return True, "Redis connection successful"
    except Exception as e:
        return False, f"Redis connection failed: {str(e)}"

def check_database_connection():
    """Check if the database is accessible."""
    try:
        from sqlalchemy import create_engine
        engine = create_engine(os.getenv('DATABASE_URL'))
        conn = engine.connect()
        conn.close()
        return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

if __name__ == "__main__":
    # Load environment variables from .env file if it exists
    load_dotenv()
    
    print("🔍 Validating environment configuration...")
    
    if not validate_environment():
        sys.exit(1)
    
    # Run connection checks
    print("\n🔌 Testing connections...")
    
    # Check Redis
    redis_success, redis_msg = check_redis_connection()
    print(f"  - Redis: {'✅' if redis_success else '❌'} {redis_msg}")
    
    # Check Database
    db_success, db_msg = check_database_connection()
    print(f"  - Database: {'✅' if db_success else '❌'} {db_msg}")
    
    if not (redis_success and db_success):
        print("\n❌ Some services are not available. Please check your configuration.")
        sys.exit(1)
    
    print("\n✅ All checks passed! Environment is properly configured.")
    print("   You can now start the application.")
