import os
from flask import Flask, request, jsonify
import numpy as np
import joblib
from PIL import Image

# Initialize Flask app
app = Flask(__name__)

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
def preprocess_image(image_path):
    # Load the image
    img = Image.open(image_path).convert('L')  # Convert to grayscale

    # Resize image to the required dimensions (e.g., 48x48 for FER datasets)
    img = img.resize((96, 96))

    # Flatten the image into a single row of pixel values
    img_array = np.array(img).flatten()

    return img_array

@app.route('/upload', methods=['POST'])
def upload_image():
    # Check if an image file is part of the request
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    # Save the uploaded image
    image_file = request.files['image']
    image_path = os.path.join("temp", image_file.filename)
    os.makedirs("temp", exist_ok=True)
    image_file.save(image_path)

    try:
        # Preprocess the image
        image = preprocess_image(image_path)

        # Apply scaler
        image_scaled = scaler.transform([image])

        # Apply PCA if available
        if pca:
            image_pca = pca.transform(image_scaled)
        else:
            image_pca = image_scaled

        # Apply LDA if available
        if lda:
            image_lda = lda.transform(image_pca)
        else:
            image_lda = image_pca

        # Predict using the SVM model
        prediction = svm_model.predict(image_lda)[0]

        # Get the emoji for the predicted emotion
        emoji = emotion_to_emoji.get(prediction, "🤔")

        # Remove temporary file
        os.remove(image_path)

        # Return the prediction and emoji
        return jsonify({'emotion': prediction, 'emoji': emoji})

    except Exception as e:
        # Handle errors
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
