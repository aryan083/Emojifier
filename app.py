from flask import Flask, request, jsonify
import base64
import io
from PIL import Image
from flask_cors import CORS
from transformers import pipeline

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load the Hugging Face pipeline
pipe = pipeline("image-classification", model="trpakov/vit-face-expression")

# Emotion to emoji mapping
emotion_to_emoji = {
    "angry": "\ud83d\ude20",
    "disgust": "\ud83e\udd2e",
    "fear": "\ud83d\ude28",
    "happy": "\ud83d\ude0a",
    "sad": "\ud83d\ude22",
    "surprise": "\ud83d\ude32",
    "neutral": "\ud83d\ude10"
}

def preprocess_image(image_data):
    try:
        # Decode base64 string to bytes
        image_bytes = base64.b64decode(image_data)

        # Open the image
        img = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Save grayscale version for response
        img_gray = img.convert('L')
        buffered = io.BytesIO()
        img_gray.save(buffered, format="PNG")
        grayscale_image_base64 = base64.b64encode(buffered.getvalue()).decode()

        return {
            "image": img,
            "grayscale_base64": grayscale_image_base64
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

        # Preprocess image and get steps
        preprocessing_results = preprocess_image(data['image'])
        img = preprocessing_results["image"]

        # Run inference
        predictions = pipe(img)
        top_prediction = predictions[0]

        emotion = top_prediction['label'].lower()
        emoji = emotion_to_emoji.get(emotion, "\ud83e\udd14")

        # Get probabilities for all emotions
        prob_dict = {pred['label'].lower(): float(pred['score']) for pred in predictions}

        # Detailed process steps
        process_steps = {
            "image_acquisition": [
                "Webcam capture using getUserMedia API",
                "Canvas API used for image capture",
                "Base64 encoding for data transfer",
                "CORS-enabled secure transmission"
            ],
            "preprocessing": [
                "Base64 decoding to binary data",
                "PIL Image processing pipeline",
                "RGB format conversion",
                "Grayscale conversion for visualization",
                "Image resizing and normalization"
            ],
            "model_pipeline": [
                "Hugging Face Transformers pipeline",
                "ViT-based image classification",
                "Multi-head self-attention mechanism",
                "Feature extraction from image patches",
                "Emotion classification head"
            ],
            "classification": [
                "7-class emotion detection",
                "Softmax probability distribution",
                "Confidence score calculation",
                "Emoji mapping for visualization",
                "Real-time result generation"
            ]
        }

        response_data = {
            "emotion": emotion,
            "emoji": emoji,
            "grayscale_image": f"data:image/png;base64,{preprocessing_results['grayscale_base64']}",
            "model_probabilities": prob_dict,
            "processing_steps": {
                "original_size": img.size,
                "color_mode": img.mode,
                "detailed_steps": process_steps,
                "model_type": "Vision Transformer (ViT)",
                "input_shape": "224x224x3",
                "output_classes": "7 emotions (angry, disgust, fear, happy, sad, surprise, neutral)"
            }
        }
        
        print("Response data:", response_data)  # Debug print
        return jsonify(response_data)

    except Exception as e:  
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)