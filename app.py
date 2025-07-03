from flask import Flask, render_template, Response, request, jsonify, send_from_directory
import cv2
import numpy as np
import os
import datetime
from utils.face_detector import FaceDetector
from utils.filter_manager import FilterManager
from utils.gemini_filter_generator import GeminiFilterGenerator
import threading
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Global variables
camera = None
face_detector = None
filter_manager = None
gemini_generator = None
current_filter = None
output_frame = None
lock = threading.Lock()

# Initialize components
def initialize_app():
    global camera, face_detector, filter_manager, gemini_generator
    camera = cv2.VideoCapture(0)
    face_detector = FaceDetector()
    filter_manager = FilterManager()
    gemini_generator = GeminiFilterGenerator(os.getenv('GEMINI_API_KEY'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/gallery')
def gallery():
    # Get all captured images
    image_dir = 'static/images/captured'
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
    
    images = []
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            images.append(filename)
    
    images.sort(reverse=True)  # Most recent first
    return render_template('gallery.html', images=images)

def generate_frames():
    global output_frame, lock, current_filter
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        # Flip frame horizontally for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Detect faces
        faces = face_detector.detect_faces(frame)
        
        # Apply filter if selected and faces detected
        if current_filter and len(faces) > 0:
            frame = filter_manager.apply_filter(frame, faces, current_filter)
        
        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        
        # Store frame for capture
        with lock:
            output_frame = frame
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/set_filter/<filter_name>')
def set_filter(filter_name):
    global current_filter
    current_filter = filter_name if filter_name != 'none' else None
    return jsonify({'status': 'success', 'filter': filter_name})

@app.route('/generate_custom_filter', methods=['POST'])
def generate_custom_filter():
    """Generate a custom filter using Gemini AI"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'status': 'error', 'message': 'No prompt provided'})
        
        # Generate filter using Gemini
        filter_result = gemini_generator.generate_filter(prompt)
        
        if filter_result['status'] == 'success':
            # Add the new filter to filter manager
            filter_manager.add_custom_filter(filter_result['filter_name'], filter_result['filter_data'])
            return jsonify({
                'status': 'success', 
                'filter_name': filter_result['filter_name'],
                'message': 'Custom filter generated successfully!'
            })
        else:
            return jsonify({'status': 'error', 'message': filter_result['message']})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/capture')
def capture():
    global output_frame, lock
    
    with lock:
        if output_frame is not None:
            # Generate unique filename
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"starwars_photo_{timestamp}.jpg"
            filepath = os.path.join('static/images/captured', filename)
            
            # Save the frame
            with open(filepath, 'wb') as f:
                f.write(output_frame)
            
            return jsonify({'status': 'success', 'filename': filename})
    
    return jsonify({'status': 'error', 'message': 'No frame available'})

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory('static/images/captured', filename, as_attachment=True)

if __name__ == '__main__':
    initialize_app()
    app.run(debug=True, threaded=True)
