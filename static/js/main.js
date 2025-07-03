/**
 * Optimized Main Application Logic
 * Performance-focused initialization and event handling
 */

class PhotoboothApp {
    constructor() {
        this.isInitialized = false;
        this.loadingScreen = null;
        this.loadingSteps = [
            { name: 'Initializing core systems', duration: 300 },
            { name: 'Starting camera', duration: 800 },
            { name: 'Loading filters', duration: 400 },
            { name: 'Preparing audio', duration: 200 },
            { name: 'Finalizing setup', duration: 200 }
        ];
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize in optimized order
            await this.initializeCore();
            await this.initializeCamera();
            await this.initializeFilters();
            await this.initializeAudio();
            await this.finalizeSetup();
            
            this.isInitialized = true;
            this.hideLoadingScreen();
            
            // Show welcome message
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
        await this.updateLoadingProgress(0);
        
        // Setup critical event listeners
        this.setupCoreEventListeners();
        
        // Preload critical resources
        await this.preloadCriticalResources();
    }
    
    async initializeCamera() {
        await this.updateLoadingProgress(1);
        
        // Initialize camera with timeout
        try {
            if (window.cameraManager) {
                await Promise.race([
                    window.cameraManager.initialize(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Camera timeout')), 8000)
                    )
                ]);
            }
        } catch (error) {
            console.warn('Camera initialization failed:', error);
            // Continue without camera
        }
    }
    
    async initializeFilters() {
        await this.updateLoadingProgress(2);
        
        // Filters load in background
        if (window.filterManager) {
            // Don't await - let it load asynchronously
            window.filterManager.initializeFilters();
        }
    }
    
    async initializeAudio() {
        await this.updateLoadingProgress(3);
        
        // Audio loads in background
        if (window.audioManager) {
            // Don't await - audio is not critical
            window.audioManager.initializeAudio();
        }
    }
    
    async finalizeSetup() {
        await this.updateLoadingProgress(4);
        
        // Final UI setup
        this.setupUI();
        this.enableControls();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    async preloadCriticalResources() {
        // Only preload absolutely critical resources
        const criticalPromises = [];
        
        // Preload font
        if ('fonts' in document) {
            criticalPromises.push(
                document.fonts.load('1rem Orbitron').catch(() => {})
            );
        }
        
        // Don't preload images or audio - let them load as needed
        await Promise.all(criticalPromises);
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
        // Lazy load gallery images
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
        
        // Observe gallery images
        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }
    
    enableControls() {
        // Enable capture button when camera is ready
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
            
            // Play capture sound immediately
            if (window.audioManager) {
                window.audioManager.playCaptureSound();
            }
            
            // Capture image
            const imageData = window.cameraManager.capturePhoto();
            if (!imageData) {
                throw new Error('Failed to capture image');
            }
            
            // Get active filter
            const activeFilter = window.filterManager ? 
                window.filterManager.getActiveFilter() : null;
            
            // Process with AI if needed (async)
            let processedImage = imageData;
            if (activeFilter && activeFilter.id !== 'none' && window.filterManager) {
                // Show processing notification
                this.showNotification('Processing with AI...', 'info');
                
                const result = await window.filterManager.processImageWithGemini(imageData, activeFilter);
                if (result.success && result.processed_image) {
                    processedImage = result.processed_image;
                }
            }
            
            // Save the photo
            await this.savePhoto(processedImage, activeFilter);
            
            // Show success message
            this.showSuccessMessage('Photo captured successfully!');
            
        } catch (error) {
            console.error('Capture error:', error);
            this.showErrorMessage('Failed to capture photo');
        }
    }
    
    async savePhoto(imageData, filter) {
        try {
            const response = await fetch('/api/capture-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    filter: filter ? filter.id : 'none'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save photo');
            }
            
            const result = await response.json();
            console.log('Photo saved:', result.filename);
            
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
            galleryGrid.innerHTML = '<p class="empty-gallery">No photos yet. Start capturing the dark side!</p>';
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
        
        item.innerHTML = `
            <img data-src="${photo.url}" alt="Sith Photo" loading="lazy">
            <div class="gallery-overlay">
                <div class="gallery-actions">
                    <button class="btn btn--small" onclick="downloadPhoto('${photo.filename}')">
                        Download
                    </button>
                </div>
            </div>
        `;
        
        return item;
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
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause resources when hidden
            if (window.audioManager) {
                window.audioManager.stopBackgroundMusic();
            }
        } else {
            // Resume when visible
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
    
    async updateLoadingProgress(stepIndex) {
        const step = this.loadingSteps[stepIndex];
        if (!step) return;
        
        const loadingText = document.querySelector('.loading-text');
        const loadingSubtitle = document.querySelector('.loading-subtitle');
        const loadingProgress = document.querySelector('.loading-progress');
        
        if (loadingText) loadingText.textContent = step.name;
        if (loadingSubtitle) loadingSubtitle.textContent = `Step ${stepIndex + 1} of ${this.loadingSteps.length}`;
        
        // Update progress bar
        if (loadingProgress) {
            const progress = ((stepIndex + 1) / this.loadingSteps.length) * 100;
            loadingProgress.style.width = `${progress}%`;
        }
        
        // Wait for step duration
        await new Promise(resolve => setTimeout(resolve, step.duration));
    }
    
    // Notification methods
    showWelcomeMessage() {
        this.showNotification('Welcome to the Dark Side!', 'success');
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
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
