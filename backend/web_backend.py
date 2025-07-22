import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from flask_mail import Mail, Message
from models import db, EmailSignup
import json
from datetime import datetime
from api_keys import api_key_manager, require_api_key, create_god_key
import stripe
from dotenv import load_dotenv
import logging

# Configure logging for debug output
logging.basicConfig(level=logging.DEBUG)

# Load environment variables
load_dotenv()

# Configure Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Setup Redis queue for async music generation
redis_url = os.environ.get('REDIS_URL')
if not redis_url:
    raise RuntimeError("REDIS_URL environment variable not set")
import redis
from rq import Queue
import uuid
redis_conn = redis.from_url(redis_url)
task_queue = Queue('default', connection=redis_conn)

# MusicGenBackend will be imported lazily in the generate_music route

# ===== PROFESSIONAL EMAIL TEMPLATES =====
def send_api_key_email(user_email, api_key, plan_name, user_name=None):
    """Send API key to user with professional welcome email"""
    try:
        subject = f"🚀 Welcome to CodedSwitch - Your {plan_name} API Key"
        
        # Professional HTML email template
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to CodedSwitch</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎵 CodedSwitch</h1>
        <p style="color: white; margin: 5px 0;">AI-Powered Creative Coding Platform</p>
    </div>
    
    <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Welcome{f', {user_name}' if user_name else ''}! 🎉</h2>
        
        <p>Thank you for subscribing to <strong>CodedSwitch {plan_name}</strong>! Your creative coding journey starts now.</p>
        
        <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">🔑 Your API Key</h3>
            <code style="background: #f4f4f4; padding: 10px; display: block; border-radius: 4px; font-size: 14px; word-break: break-all;">{api_key}</code>
            <p style="margin-bottom: 0; font-size: 12px; color: #666;">⚠️ Keep this secure - it's your access to all CodedSwitch features!</p>
        </div>
        
        <h3 style="color: #333;">🚀 What You Can Do Now:</h3>
        <ul style="padding-left: 20px;">
            <li><strong>Code Translation:</strong> Convert between programming languages instantly</li>
            <li><strong>AI Music Generation:</strong> Turn your code patterns into beats</li>
            <li><strong>Lyric Creation:</strong> Generate rap lyrics with AI assistance</li>
            <li><strong>Vulnerability Scanning:</strong> Secure your code with AI analysis</li>
            <li><strong>CodeBeat Studio:</strong> Create music from code patterns</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://codedswitch.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">🎵 Start Creating</a>
        </div>
        
        <h3 style="color: #333;">📚 Quick Start Guide:</h3>
        <ol>
            <li>Visit <a href="https://codedswitch.com">codedswitch.com</a></li>
            <li>Use your API key in any of our tools</li>
            <li>Start with Code Translation or Lyric Lab</li>
            <li>Explore CodeBeat Studio for music creation</li>
        </ol>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e88e5;">💡 Pro Tips:</h4>
            <ul style="margin-bottom: 0;">
                <li>Bookmark your favorite tools for quick access</li>
                <li>Try combining code translation with music generation</li>
                <li>Use vulnerability scanning on all your projects</li>
            </ul>
        </div>
    </div>
    
    <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">Need help? Email us at <a href="mailto:support@codedswitch.com" style="color: #667eea;">support@codedswitch.com</a></p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">© 2025 CodedSwitch - Where Logic Meets Rhythm</p>
    </div>
</body>
</html>
        """
        
        # Plain text version
        text_body = f"""
Welcome to CodedSwitch {plan_name}!

Your API Key: {api_key}

What you can do:
• Code Translation between programming languages
• AI Music Generation from code patterns  
• Lyric Creation with AI assistance
• Vulnerability Scanning for secure code
• CodeBeat Studio for music creation

Get started: https://codedswitch.com
Support: support@codedswitch.com

© 2025 CodedSwitch - Where Logic Meets Rhythm
        """
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            html=html_body,
            body=text_body,
            sender='servicehelp@codedswitch.com'
        )
        
        mail.send(msg)
        print(f"✅ API key email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send API key email: {e}")
        return False

def send_support_email(user_email, user_name, subject, message):
    """Send support inquiry to support team"""
    try:
        support_subject = f"Support Request: {subject}"
        
        support_body = f"""
        New support request from CodedSwitch user:
        
        From: {user_name} ({user_email})
        Subject: {subject}
        
        Message:
        {message}
        
        ---
        Sent via CodedSwitch Support System
        """
        
        msg = Message(
            subject=support_subject,
            recipients=['servicehelp@codedswitch.com'],
            body=support_body,
            sender='servicehelp@codedswitch.com',
            reply_to=user_email
        )
        
        mail.send(msg)
        print(f"✅ Support email forwarded from {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send support email: {e}")
        return False

def send_newsletter_signup_confirmation(user_email):
    """Send confirmation email for newsletter signup"""
    try:
        subject = "🎵 Welcome to CodedSwitch Updates!"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎵 CodedSwitch</h1>
    </div>
    
    <div style="padding: 30px;">
        <h2>Thanks for joining our community! 🎉</h2>
        <p>You're now subscribed to CodedSwitch updates. We'll keep you informed about:</p>
        
        <ul>
            <li>🚀 New features and tools</li>
            <li>💡 Creative coding tutorials</li>
            <li>🎵 Music generation tips</li>
            <li>📊 Platform updates</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://codedswitch.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Explore CodedSwitch</a>
        </div>
    </div>
    
    <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>CodedSwitch - Where Logic Meets Rhythm</p>
    </div>
</body>
</html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            html=html_body,
            sender='servicehelp@codedswitch.com'
        )
        
        mail.send(msg)
        print(f"✅ Newsletter confirmation sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send newsletter confirmation: {e}")
        return False

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///codedswitch.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME', 'no-reply@codedswitch.com'))

mail = Mail(app)
db.init_app(app)

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
    expose_headers=["Content-Type", "Authorization"])

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


@app.route('/')
def index():
    """Health-check endpoint for root path."""
    return jsonify({"status": "ok", "message": "CodedSwitch backend is running"})

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    """Health-check endpoint for API path."""
    return jsonify({"status": "ok", "message": "API healthy"})

@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
        return response

@app.route('/api/user/subscription', methods=['GET', 'OPTIONS'])
def get_subscription():
    """Stub endpoint so the frontend stops throwing 404/JSON errors.
    Always returns a free plan. Extend later when you add real subscription logic.
    """
    user_id = request.args.get('userId', 'anonymous')
    # Frontend expects { subscription: { ... }, usage: { ... } }
    subscription = {
        "plan": "free",
        "name": "Free",
        "monthlyLyrics": 5,
        "features": [
            "5 Lyric Generations per Month",
            "Basic Code Translation",
            "Community Support"
        ]
    }
    usage = {
        "lyricsGenerated": 0,
        "lastReset": "2025-07"  # static for now
    }
    return jsonify({"userId": user_id, "subscription": subscription, "usage": usage})



@app.route('/api/ai', methods=['POST', 'OPTIONS'])
def ai_proxy():
    """Endpoint for AI completions using Grok API only."""
    import os
    import requests
    data = request.json or {}
    prompt = data.get('prompt')
    max_tokens = data.get('max_tokens', 200)
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400
    grok_api_key = os.environ.get('Grok_API_Key')
    if not grok_api_key:
        return jsonify({'error': 'Grok_API_Key environment variable not set'}), 500
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",  # Correct xAI Grok API endpoint
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
        return jsonify({"response": content, "raw": result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_proxy():
    '''Generate lyrics using Grok API or fallback to demo lyrics.'''
    # Handle OPTIONS requests for CORS
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin'
        return response, 200
        
    # Enhanced debug logging for troubleshooting
    logging.debug("[DEBUG] request.data: %s", request.data)
    logging.debug("[DEBUG] request.json: %s", request.json)
    logging.debug("[DEBUG] request.headers: %s", dict(request.headers))

    data = request.json or {}
    prompt = data.get('prompt')
    user_id = data.get('userId', 'anonymous')
    max_tokens = data.get('max_tokens', 500)
    
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400

    # DEMO LYRICS - always available as fallback
    style = 'boom-bap'
    topic = 'coding'
    
    # Extract style and topic from prompt if possible
    if 'style lyrics about' in prompt:
        parts = prompt.split('style lyrics about')
        if len(parts) == 2:
            style = parts[0].strip().replace('Generate ', '')
            topic = parts[1].strip()
            
    demo_lyrics = f"""
[Verse 1]
In the realm of {style}, I drop beats like code
Debugging life's problems, carrying the mental load
Writing algorithms for success, no need to reload
These {topic} rhymes I craft are about to explode

[Chorus]
Coding all day, coding all night
These {topic} dreams taking digital flight
From syntax to beats, everything's right
My {style} flow is out of sight

[Verse 2]
Compiling my thoughts into bars that hit hard
Binary decisions, life gets complicated when you're a bard
Deploying these verses with a {style} regard
The {topic} inspiration is my wildcard
"""
    
    # Try to get a real response from Grok API
    try:
        # Check for API key
        api_key = request.headers.get('X-API-Key')
        grok_api_key = api_key or os.environ.get('Grok_API_Key')
        
        if not grok_api_key:
            print("⚠️ No API key available for Grok API, using demo lyrics")
            return jsonify({
                "lyrics": demo_lyrics,
                "response": demo_lyrics,
                "usage": {
                    "lyricsGenerated": 1,
                    "lastReset": datetime.now().strftime("%Y-%m")
                },
                "demo": True
            })
        
        # Format proper prompt for better lyrics
        enhanced_prompt = f"""
        Generate professional rap lyrics in {style} style about {topic}.
        Write at least 16 bars (lines) with a chorus section.
        Include creative wordplay related to {topic}.
        Format with [Verse 1], [Chorus], [Verse 2] sections.
        Only return the lyrics, no additional explanation.
        """
        
        grok_payload = {
            "model": os.environ.get("DEFAULT_GROK_MODEL", "grok-3-mini"),
            "messages": [{"role": "user", "content": enhanced_prompt}],
            "max_tokens": max_tokens
        }
        
        print(f"🎵 Generating {style} lyrics about {topic} via Grok API")
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {grok_api_key}"
            },
            json=grok_payload,
            timeout=60
        )
        
        if not response.ok:
            print(f"⚠️ Grok API error: {response.status_code} - {response.text}")
            raise Exception(f"API error: {response.status_code}")
            
        result = response.json()
        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        # If no content received, use demo lyrics
        if not content.strip():
            print("⚠️ Empty response from Grok API, using demo lyrics")
            content = demo_lyrics
        
        print(f"✅ Successfully generated lyrics via Grok API")
        return jsonify({
            "lyrics": content,
            "response": content,
            "usage": {
                "lyricsGenerated": 1,
                "lastReset": datetime.now().strftime("%Y-%m")
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating lyrics: {str(e)}")
        # On any error, fall back to demo lyrics
        return jsonify({
            "lyrics": demo_lyrics,
            "response": demo_lyrics,
            "usage": {
                "lyricsGenerated": 1,
                "lastReset": datetime.now().strftime("%Y-%m")
            },
            "demo": True
        })

import logging
logging.basicConfig(level=logging.DEBUG)
import logging
logging.basicConfig(level=logging.DEBUG)
from flask import send_file, send_from_directory  # type: ignore[reportMissingImports]

# Serve static loop files from backend/loops directory
LOOPS_DIR = os.path.join(os.path.dirname(__file__), 'loops')
@app.route('/api/loops/<path:subpath>', methods=['GET', 'OPTIONS'])
def serve_loops(subpath):
    return send_from_directory(LOOPS_DIR, subpath)

@app.route('/api/generate-music', methods=['POST', 'OPTIONS'])
def generate_music():
    """Generate music - simplified version without worker queue"""
    data = request.json or {}
    prompt = data.get('prompt', '')
    lyrics = data.get('lyrics', '')
    duration = int(data.get('duration', 30))
    job_id = str(uuid.uuid4())
    
    try:
        # For now, return a mock successful response to fix the 202 loop
        # TODO: Implement actual music generation when worker service is fixed
        import time
        time.sleep(2)  # Simulate processing time
        
        # Create a simple mock audio file path
        mock_audio_path = f"/tmp/mock_audio_{job_id}.wav"
        
        # Store job as completed immediately
        redis_conn.hset(f"job:{job_id}", mapping={
            "status": "finished", 
            "filePath": mock_audio_path,
            "prompt": prompt,
            "lyrics": lyrics,
            "duration": duration
        })
        
        return jsonify({
            "jobId": job_id,
            "status": "finished",
            "message": "Music generation completed (mock)"
        }), 200
        
    except Exception as e:
        redis_conn.hset(f"job:{job_id}", mapping={"status": "failed", "error": str(e)})
        return jsonify({"error": str(e)}), 500


@app.route('/api/music-file', methods=['GET', 'OPTIONS'])
def serve_music_file():
    """Serve generated WAV file for the given job ID"""
    job_id = request.args.get('jobId')
    if not job_id:
        return jsonify({"error": "Missing jobId"}), 400
    
    job_data = redis_conn.hgetall(f"job:{job_id}")
    if not job_data:
        return jsonify({"error": "Job not found"}), 404
        
    status = job_data.get(b"status").decode() if job_data.get(b"status") else "unknown"
    
    if status == "failed":
        error = job_data.get(b"error", b"Unknown error").decode()
        return jsonify({"error": error}), 500
    elif status != "finished":
        return jsonify({"status": status, "message": "Still processing..."}), 202
    
    # For mock files, return a simple audio response
    wav_path = job_data.get(b"filePath", b"").decode()
    
    if wav_path.startswith("/tmp/mock_audio_"):
        # Return a mock audio response
        import io
        import wave
        import struct
        import math
        
        # Generate a simple sine wave as mock audio
        sample_rate = 44100
        duration = 3  # 3 seconds
        frequency = 440  # A4 note
        
        frames = []
        for i in range(int(sample_rate * duration)):
            value = int(32767 * math.sin(2 * math.pi * frequency * i / sample_rate))
            frames.append(struct.pack('<h', value))
        
        # Create WAV file in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(b''.join(frames))
        
        wav_buffer.seek(0)
        return send_file(
            wav_buffer, 
            mimetype='audio/wav', 
            as_attachment=True, 
            download_name=f"generated_music_{job_id}.wav"
        )
    else:
        # Handle real files when worker is implemented
        return send_file(wav_path, mimetype='audio/wav', as_attachment=True, download_name=f"{job_id}.wav")



@app.route('/api/translate-code', methods=['POST', 'OPTIONS'])
def translate_code():
    """Translate code from one language to another using Grok API."""
    data = request.json or {}
    source_code = data.get('sourceCode')
    source_language = data.get('sourceLanguage')
    target_language = data.get('targetLanguage')
    
    if not source_code:
        return jsonify({'error': 'Missing sourceCode'}), 400
    if not source_language:
        return jsonify({'error': 'Missing sourceLanguage'}), 400
    if not target_language:
        return jsonify({'error': 'Missing targetLanguage'}), 400
    
    grok_api_key = os.environ.get('Grok_API_Key')
    if not grok_api_key:
        return jsonify({'error': 'Grok_API_Key environment variable not set'}), 500
    
    try:
        prompt = f"Translate the following {source_language} code to {target_language}. Only return the translated code without explanations:\n\n```{source_language}\n{source_code}\n```"
        
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {grok_api_key}"
            },
            json={
                "model": "grok-3",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": data.get('max_tokens', 1000)
            },
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        translated_code = result['choices'][0]['message']['content']
        
        # Clean up the response to extract just the code
        if '```' in translated_code:
            # Extract code from markdown code blocks
            lines = translated_code.split('\n')
            code_lines = []
            in_code_block = False
            for line in lines:
                if line.strip().startswith('```'):
                    in_code_block = not in_code_block
                    continue
                if in_code_block:
                    code_lines.append(line)
            translated_code = '\n'.join(code_lines)
        
        return jsonify({
            'translatedCode': translated_code.strip(),
            'sourceLanguage': source_language,
            'targetLanguage': target_language
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vulnerability-scan', methods=['POST', 'OPTIONS'])
def vulnerability_scan():
    """Scan code for security vulnerabilities via Grok API."""
    data = request.json or {}
    code = data.get('code')
    if not code:
        return jsonify({'error': 'Missing code'}), 400
    
    grok_api_key = os.environ.get('Grok_API_Key')
    if not grok_api_key:
        return jsonify({'error': 'Grok_API_Key environment variable not set'}), 500
    
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {grok_api_key}"
            },
            json={
                "model": "grok-3",
                "messages": [{"role": "user", "content": f"Scan the following code for security vulnerabilities and list the issues:\n```{code}```"}],
                "max_tokens": data.get('max_tokens', 500)
            },
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        return jsonify({'issues': content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Simple email signup handler - file-based storage"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
        return response, 200
        
    data = request.json or {}
    email = data.get('email')
    
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    try:
        # Store email in a text file as a simple database
        email_file = os.path.join(os.path.dirname(__file__), 'newsletter_emails.txt')
        
        # Check if email already exists
        existing = False
        if os.path.exists(email_file):
            with open(email_file, 'r') as f:
                existing = email in [line.strip() for line in f.readlines()]
        
        if existing:
            return jsonify({'message': 'Email already signed up'}), 200
            
        # Store new signup
        with open(email_file, 'a') as f:
            f.write(f"{email}\n")
        
        # Simple log instead of email
        print(f"✅ New newsletter signup: {email} at {datetime.now()}")
        
        return jsonify({
            'message': 'Thank you for signing up!',
            'email': email
        })
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")
        return jsonify({'error': 'Unable to process signup. Please try again later.'}), 500

@app.route('/api/test-emails', methods=['GET', 'OPTIONS'])
def test_emails():
    """Endpoint to test email storage (for development only)"""
    emails = EmailSignup.query.all()
    return jsonify({
        'emails': [{
            'id': email.id,
            'email': email.email,
            'created_at': email.created_at.isoformat(),
            'notified': email.notified
        } for email in emails]
    })

@app.route('/api/subscription-plans', methods=['GET', 'OPTIONS'])
def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "interval": "month",
            "features": [
                "5 Lyric Generations per Month",
                "Basic Code Translation",
                "Community Support"
            ]
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 9.99,
            "interval": "month",
            "features": [
                "Unlimited Lyric Generations",
                "Advanced Code Translation",
                "Music Generation (10 tracks/month)",
                "Priority Support",
                "API Access"
            ]
        },
        {
            "id": "premium",
            "name": "Premium",
            "price": 19.99,
            "interval": "month",
            "features": [
                "Everything in Pro",
                "Unlimited Music Generation",
                "Custom AI Models",
                "White-label Solutions",
                "24/7 Priority Support"
            ]
        }
    ]
    return jsonify({"plans": plans})

@app.route('/api/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    """Create mock checkout session with automatic API key generation"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin'
        return response, 200
        
    try:
        data = request.json or {}
        plan_id = data.get('planId')
        user_email = data.get('email', 'test@example.com')
        
        if not plan_id:
            return jsonify({'error': 'Missing planId'}), 400
        
        # Plan pricing mapping
        plan_prices = {
            'pro': {'price': 999, 'name': 'Pro Plan'},  # $9.99 in cents
            'premium': {'price': 2999, 'name': 'Premium Plan'}  # $29.99 in cents
        }
        
        if plan_id not in plan_prices:
            return jsonify({'error': 'Invalid plan'}), 400
            
        # Generate a mock session ID
        import uuid
        session_id = f"cs_test_{uuid.uuid4().hex}"
        
        # Create a demo API key for this session
        api_key = f"cs_{plan_id}_{uuid.uuid4().hex[:16]}"
        
        # Log the subscription
        print(f"✅ New {plan_id.title()} subscription for {user_email} - API Key: {api_key}")
        
        # Store the subscription in a simple text file
        subscription_file = os.path.join(os.path.dirname(__file__), 'subscriptions.txt')
        with open(subscription_file, 'a') as f:
            f.write(f"{user_email},{plan_id},{api_key},{datetime.now()}\n")
        
        # Redirect URL with success message
        origin = request.headers.get("Origin", "https://www.codedswitch.com")
        success_url = f"{origin}/success?session_id={session_id}&api_key={api_key}"
        
        return jsonify({
            'sessionId': session_id,
            'url': success_url,
            'api_key': api_key  # Provide the API key directly for testing
        })
        
    except Exception as e:
        print(f"❌ Checkout error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/reset-usage', methods=['POST', 'OPTIONS'])
def reset_user_usage():
    """Admin endpoint to reset usage limits"""
    data = request.get_json() or {}
    admin_key = data.get('adminKey')
    user_id = data.get('userId', 'anonymous')
    
    # Simple admin key check (in production, use proper authentication)
    if admin_key != os.environ.get('ADMIN_KEY', 'codedswitch_admin_2025'):
        return jsonify({'error': 'Invalid admin key'}), 403
    
    # Reset usage (simplified - in real app you'd update database)
    return jsonify({
        'message': f'Usage reset for user {user_id}',
        'usage': {
            'lyricsGenerated': 0,
            'lastReset': str(datetime.now()),
            'plan': 'unlimited'
        }
    })

@app.route('/api/codebeat-pattern', methods=['POST', 'OPTIONS'])
def generate_codebeat_pattern():
    """Generate music from CodeBeat Studio patterns - simplified version"""
    try:
        data = request.get_json()
        code_pattern = data.get('code', '')
        tempo = data.get('tempo', 120)
        key = data.get('key', 'C')
        
        if not code_pattern:
            return jsonify({"error": "Missing code pattern"}), 400
        
        # Enhanced prompt for code-based music generation
        enhanced_prompt = f"""
        Create a {tempo} BPM instrumental track in {key} based on this code pattern:
        
        {code_pattern}
        
        Interpret the code structure musically:
        - Function calls as melodic phrases
        - Loops as repeating rhythmic patterns  
        - Conditional statements as dynamic changes
        - Variables as harmonic elements
        
        Style: Modern electronic with clear rhythmic structure
        """
        
        # Create job ID and simulate processing
        job_id = str(uuid.uuid4())
        
        # For now, return a mock successful response to fix the 500 error
        # TODO: Implement actual music generation when worker service is fixed
        import time
        time.sleep(1)  # Simulate processing time
        
        # Create a simple mock audio file path
        mock_audio_path = f"/tmp/codebeat_audio_{job_id}.wav"
        
        # Store job as completed immediately
        redis_conn.hset(f"job:{job_id}", mapping={
            "status": "finished", 
            "filePath": mock_audio_path,
            "prompt": enhanced_prompt,
            "code_pattern": code_pattern,
            "tempo": tempo,
            "key": key,
            "pattern_type": "codebeat"
        })
        
        return jsonify({
            "jobId": job_id,
            "status": "finished",
            "message": "Code pattern converted to music! (mock)",
            "tempo": tempo,
            "key": key
        }), 200
        
    except Exception as e:
        print(f"CodeBeat pattern error: {e}")
        return jsonify({"error": str(e)}), 500

# ===== PROFESSIONAL CONTACT & SUPPORT ENDPOINTS =====
@app.route('/api/contact', methods=['POST', 'OPTIONS'])
def contact_form():
    """Handle contact form submissions with professional email routing"""
    data = request.json or {}
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    inquiry_type = data.get('type', 'general')  # general, technical, billing, partnership
    
    # Validation
    if not name or not email or not message:
        return jsonify({'error': 'Name, email, and message are required'}), 400
    
    if '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    try:
        # Route to appropriate email based on inquiry type
        # All inquiries go to your main support email for now
        email_routing = {
            'general': 'servicehelp@codedswitch.com',
            'technical': 'servicehelp@codedswitch.com', 
            'billing': 'servicehelp@codedswitch.com',
            'partnership': 'servicehelp@codedswitch.com',
            'api': 'servicehelp@codedswitch.com'
        }
        
        recipient = email_routing.get(inquiry_type, 'servicehelp@codedswitch.com')
        
        # Send to support team
        support_success = send_support_email(email, name, subject or f"{inquiry_type.title()} Inquiry", message)
        
        # Send confirmation to user
        confirmation_subject = "✅ We received your message - CodedSwitch Support"
        confirmation_html = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎵 CodedSwitch Support</h1>
    </div>
    
    <div style="padding: 30px;">
        <h2>Thanks for reaching out, {name}! 👋</h2>
        
        <p>We've received your message and our team will get back to you within 24 hours.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Your Message:</h4>
            <p><strong>Subject:</strong> {subject or 'General Inquiry'}</p>
            <p><strong>Type:</strong> {inquiry_type.title()}</p>
            <p><strong>Message:</strong></p>
            <p style="font-style: italic;">{message}</p>
        </div>
        
        <p>In the meantime, you might find these helpful:</p>
        <ul>
            <li>📚 <a href="https://codedswitch.com/docs">Documentation</a></li>
            <li>🎵 <a href="https://codedswitch.com/tutorials">Tutorials</a></li>
            <li>💬 <a href="https://codedswitch.com/community">Community Forum</a></li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://codedswitch.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Back to CodedSwitch</a>
        </div>
    </div>
    
    <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>CodedSwitch Support Team</p>
        <p>Email: {recipient} | Website: codedswitch.com</p>
    </div>
</body>
</html>
        """
        
        confirmation_msg = Message(
            subject=confirmation_subject,
            recipients=[email],
            html=confirmation_html,
            sender='servicehelp@codedswitch.com'
        )
        
        mail.send(confirmation_msg)
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your message! We\'ll get back to you within 24 hours.',
            'inquiry_type': inquiry_type,
            'support_email': recipient
        })
        
    except Exception as e:
        print(f"❌ Contact form error: {e}")
        return jsonify({'error': 'Failed to send message. Please try again.'}), 500

# ===== API KEY MANAGEMENT ENDPOINTS =====

@app.route('/api/keys/generate', methods=['POST', 'OPTIONS'])
def generate_api_key():
    """Generate a new API key"""
    data = request.get_json() or {}
    admin_key = data.get('adminKey')
    
    # Only admin can generate keys
    if admin_key != os.environ.get('ADMIN_KEY', 'codedswitch_admin_2025'):
        return jsonify({'error': 'Admin access required'}), 403
    
    plan = data.get('plan', 'free')
    user_id = data.get('userId')
    description = data.get('description', '')
    
    try:
        api_key = api_key_manager.generate_key(plan, user_id, description)
        return jsonify({
            'api_key': api_key,
            'plan': plan,
            'message': f'API key generated for {plan} plan'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keys/god', methods=['POST', 'OPTIONS'])
def create_god_mode_key():
    """Create the ultimate God mode key"""
    data = request.get_json() or {}
    admin_key = data.get('adminKey')
    
    # Only admin can create God key
    if admin_key != os.environ.get('ADMIN_KEY', 'codedswitch_admin_2025'):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        god_key = create_god_key()
        return jsonify({
            'god_key': god_key,
            'plan': 'god',
            'message': 'God mode key created - unlimited everything!',
            'powers': [
                'Unlimited lyric generations',
                'Unlimited music generations', 
                'Unlimited code translations',
                'Unlimited vulnerability scans',
                'Unlimited CodeBeat generations',
                'Admin panel access',
                'Never expires',
                'Bypasses all limits'
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keys/stats/<api_key>', methods=['GET', 'OPTIONS'])
def get_key_stats(api_key):
    """Get statistics for an API key"""
    try:
        stats = api_key_manager.get_user_stats(api_key)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keys/validate', methods=['POST', 'OPTIONS'])
def validate_key():
    """
    Validate an API key or God Mode key.
    Returns information about the key's validity and associated plan.
    """
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
        return response, 200
        
    api_key = request.headers.get('X-API-Key') or request.get_json(silent=True).get('apiKey', '') if request.is_json else ''
    
    if not api_key:
        return jsonify({'error': 'No API key provided', 'valid': False}), 400
    
    # Check if this is a God Mode key (supports multiple formats)
    god_prefix = os.environ.get('GOD_KEY_PREFIX', 'god_')
    if api_key.startswith(god_prefix) or 'god_' in api_key or api_key.startswith('cs_god_'):
        # In a real system, validate against stored keys in database
        return jsonify({
            'valid': True,
            'message': 'Valid God Mode key',
            'plan': 'God Mode',
            'capabilities': ['unlimited requests', 'all features', 'admin access']
        }), 200
    
    # Check regular API keys (simple check - in production, use database)
    if api_key.startswith('cs_'):
        return jsonify({
            'valid': True,
            'message': 'Valid API key',
            'plan': 'Standard',
            'capabilities': ['limited requests', 'core features']
        }), 200
    
    # Invalid key format
    return jsonify({
        'valid': False,
        'error': 'Invalid API key format'
    }), 401

@app.route('/api/keys/upgrade', methods=['POST', 'OPTIONS'])
def upgrade_key_plan():
    """Upgrade an API key to a different plan"""
    data = request.get_json() or {}
    admin_key = data.get('adminKey')
    api_key = data.get('apiKey')
    new_plan = data.get('newPlan')
    
    # Only admin can upgrade plans
    if admin_key != os.environ.get('ADMIN_KEY', 'codedswitch_admin_2025'):
        return jsonify({'error': 'Admin access required'}), 403
    
    if not api_key or not new_plan:
        return jsonify({'error': 'API key and new plan required'}), 400
    
    success = api_key_manager.upgrade_plan(api_key, new_plan)
    
    if success:
        return jsonify({
            'message': f'API key upgraded to {new_plan} plan',
            'api_key': api_key[:10] + '...',
            'new_plan': new_plan
        })
    else:
        return jsonify({'error': 'Failed to upgrade plan'}), 400

# ===== STRIPE WEBHOOK ENDPOINTS =====

@app.route('/api/stripe/webhook', methods=['POST', 'OPTIONS'])
def stripe_webhook():
    """Handle Stripe webhook events - automatically generate API keys on successful payment"""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        # Verify webhook signature
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # For development - skip signature verification
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
        
        # Handle successful subscription creation
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            # Extract plan and user info from metadata
            plan_id = session.get('metadata', {}).get('plan_id')
            user_email = session.get('customer_email') or session.get('metadata', {}).get('user_email')
            customer_id = session.get('customer')
            
            if plan_id and user_email:
                try:
                    # Generate API key for the user
                    api_key = api_key_manager.generate_key(
                        plan=plan_id,
                        user_id=user_email,
                        description=f'Auto-generated for {plan_id} subscription via Stripe'
                    )
                    
                    # Send professional welcome email with API key
                    plan_name = plan_id.title() + " Plan"
                    email_sent = send_api_key_email(user_email, api_key, plan_name)
                    
                    if email_sent:
                        print(f"✅ API key generated and emailed to {user_email}: {api_key[:20]}...")
                    else:
                        print(f"⚠️ API key generated but email failed for {user_email}: {api_key[:20]}...")
                    
                except Exception as e:
                    print(f"❌ Failed to generate API key: {e}")
        
        # Handle subscription updates
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            customer_id = subscription.get('customer')
            status = subscription.get('status')
            
            # Handle plan changes, cancellations, etc.
            print(f"📝 Subscription updated for customer {customer_id}: {status}")
        
        # Handle failed payments
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            customer_id = invoice.get('customer')
            
            # TODO: Deactivate API key or downgrade plan
            print(f"❌ Payment failed for customer {customer_id}")
        
        return jsonify({'status': 'success'})
        
    except ValueError as e:
        # Invalid payload
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({'error': 'Invalid signature'}), 400
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': 'Webhook error'}), 500

@app.route('/api/stripe/success', methods=['GET', 'OPTIONS'])
def stripe_success():
    """Handle successful payment redirect"""
    session_id = request.args.get('session_id')
    
    if not session_id:
        return jsonify({'error': 'Missing session_id'}), 400
    
    try:
        # Retrieve the session
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Get plan info
        plan_id = session.get('metadata', {}).get('plan_id')
        user_email = session.get('customer_email')
        
        return jsonify({
            'success': True,
            'plan': plan_id,
            'email': user_email,
            'message': f'Welcome to CodedSwitch {plan_id.title()}! Your API key will be sent to {user_email}',
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({'error': 'Payment processing failed'}), 500

# ===== SPA ROUTING - SERVE REACT APP FOR ALL NON-API ROUTES =====

# ===== UNIVERSAL API OPTIONS HANDLER FOR CORS =====
@app.route('/api/<path:path>', methods=['OPTIONS'])
def catch_all_api_options(path):
    response = jsonify({})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def serve_react_app(path):
    """Serve React app for all non-API routes (SPA routing)"""
    # Handle OPTIONS method for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response
    
    # If it's an API route, let Flask handle it normally
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # For all other routes, serve the React app's index.html
    # This enables client-side routing (React Router)
    try:
        # Build the path to the frontend dist directory
        frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
        
        # Handle root path
        if not path or path == '/':
            return send_from_directory(frontend_dist, 'index.html')
            
        # Try to serve the requested file if it exists
        file_path = os.path.join(frontend_dist, path)
        if os.path.isfile(file_path):
            return send_from_directory(frontend_dist, path)
            
        # Try to serve index.html for React Router paths
        if not os.path.splitext(path)[1]:  # If no file extension
            return send_from_directory(frontend_dist, 'index.html')
            
        # Try to serve static files from the assets directory
        if '/assets/' in path:
            return send_from_directory(frontend_dist, path)
            
        # Fall back to index.html for React Router
        return send_from_directory(frontend_dist, 'index.html')
        
    except Exception as e:
        app.logger.error(f'Error serving route {path}: {str(e)}')
        return jsonify({'error': 'Failed to serve app', 'details': str(e)}), 500



# ===== SPECIAL CORS HANDLER FOR X-API-KEY =====
@app.route('/api/options-test', methods=['OPTIONS'])
def special_cors_options_handler():
    '''Handle CORS preflight requests with explicit X-API-Key support'''
    response = jsonify({})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
    return response

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=10000)
