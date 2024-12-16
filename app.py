import os
from flask import Flask, request, jsonify
import base64
import io
from PIL import Image
from flask_cors import CORS
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
import numpy as np

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load the Hugging Face model and processor
processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

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
    try:
        # Decode base64 string to bytes
        image_bytes = base64.b64decode(image_data)

        # Open the image and convert to grayscale
        img = Image.open(io.BytesIO(image_bytes)).convert('L')  # Convert to grayscale

        # Resize image to 96x96
        img_resized = img.resize((96, 96))

        # Convert the processed grayscale image to base64
        buffered = io.BytesIO()
        img_resized.save(buffered, format="PNG")
        grayscale_image_base64 = base64.b64encode(buffered.getvalue()).decode()

        # Prepare the image for Hugging Face processor (convert back to RGB)
        img_rgb = img_resized.convert('RGB')

        # Preprocess the RGB image using Hugging Face processor
        inputs = processor(images=img_rgb, return_tensors="pt")

        return {
            "grayscale_base64": grayscale_image_base64,
            "processed_inputs": inputs
        }
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

        # Preprocess the image and get intermediate steps
        preprocessing_steps = preprocess_image(image_data)

        # Model evaluation
        inputs = preprocessing_steps["processed_inputs"]
        outputs = model(**inputs)
        predicted_class_idx = torch.argmax(outputs.logits, dim=1).item()

        # Map class index to emotion
        class_names = model.config.id2label  # Class labels from model config
        emotion = class_names[predicted_class_idx]
        emoji = emotion_to_emoji.get(emotion, "🤔")  # Default to thinking face emoji

        # Convert model logits to probabilities (softmax)
        probabilities = torch.nn.functional.softmax(outputs.logits, dim=1).tolist()[0]

        return jsonify({
            "emotion": emotion,
            "emoji": emoji,
            "grayscale_image": preprocessing_steps["grayscale_base64"],
            "model_inputs": inputs["pixel_values"].tolist(),  # Intermediate tensor values
            "model_probabilities": dict(zip(class_names.values(), probabilities))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
