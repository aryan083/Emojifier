document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("detectBtn")
    .addEventListener("click", onDetectEmotionClick);
  document.getElementById("settingsBtn").addEventListener("click", onDetectEmotionClick);
  initWebcam();
  const technicalSection = document.getElementById("technical-section");
  technicalSection.style.display = "none";
});

 // Send the image to the Flask backend
 async function sendImageToBackend(imageData) {
  try {
      // Get base64 string and remove the prefix
      const base64String = imageData.src.split(',')[1];
      
      const response = await fetch("http://127.0.0.1:5000/upload", {
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
        
        // Hide technical section while processing
        technicalSection.style.display = "none";
        
        // Capture and process image
        const capturedImage = captureImage();
        const result = await sendImageToBackend(capturedImage);

        if (result.error) {
            throw new Error(result.error);
        }

        // Hide loading spinner after getting results
        loadingSpinner.style.display = "none";

        // Show and update technical section
        technicalSection.style.display = "block";
        void technicalSection.offsetWidth;
        technicalSection.classList.add('visible');
        
        // Update technical section with processing steps
        updateTechnicalSection(result);

        // Update emotion display with personalized message
        document.querySelector(".result-emoji").textContent = result.emoji;
        document.querySelector(".result-comment").textContent = getEmotionMessage(result.emotion);

        // Update button
        detectBtn.innerHTML = '<i class="fas fa-code mr-2"></i>Show Details';
        detectBtn.style.opacity = "1";
        
        // Remove old click handler and add new one
        detectBtn.removeEventListener('click', onDetectEmotionClick);
        detectBtn.addEventListener('click', handleShowDetails);

    } catch (error) {
        console.error("Error:", error);
        loadingSpinner.style.display = "none";
        document.querySelector(".result-emoji").textContent = "❌";
        document.querySelector(".result-comment").textContent = "Failed to detect emotion. Please try again.";
        detectBtn.style.opacity = "1";
        technicalSection.style.display = "none";
    }
  }
  
  // Initialize when document is loaded
  document.addEventListener("DOMContentLoaded", () => {
    const detectBtn = document.getElementById("detectBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const technicalSection = document.getElementById("technical-section");

    // Hide technical section initially
    technicalSection.style.display = "none";

    // Add click handlers
    detectBtn.addEventListener("click", onDetectEmotionClick);
    settingsBtn.addEventListener("click", onDetectEmotionClick);
    
    initWebcam();
  });
  
  function updateTechnicalSection(result) {
    console.log("Full result:", result);
    console.log("Processing steps:", result.processing_steps);
    console.log("Detailed steps:", result.processing_steps.detailed_steps);

    // Update preprocessed image with processing info
    document.getElementById("preprocessed-image").innerHTML = `
        <img src="${result.grayscale_image}" alt="Preprocessed Image" class="preprocessed-image">
        <div class="processing-info">
            <p>Image Size: ${result.processing_steps.original_size[0]}x${result.processing_steps.original_size[1]}</p>
            <p>Color Mode: ${result.processing_steps.color_mode}</p>
        </div>
    `;

    // Update processing pipeline steps
    const processSteps = result.processing_steps.detailed_steps;
    if (!processSteps) {
        console.error("No processing steps found in result");
        return;
    }

    let stepsHtml = '<div class="process-flow">';
    
    // Add each processing stage with error handling
    try {
        for (const [stage, steps] of Object.entries(processSteps)) {
            console.log("Processing stage:", stage, steps);
            const stageName = stage.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            stepsHtml += `
                <div class="process-stage">
                    <h4>${stageName}</h4>
                    <ul class="step-list">
                        ${Array.isArray(steps) ? steps.map(step => `<li>${step}</li>`).join('') : ''}
                    </ul>
                </div>
            `;
        }
        stepsHtml += '</div>';
        
        // Add model information
        stepsHtml += `
            <div class="model-info">
                <h4>MODEL SPECIFICATIONS</h4>
                <ul class="step-list">
                    <li>Type: ${result.processing_steps.model_type}</li>
                    <li>Input Shape: ${result.processing_steps.input_shape}</li>
                    <li>Output: ${result.processing_steps.output_classes}</li>
                </ul>
            </div>
        `;

        console.log("Generated HTML:", stepsHtml);
        document.getElementById("processing-steps").innerHTML = stepsHtml;
    } catch (error) {
        console.error("Error generating steps HTML:", error);
    }

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
        `${(result.model_probabilities[result.emotion] * 100).toFixed(1)}%`;
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
  
  // Add this new function for handling the "Show Details" click
  function handleShowDetails() {
    const technicalSection = document.getElementById("technical-section");
    // First ensure the section is visible
    technicalSection.style.display = "block";
    // Then scroll to it
    setTimeout(() => {
        technicalSection.scrollIntoView({ 
            behavior: "smooth",
            block: "start"
        });
    }, 100);
  }
  