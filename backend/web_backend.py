import os
import time
import logging
import uuid
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS, cross_origin
from flask_mail import Mail, Message
from models import db, EmailSignup
import json
from datetime import datetime, timedelta
from api_keys import api_key_manager, require_api_key, create_god_key
import stripe
from dotenv import load_dotenv
# Import Gemini service only if the API key is available
try:
    from gemini_service import gemini_service, GEMINI_AVAILABLE
    if GEMINI_AVAILABLE and hasattr(gemini_service, 'generate_text'):
        print("Gemini service is available")
    else:
        print("Gemini service is not properly configured")
        GEMINI_AVAILABLE = False
except (ImportError, ValueError, AttributeError) as e:
    print(f"Warning: Gemini service not available: {e}")
    GEMINI_AVAILABLE = False
    gemini_service = None
import requests

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure Flask app
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///codedswitch.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME', 'no-reply@codedswitch.com'))

# Initialize extensions
mail = Mail(app)
db.init_app(app)

# Configure CORS
CORS(app, 
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "https://www.codedswitch.com",
                "https://codedswitch.com",
                "https://codedswitch-frontend.onrender.com",
                "https://codedswitch-backend.onrender.com",
                "https://newnewwebsite.onrender.com",
                "https://codedswitch-minimal.netlify.app",
                "*"  # Allow all origins temporarily for debugging
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key", "Accept", "Origin"],
            "supports_credentials": True
        }
    },
    supports_credentials=True,
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "X-Requested-With", 
        "Accept",
        "Origin",
        "X-API-Key"
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    expose_headers=["Content-Type", "Authorization"]
)

# CORS helper function
def _build_cors_preflight_response():
    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-Key")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

# Add security headers
@app.after_request
def after_request(response):
    # CORS headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Health check endpoints
@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "CodedSwitch backend is running"})

@app.route('/api/health', methods=['GET', 'OPTIONS'])
@cross_origin()
def health():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

# Music generation endpoints
@app.route('/api/generate-music', methods=['POST', 'OPTIONS'])
@cross_origin()
def generate_music():
    """
    Generate music using AI.
    
    Request JSON:
    - prompt: Description of the music to generate (required)
    - duration: Duration in seconds (default: 10)
    - model: Model to use (default: 'facebook/musicgen-small')
    
    Returns:
    - JSON with job ID for tracking
    """
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt is required"}), 400
    
    try:
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # For now, return a mock response
        # In production, this would queue a job for background processing
        return jsonify({
            "job_id": job_id,
            "status": "queued",
            "message": "Music generation started"
        })
        
    except Exception as e:
        error_msg = f"Error generating music: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/api/music-status/<job_id>', methods=['GET'])
@cross_origin()
def check_music_status(job_id):
    """Check the status of a music generation job"""
    try:
        # Mock status check - in production this would check Redis/database
        return jsonify({
            "job_id": job_id,
            "status": "completed",
            "download_url": f"/api/music-download/{job_id}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/music-download/<job_id>', methods=['GET'])
@cross_origin()
def download_music(job_id):
    """Download generated music file"""
    try:
        # Mock download - in production this would serve actual files
        return jsonify({
            "job_id": job_id,
            "message": "Download endpoint ready",
            "file_url": f"/static/music/{job_id}.wav"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _handle_gemini_generate():
    """Handle Gemini text generation request"""
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({
            'success': False,
            'error': 'Prompt is required'
        }), 400
    
    # Extract and validate parameters
    try:
        temperature = min(1.0, max(0.0, float(data.get('temperature', 0.7))))
        max_tokens = min(8192, max(1, int(data.get('max_tokens', 2048))))
        top_p = min(1.0, max(0.0, float(data.get('top_p', 0.9))))
        top_k = min(100, max(1, int(data.get('top_k', 40))))
    except (ValueError, TypeError) as e:
        return jsonify({
            'success': False,
            'error': f'Invalid parameters: {str(e)}'
        }), 400
    
    # Generate text
    result = gemini_service.generate_text(
        prompt=data['prompt'],
        temperature=temperature,
        max_output_tokens=max_tokens,
        top_p=top_p,
        top_k=top_k
    )
    
    if not result.get('success'):
        return jsonify({
            'success': False,
            'error': result.get('error', 'Failed to generate text')
        }), 500
    
    return jsonify({
        'success': True,
        'text': result.get('text', '').strip(),
        'usage': result.get('usage', {})
    })

@app.route('/api/gemini/generate', methods=['POST', 'OPTIONS'])
@cross_origin()
@require_api_key('gemini_text')
def gemini_generate():
    """
    Generate text using the Gemini API.
    
    Request JSON:
    - prompt: The prompt to generate text from (required)
    - temperature: Controls randomness (0.0 to 1.0, default: 0.7)
    - max_tokens: Maximum length of the response (default: 2048)
    - top_p: Nucleus sampling (0.0 to 1.0, default: 0.9)
    - top_k: Top-k sampling (default: 40)
    
    Returns:
    - JSON with generated text and metadata
    """
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    try:
        return _handle_gemini_generate()
    except Exception as e:
        logging.error(f"Error in gemini_generate: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An error occurred while processing your request',
            'details': str(e) if app.config.get('DEBUG') else None
        }), 500

def _handle_gemini_generate_code():
    """Handle Gemini code generation request"""
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({
            'success': False,
            'error': 'Prompt is required'
        }), 400
    
    # Extract and validate parameters
    try:
        language = data.get('language', 'python').lower()
        temperature = min(1.0, max(0.0, float(data.get('temperature', 0.5))))
        max_tokens = min(8192, max(1, int(data.get('max_tokens', 2048))))
    except (ValueError, TypeError) as e:
        return jsonify({
            'success': False,
            'error': f'Invalid parameters: {str(e)}'
        }), 400
    
    # Generate code
    result = gemini_service.generate_text(
        prompt=f"Generate {language} code for: {data['prompt']}\n\n"
              f"Requirements:\n"
              f"1. Use {language} programming language\n"
              f"2. Include proper error handling\n"
              f"3. Add relevant comments\n"
              f"4. Follow best practices for {language}\n"
              f"5. Only return the code, no explanations",
        temperature=temperature,
        max_output_tokens=max_tokens,
        top_p=0.9,
        top_k=40
    )
    
    if not result.get('success'):
        return jsonify({
            'success': False,
            'error': result.get('error', 'Failed to generate code')
        }), 500
    
    return jsonify({
        'success': True,
        'code': result.get('text', '').strip(),
        'language': language,
        'usage': result.get('usage', {})
    })

@app.route('/api/gemini/generate-code', methods=['POST', 'OPTIONS'])
@cross_origin()
@require_api_key('gemini_code')
def gemini_generate_code():
    """
    Generate code using the Gemini API.
    
    Request JSON:
    - prompt: Description of the code to generate (required)
    - language: Programming language (default: 'python')
    - temperature: Controls randomness (0.0 to 1.0, default: 0.5)
    - max_tokens: Maximum length of the response (default: 2048)
    
    Returns:
    - JSON with generated code and metadata
    """
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    try:
        return _handle_gemini_generate_code()
    except Exception as e:
        logging.error(f"Error in gemini_generate_code: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An error occurred while generating code',
            'details': str(e) if app.config.get('DEBUG') else None
        }), 500

# AI Provider Endpoints

@app.route('/api/ai', methods=['POST', 'OPTIONS'])
def ai_proxy():
    """
    Endpoint for AI completions supporting multiple providers.
    
    Request JSON:
    - prompt: The user's input prompt (required)
    - provider: 'grok' or 'gemini' (defaults to 'grok' if not specified)
    - max_tokens: Maximum tokens in response (default: 200)
    - temperature: Controls randomness (0.0 to 1.0)
    
    Returns:
    - JSON with AI response and metadata
    """
    data = request.json or {}
    prompt = data.get('prompt')
    provider = data.get('provider', 'grok').lower()
    max_tokens = data.get('max_tokens', 200)
    
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400
    
    # Route to the appropriate provider
    if provider == 'grok':
        return handle_grok_request(prompt, max_tokens)
    elif provider == 'gemini':
        if not GEMINI_AVAILABLE:
            return jsonify({'error': 'Gemini provider is not available. Please check server configuration.'}), 503
        return handle_gemini_request(prompt, max_tokens, data.get('temperature'))
    else:
        return jsonify({'error': f'Unsupported provider: {provider}. Use "grok" or "gemini"'}), 400

def handle_grok_request(prompt, max_tokens):
    """Handle Grok AI API requests."""
    grok_api_key = os.environ.get('Grok_API_Key')
    if not grok_api_key:
        return jsonify({'error': 'Grok API key not configured'}), 500
        
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {grok_api_key}"
            },
            json={
                "model": os.environ.get("DEFAULT_GROK_MODEL", "grok-3-mini"),
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens
            },
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        return jsonify({
            "response": content,
            "provider": "grok",
            "model": result.get('model', 'grok-3-mini'),
            "raw": result
        })
    except Exception as e:
        return jsonify({'error': str(e), 'provider': 'grok'}), 500

def handle_gemini_request(prompt, max_tokens, temperature=None):
    """Handle Gemini AI API requests."""
    try:
        # Configure generation parameters
        gen_config = {
            'max_output_tokens': min(max_tokens, 2048),  # Cap at 2048 tokens
            'temperature': min(max(0, float(temperature or 0.7)), 1.0)  # Clamp to 0-1 range
        }
        
        # Generate response using gemini_service
        response = gemini_service.generate_text(prompt, **gen_config)
        
        return jsonify({
            "response": response.get('text', ''),
            "provider": "gemini",
            "model": "gemini-pro",
            "raw": response
        })
    except Exception as e:
        return jsonify({'error': str(e), 'provider': 'gemini'}), 500

# Add other endpoints here...

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Start the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True) 