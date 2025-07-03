import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'your-gemini-api-key'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'uploads'
    
    # Audio settings
    ENABLE_AUDIO = True
    DEFAULT_VOLUME = 0.5
    
    # Camera settings
    DEFAULT_CAMERA_WIDTH = 1280
    DEFAULT_CAMERA_HEIGHT = 720
    
    # Filter settings
    FILTER_QUALITY = 'high'
    ENABLE_REAL_TIME_FILTERS = True
