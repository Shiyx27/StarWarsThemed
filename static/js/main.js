// Star Wars Photobooth with Gemini AI JavaScript
class StarWarsPhotobooth {
    constructor() {
        this.currentFilter = 'none';
        this.customFilters = new Map();
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateFilterButtons();
        this.initializeAudioContext();
    }

    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }

        // Custom filter generation
        const generateBtn = document.getElementById('generate-filter-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateCustomFilter();
            });
        }

        // Enter key for custom filter input
        const customInput = document.getElementById('custom-filter-prompt');
        if (customInput) {
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isGenerating) {
                    this.generateCustomFilter();
                }
            });

            // Auto-resize textarea
            customInput.addEventListener('input', (e) => {
                this.autoResizeInput(e.target);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.capturePhoto();
            } else if (e.code === 'KeyG' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('custom-filter-prompt').focus();
            } else if (e.code === 'Escape') {
                this.setFilter('none');
            }
        });

        // Number keys for quick filter selection
        document.addEventListener('keydown', (e) => {
            if (e.code >= 'Digit1' && e.code <= 'Digit9' && !e.target.matches('input, textarea')) {
                const filterIndex = parseInt(e.code.replace('Digit', '')) - 1;
                const filterButtons = document.querySelectorAll('.filter-btn[data-filter]:not([data-filter="none"])');
                if (filterButtons[filterIndex]) {
                    const filterName = filterButtons[filterIndex].dataset.filter;
                    this.setFilter(filterName);
                }
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseEffects();
            } else {
                this.resumeEffects();
            }
        });
    }

    async setFilter(filterName) {
        try {
            // Add loading state to filter button
            const filterBtn = document.querySelector(`[data-filter="${filterName}"]`);
            if (filterBtn) {
                filterBtn.classList.add('loading');
            }

            const response = await fetch(`/set_filter/${filterName}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.currentFilter = filterName;
                this.updateFilterButtons();
                this.updateStatusMessage(this.getFilterMessage(filterName));
                this.playFilterSound(filterName);
                this.triggerFilterAnimation(filterName);
            } else {
                this.showNotification('Failed to apply filter', 'error');
            }
        } catch (error) {
            console.error('Error setting filter:', error);
            this.showNotification('Error applying filter', 'error');
        } finally {
            // Remove loading state
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('loading');
            });
        }
    }

    async generateCustomFilter() {
        const promptInput = document.getElementById('custom-filter-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showNotification('Please enter a filter description', 'error');
            promptInput.focus();
            return;
        }

        if (this.isGenerating) {
            this.showNotification('Already generating a filter, please wait...', 'warning');
            return;
        }

        // Validate prompt length
        if (prompt.length > 200) {
            this.showNotification('Description too long. Please keep it under 200 characters.', 'error');
            return;
        }

        // Show loading state
        this.isGenerating = true;
        this.showGenerationStatus(true);
        
        try {
            const response = await fetch('/generate_custom_filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // Add the new filter to the custom filters section
                this.addCustomFilterButton(data.filter_name, prompt);
                this.showNotification('🎉 Custom filter generated successfully!', 'success');
                promptInput.value = ''; // Clear input
                
                // Automatically apply the new filter
                await this.setFilter(data.filter_name);
                
                // Trigger celebration animation
                this.triggerCelebrationAnimation();
            } else {
                this.showNotification(data.message || 'Failed to generate filter', 'error');
            }
        } catch (error) {
            console.error('Error generating custom filter:', error);
            this.showNotification('Error generating custom filter. Please try again.', 'error');
        } finally {
            this.isGenerating = false;
            this.showGenerationStatus(false);
        }
    }

    addCustomFilterButton(filterName, prompt) {
        const customFiltersSection = document.getElementById('custom-filters-section');
        const customFiltersGrid = document.getElementById('custom-filters-grid');
        
        // Show the custom filters section
        customFiltersSection.style.display = 'block';
        
        // Create new filter button
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-btn custom-filter-btn';
        filterBtn.dataset.filter = filterName;
        filterBtn.innerHTML = `
            <span class="filter-icon">🤖</span>
            <span class="filter-name">${this.truncateText(prompt, 15)}</span>
            <span class="filter-delete" onclick="event.stopPropagation(); starWarsPhotobooth.removeCustomFilter('${filterName}')">×</span>
        `;
        
        // Add click event
        filterBtn.addEventListener('click', () => {
            this.setFilter(filterName);
        });
        
        // Add with animation
        filterBtn.style.opacity = '0';
        filterBtn.style.transform = 'scale(0.8)';
        customFiltersGrid.appendChild(filterBtn);
        
        // Animate in
        setTimeout(() => {
            filterBtn.style.transition = 'all 0.3s ease';
            filterBtn.style.opacity = '1';
            filterBtn.style.transform = 'scale(1)';
        }, 100);
        
        this.customFilters.set(filterName, prompt);
    }

    removeCustomFilter(filterName) {
        const filterBtn = document.querySelector(`[data-filter="${filterName}"]`);
        if (filterBtn) {
            filterBtn.style.transition = 'all 0.3s ease';
            filterBtn.style.opacity = '0';
            filterBtn.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                filterBtn.remove();
                this.customFilters.delete(filterName);
                
                // Hide section if no custom filters
                const customFiltersGrid = document.getElementById('custom-filters-grid');
                if (customFiltersGrid.children.length === 0) {
                    document.getElementById('custom-filters-section').style.display = 'none';
                }
                
                // Switch to no filter if current filter was deleted
                if (this.currentFilter === filterName) {
                    this.setFilter('none');
                }
            }, 300);
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    }

    showGenerationStatus(show) {
        const statusElement = document.getElementById('generation-status');
        const generateBtn = document.getElementById('generate-filter-btn');
        
        if (show) {
            statusElement.classList.remove('hidden');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '⏳ Generating...';
            generateBtn.classList.add('generating');
        } else {
            statusElement.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '🤖 Generate with AI';
            generateBtn.classList.remove('generating');
        }
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === this.currentFilter) {
                btn.classList.add('active');
            }
        });
    }

    updateStatusMessage(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
            
            // Add typing animation
            statusElement.style.animation = 'none';
            setTimeout(() => {
                statusElement.style.animation = 'typewriter 0.5s ease-in-out';
            }, 10);
        }
    }

    getFilterMessage(filterName) {
        const messages = {
            'none': 'Choose a filter and strike a pose!',
            'vader': 'You have joined the Dark Side... 🖤',
            'stormtrooper': 'Ready for battle, trooper! ⚪',
            'yoda': 'Strong with the Force, you are. 💚',
            'lightsaber': 'Your weapon, you must choose. ⚔️',
            'sith': 'Feel the power of the Dark Side! 🔴',
            'jedi': 'May the Force be with you! 🔵',
            'hologram': 'Help me, Obi-Wan Kenobi... 📡',
            'force_lightning': 'Unlimited power! ⚡',
            'death_star': 'That\'s no moon... 🌑'
        };
        
        if (this.customFilters.has(filterName)) {
            return `Custom filter: ${this.customFilters.get(filterName)} 🤖`;
        }
        
        return messages[filterName] || 'Filter applied! ✨';
    }

    async capturePhoto() {
        const captureBtn = document.getElementById('capture-btn');
        const originalText = captureBtn.innerHTML;
        
        // Disable button and show loading
        captureBtn.disabled = true;
        captureBtn.innerHTML = '📸 Capturing...';
        captureBtn.classList.add('capturing');

        try {
            const response = await fetch('/capture');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification(`📸 Photo captured! Saved as ${data.filename}`, 'success');
                this.playShutterSound();
                this.flashEffect();
                this.updateCaptureCount();
            } else {
                this.showNotification('Failed to capture photo', 'error');
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
            this.showNotification('Error capturing photo', 'error');
        } finally {
            // Re-enable button
            setTimeout(() => {
                captureBtn.disabled = false;
                captureBtn.innerHTML = originalText;
                captureBtn.classList.remove('capturing');
            }, 1000);
        }
    }

    updateCaptureCount() {
        const count = parseInt(localStorage.getItem('captureCount') || '0') + 1;
        localStorage.setItem('captureCount', count.toString());
        
        // Show milestone notifications
        if (count === 1) {
            setTimeout(() => {
                this.showNotification('🎉 First photo captured! Welcome to the galaxy!', 'success');
            }, 2000);
        } else if (count % 10 === 0) {
            setTimeout(() => {
                this.showNotification(`🌟 ${count} photos captured! You're becoming a Jedi Master!`, 'success');
            }, 2000);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (notification && notificationText) {
            notificationText.innerHTML = message;
            notification.className = `notification ${type}`;
            
            // Show notification with animation
            setTimeout(() => {
                notification.classList.remove('hidden');
            }, 100);
            
            // Auto-hide after duration based on message length
            const duration = Math.max(3000, message.length * 50);
            setTimeout(() => {
                notification.classList.add('hidden');
            }, duration);
        }
    }

    flashEffect() {
        // Create flash overlay
        const flash = document.createElement('div');
        flash.className = 'camera-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            animation: flash 0.3s ease-out;
        `;
        
        document.body.appendChild(flash);
        
        // Remove flash after animation
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    }

    triggerFilterAnimation(filterName) {
        const videoStream = document.getElementById('video-stream');
        if (videoStream) {
            videoStream.style.animation = 'none';
            setTimeout(() => {
                videoStream.style.animation = 'filterApply 0.5s ease-in-out';
            }, 10);
        }
    }

    triggerCelebrationAnimation() {
        // Create celebration particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createCelebrationParticle();
            }, i * 100);
        }
    }

    createCelebrationParticle() {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.innerHTML = ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)];
        particle.style.cssText = `
            position: fixed;
            font-size: 20px;
            pointer-events: none;
            z-index: 9999;
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight}px;
            animation: celebrate 2s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 2000);
    }

    initializeAudioContext() {
        // Initialize audio context for sound effects
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
        }
    }

    playFilterSound(filterName) {
        // Play different sounds for different filters
        const soundMap = {
            'vader': this.playDarthVaderSound,
            'lightsaber': this.playLightsaberSound,
            'force_lightning': this.playForceSound,
            'hologram': this.playHologramSound
        };

        if (soundMap[filterName]) {
            soundMap[filterName].call(this);
        } else {
            this.playGenericFilterSound();
        }
    }

    playShutterSound() {
        this.playBeepSound(800, 0.1, 'sine');
    }

    playDarthVaderSound() {
        // Play breathing sound effect
        this.playBeepSound(150, 0.3, 'sawtooth');
    }

    playLightsaberSound() {
        // Play lightsaber ignition sound
        this.playBeepSound(400, 0.2, 'square');
        setTimeout(() => this.playBeepSound(600, 0.1, 'sine'), 100);
    }

    playForceSound() {
        // Play force lightning sound
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playBeepSound(Math.random() * 400 + 200, 0.05, 'sawtooth');
            }, i * 50);
        }
    }

    playHologramSound() {
        // Play hologram sound
        this.playBeepSound(1000, 0.1, 'sine');
        setTimeout(() => this.playBeepSound(800, 0.1, 'sine'), 200);
    }

    playGenericFilterSound() {
        this.playBeepSound(600, 0.1, 'sine');
    }

    playBeepSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    handleWindowResize() {
        // Adjust layout on window resize
        const mainContent = document.querySelector('.main-content');
        if (window.innerWidth <= 768) {
            mainContent.style.gridTemplateColumns = '1fr';
        } else {
            mainContent.style.gridTemplateColumns = '2fr 1fr';
        }
    }

    pauseEffects() {
        // Pause animations when tab is not visible
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.animationPlayState = 'paused';
        });
    }

    resumeEffects() {
        // Resume animations when tab becomes visible
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.animationPlayState = 'running';
        });
    }

    // Utility method to check if device has camera
    async checkCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera access denied:', error);
            this.showNotification('Camera access is required for the photobooth to work', 'error');
            return false;
        }
    }

    // Initialize tooltips
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
}

// Initialize the photobooth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.starWarsPhotobooth = new StarWarsPhotobooth();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    @keyframes filterApply {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.02); filter: brightness(1.2); }
        100% { transform: scale(1); filter: brightness(1); }
    }
    
    @keyframes celebrate {
        0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 1; 
        }
        100% { 
            transform: translateY(-200px) rotate(360deg); 
            opacity: 0; 
        }
    }
    
    @keyframes typewriter {
        0% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .filter-btn.loading {
        opacity: 0.6;
        pointer-events: none;
    }
    
    .btn.capturing {
        animation: pulse 1s infinite;
    }
    
    .btn.generating {
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .custom-filter-btn {
        position: relative;
    }
    
    .filter-delete {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .custom-filter-btn:hover .filter-delete {
        opacity: 1;
    }
    
    .tooltip {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
