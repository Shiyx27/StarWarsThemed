import cv2
import numpy as np
import os
import urllib.request
from typing import List, Dict

class FaceTracker:
    """Advanced face tracking powered by the Dark Side"""
    
    def __init__(self):
        print("🔍 Initializing Sith face detection...")
        self.cascade_path = self._download_sith_cascade()
        self.face_cascade = cv2.CascadeClassifier(self.cascade_path)
        
        if self.face_cascade.empty():
            raise ValueError("The Dark Side face detection has failed!")
        
        print("✅ Sith face tracker operational")
    
    def _download_sith_cascade(self):
        """Download the face detection model with Sith power"""
        cascade_local = "data/haarcascades/haarcascade_frontalface_default.xml"
        
        if not os.path.exists(cascade_local):
            os.makedirs(os.path.dirname(cascade_local), exist_ok=True)
            url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
            print("📥 Downloading Sith detection algorithms...")
            urllib.request.urlretrieve(url, cascade_local)
            print("✅ Sith algorithms downloaded!")
        
        return cascade_local
    
    def detect_faces_with_landmarks(self, frame: np.ndarray) -> List[Dict]:
        """Detect faces using the power of the Dark Side"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Enhanced detection for Sith purposes
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        face_data = []
        for (x, y, w, h) in faces:
            face_info = {
                'bbox': (x, y, w, h),
                'landmarks': self._generate_sith_landmarks(x, y, w, h),
                'key_points': self._locate_dark_features(x, y, w, h),
                'orientation': {'roll': 0, 'yaw': 0, 'pitch': 0},
                'confidence': 0.9,
                'face_center': (x + w//2, y + h//2),
                'face_size': max(w, h),
                'dark_power': min(100, max(50, w * h // 100))  # Sith power level
            }
            face_data.append(face_info)
        
        return face_data
    
    def _generate_sith_landmarks(self, x, y, w, h):
        """Generate facial landmarks infused with dark energy"""
        landmarks = []
        
        # Create 68 strategic points for Sith mask placement
        for i in range(68):
            if i < 17:  # Jawline - for Vader mask
                lx = x + (i / 16) * w
                ly = y + h - (h * 0.1)
            elif i < 22:  # Eyebrows - for Sith tattoos
                lx = x + w * 0.2 + ((i - 17) / 4) * w * 0.3
                ly = y + h * 0.25
            elif i < 27:  # Other eyebrow
                lx = x + w * 0.5 + ((i - 22) / 4) * w * 0.3
                ly = y + h * 0.25
            elif i < 36:  # Nose bridge - critical for helmet alignment
                lx = x + w * 0.5
                ly = y + h * 0.3 + ((i - 27) / 8) * h * 0.3
            elif i < 42:  # Right eye - for glowing red effects
                lx = x + w * 0.3 + ((i - 36) / 5) * w * 0.15
                ly = y + h * 0.35
            elif i < 48:  # Left eye - for glowing red effects
                lx = x + w * 0.55 + ((i - 42) / 5) * w * 0.15
                ly = y + h * 0.35
            else:  # Mouth area - for breathing apparatus
                lx = x + w * 0.3 + ((i - 48) / 19) * w * 0.4
                ly = y + h * 0.65
            
            landmarks.append([int(lx), int(ly), 0])
        
        return np.array(landmarks)
    
    def _locate_dark_features(self, x, y, w, h):
        """Locate key features for dark side enhancements"""
        return {
            'nose_tip_center': np.array([x + w//2, y + h//2, 0]),
            'mouth_center': np.array([x + w//2, y + int(h * 0.75), 0]),
            'left_eye_center': np.array([x + w//3, y + int(h * 0.4), 0]),
            'right_eye_center': np.array([x + int(w * 0.67), y + int(h * 0.4), 0]),
            'forehead_center': np.array([x + w//2, y + h//4, 0]),
            'chin_center': np.array([x + w//2, y + h, 0]),
            'sith_power_point': np.array([x + w//2, y + h//3, 0]),  # Special Sith energy point
            'dark_aura_center': np.array([x + w//2, y + h//2, 0])   # Center of dark aura
        }
