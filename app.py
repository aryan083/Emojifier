import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import numpy as np
from transformers import ViTFeatureExtractor, ViTForImageClassification
import torch

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load the Hugging Face model and feature extractor
model_name = "dima806/face_emotions_image_detection"
feature_extractor = ViTFeatureExtractor.from_pretrained(model_name)
emotion_model = ViTForImageClassification.from_pretrained(model_name)

# Emotion to emoji mapping
emotion_to_emoji = {
    "neutral": "\ud83d\ude10",
    "happy": "😊",
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
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')  # Convert to RGB

        # Resize and preprocess image
        inputs = feature_extractor(images=img, return_tensors="pt")
        return inputs
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
        inputs = preprocess_image(image_data)

        # Make prediction
        outputs = emotion_model(**inputs)
        predicted_class = torch.argmax(outputs.logits, dim=1).item()

        # Map class index to emotion
        class_names = emotion_model.config.id2label  # Class labels from model config
        emotion = class_names[predicted_class]
        emoji = emotion_to_emoji.get(emotion, "\ud83e\udd14")  # Default to thinking face emoji

        return jsonify({'emotion': emotion, 'emoji': emoji})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
