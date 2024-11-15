import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { WASTE_ANALYSIS_PROMPT } from './prompts.js';
import { config } from './config.js';

// Use the API key
const GEMINI_API_KEY = config.GEMINI_API_KEY;

let stream;
let video;
let canvas;
let capturedImage;
let captureButton;
let retakeButton;
let analyzeButton;
let currentStream;

async function startCamera(preferredFacing = 'environment') {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available cameras:', videoDevices);

        const constraints = {
            video: {
                facingMode: { ideal: preferredFacing },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('video');
        video.srcObject = currentStream;
        
        document.getElementById('captureButton').disabled = false;
        
    } catch (error) {
        console.error('Camera error:', error);
    }
}

// Add switch camera functionality
async function switchCamera() {
    const video = document.getElementById('video');
    const currentFacingMode = currentStream?.getVideoTracks()[0]?.getSettings()?.facingMode;
    
    // Toggle between front and back cameras
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacingMode);
}

// Add event listener for switch camera button
document.addEventListener('DOMContentLoaded', () => {
    const switchButton = document.getElementById('switchCameraButton');
    if (switchButton) {
        switchButton.addEventListener('click', switchCamera);
    }
    
    // Start with back camera
    startCamera('environment');
});

function initializeElements() {
    // Get all DOM elements
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    capturedImage = document.getElementById('capturedImage');
    captureButton = document.getElementById('captureButton');
    retakeButton = document.getElementById('retakeButton');
    analyzeButton = document.getElementById('analyzeButton');

    // Check if all elements exist
    if (!video || !canvas || !capturedImage || !captureButton || !retakeButton || !analyzeButton) {
        throw new Error('Required elements not found');
    }

    // Set up button event listeners
    captureButton.addEventListener('click', captureImage);
    retakeButton.addEventListener('click', retakePhoto);
    analyzeButton.addEventListener('click', analyzeImage);
}

function captureImage() {
    try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to image and display
        capturedImage.src = canvas.toDataURL('image/jpeg', 0.8);
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        
        // Show retake and analyze buttons, hide capture button
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        analyzeButton.style.display = 'block';
        
        console.log('Image captured successfully');
    } catch (error) {
        console.error('Error capturing image:', error);
        alert(`Failed to capture image: ${error.message}`);
    }
}

async function analyzeImage() {
    const analysisDiv = document.getElementById('analysis');
    const resultContainer = document.querySelector('.result-container');
    
    resultContainer.classList.add('visible');
    analysisDiv.innerHTML = 'Analyzing...';
    
    try {
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        // Update to use gemini-1.5-flash
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",  // Changed to Gemini 1.5 Flash
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
            }
        });

        // Get the image data from canvas
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Image = imageDataUrl.split(',')[1];

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            }
        };

        // Use the imported prompt
        const result = await model.generateContent([WASTE_ANALYSIS_PROMPT, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        // Format the response as HTML
        const formattedResponse = `
            <h1>Analysis Results</h1>
            <div class="analysis-content">
                ${text}
            </div>
            <hr>
            <em>Analyzed at ${new Date().toLocaleTimeString()}</em>
        `;

        analysisDiv.innerHTML = formattedResponse;
        
    } catch (error) {
        console.error('Analysis error:', error);
        analysisDiv.innerHTML = `
            <h1>Error</h1>
            <strong>Analysis failed:</strong> ${error.message}
        `;
    }
}

function retakePhoto() {
    // Hide the result container
    const resultContainer = document.querySelector('.result-container');
    resultContainer.classList.remove('visible');
    
    // Clear the analysis
    document.getElementById('analysis').innerHTML = '';
    
    // Start the camera again
    startCamera();
}

// Initialize when page loads
window.addEventListener('load', function() {
    // Get DOM elements
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    capturedImage = document.getElementById('capturedImage');
    captureButton = document.getElementById('captureButton');
    retakeButton = document.getElementById('retakeButton');
    analyzeButton = document.getElementById('analyzeButton');

    // Add event listeners only after elements are found
    if (captureButton) {
        captureButton.addEventListener('click', captureImage);
    }
    if (retakeButton) {
        retakeButton.addEventListener('click', retakePhoto);
    }
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeImage);
    }

    // Start camera
    startCamera();
}); 