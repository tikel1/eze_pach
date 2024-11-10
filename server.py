from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv
import base64
from prompts import ANALYSIS_PROMPT

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Create the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

app = Flask(__name__)
CORS(app)

# Add this route to serve the index.html file
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        # Get the image data from the request
        image_data = request.json['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Start chat session
        chat = model.start_chat(history=[])
        
        # Send message with image and the custom prompt
        response = chat.send_message([ANALYSIS_PROMPT, {
            "mime_type": "image/jpeg",
            "data": image_bytes
        }])
        
        # Debug print
        print("AI Response:", response.text)
        
        return jsonify({
            'analysis': response.text
        })

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

if __name__ == '__main__':
    app.run(port=3000, debug=True)