/**
 * Filter Manager for Star Wars Photobooth
 * Handles filter selection, application, and Gemini API integration
 */

class FilterManager {
    constructor() {
        this.filters = [];
        this.activeFilter = null;
        this.isProcessing = false;
        this.filterGrid = null;
        this.geminiApiUrl = '/api/apply-filter';
        
        this.initializeFilters();
        this.bindEvents();
    }
    
    async initializeFilters() {
        try {
            // Load filters from API
            const response = await fetch('/api/filters');
            if (response.ok) {
                this.filters = await response.json();
                this.renderFilters();
            } else {
                throw new Error('Failed to load filters');
            }
        } catch (error) {
            console.error('Error loading filters:', error);
            this.loadDefaultFilters();
        }
    }
    
    loadDefaultFilters() {
        // Fallback filters if API fails
        this.filters = [
            {
                id: 'none',
                name: 'No Filter',
                prompt: '',
                icon: '🚫',
                description: 'Original image without any filters'
            },
            {
                id: 'sith-lord',
                name: 'Sith Lord',
                prompt: 'Transform me into a Sith Lord with pale skin, yellow eyes, and dark hood',
                icon: '⚔️',
                description: 'Embrace the dark side with full Sith transformation'
            },
            {
                id: 'vader-mask',
                name: 'Darth Vader',
                prompt: 'Add Darth Vader\'s iconic black mask and helmet to my face',
                icon: '🎭',
                description: 'Become the Dark Lord of the Sith'
            },
            {
                id: 'sith-eyes',
                name: 'Sith Eyes',
                prompt: 'Give me glowing red Sith eyes with dark energy emanating',
                icon: '👁️',
                description: 'Channel your hatred through burning Sith eyes'
            },
            {
                id: 'dark-corruption',
                name: 'Dark Corruption',
                prompt: 'Apply dark side corruption with pale skin and dark veins',
                icon: '⚡',
                description: 'Show the toll of unlimited power'
            },
            {
                id: 'imperial-officer',
                name: 'Imperial Officer',
                prompt: 'Add Imperial officer uniform with rank insignia and cap',
                icon: '🎖️',
                description: 'Command the Imperial fleet'
            }
        ];
        
        this.renderFilters();
    }
    
    renderFilters() {
        this.filterGrid = document.getElementById('filter-grid');
        if (!this.filterGrid) return;
        
        this.filterGrid.innerHTML = '';
        
        this.filters.forEach(filter => {
            const filterCard = this.createFilterCard(filter);
            this.filterGrid.appendChild(filterCard);
        });
        
        // Select default filter (none)
        const noneFilter = this.filters.find(f => f.id === 'none');
        if (noneFilter) {
            this.selectFilter(noneFilter);
        }
    }
    
    createFilterCard(filter) {
        const card = document.createElement('div');
        card.className = 'filter-card';
        card.setAttribute('data-filter-id', filter.id);
        
        card.innerHTML = `
            <div class="filter-icon">${filter.icon}</div>
            <div class="filter-name">${filter.name}</div>
            <div class="filter-description">${filter.description}</div>
            <div class="filter-loading" style="display: none;">
                <div class="loading-spinner"></div>
                <span>Processing...</span>
            </div>
        `;
        
        // Add click handler
        card.addEventListener('click', () => {
            this.selectFilter(filter);
        });
        
        return card;
    }
    
    bindEvents() {
        // Filter toggle button
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                this.toggleFilter();
            });
        }
    }
    
    selectFilter(filter) {
        // Remove active class from all cards
        const cards = document.querySelectorAll('.filter-card');
        cards.forEach(card => card.classList.remove('active'));
        
        // Add active class to selected card
        const selectedCard = document.querySelector(`[data-filter-id="${filter.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        
        // Set active filter
        this.activeFilter = filter;
        
        // Apply filter to camera
        this.applyFilterToCamera(filter);
        
        // Update UI
        this.updateFilterToggleButton(filter);
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('force-push');
        }
        
        // Show notification
        if (window.showNotification) {
            window.showNotification(
                filter.id === 'none' ? 'Filter removed' : `${filter.name} applied`,
                'success'
            );
        }
    }
    
    applyFilterToCamera(filter) {
        if (!window.cameraManager) return;
        
        if (filter.id === 'none') {
            window.cameraManager.removeFilter();
        } else {
            window.cameraManager.applyFilter(filter.id);
        }
    }
    
    async processImageWithGemini(imageData, filter) {
        if (!filter || filter.id === 'none' || !filter.prompt) {
            return { success: true, processed_image: imageData };
        }
        
        try {
            this.setProcessingState(true);
            
            const response = await fetch(this.geminiApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    prompt: filter.prompt,
                    filter_id: filter.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Gemini API error:', error);
            
            // Show user-friendly error
            if (window.showNotification) {
                window.showNotification(
                    'AI processing failed. Using basic filter.',
                    'error'
                );
            }
            
            // Return original image as fallback
            return { success: false, processed_image: imageData };
            
        } finally {
            this.setProcessingState(false);
        }
    }
    
    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        
        // Update filter cards
        const activeCard = document.querySelector('.filter-card.active');
        if (activeCard) {
            const loadingElement = activeCard.querySelector('.filter-loading');
            if (loadingElement) {
                loadingElement.style.display = isProcessing ? 'block' : 'none';
            }
        }
        
        // Update capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.disabled = isProcessing;
            if (isProcessing) {
                captureBtn.innerHTML = `
                    <div class="loading-spinner"></div>
                    <span>Processing...</span>
                `;
            } else {
                captureBtn.innerHTML = `
                    <span class="lightsaber-icon">🗡️</span>
                    <span class="btn-text">Capture the Dark Side</span>
                    <div class="lightsaber-glow"></div>
                `;
            }
        }
    }
    
    updateFilterToggleButton(filter) {
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            const buttonText = filterToggle.querySelector('span');
            if (buttonText) {
                buttonText.textContent = filter.id === 'none' ? 'Apply Filter' : 'Remove Filter';
            }
        }
    }
    
    toggleFilter() {
        if (!this.activeFilter || this.activeFilter.id === 'none') {
            // Apply first available filter
            const firstFilter = this.filters.find(f => f.id !== 'none');
            if (firstFilter) {
                this.selectFilter(firstFilter);
            }
        } else {
            // Remove current filter
            const noneFilter = this.filters.find(f => f.id === 'none');
            if (noneFilter) {
                this.selectFilter(noneFilter);
            }
        }
    }
    
    // Get current filter info
    getActiveFilter() {
        return this.activeFilter;
    }
    
    // Get all available filters
    getAllFilters() {
        return this.filters;
    }
    
    // Reset to no filter
    resetFilter() {
        const noneFilter = this.filters.find(f => f.id === 'none');
        if (noneFilter) {
            this.selectFilter(noneFilter);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.filterManager = new FilterManager();
});
