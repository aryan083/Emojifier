
  // Send the image to the Flask backend
  async function sendImageToBackend(imageBlob) {
    const formData = new FormData();
    formData.append("image", imageBlob, "capture.jpg");
  
    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to get a response from the backend");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error during API call:", error);
      return { error: "An error occurred. Please try again." };
    }
  }
  
  // Handle the Detect Emotion button click
  async function onDetectEmotionClick() {
    const initialContent = document.getElementById("initial-content");
    const calculatingContent = document.getElementById("calculating-content");
    const detectBtn = document.getElementById("detectBtn");
    const resultEmoji = document.querySelector(".result-emoji");
    const resultComment = document.querySelector(".result-comment");
  
    // Hide initial content and show the loading spinner
    initialContent.style.display = "none";
    calculatingContent.style.display = "flex";
    detectBtn.style.opacity = "0";
  
    try {
      // Capture the webcam image
      const imageBlob = await captureImage();
  
      // Send the image to the backend and get the response
      const response = await sendImageToBackend(imageBlob);
  
      // Check for errors in the response
      if (response.error) {
        throw new Error(response.error);
      }
  
      // Display the result
      resultEmoji.textContent = response.emoji || "🤔";
      resultComment.textContent =
        response.emotion
          ? `Detected emotion: ${response.emotion}`
          : "Emotion detection failed.";
    } catch (error) {
      console.error("Error:", error);
      resultEmoji.textContent = "❌";
      resultComment.textContent = "Failed to detect emotion. Please try again.";
    } finally {
      // Hide the spinner and show the button again
      document.querySelector(".loading-spinner").style.display = "none";
      detectBtn.innerHTML =
        '<i class="fas fa-arrow-down mr-2 bounce"></i>Show It\'s Working';
      detectBtn.style.opacity = "1";
  
      detectBtn.onclick = () => {
        window.scrollTo({
          top: window.innerHeight,
          behavior: "smooth",
        });
      };
    }
  }
  
  // Attach event listeners
  document
    .getElementById("detectBtn")
    .addEventListener("click", onDetectEmotionClick);
  
  // Initialize the webcam when the page loads
  initWebcam();
  