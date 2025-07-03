import cv2
import os

class FaceDetector:
    def __init__(self):
        # Load the face cascade classifier
        cascade_path = 'haarcascades/haarcascade_frontalface_default.xml'
        if not os.path.exists(cascade_path):
            # Download if not exists
            self.download_cascade()
        
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
    
    def download_cascade(self):
        """Download the haar cascade file if it doesn't exist"""
        import urllib.request
        
        os.makedirs('haarcascades', exist_ok=True)
        url = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml'
        urllib.request.urlretrieve(url, 'haarcascades/haarcascade_frontalface_default.xml')
    
    def detect_faces(self, frame):
        """Detect faces in the frame and return coordinates"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
