document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("detectBtn")
    .addEventListener("click", onDetectEmotionClick);
  document.getElementById("settingsBtn").addEventListener("click", onDetectEmotionClick);
  initWebcam();
});

 // Send the image to the Flask backend
 async function sendImageToBackend(imageData) {
  try {
      // Get base64 string and remove the prefix
      const base64String = imageData.src.split(',')[1];
      
      const response = await fetch("/upload", { // Changed to relative path
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              image: base64String
          })
      });

      if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Emotion detection result:", result);
      return result;
  } catch (error) {
      console.error("Error during API call:", error);
      throw error;
  }
}
  // Handle the Detect Emotion button click
  async function onDetectEmotionClick() {
    const initialContent = document.getElementById("initial-content");
    const calculatingContent = document.getElementById("calculating-content");
    const detectBtn = document.getElementById("detectBtn");
    const technicalSection = document.getElementById("technical-section");
    const loadingSpinner = document.querySelector(".loading-spinner");

    try {
        // Hide initial content and show loading
        initialContent.style.display = "none";
        calculatingContent.style.display = "flex";
        detectBtn.style.opacity = "0";
        loadingSpinner.style.display = "block";
        
        // Capture and process image
        const capturedImage = captureImage();
        const result = await sendImageToBackend(capturedImage);

        if (result.error) {
            throw new Error(result.error);
        }

        // Hide loading spinner after getting results
        loadingSpinner.style.display = "none";

        // Show technical section
        technicalSection.style.display = "block";
        
        // Update technical section with processing steps
        updateTechnicalSection(result);

        // Update emotion display with personalized message
        document.querySelector(".result-emoji").textContent = result.emoji;
        document.querySelector(".result-comment").textContent = getEmotionMessage(result.emotion);

        // Update button
        detectBtn.innerHTML = '<i class="fas fa-code mr-2"></i>Show Details';
        detectBtn.style.opacity = "1";
        detectBtn.onclick = () => technicalSection.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        console.error("Error:", error);
        loadingSpinner.style.display = "none";
        document.querySelector(".result-emoji").textContent = "❌";
        document.querySelector(".result-comment").textContent = "Failed to detect emotion. Please try again.";
        detectBtn.style.opacity = "1";
    }
  }
  
  // Initialize when document is loaded
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("detectBtn").addEventListener("click", onDetectEmotionClick);
    document.getElementById("settingsBtn").addEventListener("click", onDetectEmotionClick);
    initWebcam();
  });
  
  function updateTechnicalSection(result) {
    // Update preprocessed image
    document.getElementById("preprocessed-image").innerHTML = `
        <img src="${result.grayscale_image}" alt="Preprocessed Image" class="preprocessed-image">
        <div class="processing-info">
            <p>Image Size: ${result.processing_steps.original_size[0]}x${result.processing_steps.original_size[1]}</p>
            <p>Color Mode: ${result.processing_steps.color_mode}</p>
        </div>
    `;

    // Update processing steps
    const stepsHtml = result.processing_steps.preprocessing
        .map(step => `<li>${step}</li>`)
        .join('');
    document.getElementById("processing-steps").innerHTML = `
        <ul class="step-list">${stepsHtml}</ul>
    `;

    // Update emotion probabilities
    const probContainer = document.getElementById("emotion-probabilities");
    probContainer.innerHTML = "";
    
    Object.entries(result.model_probabilities).forEach(([emotion, probability]) => {
        const percentage = (probability * 100).toFixed(1);
        const barElement = document.createElement('div');
        barElement.className = 'probability-bar probability-bar-custom probability-bar-width';
        barElement.style.setProperty('--percentage', `${percentage}%`);
        
        probContainer.innerHTML += `
            <div class="probability-label">
                <span>${emotion}</span>
                <span>${percentage}%</span>
            </div>
        `;
        probContainer.appendChild(barElement);
    });

    // Update remaining elements
    document.getElementById("detected-emoji").textContent = result.emoji;
    document.getElementById("detected-emotion").textContent = result.emotion;
    document.getElementById("confidence-score").querySelector("h4").textContent = 
        `${(result.model_probabilities[result.emotion] * 100).toFixed(1)}% Confident`;
  }
  
  function getEmotionMessage(emotion) {
    const messages = {
        happy: "You're radiating happiness! Your smile lights up the room! 🌟",
        sad: "I see some sadness there. Remember, every cloud has a silver lining! 🌈",
        angry: "Whoa, looking pretty fired up! Take a deep breath and count to ten. 🧘",
        disgust: "That's quite the expression! Something leave a bad taste? 😖",
        fear: "I sense some anxiety there. Remember, you're stronger than you think! 💪",
        surprise: "Well, that caught you off guard! What an unexpected moment! 😲",
        neutral: "Keeping it cool and collected with that poker face! 😎"
    };
    return messages[emotion] || "Interesting expression you've got there! 🤔";
  }
