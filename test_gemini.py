from dotenv import load_dotenv
import os
from google import genai
from google.genai.types import HttpOptions

# Load environment variables
load_dotenv()

def test_gemini_api():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_REAL_KEY_HERE":
        print("❌ Please set GEMINI_API_KEY in your .env")
        return False

    try:
        # NEW: Instantiate the Gen AI client with explicit HTTP options
        client = genai.Client(
            http_options=HttpOptions(api_version="v1"),
            api_key=api_key
        )

        # Generate content
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Say hello in Star Wars style"
        )

        print("✅ API connection successful!")
        print(f"Response: {response.text}")
        return True

    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False

if __name__ == "__main__":
    test_gemini_api()
