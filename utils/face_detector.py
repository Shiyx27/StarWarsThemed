import cv2
import os
import urllib.request

CASCADE_LOCAL = "data/haarcascades/lbpcascade_frontalface.xml"
CASCADE_URL   = "https://raw.githubusercontent.com/opencv/opencv/master/data/lbpcascades/lbpcascade_frontalface.xml"

class FaceDetector:
    def __init__(self, downscale=2, skip_frames=2):
        """
        downscale: factor by which to shrink the incoming frame before detection
        skip_frames: detect only once every N frames
        """
        self.downscale   = downscale
        self.skip_frames = skip_frames
        self.frame_count = 0

        self.cascade_path = self._ensure_cascade_file()
        self.cascade      = cv2.CascadeClassifier(self.cascade_path)
        if self.cascade.empty():
            raise ValueError(f"Failed to load LBP cascade from {self.cascade_path}")

    def _ensure_cascade_file(self):
        os.makedirs(os.path.dirname(CASCADE_LOCAL), exist_ok=True)
        if not os.path.exists(CASCADE_LOCAL):
            print("📥 Downloading LBP cascade (faster) …")
            urllib.request.urlretrieve(CASCADE_URL, CASCADE_LOCAL)
        return CASCADE_LOCAL

    def detect_faces(self, frame):
        # Only run detection once every skip_frames
        self.frame_count = (self.frame_count + 1) % self.skip_frames
        if self.frame_count != 0:
            return []

        # 1) downscale to speed up detection
        h, w = frame.shape[:2]
        small = cv2.resize(frame, (w // self.downscale, h // self.downscale))
        gray  = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # 2) use LBP cascade which is much faster (but slightly less accurate)
        faces = self.cascade.detectMultiScale(
            gray,
            scaleFactor=1.2,    # larger steps = fewer scales to test
            minNeighbors=3,     # lower => more detections (and more false positives)
            flags=cv2.CASCADE_SCALE_IMAGE,
            minSize=(20, 20)    # smaller window
        )

        # 3) scale the coordinates back up to original frame size
        faces = [(x*self.downscale, y*self.downscale,
                  w*self.downscale, h*self.downscale) for (x,y,w,h) in faces]
        return faces
