import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# Optional music generation import
try:
    from musicgen_backend import generate_instrumental
    MUSIC_GENERATION_AVAILABLE = True
except ImportError as e:
    print(f"Music generation not available: {e}")
    MUSIC_GENERATION_AVAILABLE = False
    def generate_instrumental(*args, **kwargs):
        return {"error": "Music generation not available - missing dependencies"}


app = Flask(__name__)
CORS(app, origins=[
    "https://www.codedswitch.com",
    "https://codedswitch-frontend.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
])


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
                "model": "grok-1",  # Replace with the correct Grok model name if needed
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
    '''Dispatch to multiple AI providers based on 'provider' param.'''
    data = request.json or {}
    prompt = data.get('prompt')
    max_tokens = data.get('max_tokens', 200)
    provider = data.get('provider', os.environ.get('DEFAULT_AI_PROVIDER', 'gpt')).lower()
    if not prompt:
        return jsonify({'error': 'Missing prompt'}), 400

    # Only Grok API supported - redirect to dedicated endpoint
    return ai_proxy()

from flask import send_file  # type: ignore[reportMissingImports]

@app.route('/api/generate-music', methods=['POST'])
def generate_music():
    """Generate instrumental music using MusicGen and return the WAV file directly."""
    data = request.json or {}
    prompt = data.get('prompt', '')
    lyrics = data.get('lyrics', '')
    duration = int(data.get('duration', 30))
    try:
        wav_path = generate_instrumental(lyrics, prompt, duration)
        # Serve the WAV file directly
        return send_file(wav_path, mimetype='audio/wav', as_attachment=True, download_name='musicgen_output.wav')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/music-file', methods=['GET'])
def serve_music_file():
    """Serve a WAV file by absolute path (with basic validation)."""
    wav_path = request.args.get('path')
    if not wav_path or not wav_path.endswith('.wav'):
        return jsonify({"error": "Invalid file path."}), 400
    # Optional: restrict to temp/cache dir for security
    import tempfile, os
    cache_dir = os.path.join(tempfile.gettempdir(), "beatstudio_musicgen_cache")
    if not os.path.abspath(wav_path).startswith(os.path.abspath(cache_dir)):
        return jsonify({"error": "Access denied."}), 403
    if not os.path.exists(wav_path):
        return jsonify({"error": "File not found."}), 404
    return send_file(wav_path, mimetype='audio/wav', as_attachment=True, download_name='musicgen_output.wav')


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
                "model": "grok-1",
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
