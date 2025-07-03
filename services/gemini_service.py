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
