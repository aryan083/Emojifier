document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("detectBtn")
    .addEventListener("click", onDetectEmotionClick);
  initWebcam();
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
      console.log(result);
      return result;
  } catch (error) {
      console.error("Error during API call:", error.message);
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
  