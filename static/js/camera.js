/**
 * Enhanced Camera Manager with Better Canvas Coordination
 */

class CameraManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.isInitialized = false;
        this.facingMode = 'user';
        
        // Canvas-specific properties
        this.outputCanvas = null;
        this.outputContext = null;
        this.animationFrame = null;
        this.isRendering = false;
        
        // Performance optimization
        this.frameRate = 30;
        this.frameInterval = 1000 / this.frameRate;
        this.lastFrameTime = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.checkEnvironment();
    }
    
    checkEnvironment() {
        const isHTTPS = location.protocol === 'https:' || 
                       location.hostname === 'localhost' || 
                       location.hostname === '127.0.0.1';
        
        if (!isHTTPS) {
            this.showError(
                'HTTPS Required',
                'Camera access requires HTTPS. Please use localhost or deploy with SSL.'
            );
            return false;
        }
        
        if (!navigator.mediaDevices?.getUserMedia) {
            this.showError(
                'Browser Not Supported',
                'Your browser does not support camera access.'
            );
            return false;
        }
        
        return true;
    }
    
    initializeElements() {
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('camera-canvas');
        this.errorElement = document.getElementById('camera-error');
        
        // Create output canvas for mask overlay
        this.outputCanvas = document.createElement('canvas');
        this.outputCanvas.id = 'output-canvas';
        this.outputCanvas.style.position = 'absolute';
        this.outputCanvas.style.top = '0';
        this.outputCanvas.style.left = '0';
        this.outputCanvas.style.zIndex = '2';
        this.outputCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
            this.outputContext = this.outputCanvas.getContext('2d');
            
            // Insert output canvas into DOM
            const cameraContainer = document.querySelector('.camera-container');
            if (cameraContainer) {
                cameraContainer.appendChild(this.outputCanvas);
            }
        }
        
        console.log('Camera elements initialized');
    }
    
    bindEvents() {
        if (this.video) {
            this.video.addEventListener('loadedmetadata', () => {
                this.setupCanvas();
                this.startRendering();
                this.updateStatus('Camera Active', true);
                this.hideError();
                this.enableCaptureButton();
            });
            
            this.video.addEventListener('error', (e) => {
                console.error('Video error:', e);
                this.showError('Video Error', 'Failed to load video stream');
            });
        }
        
        const switchBtn = document.getElementById('switch-camera');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => this.switchCamera());
        }
    }
    
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            if (!this.checkEnvironment()) return false;
            
            const constraints = {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode: this.facingMode,
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
                
                this.video.onloadedmetadata = async () => {
                    clearTimeout(timeout);
                    try {
                        await this.video.play();
                        resolve();
                    } catch (playError) {
                        reject(playError);
                    }
                };
            });
            
            this.isInitialized = true;
            console.log('Camera initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.handleCameraError(error);
            return false;
        }
    }
    
    setupCanvas() {
        if (!this.canvas || !this.video || !this.outputCanvas) return;
        
        // Set canvas dimensions
        const width = this.video.videoWidth;
        const height = this.video.videoHeight;
        
        this.canvas.width = this.outputCanvas.width = width;
        this.canvas.height = this.outputCanvas.height = height;
        
        // Set CSS dimensions for responsive display
        const containerWidth = this.video.clientWidth;
        const aspectRatio = height / width;
        const containerHeight = containerWidth * aspectRatio;
        
        this.canvas.style.width = this.outputCanvas.style.width = containerWidth + 'px';
        this.canvas.style.height = this.outputCanvas.style.height = containerHeight + 'px';
        
        // Update mask manager with canvas dimensions
        if (window.maskManager) {
            window.maskManager.updateCanvasDimensions(width, height);
        }
        
        console.log(`Canvas setup complete: ${width}x${height} -> ${containerWidth}x${containerHeight}`);
    }
    
    startRendering() {
        if (this.isRendering) return;
        
        this.isRendering = true;
        this.renderLoop();
        console.log('Started canvas rendering loop');
    }
    
    renderLoop(currentTime = 0) {
        if (!this.isRendering) return;
        
        // Frame rate limiting
        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            this.renderFrame();
            this.lastFrameTime = currentTime;
        }
        
        this.animationFrame = requestAnimationFrame((time) => this.renderLoop(time));
    }
    
    renderFrame() {
        if (!this.video || !this.outputContext || this.video.readyState < 2) return;
        
        try {
            // Clear output canvas
            this.outputContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
            
            // Draw video frame
            this.outputContext.drawImage(
                this.video, 
                0, 0, 
                this.outputCanvas.width, 
                this.outputCanvas.height
            );
            
            // Apply mask overlay if active
            if (window.maskManager && window.maskManager.activeMask) {
                window.maskManager.applyMaskToCanvas(this.outputContext, this.outputCanvas);
            }
            
        } catch (error) {
            console.error('Error rendering frame:', error);
        }
    }
    
    capturePhoto() {
        if (!this.outputCanvas || !this.isInitialized) {
            console.error('Camera not ready for capture');
            return null;
        }
        
        try {
            // Capture from output canvas (includes mask overlay)
            const imageData = this.outputCanvas.toDataURL('image/jpeg', 0.9);
            
            // Play capture sound
            if (window.audioManager) {
                window.audioManager.playSound('camera-shutter');
            }
            
            console.log('Photo captured with mask overlay');
            return imageData;
            
        } catch (error) {
            console.error('Error capturing photo:', error);
            return null;
        }
    }
    
    // Handle window resize for responsive canvas
    handleResize() {
        if (this.video && this.video.videoWidth > 0) {
            this.setupCanvas();
        }
    }
    
    stopRendering() {
        this.isRendering = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    // Error handling methods (same as before)
    handleCameraError(error) {
        let errorMessage = 'Camera access failed';
        let instructions = '';
        
        switch (error.name) {
            case 'NotFoundError':
                errorMessage = 'No camera found';
                instructions = 'Make sure your device has a camera connected.';
                break;
            case 'NotAllowedError':
                errorMessage = 'Camera access blocked';
                instructions = 'Please allow camera access and refresh the page.';
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy';
                instructions = 'Close other apps using the camera and try again.';
                break;
            case 'SecurityError':
                errorMessage = 'Security restriction';
                instructions = 'Try accessing via https:// or localhost.';
                break;
            default:
                instructions = 'Please check your browser settings and try again.';
        }
        
        this.showError(errorMessage, instructions);
    }
    
    showError(message, instructions = '') {
        console.error('Camera error:', message);
        
        if (this.errorElement) {
            this.errorElement.style.display = 'flex';
            
            const errorContent = this.errorElement.querySelector('.error-content');
            if (errorContent) {
                errorContent.innerHTML = `
                    <h3>${message}</h3>
                    <p>${instructions}</p>
                    <div class="error-actions">
                        <button class="btn btn--primary" onclick="window.cameraManager.initialize()">
                            Try Again
                        </button>
                        <button class="btn btn--secondary" onclick="window.location.reload()">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        }
        
        if (this.video) {
            this.video.style.display = 'none';
        }
        
        this.disableCaptureButton();
    }
    
    hideError() {
        if (this.errorElement) {
            this.errorElement.style.display = 'none';
        }
        
        if (this.video) {
            this.video.style.display = 'block';
        }
    }
    
    enableCaptureButton() {
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.disabled = false;
        }
    }
    
    disableCaptureButton() {
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.disabled = true;
        }
    }
    
    updateStatus(status, isActive = false) {
        const statusElement = document.getElementById('face-detected');
        if (statusElement) {
            statusElement.textContent = isActive ? 'Yes' : 'No';
            statusElement.style.color = isActive ? '#00ff00' : '#ff0000';
        }
    }
    
    destroy() {
        this.stopRendering();
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isInitialized = false;
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.cameraManager) {
        setTimeout(() => {
            window.cameraManager.handleResize();
        }, 100);
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing camera manager...');
    window.cameraManager = new CameraManager();
    
    // Auto-initialize after delay
    setTimeout(() => {
        if (window.cameraManager) {
            window.cameraManager.initialize();
        }
    }, 1000);
});
