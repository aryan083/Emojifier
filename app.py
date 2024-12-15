import os
from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask_cors import CORS
import base64
import io
from PIL import Image

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load the trained Keras model
model_path = "model/cnn_emotion_detection.h5"  # Update to the correct model .h5 file path
emotion_model = load_model(model_path)

# Emotion to emoji mapping
emotion_to_emoji = {
    "neutral": "\ud83d\ude10",
    "happy": "\ud83d\ude0a",
    "sad": "\ud83d\ude22",
    "surprise": "\ud83d\ude32",
    "fear": "\ud83d\ude28",
    "disgust": "\ud83e\udd2c",
    "anger": "\ud83d\ude20",
    "contempt": "\ud83d\ude12"
}

# Helper function to preprocess image
def preprocess_image(image_data):
    try:
        # Decode base64 string to bytes
        image_bytes = base64.b64decode(image_data)

        # Create image from bytes
        img = Image.open(io.BytesIO(image_bytes)).convert('L')  # Convert to grayscale

        # Resize image to match the input shape of the model (48x48 for grayscale input)
        img = img.resize((48, 48))

        # Convert to numpy array and scale pixel values to [0, 1]
        img_array = np.array(img).astype('float32') / 255.0

        # Add channel and batch dimensions
        img_array = np.expand_dims(img_array, axis=-1)  # Add channel dimension for grayscale
        img_array = np.expand_dims(img_array, axis=0)   # Add batch dimension

        return img_array
    except Exception as e:
        print("Error in preprocess_image:", str(e))
        raise

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        image_data = data['image']

        # Preprocess image
        image_preprocessed = preprocess_image(image_data)

        # Make prediction
        predictions = emotion_model.predict(image_preprocessed)
        predicted_class = np.argmax(predictions, axis=1)[0]

        # Map class index to emotion
        class_names = ["anger", "contempt", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        emotion = class_names[predicted_class]
        emoji = emotion_to_emoji.get(emotion, "\ud83e\udd14")  # Default to thinking face emoji

        return jsonify({'emotion': emotion, 'emoji': emoji})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
