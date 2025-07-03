import os, cv2, datetime, threading
from flask import Flask, Response, render_template, jsonify, request, send_from_directory
from dotenv import load_dotenv
from utils.face_detector import FaceDetector
from utils.filter_manager import FilterManager
from utils.gemini_ai import GeminiFilterGenerator

load_dotenv()                               # reads .env
app = Flask(__name__, static_folder="static")
camera            = cv2.VideoCapture(0)
face_detector     = FaceDetector()
filter_manager    = FilterManager()
gemini_generator  = GeminiFilterGenerator(os.getenv("GEMINI_API_KEY"))
current_filter    = None
output_frame      = None
lock              = threading.Lock()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/gallery")
def gallery():
    imgs = sorted(os.listdir("static/images/captured"), reverse=True)
    return render_template("gallery.html", images=imgs)

def gen_frames():
    global output_frame
    while True:
        success, frame = camera.read()
        if not success:
            break
        frame = cv2.flip(frame, 1)                            # mirror
        faces = face_detector.detect_faces(frame)
        if current_filter and faces != ():
            frame = filter_manager.apply_filter(frame, faces, current_filter)
        ret, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
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
    return jsonify({"status":"success", "filter":name})

@app.route("/generate_custom_filter", methods=["POST"])
def generate_custom_filter():
    prompt = request.json.get("prompt", "")
    if not prompt:
        return jsonify({"status":"error", "message":"Empty prompt"})
    result = gemini_generator.generate_filter(prompt)
    if result["status"] == "success":
        filter_manager.add_custom_filter(result["filter_name"],
                                         result["filter_data"])
        return jsonify({"status":"success",
                        "filter_name":result["filter_name"]})
    return jsonify(result)

@app.route("/capture")
def capture():
    with lock:
        if output_frame is None:
            return jsonify({"status":"error", "msg":"no frame"})
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        fname = f"starwars_{ts}.jpg"
        path  = os.path.join("static/images/captured", fname)
        with open(path,"wb") as f: f.write(output_frame)
    return jsonify({"status":"success","filename":fname})

@app.route("/download/<fname>")
def download(fname):
    return send_from_directory("static/images/captured", fname, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
