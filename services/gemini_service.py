import google.generativeai as genai
from PIL import Image
import io
import base64
import json

class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro-vision-latest')
        
    def process_image_with_filter(self, image_bytes, prompt):
        """
        Process image with Gemini AI for face filter application
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Prepare the enhanced prompt for Star Wars themed filtering
            enhanced_prompt = f"""
            {prompt}
            
            Apply this transformation while maintaining these requirements:
            1. Keep the person's basic facial structure recognizable
            2. Apply Star Wars/Sith aesthetic elements
            3. Use dark, dramatic lighting
            4. Maintain high image quality
            5. Ensure the effect looks realistic and professional
            
            Return a description of what changes were applied and any technical details about the transformation.
            """
            
            # Generate content with Gemini
            response = self.model.generate_content([enhanced_prompt, image])
            
            # Process the response
            result = {
                'success': True,
                'description': response.text,
                'filter_applied': prompt,
                'suggestions': self._extract_suggestions(response.text)
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'description': 'Failed to process image with Gemini AI'
            }
    
    def _extract_suggestions(self, response_text):
        """Extract filter improvement suggestions from Gemini response"""
        suggestions = []
        
        # Parse common suggestions from the response
        if 'lighting' in response_text.lower():
            suggestions.append('Adjust lighting for more dramatic effect')
        if 'contrast' in response_text.lower():
            suggestions.append('Increase contrast for darker Sith aesthetic')
        if 'color' in response_text.lower():
            suggestions.append('Enhance red tones for Sith theme')
            
        return suggestions
    
    def get_filter_recommendations(self, face_analysis):
        """Get personalized filter recommendations based on face analysis"""
        try:
            prompt = f"""
            Based on this facial analysis: {face_analysis}
            
            Recommend the best Star Wars Sith-themed filters that would work well.
            Consider factors like:
            - Face shape and features
            - Lighting conditions
            - Overall composition
            
            Provide 3 specific recommendations with brief explanations.
            """
            
            response = self.model.generate_content(prompt)
            
            return {
                'success': True,
                'recommendations': response.text
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def enhance_mask_image(self, image_base64, mask_id, face_data=None):
        """Compatibility wrapper used by the Flask app.

        For now this method will attempt to call the AI pipeline to get
        enhancement metadata but will return the original image data as
        `processed_image`. This avoids breaking the app if the external
        API does not return image bytes directly.
        """
        try:
            # image_base64 may be a data URL like 'data:image/jpeg;base64,...'
            if ',' in image_base64:
                b64 = image_base64.split(',', 1)[1]
            else:
                b64 = image_base64

            image_bytes = base64.b64decode(b64)

            # Use the existing AI image processing pipeline (best-effort).
            prompt = f"Apply Star Wars themed mask overlay: {mask_id}. Face data: {json.dumps(face_data or {})}"
            ai_result = self.process_image_with_filter(image_bytes, prompt)

            # The current process_image_with_filter returns metadata/descriptions
            # but not modified image bytes. Return the original image as the
            # processed image so the client still receives an image.
            return {
                'success': ai_result.get('success', False),
                'processed_image': image_base64,
                'description': ai_result.get('description'),
                'suggestions': ai_result.get('suggestions')
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
