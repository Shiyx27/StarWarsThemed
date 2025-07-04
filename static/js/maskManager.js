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
        
        // Mask type specific scaling factors
        this.maskScaleFactors = {
            'vader-mask': 1.3,      // Larger helmet
            'sith-lord': 1.1,       // Normal face mask
            'storm-trooper': 1.4,   // Large helmet
            'emperor': 1.2,         // Hood with face
            'kylo-ren': 1.25,       // Medium helmet
            'jedi': 1.15            // Simple hood
        };
        
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
            
            this.renderMaskSelector();
            this.bindEvents();
            
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
        this.manualOffsetX = 0;
        this.manualOffsetY = 0;
        
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
    }
    
    applyMaskToCanvas(context, canvas) {
        if (!this.activeMask || !context) return;
        
        const maskImage = this.maskImages.get(this.activeMask.id);
        if (!maskImage) return;
        
        try {
            // Get face detection data
            const faceData = this.faceDetection ? this.faceDetection.getLatestFace() : null;
            
            // Calculate mask position and size
            const maskParams = this.calculateMaskParameters(faceData, canvas, maskImage);
            
            // Apply mask with proper blending
            this.drawMaskOnCanvas(context, maskImage, maskParams);
            
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
            const faceWidth = faceData.width;
            const faceHeight = faceData.height;
            const faceCenterX = faceData.centerX;
            const faceCenterY = faceData.centerY;
            
            // Calculate mask dimensions based on face size
            const maskAspectRatio = maskImage.height / maskImage.width;
            
            // Scale mask relative to face size
            params.width = faceWidth * maskScaleFactor;
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
            params.x = faceCenterX - (params.width / 2);
            params.y = faceCenterY - (params.height / 2);
            
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
        
        // Ensure mask stays within canvas bounds
        params.x = Math.max(0, Math.min(params.x, canvas.width - params.width));
        params.y = Math.max(0, Math.min(params.y, canvas.height - params.height));
        
        return params;
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
        const darkSideLevels = {
            'none': '0%',
            'jedi': '10%',
            'storm-trooper': '30%',
            'kylo-ren': '60%',
            'sith-lord': '80%',
            'emperor': '90%',
            'vader-mask': '100%'
        };
        
        const levelElement = document.getElementById('dark-side-level');
        if (levelElement) {
            const level = darkSideLevels[maskId] || '0%';
            levelElement.textContent = level;
            levelElement.style.color = maskId === 'none' ? '#00ff00' : '#ff0000';
        }
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
