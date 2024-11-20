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

function displayAnalysis(analysisText) {
    const lines = analysisText.split('\n').filter(line => line.trim());
    let formattedText = '';
    
    lines.forEach((line, index) => {
        const content = line.replace(/^\d+\s*/, '').trim();
        
        switch(index) {
            case 0: // Line 1 becomes h2
                formattedText += `<h2>${content}</h2>`;
                break;
            case 1: // Line 2 becomes p (text)
                formattedText += `<p>${content}</p>`;
                // Choose the correct bin icon based on the content of line 3 (h1)
                const binType = lines[2].replace(/^\d+\s*/, '').trim();
                let binVariant = 'general';
                if (binType.includes('Orange')) binVariant = 'orange';
                if (binType.includes('Yellow')) binVariant = 'yellow';
                
                // Updated image path to match actual filenames with spaces
                const imagePath = encodeURI(`images/recycle-bin - ${binVariant}.png`);
                formattedText += `<img src="${imagePath}" alt="recycle bin" class="bin-icon">`;
                break;
            case 2: // Line 3 becomes h1
                formattedText += `<h1>${content}</h1>`;
                break;
            case 3: // Line 4 becomes h3
                formattedText += `<h3>${content}</h3>`;
                break;
            case 4: // Line 5 becomes p (text)
                formattedText += `<p>${content}</p>`;
                break;
        }
    });
    
    return formattedText;
}

async function analyzeImage() {
    const analysisDiv = document.getElementById('analysis');
    const resultContainer = document.querySelector('.result-container');
    const scanningLine = document.querySelector('.scanning-line');
    
    resultContainer.classList.add('visible');
    analysisDiv.innerHTML = 'Analyzing...';
    scanningLine.style.display = 'block';
    
    try {
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
            }
        });

        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Image = imageDataUrl.split(',')[1];

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([WASTE_ANALYSIS_PROMPT, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        scanningLine.style.display = 'none';
        
        // Check if response contains error messages
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('overload')) {
            analysisDiv.innerHTML = `
                <img src="images/error.png" alt="error icon" class="error-icon">
                <h1>Server Error</h1>
                <p>${text}</p>
            `;
            return;
        }
        
        analysisDiv.innerHTML = `
            <div class="analysis-content">
                ${displayAnalysis(text)}
            </div>
            <hr>
            <em>Analyzed at ${new Date().toLocaleTimeString()}</em>
        `;
        
    } catch (error) {
        scanningLine.style.display = 'none';
        console.error('Analysis error:', error);
        
        // Extract the specific error message
        let errorMessage = error.toString();
        if (errorMessage.includes(':generateContent:')) {
            errorMessage = errorMessage.split(':generateContent:')[1].trim();
        }
        
        analysisDiv.innerHTML = `
            <img src="images/error.png" alt="error icon" class="error-icon">
            <h1>Server Error</h1>
            <p>${errorMessage}</p>
        `;
    }
}

function retakePhoto() {
    // Hide the scanning line
    document.querySelector('.scanning-line').style.display = 'none';
    
    // Hide the result container
    const resultContainer = document.querySelector('.result-container');
    resultContainer.classList.remove('visible');
    
    // Clear the analysis
    document.getElementById('analysis').innerHTML = '';
    
    // Show video, hide captured image
    document.getElementById('video').style.display = 'block';
    document.getElementById('capturedImage').style.display = 'none';
    
    // Show capture button, hide retake and analyze buttons
    document.getElementById('captureButton').style.display = 'block';
    document.getElementById('retakeButton').style.display = 'none';
    document.getElementById('analyzeButton').style.display = 'none';
    
    // Enable the capture button
    document.getElementById('captureButton').disabled = false;
    
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