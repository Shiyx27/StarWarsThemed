import cv2
import os
import urllib.request

CASCADE_LOCAL = "data/haarcascades/haarcascade_frontalface_default.xml"
CASCADE_URL = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"

class FaceDetector:
    def __init__(self):
        self.cascade_path = self._ensure_cascade_file()
        self.cascade = cv2.CascadeClassifier(self.cascade_path)
        
        # Verify the cascade loaded successfully
        if self.cascade.empty():
            raise ValueError(f"Failed to load Haar cascade from {self.cascade_path}")
    
    def _ensure_cascade_file(self):
        """Download cascade file if it doesn't exist or is corrupted"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(CASCADE_LOCAL), exist_ok=True)
        
        # Check if file exists and is valid
        if os.path.exists(CASCADE_LOCAL):
            try:
                # Test if file can be loaded
                test_cascade = cv2.CascadeClassifier(CASCADE_LOCAL)
                if not test_cascade.empty():
                    print(f"✅ Using existing cascade file: {CASCADE_LOCAL}")
                    return CASCADE_LOCAL
                else:
                    print(f"⚠️ Existing cascade file is corrupted, re-downloading...")
                    os.remove(CASCADE_LOCAL)
            except:
                print(f"⚠️ Error loading existing cascade file, re-downloading...")
                if os.path.exists(CASCADE_LOCAL):
                    os.remove(CASCADE_LOCAL)
        
        # Download the file
        print(f"📥 Downloading Haar cascade file...")
        try:
            urllib.request.urlretrieve(CASCADE_URL, CASCADE_LOCAL)
            print(f"✅ Download completed: {CASCADE_LOCAL}")
            
            # Verify the downloaded file
            test_cascade = cv2.CascadeClassifier(CASCADE_LOCAL)
            if test_cascade.empty():
                raise ValueError("Downloaded cascade file is invalid")
                
            return CASCADE_LOCAL
            
        except Exception as e:
            raise RuntimeError(f"Failed to download cascade file: {e}")
    
    def detect_faces(self, frame):
        """Detect faces in the frame and return coordinates"""
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
        except Exception as e:
            print(f"Error in face detection: {e}")
            return []
