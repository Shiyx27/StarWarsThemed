/**
 * Main Application Logic - Updated for Mask System
 */

class PhotoboothApp {
    constructor() {
        this.isInitialized = false;
        this.loadingScreen = null;
        // Store previously active mask to allow restore after removal
        this._previousMaskId = null;
        
        // Konami Code Easter Egg
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        this.konamiIndex = 0;
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize components in order
            await this.initializeCore();
            await this.initializeCamera();
            await this.initializeMasks();
            await this.initializeAudio();
            await this.finalizeSetup();
            
            this.isInitialized = true;
            this.hideLoadingScreen();
            
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 500);
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorMessage('Failed to initialize application');
            this.hideLoadingScreen();
        }
    }
    
    async initializeCore() {
        this.setupCoreEventListeners();
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async initializeCamera() {
        try {
            if (window.cameraManager) {
                await window.cameraManager.initialize();
            }
        } catch (error) {
            console.warn('Camera initialization failed:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    async initializeMasks() {
        try {
            if (window.maskManager) {
                await window.maskManager.initialize();
            }
        } catch (error) {
            console.warn('Mask system initialization failed:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    async initializeAudio() {
        if (window.audioManager) {
            window.audioManager.initializeAudio();
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    async finalizeSetup() {
        this.setupUI();
        this.enableControls();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setupCoreEventListeners() {
        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', this.handleCapture.bind(this));
        }
        
        // Gallery button
        const galleryBtn = document.getElementById('gallery-btn');
        if (galleryBtn) {
            galleryBtn.addEventListener('click', this.showGallery.bind(this));
        }

        // Remove Mask / Toggle Mask button (now acts as Remove/Restore)
    const maskToggle = document.getElementById('mask-toggle');
        if (maskToggle) {
            // Ensure accessible attributes
            maskToggle.setAttribute('role', 'button');
            maskToggle.setAttribute('aria-pressed', 'false');

            maskToggle.addEventListener('click', (e) => {
                if (!window.maskManager) {
                    this.showNotification('No mask system available', 'warn');
                    return;
                }

                const active = window.maskManager.getActiveMask();

                if (active) {
                    // Confirm removal to avoid accidental clicks
                    if (!confirm('Remove current mask?')) return;
                    try { this._previousMaskId = active.id; } catch (e) { this._previousMaskId = null; }
                    // Prefer animated removal if available
                    if (typeof window.maskManager.removeMaskWithFade === 'function') {
                        window.maskManager.removeMaskWithFade(300);
                    } else if (typeof window.maskManager.resetMask === 'function') {
                        window.maskManager.resetMask();
                    }
                    this.showNotification('Mask removed', 'success');
                    maskToggle.setAttribute('aria-pressed', 'true');
                    maskToggle.querySelector('span') && (maskToggle.querySelector('span').textContent = 'Restore Mask');
                } else {
                    // Restore previous mask if any
                    if (this._previousMaskId) {
                        if (typeof window.maskManager.restoreMaskWithFade === 'function') {
                            window.maskManager.restoreMaskWithFade(this._previousMaskId, 300);
                        } else {
                            const all = window.maskManager.getAllMasks();
                            const prev = all.find(m => m.id === this._previousMaskId);
                            if (prev) window.maskManager.selectMask(prev);
                        }
                        this.showNotification('Mask restored', 'success');
                        maskToggle.setAttribute('aria-pressed', 'false');
                        maskToggle.querySelector('span') && (maskToggle.querySelector('span').textContent = 'Remove Mask');
                        this._previousMaskId = null;
                    } else {
                        this.showNotification('No mask to restore', 'warn');
                    }
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Konami Code Easter Egg
        document.addEventListener('keydown', this.handleKonamiCode.bind(this));
        
        // Visibility change handling
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    setupUI() {
        // Setup responsive handlers
        this.setupResponsiveHandlers();
        
        // Setup intersection observer for lazy loading
        this.setupIntersectionObserver();
    }
    
    setupResponsiveHandlers() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.cameraManager) {
                    window.cameraManager.setupCanvas();
                }
            }, 250);
        });
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.cameraManager) {
                    window.cameraManager.setupCanvas();
                }
            }, 100);
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }
    
    enableControls() {
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn && window.cameraManager && window.cameraManager.isInitialized) {
            captureBtn.disabled = false;
        }
    }
    
    async handleCapture() {
        // Improved capture UX: countdown + shutter + saving animation
        if (!window.cameraManager) {
            this.showErrorMessage('Camera not available');
            return;
        }

        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) captureBtn.disabled = true;

        // Show countdown overlay
        await this.showCaptureCountdown(3);

        try {
            // Take photo
            if (window.audioManager && typeof window.audioManager.playCaptureSound === 'function') {
                window.audioManager.playCaptureSound();
            }

            const imageData = window.cameraManager.capturePhoto();
            if (!imageData) throw new Error('Failed to capture image');

            const activeMask = window.maskManager ? window.maskManager.getActiveMask() : null;

            // Small flash animation on capture
            this.flashCapture();

            // Save photo and refresh gallery
            await this.savePhoto(imageData, activeMask);
            this.showSuccessMessage('Photo captured with mask overlay!');

        } catch (error) {
            console.error('Capture error:', error);
            this.showErrorMessage('Failed to capture photo');
        } finally {
            if (captureBtn) captureBtn.disabled = false;
        }
    }

    showCaptureCountdown(seconds = 3) {
        return new Promise((resolve) => {
            const overlayId = 'capture-countdown-overlay';
            let overlay = document.getElementById(overlayId);
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.style.position = 'absolute';
                overlay.style.left = '50%';
                overlay.style.top = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.zIndex = '99999';
                overlay.style.color = '#fff';
                overlay.style.fontSize = '72px';
                overlay.style.fontWeight = '900';
                overlay.style.textShadow = '0 0 20px rgba(255,0,0,0.8)';
                overlay.style.pointerEvents = 'none';
                document.body.appendChild(overlay);
            }

            let count = seconds;
            overlay.textContent = count;

            const tick = () => {
                if (count <= 0) {
                    overlay.remove();
                    resolve();
                    return;
                }
                overlay.textContent = count;
                count -= 1;
                setTimeout(tick, 700);
            };

            tick();
        });
    }

    flashCapture() {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = 0;
        flash.style.left = 0;
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'rgba(255,255,255,0.9)';
        flash.style.zIndex = 100000;
        flash.style.opacity = '0.0';
        flash.style.transition = 'opacity 200ms ease-out';
        document.body.appendChild(flash);
        // trigger
        requestAnimationFrame(() => { flash.style.opacity = '1';
            setTimeout(() => { flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 220);
            }, 120);
        });
    }
    
    async savePhoto(imageData, mask) {
        try {
            const response = await fetch('/api/capture-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    mask: mask ? mask.id : 'none'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save photo');
            }
            
            const result = await response.json();
            console.log('Photo saved:', result.filename);
            // Refresh gallery so the new photo is visible
            try {
                await this.showGallery();
            } catch (err) {
                console.warn('Could not refresh gallery immediately:', err);
            }
            // Show quick thumbnail preview
            this.showCaptureThumbnail(imageData);
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    }

    showCaptureThumbnail(dataUrl) {
        const id = 'capture-thumb';
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.style.position = 'fixed';
            el.style.left = '16px';
            el.style.bottom = '16px';
            el.style.width = '140px';
            el.style.height = '100px';
            el.style.border = '2px solid rgba(255,0,0,0.6)';
            el.style.borderRadius = '6px';
            el.style.overflow = 'hidden';
            el.style.zIndex = '200000';
            el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)';
            el.style.background = '#000';
            document.body.appendChild(el);
        }
        el.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block"/>`;
        el.style.opacity = '1';
        // auto-hide after 4 seconds
        setTimeout(() => {
            el.style.transition = 'opacity 500ms ease';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 600);
        }, 4000);
    }
    
    async showGallery() {
        try {
            const response = await fetch('/api/gallery');
            if (!response.ok) {
                throw new Error('Failed to load gallery');
            }
            
            const photos = await response.json();
            this.renderGallery(photos);
            
        } catch (error) {
            console.error('Gallery error:', error);
            this.showErrorMessage('Failed to load gallery');
        }
    }
    
    renderGallery(photos) {
        const galleryGrid = document.getElementById('gallery-grid');
        const galleryModal = document.getElementById('gallery-modal');
        
        if (!galleryGrid || !galleryModal) return;
        
        galleryGrid.innerHTML = '';
        
        if (photos.length === 0) {
            galleryGrid.innerHTML = '<p class="empty-gallery">No photos yet. Start capturing with masks!</p>';
        } else {
            photos.forEach(photo => {
                const photoElement = this.createGalleryItem(photo);
                galleryGrid.appendChild(photoElement);
            });
        }
        
        galleryModal.classList.add('open');
    }
    
    createGalleryItem(photo) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Set src directly so images appear immediately when gallery opens
        item.innerHTML = `
            <img src="${photo.url}" alt="Sith Photo with Mask" loading="lazy">
            <div class="gallery-overlay">
                <div class="gallery-actions">
                    <button class="btn btn--small" onclick="downloadPhoto('${photo.filename}')">
                        Download
                    </button>
                    <button class="btn btn--small btn--danger" onclick="window.photoboothApp.deletePhoto('${photo.filename}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
        
        return item;
    }

    async deletePhoto(filename) {
        try {
            const res = await fetch(`/api/delete-photo/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Delete failed');
            }
            this.showSuccessMessage('Photo deleted');
            // Refresh gallery
            await this.showGallery();
        } catch (err) {
            console.error('Delete photo error:', err);
            this.showErrorMessage('Failed to delete photo');
        }
    }
    
    toggleAudioPanel() {
        const audioControls = document.getElementById('audio-controls');
        if (audioControls) {
            audioControls.classList.toggle('open');
        }
    }
    
    handleKeyboard(event) {
        switch(event.key) {
            case ' ':
            case 'Enter':
                if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'BUTTON') {
                    event.preventDefault();
                    this.handleCapture();
                }
                break;
            case 'Escape':
                this.closeAllModals();
                break;
            case 'm':
            case 'M':
                if (window.maskManager) {
                    window.maskManager.toggleAutoPosition();
                }
                break;
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            if (window.audioManager) {
                window.audioManager.stopBackgroundMusic();
            }
        } else {
            if (window.audioManager && !window.audioManager.isMuted) {
                window.audioManager.startBackgroundMusic();
            }
        }
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('open'));
    }
    
    // Loading screen management
    showLoadingScreen() {
        this.loadingScreen = document.getElementById('loading-screen');
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('active');
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('active');
        }
    }
    
    // Notification methods
    showWelcomeMessage() {
        this.showNotification('Welcome to the Sith Photobooth! Choose a mask and embrace the dark side!', 'success');
    }
    
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    handleKonamiCode(e) {
        const expectedKey = this.konamiCode[this.konamiIndex];
        const keyPressed = e.code || e.key;
        
        if (keyPressed === expectedKey) {
            this.konamiIndex++;
            if (this.konamiIndex === this.konamiCode.length) {
                this.activateEasterEgg();
                this.konamiIndex = 0;
            }
        } else {
            this.konamiIndex = 0;
        }
    }

    activateEasterEgg() {
        console.log('Konami Code Activated!');
        if (window.showNotification) {
            window.showNotification('Meesa think yousa found a secret!', 'special');
        }
        if (window.audioManager) {
            // This sound will be added later
            window.audioManager.playSound('jar-jar');
        }
        // Logic to add and select a secret Jar Jar Binks mask
        if (window.maskManager) {
            const jarJarMask = {
                id: 'jar-jar-binks',
                name: 'Jar Jar Binks',
                image: '/static/masks/jar-jar-binks.png',
                icon: '🤪',
                description: 'Meesa your humble servant!'
            };
            // Avoid adding it multiple times
            if (!window.maskManager.masks.find(m => m.id === 'jar-jar-binks')) {
                window.maskManager.masks.push(jarJarMask);
                window.maskManager.loadMaskImage(jarJarMask).then(() => {
                    window.maskManager.renderMaskSelector();
                    window.maskManager.selectMask(jarJarMask);
                });
            } else {
                window.maskManager.selectMask(window.maskManager.masks.find(m => m.id === 'jar-jar-binks'));
            }
        }
    }
}

// Global functions
window.showNotification = function(message, type = 'info') {
    if (window.photoboothApp) {
        window.photoboothApp.showNotification(message, type);
    }
};

window.closeGallery = function() {
    const galleryModal = document.getElementById('gallery-modal');
    if (galleryModal) {
        galleryModal.classList.remove('open');
    }
};

window.downloadPhoto = function(filename) {
    window.open(`/api/download/${filename}`, '_blank');
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.photoboothApp = new PhotoboothApp();
});
