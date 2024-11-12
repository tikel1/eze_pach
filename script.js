import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { WASTE_ANALYSIS_PROMPT } from './prompts.js';

const GEMINI_API_KEY = 'AIzaSyBiRjWLSn3vJvHCyTJ4izwl9MAxbENco8A';

let stream;
let video;
let canvas;
let capturedImage;
let captureButton;
let retakeButton;
let analyzeButton;

// Initialize Gemini
async function initGemini() {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
            }
        });
        
        console.log('Gemini initialized successfully');
        return model;
    } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        throw error;
    }
}

async function startCamera() {
    try {
        // Initialize DOM elements
        initializeElements();
        
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment'
            }
        });

        // Set up video element
        video.srcObject = stream;
        video.style.display = 'block';
        capturedImage.style.display = 'none';
        
        // Show take photo button, hide others
        captureButton.style.display = 'block';
        captureButton.disabled = false;
        retakeButton.style.display = 'none';
        analyzeButton.style.display = 'none';
        
        console.log('Camera started successfully');
    } catch (err) {
        console.error('Camera error:', err);
        alert(`Camera error: ${err.message}`);
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
    analysisDiv.innerHTML = 'Analyzing...';
    
    try {
        const model = await initGemini();
        
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
        
        analysisDiv.innerHTML = text;
        console.log('Analysis complete:', text);
        
    } catch (error) {
        console.error('Analysis error:', error);
        analysisDiv.innerHTML = `Analysis failed: ${error.message}`;
    }
}

function retakePhoto() {
    // Hide analysis result
    document.getElementById('analysis').innerHTML = '';
    // Start the camera stream again
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