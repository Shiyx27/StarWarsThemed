from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import base64
import io
from PIL import Image
import json
from datetime import datetime
from services.gemini_service import GeminiService
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize services
gemini_service = GeminiService(app.config['GEMINI_API_KEY'])

@app.route('/')
def index():
    """Main photobooth interface"""
    return render_template('index.html')

@app.route('/api/masks')
def get_masks():
    """Get available Star Wars mask overlays"""
    masks = [
        {
            "id": "none",
            "name": "No Mask",
            "image": None,
            "icon": "🚫",
            "description": "Original camera feed without mask overlay"
        },
        {
            "id": "vader-mask",
            "name": "Darth Vader",
            "image": "/static/masks/vader-mask.png",
            "icon": "🎭",
            "description": "Become the Dark Lord of the Sith"
        },
        {
            "id": "sith-lord",
            "name": "Sith Lord",
            "image": "/static/masks/sith-lord-mask.png",
            "icon": "⚔️",
            "description": "Ancient Sith warrior mask"
        },
        {
            "id": "storm-trooper",
            "name": "Storm Trooper",
            "image": "/static/masks/storm-trooper.png",
            "icon": "🎖️",
            "description": "Imperial Storm Trooper helmet"
        },
        {
            "id": "emperor",
            "name": "Emperor",
            "image": "/static/masks/emperor-mask.png",
            "icon": "👑",
            "description": "Dark Emperor hood and face"
        },
        {
            "id": "kylo-ren",
            "name": "Kylo Ren",
            "image": "/static/masks/kylo-ren-mask.png",
            "icon": "🗡️",
            "description": "Knights of Ren mask"
        },
        {
            "id": "jedi",
            "name": "Jedi Master",
            "image": "/static/masks/jedi-mask.png",
            "icon": "✨",
            "description": "Ancient Jedi Master hood"
        }
    ]
    return jsonify(masks)

@app.route('/static/masks/<filename>')
def serve_mask(filename):
    """Serve mask image files"""
    return send_from_directory('static/masks', filename)

@app.route('/api/apply-mask', methods=['POST'])
def apply_mask():
    """Apply mask overlay to captured image"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        mask_id = data.get('mask_id')
        face_data = data.get('face_data', {})
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Process with mask overlay (server-side processing if needed)
        result = {
            'success': True,
            'processed_image': image_data,  # Client-side processing handles the overlay
            'mask_applied': mask_id,
            'face_detected': bool(face_data)
        }
        
        # Optional: Use Gemini for additional AI processing
        if mask_id != 'none' and app.config.get('ENABLE_AI_PROCESSING'):
            # Call the compatibility wrapper on the GeminiService. It will
            # return metadata and (at minimum) echo the original image back
            # as `processed_image` if a transformed image isn't produced.
            ai_result = gemini_service.enhance_mask_image(image_data, mask_id, face_data)
            if ai_result.get('success'):
                # Merge AI metadata, and prefer AI-processed image when present
                if ai_result.get('processed_image'):
                    result['processed_image'] = ai_result.get('processed_image')
                result.update({k: v for k, v in ai_result.items() if k != 'processed_image'})
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/capture-photo', methods=['POST'])
def capture_photo():
    """Save captured photo with mask overlay"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        mask_used = data.get('mask', 'none')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode and save image (support both data URLs and raw base64)
        if ',' in image_data:
            image_b64 = image_data.split(',', 1)[1]
        else:
            image_b64 = image_data

        image_bytes = base64.b64decode(image_b64)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"sith_photo_{timestamp}_{mask_used}.jpg"
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
        uploads_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
        filepath = os.path.join(uploads_dir, filename)
        if os.path.exists(filepath):
            # Use send_from_directory for safer downloads
            return send_from_directory(directory=uploads_dir, path=filename, as_attachment=True)
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


@app.route('/api/delete-photo/<path:filename>', methods=['DELETE'])
def delete_photo(filename):
    """Delete a photo from the uploads directory."""
    try:
        uploads_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
        # Secure the filename (avoid directory traversal)
        safe_name = secure_filename(filename)
        filepath = os.path.join(uploads_dir, safe_name)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        os.remove(filepath)
        return jsonify({'success': True, 'deleted': safe_name}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload-model', methods=['POST'])
def upload_model():
    """Upload a MediaPipe .task model to static/models for local loading by the frontend."""
    try:
        if 'model' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['model']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        models_dir = os.path.join(app.root_path, 'static', 'models')
        os.makedirs(models_dir, exist_ok=True)
        save_path = os.path.join(models_dir, filename)

        # Read file bytes to validate size before saving
        file_bytes = file.read()
        min_size = int(app.config.get('MODEL_MINIMUM_BYTES', 50 * 1024))  # default 50KB
        if len(file_bytes) < min_size:
            return jsonify({'error': 'Uploaded file is too small to be a valid model'}), 400

        # Write bytes to disk
        with open(save_path, 'wb') as f:
            f.write(file_bytes)

        return jsonify({'success': True, 'path': f'/static/models/{filename}', 'size': len(file_bytes)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
