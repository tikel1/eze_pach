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

async function startCamera() {
    const video = document.getElementById('video');
    const captureButton = document.getElementById('captureButton');
    
    try {
        // Log that we're trying to start the camera
        console.log('Requesting camera access...');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not supported in this browser');
        }

        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        console.log('Requesting stream with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('Camera stream obtained successfully');
        video.srcObject = stream;
        
        // Enable button when video is ready to play
        video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            captureButton.disabled = false;
        };

        // Add error handler for video
        video.onerror = (err) => {
            console.error('Video error:', err);
        };

    } catch (error) {
        console.error('Camera initialization error:', error);
        // Show a more visible error to the user
        const errorMessage = document.createElement('div');
        errorMessage.style.color = 'white';
        errorMessage.style.padding = '20px';
        errorMessage.style.textAlign = 'center';
        errorMessage.innerHTML = `
            Camera access failed:<br>
            ${error.message}<br><br>
            Please ensure you're:
            <ul style="text-align: left;">
                <li>Using HTTPS</li>
                <li>Allowing camera permissions</li>
                <li>Using a supported browser (Chrome, Firefox, Edge)</li>
            </ul>
        `;
        video.parentElement.appendChild(errorMessage);
    }
}

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