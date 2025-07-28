import os
import time
import logging
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS, cross_origin
from flask_mail import Mail, Message
from models import db, EmailSignup
import json
from datetime import datetime
from api_keys import api_key_manager, require_api_key, create_god_key
import stripe
from dotenv import load_dotenv

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
def health():
    return jsonify({"status": "ok", "message": "API healthy"})

# CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
        return response

# Music generation endpoint
@app.route('/api/generate-music', methods=['POST', 'OPTIONS'])
@cross_origin()
def generate_music():
    """
    Generate music using the MusicGen model.
    
    Request JSON:
    - prompt: Text description of the music to generate (required)
    - duration: Duration in seconds (1-120, default: 30)
    
    Returns:
    - Audio/WAV file on success (200 OK)
    - JSON error on failure (400/500)
    """
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    data = request.json or {}
    prompt = data.get('prompt', '').strip()
    duration = min(max(int(data.get('duration', 30)), 1), 120)  # 1-120 seconds
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    
    try:
        # Lazy import to avoid loading model on startup
        from musicgen_backend import generate_instrumental
        
        # Log the start of generation
        app.logger.info(f"Generating music for prompt: {prompt[:100]}... (duration: {duration}s)")
        
        # Generate the audio file with both lyrics and prompt parameters
        output_path = generate_instrumental(lyrics=prompt, prompt=prompt, duration=duration)
        
        if not output_path or not os.path.exists(output_path):
            raise Exception("Failed to generate audio file - no output file was created")
            
        # Log successful generation
        file_size = os.path.getsize(output_path) / (1024 * 1024)  # Size in MB
        app.logger.info(f"Successfully generated music: {output_path} ({file_size:.2f} MB)")
        
        # Return the audio file directly
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f"codedswitch_music_{int(time.time())}.wav"
        )
        
    except Exception as e:
        error_msg = f"Error generating music: {str(e)}"
        app.logger.error(error_msg, exc_info=True)
        return jsonify({"error": error_msg}), 500

# Add other endpoints here...

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Start the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
