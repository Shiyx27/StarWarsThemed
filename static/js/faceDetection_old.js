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
            // Attempt to load the MediaPipe tasks-vision module. The library
            // may be loaded as a global (UMD) or as an ES module. Try both.
            let mp = null;
            if (typeof FilesetResolver !== 'undefined' && typeof FaceDetector !== 'undefined') {
                // Global (UMD) build exposed FilesetResolver/FaceDetector
                mp = window;
            } else {
                // Try dynamic import of the ES module bundle (this avoids the
                // "Unexpected token 'export'" error when the script is a module)
                try {
                    mp = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js');
                } catch (err) {
                    console.warn('Dynamic import of MediaPipe failed:', err);
                    return this.initializeFallbackDetection();
                }
            }

            const FilesetResolverRef = mp.FilesetResolver;
            const FaceLandmarkerRef = mp.FaceLandmarker || mp.FaceMesh || mp.FaceDetector;

            if (!FilesetResolverRef || !FaceLandmarkerRef) {
                console.warn('MediaPipe tasks API not available on this build');
                return this.initializeFallbackDetection();
            }

            const vision = await FilesetResolverRef.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            // Try creating a FaceDetector first (usually available and smaller).
            let createdSomething = false;
            if (mp.FaceDetector && typeof mp.FaceDetector.createFromOptions === 'function') {
                try {
                    this.faceDetector = await mp.FaceDetector.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
                            delegate: 'GPU'
                        },
                        runningMode: 'VIDEO',
                        minDetectionConfidence: this.confidence
                    });
                    createdSomething = true;
                } catch (err) {
                    console.warn('FaceDetector creation failed:', err);
                }
            }

            // Then attempt to create FaceLandmarker (landmarks). Make this non-fatal
            // so if the landmarker model isn't available we still have bounding boxes.
            if (FaceLandmarkerRef && typeof FaceLandmarkerRef.createFromOptions === 'function') {
                // Try multiple candidate modelAssetPath locations because CDN paths
                // sometimes return 404. If none work, print a helpful message and
                // fall back to the bounding-box detector.
                const candidateUrls = [
                    // Prefer a locally-hosted model if present
                    '/static/models/face_landmarker.task',
                    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float32/latest/face_landmarker.task',
                    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float32/1/face_landmarker.task',
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm/face_landmarker.task'
                ];

                let created = false;
                for (const url of candidateUrls) {
                    try {
                        this.faceLandmarker = await FaceLandmarkerRef.createFromOptions(vision, {
                            baseOptions: { modelAssetPath: url, delegate: 'GPU' },
                            runningMode: 'VIDEO',
                            numFaces: 1,
                            minDetectionConfidence: this.confidence
                        });
                        console.log('FaceLandmarker loaded from', url);
                        createdSomething = true;
                        created = true;
                        break;
                    } catch (err) {
                        console.warn(`FaceLandmarker load failed for ${url}:`, err && err.message ? err.message : err);
                        // continue to next candidate
                    }
                }

                if (!created) {
                    console.warn('FaceLandmarker could not be loaded from known CDN locations. Landmarks will be unavailable.');
                    console.warn('To enable landmark-based placement, host the model file locally at /static/models/face_landmarker.task and change the modelAssetPath in static/js/faceDetection.js to \'/static/models/face_landmarker.task\'.');
                    console.warn('Alternatively provide a working CDN URL and update the candidateUrls array in static/js/faceDetection.js.');
                }
            }

            if (!createdSomething) {
                console.warn('No MediaPipe face components could be created');
                return this.initializeFallbackDetection();
            }

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
            // If we have a face landmarker, use it to get landmarks + bounding box
            if (this.faceLandmarker) {
                const results = await this.faceLandmarker.detectForVideo(video, Date.now());
                if (!results) return this.getFallbackFaceDetection();

                // results may contain faceLandmarks and faceRectangles depending on build
                const landmarks = results.faceLandmarks || results.landmarks || [];
                const rects = results.faceRectangles || results.detections || [];

                // If we have landmarks, compute bounding box from them
                if (landmarks && landmarks.length > 0) {
                    const lm = landmarks[0];
                    // lm is an array of points {x, y, z} normalized to [0,1]
                    let minX = 1, minY = 1, maxX = 0, maxY = 0;
                    for (let p of lm) {
                        if (p.x < minX) minX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y > maxY) maxY = p.y;
                    }

                    const box = {
                        x: minX * this.canvasWidth,
                        y: minY * this.canvasHeight,
                        width: (maxX - minX) * this.canvasWidth,
                        height: (maxY - minY) * this.canvasHeight
                    };

                    return [{
                        boundingBox: box,
                        confidence: 0.95,
                        landmarks: lm // normalized
                    }];
                }

                // Otherwise, try to use rectangle/detections
                if (rects && rects.length > 0) {
                    const r = rects[0];
                    // rect format may vary depending on build - try to normalize
                    const box = r.boundingBox || r.box || {
                        x: (r.x || 0) * this.canvasWidth,
                        y: (r.y || 0) * this.canvasHeight,
                        width: (r.width || r.w || 0) * this.canvasWidth,
                        height: (r.height || r.h || 0) * this.canvasHeight
                    };
                    return [{ boundingBox: box, confidence: r.score || 0.9 }];
                }
            }

            // Fallback to older faceDetector API if present
            if (this.faceDetector) {
                const results = await this.faceDetector.detectForVideo(video, Date.now());
                return results.detections || [];
            }

            return this.getFallbackFaceDetection();
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
        
        const result = {
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

        // Include landmarks if provided (normalized coords). Also provide a
        // pixel-space copy for convenience for mask placement code.
        if (detection.landmarks) {
            result.landmarks = detection.landmarks;
            result.landmarks_px = detection.landmarks.map(p => ({
                x: (p.x || 0) * this.canvasWidth,
                y: (p.y || 0) * this.canvasHeight,
                z: p.z
            }));
        }

        return result;
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
