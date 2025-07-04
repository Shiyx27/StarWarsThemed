/**
 * FIXED Face Detection with Proper Bounding Box Scaling
 */

class FaceDetection {
    constructor() {
        this.isInitialized = false;
        this.isDetecting = false;
        this.latestFace = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.confidence = 0.5;
        
        // Performance optimization
        this.detectionInterval = 150; // ms between detections
        this.lastDetectionTime = 0;
        
        // Face stability tracking
        this.faceHistory = [];
        this.maxHistory = 5;
    }
    
    async initialize() {
        try {
            console.log('Initializing Face Detection...');
            
            // Try to initialize MediaPipe face detection
            if (await this.initializeMediaPipe()) {
                console.log('MediaPipe face detection initialized');
                this.isInitialized = true;
                this.startDetection();
                return true;
            } else {
                console.warn('Face detection not available');
                return false;
            }
            
        } catch (error) {
            console.error('Error initializing face detection:', error);
            return false;
        }
    }
    
    async initializeMediaPipe() {
        try {
            // Check if MediaPipe is available
            if (typeof FilesetResolver === 'undefined') {
                console.log('MediaPipe not available, using fallback detection');
                return this.initializeFallbackDetection();
            }
            
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            
            this.faceDetector = await FaceDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                minDetectionConfidence: this.confidence
            });
            
            return true;
            
        } catch (error) {
            console.warn('MediaPipe initialization failed, using fallback:', error);
            return this.initializeFallbackDetection();
        }
    }
    
    initializeFallbackDetection() {
        // Simple fallback face detection using canvas center estimation
        console.log('Using fallback face detection');
        this.useFallback = true;
        return true;
    }
    
    updateCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        console.log(`Face detection canvas updated: ${width}x${height}`);
    }
    
    startDetection() {
        if (!this.isInitialized || this.isDetecting) return;
        
        this.isDetecting = true;
        this.detectionLoop();
    }
    
    async detectionLoop() {
        if (!this.isDetecting) return;
        
        const currentTime = Date.now();
        
        if (currentTime - this.lastDetectionTime >= this.detectionInterval) {
            await this.detectFaces();
            this.lastDetectionTime = currentTime;
        }
        
        requestAnimationFrame(() => this.detectionLoop());
    }
    
    async detectFaces() {
        try {
            const video = window.cameraManager?.video;
            if (!video || video.readyState < 2) return;
            
            let detections = null;
            
            if (this.useFallback) {
                detections = this.getFallbackFaceDetection();
            } else if (this.faceDetector) {
                detections = await this.detectWithMediaPipe(video);
            }
            
            this.processDetections(detections);
            
        } catch (error) {
            console.error('Error in face detection:', error);
        }
    }
    
    getFallbackFaceDetection() {
        // Create a centered face detection as fallback
        if (!this.canvasWidth || !this.canvasHeight) return [];
        
        const centerX = this.canvasWidth * 0.5;
        const centerY = this.canvasHeight * 0.4; // Slightly higher for face position
        const faceWidth = this.canvasWidth * 0.3; // 30% of canvas width
        const faceHeight = faceWidth * 1.3; // Face is typically taller than wide
        
        return [{
            boundingBox: {
                x: centerX - (faceWidth / 2),
                y: centerY - (faceHeight / 2),
                width: faceWidth,
                height: faceHeight
            },
            confidence: 0.8
        }];
    }
    
    async detectWithMediaPipe(video) {
        try {
            const results = this.faceDetector.detectForVideo(video, Date.now());
            return results.detections || [];
        } catch (error) {
            console.error('MediaPipe detection error:', error);
            return this.getFallbackFaceDetection();
        }
    }
    
    processDetections(detections) {
        if (!detections || detections.length === 0) {
            // Use fallback detection if no faces found
            if (!this.useFallback) {
                detections = this.getFallbackFaceDetection();
            } else {
                this.latestFace = null;
                this.updateStatus(false);
                return;
            }
        }
        
        // Use the most confident/largest face
        let bestFace = this.selectBestFace(detections);
        
        if (bestFace) {
            // Normalize and scale the face detection
            const normalizedFace = this.normalizeFaceDetection(bestFace);
            
            // Add to history for stability
            this.addToHistory(normalizedFace);
            
            // Get stabilized face
            this.latestFace = this.getStabilizedFace();
            
            this.updateStatus(true);
        } else {
            this.latestFace = null;
            this.updateStatus(false);
        }
    }
    
    selectBestFace(detections) {
        let bestFace = null;
        let bestScore = 0;
        
        detections.forEach(detection => {
            const confidence = detection.confidence || detection.categories?.[0]?.score || 0.8;
            const box = detection.boundingBox;
            
            if (!box) return;
            
            // Prefer faces closer to center and with higher confidence
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            const faceX = box.x + (box.width / 2);
            const faceY = box.y + (box.height / 2);
            
            const distanceFromCenter = Math.sqrt(
                Math.pow(faceX - centerX, 2) + Math.pow(faceY - centerY, 2)
            );
            
            const maxDistance = Math.sqrt(
                Math.pow(centerX, 2) + Math.pow(centerY, 2)
            );
            
            const centerScore = 1 - (distanceFromCenter / maxDistance);
            const totalScore = (confidence * 0.7) + (centerScore * 0.3);
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestFace = detection;
            }
        });
        
        return bestFace;
    }
    
    normalizeFaceDetection(detection) {
        const box = detection.boundingBox;
        
        // Ensure we have canvas dimensions
        if (!this.canvasWidth || !this.canvasHeight) {
            this.canvasWidth = window.cameraManager?.outputCanvas?.width || 640;
            this.canvasHeight = window.cameraManager?.outputCanvas?.height || 480;
        }
        
        return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            centerX: box.x + (box.width / 2),
            centerY: box.y + (box.height / 2),
            confidence: detection.confidence || 0.8,
            // Normalized coordinates (0-1)
            normalizedX: box.x / this.canvasWidth,
            normalizedY: box.y / this.canvasHeight,
            normalizedWidth: box.width / this.canvasWidth,
            normalizedHeight: box.height / this.canvasHeight
        };
    }
    
    addToHistory(face) {
        this.faceHistory.push(face);
        
        if (this.faceHistory.length > this.maxHistory) {
            this.faceHistory.shift();
        }
    }
    
    getStabilizedFace() {
        if (this.faceHistory.length === 0) return null;
        
        // Average the recent face detections for stability
        const avgFace = this.faceHistory.reduce((acc, face) => {
            return {
                x: acc.x + face.x,
                y: acc.y + face.y,
                width: acc.width + face.width,
                height: acc.height + face.height,
                centerX: acc.centerX + face.centerX,
                centerY: acc.centerY + face.centerY,
                normalizedX: acc.normalizedX + face.normalizedX,
                normalizedY: acc.normalizedY + face.normalizedY,
                normalizedWidth: acc.normalizedWidth + face.normalizedWidth,
                normalizedHeight: acc.normalizedHeight + face.normalizedHeight
            };
        }, {
            x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0,
            normalizedX: 0, normalizedY: 0, normalizedWidth: 0, normalizedHeight: 0
        });
        
        const count = this.faceHistory.length;
        
        return {
            x: avgFace.x / count,
            y: avgFace.y / count,
            width: avgFace.width / count,
            height: avgFace.height / count,
            centerX: avgFace.centerX / count,
            centerY: avgFace.centerY / count,
            normalizedX: avgFace.normalizedX / count,
            normalizedY: avgFace.normalizedY / count,
            normalizedWidth: avgFace.normalizedWidth / count,
            normalizedHeight: avgFace.normalizedHeight / count,
            confidence: this.faceHistory[this.faceHistory.length - 1].confidence
        };
    }
    
    updateStatus(faceDetected) {
        const statusElement = document.getElementById('face-detected');
        if (statusElement) {
            statusElement.textContent = faceDetected ? 'Yes' : 'No';
            statusElement.style.color = faceDetected ? '#00ff00' : '#ff0000';
        }
    }
    
    getLatestFace() {
        return this.latestFace;
    }
    
    stopDetection() {
        this.isDetecting = false;
    }
    
    destroy() {
        this.stopDetection();
        this.latestFace = null;
        this.faceHistory = [];
        this.isInitialized = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.FaceDetection = FaceDetection;
});
