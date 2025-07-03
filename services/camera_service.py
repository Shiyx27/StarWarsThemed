"""
Camera Service for Star Wars Photobooth
Handles camera utilities and image processing
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import io
import base64
import logging

class CameraService:
    """Camera utilities and image processing service"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def process_image_data(self, image_data):
        """Process base64 image data"""
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            return image
            
        except Exception as e:
            self.logger.error(f"Error processing image data: {e}")
            return None
    
    def apply_sith_filter(self, image, filter_type):
        """Apply Sith-themed filters to image"""
        try:
            if not image:
                return None
                
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply filter based on type
            if filter_type == 'sith-lord':
                return self._apply_sith_lord_filter(image)
            elif filter_type == 'vader-mask':
                return self._apply_vader_mask_filter(image)
            elif filter_type == 'sith-eyes':
                return self._apply_sith_eyes_filter(image)
            elif filter_type == 'dark-corruption':
                return self._apply_dark_corruption_filter(image)
            elif filter_type == 'imperial-officer':
                return self._apply_imperial_officer_filter(image)
            elif filter_type == 'lightsaber-duel':
                return self._apply_lightsaber_duel_filter(image)
            else:
                return image
                
        except Exception as e:
            self.logger.error(f"Error applying filter {filter_type}: {e}")
            return image
    
    def _apply_sith_lord_filter(self, image):
        """Apply Sith Lord transformation"""
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.3)
        
        # Reduce brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.8)
        
        # Adjust color balance for pale skin
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(0.7)
        
        return image
    
    def _apply_vader_mask_filter(self, image):
        """Apply Vader mask effect"""
        # High contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # Darken
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.6)
        
        # Slight desaturation
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(0.8)
        
        return image
    
    def _apply_sith_eyes_filter(self, image):
        """Apply glowing red Sith eyes effect"""
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # Slight brightness boost
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.9)
        
        return image
    
    def _apply_dark_corruption_filter(self, image):
        """Apply dark side corruption effect"""
        # High contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.4)
        
        # Reduce brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.7)
        
        # Desaturate
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(0.5)
        
        return image
    
    def _apply_imperial_officer_filter(self, image):
        """Apply Imperial Officer look"""
        # Slight contrast boost
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.1)
        
        # Maintain brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.95)
        
        return image
    
    def _apply_lightsaber_duel_filter(self, image):
        """Apply lightsaber duel lighting effect"""
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.3)
        
        # Boost brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.1)
        
        # Enhance saturation
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.2)
        
        return image
    
    def detect_faces(self, image):
        """Detect faces in image using OpenCV"""
        try:
            # Convert PIL to OpenCV format
            open_cv_image = np.array(image)
            open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)
            
            # Load face cascade
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            
            # Convert to grayscale
            gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            return len(faces) > 0, faces
            
        except Exception as e:
            self.logger.error(f"Error detecting faces: {e}")
            return False, []
    
    def optimize_image(self, image, max_width=1280, max_height=720, quality=85):
        """Optimize image for web delivery"""
        try:
            # Calculate new dimensions
            ratio = min(max_width / image.width, max_height / image.height)
            if ratio < 1:
                new_width = int(image.width * ratio)
                new_height = int(image.height * ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save optimized image
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            self.logger.error(f"Error optimizing image: {e}")
            return None
