from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2
import base64
import io
import os
import json
import time

class GeminiFilterGenerator:
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash-preview-image-generation"
        self.generated_filters = {}
        
    def generate_filter(self, prompt):
        """Generate a custom Star Wars filter using Gemini AI"""
        try:
            # Create a Star Wars themed prompt
            starwars_prompt = f"""
            Create a Star Wars themed face filter overlay for a photobooth app. 
            The filter should be: {prompt}
            
            Requirements:
            - Transparent background
            - Suitable for overlaying on a face
            - Star Wars aesthetic
            - High contrast and clear details
            - Should work as a face mask or accessory
            
            Generate a detailed, high-quality filter that captures the essence of: {prompt}
            """
            
            # Generate image using Gemini
            response = self.client.models.generate_content(
                model=self.model,
                contents=starwars_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE']
                )
            )
            
            # Process the response
            filter_data = None
            description = ""
            
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    description = part.text
                elif part.inline_data is not None:
                    # Convert image data to OpenCV format
                    image_data = part.inline_data.data
                    filter_data = self._process_generated_image(image_data)
            
            if filter_data is not None:
                # Generate unique filter name
                filter_name = f"custom_{int(time.time())}"
                
                # Save the filter
                self.generated_filters[filter_name] = {
                    'data': filter_data,
                    'description': description,
                    'prompt': prompt
                }
                
                return {
                    'status': 'success',
                    'filter_name': filter_name,
                    'filter_data': filter_data,
                    'description': description
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Failed to generate filter image'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error generating filter: {str(e)}'
            }
    
    def _process_generated_image(self, image_data):
        """Process the generated image for use as a filter"""
        try:
            # Convert base64 to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGBA if not already
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # Convert PIL to OpenCV
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGBA2BGRA)
            
            return opencv_image
            
        except Exception as e:
            print(f"Error processing generated image: {e}")
            return None
    
    def generate_text_overlay(self, text, style="jedi"):
        """Generate text overlays with Star Wars styling"""
        try:
            prompt = f"""
            Create a Star Wars themed text overlay that says "{text}" in {style} style.
            
            Requirements:
            - Transparent background
            - Star Wars font styling
            - Glowing effect
            - High contrast
            - Suitable for overlay on photos
            
            Style should match {style} aesthetic from Star Wars universe.
            """
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE']
                )
            )
            
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    return self._process_generated_image(part.inline_data.data)
            
            return None
            
        except Exception as e:
            print(f"Error generating text overlay: {e}")
            return None
    
    def enhance_existing_filter(self, base_filter, enhancement_prompt):
        """Enhance an existing filter using Gemini"""
        try:
            # Convert OpenCV image to base64 for Gemini
            _, buffer = cv2.imencode('.png', base_filter)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            # Create enhancement prompt
            prompt = f"""
            Enhance this Star Wars filter with the following modification: {enhancement_prompt}
            
            Keep the original Star Wars aesthetic but add the requested enhancement.
            Maintain transparency where appropriate.
            """
            
            # Send to Gemini for enhancement
            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    prompt,
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": base64_image
                        }
                    }
                ],
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE']
                )
            )
            
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    return self._process_generated_image(part.inline_data.data)
            
            return None
            
        except Exception as e:
            print(f"Error enhancing filter: {e}")
            return None
