import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from flask_mail import Mail, Message
from models import db, EmailSignup
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    origins=["http://localhost:5173", "http://localhost:5174", "https://www.codedswitch.com", "https://codedswitch.com"],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Access-Control-Allow-Origin"],
    methods=["GET", "POST", "OPTIONS"])

# Add security headers
@app.after_request
def after_request(response):
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

@app.route('/api/health')
def health():
    """Health-check endpoint for API path."""
    return jsonify({"status": "ok", "message": "API healthy"})

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



@app.route('/api/ai', methods=['POST'])
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


@app.route('/api/generate', methods=['POST'])
def generate_proxy():
    '''Generate lyrics using Grok API with usage tracking.'''
    data = request.json or {}
    prompt = data.get('prompt')
    user_id = data.get('userId', 'anonymous')
    max_tokens = data.get('max_tokens', 500)
    
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400

    # Get current usage (simplified - in real app you'd use a database)
    # For now, we'll just return success and increment usage
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
                "model": os.environ.get("DEFAULT_GROK_MODEL", "grok-3-mini"),
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens
            },
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Return response in format expected by LyricLab
        return jsonify({
            "lyrics": content,
            "response": content,
            "usage": {
                "lyricsGenerated": 1,  # Simplified usage tracking
                "lastReset": "2025-07"
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

from flask import send_file, send_from_directory  # type: ignore[reportMissingImports]

# Serve static loop files from backend/loops directory
LOOPS_DIR = os.path.join(os.path.dirname(__file__), 'loops')
@app.route('/api/loops/<path:subpath>')
def serve_loops(subpath):
    return send_from_directory(LOOPS_DIR, subpath)

@app.route('/api/generate-music', methods=['POST'])
def generate_music():
    """Enqueue a background job for MusicGen and return job ID"""
    data = request.json or {}
    prompt = data.get('prompt', '')
    lyrics = data.get('lyrics', '')
    duration = int(data.get('duration', 30))
    job_id = str(uuid.uuid4())
    # Initialize job status and enqueue
    redis_conn.hset(f"job:{job_id}", mapping={"status": "queued"})
    task_queue.enqueue('worker.generate_task', job_id, lyrics, prompt, duration)
    return jsonify({"jobId": job_id}), 202


@app.route('/api/music-file', methods=['GET'])
def serve_music_file():
    """Serve generated WAV file for the given job ID"""
    job_id = request.args.get('jobId')
    if not job_id:
        return jsonify({"error": "Missing jobId"}), 400
    job_data = redis_conn.hgetall(f"job:{job_id}")
    status = job_data.get(b"status").decode() if job_data.get(b"status") else "unknown"
    if status != "finished":
        return jsonify({"status": status, "error": "File not ready"}), 202
    wav_path = job_data.get(b"filePath").decode()
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

@app.route('/api/vulnerability-scan', methods=['POST'])
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

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    try:
        # Check if email already exists
        existing = EmailSignup.query.filter_by(email=email).first()
        if existing:
            return jsonify({'message': 'Email already signed up'}), 200
        
        # Create new signup
        signup = EmailSignup(email=email)
        db.session.add(signup)
        db.session.commit()
        
        # Send notification email
        msg = Message(
            'New CodedSwitch Signup',
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[os.environ.get('ADMIN_EMAIL', 'admin@example.com')]
        )
        msg.body = f"New signup: {email}\nDate: {datetime.utcnow()}"
        mail.send(msg)
        
        return jsonify({
            'message': 'Thank you for signing up!',
            'email': email
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-emails', methods=['GET'])
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=10000)
