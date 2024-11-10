let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let photo = document.getElementById('photo');
let captureButton = document.getElementById('capture');
let analyzeButton = document.getElementById('analyze');
let retakeButton = document.getElementById('retake');
let resultDiv = document.getElementById('result');

// Start camera automatically when page loads
window.addEventListener('load', startCamera);

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        video.srcObject = stream;
        // Ensure video is playing
        await video.play();
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Error accessing camera. Please make sure you have granted camera permissions.');
    }
}

captureButton.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    photo.src = canvas.toDataURL('image/jpeg');
    
    video.classList.remove('active');
    photo.style.display = 'block';
    photo.classList.add('active');
    // Don't hide the button, just disable it if needed
    captureButton.disabled = true;
});

retakeButton.addEventListener('click', function() {
    video.style.display = 'block';
    photo.style.display = 'none';
    captureButton.style.display = 'block';
    analyzeButton.style.display = 'none';
    retakeButton.style.display = 'none';
    resultDiv.style.display = 'none';

    // When retaking
    video.classList.add('active');
    photo.classList.remove('active');
});

analyzeButton.addEventListener('click', async function() {
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Analyzing...';
    
    try {
        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: photo.src
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        
        resultDiv.innerHTML = data.analysis.replace(/\n/g, '<br>');
    } catch (error) {
        resultDiv.innerHTML = `Error: ${error.message}`;
    }
});

startButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
        });
        video.srcObject = stream;
        video.style.display = 'block';
        video.classList.add('active');
        startButton.style.display = 'none';
        // Just enable the button, don't change its display
        captureButton.disabled = false;
    } catch (err) {
        console.error('Error:', err);
        alert('Could not access camera');
    }
});