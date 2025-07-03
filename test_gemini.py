from dotenv import load_dotenv
import os
from google import genai

# Load environment variables
load_dotenv()

def test_gemini_api():
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ No API key found in .env file")
        return False
    
    if api_key == "YOUR_REAL_KEY_HERE":
        print("❌ Please replace YOUR_REAL_KEY_HERE with your actual API key")
        return False
    
    try:
        # NEW SYNTAX: Create client with API key
        client = genai.Client(api_key=api_key)
        
        # NEW SYNTAX: Use client.models.generate_content
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents='Say hello in Star Wars style'
        )
        
        print("✅ API connection successful!")
        print(f"Response: {response.text}")
        return True
        
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False

if __name__ == "__main__":
    test_gemini_api()
