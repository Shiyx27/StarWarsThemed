import os
import cv2
import datetime
import threading
import time
import random
import numpy as np
from flask import Flask, Response, render_template, jsonify, request, send_from_directory
from dotenv import load_dotenv

# Import all utilities with correct names
from utils.face_tracker import FaceTracker
from utils.mask_engine import SithMaskEngine
from utils.performance_optimizer import PerformanceOptimizer
from utils.gemini_ai import SithAIGenerator
from utils.sith_effects import DarkSideEffects

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# Global variables
camera = None
face_tracker = None
mask_engine = None
performance_optimizer = None
ai_generator = None
effects_engine = None
current_filter = None
output_frame = None
lock = threading.Lock()

# Sith easter egg counters
sith_secrets_unlocked = 0
dark_side_level = 1

def initialize_dark_side():
    """Initialize the dark side of the Force"""
    global camera, face_tracker, mask_engine, performance_optimizer, ai_generator, effects_engine
    
    print("🌑 Awakening the Dark Side...")
    print("⚡ The Sith Lords are watching...")
    
    # Initialize camera with enhanced settings
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    camera.set(cv2.CAP_PROP_FPS, 30)
    camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    # Initialize all components
    face_tracker = FaceTracker()
    mask_engine = SithMaskEngine()
    performance_optimizer = PerformanceOptimizer()
    effects_engine = DarkSideEffects()
    
    # Initialize AI generator
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key and api_key != 'your_gemini_api_key_here':
        ai_generator = SithAIGenerator(api_key)
    else:
        ai_generator = SithAIGenerator()
    
    print("✅ The Dark Side is fully operational")
    print("💀 Emperor Palpatine would be proud...")

@app.route('/')
def sith_temple():
    """Enter the Sith Temple"""
    return render_template('sith_index.html', dark_level=dark_side_level)

@app.route('/dark_gallery')
def dark_gallery():
    """View the gallery of dark moments"""
    image_dir = 'static/images/captured'
    os.makedirs(image_dir, exist_ok=True)
    
    images = []
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            filepath = os.path.join(image_dir, filename)
            stat = os.stat(filepath)
            images.append({
                'filename': filename,
                'timestamp': stat.st_mtime,
                'date': datetime.datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                'size': stat.st_size
            })
    
    images.sort(key=lambda x: x['timestamp'], reverse=True)
    return render_template('sith_gallery.html', images=images, secrets=sith_secrets_unlocked)

def generate_dark_frames():
    """Generate video frames with dark side enhancements"""
    global output_frame, current_filter, sith_secrets_unlocked
    
    frame_count = 0
    last_easter_egg = time.time()
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        frame_count += 1
        frame = cv2.flip(frame, 1)  # Mirror effect
        
        # Dark side performance optimization
        if performance_optimizer.should_skip_frame(frame_count):
            continue
        
        # Detect faces with the power of the dark side
        face_data = face_tracker.detect_faces_with_landmarks(frame)
        
        # Apply Sith filters and effects
        if current_filter and face_data:
            frame = mask_engine.apply_sith_mask(frame, face_data, current_filter)
            frame = effects_engine.channel_dark_force(frame, current_filter, face_data)
        
        # Random Sith easter eggs
        if time.time() - last_easter_egg > 30:  # Every 30 seconds
            if random.random() < 0.1:  # 10% chance
                frame = effects_engine.add_sith_easter_egg(frame)
                last_easter_egg = time.time()
        
        # Add dark side UI elements
        frame = add_sith_ui(frame)
        
        # Encode with darkness
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        frame_bytes = buffer.tobytes()
        
        with lock:
            output_frame = frame_bytes
        
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

def add_sith_ui(frame):
    """Add Sith-themed UI elements"""
    h, w = frame.shape[:2]
    
    # Add "The Dark Side" watermark
    cv2.putText(frame, "THE DARK SIDE", (w - 200, h - 20), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    
    # Add Sith symbol (simple red triangle)
    pts = np.array([[w-30, h-60], [w-40, h-40], [w-20, h-40]], np.int32)
    cv2.fillPoly(frame, [pts], (0, 0, 200))
    
    return frame

# FIXED: Changed function name to match the url_for call in template
@app.route('/video_feed')
def video_feed():
    """Stream the dark side vision"""
    return Response(generate_dark_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/embrace_filter/<filter_name>')
def embrace_filter(filter_name):
    """Embrace the power of a Sith filter"""
    global current_filter, sith_secrets_unlocked
    
    current_filter = None if filter_name == 'none' else filter_name
    
    # Sith easter egg triggers
    sith_triggers = ['vader', 'emperor', 'kylo', 'maul', 'sith']
    if any(trigger in filter_name for trigger in sith_triggers):
        sith_secrets_unlocked += 1
    
    return jsonify({
        'status': 'success',
        'filter': filter_name,
        'dark_message': get_sith_message(filter_name),
        'secrets_unlocked': sith_secrets_unlocked,
        'sound_effect': get_filter_sound(filter_name)
    })

def get_sith_message(filter_name):
    """Get appropriate Sith message for filter"""
    messages = {
        'none': 'The Force is dormant...',
        'vader': 'You have become more machine than man... 🤖',
        'emperor': 'Feel the power of the Dark Side! ⚡',
        'kylo': 'Let the past die. Kill it if you have to. 🔥',
        'maul': 'At last we will reveal ourselves to the Jedi... ⚔️',
        'sith': 'Your hatred has made you powerful... 💀',
        'stormtrooper': 'Move along... these are not the droids you seek. 🛸'
    }
    return messages.get(filter_name, 'The Dark Side flows through you... 🌑')

def get_filter_sound(filter_name):
    """Get sound effect for filter"""
    sounds = {
        'vader': 'vader_breathing',
        'emperor': 'force_lightning',
        'kylo': 'unstable_saber',
        'maul': 'dual_saber',
        'sith': 'dark_power',
        'none': 'filter_off'
    }
    return sounds.get(filter_name, 'sith_activation')

@app.route('/summon_dark_filter', methods=['POST'])
def summon_dark_filter():
    """Summon a custom filter using dark AI magic"""
    if not ai_generator:
        return jsonify({
            'status': 'error',
            'message': 'The Dark Side AI is not available'
        })
    
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        
        if not prompt:
            return jsonify({
                'status': 'error',
                'message': 'You must speak your dark desires...'
            })
        
        # Enhance prompt with Sith darkness
        dark_prompt = f"Dark Sith themed {prompt} with evil red glowing effects and menacing appearance"
        
        result = ai_generator.forge_dark_filter(dark_prompt)
        
        if result['status'] == 'success':
            mask_engine.add_sith_creation(
                result['filter_name'],
                result['filter_data'],
                result.get('config', {})
            )
            
            return jsonify({
                'status': 'success',
                'filter_name': result['filter_name'],
                'message': '🌑 The Dark Side has granted your wish!',
                'dark_blessing': 'Your creation shall serve the Empire...',
                'sound_effect': 'ai_creation_complete'
            })
        else:
            return jsonify(result)
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'The Dark Side has failed you: {str(e)}'
        })

@app.route('/capture_dark_moment')
def capture_dark_moment():
    """Capture a moment for the Sith archives"""
    with lock:
        if output_frame is None:
            return jsonify({
                'status': 'error',
                'message': 'The Dark Side vision is not ready'
            })
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filter_suffix = f"_{current_filter}" if current_filter else ""
        filename = f"sith_lord{filter_suffix}_{timestamp}.jpg"
        filepath = os.path.join('static/images/captured', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'wb') as f:
            f.write(output_frame)
        
        return jsonify({
            'status': 'success',
            'filename': filename,
            'message': '📸 Added to the Sith Archives!',
            'dark_quote': get_random_sith_quote(),
            'sound_effect': 'camera_capture'
        })

def get_random_sith_quote():
    """Get a random Sith quote"""
    quotes = [
        "Your journey to the Dark Side is complete.",
        "Power! Unlimited power!",
        "Good... let the hate flow through you.",
        "The Force is strong with this one.",
        "You underestimate the power of the Dark Side.",
        "Fear leads to anger, anger leads to hate.",
        "Strike me down and I shall become more powerful."
    ]
    return random.choice(quotes)

@app.route('/download/<filename>')
def download_dark_archive(filename):
    """Download from the Sith archives"""
    return send_from_directory('static/images/captured', filename, as_attachment=True)

@app.route('/sith_secrets')
def reveal_sith_secrets():
    """Reveal hidden Sith secrets"""
    secrets = {
        'level': dark_side_level,
        'unlocked': sith_secrets_unlocked,
        'total_secrets': 10,
        'next_unlock': 'Use 5 different Sith filters to unlock Emperor mode'
    }
    return jsonify(secrets)

@app.route('/sith_performance')
def sith_performance():
    """Get Sith performance statistics"""
    stats = performance_optimizer.get_dark_stats()
    stats.update({
        'active_filter': current_filter,
        'secrets_unlocked': sith_secrets_unlocked,
        'dark_level': dark_side_level
    })
    return jsonify(stats)

if __name__ == '__main__':
    initialize_dark_side()
    print("🌟 The Sith Photobooth rises...")
    print("⚡ Access the Dark Side at: http://127.0.0.1:5000")
    app.run(debug=True, threaded=True, host='0.0.0.0', port=5000)
