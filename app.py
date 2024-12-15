import os
from flask import Flask, request, jsonify
import numpy as np
import joblib
from PIL import Image
import base64
import io
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load the trained model and preprocessing tools
model_path = "model/svm_model.pkl"
scaler_path = "model/scaler.pkl"
pca_path = "model/pca.pkl"
lda_path = "model/lda.pkl"

# Load model and preprocessing tools
svm_model = joblib.load(model_path)
scaler = joblib.load(scaler_path)
pca = joblib.load(pca_path) if os.path.exists(pca_path) else None
lda = joblib.load(lda_path) if os.path.exists(lda_path) else None

# Emotion to emoji mapping
emotion_to_emoji = {
    "neutral": "😐",
    "happy": "😊",
    "sad": "😢",
    "surprise": "😲",
    "fear": "😨",
    "disgust": "🤢",
    "anger": "😠",
    "contempt": "😒"
}

# Helper function to preprocess image
def preprocess_image(image_data):
    # Remove the "data:image/png;base64," prefix if present
    if ',' in image_data:
        image_data = image_data.split(',')[1]
    
    # Decode base64 string to bytes
    image_bytes = base64.b64decode(image_data)
    
    # Create image from bytes
    img = Image.open(io.BytesIO(image_bytes)).convert('L')  # Convert to grayscale
    
    # Resize image to the required dimensions
    img = img.resize((66, 66))
    
    # Convert to numpy array and flatten
    img_array = np.array(img).flatten()
    
    return img_array

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        data = request.get_json() # Raw request data

        print("Received raw data:", data)
        # data_json = request.json  # Try parsing the JSON
        # print("Decoded JSON:", request.json)
        image_data = data.get('image')
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400

        # Preprocess and predict
        image = preprocess_image(image_data)
        image_scaled = scaler.transform([image])

        if pca:
            image_scaled = pca.transform(image_scaled)
        if lda:
            image_scaled = lda.transform(image_scaled)

        prediction = svm_model.predict(image_scaled)[0]
        emoji = emotion_to_emoji.get(prediction, "🤔")

        return jsonify({'emotion': prediction, 'emoji': emoji})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)