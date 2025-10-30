/**
 * Main Application Logic - Updated for Mask System
 */

class PhotoboothApp {
    constructor() {
        this.isInitialized = false;
        this.loadingScreen = null;
        // Store previously active mask to allow restore after removal
        this._previousMaskId = null;
        
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
                    // Store previous mask id so we can restore it
                    try { this._previousMaskId = active.id; } catch (e) { this._previousMaskId = null; }
                    // Reset to no mask
                    if (typeof window.maskManager.resetMask === 'function') {
                        window.maskManager.resetMask();
                        this.showNotification('Mask removed', 'success');
                        maskToggle.setAttribute('aria-pressed', 'true');
                        // Update label to indicate restore action
                        maskToggle.querySelector('span') && (maskToggle.querySelector('span').textContent = 'Restore Mask');
                    }
                } else {
                    // No active mask – attempt to restore previous mask
                    if (this._previousMaskId) {
                        const all = window.maskManager.getAllMasks();
                        const prev = all.find(m => m.id === this._previousMaskId);
                        if (prev) {
                            window.maskManager.selectMask(prev);
                            this.showNotification('Mask restored', 'success');
                            maskToggle.setAttribute('aria-pressed', 'false');
                            maskToggle.querySelector('span') && (maskToggle.querySelector('span').textContent = 'Remove Mask');
                            // Clear previous so subsequent remove stores again
                            this._previousMaskId = null;
                        } else {
                            this.showNotification('No previous mask to restore', 'warn');
                        }
                    } else {
                        this.showNotification('No mask to restore', 'warn');
                    }
                }
            });
        }
        
        // Audio toggle
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', this.toggleAudioPanel.bind(this));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
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
        try {
            if (!window.cameraManager) {
                throw new Error('Camera not available');
            }
            
            // Play capture sound
            if (window.audioManager) {
                // Use the robust helper which matches AudioManager keys
                if (typeof window.audioManager.playCaptureSound === 'function') {
                    window.audioManager.playCaptureSound();
                } else {
                    window.audioManager.playSound('capture-sound');
                }
            }
            
            // Capture image with mask overlay
            const imageData = window.cameraManager.capturePhoto();
            if (!imageData) {
                throw new Error('Failed to capture image');
            }
            
            // Get active mask info
            const activeMask = window.maskManager ? 
                window.maskManager.getActiveMask() : null;
            
            // Save the photo
            await this.savePhoto(imageData, activeMask);
            
            // Show success message
            this.showSuccessMessage('Photo captured with mask overlay!');
            
        } catch (error) {
            console.error('Capture error:', error);
            this.showErrorMessage('Failed to capture photo');
        }
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
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
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
