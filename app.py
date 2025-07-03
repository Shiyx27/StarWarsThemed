from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import base64
import io
from PIL import Image
import json
from datetime import datetime
from services.gemini_service import GeminiService
from config import Config

app = Flask(__name__, static_folder='static')
app.config.from_object(Config)
CORS(app)

# Initialize services
gemini_service = GeminiService(app.config['GEMINI_API_KEY'])

@app.route('/')
def index():
    """Main photobooth interface"""
    return render_template('index.html')

@app.route('/api/filters')
def get_filters():
    """Get available Sith-themed filters"""
    filters = [
        {
            "id": "sith-lord",
            "name": "Sith Lord Transformation",
            "prompt": "Transform me into a Sith Lord with pale skin, yellow eyes, and dark hood",
            "icon": "⚔️",
            "description": "Embrace the dark side with full Sith transformation"
        },
        {
            "id": "vader-mask",
            "name": "Darth Vader Mask",
            "prompt": "Add Darth Vader's iconic black mask and helmet to my face",
            "icon": "🎭",
            "description": "Become the Dark Lord of the Sith"
        },
        {
            "id": "sith-eyes",
            "name": "Glowing Red Sith Eyes",
            "prompt": "Give me glowing red Sith eyes with dark energy emanating",
            "icon": "👁️",
            "description": "Channel your hatred through burning Sith eyes"
        },
        {
            "id": "dark-corruption",
            "name": "Dark Side Corruption",
            "prompt": "Apply dark side corruption with pale skin and dark veins",
            "icon": "⚡",
            "description": "Show the toll of unlimited power"
        },
        {
            "id": "imperial-officer",
            "name": "Imperial Officer",
            "prompt": "Add Imperial officer uniform with rank insignia and cap",
            "icon": "🎖️",
            "description": "Command the Imperial fleet"
        },
        {
            "id": "lightsaber-duel",
            "name": "Lightsaber Duel Scene",
            "prompt": "Add red lightsaber and dramatic duel lighting effects",
            "icon": "🗡️",
            "description": "Engage in epic lightsaber combat"
        }
    ]
    return jsonify(filters)

@app.route('/api/apply-filter', methods=['POST'])
def apply_filter():
    """Apply Gemini AI filter to image"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        filter_prompt = data.get('prompt')
        
        if not image_data or not filter_prompt:
            return jsonify({'error': 'Missing image or prompt'}), 400
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        
        # Process with Gemini API
        result = gemini_service.process_image_with_filter(image_bytes, filter_prompt)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/capture-photo', methods=['POST'])
def capture_photo():
    """Save captured photo"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        filter_used = data.get('filter', 'none')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode and save image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"sith_photo_{timestamp}_{filter_used}.jpg"
        filepath = os.path.join('uploads', filename)
        
        # Ensure uploads directory exists
        os.makedirs('uploads', exist_ok=True)
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_photo(filename):
    """Download captured photo"""
    try:
        filepath = os.path.join('uploads', filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gallery')
def get_gallery():
    """Get all captured photos"""
    try:
        uploads_dir = 'uploads'
        if not os.path.exists(uploads_dir):
            return jsonify([])
        
        photos = []
        for filename in os.listdir(uploads_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                photos.append({
                    'filename': filename,
                    'url': f'/api/download/{filename}',
                    'timestamp': os.path.getmtime(os.path.join(uploads_dir, filename))
                })
        
        # Sort by timestamp (newest first)
        photos.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(photos)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
