import os
import time
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app)

# Simple health check endpoint
@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "CodedSwitch backend is running"})

# CORS preflight handler
def _build_cors_preflight_response():
    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-Key")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
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
        print(f"Generating music for prompt: {prompt[:100]}... (duration: {duration}s)")
        
        # Generate the audio file with both lyrics and prompt parameters
        output_path = generate_instrumental(lyrics=prompt, prompt=prompt, duration=duration)
        
        if not output_path or not os.path.exists(output_path):
            raise Exception("Failed to generate audio file - no output file was created")
            
        # Log successful generation
        file_size = os.path.getsize(output_path) / (1024 * 1024)  # Size in MB
        print(f"Successfully generated music: {output_path} ({file_size:.2f} MB)")
        
        # Return the audio file directly
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f"codedswitch_music_{int(time.time())}.wav"
        )
        
    except Exception as e:
        error_msg = f"Error generating music: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    # Start the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
