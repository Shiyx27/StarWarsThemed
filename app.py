import os, cv2, datetime, threading
from flask import Flask, Response, render_template, jsonify, request, send_from_directory, abort
from dotenv import load_dotenv
from utils.face_detector import FaceDetector
from utils.filter_manager import FilterManager
from utils.gemini_ai import GeminiFilterGenerator

load_dotenv()
app = Flask(__name__, static_folder="static")
CAPTURED_DIR = os.path.join(app.static_folder, "images", "captured")

# Global variables
camera = None
face_detector = None
filter_manager = None
gemini_generator = None
current_filter = None
output_frame = None
lock = threading.Lock()

def initialize_app():
    global camera, face_detector, filter_manager, gemini_generator
    camera = cv2.VideoCapture(0)
    face_detector = FaceDetector()
    filter_manager = FilterManager()
    gemini_generator = GeminiFilterGenerator(os.getenv("GEMINI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")
    try:
        images = sorted(os.listdir(CAPTURED_DIR))
    except FileNotFoundError:
        images = []
    # Filter to common image extensions:
    images = [f for f in images if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))]
    return render_template("gallery.html", images=images)

@app.route("/gallery")
def gallery():
    image_dir = "static/images/captured"
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
    
    images = []
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            images.append(filename)
    
    images.sort(reverse=True)  # Most recent first
    return render_template("gallery.html", images=images)

def gen_frames():
    global output_frame, current_filter
    while True:
        success, frame = camera.read()
        if not success:
            break
            
        # Mirror the frame
        frame = cv2.flip(frame, 1)
        
        # Detect faces
        faces = face_detector.detect_faces(frame)
        
        # ✅ FIXED: Use len() instead of != ()
        if current_filter and len(faces) > 0:
            frame = filter_manager.apply_filter(frame, faces, current_filter)
            
        # Encode frame
        ret, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
        
        # Store frame for capture
        with lock:
            output_frame = frame_bytes
            
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
               frame_bytes + b"\r\n")

@app.route("/video_feed")
def video_feed():
    return Response(gen_frames(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/set_filter/<name>")
def set_filter(name):
    global current_filter
    current_filter = None if name == "none" else name
    print(f"Filter set to: {current_filter}")  # Debug line
    return jsonify({"status": "success", "filter": name})

@app.route("/generate_custom_filter", methods=["POST"])
def generate_custom_filter():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        
        if not prompt:
            return jsonify({"status": "error", "message": "Empty prompt"})
        
        result = gemini_generator.generate_filter(prompt)
        
        if result["status"] == "success":
            filter_manager.add_custom_filter(result["filter_name"], result["filter_data"])
            return jsonify({
                "status": "success",
                "filter_name": result["filter_name"],
                "message": "Filter generated successfully!"
            })
        else:
            return jsonify(result)
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/capture")
def capture():
    with lock:
        if output_frame is None:
            return jsonify({"status": "error", "message": "No frame available"})
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"starwars_{timestamp}.jpg"
        filepath = os.path.join("static/images/captured", filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(output_frame)
            
    return jsonify({"status": "success", "filename": filename})

@app.route("/download/<filename>")
def download(filename):
    # Security: prevent path traversal
    if ".." in filename or filename.startswith("/"):
        abort(400)
    return send_from_directory(
        CAPTURED_DIR,
        filename,
        as_attachment=True
    )

if __name__ == "__main__":
    initialize_app()
    app.run(debug=True, threaded=True)
