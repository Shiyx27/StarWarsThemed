from google import genai
import cv2, numpy as np, io, time
from PIL import Image
import os

class GeminiFilterGenerator:
    def __init__(self, api_key: str):
        if not api_key or api_key == "YOUR_REAL_KEY_HERE":
            raise ValueError("Please set a valid GEMINI_API_KEY in your .env file")
        
        # NEW SYNTAX: Create client instead of configure
        self.client = genai.Client(api_key=api_key)
        
    def _b64_to_cv(self, raw: bytes):
        pil = Image.open(io.BytesIO(raw)).convert("RGBA")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGBA2BGRA)

    def generate_filter(self, prompt: str) -> dict:
        enhanced_prompt = f"""
        Create a transparent PNG face overlay filter in Star Wars style.
        Dark theme, high contrast, suitable for photobooth overlay.
        
        Filter request: {prompt}
        
        Requirements:
        - Transparent background (PNG)
        - Dark/gothic Star Wars aesthetic
        - High contrast elements
        - Suitable for face overlay
        - Professional quality
        """
        
        try:
            # NEW SYNTAX: Use client.models.generate_content
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=enhanced_prompt
            )
            
            # For now, return a simple success response
            # Note: Image generation might require different model/approach
            name = f"custom_{int(time.time())}"
            
            # Create a simple placeholder filter for testing
            placeholder_filter = np.zeros((100, 100, 4), dtype=np.uint8)
            placeholder_filter[:, :, 3] = 128  # Semi-transparent
            
            return {
                "status": "success",
                "filter_name": name,
                "filter_data": placeholder_filter,
                "description": response.text
            }
            
        except Exception as e:
            return {"status": "error", "message": f"API Error: {str(e)}"}
