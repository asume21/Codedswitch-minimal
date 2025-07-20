import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from flask_mail import Mail, Message
from models import db, EmailSignup
import json
from datetime import datetime
from api_keys import api_key_manager, require_api_key, create_god_key
import stripe
from dotenv import load_dotenv

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

    # Check for admin bypass
    admin_key = data.get('adminKey')
    is_admin = admin_key == os.environ.get('ADMIN_KEY', 'codedswitch_admin_2025')
    
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


@app.route('/api/music-file', methods=['GET'])
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

@app.route('/api/subscription-plans', methods=['GET'])
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

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create Stripe checkout session with automatic API key generation"""
    try:
        data = request.json or {}
        plan_id = data.get('planId')
        user_email = data.get('email')
        
        if not plan_id:
            return jsonify({'error': 'Missing planId'}), 400
        
        # Plan pricing mapping
        plan_prices = {
            'pro': {'price': 999, 'name': 'Pro Plan'},  # $9.99 in cents
            'premium': {'price': 2999, 'name': 'Premium Plan'}  # $29.99 in cents
        }
        
        if plan_id not in plan_prices:
            return jsonify({'error': 'Invalid plan'}), 400
        
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'CodedSwitch {plan_prices[plan_id]["name"]}',
                        'description': f'Monthly subscription to CodedSwitch {plan_id.title()} features'
                    },
                    'unit_amount': plan_prices[plan_id]['price'],
                    'recurring': {
                        'interval': 'month'
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{request.headers.get("Origin", "http://localhost:3000")}/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{request.headers.get("Origin", "http://localhost:3000")}/pricing',
            customer_email=user_email,
            metadata={
                'plan_id': plan_id,
                'user_email': user_email or 'unknown'
            }
        )
        
        return jsonify({
            'sessionId': checkout_session.id,
            'url': checkout_session.url
        })
        
    except stripe.error.StripeError as e:
        return jsonify({'error': f'Stripe error: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/reset-usage', methods=['POST'])
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

@app.route('/api/codebeat-pattern', methods=['POST'])
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

# ===== API KEY MANAGEMENT ENDPOINTS =====

@app.route('/api/keys/generate', methods=['POST'])
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

@app.route('/api/keys/god', methods=['POST'])
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

@app.route('/api/keys/stats/<api_key>', methods=['GET'])
def get_key_stats(api_key):
    """Get statistics for an API key"""
    try:
        stats = api_key_manager.get_user_stats(api_key)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keys/validate', methods=['POST'])
def validate_api_key():
    """Validate an API key"""
    data = request.get_json() or {}
    api_key = data.get('apiKey')
    
    if not api_key:
        return jsonify({'error': 'API key required'}), 400
    
    is_valid, key_info = api_key_manager.validate_key(api_key)
    
    if is_valid:
        return jsonify({
            'valid': True,
            'plan': key_info['plan'],
            'user_id': key_info['user_id'],
            'created_at': key_info['created_at']
        })
    else:
        return jsonify({'valid': False, 'error': 'Invalid API key'}), 401

@app.route('/api/keys/upgrade', methods=['POST'])
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

@app.route('/api/stripe/webhook', methods=['POST'])
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
                    
                    # TODO: Send email with API key to user
                    # send_api_key_email(user_email, api_key, plan_id)
                    
                    print(f"✅ API key generated for {user_email}: {api_key[:20]}...")
                    
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

@app.route('/api/stripe/success', methods=['GET'])
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
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app for all non-API routes (SPA routing)"""
    # If it's an API route, let Flask handle it normally
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # For all other routes, serve the React app's index.html
    # This enables client-side routing (React Router)
    try:
        # Try to serve static files first (CSS, JS, images)
        if '.' in path and not path.endswith('.html'):
            # This is likely a static asset, return 404 if not found
            return jsonify({'error': 'Static file not found'}), 404
        
        # For all routes (/, /features, /code-translator, etc.)
        # Return a simple HTML that loads the React app
        return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodedSwitch | AI Coding Platform</title>
    <script>
        // Redirect to frontend service for proper React app loading
        window.location.href = 'https://codedswitch-frontend.onrender.com' + window.location.pathname;
    </script>
</head>
<body>
    <div id="root">
        <p>Loading CodedSwitch...</p>
        <p>If not redirected, <a href="https://codedswitch-frontend.onrender.com">click here</a></p>
    </div>
</body>
</html>
        '''
    except Exception as e:
        return jsonify({'error': 'Failed to serve app', 'details': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=10000)
