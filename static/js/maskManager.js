/**
 * FIXED Mask Manager with Proper Face-Proportional Scaling
 */

class MaskManager {
    constructor() {
        this.masks = [];
        this.activeMask = null;
        this.maskImages = new Map();
        this.isLoading = false;
        this.faceDetection = null;
        
        // Proportional scaling parameters
    this.baseMaskScale = 1.2; // How much larger than face
        this.maskScaleRange = { min: 0.8, max: 2.0 };
        this.autoPosition = true;
        this.manualOffsetX = 0;
        this.manualOffsetY = 0;
    // Smoothing to reduce jitter when relying on bounding boxes
    this.smoothingFactor = 0.35; // 0 (no smoothing) .. 1 (max smoothing)
    this.lastMaskParams = null;
        
        // Mask type specific scaling factors
        this.maskScaleFactors = {
            'vader-mask': 1.3,      // Larger helmet
            'sith-lord': 1.1,       // Normal face mask
            'storm-trooper': 1.4,   // Large helmet
            'emperor': 1.2,         // Hood with face
            'kylo-ren': 1.25,       // Medium helmet
            'jedi': 1.15            // Simple hood
        };

    // Per-mask adjustment storage (persist to localStorage)
    this.maskAdjustments = JSON.parse(localStorage.getItem('maskAdjustments') || '{}');
    // Presets produced by auto-tuning or wizard
    this.maskPresets = JSON.parse(localStorage.getItem('maskPresets') || '{}');
        
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('Initializing Enhanced Mask Manager...');
            
            await this.loadMasks();
            
            // Initialize face detection
            if (window.FaceDetection) {
                this.faceDetection = new window.FaceDetection();
                await this.faceDetection.initialize();
            }
            
            this.renderAdjustmentControls(); // MUST be rendered before mask selector, which calls selectMask
            this.renderMaskSelector();
            this.bindEvents();
            this.bindWizardEvents();
            this.bindMouseWheelEvents();
            
            console.log('Mask Manager initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Mask Manager:', error);
        }
    }
    
    async loadMasks() {
        try {
            const response = await fetch('/api/masks');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.masks = await response.json();
            console.log(`Loaded ${this.masks.length} masks`);
            
            await this.preloadMaskImages();
            
        } catch (error) {
            console.error('Error loading masks:', error);
            this.loadDefaultMasks();
        }
    }
    
    loadDefaultMasks() {
        this.masks = [
            {
                id: 'none',
                name: 'No Mask',
                image: null,
                icon: '🚫',
                description: 'Original camera feed'
            },
            {
                id: 'vader-mask',
                name: 'Darth Vader',
                image: '/static/masks/vader-mask.png',
                icon: '🎭',
                description: 'Dark Lord of the Sith'
            },
            {
                id: 'sith-lord',
                name: 'Sith Lord',
                image: '/static/masks/sith-lord-mask.png',
                icon: '⚔️',
                description: 'Ancient Sith warrior'
            }
        ];
    }
    
    async preloadMaskImages() {
        const loadPromises = this.masks
            .filter(mask => mask.image)
            .map(mask => this.loadMaskImage(mask));
        
        await Promise.all(loadPromises);
        console.log('All mask images preloaded');
    }
    
    loadMaskImage(mask) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.maskImages.set(mask.id, img);
                console.log(`Loaded mask image: ${mask.name} (${img.width}x${img.height})`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.warn(`Failed to load mask image: ${mask.name}`, error);
                // Create a placeholder colored rectangle
                this.createPlaceholderMask(mask);
                resolve(null);
            };
            
            img.src = mask.image;
        });
    }
    
    createPlaceholderMask(mask) {
        // Create a simple colored placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        // Color based on mask type
        const colors = {
            'vader-mask': '#000000',
            'sith-lord': '#8B0000',
            'storm-trooper': '#FFFFFF',
            'emperor': '#4B0082',
            'kylo-ren': '#2F4F4F',
            'jedi': '#8B4513'
        };
        
        const color = colors[mask.id] || '#666666';
        
        // Draw basic mask shape
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        // Oval mask shape
        ctx.beginPath();
        ctx.ellipse(200, 250, 150, 200, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Eye holes
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.globalCompositeOperation = 'destination-out';
        
        // Left eye
        ctx.beginPath();
        ctx.ellipse(170, 200, 25, 35, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.ellipse(230, 200, 25, 35, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        
        // Convert canvas to image
        const img = new Image();
        img.src = canvas.toDataURL();
        this.maskImages.set(mask.id, img);
        
        console.log(`Created placeholder for ${mask.name}`);
    }
    
    renderMaskSelector() {
        const maskGrid = document.getElementById('filter-grid');
        if (!maskGrid) {
            console.error('Mask grid element not found');
            return;
        }
        
        maskGrid.innerHTML = '';
        
        this.masks.forEach(mask => {
            const maskCard = this.createMaskCard(mask);
            maskGrid.appendChild(maskCard);
        });
        
        // Select default (no mask)
        const noMask = this.masks.find(m => m.id === 'none');
        if (noMask) {
            this.selectMask(noMask);
        }
    }
    
    createMaskCard(mask) {
        const card = document.createElement('div');
        card.className = 'filter-card mask-card';
        card.setAttribute('data-mask-id', mask.id);
        
        let previewHtml = '';
        if (mask.image && this.maskImages.has(mask.id)) {
            previewHtml = `<div class="mask-preview">
                <img src="${mask.image}" alt="${mask.name}" class="mask-preview-img">
            </div>`;
        }
        
        card.innerHTML = `
            <div class="filter-icon">${mask.icon}</div>
            <div class="filter-name">${mask.name}</div>
            <div class="filter-description">${mask.description}</div>
            ${previewHtml}
        `;
        
        card.addEventListener('click', () => {
            this.selectMask(mask);
        });
        
        return card;
    }
    
    selectMask(mask) {
        console.log(`Selecting mask: ${mask.name}`);
        
        // Update UI
        document.querySelectorAll('.mask-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const selectedCard = document.querySelector(`[data-mask-id="${mask.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        
        // Set active mask
        this.activeMask = mask.id === 'none' ? null : mask;
        
        // Reset manual offsets when changing masks
    // Load per-mask adjustments if available
    const adj = this.maskAdjustments[mask.id] || { scale: this.baseMaskScale, offsetX: 0, offsetY: 0 };
    this.baseMaskScale = adj.scale || this.baseMaskScale;
    this.manualOffsetX = adj.offsetX || 0;
    this.manualOffsetY = adj.offsetY || 0;
    // Reset temporal smoothing when switching masks so the new mask snaps
    // into place rather than blending from the previous mask geometry.
    this.lastMaskParams = null;
        
        // Update dark side level
        this.updateDarkSideLevel(mask.id);
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('force-push');
        }
        
        // Show notification
        if (window.showNotification) {
            window.showNotification(
                mask.id === 'none' ? 'Mask removed' : `${mask.name} applied`,
                'success'
            );
        }
        
        console.log(`Mask ${mask.name} selected successfully`);
        // Apply auto-tuning presets/heuristics
        try {
            const latestFace = this.faceDetection ? this.faceDetection.getLatestFace() : null;
            this.applyAutoTuning(mask.id, latestFace);
        } catch (e) {
            console.warn('Auto-tuning failed:', e);
        }
        // Update adjustment controls to reflect current mask
        this.updateAdjustmentControls(mask.id);
    }
    
    applyMaskToCanvas(context, canvas) {
        // Show/hide face detection hint in the controls area
        try {
            const hintEl = document.querySelector('.mask-controls .face-hint') || document.querySelector('.face-hint');
            if (hintEl) {
                const fd = this.faceDetection ? this.faceDetection.getLatestFace() : null;
                hintEl.style.display = fd ? 'none' : 'block';
            }
        } catch (e) {
            // ignore DOM errors
        }

        if (!this.activeMask || !context) return;
        const maskImage = this.maskImages.get(this.activeMask.id);
        if (!maskImage) return;

        try {
            // Get face detection data; prefer latest detection but if not
            // available, ask the faceDetection for a fallback box so the mask
            // will still attempt to position roughly at the center of the
            // camera feed.
            let faceData = this.faceDetection ? this.faceDetection.getLatestFace() : null;
            if (!faceData && this.faceDetection && typeof this.faceDetection.getFallbackFaceDetection === 'function') {
                const fallback = this.faceDetection.getFallbackFaceDetection();
                if (Array.isArray(fallback) && fallback.length > 0) {
                    // normalize the fallback structure to match actual detections
                    const box = fallback[0].boundingBox || fallback[0];
                    faceData = {
                        x: box.x,
                        y: box.y,
                        width: box.width,
                        height: box.height,
                        centerX: box.x + box.width / 2,
                        centerY: box.y + box.height / 2,
                        confidence: fallback[0].confidence || 0.8
                    };
                }
            }

            // Calculate mask position and size (handles normalized or absolute coords)
            const maskParams = this.calculateMaskParameters(faceData, canvas, maskImage);

            // Apply mask with proper blending
            this.drawMaskOnCanvas(context, maskImage, maskParams);

            // Debug: draw raw detector box and landmarks if available
            if (window.location.search.includes('debug')) {
                context.save();
                context.strokeStyle = '#00ffff';
                context.lineWidth = 2;
                // Draw raw bounding box if available
                if (faceData && faceData.x !== undefined) {
                    const rawX = faceData.x;
                    const rawY = faceData.y;
                    const rawW = faceData.width;
                    const rawH = faceData.height;
                    context.strokeRect(rawX, rawY, rawW, rawH);
                }

                // Draw landmarks (pixel coords)
                if (faceData && faceData.landmarks_px && faceData.landmarks_px.length) {
                    context.fillStyle = '#ff00ff';
                    faceData.landmarks_px.forEach(pt => {
                        context.beginPath();
                        context.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
                        context.fill();
                    });
                }

                // Draw estimated anchor points if present
                if (faceData && !faceData.landmarks_px) {
                    // Recompute the same estimates used for positioning
                    const faceCenterX = faceData.centerX || (faceData.x + faceData.width / 2);
                    const faceCenterY = faceData.centerY || (faceData.y + faceData.height / 2);
                    const faceWidth = faceData.width || (faceData.normalizedWidth * context.canvas.width);
                    const faceHeight = faceData.height || (faceData.normalizedHeight * context.canvas.height);
                    const leftEyeX = faceCenterX - (faceWidth * 0.18);
                    const rightEyeX = faceCenterX + (faceWidth * 0.18);
                    const eyeY = faceCenterY - (faceHeight * 0.18);
                    const noseY = faceCenterY - (faceHeight * 0.05);

                    context.fillStyle = '#ffff00';
                    // left eye
                    context.beginPath(); context.arc(leftEyeX, eyeY, 4, 0, Math.PI * 2); context.fill();
                    // right eye
                    context.beginPath(); context.arc(rightEyeX, eyeY, 4, 0, Math.PI * 2); context.fill();
                    // nose
                    context.beginPath(); context.arc(faceCenterX, noseY, 4, 0, Math.PI * 2); context.fill();
                }
                context.restore();
            }

        } catch (error) {
            console.error('Error applying mask to canvas:', error);
        }
    }
    
    calculateMaskParameters(faceData, canvas, maskImage) {
        // Get mask-specific scale factor
        const maskScaleFactor = this.maskScaleFactors[this.activeMask.id] || 1.2;
        
        let params = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            opacity: 1.0
        };
        
        if (faceData && this.autoPosition) {
            // Face-based positioning and scaling
            // Support both absolute coordinates and normalized (0-1) coordinates
            let faceWidth = faceData.width;
            let faceHeight = faceData.height;
            let faceCenterX = faceData.centerX;
            let faceCenterY = faceData.centerY;

            // Helper to detect a normalized value (0..1)
            const isNormalized = (v) => (v !== undefined && v <= 1);

            // Width/height: prefer normalized values if present
            if (isNormalized(faceData.normalizedWidth)) {
                faceWidth = faceData.normalizedWidth * canvas.width;
            } else if (isNormalized(faceData.width)) {
                faceWidth = faceData.width * canvas.width;
            }

            if (isNormalized(faceData.normalizedHeight)) {
                faceHeight = faceData.normalizedHeight * canvas.height;
            } else if (isNormalized(faceData.height)) {
                faceHeight = faceData.height * canvas.height;
            }

            // Top-left coordinates (normalized or absolute)
            let topLeftX = undefined;
            let topLeftY = undefined;
            if (isNormalized(faceData.normalizedX)) {
                topLeftX = faceData.normalizedX * canvas.width;
            } else if (faceData.x !== undefined) {
                topLeftX = faceData.x;
            }

            if (isNormalized(faceData.normalizedY)) {
                topLeftY = faceData.normalizedY * canvas.height;
            } else if (faceData.y !== undefined) {
                topLeftY = faceData.y;
            }

            // Compute center from available information
            if (faceCenterX === undefined) {
                if (topLeftX !== undefined && faceWidth !== undefined) {
                    faceCenterX = topLeftX + (faceWidth / 2);
                } else if (isNormalized(faceData.centerX)) {
                    faceCenterX = faceData.centerX * canvas.width;
                }
            } else if (isNormalized(faceCenterX)) {
                faceCenterX = faceCenterX * canvas.width;
            }

            if (faceCenterY === undefined) {
                if (topLeftY !== undefined && faceHeight !== undefined) {
                    faceCenterY = topLeftY + (faceHeight / 2);
                } else if (isNormalized(faceData.centerY)) {
                    faceCenterY = faceData.centerY * canvas.height;
                }
            } else if (isNormalized(faceCenterY)) {
                faceCenterY = faceCenterY * canvas.height;
            }

            // If width/height still undefined, try reasonable defaults
            if (faceWidth === undefined && faceHeight !== undefined) {
                faceWidth = faceHeight / 1.3;
            }
            if (faceHeight === undefined && faceWidth !== undefined) {
                faceHeight = faceWidth * 1.3;
            }
            
            // Calculate mask dimensions based on face size
            const maskAspectRatio = maskImage.height / maskImage.width || 1;

            // If landmarks are provided (pixel coords), prefer them for sizing
            // and centering (more accurate than the bounding box center).
            if (faceData.landmarks_px && faceData.landmarks_px.length > 0) {
                const pts = faceData.landmarks_px;
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                pts.forEach(p => {
                    if (p.x < minX) minX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y > maxY) maxY = p.y;
                });

                const lmWidth = Math.max(1, maxX - minX);
                const lmHeight = Math.max(1, maxY - minY);

                // Use landmarks width as faceWidth if available
                faceWidth = lmWidth;
                faceHeight = lmHeight;
                faceCenterX = minX + lmWidth / 2;
                faceCenterY = minY + lmHeight / 2;
            }

            // Scale mask relative to face size and base mask scale
            params.width = faceWidth * maskScaleFactor * this.baseMaskScale;
            params.height = params.width * maskAspectRatio;
            
            // Ensure mask doesn't exceed reasonable bounds
            const maxMaskWidth = canvas.width * 0.8;
            const maxMaskHeight = canvas.height * 0.8;
            
            if (params.width > maxMaskWidth) {
                params.width = maxMaskWidth;
                params.height = params.width * maskAspectRatio;
            }
            
            if (params.height > maxMaskHeight) {
                params.height = maxMaskHeight;
                params.width = params.height / maskAspectRatio;
            }
            
            // Position mask relative to face center
            // Default center positioning
            params.x = faceCenterX - (params.width / 2);
            params.y = faceCenterY - (params.height / 2);

            // If landmarks are not available, estimate facial landmarks from
            // the bounding box to get better anchor points (eyes, nose, chin).
            let est = null;
            if (!faceData.landmarks_px) {
                const leftEyeX = faceCenterX - (faceWidth * 0.18);
                const rightEyeX = faceCenterX + (faceWidth * 0.18);
                const eyeY = faceCenterY - (faceHeight * 0.18);
                const noseX = faceCenterX;
                const noseY = faceCenterY - (faceHeight * 0.05);
                const chinY = faceCenterY + (faceHeight * 0.45);
                est = { leftEyeX, rightEyeX, eyeY, noseX, noseY, chinY };
            }

            // Use estimated anchor points for more natural mask placement
            // depending on the mask type (helmets vs masks/hoods).
            if (est) {
                switch (this.activeMask.id) {
                    // Helmets should sit slightly higher and center on the head
                    case 'vader-mask':
                    case 'storm-trooper':
                    case 'kylo-ren':
                    case 'emperor':
                        params.x = faceCenterX - (params.width / 2);
                        params.y = faceCenterY - (params.height * 0.55);
                        break;
                    // Face masks / hoods should align to the nose/eyes
                    case 'sith-lord':
                    case 'jedi':
                        params.x = faceCenterX - (params.width / 2);
                        params.y = est.noseY - (params.height * 0.45);
                        break;
                    default:
                        // keep default centered behavior
                        break;
                }
            }
            
            // Adjust positioning based on mask type
            const positionAdjustments = {
                'vader-mask': { x: 0, y: -faceHeight * 0.1 },
                'sith-lord': { x: 0, y: -faceHeight * 0.05 },
                'storm-trooper': { x: 0, y: -faceHeight * 0.1 },
                'emperor': { x: 0, y: -faceHeight * 0.15 },
                'kylo-ren': { x: 0, y: -faceHeight * 0.08 },
                'jedi': { x: 0, y: -faceHeight * 0.12 }
            };
            
            const adjustment = positionAdjustments[this.activeMask.id] || { x: 0, y: 0 };
            params.x += adjustment.x;
            params.y += adjustment.y;
            
        } else {
            // Manual/centered positioning
            const canvasAspectRatio = canvas.height / canvas.width;
            const maskAspectRatio = maskImage.height / maskImage.width;
            
            // Default to 40% of canvas width
            params.width = canvas.width * 0.4;
            params.height = params.width * maskAspectRatio;
            
            // Center the mask
            params.x = (canvas.width - params.width) / 2;
            params.y = (canvas.height - params.height) / 2.5; // Slightly higher for face area
        }
        
        // Apply manual offsets
        params.x += this.manualOffsetX;
        params.y += this.manualOffsetY;

        // Apply smoothing to reduce jitter when following bounding boxes.
        // We smooth x, y, width, height using exponential smoothing.
        if (this.lastMaskParams && this.autoPosition) {
            const a = 1 - this.smoothingFactor; // smoothing factor: lower => more smoothing
            params.x = this.lastMaskParams.x * this.smoothingFactor + params.x * a;
            params.y = this.lastMaskParams.y * this.smoothingFactor + params.y * a;
            params.width = this.lastMaskParams.width * this.smoothingFactor + params.width * a;
            params.height = this.lastMaskParams.height * this.smoothingFactor + params.height * a;
        }

        // Save last params for next frame
        this.lastMaskParams = {
            x: params.x,
            y: params.y,
            width: params.width,
            height: params.height
        };
        
        // Ensure mask stays within canvas bounds
        params.x = Math.max(0, Math.min(params.x, canvas.width - params.width));
        params.y = Math.max(0, Math.min(params.y, canvas.height - params.height));
        
        return params;
    }
    
    // Auto-calibrate the current mask using the latest detected face and
    // persist per-mask offsets so the user can get a correct starting point.
    async calibrateMask() {
        if (!this.activeMask) {
            window.showNotification && window.showNotification('No mask selected', 'warn');
            return false;
        }

        const face = this.faceDetection && typeof this.faceDetection.getLatestFace === 'function'
            ? this.faceDetection.getLatestFace()
            : null;
        if (!face) {
            window.showNotification && window.showNotification('Face not detected. Please center your face and try again.', 'warn');
            return false;
        }

        // Temporarily remove manual offsets to compute the default mask placement
        const origOffsetX = this.manualOffsetX || 0;
        const origOffsetY = this.manualOffsetY || 0;
        this.manualOffsetX = 0;
        this.manualOffsetY = 0;
        const params = this.calculateMaskParameters(face, document.querySelector('canvas') || { width: 640, height: 480 }, this.maskImages.get(this.activeMask.id));
        // restore manual offsets
        this.manualOffsetX = origOffsetX;
        this.manualOffsetY = origOffsetY;

        const faceCenterX = (face.x || 0) + (face.width || 0) / 2;
        const faceCenterY = (face.y || 0) + (face.height || 0) / 2;
        const maskCenterX = (params.x || 0) + (params.width || 0) / 2;
        const maskCenterY = (params.y || 0) + (params.height || 0) / 2;

        const neededOffsetX = faceCenterX - maskCenterX;
        const neededOffsetY = faceCenterY - maskCenterY;

        const id = this.activeMask.id;
        this.maskAdjustments[id] = this.maskAdjustments[id] || { scale: this.baseMaskScale, offsetX: 0, offsetY: 0 };
        this.maskAdjustments[id].offsetX = (this.maskAdjustments[id].offsetX || 0) + neededOffsetX;
        this.maskAdjustments[id].offsetY = (this.maskAdjustments[id].offsetY || 0) + neededOffsetY;

        // Apply immediately so the user sees the result
        this.manualOffsetX = (this.manualOffsetX || 0) + neededOffsetX;
        this.manualOffsetY = (this.manualOffsetY || 0) + neededOffsetY;

        localStorage.setItem('maskAdjustments', JSON.stringify(this.maskAdjustments));
        return true;
    }

    // Bind DOM events for the wizard modal
    bindWizardEvents() {
        const startBtn = document.getElementById('wizard-start');
        const cancelBtn = document.getElementById('wizard-cancel');
        const closeBtn = document.getElementById('wizard-close');
        const captureBtn = document.getElementById('wizard-capture');
        const finishBtn = document.getElementById('wizard-finish');
        const abortBtn = document.getElementById('wizard-abort');

        if (startBtn) startBtn.addEventListener('click', () => this.startWizard());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeWizard());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeWizard());
        if (captureBtn) captureBtn.addEventListener('click', () => this.captureWizardSample());
        if (finishBtn) finishBtn.addEventListener('click', () => this.finishWizard());
        if (abortBtn) abortBtn.addEventListener('click', () => this.closeWizard());
        // Model upload/check buttons
        const modelUploadBtn = document.getElementById('model-upload-btn');
        const modelFileInput = document.getElementById('model-file-input');
        const modelCheckBtn = document.getElementById('model-check-btn');
        const modelCloseBtn = document.getElementById('model-close');

        if (modelUploadBtn && modelFileInput) modelUploadBtn.addEventListener('click', () => {
            const f = modelFileInput.files && modelFileInput.files[0];
            if (!f) return window.showNotification && window.showNotification('Please select a .task file first', 'warn');
            this.uploadModel(f);
        });
        if (modelCheckBtn) modelCheckBtn.addEventListener('click', () => this.checkLocalModel());
        if (modelCloseBtn) modelCloseBtn.addEventListener('click', () => {
            const pnl = document.getElementById('model-panel'); if (pnl) pnl.style.display = 'none';
        });
    }

    openCalibrationWizard() {
        const modal = document.getElementById('calibration-wizard');
        if (!modal) return;
        modal.style.display = 'block';
        // Reset wizard UI
        const step = document.getElementById('wizard-step');
        const prog = document.getElementById('wizard-progress');
        if (step && prog) {
            step.style.display = 'block';
            prog.style.display = 'none';
            document.getElementById('wizard-sample-count').textContent = '0';
            document.getElementById('wizard-finish').disabled = true;
        }
        this.wizardSamples = [];
        // show visual overlay to guide the user
        this.showWizardOverlay(true);
    }

    closeWizard() {
        const modal = document.getElementById('calibration-wizard');
        if (!modal) return;
        modal.style.display = 'none';
        this.wizardSamples = [];
        this.showWizardOverlay(false);
    }

    async startWizard() {
        // move UI to progress state
        const step = document.getElementById('wizard-step');
        const prog = document.getElementById('wizard-progress');
        if (step && prog) {
            step.style.display = 'none';
            prog.style.display = 'block';
            document.getElementById('wizard-sample-count').textContent = '0';
        }
        this.wizardSamples = [];
        window.showNotification && window.showNotification('Wizard started: capture 3 samples', 'info');
    }

    // Capture a single sample of the current face detection; collect 3 samples and enable Finish
    async captureWizardSample() {
        const face = this.faceDetection && typeof this.faceDetection.getLatestFace === 'function'
            ? this.faceDetection.getLatestFace()
            : null;
        if (!face) {
            window.showNotification && window.showNotification('Face not detected. Please center your face and try again.', 'warn');
            return;
        }

        // Save sample as the face center and size
        this.wizardSamples = this.wizardSamples || [];
        this.wizardSamples.push({ x: face.x, y: face.y, width: face.width, height: face.height, centerX: face.centerX, centerY: face.centerY });
        document.getElementById('wizard-sample-count').textContent = String(this.wizardSamples.length);

        if (this.wizardSamples.length >= 3) {
            document.getElementById('wizard-finish').disabled = false;
            window.showNotification && window.showNotification('Samples collected — click Finish', 'success');
        } else {
            window.showNotification && window.showNotification(`Sample ${this.wizardSamples.length} captured`, 'info');
        }
    }

    // Create or remove a simple crosshair overlay to guide the user during wizard
    showWizardOverlay(visible) {
        let overlay = document.getElementById('wizard-overlay');
        if (visible) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'wizard-overlay';
                overlay.style.position = 'absolute';
                overlay.style.left = '50%';
                overlay.style.top = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.pointerEvents = 'none';
                overlay.style.width = '220px';
                overlay.style.height = '220px';
                overlay.style.border = '2px dashed rgba(255,255,255,0.6)';
                overlay.style.borderRadius = '50%';
                overlay.style.boxSizing = 'border-box';
                overlay.style.zIndex = '9999';

                // crosshair lines
                const h = document.createElement('div');
                h.style.position = 'absolute';
                h.style.left = '50%';
                h.style.top = '0';
                h.style.width = '2px';
                h.style.height = '100%';
                h.style.background = 'rgba(255,255,255,0.6)';
                overlay.appendChild(h);

                const v = document.createElement('div');
                v.style.position = 'absolute';
                v.style.top = '50%';
                v.style.left = '0';
                v.style.height = '2px';
                v.style.width = '100%';
                v.style.background = 'rgba(255,255,255,0.6)';
                overlay.appendChild(v);

                // Append overlay inside the camera container so it aligns with the video
                const cameraContainer = document.querySelector('.camera-container');
                if (cameraContainer) {
                    // Ensure container is positioned to allow absolute children
                    cameraContainer.style.position = cameraContainer.style.position || 'relative';
                    overlay.style.position = 'absolute';
                    overlay.style.left = '50%';
                    overlay.style.top = '50%';
                    overlay.style.transform = 'translate(-50%, -50%)';
                    overlay.style.zIndex = '4';
                    cameraContainer.appendChild(overlay);
                } else {
                    document.body.appendChild(overlay);
                }
            }
        } else {
            if (overlay) overlay.remove();
        }
    }

    // Average samples, compute offsets, save preset for this mask
    async finishWizard() {
        if (!this.activeMask) {
            window.showNotification && window.showNotification('No mask selected', 'warn');
            return;
        }
        const samples = this.wizardSamples || [];
        if (samples.length === 0) {
            window.showNotification && window.showNotification('No samples collected', 'warn');
            return;
        }

        // Average sample centers
        const avg = samples.reduce((acc, s) => {
            acc.x += s.x; acc.y += s.y; acc.centerX += s.centerX; acc.centerY += s.centerY; acc.width += s.width; acc.height += s.height; return acc;
        }, { x:0,y:0,centerX:0,centerY:0,width:0,height:0 });
        const count = samples.length;
        avg.x /= count; avg.y /= count; avg.centerX /= count; avg.centerY /= count; avg.width /= count; avg.height /= count;

        // Compute default placement using current calculateMaskParameters (without manual offsets)
        const canvas = document.querySelector('canvas') || { width: 640, height: 480 };
        const maskImg = this.maskImages.get(this.activeMask.id);
        const fakeFace = { x: avg.x, y: avg.y, width: avg.width, height: avg.height, centerX: avg.centerX, centerY: avg.centerY };
        // Temporarily zero manual offsets
        const oldX = this.manualOffsetX; const oldY = this.manualOffsetY;
        this.manualOffsetX = 0; this.manualOffsetY = 0;
        const params = this.calculateMaskParameters(fakeFace, canvas, maskImg);
        this.manualOffsetX = oldX; this.manualOffsetY = oldY;

        // Compute needed offsets to align mask center to sampled face center
        const maskCenterX = (params.x || 0) + (params.width || 0) / 2;
        const maskCenterY = (params.y || 0) + (params.height || 0) / 2;
        const neededOffsetX = avg.centerX - maskCenterX;
        const neededOffsetY = avg.centerY - maskCenterY;

        // Save preset for this mask
        const id = this.activeMask.id;
        this.maskPresets[id] = this.maskPresets[id] || {};
        this.maskPresets[id].offsetX = (this.maskPresets[id].offsetX || 0) + neededOffsetX;
        this.maskPresets[id].offsetY = (this.maskPresets[id].offsetY || 0) + neededOffsetY;
        this.maskPresets[id].scale = (this.maskPresets[id].scale || this.baseMaskScale);

        // Persist and apply
        localStorage.setItem('maskPresets', JSON.stringify(this.maskPresets));
        this.manualOffsetX = (this.manualOffsetX || 0) + neededOffsetX;
        this.manualOffsetY = (this.manualOffsetY || 0) + neededOffsetY;
        window.showNotification && window.showNotification('Wizard calibration saved for mask', 'success');
        this.closeWizard();
        this.updateAdjustmentControls(id);
    }

    // Upload a model file to the backend endpoint which saves it into static/models
    async uploadModel(file) {
        try {
            const fd = new FormData();
            fd.append('model', file, file.name);
            const res = await fetch('/api/upload-model', { method: 'POST', body: fd });
            const json = await res.json();
            if (res.ok && json.success) {
                window.showNotification && window.showNotification('Model uploaded successfully', 'success');
                // Optionally re-check and inform user
                this.checkLocalModel();
            } else {
                console.error('Model upload failed', json);
                window.showNotification && window.showNotification('Model upload failed', 'error');
            }
        } catch (err) {
            console.error('Error uploading model:', err);
            window.showNotification && window.showNotification('Model upload error', 'error');
        }
    }

    // Check whether the local model file exists at /static/models/face_landmarker.task
    async checkLocalModel() {
        const statusEl = document.getElementById('model-check-status');
        try {
            const resp = await fetch('/static/models/face_landmarker.task', { method: 'HEAD' });
            if (resp.ok) {
                if (statusEl) statusEl.textContent = 'Local model found at /static/models/face_landmarker.task';
                window.showNotification && window.showNotification('Local FaceLandmarker model found', 'success');
            } else {
                if (statusEl) statusEl.textContent = 'No local model found. Upload using the panel above.';
                window.showNotification && window.showNotification('Local model not found', 'warn');
            }
        } catch (err) {
            console.error('Error checking local model:', err);
            if (statusEl) statusEl.textContent = 'Error checking local model (see console).';
            window.showNotification && window.showNotification('Model check failed', 'error');
        }
    }

    // Apply auto-tuning heuristics when a mask is selected
    applyAutoTuning(maskId, face) {
        // If we have a saved preset, apply it immediately
        if (this.maskPresets[maskId]) {
            const p = this.maskPresets[maskId];
            this.baseMaskScale = p.scale || this.baseMaskScale;
            this.manualOffsetX = p.offsetX || 0;
            this.manualOffsetY = p.offsetY || 0;
            console.log(`Applied saved preset for ${maskId}`);
            return;
        }

        // Otherwise, apply heuristics based on mask type and face size
        if (!face) return;
        const faceHeight = face.height || (face.normalizedHeight ? face.normalizedHeight * (document.querySelector('canvas')?.height || 480) : 100);
        // Default mapping: helmets sit higher, require slightly larger scale
        switch (maskId) {
            case 'vader-mask':
            case 'storm-trooper':
            case 'kylo-ren':
                this.baseMaskScale = 1.15 + Math.min(0.4, faceHeight / 300);
                this.manualOffsetY = -Math.max(10, faceHeight * 0.08);
                break;
            case 'sith-lord':
            case 'jedi':
                this.baseMaskScale = 1.05 + Math.min(0.3, faceHeight / 400);
                this.manualOffsetY = -Math.max(5, faceHeight * 0.03);
                break;
            default:
                this.baseMaskScale = 1.1;
                this.manualOffsetY = -Math.max(5, faceHeight * 0.04);
                break;
        }
    }
    
    drawMaskOnCanvas(context, maskImage, params) {
        context.save();
        
        // Apply special effects for certain masks
        if (this.activeMask.id === 'vader-mask' || this.activeMask.id === 'sith-lord') {
            context.shadowColor = '#ff0000';
            context.shadowBlur = 8;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
        }
        
        // Apply opacity
        context.globalAlpha = params.opacity;
        
        // Apply rotation if needed
        if (params.rotation !== 0) {
            const centerX = params.x + params.width / 2;
            const centerY = params.y + params.height / 2;
            context.translate(centerX, centerY);
            context.rotate(params.rotation);
            context.translate(-centerX, -centerY);
        }
        
        // Draw the mask
        context.drawImage(
            maskImage,
            params.x,
            params.y,
            params.width,
            params.height
        );
        
        context.restore();
        
        // Debug info (remove in production)
        if (window.location.search.includes('debug')) {
            this.drawDebugInfo(context, params);
        }
    }
    
    drawDebugInfo(context, params) {
        context.save();
        context.strokeStyle = '#00ff00';
        context.lineWidth = 2;
        context.strokeRect(params.x, params.y, params.width, params.height);
        
        context.fillStyle = '#00ff00';
        context.font = '12px Arial';
        context.fillText(
            `${this.activeMask.name}: ${Math.round(params.width)}x${Math.round(params.height)}`,
            params.x,
            params.y - 5
        );
        context.restore();
    }
    
    updateDarkSideLevel(maskId) {
        let level = 0;
        if (maskId && maskId !== 'none') {
            const darkSideMasks = ['vader-mask', 'sith-lord', 'storm-trooper', 'emperor', 'kylo-ren'];
            if (darkSideMasks.includes(maskId)) {
                level = 50 + Math.floor(Math.random() * 50);
            } else {
                level = 10 + Math.floor(Math.random() * 20); // For non-dark side masks
            }
        }
        
        const levelDisplay = document.getElementById('dark-side-level');
        if (levelDisplay) {
            levelDisplay.textContent = `${level}%`;
        }
    }

    bindMouseWheelEvents() {
        const filterGrid = document.getElementById('filter-grid');
        const cameraContainer = document.querySelector('.camera-container');

        if (filterGrid) {
            filterGrid.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.cycleMasks(e.deltaY > 0 ? 1 : -1);
            }, { passive: false });
        }

        if (cameraContainer) {
            cameraContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.adjustMaskSize(e.deltaY > 0 ? -0.05 : 0.05);
            }, { passive: false });
        }
    }

    cycleMasks(direction) {
        if (!this.masks || this.masks.length === 0) return;

        const currentMaskId = this.activeMask ? this.activeMask.id : this.masks[0].id;
        let currentIndex = this.masks.findIndex(m => m.id === currentMaskId);

        currentIndex += direction;

        if (currentIndex >= this.masks.length) {
            currentIndex = 0; // Wrap to start
        } else if (currentIndex < 0) {
            currentIndex = this.masks.length - 1; // Wrap to end
        }

        const nextMask = this.masks[currentIndex];
        if (nextMask) {
            this.selectMask(nextMask);
        }
    }

    adjustMaskSize(amount) {
        if (!this.activeMask) return;

        let currentScale = parseFloat(this.baseMaskScale);
        currentScale += amount;
        
        // Clamp the scale
        this.baseMaskScale = Math.max(this.maskScaleRange.min, Math.min(this.maskScaleRange.max, currentScale));

        this.updateAdjustmentControls(this.activeMask.id);
    }

    renderAdjustmentControls() {
        const controlsContainer = document.querySelector('.mask-controls');
        if (!controlsContainer) return;

        // Create panel
        let panel = controlsContainer.querySelector('.adjustment-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'adjustment-panel';
            panel.innerHTML = `
                <h4>Mask Adjustment</h4>
                <label>Scale: <input type="range" id="mask-scale" min="0.6" max="2.0" step="0.01"></label>
                <label>Offset X: <input type="range" id="mask-offset-x" min="-200" max="200" step="1"></label>
                <label>Offset Y: <input type="range" id="mask-offset-y" min="-200" max="200" step="1"></label>
                <div class="adjust-actions">
                    <button id="mask-save-adjust" class="btn btn--small">Save</button>
                    <button id="mask-reset-adjust" class="btn btn--small">Reset</button>
                </div>
            `;
            controlsContainer.appendChild(panel);

            // Bind events
            panel.querySelector('#mask-scale').addEventListener('input', (e) => {
                this.baseMaskScale = parseFloat(e.target.value);
            });
            panel.querySelector('#mask-offset-x').addEventListener('input', (e) => {
                this.manualOffsetX = parseInt(e.target.value, 10);
            });
            panel.querySelector('#mask-offset-y').addEventListener('input', (e) => {
                this.manualOffsetY = parseInt(e.target.value, 10);
            });

            panel.querySelector('#mask-save-adjust').addEventListener('click', () => {
                if (!this.activeMask) return;
                this.maskAdjustments[this.activeMask.id] = {
                    scale: this.baseMaskScale,
                    offsetX: this.manualOffsetX,
                    offsetY: this.manualOffsetY
                };
                localStorage.setItem('maskAdjustments', JSON.stringify(this.maskAdjustments));
                window.showNotification && window.showNotification('Adjustments saved', 'success');
            });
            // Calibrate button: auto-compute offsets based on current face detection
            const calibrateBtn = document.createElement('button');
            calibrateBtn.id = 'mask-calibrate';
            calibrateBtn.className = 'btn btn--small';
            calibrateBtn.textContent = 'Auto-Calibrate';
            panel.querySelector('.adjust-actions').appendChild(calibrateBtn);
            calibrateBtn.addEventListener('click', async () => {
                const ok = await this.calibrateMask();
                if (ok) {
                    window.showNotification && window.showNotification('Calibration saved', 'success');
                    this.updateAdjustmentControls(this.activeMask.id);
                }
            });

            // Wizard button: open interactive multi-sample calibration
            const wizardBtn = document.createElement('button');
            wizardBtn.id = 'mask-wizard';
            wizardBtn.className = 'btn btn--small';
            wizardBtn.textContent = 'Calibration Wizard';
            panel.querySelector('.adjust-actions').appendChild(wizardBtn);
            wizardBtn.addEventListener('click', () => this.openCalibrationWizard());

            // Model management button (open upload/check panel)
            const modelBtn = document.createElement('button');
            modelBtn.id = 'model-manage';
            modelBtn.className = 'btn btn--small';
            modelBtn.textContent = 'Manage Model';
            panel.querySelector('.adjust-actions').appendChild(modelBtn);
            modelBtn.addEventListener('click', () => {
                const pnl = document.getElementById('model-panel'); if (pnl) pnl.style.display = 'block';
            });

            // Face detection hint
            let hint = controlsContainer.querySelector('.face-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'face-hint';
                hint.style.marginTop = '8px';
                hint.style.color = '#ffcccc';
                hint.textContent = 'Face not detected — please center your face in the camera.';
                controlsContainer.appendChild(hint);
            }

            panel.querySelector('#mask-reset-adjust').addEventListener('click', () => {
                if (!this.activeMask) return;
                delete this.maskAdjustments[this.activeMask.id];
                localStorage.setItem('maskAdjustments', JSON.stringify(this.maskAdjustments));
                this.baseMaskScale = 1.2;
                this.manualOffsetX = 0;
                this.manualOffsetY = 0;
                this.updateAdjustmentControls(this.activeMask.id);
                window.showNotification && window.showNotification('Adjustments reset', 'info');
            });
            // Smoothing control
            const smoothingRow = document.createElement('div');
            smoothingRow.className = 'smoothing-row';
            smoothingRow.innerHTML = `<label>Smoothing: <input type="range" id="mask-smoothing" min="0" max="0.9" step="0.05"></label>`;
            panel.appendChild(smoothingRow);
            panel.querySelector('#mask-smoothing').addEventListener('input', (e) => {
                this.smoothingFactor = parseFloat(e.target.value);
            });
        }
    }

    updateAdjustmentControls(maskId) {
        const panel = document.querySelector('.adjustment-panel');
        if (!panel) return;
        const adj = this.maskAdjustments[maskId] || { scale: this.baseMaskScale, offsetX: this.manualOffsetX, offsetY: this.manualOffsetY };
        panel.querySelector('#mask-scale').value = adj.scale || this.baseMaskScale;
        panel.querySelector('#mask-offset-x').value = adj.offsetX || this.manualOffsetX || 0;
        panel.querySelector('#mask-offset-y').value = adj.offsetY || this.manualOffsetY || 0;
    }
    
    bindEvents() {
        // Keyboard shortcuts for mask selection
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const key = e.key.toLowerCase();
            if (key >= '1' && key <= '7') {
                const index = parseInt(key) - 1;
                if (this.masks[index]) {
                    this.selectMask(this.masks[index]);
                }
            } else if (key === '0') {
                const noMask = this.masks.find(m => m.id === 'none');
                if (noMask) this.selectMask(noMask);
            }
        });
        
        // Manual mask positioning controls
        document.addEventListener('keydown', (e) => {
            if (!this.activeMask) return;
            
            const step = e.shiftKey ? 10 : 2; // Larger steps with Shift
            let changed = false;
            
            switch (e.key) {
                case 'ArrowUp':
                    this.manualOffsetY -= step;
                    changed = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.manualOffsetY += step;
                    changed = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.manualOffsetX -= step;
                    changed = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.manualOffsetX += step;
                    changed = true;
                    e.preventDefault();
                    break;
                case '+':
                case '=':
                    this.baseMaskScale = Math.min(this.maskScaleRange.max, this.baseMaskScale + 0.05);
                    changed = true;
                    e.preventDefault();
                    break;
                case '-':
                    this.baseMaskScale = Math.max(this.maskScaleRange.min, this.baseMaskScale - 0.05);
                    changed = true;
                    e.preventDefault();
                    break;
                case 'r':
                case 'R':
                    // Reset position and scale
                    this.manualOffsetX = 0;
                    this.manualOffsetY = 0;
                    this.baseMaskScale = 1.2;
                    changed = true;
                    e.preventDefault();
                    break;
                case 'm':
                case 'M':
                    this.toggleAutoPosition();
                    e.preventDefault();
                    break;
            }
            
            if (changed && window.showNotification) {
                window.showNotification(
                    `Mask adjusted: Offset(${this.manualOffsetX}, ${this.manualOffsetY}) Scale(${this.baseMaskScale.toFixed(2)})`,
                    'info'
                );
            }
        });
    }
    
    toggleAutoPosition() {
        this.autoPosition = !this.autoPosition;
        const status = this.autoPosition ? 'enabled' : 'disabled';
        console.log(`Auto-positioning ${status}`);
        
        if (window.showNotification) {
            window.showNotification(`Auto-positioning ${status}`, 'info');
        }
    }
    
    // Update canvas dimensions for face detection
    updateCanvasDimensions(width, height) {
        if (this.faceDetection) {
            this.faceDetection.updateCanvasDimensions(width, height);
        }
    }
    
    // Public API methods
    getActiveMask() {
        return this.activeMask;
    }
    
    getAllMasks() {
        return this.masks;
    }
    
    resetMask() {
        const noMask = this.masks.find(m => m.id === 'none');
        if (noMask) {
            this.selectMask(noMask);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing enhanced mask manager...');
    window.maskManager = new MaskManager();
});
