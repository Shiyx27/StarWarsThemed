/**
 * FIXED Camera Management with Complete Error Handling
 * Addresses HTTPS, permissions, and initialization issues
 */

class CameraManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.devices = [];
        this.currentDeviceId = null;
        this.isInitialized = false;
        this.facingMode = 'user';
        this.isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        // Progressive constraint fallbacks
        this.constraintStrategies = [
            {
                name: 'High Quality',
                constraints: {
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 },
                        facingMode: 'user',
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                }
            },
            {
                name: 'Medium Quality',
                constraints: {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    },
                    audio: false
                }
            },
            {
                name: 'Basic',
                constraints: {
                    video: true,
                    audio: false
                }
            }
        ];
        
        this.initializeElements();
        this.bindEvents();
        this.checkEnvironment();
    }
    
    checkEnvironment() {
        console.log('Environment Check:', {
            protocol: location.protocol,
            hostname: location.hostname,
            isHTTPS: this.isHTTPS,
            mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        });
        
        if (!this.isHTTPS) {
            this.showError(
                'HTTPS Required for Camera Access',
                'Please access the app via https:// or use localhost instead of 127.0.0.1'
            );
            return false;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError(
                'Browser Not Supported',
                'Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge.'
            );
            return false;
        }
        
        return true;
    }
    
    initializeElements() {
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('camera-canvas');
        this.errorElement = document.getElementById('camera-error');
        
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
        }
        
        console.log('Camera elements initialized:', {
            video: !!this.video,
            canvas: !!this.canvas,
            error: !!this.errorElement
        });
    }
    
    bindEvents() {
        if (this.video) {
            this.video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded');
                this.setupCanvas();
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
        if (this.isInitialized) {
            return true;
        }
        
        try {
            console.log('Starting camera initialization...');
            
            if (!this.checkEnvironment()) {
                return false;
            }
            
            // Try progressive fallback strategy
            for (let i = 0; i < this.constraintStrategies.length; i++) {
                const strategy = this.constraintStrategies[i];
                console.log(`Trying ${strategy.name} strategy...`);
                
                try {
                    this.showPermissionRequest(`Requesting camera access (${strategy.name})...`);
                    
                    // Stop existing stream
                    if (this.stream) {
                        this.stream.getTracks().forEach(track => track.stop());
                    }
                    
                    // Get new stream
                    this.stream = await navigator.mediaDevices.getUserMedia(strategy.constraints);
                    
                    // Set video source
                    this.video.srcObject = this.stream;
                    
                    // Wait for video to load and play
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
                        
                        this.video.onerror = (e) => {
                            clearTimeout(timeout);
                            reject(new Error('Video load error'));
                        };
                    });
                    
                    console.log(`Camera started successfully with ${strategy.name}`);
                    this.isInitialized = true;
                    this.hidePermissionRequest();
                    return true;
                    
                } catch (error) {
                    console.warn(`${strategy.name} failed:`, error);
                    
                    if (i === this.constraintStrategies.length - 1) {
                        // Last strategy failed
                        this.hidePermissionRequest();
                        this.handleCameraError(error);
                        return false;
                    }
                }
            }
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.handleCameraError(error);
            return false;
        }
    }
    
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
                instructions = 'Please allow camera access in your browser settings and refresh the page.';
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy';
                instructions = 'Close other applications using the camera (Zoom, Skype, etc.) and try again.';
                break;
            case 'SecurityError':
                errorMessage = 'Security restriction';
                instructions = 'Try accessing via https:// or use localhost instead of 127.0.0.1';
                break;
            default:
                errorMessage = 'Camera access failed';
                instructions = 'Please check your browser settings and try again.';
        }
        
        this.showError(errorMessage, instructions);
    }
    
    setupCanvas() {
        if (!this.canvas || !this.video) return;
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        const containerWidth = this.video.clientWidth;
        const aspectRatio = this.video.videoHeight / this.video.videoWidth;
        const containerHeight = containerWidth * aspectRatio;
        
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        
        console.log('Canvas setup complete');
    }
    
    capturePhoto() {
        if (!this.context || !this.video || !this.isInitialized) {
            console.error('Camera not ready for capture');
            return null;
        }
        
        try {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.context.drawImage(this.video, 0, 0);
            
            const imageData = this.canvas.toDataURL('image/jpeg', 0.9);
            console.log('Photo captured successfully');
            
            // Play capture sound
            if (window.audioManager) {
                window.audioManager.playSound('camera-shutter');
            }
            
            return imageData;
            
        } catch (error) {
            console.error('Error capturing photo:', error);
            return null;
        }
    }
    
    applyFilter(filterName) {
        if (!this.video) return;
        
        const filters = {
            'sith-lord': 'contrast(1.2) brightness(0.8) hue-rotate(350deg) saturate(0.7)',
            'vader-mask': 'contrast(1.5) brightness(0.6) grayscale(0.3)',
            'sith-eyes': 'contrast(1.3) brightness(0.9) hue-rotate(340deg)',
            'dark-corruption': 'contrast(1.4) brightness(0.7) saturate(0.5) sepia(0.3)',
            'imperial-officer': 'contrast(1.1) brightness(0.95) saturate(0.8)',
            'lightsaber-duel': 'contrast(1.3) brightness(1.1) saturate(1.2) hue-rotate(15deg)'
        };
        
        const filter = filters[filterName];
        if (filter) {
            this.video.style.filter = filter;
            console.log(`Applied filter: ${filterName}`);
        }
    }
    
    removeFilter() {
        if (this.video) {
            this.video.style.filter = 'none';
        }
    }
    
    // UI Helper Methods
    showPermissionRequest(message = 'Requesting camera access...') {
        this.showError(message, 'Please allow camera access when prompted by your browser.');
    }
    
    hidePermissionRequest() {
        this.hideError();
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
            captureBtn.innerHTML = `
                <span class="lightsaber-icon">🗡️</span>
                <span class="btn-text">Capture the Dark Side</span>
                <div class="lightsaber-glow"></div>
            `;
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
    
    async switchCamera() {
        if (this.devices.length < 2) {
            console.log('Only one camera available');
            return;
        }
        
        try {
            const currentIndex = this.devices.findIndex(device => device.deviceId === this.currentDeviceId);
            const nextIndex = (currentIndex + 1) % this.devices.length;
            this.currentDeviceId = this.devices[nextIndex].deviceId;
            
            await this.initialize();
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing camera manager...');
    window.cameraManager = new CameraManager();
    
    // Auto-initialize camera after a short delay
    setTimeout(() => {
        if (window.cameraManager) {
            window.cameraManager.initialize();
        }
    }, 1000);
});

// Global helper functions
window.requestCameraPermission = async () => {
    if (window.cameraManager) {
        await window.cameraManager.initialize();
    }
};

window.initializeCamera = async () => {
    if (window.cameraManager) {
        await window.cameraManager.initialize();
    }
};
